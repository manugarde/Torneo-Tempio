# Notizie e prossimo evento — design breve

## Intento

Gli organizzatori vogliono pubblicare notizie durante il torneo e vogliono che la home mostri subito l'ultima notizia e il prossimo evento. Le notizie sostituiscono l'"avviso unico".

## Decisioni con l'utente

- **Raccolta `edizioni/{anno}/notizie`:** ogni notizia ha `titolo`, `testo` e `data` (Date di pubblicazione).
- **Pagina `#/notizie`:** tutte le notizie, dalla più recente.
- **Home:**
  - riquadro con l'ultima notizia (titolo, data, testo) e il link "Tutte le notizie";
  - riquadro "Prossimo evento": la prima serata con `data` ≥ oggi, con data, fase ed evento, e il link agli Eventi giornalieri;
  - i riquadri senza dati non compaiono.
- **Menu della home:** si aggiunge "Notizie". Su telefono restano solo "Notizie" ed "Eventi giornalieri".
- **Avviso unico tolto:** campo `avviso` in default e Impostazioni, `avvisoVisibile` e il suo test.

## Design

- **`util.js`:**
  - `ultimaNotizia(notizie)`: la notizia con `data` più recente, oppure `null`;
  - `prossimaSerata(serate, oggi = chiaveGiorno(new Date()))`: la serata con `data` ≥ oggi e data minima, oppure `null`.
- **`api.js`:** `saveNotizia` e `deleteNotizia`.
- **`store.svelte.js`:** raccolta `notizie` e getter `notizie`.
- **`admin/NotizieAdmin.svelte`:** scheda "Notizie" in Gestione, subito dopo "Squadre". Form con titolo, testo e data/ora (default: adesso). Elenco con Modifica ed Elimina.
- **`routes/Notizie.svelte`:** elenco delle notizie con titolo, data (`formatDataOra`) e testo (`white-space: pre-line`).
- **Home:** due riquadri sotto le info dell'evento, prima del menu.
- **Edizioni passate:** l'ultima notizia si mostra (è dell'edizione). Il prossimo evento di fatto non c'è, perché le serate sono tutte passate.

## Test

- `ultimaNotizia`, `prossimaSerata` (oggi incluso, passate escluse, lista vuota → `null`).
- api save/delete (con l'emulatore).
- Verifica sull'emulatore: home con notizia ed evento, pagina Notizie, telefono con 2 bottoni.
