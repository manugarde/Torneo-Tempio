import { describe, it, expect } from 'vitest'
import { matchScore, matchWinner, canFinish } from './score.js'

const ev = (tipo, squadraId, giocatoreId = null) => ({ id: Math.random().toString(36), tipo, squadraId, giocatoreId })
const partita = (over = {}) => ({
  id: 'p1', fase: 'girone', casaId: 'A', ospiteId: 'B', stato: 'finita', eventi: [], rigori: null, ...over,
})

describe('matchScore', () => {
  it('conta i gol per squadra', () => {
    expect(matchScore(partita({ eventi: [ev('gol', 'A'), ev('gol', 'A'), ev('gol', 'B')] }))).toEqual({ casa: 2, ospite: 1 })
  })
  it('autogol va alla squadra avversaria', () => {
    expect(matchScore(partita({ eventi: [ev('autogol', 'A')] }))).toEqual({ casa: 0, ospite: 1 })
    expect(matchScore(partita({ eventi: [ev('autogol', 'B')] }))).toEqual({ casa: 1, ospite: 0 })
  })
  it('cartellini non cambiano il punteggio', () => {
    expect(matchScore(partita({ eventi: [ev('giallo', 'A'), ev('rosso', 'B')] }))).toEqual({ casa: 0, ospite: 0 })
  })
  it('eventi assenti -> 0-0', () => {
    expect(matchScore(partita({ eventi: undefined }))).toEqual({ casa: 0, ospite: 0 })
  })
})

describe('matchWinner', () => {
  it('vittoria casa', () => {
    expect(matchWinner(partita({ eventi: [ev('gol', 'A'), ev('gol', 'A'), ev('gol', 'B')] }))).toBe('A')
  })
  it('pareggio girone -> null', () => {
    expect(matchWinner(partita({ eventi: [ev('gol', 'A'), ev('gol', 'B')] }))).toBeNull()
  })
  it('pareggio eliminazione decisa ai rigori', () => {
    expect(matchWinner(partita({ fase: 'eliminazione', eventi: [ev('gol', 'A'), ev('gol', 'B')], rigori: { casa: 4, ospite: 5 } }))).toBe('B')
  })
  it('partita non finita -> null', () => {
    expect(matchWinner(partita({ stato: 'live', eventi: [ev('gol', 'A')] }))).toBeNull()
  })
})

describe('canFinish', () => {
  const pari = [ev('gol', 'A'), ev('gol', 'B')]
  it('eliminazione pari senza rigori -> false', () => {
    expect(canFinish(partita({ fase: 'eliminazione', eventi: pari }))).toBe(false)
  })
  it('eliminazione pari con rigori pari -> false', () => {
    expect(canFinish(partita({ fase: 'eliminazione', eventi: pari, rigori: { casa: 3, ospite: 3 } }))).toBe(false)
  })
  it('eliminazione pari con rigori decisi -> true', () => {
    expect(canFinish(partita({ fase: 'eliminazione', eventi: pari, rigori: { casa: 4, ospite: 3 } }))).toBe(true)
  })
  it('girone pari -> true', () => {
    expect(canFinish(partita({ eventi: pari }))).toBe(true)
  })
})
