import { describe, it, expect } from 'vitest'
import { topScorers } from './scorers.js'

const squadre = [
  { id: 'A', nome: 'Alfa', girone: 'A', giocatori: [{ id: 'r', nome: 'Rossi', numero: 9 }, { id: 'v', nome: 'Verdi', numero: 4 }] },
  { id: 'B', nome: 'Beta', girone: 'A', giocatori: [{ id: 'b', nome: 'Bianchi', numero: 10 }] },
]
let n = 0
const ev = (tipo, squadraId, giocatoreId) => ({ id: `e${n++}`, tipo, squadraId, giocatoreId })
const partita = (eventi, over = {}) => ({ id: `m${n++}`, fase: 'girone', casaId: 'A', ospiteId: 'B', stato: 'finita', eventi, ...over })

describe('topScorers', () => {
  it('ordina per gol', () => {
    const r = topScorers(squadre, [partita([ev('gol', 'A', 'r'), ev('gol', 'B', 'b'), ev('gol', 'A', 'r')])])
    expect(r).toEqual([
      { giocatoreId: 'r', nome: 'Rossi', squadraId: 'A', gol: 2 },
      { giocatoreId: 'b', nome: 'Bianchi', squadraId: 'B', gol: 1 },
    ])
  })
  it('a parità di gol ordina per nome', () => {
    const r = topScorers(squadre, [partita([ev('gol', 'A', 'v'), ev('gol', 'B', 'b')])])
    expect(r.map((x) => x.nome)).toEqual(['Bianchi', 'Verdi'])
  })
  it('esclude autogol, cartellini, marcatore sconosciuto e giocatori non in rosa', () => {
    const r = topScorers(squadre, [partita([
      ev('autogol', 'A', 'r'), ev('giallo', 'A', 'r'), ev('gol', 'A', null), ev('gol', 'A', 'cancellato'),
    ])])
    expect(r).toEqual([])
  })
  it('conta eliminazione e partite live', () => {
    const r = topScorers(squadre, [
      partita([ev('gol', 'A', 'r')], { fase: 'eliminazione' }),
      partita([ev('gol', 'A', 'r')], { stato: 'live' }),
    ])
    expect(r[0].gol).toBe(2)
  })
  it('eventi mancanti non rompono', () => {
    expect(topScorers(squadre, [partita(undefined)])).toEqual([])
  })
})
