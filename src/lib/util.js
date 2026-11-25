export const perId = (arr) => new Map(arr.map((x) => [x.id, x]))

/** Partite in ordine cronologico; senza data: per turno (TURNI) e slot. */
export function ordinaPerData(partite) {
  return [...partite].sort((a, b) => {
    const dateA = a.dataOra?.getTime() ?? Infinity;
    const dateB = b.dataOra?.getTime() ?? Infinity;
    if (dateA !== dateB) return dateA - dateB;
    const indexA = TURNI.includes(a.turno) ? TURNI.indexOf(a.turno) : Infinity;
    const indexB = TURNI.includes(b.turno) ? TURNI.indexOf(b.turno) : Infinity;
    if (indexA !== indexB) return indexA - indexB;
    const slotA = a.slot ?? Infinity;
    const slotB = b.slot ?? Infinity;
    if (slotA !== slotB) return slotA - slotB;
    return String(a.id).localeCompare(String(b.id));
  });
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

/** Date -> valore per <input type="datetime-local"> (ora del telefono, cioè Italia). */
export function perInputData(date) {
  if (!date) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`
}

export const TURNI = ['Ottavi', 'Quarti', 'Semifinale', '3° posto', 'Finale']
