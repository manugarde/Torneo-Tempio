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

/** Restituisce la combinazione periodo e anno. */
export function testoPeriodo(periodo, anno) {
  const trimmed = periodo?.trim()
  if (!trimmed) return anno
  return `${trimmed} ${anno}`
}

/** Divide il testo in righe, ignora righe vuote e li trima. */
export function righe(testo) {
  if (!testo) return []
  return testo.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0)
}

/** Crea una data alle ore 12 UTC per mantenere il giorno invariato in Europa/Rome. */
export function dataGiorno(chiave) {
  return new Date(chiave + 'T12:00:00Z')
}

/** Sito di uno sponsor: aggiunge https:// se manca; accetta solo http/https, altrimenti ''. */
export function normalizzaSito(testo) {
  let t = (testo ?? '').trim()
  if (!t) return ''
  if (!t.includes('://')) t = 'https://' + t
  try {
    const url = new URL(t)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) return ''
    return url.href
  } catch {
    return ''
  }
}

/** Testo di un pezzo di HTML, senza tag ed entità. */
function soloTesto(html) {
  return html
    .replace(/<\/(p|h[1-6]|li|div)>|<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Anteprima di una notizia HTML: src della prima immagine, testo senza tag e se la foto viene prima del testo. */
export function anteprimaNotizia(html) {
  const s = html ?? ''
  const immagine = s.match(/<img[^>]*\ssrc="([^"]+)"/i)?.[1] ?? ''
  const fotoSopra = !!immagine && !soloTesto(s.slice(0, s.search(/<img/i)))
  return { immagine, testo: soloTesto(s), fotoSopra }
}
