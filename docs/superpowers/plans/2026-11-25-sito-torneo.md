# Sito Torneo Tempio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sito pubblico del torneo di calcio a 5 (calendario, risultati live, gironi, marcatori, tabellone, squalifiche, Coppa Chiosco). Solo lo staff loggato può modificare i dati.

**Architecture:** App Svelte single page buildata con Vite e pubblicata su GitHub Pages da una GitHub Action. I dati stanno in Firestore e il pubblico li legge in tempo reale con `onSnapshot`. Lo staff scrive dopo il login Firebase Auth (email/password); le regole Firestore permettono la scrittura solo a chi ha un documento `staff/{uid}`. Classifiche, punteggi, marcatori e squalifiche sono funzioni JS pure, calcolate nel browser dai dati grezzi.

**Tech Stack:** Svelte 5 (rune), Vite, Vitest, Firebase JS SDK v11 modulare (Auth + Firestore), `@firebase/rules-unit-testing` + Firebase Emulator (richiede Java 11+), GitHub Actions (`actions/deploy-pages`).

**Spec:** `docs/superpowers/specs/2026-11-25-sito-torneo-design.md`

## Global Constraints

- Costo 0 €: Firebase piano Spark. **Niente Firebase Storage**: i loghi sono data URL base64 nel documento squadra.
- Repo GitHub **pubblico**. Deploy con Action ufficiale Pages a ogni push su `main`. Vite `base` = `/<nome-repo>/`.
- Lingua UI solo italiano. Date e orari in `Europe/Rome`, formattati con `Intl.DateTimeFormat('it-IT', {timeZone:'Europe/Rome'})`.
- Mobile first. Tutto deve funzionare su smartphone e restare leggibile al sole (contrasto alto).
- Nulla di fisso nel codice su numero squadre, gironi, giorni o qualificati: tutto viene da dati e impostazioni.
- Punteggio partita = conteggio degli eventi `gol`/`autogol`. Nessun campo punteggio separato.
- Scrittura Firestore solo con `exists(/databases/$(database)/documents/staff/$(request.auth.uid))`. Nessuna registrazione utenti nell'app.
- Logo: lato client ridimensionato a 200 px, WebP qualità 0.8. Nelle regole `logo.size() <= 140000` caratteri (circa 100 KB binari).
- Default impostazioni: `punti {vittoria:3, pareggio:1, sconfitta:0}`, `criteriParita ["differenzaReti","golFatti","scontroDiretto"]`, `squalifiche {modo:"auto", sogliaGialli:2, partiteRosso:1, azzeraGialliFaseFinale:true}`, `qualificatiPerGirone:2`.
- Cache offline Firestore: `persistentLocalCache({tabManager: persistentMultipleTabManager()})`.
- Pubblico massimo 200 persone al giorno, limite di 50.000 letture al giorno: i listener partono solo per le raccolte che servono alla vista aperta e restano attivi dopo.
- Task UI (8–10): usa `frontend-design:frontend-design` e UI Skills (`npx ui-skills get baseline-ui`, `fixing-accessibility`), come da CLAUDE.md utente.

## Modello dati (riferimento per tutti i task)

Percorsi: `meta/corrente` `{edizione:"2026"}` · `edizioni/{anno}` = impostazioni · `edizioni/{anno}/squadre|partite|squalificheManuali|chiosco/{id}` · `staff/{uid}`.

```js
// Squadra
{ id, nome, logo /* data URL | "" */, girone /* "A" */, giocatori: [{ id, nome, numero }] }
// Partita
{ id, fase: "girone"|"eliminazione", girone /* se girone */, turno /* "Quarti"... */, slot /* int, ordine nel turno */,
  casaId|null, ospiteId|null, dataOra /* Timestamp in DB, Date nello store */, campo,
  stato: "programmata"|"live"|"finita",
  eventi: [{ id, tipo: "gol"|"autogol"|"giallo"|"rosso", squadraId, giocatoreId|null }],
  rigori: { casa, ospite }|null, prossima: { partitaId, lato: "casa"|"ospite" }|null }
// SqualificaManuale (cambia lo spec: `annullaAutomatica` diventa `tipo`)
{ id, giocatoreId, squadraId, tipo: "aggiungi"|"annulla", partite /* solo aggiungi */, daPartitaId, nota }
// Chiosco (cambia lo spec: 1 documento per giornata invece di 1 per riga, ~7 letture invece di ~110)
{ id /* "2026-07-01" */, giorno, punti: { [squadraId]: number } }
```

