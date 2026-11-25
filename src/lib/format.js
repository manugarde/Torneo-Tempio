const TZ = 'Europe/Rome'

function parti(date, opzioni) {
  const out = {}
  for (const p of new Intl.DateTimeFormat('it-IT', { timeZone: TZ, ...opzioni }).formatToParts(date)) out[p.type] = p.value
  return out
}

export function formatOra(date) {
  if (!date) return ''
  const p = parti(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  return `${p.hour}:${p.minute}`
}

export function formatDataOra(date) {
  if (!date) return 'Da definire'
  const p = parti(date, { weekday: 'short', day: 'numeric', month: 'short' })
  return `${p.weekday} ${p.day} ${p.month}, ${formatOra(date)}`
}

export function formatGiorno(date) {
  if (!date) return 'Da definire'
  const p = parti(date, { weekday: 'long', day: 'numeric', month: 'long' })
  return `${p.weekday} ${p.day} ${p.month}`
}

/** "2026-07-01" nel giorno di Roma: per raggruppare le partite. */
export function chiaveGiorno(date) {
  if (!date) return ''
  const p = parti(date, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${p.year}-${p.month}-${p.day}`
}
