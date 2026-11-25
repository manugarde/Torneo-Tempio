# Torneo-Tempio

Classifica interattiva e tabellone del torneo di calcio a 5 di Tempio.
Il pubblico vede calendario, risultati live, gironi, marcatori, tabellone e Coppa Chiosco.
Solo lo staff (login) può modificare.

Stack: Svelte + Vite, pubblicato su GitHub Pages; dati su Firebase (Auth + Firestore, piano gratuito Spark).

## Sviluppo in locale

Serve Node 22 e Java 11+ (per gli emulatori Firebase).

```bash
npm install
npm run emulatori      # terminale 1: emulatori Firestore (8085) e Auth (9099)
npm run seed           # terminale 2: dati di prova, staff staff@torneo.it / staff123
npm run dev:emu        # sito su http://localhost:5173/Torneo-Tempio/ collegato agli emulatori
```

`npm run dev` (senza `:emu`) usa il progetto Firebase **vero**.

Test:

```bash
npm test               # logica di calcolo
npm run test:rules     # regole di sicurezza e scritture (avvia gli emulatori da solo)
```

## Setup produzione (una volta sola)

Progetto Firebase: `classifica-torneo` (config in `src/firebase-config.js`, pubblica per natura).

1. **Authentication**: metodo Email/Password attivo.
2. **Firestore**: database creato in modalità produzione.
3. **Regole di sicurezza**: `npx firebase login` poi `npx firebase deploy --only firestore:rules`.
   In alternativa copia `firestore.rules` in console → Firestore → Regole → Pubblica.
4. **Utenti staff**: console → Authentication → Aggiungi utente. Poi console → Firestore → raccolta `staff` →
   documento con ID = **UID** dell'utente (nessun campo necessario). Senza questo documento l'utente non può modificare nulla.
5. **GitHub Pages**: repo pubblico → Settings → Pages → Source: **GitHub Actions**.
   Ogni push su `main` esegue test, build e pubblicazione (`.github/workflows/deploy.yml`).
6. Apri il sito, entra dall'icona lucchetto e crea la prima edizione.
7. Genera il QR code del link `https://<utente>.github.io/Torneo-Tempio/`.

**Importante:** lo staff deve fare il primo login con il segnale (poi le modifiche offline vanno in coda).

## Ogni anno

Gestione → Impostazioni → Edizioni: crea la nuova edizione (anche copiando squadre e rose), poi "Rendi corrente".
Le edizioni passate restano visibili in fondo alla pagina.

## Struttura

- `src/lib/calc/` logica pura (punteggio, classifiche, marcatori, squalifiche, tabellone) con test
- `src/lib/api.js` scritture Firestore · `src/lib/store.svelte.js` letture live
- `src/routes/` viste pubbliche · `src/routes/admin/` pannello Gestione
- `firestore.rules` sicurezza: lettura pubblica, scrittura solo per chi ha `staff/{uid}`
- `docs/superpowers/` design e piano
