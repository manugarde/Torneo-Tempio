import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
} from 'firebase/firestore'
import { firebaseConfig } from '../firebase-config.js'

// `npm run dev:emu`: dati finti sugli emulatori locali, mai sul progetto vero.
const emulatore = import.meta.env.VITE_EMULATOR === '1'

export const app = initializeApp(emulatore ? { ...firebaseConfig, projectId: 'demo-torneo' } : firebaseConfig)
export const auth = getAuth(app)
// Cache offline: al campo con poco segnale le scritture dello staff vanno in coda.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (emulatore) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8085)
}
