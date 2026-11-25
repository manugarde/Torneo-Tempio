# Sito Torneo Tempio — Design

Data: 2026-11-25 · Stato: bozza da approvare

## 1. Intento

Torneo locale di calcio a 5, ripetuto ogni anno. Serve un sito pubblico (link via QR code, Instagram, WhatsApp) dove chiunque vede in tempo reale calendario, risultati, classifiche, marcatori, tabellone finale, squalifiche e la classifica "Coppa Chiosco". Solo lo staff (con password) può modificare i dati, direttamente dal telefono al tavolo giuria, sia in diretta durante la partita sia a fine partita.

Successo = il pubblico apre il link e trova i dati giusti e aggiornati; lo staff aggiorna in pochi tocchi senza toccare codice o computer.

## 2. Obiettivi

- Pubblico in sola lettura, aggiornamento live (nessun refresh manuale).
- Area Staff con login email/password: tutte le modifiche.
- Squadre personalizzate: nome, logo, rosa giocatori.
- Calendario partite inserito a mano (data/ora, campo, squadre).
- Inserimento risultato **live** (evento per evento) e **post partita** (tutto a fine gara).
- Classifiche gironi calcolate automaticamente.
- Classifica marcatori.
- Tabellone fase a eliminazione diretta.
- Ammonizioni/espulsioni e squalifiche: modo automatico o manuale, configurabile.
- Classifica Coppa Chiosco: punti inseriti a mano a fine giornata, con logo squadra.
- Edizioni annuali: ogni anno torneo nuovo, edizioni passate consultabili.
- Costo 0 €.

## 3. Non-obiettivi

- Notifiche push, account per il pubblico, commenti/chat.
- Statistiche oltre ai marcatori (assist, minuti giocati, ecc.).
- Gestione iscrizioni/pagamenti delle squadre.
- Più tornei contemporanei nella stessa edizione.

## 4. Anti-obiettivi (fallimento anche se "funziona")

- Chiunque non sia staff riesce a modificare dati.
- Lo staff al tavolo perde tempo: inserire un gol deve richiedere 2 tocchi.
- Il pubblico vede dati incoerenti (es. risultato diverso dai marcatori).
- Serve una carta di credito o un piano a pagamento.

## 5. Vincoli

