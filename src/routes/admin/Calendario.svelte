<script>
  import { getContext } from 'svelte'
  import MatchRow from '../../components/MatchRow.svelte'
  import { savePartita, deletePartita, sostituisciPartiteGirone } from '../../lib/api.js'
  import { ordinePartite, programma, generazioneBloccata } from '../../lib/calc/gironi.js'
  import { perId, ordinaPerData, perInputData } from '../../lib/util.js'
  import { formatDataOra, formatGiorno } from '../../lib/format.js'

  const ed = getContext('ed')
  const squadre = $derived(perId(ed.squadre))
  const gironi = $derived([...new Set(ed.squadre.map((s) => s.girone))].sort())
  const partite = $derived(ordinaPerData(ed.partite))
  let scheda = $state('girone')
  const elenco = $derived(partite.filter((p) => (p.fase === 'eliminazione') === (scheda === 'eliminazione')))
  const haFinali = $derived(ed.partite.some((p) => p.fase === 'eliminazione'))

  // Genera partite dei gironi
  const GIORNI = [['Lun', 1], ['Mar', 2], ['Mer', 3], ['Gio', 4], ['Ven', 5], ['Sab', 6], ['Dom', 0]]
  let gen = $state({ inizio: '', ora: '20:00', minuti: 50, perSerata: 4, giorni: [0, 1, 2, 3, 4, 5, 6] })
  let esitoGen = $state('')
  const opzioni = $derived({ ...gen, minuti: Number(gen.minuti), perSerata: Number(gen.perSerata) })
  const anteprima = $derived.by(() => {
    if (!gen.inizio) return { testo: 'Scegli la data della prima serata.' }
    try {
      const lista = programma(ordinePartite(ed.squadre.filter((s) => s.girone)), opzioni)
      if (!lista.length) return { testo: 'Servono almeno due squadre per girone.' }
      const serate = new Set(lista.map((p) => p.dataOra.toDateString())).size
      return { lista, testo: `${lista.length} partite su ${serate} serate, da ${formatGiorno(lista[0].dataOra)} a ${formatGiorno(lista.at(-1).dataOra)}.` }
    } catch (err) {
      return { testo: err.message }
    }
  })
  // Ora d'inizio dell'ultima partita di una serata piena.
  const ultimaOra = $derived.by(() => {
    const [h, m] = (gen.ora || '00:00').split(':').map(Number)
    const t = h * 60 + m + (Number(gen.perSerata) - 1) * Number(gen.minuti)
    return `alle ${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  })
  const giornoAttivo = (g) => gen.giorni.includes(g)
  const cambiaGiorno = (g) => { gen.giorni = giornoAttivo(g) ? gen.giorni.filter((x) => x !== g) : [...gen.giorni, g] }

  async function genera(e) {
    e.preventDefault()
    errore = ''
    esitoGen = ''
    if (!anteprima.lista) return
    if (generazioneBloccata(ed.partite)) { errore = 'Alcune partite dei gironi sono già iniziate o giocate: non si possono rigenerare.'; return }
    const esistenti = ed.partite.filter((p) => p.fase === 'girone').map((p) => p.id)
    if (esistenti.length && !confirm(`Sostituire le ${esistenti.length} partite dei gironi già in calendario?`)) return
    const nuove = anteprima.lista.map(({ girone, casaId, ospiteId, dataOra }) => ({
      fase: 'girone', girone, casaId, ospiteId, dataOra, campo: '', stato: 'programmata', eventi: [], rigori: null, prossima: null,
    }))
    try {
      await sostituisciPartiteGirone(ed.anno, esistenti, nuove)
      esitoGen = `${nuove.length} partite create.`
    } catch (err) {
      errore = err.message
    }
  }

  // Cambio rapido di data e ora dall'elenco, senza aprire la modifica.
  const cambiaData = (p, valore) => savePartita(ed.anno, { id: p.id, dataOra: valore ? new Date(valore) : null }).catch((e) => { errore = e.message })

  let bozza = $state(null)
  let errore = $state('')

  const nuova = () => ({ fase: 'girone', girone: gironi[0] ?? 'A', casaId: '', ospiteId: '', data: '', campo: '', stato: 'programmata', eventi: [], rigori: null, prossima: null })
  function modifica(p) {
    const { dataOra, ...resto } = $state.snapshot(p)
    bozza = { ...resto, data: perInputData(p.dataOra) }
    errore = ''
  }
  const candidate = $derived(bozza?.fase === 'girone' ? ed.squadre.filter((s) => s.girone === bozza.girone) : ed.squadre)

  async function salva(e) {
    e.preventDefault()
    errore = ''
    if (bozza.casaId && bozza.casaId === bozza.ospiteId) { errore = 'Scegli due squadre diverse.'; return }
    const { data, ...p } = bozza
    try {
      await savePartita(ed.anno, { ...p, casaId: p.casaId || null, ospiteId: p.ospiteId || null, dataOra: new Date(data) })
      bozza = null
    } catch (err) {
      errore = err.message
    }
  }

  async function elimina() {
    if (bozza.eventi?.length && !confirm('La partita ha eventi registrati. Eliminarla comunque?')) return
    if (!bozza.eventi?.length && !confirm('Eliminare la partita?')) return
    await deletePartita(ed.anno, bozza.id)
    bozza = null
  }
</script>

{#if bozza}
  <form class="form" onsubmit={salva}>
    <h2>{bozza.id ? 'Modifica partita' : 'Nuova partita di girone'}</h2>
    {#if bozza.fase === 'girone'}
      <label class="campo-form">Girone
        <select bind:value={bozza.girone}>{#each gironi as g (g)}<option value={g}>Girone {g}</option>{/each}</select>
      </label>
    {:else}
      <p class="muted">{bozza.turno} (fase finale)</p>
    {/if}
    <div class="form-riga">
      {#each [['casaId', 'Casa'], ['ospiteId', 'Ospite']] as [campo, etichetta] (campo)}
        <label class="campo-form">{etichetta}
          <select required={bozza.fase === 'girone'} bind:value={bozza[campo]}>
            <option value="">Da definire</option>
            {#each candidate as s (s.id)}<option value={s.id}>{s.nome}</option>{/each}
          </select>
        </label>
      {/each}
    </div>
    <div class="form-riga">
      <label class="campo-form">Data e ora <input type="datetime-local" required bind:value={bozza.data} /></label>
      <label class="campo-form">Campo <input placeholder="Campo 1" bind:value={bozza.campo} /></label>
    </div>
    {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
    <div class="azioni">
      <button class="btn primario">Salva partita</button>
      <button type="button" class="btn" onclick={() => (bozza = null)}>Annulla</button>
      {#if bozza.id}<button type="button" class="btn pericolo" onclick={elimina}>Elimina</button>{/if}
    </div>
  </form>
{:else}
  <div class="schede" role="tablist" aria-label="Fase">
    <button role="tab" aria-selected={scheda === 'girone'} onclick={() => (scheda = 'girone')}>Gironi</button>
    <button role="tab" aria-selected={scheda === 'eliminazione'} onclick={() => (scheda = 'eliminazione')}>Fase finale</button>
  </div>

  {#if scheda === 'girone'}
    <form class="form" onsubmit={genera}>
      <h2>Genera partite dei gironi</h2>
      <p class="small muted">Ogni squadra incontra tutte le altre del suo girone. Le date si possono poi cambiare a mano.</p>
      <div class="form-riga">
        <label class="campo-form">Prima serata <input type="date" required bind:value={gen.inizio} /></label>
        <label class="campo-form">Inizio <input type="time" required bind:value={gen.ora} /></label>
        <label class="campo-form">Minuti da un inizio al successivo <input type="number" min="10" required bind:value={gen.minuti} /></label>
        <label class="campo-form">Partite a serata <input type="number" min="1" required bind:value={gen.perSerata} /></label>
      </div>
      <p class="small muted">Durata della partita più la pausa. L'ultima partita della serata inizia {ultimaOra}.</p>
      <fieldset class="giorni">
        <legend>Si gioca</legend>
        {#each GIORNI as [nome, g] (g)}
          <label class="check"><input type="checkbox" checked={giornoAttivo(g)} onchange={() => cambiaGiorno(g)} /> {nome}</label>
        {/each}
      </fieldset>
      <p class="small" role="status">{anteprima.testo}</p>
      {#if esitoGen}<p role="status">{esitoGen}</p>{/if}
      {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
      <button class="btn primario" disabled={!anteprima.lista}>Genera partite</button>
    </form>
    <button class="btn" disabled={!gironi.length} onclick={() => (bozza = nuova())}>Nuova partita a mano</button>
    {#if !gironi.length}<p class="small muted">Prima inserisci le squadre.</p>{/if}
  {:else if !haFinali}
    <p class="small muted">Il tabellone si crea da Gestione → Tabellone.</p>
  {/if}

  {#if !elenco.length}
    <p class="vuoto">Nessuna partita in calendario.</p>
  {:else}
    <ul class="lista">
      {#each elenco as p (p.id)}
        <li class="voce-admin">
          <div class="riga-partita"><MatchRow partita={p} {squadre} mostraData={formatDataOra(p.dataOra)} /></div>
          <input class="data" type="datetime-local" aria-label="Data e ora" value={perInputData(p.dataOra)} onchange={(e) => cambiaData(p, e.currentTarget.value)} />
          <button class="btn" onclick={() => modifica(p)}>Modifica</button>
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<style>
  .schede { display: flex; gap: 6px; }
  .schede button {
    flex: none; min-height: 40px; padding: 6px 14px; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--linea); background: var(--superficie); font-weight: 600;
  }
  .schede button[aria-selected='true'] { background: var(--ardesia); color: var(--granito); border-color: var(--ardesia); }
  .giorni { display: flex; flex-wrap: wrap; gap: 4px 14px; border: 1px solid var(--linea); border-radius: var(--r-s); }
  .check { display: flex; align-items: center; gap: 6px; min-height: 44px; }
  .check input { width: 20px; height: 20px; }
  .data { min-height: 40px; padding: 4px 6px; border: 1px solid var(--linea); border-radius: var(--r-s); background: var(--superficie); max-width: 190px; }
  .voce-admin { flex-wrap: wrap; }
  .riga-partita { flex: 1 1 220px; pointer-events: none; }
  .riga-partita :global(.riga) { padding: 0; grid-template-columns: 92px 1fr; }
</style>
