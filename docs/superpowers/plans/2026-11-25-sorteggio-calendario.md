# Sorteggio gironi e generazione partite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Esecuzione decisa dall'utente: logica (Task 1–3) a Mellum via `aider-task`, UI (Task 4–6) a Claude.

**Goal:** Sorteggio casuale bilanciato dei gironi, generazione round robin delle partite di girone già messe in calendario, schede Gironi | Fase finale in Partite e Calendario, fase finale ordinata per turno.

**Architecture:** Funzioni pure in `src/lib/calc/gironi.js` (testate), scritture atomiche `writeBatch` in `api.js`, UI nelle schede admin esistenti e in `Partite.svelte`. L'ordine per turno sta in `ordinaPerData` (`util.js`).

**Tech Stack:** Svelte 5, Firebase 12 Firestore, Vitest (+ emulatore per `tests/`).

**Spec:** `docs/superpowers/specs/2026-11-25-sorteggio-calendario-design.md`

## Global Constraints

- Lettere dei gironi: `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i]`.
- Ordine dei turni: `['Ottavi', 'Quarti', 'Semifinale', '3° posto', 'Finale']` (nomi usati da `TabelloneAdmin.svelte`).
- Default di programmazione: `ora: '20:00'`, `minuti: 50`, `perSerata: 4`, `giorni: [0,1,2,3,4,5,6]`.
- Formato di una partita di girone nuova: `{ fase: 'girone', girone, casaId, ospiteId, dataOra, campo: '', stato: 'programmata', eventi: [], rigori: null, prossima: null }`.
- Le partite `fase: 'eliminazione'` non vengono mai cancellate né modificate da sorteggio o generazione.
- Nessuna nuova dipendenza e nessuna modifica a `firestore.rules`.

## Review Focus

1. Numero dispari di squadre in un girone (5): le partite con il riposo non vengono create. → test Task 1.
2. Nessun giorno spuntato oppure `perSerata` < 1: `programma` deve lanciare un `Error` invece di andare in loop infinito. → test Task 1.
3. Gironi di dimensioni diverse (10 squadre in 3 gironi): il sorteggio resta bilanciato (4/3/3) e nessuna squadra va persa. → test Task 1.
4. Partita di girone già giocata: la generazione è bloccata. → funzione pura `generazioneBloccata(partite)` testata in Task 1.
5. Partite senza data e senza turno (partite di girone senza data): `ordinaPerData` non deve andare in errore e le mette dopo quelle con turno. → test Task 2.

---

### Task 1: `src/lib/calc/gironi.js`

**Files:** Create `src/lib/calc/gironi.js`, `src/lib/calc/gironi.test.js`

**Interfaces (Produces):**
- `sorteggiaGironi(squadre: {id}[], nGironi: number, rand = Math.random): Record<string, string>` — id → lettera.
- `giornateGirone(ids: string[]): Array<Array<[string, string]>>`.
- `ordinePartite(squadre: {id, girone}[]): Array<{girone, giornata, casaId, ospiteId}>`.
- `programma(lista: T[], { inizio: 'YYYY-MM-DD', ora: 'HH:MM', minuti, perSerata, giorni: number[] }): Array<T & { dataOra: Date }>`.
- `generazioneBloccata(partite): boolean` — true se una partita `fase === 'girone'` ha `eventi.length > 0` oppure `stato !== 'programmata'`.