Regole evento (decise qui):
- Nel `autogol` lo `squadraId` è la squadra del giocatore che lo segna, e il punto va all'avversaria.
- Se un giocatore prende un `rosso` in una partita, i suoi `giallo` di quella partita non entrano nell'accumulo (doppio giallo = rosso).

## Review Focus

1. **Due telefoni dello staff segnano un gol nello stesso momento** (o uno era offline e risincronizza): devono restare entrambi gli eventi. Il test di integrazione è nel Task 7.
2. **Partita a eliminazione finita in pareggio senza rigori**: non si chiude come `finita` e nessuno avanza nel tabellone. Test nei Task 2 e 9.
3. **Correzione di una partita a eliminazione già finita** che cambia la vincente: la nuova vincente va al turno dopo al posto della vecchia. Test nel Task 6.
4. **Gol con marcatore sconosciuto o giocatore poi rimosso dalla rosa**: conta nel risultato, non nei marcatori e non manda in errore. Test nel Task 4.
5. **Partita senza `dataOra` o ordine incerto**: il calcolo squalifiche non va in errore e la mette in fondo. Il form la rende comunque obbligatoria. Test nel Task 5.

---

### Task 1: Scaffold, test runner, deploy

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.svelte` (placeholder), `.github/workflows/deploy.yml`, `.gitignore`
- Test: `src/lib/smoke.test.js`

- [ ] **Step 1:** `npm create vite@latest . -- --template svelte` (JS, non TS). Poi `npm i firebase` e `npm i -D vitest`. Aggiungi lo script `"test": "vitest run"`.
- [ ] **Step 2:** In `vite.config.js` metti `base: '/Torneo-Tempio/'` e `test: { environment: 'node' }`.
- [ ] **Step 3:** Scrivi `smoke.test.js` con `expect(1+1).toBe(2)`. Esegui `npm test`: deve passare (PASS).
- [ ] **Step 4:** Scrivi `deploy.yml` con trigger push su `main`. Job build: `actions/checkout@v4`, `actions/setup-node@v4` (node 22, cache npm), `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact@v3` (path `dist`). Job deploy: `actions/deploy-pages@v4` con `permissions: pages: write, id-token: write`.
- [ ] **Step 5:** Esegui `npm run build`: deve creare `dist/index.html` con gli asset sotto `/Torneo-Tempio/`.
- [ ] **Step 6:** Commit `chore: scaffold Vite+Svelte, vitest, deploy Pages`.

### Task 2: Punteggio e vincente

**Files:** Create `src/lib/calc/score.js` · Test `src/lib/calc/score.test.js`

**Interfaces — Produces:**
- `matchScore(partita) -> { casa: number, ospite: number }`
- `matchWinner(partita) -> squadraId | null`: null se non `finita`, oppure in pareggio senza rigori validi.
- `canFinish(partita) -> boolean`: false se `fase==="eliminazione"`, punteggio pari e rigori assenti o pari.

- [ ] **Step 1: Test**
  - `gol` casa ×2 + `gol` ospite ×1 → `{casa:2, ospite:1}`
  - `autogol` con `squadraId` = casa → `{casa:0, ospite:1}`
  - eventi `giallo`/`rosso` non cambiano il punteggio
  - `matchWinner` con 2–1 finita → `casaId`; 1–1 girone finita → `null`; 1–1 eliminazione con `rigori {casa:4, ospite:5}` → `ospiteId`; stato `live` → `null`
  - `canFinish` su eliminazione 1–1 senza rigori → `false`; con rigori 3–3 → `false`; 4–3 → `true`; girone 1–1 → `true`
- [ ] **Step 2:** `npx vitest run src/lib/calc/score.test.js` → FAIL (modulo mancante)
- [ ] **Step 3:** Implementa le funzioni in `score.js`.
- [ ] **Step 4:** Rilancia → PASS
- [ ] **Step 5:** Commit `feat: calcolo punteggio e vincente`

### Task 3: Classifiche gironi

**Files:** Create `src/lib/calc/standings.js` · Test `src/lib/calc/standings.test.js`

**Interfaces:**
- Consumes: `matchScore` (Task 2)
- Produces: `computeStandings(squadre, partite, impostazioni) -> { [girone]: Riga[] }` con `Riga = { squadraId, g, v, n, p, gf, gs, dr, pt, pariMerito: boolean }`, ordinata dalla prima.

Considera solo le partite con `fase==="girone"` e `stato==="finita"`. Le squadre senza partite compaiono con tutti i valori a 0.

Algoritmo di spareggio (a gruppi, non con un comparatore, perché lo scontro diretto tra 3 o più squadre non è transitivo):
```
ordina per pt; spezza in gruppi a pari pt
per ogni criterio in criteriParita, per ogni gruppo con >1 squadre:
  differenzaReti / golFatti: riordina il gruppo per quel valore e spezzalo di nuovo
  scontroDiretto: mini-classifica (pt, poi dr, poi gf) solo con le partite tra squadre del gruppo; riordina e spezza
