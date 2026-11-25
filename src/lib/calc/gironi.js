const LETTERE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Sorteggio casuale bilanciato: { [squadraId]: lettera girone }. */
export function sorteggiaGironi(squadre, nGironi, rand = Math.random) {
  const mescolate = [...squadre]
  for (let i = mescolate.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[mescolate[i], mescolate[j]] = [mescolate[j], mescolate[i]]
  }
  return Object.fromEntries(mescolate.map((s, i) => [s.id, LETTERE[i % nGironi]]))
}

/** Girone all'italiana (metodo del cerchio): giornate di coppie [casaId, ospiteId]. */
export function giornateGirone(ids) {
  const giro = ids.length % 2 ? [...ids, null] : [...ids]
  const n = giro.length
  const giornate = []
  for (let r = 0; r < n - 1; r++) {
    const giornata = []
    for (let i = 0; i < n / 2; i++) {
      const [a, b] = [giro[i], giro[n - 1 - i]]
      if (a === null || b === null) continue // riposo
      giornata.push(r % 2 ? [b, a] : [a, b])
    }
    giornate.push(giornata)
    giro.splice(1, 0, giro.pop()) // la prima resta ferma, le altre ruotano
  }
  return giornate
}

/** Tutte le partite dei gironi: giornata 1 di ogni girone, poi giornata 2, ... */
export function ordinePartite(squadre) {
  const perGirone = Object.groupBy(squadre, (s) => s.girone)
  const gironi = Object.keys(perGirone).sort()
  const giornate = Object.fromEntries(gironi.map((g) => [g, giornateGirone(perGirone[g].map((s) => s.id))]))
  const max = Math.max(0, ...gironi.map((g) => giornate[g].length))
  const out = []
  for (let k = 0; k < max; k++)
    for (const g of gironi)
      for (const [casaId, ospiteId] of giornate[g][k] ?? []) out.push({ girone: g, giornata: k + 1, casaId, ospiteId })
  return out
}

/**
 * Assegna data e ora: riempie le serate in ordine, al massimo perSerata partite,
 * solo nei giorni della settimana indicati, e nessuna squadra gioca due volte la stessa sera.
 */
export function programma(lista, { inizio, ora, minuti, perSerata, giorni }) {
  if (!giorni?.length) throw new Error('Scegli almeno un giorno della settimana.')
  if (!(perSerata >= 1)) throw new Error('Partite per serata non valide.')
  const [a, m, g] = inizio.split('-').map(Number)
  const [hh, mm] = ora.split(':').map(Number)
  // shortcut: ora locale del browser (staff in Italia); per un fuso esplicito convertire con Europe/Rome.
  const giorno = new Date(a, m - 1, g)
  const prossimaSerata = () => { do giorno.setDate(giorno.getDate() + 1); while (!giorni.includes(giorno.getDay())) }
  if (!giorni.includes(giorno.getDay())) prossimaSerata()

  let k = 0
  let inCampo = new Set()
  return lista.map((p) => {
    if (k >= perSerata || inCampo.has(p.casaId) || inCampo.has(p.ospiteId)) {
      prossimaSerata()
      k = 0
      inCampo = new Set()
    }
    const dataOra = new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDate(), hh, mm + k * minuti)
    k++
    inCampo.add(p.casaId).add(p.ospiteId)
    return { ...p, dataOra }
  })
}

/** true se una partita di girone è già iniziata: rigenerare cancellerebbe dei risultati. */
export function generazioneBloccata(partite) {
  return partite.some((p) => p.fase === 'girone' && ((p.eventi?.length ?? 0) > 0 || p.stato !== 'programmata'))
}
