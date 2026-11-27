// Router a hash: #/percorso/param?chiave=valore
function leggi() {
  const [percorso, qs = ''] = location.hash.replace(/^#/, '').split('?')
  const pezzi = (percorso || '/').split('/').filter(Boolean)
  return { nome: pezzi[0] ?? '', param: pezzi[1] ?? null, query: Object.fromEntries(new URLSearchParams(qs)) }
}

export const route = $state(leggi())

window.addEventListener('hashchange', () => {
  Object.assign(route, leggi())
  window.scrollTo(0, 0)
})

/** Link che conserva ?ed= (edizione passata) e ?simula= (simulazione gironi). */
export function href(percorso) {
  const qs = new URLSearchParams(Object.entries(route.query).filter(([k]) => k === 'ed' || k === 'simula')).toString()
  return qs ? `#${percorso}?${qs}` : `#${percorso}`
}