gruppi ancora >1 → ordine alfabetico per nome, pariMerito = true
```

- [ ] **Step 1: Test**
  - 3 squadre, A batte B 2–0, B batte C 1–0, A–C 1–1 → ordine A(4), B(3), C(1); i pt sono quelli di `impostazioni.punti`
  - con punti `{3,1,0}` cambiati a `{2,1,0}` i pt cambiano di conseguenza
  - parità di pt, dr diversa → vince la dr migliore
  - parità di pt e dr, gf diversi → vince chi ha più gf
  - parità totale tranne lo scontro diretto vinto da B → B sopra
  - parità assoluta → ordine alfabetico, entrambe `pariMerito: true`
  - partita `live` o di `eliminazione` → ignorata
  - squadre di gironi diversi → chiavi `A`, `B` separate
- [ ] **Step 2:** Esegui → FAIL. **Step 3:** Implementa. **Step 4:** Esegui → PASS.
- [ ] **Step 5:** Commit `feat: classifiche gironi con criteri di parità`

### Task 4: Marcatori

**Files:** Create `src/lib/calc/scorers.js` · Test `src/lib/calc/scorers.test.js`

**Interfaces — Produces:** `topScorers(squadre, partite) -> [{ giocatoreId, nome, squadraId, gol }]`, ordinata per gol decrescenti, a parità per nome. Considera tutte le fasi, solo eventi `gol` (anche nelle partite `live`).

- [ ] **Step 1: Test**
  - 2 gol di Rossi e 1 di Bianchi → `[Rossi 2, Bianchi 1]`
  - un `autogol` non conta
  - `giocatoreId: null` viene escluso senza errori
  - un `giocatoreId` non più presente in rosa viene escluso senza errori
  - i gol della fase eliminazione contano
- [ ] **Step 2–4:** FAIL → implementa → PASS. **Step 5:** Commit `feat: classifica marcatori`

### Task 5: Squalifiche

**Files:** Create `src/lib/calc/suspensions.js` · Test `src/lib/calc/suspensions.test.js`

**Interfaces — Produces:**
- `computeSuspensions(squadre, partite, manuali, impostazioni) -> Map<giocatoreId, { squadraId, partiteSqualificato: partitaId[], residue: number, gialliAttivi: number }>`
- `isSuspended(risultato, giocatoreId, partitaId) -> boolean`
- `atRisk(risultato, impostazioni) -> giocatoreId[]`: giocatori con `gialliAttivi === sogliaGialli - 1`, solo in modo `auto`.

Algoritmo, per ogni squadra e giocatore:
```
partite della squadra ordinate per dataOra (null in fondo, poi per id)
pending = 0; gialli = 0
per ogni partita p:
  se pending > 0: segna p squalificato; pending--
  se azzeraGialliFaseFinale e p è la prima con fase "eliminazione": gialli = 0
  se p.stato === "finita" e modo === "auto":
    se il giocatore ha un rosso in p: pending += partiteRosso   (i suoi gialli in p ignorati)
    altrimenti: gialli += i suoi gialli in p; ogni volta che gialli >= sogliaGialli: pending++, gialli -= sogliaGialli