- Hosting: GitHub Pages su repo **pubblico**: Pages gratis solo su repo pubblico, e lì le Actions non hanno limiti di minuti. Build Vite eseguita da una GitHub Action ufficiale di Pages a ogni push su `main`.
- Backend: Firebase piano gratuito Spark — Authentication (email/password) + Cloud Firestore. **Niente Firebase Storage** (richiede piano Blaze).
- Uso principale da smartphone, anche con segnale scarso al campo.
- Pubblico atteso: **massimo 200 persone al giorno** (indicazione dell'utente). Stima: 200 × circa 100 letture all'apertura, più gli aggiornamenti live, restano ben sotto le 50.000 letture al giorno del piano gratuito. Nessuna ottimizzazione speciale: si applica solo la buona pratica di ascoltare i dati della sezione aperta.
- Numero squadre (~16), numero gironi, durata (~7 giorni) e squadre qualificate sono **variabili**: nulla va fissato nel codice.

## 6. Approcci considerati

| Approccio | Pro | Contro |
|---|---|---|
| A. HTML/CSS/JS statico senza build, Firebase SDK da CDN | Zero strumenti, push e via | Admin scritto a mano, JS lungo e meno manutenibile negli anni |
| **B. Vite + Svelte con deploy via GitHub Actions** ✅ scelto | Componenti, admin ordinato, manutenibile per edizioni future | Serve Node in locale, build in CI |
| Realtime Database invece di Firestore (scartato) | Contatori live semplici | Query più povere per classifiche/marcatori |

L'utente prima aveva scelto la A per paura dei limiti delle Actions. Chiarito che su un repo pubblico le Actions non hanno limiti, ha lasciato a noi la scelta "se viene fuori meglio". Scelta nostra: **B con Svelte**, più leggero e semplice di React, perché il torneo si ripete ogni anno e l'admin ha molti form.

## 7. Decisioni prese con l'utente

- **Loghi**: salvati come immagine base64 dentro Firestore. Ridimensionati sul telefono prima del salvataggio (~200 px, WebP, ~20 KB ciascuno).
- **Squalifiche**: entrambe le modalità, scelta da impostazione:
  - *Automatica*: N gialli → salta 1 partita (N config, default 2); rosso diretto → salta M partite (config, default 1); opzione "azzera gialli prima della fase finale" (default sì).
  - *Manuale*: lo staff assegna/toglie squalifiche.
  - In automatica lo staff può comunque aggiungere/togliere squalifiche manuali (correzioni, decisioni disciplinari).
- **Inserimento risultati**: sia live sia post partita.
- **Coppa Chiosco**: punti inseriti a mano dallo staff a fine giornata.
- **Edizioni annuali**.

## 8. Architettura

```
GitHub Pages (index.html + css + js)  ──►  Firebase Auth (login staff)
          │                                     │
          └──── lettura live (onSnapshot) ──► Firestore ◄── scrittura solo staff
```

- App Svelte single page (build Vite, `base` = nome del repo) con navigazione a sezioni (hash route: `#calendario`, `#gironi`, `#marcatori`, `#tabellone`, `#chiosco`, `#squadre`).
- Pulsante discreto "Area Staff" → login. Da loggato compaiono i comandi di modifica nelle stesse viste + sezione `#admin` (impostazioni, squadre, calendario).
- Tutti i dati calcolati (punteggi, classifiche, marcatori, squalifiche automatiche) sono **derivati lato client** dai dati grezzi: un'unica fonte di verità, nessuna incoerenza.
- Cache offline Firestore attiva (`persistentLocalCache`): con segnale scarso le modifiche staff vengono messe in coda e inviate appena torna la rete; il pubblico vede l'ultima versione caricata.

## 9. Modello dati (Firestore)

Tutto sotto un'edizione: `edizioni/{anno}/...`. Documento radice `meta/corrente` = `{ edizione: "2026" }` indica l'edizione mostrata di default.

- `edizioni/{anno}` — impostazioni:
  - `nome`, `punti: {vittoria:3, pareggio:1, sconfitta:0}`
  - `criteriParita: ["differenzaReti","golFatti","scontroDiretto"]` (ordine)
  - `squalifiche: {modo:"auto"|"manuale", sogliaGialli:2, partiteRosso:1, azzeraGialliFasefinale:true}`
- `edizioni/{anno}/squadre/{id}` — `nome`, `logo` (data URL base64), `girone` (es. "A"), `giocatori: [{id, nome, numero}]`
- `edizioni/{anno}/partite/{id}`:
  - `fase`: `"girone"` | `"eliminazione"`; `girone` (se fase gironi); `turno` (es. "Quarti", "Semifinale", "Finale", "3° posto") e `slot` per il tabellone
  - `casaId`, `ospiteId` (possono essere vuoti nel tabellone finché non noti)
  - `dataOra`, `campo`
  - `stato`: `"programmata"` | `"live"` | `"finita"`
  - `eventi: [{tipo: "gol"|"autogol"|"giallo"|"rosso", squadraId, giocatoreId|null, minuto?}]`
  - `rigori: {casa, ospite}` (solo eliminazione, se pareggio)
  - `prossima: {partitaId, lato:"casa"|"ospite"}` (eliminazione: dove avanza la vincente)
- `edizioni/{anno}/squalificheManuali/{id}` — `giocatoreId`, `squadraId`, `partite` (quante), `daPartitaId`, `nota`, `annullaAutomatica?`
- `edizioni/{anno}/chiosco/{id}` — `squadraId`, `giorno` (data), `punti`, `nota`. La classifica è la somma per squadra.
- `staff/{uid}` — presenza del documento = utente abilitato a scrivere.

**Risultato di una partita = conteggio degli eventi gol/autogol.** Nessun campo punteggio separato: live o post partita è la stessa cosa (post partita = inserire tutti gli eventi in fila). Un gol può avere `giocatoreId: null` se il marcatore è ignoto (conta nel risultato, non nei marcatori).

## 10. Regole di calcolo

- **Classifica girone**: solo partite `fase:"girone"` e `stato:"finita"`. Punti da impostazioni; parità risolta con `criteriParita` nell'ordine dato.
- **Marcatori**: somma eventi `gol` per giocatore (autogol esclusi), tutte le fasi.
- **Squalifiche automatiche**: per ogni giocatore, si scorrono le partite *finite* della sua squadra in ordine di data. Ogni `sogliaGialli` gialli accumulati → squalificato per la successiva partita della squadra (contatore riparte). Rosso → squalificato per le successive `partiteRosso`. Se `azzeraGialliFasefinale`, i gialli accumulati nei gironi non contano in eliminazione. Le squalifiche manuali si sommano (o annullano un'automatica).
- **Visualizzazione**: nella scheda partita e nella rosa, il giocatore squalificato è marcato "Squalificato". Sezione dedicata con elenco squalificati e ammoniti a rischio.
- **Tabellone**: lo staff crea le partite a eliminazione (qualsiasi dimensione: 4, 8, 16 squadre) e assegna le squadre a mano, con un pulsante che *propone* gli accoppiamenti dalle classifiche (1ª A vs 2ª B, ecc.). Quando una partita a eliminazione è `finita`, la vincente (anche ai rigori) viene scritta automaticamente in `prossima`.

## 11. Sicurezza

- La config Firebase nel JS è pubblica per natura: non è un segreto.
- **Le regole Firestore sono l'unica vera protezione**: lettura per tutti; scrittura solo se `exists(/databases/$(database)/documents/staff/$(request.auth.uid))`. Non basta `request.auth != null`, perché con email/password chiunque può crearsi un account tramite API.
- Account staff creati a mano dalla console Firebase; registrazione libera non esposta nel sito.
- Limite dimensione logo nelle regole (es. < 100 KB).

## 12. Esperienza d'uso

**Pubblico (mobile first)**: in alto partite LIVE e prossime partite; poi tab Calendario · Gironi · Marcatori · Tabellone · Coppa Chiosco · Squadre. Loghi accanto ai nomi ovunque. Selettore edizione (anni passati) in fondo.

**Staff — partita live**: scheda partita con due colonne (casa/ospite), tasti grandi `+ Gol`, `Giallo`, `Rosso` → scelta del giocatore dalla rosa (lista con numeri) → salvato. Lista eventi con "annulla" sull'ultimo. Tasti `Inizia` / `Termina`.

**Staff — post partita**: stessa scheda, si inseriscono gli eventi in fila e si preme `Termina`.

**Staff — admin**: impostazioni edizione, squadre (nome, logo da galleria/fotocamera, rosa), calendario (crea/modifica partite), tabellone, Coppa Chiosco (punti per squadra della giornata), squalifiche manuali, crea nuova edizione.

## 13. Scelte tecniche (decise in progettazione, non dall'utente)

- **Più telefoni staff in contemporanea**: gli eventi si aggiungono con `arrayUnion` e si annullano con `arrayRemove`. Ogni evento ha un `id` univoco, così le scritture sono atomiche e due telefoni, o la coda offline, non si sovrascrivono. Teniamo l'array e non una sottoraccolta per limitare le letture (vedi quote).
- **Rose**: ogni giocatore ha un `id` stabile. Si possono aggiungere giocatori a torneo in corso. La rosa non è obbligatoria per segnare un gol: nella scelta del giocatore c'è sempre "Marcatore sconosciuto".
- **Ordine delle partite per le squalifiche**: si usa `dataOra`, obbligatoria anche per le partite a eliminazione. Una squalifica resta "in attesa" e si applica alla prossima partita della squadra, anche se non è ancora stata creata.
- **Offline**: lo staff deve fare il login una volta con il segnale, a casa o prima di arrivare al campo. Dopo, le modifiche fatte offline vanno in coda. Il README lo spiega.
- **Regole Firestore**: scrittura solo per lo staff e logo sotto i 100 KB. Nessuna validazione completa della forma dei documenti.
- **Parità non risolte**: non serve un ordine manuale in classifica. Lo staff assegna comunque gli accoppiamenti del tabellone a mano, e la proposta automatica è solo un aiuto.
- **Nuova edizione**: si crea vuota, con l'opzione "copia squadre e rose dall'edizione precedente". `meta/corrente` si cambia a mano dall'admin.
- **Account staff**: si creano dalla console Firebase (Authentication + documento `staff/{uid}`). Non c'è gestione staff dentro l'app. Il README spiega i passaggi.
- **Lingua e fuso**: solo italiano, orari in Europe/Rome.

## 14. Lasciato al costruttore

- Stile grafico, palette, font (coerenti con un torneo locale, leggibili al sole).
- Struttura componenti Svelte e moduli (logica di calcolo in moduli JS puri, testabili).
- Dettaglio dei controlli del form e dei messaggi d'errore.
- Algoritmo esatto di "scontro diretto" tra 3+ squadre a pari punti (scelta ragionevole documentata).
- Procedura di setup Firebase passo-passo (README per l'utente).
