import { describe, it, expect } from 'vitest'
import { conDefault } from './defaults.js'

describe('conDefault', () => {
  it('aggiunge i campi home', () => {
    const i = conDefault({ nome: 'X' })
    expect(i.periodo).toBe('Giugno')
    expect(i.luogo).toBe('Campetto sintetico, via Campagne 1, Tempio di Ormelle')
    expect(i.orari).toBe('Apertura dalle 19.00')
    expect(i.avviso).toBe('')
    expect(i.sponsor).toBeUndefined()
    expect(i.logo).toBe('')
  })
  it('rispetta i valori salvati', () => {
    expect(conDefault({ periodo: '12–28 giugno', sponsor: [] })).toMatchObject({ periodo: '12–28 giugno', sponsor: [] })
  })
})
