// Simulazione (?simula=1): le partite dei gironi non giocate diventano "finite" con
// risultati finti, solo in memoria, per vedere come appaiono classifiche e marcatori.

/** Numeri pseudo-casuali stabili per seme: stessa partita, stesso risultato a ogni caricamento. */
function generatore(seme) {
  let h = 2166136261
  for (const c of String(seme)) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

export function simulaGironi(partite, squadre) {
  const rosa = new Map(squadre.map((s) => [s.id, s.giocatori ?? []]))
  return partite.map((p) => {
    if (p.fase !== 'girone' || p.stato === 'finita' || !p.casaId || !p.ospiteId) return p
    const caso = generatore(p.id)
    const eventi = []
    for (const squadraId of [p.casaId, p.ospiteId]) {
      const giocatori = rosa.get(squadraId) ?? []
      const gol = Math.floor(caso() * 6)
      for (let i = 0; i < gol; i++) {
        const g = giocatori[Math.floor(caso() * giocatori.length)]
        eventi.push({ id: `sim-${p.id}-${eventi.length}`, tipo: 'gol', squadraId, giocatoreId: g?.id ?? null })
      }
    }
    return { ...p, stato: 'finita', eventi }
  })
}
