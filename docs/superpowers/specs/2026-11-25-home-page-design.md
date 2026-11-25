# Pagina Home — design

Issue: #1 "PAGINA HOME" (richiesta di `manugarde`, organizzatore).

## Intento

Oggi chi apre il sito atterra sulla lista partite. Gli organizzatori vogliono una home che presenti il torneo a chi non lo conosce: logo, quando e dove si gioca, a che ora apre, un avviso del momento, un menu chiaro verso tutte le sezioni e lo spazio sponsor. In più una pagina nuova "Eventi giornalieri" con il programma delle serate (fase del torneo, cosa si mangia, DJ/band), perché il torneo è anche una festa serale.

Pubblico: gente del paese da telefono. Lo staff deve poter aggiornare i contenuti dal pannello Gestione senza deploy.

## Obiettivi

- Home su `#/` con: logo, periodo + anno, luogo, orari, avviso (se presente), colonna di bottoni verso le sezioni, sponsor in fondo.
- Nuova pagina pubblica "Eventi giornalieri" (`#/serate`).
- Tutti i testi della home e le serate modificabili dallo staff in Gestione.

## Non obiettivi

- Bacheca con più notizie/storico: basta un avviso unico.
- Loghi degli sponsor (per ora solo nomi).
- Logo caricabile da Gestione (è un file statico; cambia raramente).
- Modifiche alla pagina `Benvenuto` (nessuna edizione corrente).

## Anti-obiettivi

- Perdere l'accesso rapido a risultati/calendario: deve restare a un tocco da ogni pagina.
- Richiedere un deploy per cambiare date, orari, avviso o serate.

## Decisioni prese con l'utente

- **Menu (opzione A):** in home una colonna di bottoni grandi; la barra in basso resta su tutte le pagine.
- **Voci della colonna, in ordine:** Risultati e calendario · Classifica gironi · Classifica marcatori · Coppa Chiosco · Tabellone fase finale · Eventi giornalieri.
- **Periodo configurabile senza anno:** campo testo libero (es. `Giugno`, `12–28 giugno`); il sito mostra `<periodo> <anno edizione>`.
- **Bacheca = avviso unico:** un campo testo in Impostazioni; in home compare in evidenza solo se non vuoto.
- **Serate:** nuova raccolta per edizione `edizioni/{anno}/serate`, come squadre/partite/chiosco.
- Date, luogo, orari, avviso e sponsor stanno nelle impostazioni dell'edizione (documento `edizioni/{anno}`).

## Approcci considerati (per notizie/serate)

1. **Raccolta per edizione (scelto)** — stesso schema delle raccolte esistenti (listener in `store.svelte.js`, save/delete in `api.js`, scheda in Gestione). Le regole Firestore coprono già qualsiasi sottoraccolta (lettura pubblica, scrittura staff): nessun deploy regole.
2. Liste dentro il documento impostazioni — meno codice, ma ogni modifica riscrive tutto e due staff in contemporanea si sovrascrivono.
3. Testi nel codice — zero gestione, ma ogni cambio richiede un deploy: contro l'anti-obiettivo.

## Design

### Dati

Nuovi campi in `IMPOSTAZIONI_DEFAULT` (`src/lib/defaults.js`); `conDefault` li fornisce alle edizioni esistenti che non li hanno:

| campo | tipo | default |
|---|---|---|
| `periodo` | string | `'Giugno'` |
| `luogo` | string | `'Campetto sintetico, via Campagne 1, Tempio di Ormelle'` |
| `orari` | string | `'Apertura dalle 19.00'` |
| `avviso` | string | `''` |
| `sponsor` | string[] | `['Powered by Trapatainer']` |

Raccolta `serate`, documento:

| campo | tipo | note |
|---|---|---|
| `data` | string `YYYY-MM-DD` | obbligatorio; ordinamento |
| `fase` | string | testo libero, es. "Fase a gironi", "Semifinali" |
| `menu` | string | cosa si mangia, testo libero multilinea |
| `musica` | string | DJ/band, facoltativo |
| `note` | string | facoltativo |

### Routing e navigazione

- `#/` → nuova vista `Home`. La lista partite passa a `#/partite`.
- Barra in basso (`Nav.svelte`), 6 voci: Home · Partite · Gironi · Giocatori · Tabellone · Chiosco. *(mia scelta: 6 colonne stanno a 360px; Eventi raggiungibile dalla home.)*
- La voce attiva per `partita` diventa `partite`.
- Link da aggiornare: `Partita.svelte` "Torna alle partite" → `#/partite`. Header (titolo → home) e "Vai all'edizione in corso" restano su `#/`.
- Testo admin "apri la partita dalla sezione Partite": invariato (la voce esiste ancora).

### Home (`src/routes/Home.svelte`)

