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

/** Link che conserva ?ed= quando si guarda un'edizione passata. */
export function href(percorso) {
  return route.query.ed ? `#${percorso}?ed=${route.query.ed}` : `#${percorso}`
}
