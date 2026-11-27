# Importa/esporta squadre da Excel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gestione → Squadre: scarica template `.xlsx`, importa uno o più `.xlsx` (un foglio = una squadra), esporta tutte le squadre.

**Architecture:** Logica pura (foglio ↔ squadra, merge con l'esistente) in `src/lib/excel.js`, testata con vitest. UI in `src/routes/admin/Squadre.svelte`, librerie caricate con `import()` dinamico solo al click; salvataggio con `saveSquadra` esistente.

**Tech Stack:** Svelte 5 (runes), vitest, `read-excel-file@9.3.20` (`read-excel-file/browser`, default `readXlsxFile(file) → Promise<{sheet, data: any[][]}[]>`), `write-excel-file@4.1.1` (`write-excel-file/browser`, default `writeXlsxFile(sheets: {sheet, data}[]) → {toFile(name)}`). Già installate.

**Spec:** `docs/superpowers/specs/2026-11-27-import-squadre-design.md`

## Global Constraints
- Modello dati: squadra `{id, nome, girone, logo, giocatori: [{id, nome, numero}]}`; `giocatore.nome` = "Nome e cognome" in un campo; `numero` intero o `null`.
- Formato foglio (righe 1-based): A1 `TORNEO CALCIO A 5 TEMPIO`; A2 `NOME DELLA SQUADRA`, B2 nome; A4 `n° maglia`, B4 `Nome e cognome`; dati da riga 5.
- Nome foglio: nome squadra senza `[]:*?/\`, max 31 caratteri, `Squadra` se vuoto; nomi foglio duplicati resi unici con suffisso ` (2)`.
- Testi UI in italiano. Form manuale invariato.

## Review Focus
- Numero scritto come testo (`"10"`, `" 7 "`) → numero 10 / 7; vuoto → `null`; `10.5` o `abc` → errore che nomina foglio e riga.
- Nome squadra in B2 con maiuscole/spazi diversi da quella esistente → aggiorna quella esistente, non ne crea una nuova.
- Riga con solo il numero e nome vuoto → ignorata.
- File non `.xlsx` o corrotto → messaggio d'errore in pagina, nessun salvataggio parziale di quel file.
- Due squadre con nome uguale tranne maiuscole in export → due fogli con nomi distinti (Excel rifiuta nomi duplicati).

---

### Task 1: `src/lib/excel.js` — conversioni e merge

**Files:**
- Create: `src/lib/excel.js`
- Test: `src/lib/excel.test.js`

**Interfaces:**
- Produces:
  - `nomeFoglio(nome: string, usati: Set<string>) → string` (aggiunge il risultato a `usati`, confronto case-insensitive)
  - `foglioDaSquadra(squadra, usati = new Set()) → {sheet: string, data: any[][]}` — righe: `[['TORNEO CALCIO A 5 TEMPIO'], ['NOME DELLA SQUADRA', nome], [], ['n° maglia', 'Nome e cognome'], ...giocatori ordinati per numero (null in fondo) come [numero ?? null, nome]]`
  - `TEMPLATE_RIGHE = 15` — `foglioTemplate() → {sheet: 'Squadra', data}`: come `foglioDaSquadra({nome:'', giocatori:[]})` più 15 righe `[null, null]`
  - `squadraDaFoglio({sheet, data}) → {nome: string, giocatori: {nome, numero}[]} | null` — `null` se B2 vuoto; dati dopo la riga la cui colonna B è `Nome e cognome` (case-insensitive, trim), altrimenti da indice 4; lancia `Error(\`Foglio "${sheet}", riga ${n}: numero maglia non valido\`)` (n 1-based)
  - `unisciSquadra(esistenti: squadra[], importata, nuovoId: () => string) → {squadra, nuova: boolean}` — match nome trim+lowercase; esistente: tiene `id, logo, girone`, giocatori con stesso nome (trim, lowercase) tengono `id`; nuova: `{id: undefined, nome, girone: 'A', logo: '', giocatori}` (come form "Nuova squadra": `saveSquadra` assegna l'id). Ogni giocatore nuovo riceve `nuovoId()`.

- [ ] **Step 1: Test che falliscono** in `src/lib/excel.test.js`:
  - `foglioDaSquadra` → `data[1]` è `['NOME DELLA SQUADRA', 'ASD Faè']`, `data[3]` intestazione, giocatori ordinati `[[1,'A'],[10,'B'],[null,'C']]`.
  - round-trip: `squadraDaFoglio(foglioDaSquadra(s))` → stesso nome e giocatori `{nome, numero}`.
  - `squadraDaFoglio` con numero `' 7 '` → 7; `''`/null → null; riga `[5, '']` ignorata; `'10.5'` → throws `/riga 6/` quando è alla riga 6; B2 vuoto → `null`.
  - `nomeFoglio('a/b:c', usati)` → `'abc'`; nome di 40 caratteri → 31; secondo `'Tempio'` e poi `'tempio'` → `'tempio (2)'`.
  - `unisciSquadra`: esistente `{id:'s1', nome:'ASD Faè', girone:'B', logo:'x', giocatori:[{id:'g1', nome:'Mario Rossi', numero:9}]}` + importata `{nome:' asd faè ', giocatori:[{nome:'mario rossi', numero:10},{nome:'Luca', numero:null}]}` → `nuova:false`, `id:'s1'`, `girone:'B'`, `logo:'x'`, `nome:'ASD Faè'`, Mario con `id:'g1'` e numero 10 e nome dal file, Luca con id da `nuovoId`. Nessun match → `nuova:true`, `girone:'A'`, `logo:''`.
- [ ] **Step 2:** `npx vitest run src/lib/excel.test.js` → FAIL (modulo mancante).
- [ ] **Step 3:** Implementa `src/lib/excel.js` (nessun import delle librerie Excel: solo dati).
- [ ] **Step 4:** `npx vitest run` → tutti PASS.
- [ ] **Step 5:** Commit `feat: conversione squadre <-> fogli Excel`.

### Task 2: UI in `Squadre.svelte`

**Files:**
- Modify: `src/routes/admin/Squadre.svelte` (blocco `{:else}`, sotto il bottone "Nuova squadra")
- Modify: `.gitignore` (aggiungi `graphify-out/`)

**Interfaces:**
- Consumes: Task 1 (`foglioDaSquadra`, `foglioTemplate`, `squadraDaFoglio`, `unisciSquadra`, `nomeFoglio` tramite `usati`), `saveSquadra(anno, squadra)`, `nuovoId()` da `lib/api.js`.

- [ ] **Step 1:** Riga di bottoni `.btn`: `Scarica template` → `writeXlsxFile([foglioTemplate()]).toFile('modulo-squadra.xlsx')`; `Esporta squadre` (solo se `ordinate.length`) → un foglio per squadra di `ordinate` con un `Set` condiviso → `toFile(\`squadre-${ed.anno}.xlsx\`)`; `Importa` = `<label class="btn">` con `<input type="file" accept=".xlsx" multiple hidden>`.
- [ ] **Step 2:** Import: per ogni file `readXlsxFile(file)`; per ogni foglio `squadraDaFoglio`; prima converti tutti i fogli di un file, poi salva (errore → niente salvataggi di quel file); squadre fra più file/fogli unite in sequenza usando l'elenco aggiornato (stessa squadra due volte → la seconda vince). Esito in `<p role="status">`: `N squadre importate (X nuove, Y aggiornate)` + `Fogli saltati senza nome squadra: ...`; errori in `errore` esistente. Svuota `input.value` a fine import. Stato `importazione` disabilita i bottoni durante l'import.
- [ ] **Step 3:** `npx vitest run` PASS e `npx vite build` senza errori; nel build le librerie Excel finiscono in chunk separati (non nel chunk principale).
- [ ] **Step 4:** Verifica manuale con `npm run dev:emu` o dev: scarica template, compila 2 giocatori, reimporta → squadra creata; esporta → reimporta → nessun cambiamento.
- [ ] **Step 5:** Commit `feat: importa/esporta squadre da Excel (closes #14)`.
