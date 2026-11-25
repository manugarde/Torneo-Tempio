# Editor notizie con immagini — design breve

## Intento

Lo staff vuole scrivere le notizie come in un documento: formattazione (titoli, grassetto, elenchi, link) e immagini nel testo, con il risultato visibile mentre scrive.

## Decisioni con l'utente

- Editor WYSIWYG in Gestione → Notizie.
- Immagini salvate dentro la notizia (niente Firebase Storage, che richiede il piano a pagamento): **3–4 foto per notizia** bastano.

## Approccio

- **Quill 2** (`quill@2.0.3`) come editor: ha la barra degli strumenti pronta ed è un solo pacchetto. Viene caricato con `import()` dinamico solo nella scheda Gestione, così il sito pubblico non diventa più pesante.
- **DOMPurify** (`dompurify@3.2.6`) per ripulire l'HTML prima di mostrarlo e prima di salvarlo.
- Scartati: TipTap (va costruita tutta la barra), `contenteditable` fatto a mano (fragile), Markdown (non è WYSIWYG).

## Design

- **Documento notizia:** `titolo`, `data`, `html` (nuovo). Il vecchio campo `testo` resta leggibile: se `html` manca si mostra `testo` come testo semplice.
- **`src/components/EditorNotizia.svelte`:**
  - Quill con il tema "snow";
  - barra con: titolo (H2/H3), grassetto, corsivo, sottolineato, elenco puntato e numerato, link, immagine, pulisci formattazione;
  - il pulsante immagine apre la scelta del file, riduce l'immagine con `resizeLogo(file, 1000, 250000)` (WebP, lato massimo 1000px, ≤ 250000 caratteri) e la inserisce nel testo.
- **`image.js`:** `resizeLogo(file, lato = 200, limite = 140000)`. Il terzo parametro è nuovo; le chiamate esistenti non cambiano.
- **Limite di dimensione:** prima di salvare, se `html` supera 900000 caratteri compare il messaggio "La notizia è troppo pesante: togli un'immagine (max 3–4 foto)." e non si salva. Firestore accetta al massimo 1 MB per documento.
- **`format.js` → `anteprimaNotizia(html): { immagine: string, testo: string }`:** `src` della prima `<img>`, più il testo senza tag (entità di base decodificate e spazi compattati). Funzione pura, con test.
- **`src/lib/pulisci.js` → `pulisciHtml(html)`:** `DOMPurify.sanitize` permettendo i tag di formattazione, `img` con `src` `data:`, e link con `target`. A tutti i link vengono aggiunti `target="_blank"` e `rel="noopener noreferrer"`.
- **Pagina Notizie:** `{@html pulisciHtml(n.html)}` dentro `.contenuto`, con stili per titoli, elenchi e immagini a larghezza piena con angoli arrotondati.
- **Home:** l'ultima notizia mostra la prima immagine in copertina e l'anteprima del testo (4 righe).

## Test

- `anteprimaNotizia`: prima immagine, testo senza tag, HTML vuoto.
- Verifica sull'emulatore: scrivere una notizia con formattazione e 2 immagini, vederla in pagina e in home; il blocco su una notizia troppo pesante.
