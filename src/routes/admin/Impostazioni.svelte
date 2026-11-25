<script>
  import { getContext } from 'svelte'
  import { saveImpostazioni, createEdizione, setEdizioneCorrente } from '../../lib/api.js'
  import { useMeta } from '../../lib/store.svelte.js'

  const ed = getContext('ed')
  const meta = useMeta()

  let imp = $state(structuredClone($state.snapshot(ed.impostazioni)))
  let errore = $state('')
  let messaggio = $state('')
  let nuovoAnno = $state(String(Number(ed.anno) + 1))
  let copiaDa = $state(ed.anno)

  const CRITERI = { differenzaReti: 'Differenza reti', golFatti: 'Gol fatti', scontroDiretto: 'Scontro diretto' }

  function sposta(i, d) {
    const c = imp.criteriParita
    ;[c[i], c[i + d]] = [c[i + d], c[i]]
  }

  async function salva(e) {
    e.preventDefault()
    errore = ''
    const n = (v) => Number(v)
    try {
      await saveImpostazioni(ed.anno, {
        ...imp,
        punti: { vittoria: n(imp.punti.vittoria), pareggio: n(imp.punti.pareggio), sconfitta: n(imp.punti.sconfitta) },
        qualificatiPerGirone: n(imp.qualificatiPerGirone),
        squalifiche: { ...imp.squalifiche, sogliaGialli: n(imp.squalifiche.sogliaGialli), partiteRosso: n(imp.squalifiche.partiteRosso) },
      })
      messaggio = 'Impostazioni salvate.'
    } catch (err) {
      errore = err.message
    }
  }

  async function nuovaEdizione(e) {
    e.preventDefault()
    errore = ''
    if (meta.edizioni.includes(nuovoAnno)) { errore = `L'edizione ${nuovoAnno} esiste già.`; return }
    try {
      await createEdizione(nuovoAnno, { copiaDa: copiaDa || undefined })
      messaggio = `Edizione ${nuovoAnno} creata. Rendila corrente quando è pronta.`
    } catch (err) {
      errore = err.message
    }
  }

  async function rendiCorrente(anno) {
    if (!confirm(`Mostrare a tutti l'edizione ${anno}?`)) return
    await setEdizioneCorrente(anno)
    location.hash = '#/'
  }
</script>

<form class="form" onsubmit={salva}>
  <h2>Edizione {ed.anno}</h2>
  <label class="campo-form">Nome del torneo <input required bind:value={imp.nome} /></label>

  <fieldset class="form-riga">
    <legend>Punti</legend>
    <label class="campo-form">Vittoria <input type="number" min="0" bind:value={imp.punti.vittoria} /></label>
    <label class="campo-form">Pareggio <input type="number" min="0" bind:value={imp.punti.pareggio} /></label>
    <label class="campo-form">Sconfitta <input type="number" min="0" bind:value={imp.punti.sconfitta} /></label>
  </fieldset>

  <fieldset>
    <legend>Ordine criteri a parità di punti</legend>
    <ol class="criteri">
      {#each imp.criteriParita as c, i (c)}
        <li>
          <span>{CRITERI[c]}</span>
          <button type="button" class="btn" disabled={i === 0} aria-label="Sposta su {CRITERI[c]}" onclick={() => sposta(i, -1)}>↑</button>
          <button type="button" class="btn" disabled={i === imp.criteriParita.length - 1} aria-label="Sposta giù {CRITERI[c]}" onclick={() => sposta(i, 1)}>↓</button>
        </li>
      {/each}
    </ol>
  </fieldset>

  <label class="campo-form">Squadre qualificate per girone <input type="number" min="1" bind:value={imp.qualificatiPerGirone} /></label>

  <fieldset class="form-riga">
    <legend>Squalifiche</legend>
    <label class="campo-form">Modo
      <select bind:value={imp.squalifiche.modo}>
        <option value="auto">Automatico dai cartellini</option>
        <option value="manuale">Solo manuale</option>
      </select>
    </label>
    {#if imp.squalifiche.modo === 'auto'}
      <label class="campo-form">Gialli per 1 turno di stop <input type="number" min="1" bind:value={imp.squalifiche.sogliaGialli} /></label>
      <label class="campo-form">Turni di stop per un rosso <input type="number" min="1" bind:value={imp.squalifiche.partiteRosso} /></label>
      <label class="check"><input type="checkbox" bind:checked={imp.squalifiche.azzeraGialliFaseFinale} /> Azzera i gialli prima della fase finale</label>
    {/if}
  </fieldset>

  {#if messaggio}<p role="status">{messaggio}</p>{/if}
  {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
  <button class="btn primario">Salva impostazioni</button>
</form>

<form class="form" onsubmit={nuovaEdizione}>
  <h2>Edizioni</h2>
  <ul class="edizioni">
    {#each meta.edizioni as a (a)}
      <li>
        <a href="#/?ed={a}">{a}</a>
        {#if a === meta.corrente}<span class="small muted">corrente</span>
        {:else}<button type="button" class="btn" onclick={() => rendiCorrente(a)}>Rendi corrente</button>{/if}
      </li>
    {/each}
  </ul>
  <div class="form-riga">
    <label class="campo-form">Nuova edizione <input inputmode="numeric" pattern={'[0-9]{4}'} required bind:value={nuovoAnno} /></label>
    <label class="campo-form">Copia squadre e rose da
      <select bind:value={copiaDa}>
        <option value="">Nessuna (parti vuoto)</option>
        {#each meta.edizioni as a (a)}<option value={a}>{a}</option>{/each}
      </select>
    </label>
  </div>
  <button class="btn">Crea edizione {nuovoAnno}</button>
</form>

<style>
  fieldset { border: 1px solid var(--linea); border-radius: var(--r-s); }
  .criteri { margin: 0; padding-left: 1.4em; display: grid; gap: 6px; }
  .criteri li { display: flex; align-items: center; gap: 6px; }
  .criteri span { flex: 1; }
  .criteri .btn { min-height: 40px; padding: 4px 12px; }
  .check { display: flex; align-items: center; gap: 8px; min-height: 44px; }
  .check input { width: 22px; height: 22px; }
  .edizioni { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .edizioni li { display: flex; align-items: center; gap: 12px; }
</style>
