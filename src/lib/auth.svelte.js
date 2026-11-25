import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase.js'

export const authState = $state({ user: null, isStaff: false, ready: false })

onAuthStateChanged(auth, async (user) => {
  authState.user = user
  authState.isStaff = false
  if (user) {
    try {
      authState.isStaff = (await getDoc(doc(db, 'staff', user.uid))).exists()
    } catch (e) {
      console.error('[auth] verifica staff', e)
    }
  }
  authState.ready = true
})

const MESSAGGI = {
  'auth/invalid-credential': 'Email o password errati.',
  'auth/invalid-email': 'Email non valida.',
  'auth/too-many-requests': 'Troppi tentativi. Riprova tra qualche minuto.',
  'auth/network-request-failed': 'Nessuna connessione. Il primo accesso richiede la rete.',
}

/** Lancia Error con un messaggio in italiano da mostrare all'utente. */
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  } catch (e) {
    throw new Error(MESSAGGI[e.code] ?? 'Accesso non riuscito.')
  }
}

export const logout = () => signOut(auth)
