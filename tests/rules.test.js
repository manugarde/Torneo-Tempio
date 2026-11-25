import { readFileSync } from 'node:fs'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

let env

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-torneo',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 },
  })
})
afterAll(() => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'staff/capo'), {}))
})

const anonimo = () => env.unauthenticatedContext().firestore()
const utente = () => env.authenticatedContext('tizio').firestore()
const staff = () => env.authenticatedContext('capo').firestore()
const squadra = (logo) => ({ nome: 'Alfa', girone: 'A', logo, giocatori: [] })

describe('regole Firestore', () => {
  it('chiunque legge i dati del torneo', async () => {
    await assertSucceeds(getDoc(doc(anonimo(), 'edizioni/2026/partite/x')))
    await assertSucceeds(getDoc(doc(anonimo(), 'edizioni/2026')))
    await assertSucceeds(getDoc(doc(anonimo(), 'meta/corrente')))
  })
  it('anonimo non scrive', async () => {
    await assertFails(setDoc(doc(anonimo(), 'edizioni/2026/partite/x'), { stato: 'live' }))
    await assertFails(setDoc(doc(anonimo(), 'meta/corrente'), { edizione: '2026' }))
  })
  it('utente loggato ma non staff non scrive', async () => {
    await assertFails(setDoc(doc(utente(), 'edizioni/2026/partite/x'), { stato: 'live' }))
    await assertFails(setDoc(doc(utente(), 'edizioni/2026'), { nome: 'x' }))
  })
  it('staff scrive', async () => {
    await assertSucceeds(setDoc(doc(staff(), 'edizioni/2026/partite/x'), { stato: 'live' }))
    await assertSucceeds(setDoc(doc(staff(), 'edizioni/2026'), { nome: 'x' }))
    await assertSucceeds(setDoc(doc(staff(), 'meta/corrente'), { edizione: '2026' }))
  })
  it('logo oltre 140000 caratteri rifiutato', async () => {
    await assertFails(setDoc(doc(staff(), 'edizioni/2026/squadre/a'), squadra('x'.repeat(140001))))
    await assertSucceeds(setDoc(doc(staff(), 'edizioni/2026/squadre/a'), squadra('x'.repeat(1000))))
    await assertSucceeds(setDoc(doc(staff(), 'edizioni/2026/squadre/b'), { nome: 'Senza logo', girone: 'A', giocatori: [] }))
  })
  it('nessuno si aggiunge allo staff dal client', async () => {
    await assertFails(setDoc(doc(utente(), 'staff/tizio'), {}))
    await assertFails(setDoc(doc(staff(), 'staff/altro'), {}))
  })
  it('lo staff legge solo il proprio documento staff', async () => {
    await assertSucceeds(getDoc(doc(staff(), 'staff/capo')))
    await assertFails(getDoc(doc(utente(), 'staff/capo')))
  })
})
