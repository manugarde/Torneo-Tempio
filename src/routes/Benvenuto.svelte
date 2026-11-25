<script>
  import LoginDialog from '../components/LoginDialog.svelte'
  import { createEdizione, setEdizioneCorrente } from '../lib/api.js'

  /** Nessuna edizione pubblicata: primo avvio del sito. */
  /** @type {{ staff: boolean }} */
  let { staff } = $props()

  let login = $state(false)
  let anno = $state(String(new Date().getFullYear()))
  let errore = $state('')

  async function crea(e) {
    e.preventDefault()
    errore = ''
    try {
      await createEdizione(anno)
      await setEdizioneCorrente(anno)
    } catch (err) {
      errore = err.message
    }
  }
</script>

<main class="pagina">
  <h1>Torneo Tempio</h1>
  {#if staff}
    <form class="sezione" onsubmit={crea}>
      <p>Non c'è ancora nessuna edizione. Creala per iniziare a inserire squadre e partite.</p>
      <label class="campo-form">Anno <input inputmode="numeric" pattern="[0-9]{4}" required bind:value={anno} /></label>
      <button class="btn primario">Crea edizione {anno}</button>
      {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
    </form>
  {:else}
    <p class="vuoto">Il torneo non è ancora stato pubblicato. Torna a trovarci presto.</p>
    <button class="btn" onclick={() => (login = true)}>Area staff</button>
  {/if}
</main>
{#if login}<LoginDialog onchiudi={() => (login = false)} />{/if}
