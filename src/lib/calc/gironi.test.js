import { describe, it, expect } from 'vitest'
import { sorteggiaGironi, giornateGirone, ordinePartite, programma, generazioneBloccata } from './gironi.js'

const sq = (n) => Array.from({ length: n }, (_, i) => ({ id: 's' + i }))
const conta = (m) => Object.values(Object.groupBy(Object.values(m), (g) => g)).map((a) => a.length).sort()
const otto = [...'abcd'].map((id) => ({ id, girone: 'A' })).concat([...'efgh'].map((id) => ({ id, girone: 'B' })))
const opz = { inizio: '2027-06-12', ora: '20:00', minuti: 50, perSerata: 4, giorni: [6, 0] }

describe('sorteggiaGironi', () => {
  it('bilanciato 16/4 con lettere A-D', () => {
    const m = sorteggiaGironi(sq(16), 4)
    expect(Object.keys(m)).toHaveLength(16)
    expect(conta(m)).toEqual([4, 4, 4, 4])
    expect([...new Set(Object.values(m))].sort()).toEqual(['A', 'B', 'C', 'D'])
  })
  it('bilanciato 10/3', () => expect(conta(sorteggiaGironi(sq(10), 3))).toEqual([3, 3, 4]))
  it('usa rand', () => {
    expect(sorteggiaGironi(sq(4), 2, () => 0)).not.toEqual(sorteggiaGironi(sq(4), 2, () => 0.99))
  })
})

describe('giornateGirone', () => {
  it('4 squadre: 3 giornate da 2, ogni coppia una volta', () => {
    const g = giornateGirone(['a', 'b', 'c', 'd'])
    expect(g).toHaveLength(3)
    g.forEach((x) => expect(x).toHaveLength(2))
    expect(new Set(g.flat().map((p) => [...p].sort().join())).size).toBe(6)
  })
  it('5 squadre: salta il riposo', () => {
    const g = giornateGirone(['a', 'b', 'c', 'd', 'e'])
    expect(g).toHaveLength(5)
    expect(g.flat()).toHaveLength(10)
    expect(g.flat().flat()).not.toContain(null)
    expect(new Set(g.flat().map((p) => [...p].sort().join())).size).toBe(10)
  })
  it('in ogni giornata una squadra gioca al massimo una volta', () => {
    for (const giornata of giornateGirone(['a', 'b', 'c', 'd', 'e', 'f'])) {
      const ids = giornata.flat()
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('ordinePartite', () => {
  it('giornata 1 di tutti i gironi prima della 2', () => {
    const o = ordinePartite(otto)
    expect(o).toHaveLength(12)
    expect(o.slice(0, 4).map((p) => [p.girone, p.giornata])).toEqual([['A', 1], ['A', 1], ['B', 1], ['B', 1]])
    expect(o[4].giornata).toBe(2)
  })
})

describe('programma', () => {
  it('rispetta perSerata, giorni, orari e niente doppie a sera', () => {
    const p = programma(ordinePartite(otto), opz)
    expect(p).toHaveLength(12)
    expect(p[0].dataOra.getHours()).toBe(20)
    expect(p[0].dataOra.getMinutes()).toBe(0)
    expect(p[1].dataOra.getHours()).toBe(20)
    expect(p[1].dataOra.getMinutes()).toBe(50)
    expect(p[0].dataOra.getDate()).toBe(12)
    for (const lista of Object.values(Object.groupBy(p, (x) => x.dataOra.toDateString()))) {
      expect(lista.length).toBeLessThanOrEqual(4)
      const ids = lista.flatMap((x) => [x.casaId, x.ospiteId])
      expect(new Set(ids).size).toBe(ids.length)
      expect([0, 6]).toContain(lista[0].dataOra.getDay())
    }
  })
  it('conserva i campi della partita', () => {
    expect(programma([{ casaId: 'a', ospiteId: 'b', girone: 'A' }], opz)[0]).toMatchObject({ casaId: 'a', girone: 'A' })
  })
  it('senza giorni o perSerata < 1 lancia errore', () => {
    const una = [{ casaId: 'a', ospiteId: 'b' }]
    expect(() => programma(una, { ...opz, giorni: [] })).toThrow()
    expect(() => programma(una, { ...opz, perSerata: 0 })).toThrow()
  })
})

describe('generazioneBloccata', () => {
  it('solo partite di girone iniziate bloccano', () => {
    expect(generazioneBloccata([{ fase: 'girone', stato: 'programmata', eventi: [] }])).toBe(false)
    expect(generazioneBloccata([{ fase: 'girone', stato: 'finita', eventi: [] }])).toBe(true)
    expect(generazioneBloccata([{ fase: 'girone', stato: 'programmata', eventi: [{}] }])).toBe(true)
    expect(generazioneBloccata([{ fase: 'eliminazione', stato: 'finita', eventi: [{}] }])).toBe(false)
  })
})
