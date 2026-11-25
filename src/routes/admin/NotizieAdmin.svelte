<script>
  import { getContext } from 'svelte'
  import { saveNotizia, deleteNotizia } from '../../lib/api.js'
  import { perInputData } from '../../lib/util.js'
  import { formatDataOra } from '../../lib/format.js'
  import { pulisciHtml } from '../../lib/pulisci.js'
  import EditorNotizia from '../../components/EditorNotizia.svelte'

  const ed = getContext('ed')
  const elenco = $derived([...ed.notizie].sort((a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0)))
  const nuova = () => ({ titolo: '', html: '', quando: perInputData(new Date()) })
  let versione = $state(0) // cambia per ricreare l'editor con un'altra notizia

  let bozza = $state(nuova())
  let errore = $state('')

  async function salva(e) {
    e.preventDefault()
    errore = ''
    const { quando, data, testo, ...resto } = $state.snapshot(bozza)
    const html = pulisciHtml(resto.html)
    if (!html.trim()) { errore = 'Scrivi il testo della notizia.'; return }
    if (html.length > 900000) { errore = "La notizia è troppo pesante: togli un'immagine (max 3–4 foto)."; return }
    try {
      await saveNotizia(ed.anno, { ...resto, html, titolo: resto.titolo.trim(), data: new Date(quando) })
      bozza = nuova(); versione++
    } catch (err) {
      errore = err.message
    }
  }

  // Le notizie vecchie hanno solo `testo`: diventano un paragrafo.
  const comeHtml = (n) => n.html ?? (n.testo ? `<p>${n.testo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>` : '')
  const modifica = (n) => { bozza = { ...$state.snapshot(n), html: comeHtml(n), quando: perInputData(n.data) }; versione++; errore = '' }

  async function elimina(n) {
    if (!confirm(`Eliminare la notizia "${n.titolo}"?`)) return
    errore = ''
    try {
      await deleteNotizia(ed.anno, n.id)
      if (bozza.id === n.id) { bozza = nuova(); versione++ }
    } catch (err) {
      errore = err.message
    }
  }
</script>

<form class="form" onsubmit={salva}>
  <h2>{bozza.id ? 'Modifica notizia' : 'Nuova notizia'}</h2>
  <label class="campo-form">Titolo <input required bind:value={bozza.titolo} /></label>
  <div class="campo-form">
    <span>Testo</span>
    {#key versione}
      <EditorNotizia html={bozza.html} onchange={(h) => (bozza.html = h)} onerrore={(m) => (errore = m)} />
    {/key}
    <span class="small muted">Puoi inserire 3–4 foto: vengono ridotte in automatico.</span>
  </div>
  <label class="campo-form">Pubblicata il <input type="datetime-local" required bind:value={bozza.quando} />
    <span class="small muted">In home compare la notizia con la data più recente.</span></label>
  {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
  <div class="azioni">
    <button class="btn primario">{bozza.id ? 'Salva modifiche' : 'Pubblica notizia'}</button>
    {#if bozza.id}<button type="button" class="btn" onclick={() => { bozza = nuova(); versione++ }}>Annulla</button>{/if}
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