- [ ] **Step 1: Test (scritti da Claude)**
```js
const sq = (n) => Array.from({ length: n }, (_, i) => ({ id: 's' + i }))
it('sorteggio bilanciato 16/4', () => {
  const m = sorteggiaGironi(sq(16), 4)
  expect(Object.keys(m)).toHaveLength(16)
  expect(Object.values(Object.groupBy(Object.values(m), (g) => g)).map((a) => a.length)).toEqual([4, 4, 4, 4])
})
it('sorteggio bilanciato 10/3', () => {
  const conta = Object.values(Object.groupBy(Object.values(sorteggiaGironi(sq(10), 3)), (g) => g)).map((a) => a.length).sort()
  expect(conta).toEqual([3, 3, 4])
})
it('sorteggio usa rand', () => {
  expect(sorteggiaGironi(sq(4), 2, () => 0)).not.toEqual(sorteggiaGironi(sq(4), 2, () => 0.99))
})
it('round robin 4 squadre', () => {
  const g = giornateGirone(['a', 'b', 'c', 'd'])
  expect(g).toHaveLength(3); g.forEach((x) => expect(x).toHaveLength(2))
  const coppie = g.flat().map((p) => [...p].sort().join())
  expect(new Set(coppie).size).toBe(6)
})
it('round robin 5 squadre salta il riposo', () => {
  const g = giornateGirone(['a', 'b', 'c', 'd', 'e'])
  expect(g).toHaveLength(5); expect(g.flat()).toHaveLength(10)
  expect(g.flat().flat()).not.toContain(null)
})
it('ordinePartite: giornata 1 di tutti i gironi prima della 2', () => {
  const s = [...'abcd'].map((id) => ({ id, girone: 'A' })).concat([...'efgh'].map((id) => ({ id, girone: 'B' })))
  const o = ordinePartite(s)
  expect(o).toHaveLength(12)
  expect(o.slice(0, 4).map((p) => [p.girone, p.giornata])).toEqual([['A', 1], ['A', 1], ['B', 1], ['B', 1]])
})
it('programma rispetta perSerata, giorni e niente doppie a sera', () => {
  const s = [...'abcd'].map((id) => ({ id, girone: 'A' })).concat([...'efgh'].map((id) => ({ id, girone: 'B' })))
  // 2027-06-12 è sabato; si gioca solo sabato (6) e domenica (0)
  const p = programma(ordinePartite(s), { inizio: '2027-06-12', ora: '20:00', minuti: 50, perSerata: 4, giorni: [6, 0] })
  expect(p[0].dataOra.getHours()).toBe(20); expect(p[1].dataOra.getMinutes()).toBe(50)
  const perSera = Object.groupBy(p, (x) => x.dataOra.toDateString())
  for (const lista of Object.values(perSera)) {
    expect(lista.length).toBeLessThanOrEqual(4)
    const ids = lista.flatMap((x) => [x.casaId, x.ospiteId]); expect(new Set(ids).size).toBe(ids.length)
    expect([0, 6]).toContain(lista[0].dataOra.getDay())
  }
})
it('programma senza giorni lancia errore', () => {
  expect(() => programma([{ casaId: 'a', ospiteId: 'b' }], { inizio: '2027-06-12', ora: '20:00', minuti: 50, perSerata: 4, giorni: [] })).toThrow()
})
it('generazioneBloccata', () => {
  expect(generazioneBloccata([{ fase: 'girone', stato: 'programmata', eventi: [] }])).toBe(false)
  expect(generazioneBloccata([{ fase: 'girone', stato: 'finita', eventi: [] }])).toBe(true)
  expect(generazioneBloccata([{ fase: 'eliminazione', stato: 'finita', eventi: [{}] }])).toBe(false)
})
```
- [ ] **Step 2:** `npx vitest run src/lib/calc/gironi.test.js` → FAIL. Commit + push dei test.
- [ ] **Step 3: Mellum** implementa `gironi.js` (Fisher–Yates con `rand`; metodo del cerchio con casa/ospite alternati; date locali `new Date(\`${giorno}T${ora}\`)` con un commento `shortcut:` sul fuso).
- [ ] **Step 4:** test PASS. Commit + push.

### Task 2: ordine per turno in `ordinaPerData`

**Files:** Modify `src/lib/util.js`; Test `src/lib/util.test.js` (nuovo)

