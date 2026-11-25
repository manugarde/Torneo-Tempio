import { describe, it, expect } from 'vitest'
import { formatDataOra, formatOra, formatGiorno, chiaveGiorno } from './format.js'

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
