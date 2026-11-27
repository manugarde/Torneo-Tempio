<script>
  import { getContext } from 'svelte'
  import TeamBadge from '../../components/TeamBadge.svelte'
  import { saveSquadra, deleteSquadra, nuovoId, assegnaGironi } from '../../lib/api.js'
  import { resizeLogo } from '../../lib/image.js'
  import { sorteggiaGironi } from '../../lib/calc/gironi.js'
  import { foglioDaSquadra, foglioTemplate, squadraDaFoglio, unisciSquadra } from '../../lib/excel.js'

  const ed = getContext('ed')
  const ordinate = $derived([...ed.squadre].sort((a, b) => (a.girone ?? '').localeCompare(b.girone ?? '') || a.nome.localeCompare(b.nome, 'it')))

  let bozza = $state(null)
  let errore = $state('')
  let salvataggio = $state(false)

  const nuova = () => ({ nome: '', girone: 'A', logo: '', giocatori: [] })
  const modifica = (s) => { bozza = structuredClone($state.snapshot(s)); errore = '' }

  async function caricaLogo(e) {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    errore = ''
    try { bozza.logo = await resizeLogo(file) } catch (err) { errore = err.message }
  }

  async function salva(e) {
    e.preventDefault()
    errore = ''
    salvataggio = true
    try {
      bozza.nome = bozza.nome.trim()
      bozza.girone = bozza.girone.trim().toUpperCase()
      bozza.giocatori = bozza.giocatori.filter((g) => g.nome.trim()).map((g) => ({ ...g, nome: g.nome.trim(), numero: g.numero === '' || g.numero == null ? null : Number(g.numero) }))
      await saveSquadra(ed.anno, bozza)
      bozza = null
    } catch (err) {
      errore = err.message
    } finally {
      salvataggio = false
    }
  }

  let nGironi = $state(4)
  let esitoSorteggio = $state('')
  const conPartiteGirone = $derived(ed.partite.some((p) => p.fase === 'girone'))

  async function sorteggia(e) {
    e.preventDefault()
    errore = ''
    esitoSorteggio = ''
    const n = Number(nGironi)
    if (!confirm(`Riassegnare a caso il girone di tutte le ${ed.squadre.length} squadre in ${n} gironi?`)) return
    try {
      await assegnaGironi(ed.anno, sorteggiaGironi(ed.squadre, n))
      esitoSorteggio = 'Gironi sorteggiati.'
    } catch (err) {
      errore = err.message
    }
  }

  // Librerie Excel caricate solo al click: non pesano sul resto del sito.
  const scrivi = () => import('write-excel-file/browser').then((m) => m.default)
  let importazione = $state(false)
  let esitoImport = $state('')
  let erroreImport = $state('')

  async function scaricaTemplate() {
    erroreImport = ''
    try { await (await scrivi())([foglioTemplate()]).toFile('modulo-squadra.xlsx') } catch (err) { erroreImport = err.message }
  }

  async function esporta() {
    erroreImport = ''
    const usati = new Set()
    try { await (await scrivi())(ordinate.map((s) => foglioDaSquadra(s, usati))).toFile(`squadre-${ed.anno}.xlsx`) } catch (err) { erroreImport = err.message }
  }

  async function importa(e) {
    const input = e.currentTarget
    const files = [...(input.files ?? [])]
    if (!files.length) return
    erroreImport = ''
    esitoImport = ''
    importazione = true
    const elenco = $state.snapshot(ed.squadre)
    let nuove = 0, aggiornate = 0
    const saltati = []
    try {
      const { default: leggi } = await import('read-excel-file/browser')
      for (const file of files) {
        let fogli
        try {
          // prima converte tutto il file: un errore non lascia salvataggi a metà
          fogli = (await leggi(file)).map((f) => ({ f, sq: squadraDaFoglio(f) }))
        } catch (err) {
          throw new Error(`${file.name}: ${err.message}`)
        }
        for (const { f, sq } of fogli) {
          if (!sq) { saltati.push(`${file.name} › ${f.sheet}`); continue }
          const { squadra, nuova } = unisciSquadra(elenco, sq, nuovoId)
          squadra.id = await saveSquadra(ed.anno, squadra)
          const i = elenco.findIndex((s) => s.id === squadra.id)
          if (i >= 0) elenco[i] = squadra; else elenco.push(squadra)
          nuova ? nuove++ : aggiornate++
        }
      }
    } catch (err) {
      erroreImport = err.message
    } finally {
      importazione = false
      input.value = ''
      esitoImport = `${nuove + aggiornate} squadre importate (${nuove} nuove, ${aggiornate} aggiornate).`
        + (saltati.length ? ` Fogli saltati senza nome squadra: ${saltati.join(', ')}.` : '')
    }
  }

  async function elimina() {
    const giocate = ed.partite.some((p) => p.casaId === bozza.id || p.ospiteId === bozza.id)
    if (!confirm(`Eliminare ${bozza.nome}?${giocate ? ' Ha partite in calendario: resteranno senza squadra.' : ''}`)) return
    await deleteSquadra(ed.anno, bozza.id)
    bozza = null
  }
