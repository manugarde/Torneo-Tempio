import { describe, it, expect } from 'vitest'
import { simulaGironi } from './simula.js'
import { matchScore } from './score.js'

const squadre = [
  { id: 'a', giocatori: [{ id: 'a1' }, { id: 'a2' }] },
  { id: 'b', giocatori: [{ id: 'b1' }] },
]
const partite = [
  { id: 'p1', fase: 'girone', stato: 'programmata', casaId: 'a', ospiteId: 'b', eventi: [] },
  { id: 'p2', fase: 'girone', stato: 'finita', casaId: 'a', ospiteId: 'b', eventi: [{ tipo: 'gol', squadraId: 'a' }] },
  { id: 'f', fase: 'eliminazione', stato: 'programmata', casaId: null, ospiteId: null, eventi: [] },
]

describe('simulaGironi', () => {
  const sim = simulaGironi(partite, squadre)

  it('chiude solo le partite dei gironi non giocate', () => {
    expect(sim[0].stato).toBe('finita')
    expect(sim[1]).toBe(partite[1])
    expect(sim[2]).toBe(partite[2])
  })

  it('gol assegnati a giocatori della squadra giusta', () => {
    for (const e of sim[0].eventi) {
      const rosa = squadre.find((s) => s.id === e.squadraId).giocatori.map((g) => g.id)
      expect(rosa).toContain(e.giocatoreId)
    }
  })

  it('stabile tra un caricamento e l\'altro, originali intatti', () => {
    expect(matchScore(simulaGironi(partite, squadre)[0])).toEqual(matchScore(sim[0]))
    expect(partite[0].stato).toBe('programmata')
  })
})
