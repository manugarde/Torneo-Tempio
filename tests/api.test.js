import { readFileSync } from 'node:fs'
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

let env
const stato = vi.hoisted(() => ({ db: null }))
vi.mock('../src/lib/firebase.js', () => ({ get db() { return stato.db } }))
const api = await import('../src/lib/api.js')

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
  stato.db = env.authenticatedContext('capo').firestore()
})

const leggi = async (path) => (await getDoc(doc(stato.db, path))).data()
const base = { fase: 'eliminazione', turno: 'Quarti', slot: 1, casaId: 'X', ospiteId: 'Y', stato: 'live', eventi: [], rigori: null }

describe('api', () => {
  it('due gol in contemporanea restano entrambi', async () => {
    const id = await api.savePartita('2026', { ...base, prossima: null })
    await Promise.all([
      api.addEvento('2026', id, { tipo: 'gol', squadraId: 'X', giocatoreId: 'a' }),
      api.addEvento('2026', id, { tipo: 'gol', squadraId: 'Y', giocatoreId: null }),
    ])
    const p = await leggi(`edizioni/2026/partite/${id}`)
    expect(p.eventi).toHaveLength(2)
    expect(new Set(p.eventi.map((e) => e.id)).size).toBe(2)
  })

  it('removeEvento toglie solo quello indicato', async () => {
    const id = await api.savePartita('2026', { ...base, prossima: null })
    const e1 = await api.addEvento('2026', id, { tipo: 'gol', squadraId: 'X', giocatoreId: 'a' })
    await api.addEvento('2026', id, { tipo: 'giallo', squadraId: 'Y', giocatoreId: 'b' })
    await api.removeEvento('2026', id, e1)
    const p = await leggi(`edizioni/2026/partite/${id}`)
    expect(p.eventi.map((e) => e.tipo)).toEqual(['giallo'])
  })

  it('non chiude un pareggio a eliminazione senza rigori', async () => {
    const id = await api.savePartita('2026', { ...base, prossima: null })
    await expect(api.setStato('2026', { ...base, id }, 'finita')).rejects.toThrow()
    expect((await leggi(`edizioni/2026/partite/${id}`)).stato).toBe('live')
  })

  it('chiusura porta la vincente al turno dopo', async () => {
    const semi = await api.savePartita('2026', { ...base, turno: 'Semifinale', casaId: null, ospiteId: null, stato: 'programmata', prossima: null })
    const ev = [{ id: 'e1', tipo: 'gol', squadraId: 'Y', giocatoreId: null }]
    const id = await api.savePartita('2026', { ...base, eventi: ev, prossima: { partitaId: semi, lato: 'casa' } })
    await api.setStato('2026', { ...base, id, eventi: ev, prossima: { partitaId: semi, lato: 'casa' } }, 'finita')
    expect((await leggi(`edizioni/2026/partite/${id}`)).stato).toBe('finita')
    expect((await leggi(`edizioni/2026/partite/${semi}`)).casaId).toBe('Y')
  })

  it('createEdizione copia le squadre e setEdizioneCorrente aggiorna meta', async () => {
    await api.saveSquadra('2026', { id: 'alfa', nome: 'Alfa', girone: 'A', logo: '', giocatori: [{ id: 'g1', nome: 'Rossi', numero: 9 }] })
    await api.createEdizione('2027', { copiaDa: '2026' })
    expect((await leggi('edizioni/2027/squadre/alfa')).giocatori[0].nome).toBe('Rossi')
    expect((await leggi('edizioni/2027')).punti.vittoria).toBe(3)
    await api.setEdizioneCorrente('2027')
    expect((await leggi('meta/corrente')).edizione).toBe('2027')
  })

  it('saveChiosco salva un documento per giorno', async () => {
    await api.saveChiosco('2026', '2026-07-01', { alfa: 5, beta: 2 })
    expect(await leggi('edizioni/2026/chiosco/2026-07-01')).toEqual({ giorno: '2026-07-01', punti: { alfa: 5, beta: 2 } })
  })
  it('saveSerata crea e aggiorna, deleteSerata cancella', async () => {
    const id = await api.saveSerata('2027', { data: '2027-06-12', fase: 'Fase a gironi', menu: 'Panini', musica: '', note: '' })
    await api.saveSerata('2027', { id, musica: 'DJ Rossi' })
    expect(await leggi(`edizioni/2027/serate/${id}`)).toMatchObject({ data: '2027-06-12', musica: 'DJ Rossi' })
    await api.deleteSerata('2027', id)
    expect(await leggi(`edizioni/2027/serate/${id}`)).toBeUndefined()
  })
})