</script>

{#if bozza}
  <form class="form" onsubmit={salva}>
    <h2>{bozza.id ? 'Modifica squadra' : 'Nuova squadra'}</h2>
    <div class="form-riga">
      <label class="campo-form">Nome <input required bind:value={bozza.nome} /></label>
      <label class="campo-form">Girone <input required maxlength="2" bind:value={bozza.girone} /></label>
    </div>
    <div class="logo">
      <TeamBadge squadra={{ ...bozza, nome: bozza.nome || '?' }} size="lg" nome={false} link={false} />
      <label class="campo-form">Logo <input type="file" accept="image/*" onchange={caricaLogo} /></label>
      {#if bozza.logo}<button type="button" class="btn" onclick={() => (bozza.logo = '')}>Togli logo</button>{/if}
    </div>

    <fieldset>
      <legend>Rosa</legend>
      {#each bozza.giocatori as g, i (g.id)}
        <div class="giocatore">
          <input aria-label="Numero" class="num" inputmode="numeric" placeholder="N." bind:value={g.numero} />
          <input aria-label="Nome giocatore" placeholder="Nome e cognome" bind:value={g.nome} />
          <button type="button" class="btn pericolo" aria-label="Togli {g.nome}" onclick={() => bozza.giocatori.splice(i, 1)}>✕</button>
        </div>
      {/each}
      <button type="button" class="btn" onclick={() => bozza.giocatori.push({ id: nuovoId(), nome: '', numero: '' })}>Aggiungi giocatore</button>
    </fieldset>

    {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
    <div class="azioni">
      <button class="btn primario" disabled={salvataggio}>Salva squadra</button>
      <button type="button" class="btn" onclick={() => (bozza = null)}>Annulla</button>
      {#if bozza.id}<button type="button" class="btn pericolo" onclick={elimina}>Elimina</button>{/if}
    </div>
  </form>
{:else}
  <button class="btn primario" onclick={() => modifica(nuova())}>Nuova squadra</button>
  <div class="form">
    <h2>Importa da Excel</h2>
    <p class="small muted">Un foglio per squadra: nome squadra in alto, poi n° maglia e nome e cognome. Le squadre già presenti vengono aggiornate (logo e girone restano).</p>
    <div class="excel">
      <button type="button" class="btn" onclick={scaricaTemplate}>Scarica template</button>
      <label class="btn" class:disabilitato={importazione}>
        {importazione ? 'Importazione…' : 'Importa'}
        <input type="file" accept=".xlsx" multiple hidden disabled={importazione} onchange={importa} />
      </label>
      {#if ordinate.length}<button type="button" class="btn" onclick={esporta}>Esporta squadre</button>{/if}
    </div>
    {#if esitoImport}<p role="status">{esitoImport}</p>{/if}
    {#if erroreImport}<p class="errore" role="alert">{erroreImport}</p>{/if}
  </div>
  {#if ordinate.length > 1}
    <form class="form" onsubmit={sorteggia}>
      <h2>Sorteggio gironi</h2>
      <div class="sorteggio">
        <label class="campo-form">Numero di gironi
          <input type="number" min="1" max={ordinate.length} required bind:value={nGironi} disabled={conPartiteGirone} />
        </label>
        <button class="btn" disabled={conPartiteGirone}>Sorteggia</button>
      </div>
      {#if conPartiteGirone}
        <p class="small muted">Ci sono già partite dei gironi: eliminale da Calendario per rifare il sorteggio.</p>
      {/if}
      {#if esitoSorteggio}<p role="status">{esitoSorteggio}</p>{/if}
      {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
    </form>
  {/if}
  {#if !ordinate.length}
    <p class="vuoto">Nessuna squadra. Aggiungi la prima per comporre i gironi.</p>
  {:else}
    <ul class="lista">
      {#each ordinate as s (s.id)}
        <li class="voce-admin">
          <TeamBadge squadra={s} link={false} />
          <span class="small muted">Girone {s.girone} · {s.giocatori?.length ?? 0} giocatori</span>
          <button class="btn" onclick={() => modifica(s)}>Modifica</button>
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<style>
  .sorteggio { display: flex; align-items: end; gap: 10px; }
  .sorteggio .campo-form { flex: 1; }
  .excel { display: flex; gap: 10px; flex-wrap: wrap; }
  .disabilitato { opacity: .6; pointer-events: none; }
  .logo { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  fieldset { display: grid; gap: 8px; border: 1px solid var(--linea); border-radius: var(--r-s); }
  .giocatore { display: grid; grid-template-columns: 64px 1fr 44px; gap: 6px; }
  .giocatore input { min-height: 44px; padding: 6px 8px; border: 1px solid var(--linea); border-radius: var(--r-s); background: var(--granito); }
</style>
