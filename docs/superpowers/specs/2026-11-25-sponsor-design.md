# Sponsor con loghi — design

## Intento

Gli organizzatori vogliono mostrare gli sponsor con il loro logo in fondo alla home. Toccando il logo si apre il sito dello sponsor. Gli sponsor si gestiscono da una scheda in Gestione, senza deploy.

## Obiettivi

- Scheda **Sponsor** in Gestione: aggiungere, modificare ed eliminare sponsor con nome (obbligatorio), logo (facoltativo) e sito web (facoltativo).
- In fondo alla home, una striscia di loghi:
  - fino a 4 sponsor: fermi e centrati;
  - oltre 4: scorrono piano in orizzontale e in loop, e si fermano al passaggio del mouse o al tocco;
  - con `prefers-reduced-motion`: fermi, scorribili con il dito.
- Toccando un logo (o il nome) si apre il sito in una nuova scheda.

## Non obiettivi

- Riordinare gli sponsor a mano: si usa l'ordine di inserimento.
- Livelli di sponsorizzazione (oro, argento…).
- Limite di dimensione del logo nelle regole Firestore: la scrittura resta riservata allo staff, nessun deploy delle regole.

## Decisioni con l'utente

- Striscia che scorre da sola (opzione 1), non carosello a slide.
- Sostituisce la lista di nomi in Impostazioni. "Trapatainer" diventa il primo sponsor (senza logo si vede il nome).

## Approccio

Raccolta `edizioni/{anno}/sponsor`, con lo stesso schema delle serate (store, api, scheda admin). Scartato l'array nelle impostazioni: i loghi (fino a ~100 KB ciascuno) supererebbero il limite di 1 MB di un documento.

## Design

- **Documento:**
  - `nome`: string;
  - `logo`: data URL WebP oppure `''`. Prodotto da `resizeLogo(file, 320)`, che rispetta il limite di 140000 caratteri;
  - `sito`: string oppure `''`;
  - `creato`: Date, usato per l'ordinamento.
- **`format.js` → `normalizzaSito(testo): string`:**
  - vuoto → `''`;
  - senza schema → aggiunge `https://`;
  - accetta solo `http:` e `https:`, altrimenti `''`. È un confine di fiducia: niente `javascript:`.
- **`api.js`:** `saveSponsor(anno, s)` tramite `salva`, e `deleteSponsor(anno, id)`.
- **`store.svelte.js`:** raccolta `sponsor` e getter `sponsor`.
- **`defaults.js`:** il campo `sponsor` viene rimosso (con il suo test). In Impostazioni si toglie la textarea Sponsor.
- **`src/components/SponsorStrip.svelte`:** prop `sponsor`, ordinati per `creato`.
  - Ogni voce è un `<a href={sito} target="_blank" rel="noopener noreferrer">` se c'è il sito, altrimenti uno `<span>`.
  - Dentro, il logo (`<img alt={nome}>`, alto 56px e largo al massimo 140px, `object-fit: contain`) oppure il nome scritto.
  - Oltre 4 sponsor la lista viene duplicata. La copia ha `aria-hidden="true"` e i suoi link hanno `tabindex="-1"`. Animazione CSS `translateX(0 → -50%)` lineare infinita, durata `4s × numero di sponsor`, in pausa su `:hover` e `:focus-within` e mentre un dito tocca la striscia.
  - Con `prefers-reduced-motion: reduce`: niente animazione, niente copia, `overflow-x: auto`.
- **`Home.svelte`:** il footer Sponsor usa `SponsorStrip` con `ed.sponsor`. Se non ci sono sponsor il footer non compare.
- **`admin/SponsorAdmin.svelte` + scheda "Sponsor" in `Admin.svelte`:** form con nome, logo (anteprima e pulsante "Togli logo"), sito; elenco con Modifica ed Elimina (con `confirm`). Il sito viene salvato normalizzato. Se il testo inserito non è un indirizzo valido compare un errore e non si salva.
- **Dati:** `scripts/seed.js` aggiunge lo sponsor "Trapatainer". In produzione lo inserisco io da Gestione dopo il deploy.

## Test

- `normalizzaSito`: `'www.x.it'` → `'https://www.x.it/'`; `'http://a.b'` resta `http`; `'javascript:alert(1)'` → `''`; `''` → `''`.
- api: `saveSponsor` crea e aggiorna, `deleteSponsor` cancella (con l'emulatore).
- Verifica sull'emulatore: 2 sponsor fermi, 6 che scorrono, click sul logo verso il sito.
