import { describe, it, expect } from 'vitest'
import { formatDataOra, formatOra, formatGiorno, chiaveGiorno, testoPeriodo, righe, dataGiorno, normalizzaSito } from './format.js'

// 18:30 UTC di luglio = 20:30 a Roma (ora legale)
const d = new Date('2026-07-01T18:30:00Z')

describe('format (Europe/Rome)', () => {
  it('formatDataOra', () => expect(formatDataOra(d)).toBe('mer 1 lug, 20:30'))
  it('formatOra', () => expect(formatOra(d)).toBe('20:30'))
  it('formatGiorno', () => expect(formatGiorno(d)).toBe('mercoledì 1 luglio'))
  it('chiaveGiorno usa il giorno di Roma', () => {
    expect(chiaveGiorno(new Date('2026-07-01T22:30:00Z'))).toBe('2026-07-02')
  })
  it('date mancanti', () => {
    expect(formatDataOra(null)).toBe('Da definire')
    expect(chiaveGiorno(null)).toBe('')
  })
})

describe('helper home', () => {
  it('testoPeriodo', () => {
    expect(testoPeriodo('Giugno', '2027')).toBe('Giugno 2027')
    expect(testoPeriodo(' 12–28 giugno ', '2027')).toBe('12–28 giugno 2027')
    expect(testoPeriodo('', '2027')).toBe('2027')
    expect(testoPeriodo('  ', '2027')).toBe('2027')
  })
  it('righe', () => {
    expect(righe(' A \n\n B\r\n  \n')).toEqual(['A', 'B'])
    expect(righe('')).toEqual([])
  })
  it('dataGiorno resta nel giorno giusto a Roma', () => {
    expect(formatGiorno(dataGiorno('2027-06-12'))).toBe('sabato 12 giugno')
    expect(chiaveGiorno(dataGiorno('2027-06-12'))).toBe('2027-06-12')
  })
  it('normalizzaSito', () => {
    expect(normalizzaSito('')).toBe('')
    expect(normalizzaSito('  www.x.it ')).toBe('https://www.x.it/')
    expect(normalizzaSito('http://a.b/c')).toBe('http://a.b/c')
    expect(normalizzaSito('javascript:alert(1)')).toBe('')
    expect(normalizzaSito('non un sito')).toBe('')
  })
})