residue = pending; gialliAttivi = gialli
```
Manuali, applicate dopo e in entrambi i modi:
- `aggiungi`: segna `daPartitaId` e le successive `partite - 1` della squadra; quelle non ancora create vanno in `residue`.
- `annulla`: toglie `daPartitaId` da `partiteSqualificato`.

In modo `manuale` si applicano solo le manuali.

- [ ] **Step 1: Test** (soglia 2, rosso 1, azzera true, salvo dove indicato)
  - 1 giallo nella partita 1 e 1 nella partita 2 (entrambe finite) → squalificato nella partita 3; `gialliAttivi` 0
  - rosso nella partita 1 → squalificato nella partita 2; con `partiteRosso: 2` → partite 2 e 3
  - giallo + rosso nella stessa partita → solo la squalifica da rosso, `gialliAttivi` 0
  - 2 gialli nell'ultima partita creata → `residue: 1`, nessuna partita segnata
  - 1 giallo nel girone e 1 nella prima eliminazione con azzera true → nessuna squalifica; con azzera false → squalificato nella partita dopo
  - modo `manuale` con 2 gialli → nessuna squalifica; manuale `aggiungi` partite 1 → squalificato
  - `annulla` su una partita squalificata in automatico → non più squalificato
  - partita senza `dataOra` → messa in fondo, nessun errore
  - `atRisk` con 1 giallo attivo e soglia 2 → contiene il giocatore
- [ ] **Step 2–4:** FAIL → implementa → PASS. **Step 5:** Commit `feat: squalifiche automatiche e manuali`

### Task 6: Tabellone

**Files:** Create `src/lib/calc/bracket.js` · Test `src/lib/calc/bracket.test.js`

**Interfaces:**
- Consumes: `computeStandings` (Task 3), `matchWinner` (Task 2)
- Produces:
  - `proposePairings(classifiche, qualificatiPerGirone) -> [{ casaId, ospiteId }]`. Gironi in ordine alfabetico. Con 1 qualificato: vincenti consecutive (A–B, C–D). Con 2: per ogni coppia di gironi (A,B) → `1A–2B`, `1B–2A`. Con altri valori, o con un numero dispari di gironi, restituisce `[]` (l'interfaccia mostra "assegna a mano").
  - `advanceUpdates(partita, tutteLePartite) -> [{ partitaId, campo: "casaId"|"ospiteId", valore: squadraId|null }]`. Se la partita non ha `prossima` → `[]`. Altrimenti scrive la vincente (o `null` se `matchWinner` è null) nel lato giusto della partita successiva.

- [ ] **Step 1: Test**
  - 2 gironi, 2 qualificati → `[{1A,2B},{1B,2A}]`; 4 gironi, 1 qualificato → `[{1A,1B},{1C,1D}]`; 3 gironi, 2 qualificati → `[]`
  - partita finita 2–1 con `prossima {Y, "ospite"}` → `[{partitaId:Y, campo:"ospiteId", valore:casaId}]`
  - stessa partita corretta in 1–2 → il valore diventa `ospiteId` (Review Focus 3)
  - partita riaperta (`live`) → valore `null`
- [ ] **Step 2–4:** FAIL → implementa → PASS. **Step 5:** Commit `feat: proposta accoppiamenti e avanzamento tabellone`

### Task 7: Firebase, regole, data layer

**Files:**
- Create: `src/firebase-config.js` (config pubblica del progetto, compilata dall'utente), `src/lib/firebase.js`, `src/lib/auth.svelte.js`, `src/lib/store.svelte.js`, `src/lib/api.js`, `firestore.rules`, `firebase.json`, `tests/rules.test.js`, `tests/api.test.js`
- Modify: `package.json`: `npm i -D firebase-tools @firebase/rules-unit-testing`, script `"test:rules": "firebase emulators:exec --only firestore,auth \"vitest run tests\""`. Lo script `test` normale esclude `tests/`.

**Interfaces — Produces:**
- `firebase.js`: esporta `app`, `auth`, `db` (con la cache offline dei Global Constraints). Se `import.meta.env.VITE_EMULATOR === '1'` si collega agli emulatori.
- `auth.svelte.js`: `authState` (rune: `{ user, isStaff, ready }`; `isStaff` = esiste `staff/{uid}`), `login(email, pw)`, `logout()`
- `store.svelte.js`: `edizioneCorrente()` → anno da `meta/corrente`; `useEdizione(anno)` → oggetto reattivo `{ impostazioni, squadre, partite, squalificheManuali, chiosco, pending }`. Ogni raccolta parte con `onSnapshot` al primo accesso al getter e poi resta attiva. `dataOra` diventa `Date`. `pending` = `snapshot.metadata.hasPendingWrites`.
- `api.js` (tutte con primo parametro `anno`):
  - `addEvento(anno, partitaId, {tipo, squadraId, giocatoreId})`: usa `arrayUnion` con `id: crypto.randomUUID()`
  - `removeEvento(anno, partitaId, evento)`: usa `arrayRemove` con l'oggetto esatto
  - `setStato(anno, partita, stato, tutteLePartite)`: in un `writeBatch` aggiorna lo stato e applica `advanceUpdates`. Rifiuta `finita` se `!canFinish`.
  - `setRigori`, `savePartita`, `deletePartita`, `saveSquadra`, `deleteSquadra`, `saveImpostazioni`, `saveChiosco(anno, giorno, punti)`, `saveSqualificaManuale`, `deleteSqualificaManuale`
  - `createEdizione(anno, {copiaDa?})`: impostazioni di default; con `copiaDa` copia le squadre e le rose
  - `setEdizioneCorrente(anno)`
  - Le funzioni non attendono la conferma del server per aggiornare l'interfaccia, così offline non si blocca nulla.

Regole (`firestore.rules`):
```
function isStaff() { return request.auth != null && exists(/databases/$(database)/documents/staff/$(request.auth.uid)); }
match /meta/{d}                       { allow read: if true; allow write: if isStaff(); }
match /edizioni/{anno}                { allow read: if true; allow write: if isStaff(); }
match /edizioni/{anno}/{col}/{id}     { allow read: if true;
  allow write: if isStaff() && (col != 'squadre' || request.resource == null || request.resource.data.get('logo','').size() <= 140000); }
