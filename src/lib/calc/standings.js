import { matchScore } from './score.js'

const valide = (partite) => partite.filter((p) => p.fase === 'girone' && p.stato === 'finita')

/** Righe di classifica per le squadre date, usando solo le partite date. */
function tabella(ids, partite, punti) {
  const righe = new Map(ids.map((id) => [id, { squadraId: id, g: 0, v: 0, n: 0, p: 0, gf: 0, gs: 0, dr: 0, pt: 0, pariMerito: false }]))
  for (const m of partite) {
    const casa = righe.get(m.casaId)
    const ospite = righe.get(m.ospiteId)
    if (!casa || !ospite) continue
    const s = matchScore(m)
    for (const [r, fatti, subiti] of [[casa, s.casa, s.ospite], [ospite, s.ospite, s.casa]]) {
      r.g++
      r.gf += fatti
      r.gs += subiti
      r.dr = r.gf - r.gs
      if (fatti > subiti) { r.v++; r.pt += punti.vittoria }
      else if (fatti === subiti) { r.n++; r.pt += punti.pareggio }
      else { r.p++; r.pt += punti.sconfitta }
    }
  }
  return righe
}

/** Ordina `gruppo` per chiave decrescente e lo spezza in sottogruppi a pari valore. */
function spezza(gruppo, chiave) {
  const ordinato = [...gruppo].sort((a, b) => chiave(b) - chiave(a))
  const out = []
  for (const r of ordinato) {
    const ultimo = out.at(-1)
    if (ultimo && chiave(ultimo[0]) === chiave(r)) ultimo.push(r)
    else out.push([r])
  }
  return out
}

function scontroDiretto(gruppo, partite, punti) {
  const ids = new Set(gruppo.map((r) => r.squadraId))
  const mini = tabella([...ids], partite.filter((m) => ids.has(m.casaId) && ids.has(m.ospiteId)), punti)
  const k = (r) => mini.get(r.squadraId)
  // Peso lessicografico: pt, poi dr, poi gf (valori piccoli, 1e6 basta).
  return spezza(gruppo, (r) => k(r).pt * 1e6 + (k(r).dr + 1e3) * 1e3 + k(r).gf)
}

export function computeStandings(squadre, partite, impostazioni) {
  const { punti, criteriParita } = impostazioni
  const giocate = valide(partite)
  const nomi = new Map(squadre.map((s) => [s.id, s.nome ?? s.id]))
  const out = {}

  for (const girone of [...new Set(squadre.map((s) => s.girone))].sort()) {
    const ids = squadre.filter((s) => s.girone === girone).map((s) => s.id)
    const righe = [...tabella(ids, giocate, punti).values()]

    let gruppi = spezza(righe, (r) => r.pt)
    for (const criterio of criteriParita) {
      gruppi = gruppi.flatMap((g) => {
        if (g.length < 2) return [g]
        if (criterio === 'differenzaReti') return spezza(g, (r) => r.dr)
        if (criterio === 'golFatti') return spezza(g, (r) => r.gf)
        if (criterio === 'scontroDiretto') return scontroDiretto(g, giocate, punti)
        return [g]
      })
    }

    out[girone] = gruppi.flatMap((g) => {
      if (g.length < 2) return g
      g.forEach((r) => { r.pariMerito = true })
      return g.sort((a, b) => nomi.get(a.squadraId).localeCompare(nomi.get(b.squadraId), 'it'))
    })
  }
  return out
}
