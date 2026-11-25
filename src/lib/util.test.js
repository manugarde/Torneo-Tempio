import { describe, it, expect } from 'vitest'
import { ordinaPerData, TURNI } from './util.js'

describe('ordinaPerData', () => {
  it('senza data: ordine per turno e slot, senza turno in fondo', () => {
    const p = [{ id: '1', turno: 'Finale', slot: 1 }, { id: '2', turno: 'Quarti', slot: 2 }, { id: '3', turno: 'Quarti', slot: 1 }, { id: '4', turno: 'Semifinale', slot: 1 }, { id: '5' }, { id: '6', turno: '3° posto', slot: 1 }]
    expect(ordinaPerData(p).map((x) => x.id)).toEqual(['3', '2', '4', '6', '1', '5'])
  })
  it('le partite con data vengono prima', () => {
    const p = [{ id: 'a', turno: 'Quarti', slot: 1 }, { id: 'b', dataOra: new Date('2027-06-12T18:00:00Z') }]
    expect(ordinaPerData(p).map((x) => x.id)).toEqual(['b', 'a'])
  })
  it('TURNI', () => expect(TURNI).toEqual(['Ottavi', 'Quarti', 'Semifinale', '3° posto', 'Finale']))
})