match /staff/{uid}                    { allow read: if request.auth != null && request.auth.uid == uid; allow write: if false; }
```

- [ ] **Step 1:** Scrivi `tests/rules.test.js`:
  - anonimo: legge `edizioni/2026/partite/x` → ok; scrive → negato
  - utente loggato senza `staff/{uid}` scrive → negato
  - staff scrive → ok
  - squadra con logo di 140001 caratteri → negato; 1000 caratteri → ok
  - nessuno può scrivere `staff/{uid}`
- [ ] **Step 2:** Scrivi `tests/api.test.js` (emulatore, utente staff): due `addEvento` lanciati con `Promise.all` sulla stessa partita → 2 eventi (Review Focus 1). `removeEvento` toglie solo quello indicato. `setStato(..., "finita")` su eliminazione 1–1 senza rigori → rifiutato (Review Focus 2). Una finita con `prossima` → la partita successiva riceve la vincente.
- [ ] **Step 3:** `npm run test:rules` → FAIL. Se Java manca, ferma il task e segnala all'utente: serve Java 11+.
- [ ] **Step 4:** Implementa regole, `firebase.js`, `auth`, `store`, `api`.
- [ ] **Step 5:** `npm run test:rules` → PASS; `npm test` → PASS.
- [ ] **Step 6:** Commit `feat: firebase, regole sicurezza, data layer`

### Task 8: Viste pubbliche

**Files:**
- Create: `src/App.svelte` (shell + router hash), `src/lib/router.svelte.js`, `src/lib/format.js` (date, Europe/Rome), `src/components/{TeamBadge,MatchCard,Nav}.svelte`, `src/routes/{Home,Calendario,Gironi,Marcatori,Tabellone,Chiosco,Squadre,Squadra,Squalifiche}.svelte`
- Test: `src/lib/format.test.js`

**Interfaces:**
- Consumes: `useEdizione`, `edizioneCorrente` (Task 7); `computeStandings`, `topScorers`, `computeSuspensions`, `atRisk`, `matchScore` (Task 2–5)
- Produces:
  - route `#/`, `#/calendario`, `#/gironi`, `#/marcatori`, `#/tabellone`, `#/chiosco`, `#/squadre`, `#/squadra/:id`, `#/squalifiche`, `#/admin` (Task 10), `#/partita/:id` (Task 9)
  - parametro `?ed=2025` per vedere un'edizione passata
  - componente `MatchCard` con prop `{ partita, squadre, sospensioni, staff }`

