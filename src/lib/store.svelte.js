import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase.js'
import { conDefault } from './defaults.js'
import { route } from './router.svelte.js'
import { authState } from './auth.svelte.js'
import { simulaGironi } from './calc/simula.js'

/** ?simula=1: risultati finti dei gironi, solo in memoria. Mai per lo staff, che potrebbe salvarli. */
export const simulazione = () => route.query.simula === '1' && !authState.isStaff

function converti(d) {
  const x = { id: d.id, ...d.data() }
  // Timestamp di Firestore (dataOra, creato, ...) → Date
  for (const k in x) if (x[k]?.toDate) x[k] = x[k].toDate()
  return x
}

/** Edizione corrente e lista edizioni (per il selettore). */
export function useMeta() {
  const s = $state({ corrente: null, edizioni: [], ready: false })
  onSnapshot(doc(db, 'meta', 'corrente'),
    (snap) => { s.corrente = snap.data()?.edizione ?? null; s.ready = true },
    () => { s.ready = true })
  onSnapshot(collection(db, 'edizioni'), (q) => {
    s.edizioni = q.docs.map((d) => d.id).sort().reverse()
  })
  return s
}

const RACCOLTE = ['squadre', 'partite', 'squalificheManuali', 'chiosco', 'serate', 'sponsor', 'notizie']

/**
 * Dati di un'edizione. Ogni raccolta apre il suo listener al primo accesso
 * (così una vista legge solo quello che mostra) e poi resta attiva.
 */
export class Edizione {
  anno
  #avviate = new Set()
  #stop = []
  #dati = $state({ impostazioni: null, squadre: [], partite: [], squalificheManuali: [], chiosco: [], serate: [], sponsor: [], notizie: [] })
  #pronte = $state({})
  #inAttesa = $state({})

  constructor(anno) { this.anno = anno }

  #avvia(chiave) {
    if (this.#avviate.has(chiave)) return
    this.#avviate.add(chiave)
    const ref = chiave === 'impostazioni' ? doc(db, 'edizioni', this.anno) : collection(db, 'edizioni', this.anno, chiave)
    this.#stop.push(onSnapshot(ref, { includeMetadataChanges: true }, (snap) => {
      this.#dati[chiave] = chiave === 'impostazioni' ? (snap.exists() ? snap.data() : null) : snap.docs.map(converti)
      this.#inAttesa[chiave] = snap.metadata.hasPendingWrites
      this.#pronte[chiave] = true
    }, (err) => {
      console.error(`[store] ${chiave}`, err)
      this.#pronte[chiave] = true
    }))
  }

  get impostazioni() { this.#avvia('impostazioni'); return conDefault(this.#dati.impostazioni) }
  get esiste() { this.#avvia('impostazioni'); return this.#dati.impostazioni !== null }
  get squadre() { this.#avvia('squadre'); return this.#dati.squadre }
  get partite() {
    this.#avvia('partite')
    return simulazione() ? simulaGironi(this.#dati.partite, this.squadre) : this.#dati.partite
  }
  get squalificheManuali() { this.#avvia('squalificheManuali'); return this.#dati.squalificheManuali }
  get chiosco() { this.#avvia('chiosco'); return this.#dati.chiosco }
  get serate() { this.#avvia('serate'); return this.#dati.serate }
  get sponsor() { this.#avvia('sponsor'); return this.#dati.sponsor }
  get notizie() { this.#avvia('notizie'); return this.#dati.notizie }

  /** true quando la raccolta ha ricevuto il primo snapshot. */
  pronta(chiave) { this.#avvia(chiave); return !!this.#pronte[chiave] }

  /** Modifiche dello staff non ancora arrivate al server (es. offline). */
  get pending() { return Object.values(this.#inAttesa).some(Boolean) }

  chiudi() { this.#stop.forEach((f) => f()) }
}

export { RACCOLTE }