**Interfaces (Produces):** `TURNI` esportato da `util.js` (l'array dei Global Constraints); `ordinaPerData(partite)` = per data; a parità (le partite senza data) per indice di `turno` in `TURNI` (le partite senza turno vanno in fondo), poi per `slot`, poi per `id`.

- [ ] **Step 1: Test**
```js
it('senza data: ordine per turno e slot', () => {
  const p = [{ id: '1', turno: 'Finale', slot: 1 }, { id: '2', turno: 'Quarti', slot: 2 }, { id: '3', turno: 'Quarti', slot: 1 }, { id: '4', turno: 'Semifinale', slot: 1 }, { id: '5' }]
  expect(ordinaPerData(p).map((x) => x.id)).toEqual(['3', '2', '4', '1', '5'])
})
it('le date vengono prima', () => {
  const p = [{ id: 'a', turno: 'Quarti', slot: 1 }, { id: 'b', dataOra: new Date('2027-06-12T18:00:00Z') }]
  expect(ordinaPerData(p).map((x) => x.id)).toEqual(['b', 'a'])
})
```
- [ ] **Step 2:** FAIL → **Mellum** implementa → PASS. Commit + push.

### Task 3: api — `assegnaGironi`, `sostituisciPartiteGirone`

**Files:** Modify `src/lib/api.js`; Test `tests/api.test.js`

**Interfaces (Produces):**
- `assegnaGironi(anno, mappa: Record<id, lettera>): Promise<void>` — batch `update(doc squadre/id, { girone })`.
- `sostituisciPartiteGirone(anno, daEliminare: string[], nuove: object[]): Promise<void>` — un unico batch: `delete` degli id e `set` delle nuove su `doc(collection(...partite))` (id automatici).

- [ ] **Step 1: Test**
```js
it('assegnaGironi aggiorna solo il girone', async () => {
  const id = await api.saveSquadra('2027', { nome: 'X', girone: 'A', giocatori: [] })
  await api.assegnaGironi('2027', { [id]: 'C' })
  expect(await leggi(`edizioni/2027/squadre/${id}`)).toMatchObject({ nome: 'X', girone: 'C' })
})
it('sostituisciPartiteGirone elimina e crea in un colpo', async () => {
  const vecchia = await api.savePartita('2027', { ...base, fase: 'girone' })
  await api.sostituisciPartiteGirone('2027', [vecchia], [{ ...base, fase: 'girone', casaId: 'P' }, { ...base, fase: 'girone', casaId: 'Q' }])
  expect(await leggi(`edizioni/2027/partite/${vecchia}`)).toBeUndefined()
  const tutte = (await getDocs(collection(stato.db, 'edizioni/2027/partite'))).docs.map((d) => d.data().casaId).sort()
  expect(tutte).toEqual(['P', 'Q'])
})
```
- [ ] **Step 2:** FAIL (`npx vitest run --config vitest.rules.config.js`, con l'emulatore acceso) → **Mellum** implementa → PASS. Commit + push.

### Task 4: Squadre — riquadro "Sorteggio gironi" (Claude)

**Files:** Modify `src/routes/admin/Squadre.svelte`
- Riquadro con input numerico "Numero di gironi" (default 4, `min=1`, `max=ed.squadre.length`) e pulsante "Sorteggia". Il pulsante è disabilitato, con la nota "Ci sono già partite dei gironi: eliminale da Calendario per rifare il sorteggio.", se `ed.partite.some(p => p.fase === 'girone')`. `confirm` e poi `assegnaGironi(ed.anno, sorteggiaGironi(ed.squadre, n))`. Errori nello stato `errore`.
- Verifica: `npm run build` OK. Commit + push.

### Task 5: Calendario — schede e "Genera partite" (Claude)

**Files:** Modify `src/routes/admin/Calendario.svelte`
- Schede `role="tablist"` Gironi | Fase finale (stile di `Admin.svelte`). Le liste vengono filtrate per `fase`.
- Scheda Gironi: riquadro "Genera partite dei gironi" con data della prima serata, ora, minuti, partite per serata e 7 caselle dei giorni (Lun…Dom → 1…6, 0). Anteprima calcolata con `programma(ordinePartite(ed.squadre), opzioni)`: "N partite su S serate, dal … al …" (con `formatGiorno`). Il pulsante "Genera" usa `generazioneBloccata(ed.partite)`: se bloccata mostra un messaggio; se esistono partite di girone chiede `confirm`; poi `sostituisciPartiteGirone(anno, idGironeEsistenti, nuove)` con il formato dei Global Constraints.
- Verifica: build OK. Commit + push.

### Task 6: Partite — schede Gironi | Fase finale (Claude)

**Files:** Modify `src/routes/Partite.svelte`
- Le partite live restano in cima. Le schede compaiono solo se esistono partite a eliminazione. La scheda iniziale segue la regola dello spec. Gironi = lista per giorno attuale, filtrata a `fase === 'girone'`. Fase finale = gruppi per `turno` nell'ordine di `TURNI`; ogni turno ha un `h2` e la lista `MatchRow`.
- Verifica: build OK. Commit + push.

### Task 7: Verifica completa

- [ ] `npm test` e i test con l'emulatore PASS.
- [ ] Emulatore: sorteggio di 4 gironi su 16 squadre → 4×4; Genera (sab+dom, 4 a serata) → 24 partite, nessuna squadra due volte la stessa sera; rigenerazione con conferma; partita finita → generazione bloccata; Partite: schede, fase finale in ordine di turno.
- [ ] `graphify update .`, commit + push.