Contenuto delle viste (spec §12):
- Home: partite LIVE (badge), poi le prossime 5.
- Calendario: partite raggruppate per giorno.
- Gironi: una tabella per girone (G V N P GF GS DR Pt).
- Tabellone: colonne per `turno`, ordinate per `slot`.
- Chiosco: totale punti per squadra, con logo.
- Squadra: rosa, con "Squalificato" accanto ai giocatori fermi per la prossima partita.
- Squalifiche: squalificati e ammoniti a rischio.
- Selettore edizione in fondo alla pagina.
- `TeamBadge` mostra il logo oppure le iniziali, se il logo manca.

- [ ] **Step 1: Test** `format.test.js`: `formatDataOra(new Date('2026-07-01T18:30:00Z'))` → `"mer 1 lug, 20:30"` (Europe/Rome, in estate UTC+2)
- [ ] **Step 2–4:** FAIL → implementa `format.js` e le viste → PASS
- [ ] **Step 5: Verifica manuale.** Avvia `VITE_EMULATOR=1 npm run dev` con gli emulatori e dati di prova (script `scripts/seed.js`: 8 squadre, 2 gironi, 12 partite, eventi). Controlla ogni route a 375 px di larghezza senza scroll orizzontale, e che un evento aggiunto dalla console dell'emulatore compaia senza ricaricare la pagina.
- [ ] **Step 6:** Commit `feat: viste pubbliche`

### Task 9: Staff — login e partita live/post

**Files:** Create `src/components/{LoginDialog,PlayerPicker,MatchEditor}.svelte`, `src/routes/Partita.svelte`. Modify `Nav.svelte` (pulsante "Area Staff" / "Esci", indicatore "in attesa di rete" quando `pending`).

**Interfaces:** Consumes `login`, `logout`, `authState`, `addEvento`, `removeEvento`, `setStato`, `setRigori`, `canFinish`, `isSuspended`.

Comportamento (spec §12):
- `#/partita/:id` per tutti mostra punteggio ed eventi. Se `isStaff`, compare anche `MatchEditor`.
- `MatchEditor`: due colonne (casa e ospite), ciascuna con i tasti `+ Gol`, `Autogol`, `Giallo`, `Rosso`.
  - Il tasto apre `PlayerPicker`: rosa con numeri, e in cima "Marcatore sconosciuto". I giocatori squalificati sono segnati.
  - Un tocco salva l'evento: 2 tocchi in tutto.
- Lista eventi con "Annulla" su ogni evento.
- Tasti `Inizia` (→ live) e `Termina` (→ finita).
  - Su eliminazione in pareggio, `Termina` è disabilitato e mostra gli input dei rigori (Review Focus 2).
