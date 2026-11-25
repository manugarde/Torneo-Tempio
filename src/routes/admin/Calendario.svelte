<script>
  import { getContext } from 'svelte'
  import MatchRow from '../../components/MatchRow.svelte'
  import { savePartita, deletePartita } from '../../lib/api.js'
  import { perId, ordinaPerData, perInputData } from '../../lib/util.js'
  import { formatDataOra } from '../../lib/format.js'

  const ed = getContext('ed')
  const squadre = $derived(perId(ed.squadre))
  const gironi = $derived([...new Set(ed.squadre.map((s) => s.girone))].sort())
  const partite = $derived(ordinaPerData(ed.partite))

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
  <button class="btn primario" disabled={!gironi.length} onclick={() => (bozza = nuova())}>Nuova partita</button>
  {#if !gironi.length}<p class="small muted">Prima inserisci le squadre.</p>{/if}
  {#if !partite.length}
    <p class="vuoto">Nessuna partita in calendario.</p>
  {:else}
    <ul class="lista">
      {#each partite as p (p.id)}
        <li class="voce-admin">
          <div class="riga-partita"><MatchRow partita={p} {squadre} mostraData={formatDataOra(p.dataOra)} /></div>
          <button class="btn" onclick={() => modifica(p)}>Modifica</button>
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<style>
  .riga-partita { flex: 1; pointer-events: none; }
  .riga-partita :global(.riga) { padding: 0; grid-template-columns: 92px 1fr; }
</style>
