import { describe, it, expect } from 'vitest'
import { nomeFoglio, foglioDaSquadra, foglioTemplate, squadraDaFoglio, unisciSquadra, TEMPLATE_RIGHE } from './excel.js'

const squadra = {
  id: 's1', nome: 'ASD Faè', girone: 'B', logo: 'x',
  giocatori: [{ id: 'g2', nome: 'B', numero: 10 }, { id: 'g3', nome: 'C', numero: null }, { id: 'g1', nome: 'A', numero: 1 }],
}

describe('foglioDaSquadra', () => {
  it('segue il formato del modulo e ordina per numero', () => {
    const f = foglioDaSquadra(squadra)
    expect(f.sheet).toBe('ASD Faè')
    expect(f.data[0]).toEqual(['TORNEO CALCIO A 5 TEMPIO'])
    expect(f.data[1]).toEqual(['NOME DELLA SQUADRA', 'ASD Faè'])
    expect(f.data[3]).toEqual(['n° maglia', 'Nome e cognome'])
    expect(f.data.slice(4)).toEqual([[1, 'A'], [10, 'B'], [null, 'C']])
  })

  it('round-trip con squadraDaFoglio', () => {
    expect(squadraDaFoglio(foglioDaSquadra(squadra))).toEqual({
      nome: 'ASD Faè',
      giocatori: [{ nome: 'A', numero: 1 }, { nome: 'B', numero: 10 }, { nome: 'C', numero: null }],
    })
  })
})

describe('foglioTemplate', () => {
  it('ha intestazione e righe vuote', () => {
    const f = foglioTemplate()
    expect(f.sheet).toBe('Squadra')
    expect(f.data[1]).toEqual(['NOME DELLA SQUADRA', ''])
    expect(f.data.length).toBe(4 + TEMPLATE_RIGHE)
    expect(squadraDaFoglio(f)).toBeNull()
  })
})

describe('squadraDaFoglio', () => {
  const foglio = (righe, nome = 'Tempio') => ({
    sheet: 'F1',
    data: [['TORNEO CALCIO A 5 TEMPIO'], ['NOME DELLA SQUADRA', nome], [], ['n° maglia', 'Nome e cognome'], ...righe],
  })

  it('normalizza numeri e ignora righe senza nome', () => {
    expect(squadraDaFoglio(foglio([[' 7 ', ' Mario Rossi '], ['', 'Luca'], [null, 'Paolo'], [5, ''], [9, null]], ' Tempio ')))
      .toEqual({ nome: 'Tempio', giocatori: [{ nome: 'Mario Rossi', numero: 7 }, { nome: 'Luca', numero: null }, { nome: 'Paolo', numero: null }] })
  })

  it('numero non intero: errore con foglio e riga', () => {
    expect(() => squadraDaFoglio(foglio([[1, 'A'], ['10.5', 'B']]))).toThrow(/Foglio "F1", riga 6/)
    expect(() => squadraDaFoglio(foglio([['abc', 'B']]))).toThrow(/riga 5/)
  })

  it('nome squadra vuoto: null', () => {
    expect(squadraDaFoglio(foglio([[1, 'A']], ''))).toBeNull()
    expect(squadraDaFoglio(foglio([[1, 'A']], null))).toBeNull()
  })

  it('trova l\'intestazione anche se spostata', () => {
    const f = { sheet: 'X', data: [['x'], ['NOME DELLA SQUADRA', 'Tempio'], ['n° maglia', 'NOME E COGNOME '], [3, 'A']] }
    expect(squadraDaFoglio(f)).toEqual({ nome: 'Tempio', giocatori: [{ nome: 'A', numero: 3 }] })
  })
})

describe('nomeFoglio', () => {
  it('toglie caratteri vietati, tronca e rende unico', () => {
    const usati = new Set()
    expect(nomeFoglio('a/b:c', usati)).toBe('abc')
    expect(nomeFoglio('x'.repeat(40), usati)).toBe('x'.repeat(31))
    expect(nomeFoglio('Tempio', usati)).toBe('Tempio')
    expect(nomeFoglio('tempio', usati)).toBe('tempio (2)')
    expect(nomeFoglio('', usati)).toBe('Squadra')
  })
})

describe('unisciSquadra', () => {
  let n = 0
  const nuovoId = () => `n${++n}`
  const esistenti = [{ id: 's1', nome: 'ASD Faè', girone: 'B', logo: 'x', giocatori: [{ id: 'g1', nome: 'Mario Rossi', numero: 9 }] }]

  it('aggiorna squadra esistente tenendo id, logo, girone e id giocatori', () => {
    const { squadra, nuova } = unisciSquadra(esistenti, { nome: ' asd faè ', giocatori: [{ nome: 'mario rossi', numero: 10 }, { nome: 'Luca', numero: null }] }, nuovoId)
    expect(nuova).toBe(false)
    expect(squadra).toEqual({
      id: 's1', nome: 'ASD Faè', girone: 'B', logo: 'x',
      giocatori: [{ id: 'g1', nome: 'mario rossi', numero: 10 }, { id: 'n1', nome: 'Luca', numero: null }],
    })
  })

  it('crea squadra nuova nel girone A senza logo', () => {
    const { squadra, nuova } = unisciSquadra(esistenti, { nome: 'Tempio', giocatori: [{ nome: 'A', numero: 1 }] }, nuovoId)
    expect(nuova).toBe(true)
    expect(squadra).toEqual({ id: undefined, nome: 'Tempio', girone: 'A', logo: '', giocatori: [{ id: 'n2', nome: 'A', numero: 1 }] })
  })
})
