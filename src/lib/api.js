import { doc, collection, addDoc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from './firebase.js'
import { canFinish } from './calc/score.js'
import { advanceUpdates } from './calc/bracket.js'
import { IMPOSTAZIONI_DEFAULT } from './defaults.js'

async function salva(anno, raccolta, obj) {
  const { id, ...dati } = obj
  if (id) {
    await setDoc(doc(db, 'edizioni', anno, raccolta, id), dati, { merge: true })
    return id
  }
  const newDoc = await addDoc(collection(db, 'edizioni', anno, raccolta), dati)
  return newDoc.id
}

export function nuovoId() {
  return crypto.randomUUID()
}

export async function addEvento(anno, partitaId, { tipo, squadraId, giocatoreId }) {
  const evento = { id: nuovoId(), tipo, squadraId, giocatoreId: giocatoreId ?? null }
  const partitaDoc = doc(db, 'edizioni', anno, 'partite', partitaId)
  await updateDoc(partitaDoc, { eventi: arrayUnion(evento) })
  return evento
}

export async function removeEvento(anno, partitaId, evento) {
  const partitaDoc = doc(db, 'edizioni', anno, 'partite', partitaId)
  await updateDoc(partitaDoc, { eventi: arrayRemove(evento) })
}

export async function setStato(anno, partita, stato) {
  const nuova = { ...partita, stato }
  if (stato === 'finita' && !canFinish(nuova)) {
    throw new Error('Pareggio: inserisci i rigori prima di chiudere la partita.')
  }
  const batch = writeBatch(db)
  const partitaDoc = doc(db, 'edizioni', anno, 'partite', partita.id)
  batch.update(partitaDoc, { stato })
  const updates = advanceUpdates(nuova)
  for (const u of updates) {
    const targetDoc = doc(db, 'edizioni', anno, 'partite', u.partitaId)
    batch.update(targetDoc, { [u.campo]: u.valore })
  }
  await batch.commit()
}

export async function setRigori(anno, partitaId, rigori) {
  const partitaDoc = doc(db, 'edizioni', anno, 'partite', partitaId)
  await updateDoc(partitaDoc, { rigori })
}

export async function savePartita(anno, partita) {
  return salva(anno, 'partite', partita)
}

export async function deletePartita(anno, id) {
  await deleteDoc(doc(db, 'edizioni', anno, 'partite', id))
}

export async function saveSquadra(anno, squadra) {
  return salva(anno, 'squadre', squadra)
}

export async function deleteSquadra(anno, id) {
  await deleteDoc(doc(db, 'edizioni', anno, 'squadre', id))
}

export async function saveSqualificaManuale(anno, s) {
  return salva(anno, 'squalificheManuali', s)
}

export async function deleteSqualificaManuale(anno, id) {
  await deleteDoc(doc(db, 'edizioni', anno, 'squalificheManuali', id))
}

export async function saveSerata(anno, serata) {
  return salva(anno, 'serate', serata)
}

export async function deleteSerata(anno, id) {
  await deleteDoc(doc(db, 'edizioni', anno, 'serate', id))
}

export async function saveImpostazioni(anno, imp) {
  const editionDoc = doc(db, 'edizioni', anno)
  await setDoc(editionDoc, imp, { merge: true })
}

export async function saveChiosco(anno, giorno, punti) {
  const chioscoDoc = doc(db, 'edizioni', anno, 'chiosco', giorno)
  await setDoc(chioscoDoc, { giorno, punti })
}

export async function createEdizione(anno, { copiaDa } = {}) {
  const batch = writeBatch(db)
  const editionDoc = doc(db, 'edizioni', anno)
  batch.set(editionDoc, IMPOSTAZIONI_DEFAULT)
  if (copiaDa) {
    const squadreCollection = collection(db, 'edizioni', copiaDa, 'squadre')
    const squadraDocs = await getDocs(squadreCollection)
    squadraDocs.forEach((d) => {
      batch.set(doc(db, 'edizioni', anno, 'squadre', d.id), d.data())
    })
  }
  await batch.commit()
}

export async function setEdizioneCorrente(anno) {
  const metaDoc = doc(db, 'meta', 'corrente')
  await setDoc(metaDoc, { edizione: anno })
}

/** Sorteggio: { [squadraId]: lettera } scritto in un solo batch. */
export async function assegnaGironi(anno, mappa) {
  const batch = writeBatch(db)
  for (const [id, lettera] of Object.entries(mappa)) {
    batch.update(doc(db, 'edizioni', anno, 'squadre', id), { girone: lettera })
  }
  await batch.commit()
}

/** Elimina e crea le partite di girone in un solo batch (tutto o niente). */
export async function sostituisciPartiteGirone(anno, daEliminare, nuove) {
  const batch = writeBatch(db)
  for (const id of daEliminare) {
    batch.delete(doc(db, 'edizioni', anno, 'partite', id))
  }
  for (const partita of nuove) {
    batch.set(doc(collection(db, 'edizioni', anno, 'partite')), partita)
  }
  await batch.commit()
}