```
[        LOGO        ]
Giugno 2027
Campetto sintetico, via Campagne 1, Tempio di Ormelle
Apertura dalle 19.00
┌ Avviso (solo se compilato) ┐
[ Risultati e calendario   ]  → #/partite
[ Classifica gironi        ]  → #/gironi
[ Classifica marcatori     ]  → #/giocatori
[ Coppa Chiosco            ]  → #/chiosco
[ Tabellone fase finale    ]  → #/tabellone
[ Eventi giornalieri       ]  → #/serate
Sponsor: Powered by Trapatainer
```

- I link usano `href()` per conservare `?ed=` sulle edizioni passate.
- Il logo è `public/logo.webp` (scaricato dall'allegato della issue, ridimensionato ~600px di larghezza), con `alt` = nome torneo.
- Lo stile segue i token di `app.css` esistenti.

### Eventi giornalieri (`src/routes/Serate.svelte`, `#/serate`)

Serate ordinate per `data` crescente; una scheda per serata: data formattata (riusare `formatGiorno` da `format.js`), fase, menu, musica, note (campi vuoti nascosti). Serata di oggi evidenziata come in Partite. Lista vuota → "Il programma delle serate non è ancora stato pubblicato."

### Gestione

- **Impostazioni:** nuova sezione "Home" con campi Periodo (con suggerimento "senza anno"), Luogo, Orari, Avviso (textarea), Sponsor (textarea, un nome per riga → array, righe vuote scartate). Salvati con il `saveImpostazioni` esistente.
- **Nuova scheda "Serate"** (`src/routes/admin/SerateAdmin.svelte`): elenco serate con modifica/elimina, form aggiungi/modifica con i campi sopra. Eliminazione con `confirm`, come altrove.

### Codice toccato

- `src/lib/defaults.js` — nuovi campi.
- `src/lib/store.svelte.js` — `serate` in `RACCOLTE`, nei dati iniziali e getter `serate`.
- `src/lib/api.js` — `saveSerata(anno, s)` (via `salva`) e `deleteSerata(anno, id)`.
- `src/Vista.svelte` — mappa viste: `'' → Home`, `partite → Partite`, `serate → Serate`; fallback per nomi sconosciuti → `Home`.
- `src/components/Nav.svelte`, `src/routes/Partita.svelte`, `src/routes/admin/Admin.svelte`, `src/routes/admin/Impostazioni.svelte`.
- Nuovi: `Home.svelte`, `Serate.svelte`, `admin/SerateAdmin.svelte`, `public/logo.webp`.
- `scripts/seed.js` — un paio di serate d'esempio.

### Test

- `tests/api.test.js`: save/delete serata come per le altre raccolte.
- `defaults`: `conDefault({})` include i nuovi campi (test piccolo).
- Verifica manuale su emulatore: home, navigazione, serate, modifica da Gestione.

### Casi limite (mie scelte dopo la revisione)

- **Logo:** scaricare l'allegato della issue #1 (`github.com/user-attachments/assets/a4beea4d-98c5-4570-a7f7-eea3fdbcf46c`) e convertirlo in `public/logo.webp`. Se il download fallisce è un blocco da segnalare all'utente: niente segnaposto. `alt` = `impostazioni.nome`.
- **Edizioni passate (`?ed=`):** la home mostra i dati di quell'edizione, ma **non** l'avviso, che sarebbe vecchio e fuorviante. Il banner "Stai guardando l'edizione…" dell'Header resta com'è. I link edizioni in `Vista.svelte` (`#/?ed=`) portano alla home: va bene così.
- **Campi vuoti:** con `periodo` vuoto si mostra solo l'anno. Luogo, orari, avviso e sponsor vuoti non si mostrano.
- **Link `#/`:** il grep ha trovato solo Header (titolo, banner storica), `Impostazioni.svelte` (`location.hash = '#/'` dopo "rendi corrente": resta sulla home) e `Partita.svelte`. Solo quest'ultimo va cambiato in `#/partite`.
- **Voce attiva nella barra:** `partita` attiva Partite. `squadra` e `serate` non attivano nessuna voce, come `squadra` oggi.
- **Serate:** la data è obbligatoria (`<input type="date" required>`, nessun vincolo sull'anno). Le serate passate si mostrano normalmente. "Oggi" si calcola con `chiaveGiorno(new Date())` come in Partite. Gli errori di salvataggio usano lo stesso schema `errore` delle altre schede admin.
- **Nuova edizione:** `serate` parte vuota e non viene copiata da `copiaDa`.

## Lasciato al builder

- Stile visivo preciso di home e schede serata (dentro i token esistenti).
- Icona della voce "Home" nella barra.
- `createEdizione` parte dai default per i nuovi campi (non copia luogo/orari dall'edizione sorgente) — mia scelta, i default coincidono con i valori reali.
