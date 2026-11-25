import { describe, it, expect } from 'vitest'
import { computeSuspensions, isSuspended, atRisk } from './suspensions.js'

const IMP = (sq = {}) => ({ squalifiche: { modo: 'auto', sogliaGialli: 2, partiteRosso: 1, azzeraGialliFaseFinale: true, ...sq } })
const squadre = [
  { id: 'A', nome: 'Alfa', giocatori: [{ id: 'r', nome: 'Rossi', numero: 9 }] },
  { id: 'B', nome: 'Beta', giocatori: [{ id: 'b', nome: 'Bianchi', numero: 10 }] },
]
let n = 0
const ev = (tipo, giocatoreId = 'r', squadraId = 'A') => ({ id: `e${n++}`, tipo, squadraId, giocatoreId })
// partita n-esima di A contro B, giorni consecutivi
const p = (id, giorno, eventi = [], over = {}) => ({
  id, fase: 'girone', casaId: 'A', ospiteId: 'B', stato: 'finita', eventi,
  dataOra: giorno == null ? null : new Date(2026, 6, giorno, 20), ...over,
})

describe('computeSuspensions - auto', () => {
  it('2 gialli in partite diverse -> salta la successiva', () => {
    const res = computeSuspensions(squadre, [p('p1', 1, [ev('giallo')]), p('p2', 2, [ev('giallo')]), p('p3', 3, [], { stato: 'programmata' })], [], IMP())
    expect(res.get('r').partiteSqualificato).toEqual(['p3'])
    expect(res.get('r').gialliAttivi).toBe(0)
    expect(isSuspended(res, 'r', 'p3')).toBe(true)
    expect(isSuspended(res, 'r', 'p2')).toBe(false)
  })

  it('rosso -> salta partiteRosso partite', () => {
    const ps = [p('p1', 1, [ev('rosso')]), p('p2', 2, [], { stato: 'programmata' }), p('p3', 3, [], { stato: 'programmata' })]
    expect(computeSuspensions(squadre, ps, [], IMP()).get('r').partiteSqualificato).toEqual(['p2'])
    expect(computeSuspensions(squadre, ps, [], IMP({ partiteRosso: 2 })).get('r').partiteSqualificato).toEqual(['p2', 'p3'])
  })

  it('giallo + rosso nella stessa partita: conta solo il rosso', () => {
    const res = computeSuspensions(squadre, [p('p1', 1, [ev('giallo'), ev('rosso')]), p('p2', 2, [], { stato: 'programmata' }), p('p3', 3, [], { stato: 'programmata' })], [], IMP())
    expect(res.get('r').partiteSqualificato).toEqual(['p2'])
    expect(res.get('r').gialliAttivi).toBe(0)
  })

  it('squalifica senza partite future -> residue', () => {
    const res = computeSuspensions(squadre, [p('p1', 1, [ev('giallo'), ev('giallo')])], [], IMP())
    expect(res.get('r').partiteSqualificato).toEqual([])
    expect(res.get('r').residue).toBe(1)
  })

  it('azzera gialli prima della fase finale', () => {
    const ps = [
      p('p1', 1, [ev('giallo')]),
      p('q1', 2, [ev('giallo')], { fase: 'eliminazione' }),
      p('s1', 3, [], { fase: 'eliminazione', stato: 'programmata' }),
    ]
    expect(computeSuspensions(squadre, ps, [], IMP()).get('r').partiteSqualificato).toEqual([])
    expect(computeSuspensions(squadre, ps, [], IMP({ azzeraGialliFaseFinale: false })).get('r').partiteSqualificato).toEqual(['s1'])
  })

  it('partita senza dataOra va in fondo senza errori', () => {
    const res = computeSuspensions(squadre, [p('px', null, [], { stato: 'programmata' }), p('p1', 1, [ev('rosso')])], [], IMP())
    expect(res.get('r').partiteSqualificato).toEqual(['px'])
  })

  it('giocatore senza cartellini compare con valori a zero', () => {
    const res = computeSuspensions(squadre, [p('p1', 1)], [], IMP())
    expect(res.get('b')).toEqual({ squadraId: 'B', partiteSqualificato: [], residue: 0, gialliAttivi: 0 })
  })
})

describe('computeSuspensions - manuali', () => {
  const futuro = [p('p1', 1, [ev('giallo'), ev('giallo', 'r')]), p('p2', 2, [], { stato: 'programmata' }), p('p3', 3, [], { stato: 'programmata' })]
  it('modo manuale ignora i cartellini', () => {
    const res = computeSuspensions(squadre, futuro, [], IMP({ modo: 'manuale' }))
    expect(res.get('r').partiteSqualificato).toEqual([])
  })
  it('aggiungi: squalifica da daPartitaId per N partite', () => {
    const man = [{ id: 'm1', giocatoreId: 'b', squadraId: 'B', tipo: 'aggiungi', partite: 1, daPartitaId: 'p2' }]
    const res = computeSuspensions(squadre, futuro, man, IMP({ modo: 'manuale' }))
    expect(res.get('b').partiteSqualificato).toEqual(['p2'])
  })
  it('aggiungi oltre le partite esistenti -> residue', () => {
    const man = [{ id: 'm1', giocatoreId: 'b', squadraId: 'B', tipo: 'aggiungi', partite: 3, daPartitaId: 'p2' }]
    const res = computeSuspensions(squadre, futuro, man, IMP())
    expect(res.get('b').partiteSqualificato).toEqual(['p2', 'p3'])
    expect(res.get('b').residue).toBe(1)
  })
  it('annulla toglie una squalifica automatica', () => {
    const man = [{ id: 'm1', giocatoreId: 'r', squadraId: 'A', tipo: 'annulla', daPartitaId: 'p2' }]
    const res = computeSuspensions(squadre, futuro, man, IMP())
    expect(isSuspended(res, 'r', 'p2')).toBe(false)
  })
})

describe('atRisk', () => {
  it('giocatori a un giallo dalla squalifica', () => {
    const res = computeSuspensions(squadre, [p('p1', 1, [ev('giallo')])], [], IMP())
    expect(atRisk(res, IMP())).toEqual(['r'])
  })
  it('vuoto in modo manuale', () => {
    const res = computeSuspensions(squadre, [p('p1', 1, [ev('giallo')])], [], IMP({ modo: 'manuale' }))
    expect(atRisk(res, IMP({ modo: 'manuale' }))).toEqual([])
  })
  it('isSuspended su giocatore sconosciuto -> false', () => {
    expect(isSuspended(new Map(), 'x', 'p1')).toBe(false)
  })
})
