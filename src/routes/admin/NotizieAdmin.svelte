<script>
  import { getContext } from 'svelte'
  import { saveNotizia, deleteNotizia } from '../../lib/api.js'
  import { perInputData } from '../../lib/util.js'
  import { formatDataOra } from '../../lib/format.js'

  const ed = getContext('ed')
  const elenco = $derived([...ed.notizie].sort((a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0)))
  const nuova = () => ({ titolo: '', testo: '', quando: perInputData(new Date()) })

  let bozza = $state(nuova())
  let errore = $state('')

  async function salva(e) {
    e.preventDefault()
    errore = ''
    const { quando, data, ...resto } = $state.snapshot(bozza)
    try {
      await saveNotizia(ed.anno, { ...resto, titolo: resto.titolo.trim(), data: new Date(quando) })
      bozza = nuova()
    } catch (err) {
      errore = err.message
    }
  }

  const modifica = (n) => { bozza = { ...$state.snapshot(n), quando: perInputData(n.data) }; errore = '' }

  async function elimina(n) {
    if (!confirm(`Eliminare la notizia "${n.titolo}"?`)) return
    errore = ''
    try {
      await deleteNotizia(ed.anno, n.id)
      if (bozza.id === n.id) bozza = nuova()
    } catch (err) {
      errore = err.message
    }
  }
</script>

<form class="form" onsubmit={salva}>
  <h2>{bozza.id ? 'Modifica notizia' : 'Nuova notizia'}</h2>
  <label class="campo-form">Titolo <input required bind:value={bozza.titolo} /></label>
  <label class="campo-form">Testo <textarea rows="5" required bind:value={bozza.testo}></textarea></label>
  <label class="campo-form">Pubblicata il <input type="datetime-local" required bind:value={bozza.quando} />
    <span class="small muted">In home compare la notizia con la data più recente.</span></label>
  {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
  <div class="azioni">
    <button class="btn primario">{bozza.id ? 'Salva modifiche' : 'Pubblica notizia'}</button>
    {#if bozza.id}<button type="button" class="btn" onclick={() => (bozza = nuova())}>Annulla</button>{/if}
  </div>
</form>

<section class="sezione">
  <h2>Notizie</h2>
  {#if !elenco.length}
    <p class="vuoto">Nessuna notizia pubblicata.</p>
  {:else}
    <ul class="lista">
      {#each elenco as n (n.id)}
        <li class="voce-admin">
          <div class="voce"><strong>{n.titolo}</strong><span class="small muted">{formatDataOra(n.data)}</span></div>
          <div class="azioni">
            <button class="btn" onclick={() => modifica(n)}>Modifica</button>
            <button class="btn pericolo" onclick={() => elimina(n)}>Elimina</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .voce { display: grid; min-width: 0; }
</style>
