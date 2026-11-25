import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
} from 'firebase/firestore'
import { firebaseConfig } from '../firebase-config.js'

const emulatore = import.meta.env.VITE_EMULATOR === '1' || firebaseConfig.projectId.startsWith('demo-')

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Cache offline: al campo con poco segnale le scritture dello staff vanno in coda.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (emulatore) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8085)
}
