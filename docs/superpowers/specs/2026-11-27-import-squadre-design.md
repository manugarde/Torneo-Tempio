# Importa/esporta squadre da Excel (issue #14)

## Perché
Lo staff riceve le rose dai capitani (modulo cartaceo "Modulo iscrizione squadra") e oggi deve
inserire ogni giocatore a mano in Gestione → Squadre. Vuole caricarle da file. Il CSV è scomodo da
compilare a mano: serve un vero `.xlsx` (Excel / Google Fogli).

## Obiettivi
- Bottone **Scarica template**: `.xlsx` vuoto nel formato del modulo.
- Bottone **Importa**: uno o più file `.xlsx`; ogni foglio = una squadra.
- Bottone **Esporta**: tutte le squadre dell'edizione in un `.xlsx`, un foglio per squadra, stesso
  formato del template (reimportabile).
- Il form manuale (nuova squadra, modifica, logo) resta invariato.

## Non-obiettivi
Data di nascita e carta d'identità del modulo cartaceo (la issue dice: solo nome, cognome, squadra,
numero). Logo e girone da file. Anteprima/diff prima dell'import.

## Approcci
1. **Un foglio per squadra, come il modulo** — scelto: il capitano lo riconosce, ognuno compila il suo.
2. Foglio unico con colonna Squadra — scartato: meno chiaro per i capitani.
3. CSV — scartato dall'utente: difficile da compilare a mano.

## Formato del foglio
```
A1: TORNEO CALCIO A 5 TEMPIO
A2: NOME DELLA SQUADRA   B2: <nome squadra>
A4: n° maglia            B4: Nome e cognome
A5..: numero             B5..: nome e cognome   (righe vuote ignorate)
```
Nome del foglio = nome squadra troncato a 31 caratteri senza `[]:*?/\` (solo estetico; in import
conta B2).

## Regole di import
- Squadra trovata per nome (confronto senza maiuscole/spazi ai bordi) → sostituisce la rosa, tiene
  `id`, `logo`, `girone`. I giocatori già presenti con stesso nome mantengono il loro `id` (non si
  perdono gol/cartellini collegati).
- Squadra non trovata → nuova, girone `'A'`, logo vuoto (come "Nuova squadra").
- Foglio senza nome squadra in B2 → saltato, segnalato nell'esito.
- Numero vuoto → `null`; numero non intero → errore per quel foglio.
- Esito mostrato in pagina: "N squadre importate (X nuove, Y aggiornate)", più eventuali fogli saltati.

## Come
- Dipendenze: `read-excel-file`, `write-excel-file`, caricate con `import()` dinamico solo al click
  (non pesano sulla home né sul resto di Gestione).
- Logica pura (righe ↔ squadra, merge) in `src/lib/excel.js` con test vitest; UI in
  `src/routes/admin/Squadre.svelte`; salvataggio con `saveSquadra` esistente.

## Lasciato al builder
API esatte delle due librerie, testi dei bottoni, stile.
