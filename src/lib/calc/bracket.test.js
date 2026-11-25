import { describe, it, expect } from 'vitest'
import { proposePairings, advanceUpdates } from './bracket.js'

const riga = (squadraId) => ({ squadraId })
const cl = (gironi) => Object.fromEntries(gironi.map((g) => [g, [riga(`1${g}`), riga(`2${g}`), riga(`3${g}`)]]))

describe('proposePairings', () => {
  it('2 gironi, 2 qualificati: incrocio', () => {
    expect(proposePairings(cl(['B', 'A']), 2)).toEqual([
      { casaId: '1A', ospiteId: '2B' }, { casaId: '1B', ospiteId: '2A' },
    ])
  })
  it('4 gironi, 2 qualificati: incrocio a coppie', () => {
    expect(proposePairings(cl(['A', 'B', 'C', 'D']), 2)).toEqual([
      { casaId: '1A', ospiteId: '2B' }, { casaId: '1B', ospiteId: '2A' },
      { casaId: '1C', ospiteId: '2D' }, { casaId: '1D', ospiteId: '2C' },
    ])
  })
  it('4 gironi, 1 qualificato: vincenti consecutive', () => {
    expect(proposePairings(cl(['A', 'B', 'C', 'D']), 1)).toEqual([
      { casaId: '1A', ospiteId: '1B' }, { casaId: '1C', ospiteId: '1D' },
    ])
  })
  it('casi non supportati -> []', () => {
    expect(proposePairings(cl(['A', 'B', 'C']), 2)).toEqual([])
    expect(proposePairings(cl(['A', 'B']), 3)).toEqual([])
    expect(proposePairings({}, 2)).toEqual([])
  })
  it('girone con meno squadre dei qualificati -> []', () => {
    expect(proposePairings({ A: [riga('1A')], B: [riga('1B'), riga('2B')] }, 2)).toEqual([])
  })
})

let n = 0
const gol = (squadraId, k) => Array.from({ length: k }, () => ({ id: `e${n++}`, tipo: 'gol', squadraId, giocatoreId: null }))
const ko = (gc, go, over = {}) => ({
  id: 'q1', fase: 'eliminazione', casaId: 'X', ospiteId: 'Y', stato: 'finita',
  eventi: [...gol('X', gc), ...gol('Y', go)], rigori: null, prossima: { partitaId: 's1', lato: 'ospite' }, ...over,
})

describe('advanceUpdates', () => {
  it('vincente nel lato indicato della partita successiva', () => {
    expect(advanceUpdates(ko(2, 1))).toEqual([{ partitaId: 's1', campo: 'ospiteId', valore: 'X' }])
  })
  it('correzione del risultato cambia la vincente', () => {
    expect(advanceUpdates(ko(1, 2))).toEqual([{ partitaId: 's1', campo: 'ospiteId', valore: 'Y' }])
  })
  it('partita riaperta -> valore null', () => {
    expect(advanceUpdates(ko(2, 1, { stato: 'live' }))).toEqual([{ partitaId: 's1', campo: 'ospiteId', valore: null }])
  })
  it('lato casa', () => {
    expect(advanceUpdates(ko(0, 1, { prossima: { partitaId: 'f', lato: 'casa' } }))).toEqual([{ partitaId: 'f', campo: 'casaId', valore: 'Y' }])
  })
  it('nessuna prossima -> []', () => {
    expect(advanceUpdates(ko(2, 1, { prossima: null }))).toEqual([])
  })
})
