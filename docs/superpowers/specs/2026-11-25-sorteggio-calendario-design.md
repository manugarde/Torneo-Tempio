# Sorteggio gironi e generazione partite — design

## Intento

Gli organizzatori hanno le squadre iscritte e vogliono preparare la fase a gironi senza inserire tutto a mano: sorteggiare i gironi e generare in un colpo solo tutte le partite già messe in calendario. In più la pagina Partite deve mostrare la fase finale nell'ordine in cui si gioca.

## Obiettivi

1. **Sorteggia gironi** (Gestione → Squadre): lo staff sceglie il numero di gironi e il sito assegna ogni squadra a un girone (A, B, C…) a caso, con gironi bilanciati (dimensioni che differiscono al massimo di 1).
2. **Genera partite** (Gestione → Calendario): per ogni girone ogni squadra incontra tutte le altre una volta, e ogni partita riceve data e ora in automatico.
3. **Ordine fase finale** in Partite: le partite senza data sono ordinate per turno (Ottavi → Quarti → Semifinale → 3° posto → Finale) e poi per `slot`.

## Non obiettivi

- Andata e ritorno.
- Assegnazione dei campi (resta `campo: ''`, modificabile a mano).
- Teste di serie o fasce nel sorteggio.
- Programmazione automatica della fase finale.

## Regole decise con l'utente

- **Sorteggio:** casuale e bilanciato. È bloccato se esistono già partite di girone, perché altrimenti il calendario non corrisponderebbe più ai gironi.
- **Calendario automatico:** lo staff inserisce
  - data della prima serata,
  - ora d'inizio (default `20:00`),
  - minuti tra una partita e l'altra (default `50`),
  - partite per serata (default `4`),
  - giorni della settimana in cui si gioca (caselle, tutte spuntate di default).
- **Partite già presenti:** se una partita di girone ha già eventi oppure stato diverso da `programmata`, la generazione è bloccata. Altrimenti si chiede conferma e le partite di girone esistenti vengono sostituite. Le partite della fase finale non vengono mai toccate.

## Approccio

Funzioni pure in `src/lib/calc/gironi.js`, con test come le altre in `calc/`. Scrittura atomica con `writeBatch` in `api.js`. Pulsanti nelle schede admin esistenti. Ordine corretto in `ordinaPerData` (`util.js`), che usano tutte le viste.

Scartati: calcoli dentro i componenti (non testabili); Cloud Function (piano a pagamento e deploy separato).

## Design

### `src/lib/calc/gironi.js`

- `sorteggiaGironi(squadre, nGironi, rand = Math.random) → { [squadraId]: lettera }`: mescola con Fisher–Yates usando `rand`, poi l'i-esima squadra mescolata va nel girone `LETTERE[i % nGironi]`.
- `giornateGirone(ids) → Array<Array<[casaId, ospiteId]>>`: metodo del cerchio. Con un numero dispari si aggiunge un riposo (`null`) e le partite col riposo si scartano. Casa e ospite si alternano tra le giornate.
- `ordinePartite(squadre) → Array<{girone, giornata, casaId, ospiteId}>`: giornata 1 di tutti i gironi (in ordine alfabetico), poi giornata 2, e così via.
- `programma(lista, { inizio, ora, minuti, perSerata, giorni }) → Array<{...item, dataOra: Date}>`: riempie le serate in ordine. Si passa alla serata successiva quando:
  - la serata è piena (`perSerata`), oppure
  - una delle due squadre gioca già in quella serata (nessuna squadra gioca due volte la stessa sera).

  Le serate valide sono solo i giorni della settimana in `giorni` (0 = domenica, come `Date#getDay`). L'orario è `ora + k·minuti` per la k-esima partita della serata.

  *shortcut: le date sono costruite nell'ora locale del browser (staff in Italia). Se servisse un fuso esplicito, convertire con Europe/Rome.*

### `src/lib/api.js`

- `assegnaGironi(anno, mappa)`: batch di `update` di `girone` sulle squadre.
- `sostituisciPartiteGirone(anno, daEliminare: id[], nuove: partita[])`: batch che elimina e crea. Le partite nuove hanno lo stesso formato di `Calendario.nuova()`: `fase: 'girone'`, `stato: 'programmata'`, `eventi: []`, `rigori: null`, `prossima: null`, `campo: ''`.

### UI

- **Squadre:** riquadro "Sorteggio gironi" con il numero di gironi (default 4, minimo 1, massimo il numero di squadre) e il pulsante "Sorteggia". È disabilitato con un messaggio se esistono partite di girone. Chiede conferma ("Riassegnare il girone di tutte le N squadre?").
- **Calendario:** riquadro "Genera partite dei gironi" con i campi delle regole e un'anteprima ("24 partite su 6 serate, dal … al …"). Il pulsante "Genera" rispetta la regola sulle partite già presenti.
- **Partite e Calendario:** `ordinaPerData` ordina le partite senza data per turno e poi per `slot`.
- **Schede Gironi | Fase finale (richiesta dell'utente):**
  - **Partite (pubblica):** due schede. Gironi mostra la lista per giorno di oggi, solo con le partite `fase: 'girone'`. Fase finale mostra le partite `fase: 'eliminazione'` raggruppate per turno, nell'ordine Ottavi → Quarti → Semifinale → 3° posto → Finale. All'apertura è attiva Fase finale se esistono partite a eliminazione e tutte quelle di girone sono `finita`, altrimenti Gironi. Le partite live restano in cima, sopra le schede. Senza partite a eliminazione la scheda Fase finale non compare.
  - **Gestione → Calendario:** stesse due schede. Gironi contiene il riquadro "Genera partite" e la lista. Fase finale contiene la lista delle partite del tabellone, da cui modificare data e ora.
- **Modifiche a mano senza vincoli:** la regola "nessuna squadra due volte la stessa sera" vale solo per `programma`. Il form di Calendario non aggiunge nessun controllo del genere.

## Test

- `gironi.test.js`:
  - il sorteggio è bilanciato con 16/4 e 10/3 e non perde squadre;
  - il round robin con 4 squadre dà 3 giornate da 2, con ogni coppia una sola volta; con 5 squadre dà 5 giornate e 10 partite;
  - `programma` rispetta `perSerata`, salta i giorni non spuntati, nessuna squadra gioca due volte nella stessa serata, l'orario cresce di `minuti`.
- `util` (`ordinaPerData`): Finale dopo Semifinale dopo Quarti quando le partite non hanno data.
- Verifica sull'emulatore: sorteggio, generazione, poi la vista Partite.

## Lasciato al builder

- Layout dei due riquadri, nello stile delle schede admin esistenti.
- Testo esatto dell'anteprima.
