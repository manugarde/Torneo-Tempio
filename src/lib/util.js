export const perId = (arr) => new Map(arr.map((x) => [x.id, x]))

/** Partite in ordine cronologico; senza data in fondo. */
export function ordinaPerData(partite) {
  return [...partite].sort((a, b) =>
    (a.dataOra?.getTime() ?? Infinity) - (b.dataOra?.getTime() ?? Infinity) || String(a.id).localeCompare(String(b.id)))
}

/** Prossima partita non finita della squadra, o null. */
export function prossimaPartita(partite, squadraId) {
  return ordinaPerData(partite).find((p) => p.stato !== 'finita' && (p.casaId === squadraId || p.ospiteId === squadraId)) ?? null
}

/** Giocatore + squadra per id, cercando in tutte le rose. */
export function trovaGiocatore(squadre, giocatoreId) {
  for (const s of squadre) {
    const g = s.giocatori?.find((x) => x.id === giocatoreId)
    if (g) return { giocatore: g, squadra: s }
  }
  return null
}
