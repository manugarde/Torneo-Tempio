import { describe, it, expect } from 'vitest'
import { computeStandings } from './standings.js'

const IMP = { punti: { vittoria: 3, pareggio: 1, sconfitta: 0 }, criteriParita: ['differenzaReti', 'golFatti', 'scontroDiretto'] }
const sq = (id, girone = 'A', nome = id) => ({ id, nome, girone, giocatori: [] })
let n = 0
const gol = (squadraId, k) => Array.from({ length: k }, () => ({ id: `e${n++}`, tipo: 'gol', squadraId, giocatoreId: null }))
const match = (casaId, ospiteId, gc, go, over = {}) => ({
  id: `m${n++}`, fase: 'girone', girone: 'A', casaId, ospiteId, stato: 'finita',
  eventi: [...gol(casaId, gc), ...gol(ospiteId, go)], rigori: null, ...over,
})
const ids = (righe) => righe.map((r) => r.squadraId)

describe('computeStandings', () => {
  it('ordina per punti e calcola le colonne', () => {
    const s = computeStandings([sq('A'), sq('B'), sq('C')], [match('A', 'B', 2, 0), match('B', 'C', 1, 0), match('A', 'C', 1, 1)], IMP)
    expect(ids(s.A)).toEqual(['A', 'B', 'C'])
    expect(s.A[0]).toMatchObject({ squadraId: 'A', g: 2, v: 1, n: 1, p: 0, gf: 3, gs: 1, dr: 2, pt: 4, pariMerito: false })
    expect(s.A[2]).toMatchObject({ squadraId: 'C', pt: 1 })
  })

  it('usa i punti delle impostazioni', () => {
    const s = computeStandings([sq('A'), sq('B')], [match('A', 'B', 1, 0)], { ...IMP, punti: { vittoria: 2, pareggio: 1, sconfitta: 0 } })
    expect(s.A[0].pt).toBe(2)
  })

  it('squadra senza partite compare a zero', () => {
    const s = computeStandings([sq('A'), sq('B'), sq('Z')], [match('A', 'B', 1, 0)], IMP)
    expect(s.A.find((r) => r.squadraId === 'Z')).toMatchObject({ g: 0, pt: 0 })
  })

  it('parità punti: vince differenza reti', () => {
    // A e B 3 pt: A batte C 3-0, B batte C 1-0, A-B nessuna partita
    const s = computeStandings([sq('A'), sq('B'), sq('C')], [match('B', 'C', 1, 0), match('A', 'C', 3, 0)], IMP)
    expect(ids(s.A).slice(0, 2)).toEqual(['A', 'B'])
  })

  it('parità punti e dr: vince gol fatti', () => {
    // A batte C 3-2 (dr+1, gf3), B batte D 1-0 (dr+1, gf1)
    const s = computeStandings([sq('A'), sq('B'), sq('C'), sq('D')], [match('B', 'D', 1, 0), match('A', 'C', 3, 2)], IMP)
    expect(ids(s.A).slice(0, 2)).toEqual(['A', 'B'])
  })

  it('parità totale tranne scontro diretto', () => {
    // tutte 3 pt, dr 0. C gf3 prima; A e B gf2 pari -> B ha battuto A
    const s = computeStandings([sq('A'), sq('B'), sq('C')], [
      match('B', 'A', 1, 0), match('A', 'C', 2, 1), match('C', 'B', 2, 1),
    ], IMP)
    expect(ids(s.A)).toEqual(['C', 'B', 'A'])
  })

  it('parità assoluta: alfabetico e pariMerito', () => {
    const s = computeStandings([sq('b', 'A', 'Beta'), sq('a', 'A', 'Alfa')], [match('a', 'b', 1, 1)], IMP)
    expect(ids(s.A)).toEqual(['a', 'b'])
    expect(s.A.every((r) => r.pariMerito)).toBe(true)
  })

  it('ignora partite live e di eliminazione', () => {
    const s = computeStandings([sq('A'), sq('B')], [
      match('A', 'B', 1, 0, { stato: 'live' }), match('A', 'B', 1, 0, { fase: 'eliminazione', girone: null }),
    ], IMP)
    expect(s.A.every((r) => r.g === 0)).toBe(true)
  })

  it('gironi separati', () => {
    const s = computeStandings([sq('A', 'A'), sq('B', 'A'), sq('C', 'B'), sq('D', 'B')], [
      match('A', 'B', 1, 0), match('C', 'D', 0, 2, { girone: 'B' }),
    ], IMP)
    expect(ids(s.A)).toEqual(['A', 'B'])
    expect(ids(s.B)).toEqual(['D', 'C'])
  })
})
