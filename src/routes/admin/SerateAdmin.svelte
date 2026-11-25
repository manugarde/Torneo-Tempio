<script>
  import { getContext } from 'svelte'
  import { saveSerata, deleteSerata } from '../../lib/api.js'
  import { formatGiorno, dataGiorno } from '../../lib/format.js'

  const ed = getContext('ed')
  const serate = $derived([...ed.serate].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? '')))
  const nuova = () => ({ data: '', fase: '', menu: '', musica: '', note: '' })

  let bozza = $state(nuova())
  let errore = $state('')

  async function salva(e) {
    e.preventDefault()
    errore = ''
    try {
      await saveSerata(ed.anno, $state.snapshot(bozza))
      bozza = nuova()
    } catch (err) {
      errore = err.message
    }
  }

  async function elimina(s) {
    if (!confirm(`Eliminare la serata del ${formatGiorno(dataGiorno(s.data))}?`)) return
    errore = ''
    try {
      await deleteSerata(ed.anno, s.id)
      if (bozza.id === s.id) bozza = nuova()
    } catch (err) {
      errore = err.message
    }
  }
</script>

<form class="form" onsubmit={salva}>
  <h2>{bozza.id ? 'Modifica serata' : 'Nuova serata'}</h2>
  <div class="form-riga">
    <label class="campo-form">Data <input type="date" required bind:value={bozza.data} /></label>
    <label class="campo-form">Fase <input bind:value={bozza.fase} placeholder="Fase a gironi" /></label>
  </div>
  <label class="campo-form">Si mangia <textarea rows="3" bind:value={bozza.menu}></textarea></label>
  <label class="campo-form">Musica <input bind:value={bozza.musica} placeholder="DJ, band…" /></label>
  <label class="campo-form">Note <textarea rows="2" bind:value={bozza.note}></textarea></label>
  {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
  <div class="azioni">
    <button class="btn primario">{bozza.id ? 'Salva modifiche' : 'Aggiungi serata'}</button>
    {#if bozza.id}<button type="button" class="btn" onclick={() => (bozza = nuova())}>Annulla</button>{/if}
  </div>
</form>

<section class="sezione">
  <h2>Serate</h2>
  {#if !serate.length}
    <p class="vuoto">Nessuna serata inserita.</p>
  {:else}
    <ul class="lista">
      {#each serate as s (s.id)}
        <li class="voce-admin">
          <div>
            <strong class="giorno">{formatGiorno(dataGiorno(s.data))}</strong>
            {#if s.fase}<span class="small muted">{s.fase}</span>{/if}
          </div>
          <div class="azioni">
            <button class="btn" onclick={() => (bozza = { ...nuova(), ...s })}>Modifica</button>
            <button class="btn pericolo" onclick={() => elimina(s)}>Elimina</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .voce-admin > div:first-child { display: grid; }
  .giorno::first-letter { text-transform: uppercase; }
</style>
