<script>
  import { getContext } from 'svelte'
  import { saveSponsor, deleteSponsor } from '../../lib/api.js'
  import { resizeLogo } from '../../lib/image.js'
  import { normalizzaSito } from '../../lib/format.js'

  const ed = getContext('ed')
  const elenco = $derived([...ed.sponsor].sort((a, b) => (a.creato?.getTime?.() ?? 0) - (b.creato?.getTime?.() ?? 0)))
  const nuovo = () => ({ nome: '', logo: '', sito: '' })

  let bozza = $state(nuovo())
  let errore = $state('')

  async function caricaLogo(e) {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    errore = ''
    try { bozza.logo = await resizeLogo(file, 320) } catch (err) { errore = err.message }
  }

  async function salva(e) {
    e.preventDefault()
    errore = ''
    const sito = normalizzaSito(bozza.sito)
    if (bozza.sito?.trim() && !sito) { errore = 'Indirizzo del sito non valido.'; return }
    const { creato, ...dati } = $state.snapshot(bozza)
    try {
      await saveSponsor(ed.anno, { ...dati, nome: dati.nome.trim(), sito, ...(dati.id ? {} : { creato: new Date() }) })
      bozza = nuovo()
    } catch (err) {
      errore = err.message
    }
  }

  async function elimina(s) {
    if (!confirm(`Eliminare lo sponsor ${s.nome}?`)) return
    errore = ''
    try {
      await deleteSponsor(ed.anno, s.id)
      if (bozza.id === s.id) bozza = nuovo()
    } catch (err) {
      errore = err.message
    }
  }
</script>

<form class="form" onsubmit={salva}>
  <h2>{bozza.id ? 'Modifica sponsor' : 'Nuovo sponsor'}</h2>
  <label class="campo-form">Nome <input required bind:value={bozza.nome} /></label>
  <div class="logo">
    {#if bozza.logo}<img src={bozza.logo} alt="" width="100" height="56" />{/if}
    <label class="campo-form">Logo <input type="file" accept="image/*" onchange={caricaLogo} /></label>
    {#if bozza.logo}<button type="button" class="btn" onclick={() => (bozza.logo = '')}>Togli logo</button>{/if}
  </div>
  <label class="campo-form">Sito web <input inputmode="url" placeholder="www.esempio.it" bind:value={bozza.sito} />
    <span class="small muted">Facoltativo: toccando il logo in home si apre questo sito.</span></label>
  {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
  <div class="azioni">
    <button class="btn primario">{bozza.id ? 'Salva modifiche' : 'Aggiungi sponsor'}</button>
    {#if bozza.id}<button type="button" class="btn" onclick={() => (bozza = nuovo())}>Annulla</button>{/if}
  </div>
</form>

<section class="sezione">
  <h2>Sponsor</h2>
  {#if !elenco.length}
    <p class="vuoto">Nessuno sponsor inserito.</p>
  {:else}
    <ul class="lista">
      {#each elenco as s (s.id)}
        <li class="voce-admin">
          <div class="voce">
            {#if s.logo}<img src={s.logo} alt="" width="56" height="32" />{/if}
            <span><strong>{s.nome}</strong>{#if s.sito}<br /><span class="small muted">{s.sito}</span>{/if}</span>
          </div>
          <div class="azioni">
            <button class="btn" onclick={() => (bozza = { ...nuovo(), ...$state.snapshot(s) })}>Modifica</button>
            <button class="btn pericolo" onclick={() => elimina(s)}>Elimina</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .logo { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .logo img { height: 56px; width: auto; max-width: 140px; object-fit: contain; }
  .voce { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .voce img { height: 32px; width: auto; max-width: 56px; object-fit: contain; flex: none; }
  .voce .muted { overflow-wrap: anywhere; }
</style>