- Modificare gli eventi di una partita già `finita` richiama `setStato(…, "finita")`, che riapplica l'avanzamento (Review Focus 3).

- [ ] **Step 1: Verifica manuale con emulatore e staff seed.**
  - Login sbagliato → messaggio "Email o password errati".
  - Gol in 2 tocchi; il punteggio si aggiorna su un secondo browser senza ricaricare.
  - Annulla.
  - DevTools offline → aggiungi un gol → compare l'indicatore "in attesa di rete" → torna online → l'evento viene sincronizzato.
  - Eliminazione 1–1 → Termina bloccato → rigori 4–3 → Termina → la vincente compare nel turno dopo.
- [ ] **Step 2:** Commit `feat: area staff e gestione partita`

### Task 10: Admin

**Files:** Create `src/lib/image.js`, `src/routes/admin/{Admin,Impostazioni,Squadre,Calendario,TabelloneAdmin,ChioscoAdmin,SqualificheAdmin,Edizioni}.svelte`

**Interfaces:**
- Consumes: le API del Task 7; `proposePairings` del Task 6
- Produces: `resizeLogo(file: File) -> Promise<string>` (data URL WebP 200 px max lato, qualità 0.8; se il risultato supera 140000 caratteri, riprova con qualità 0.6, poi lancia `Error("Logo troppo grande")`)

Sezioni (`#/admin`, solo `isStaff`; per gli altri reindirizza a `#/`):
- **Impostazioni**: tutti i campi dei default nei Global Constraints.
- **Squadre**: nome, girone, logo (`<input type=file accept="image/*">`, quindi galleria o fotocamera), rosa (aggiungi o rimuovi giocatore, nome e numero).
- **Calendario**: crea o modifica partite di girone. `dataOra`, squadre e campo sono obbligatori.
- **Tabellone**:
  - crea un turno con N partite e i collegamenti `prossima` (es. 4 quarti → 2 semifinali → finale; opzionale la partita per il 3° posto);
  - pulsante "Proponi da classifiche" che riempie il primo turno con `proposePairings`;
  - le squadre si possono sempre modificare a mano.
- **Chiosco**: scegli il giorno → un input punti per ogni squadra → salva il documento del giorno.
- **Squalifiche**: elenco delle manuali, aggiungi o annulla (giocatore, partita, n partite, nota).
- **Edizioni**: crea una nuova edizione (anno, checkbox "copia squadre da …"), imposta l'edizione corrente.

- [ ] **Step 1: Verifica manuale.**
  - Carica una foto di 5+ MB da telefono (o con emulazione mobile): il logo salvato pesa ≤ 140000 caratteri e si vede.
  - Crea un girone, le partite e un tabellone a 4 squadre con proposta automatica.
  - Inserisci i punti del Chiosco e controlla che la classifica sommi.
  - Crea l'edizione 2027 copiando il 2026 e impostala corrente: il sito pubblico mostra il 2027, e `?ed=2026` mostra il 2026.
  - Un utente non staff che apre `#/admin` torna alla home.
- [ ] **Step 2:** Commit `feat: pannello admin`

### Task 11: README di setup e verifica finale

**Files:** Modify `README.md`

- [ ] **Step 1:** README in italiano, passo per passo:
  1. Crea il progetto Firebase sul piano Spark.
  2. Attiva Authentication → Email/Password.
  3. Crea il database Firestore (region `eur3`).
  4. Copia la config in `src/firebase-config.js`.
  5. `npx firebase deploy --only firestore:rules`
  6. Crea gli utenti staff dalla console, poi crea il documento `staff/{uid}` vuoto.
  7. Crea `meta/corrente`, oppure crea la prima edizione dall'admin dopo il punto 6.
  8. Su GitHub: Settings → Pages → Source "GitHub Actions"; il repo deve essere pubblico.
  9. Genera il QR code del link.
  10. Nota: il primo login staff va fatto con il segnale.
- [ ] **Step 2:** `npm test && npm run test:rules && npm run build` → tutto PASS.
- [ ] **Step 3:** Commit `docs: README setup Firebase e Pages`
