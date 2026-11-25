<script>
  import { getContext } from 'svelte'
  import TeamBadge from '../../components/TeamBadge.svelte'
  import { saveSquadra, deleteSquadra, nuovoId } from '../../lib/api.js'
  import { resizeLogo } from '../../lib/image.js'

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
  .logo { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  fieldset { display: grid; gap: 8px; border: 1px solid var(--linea); border-radius: var(--r-s); }
  .giocatore { display: grid; grid-template-columns: 64px 1fr 44px; gap: 6px; }
  .giocatore input { min-height: 44px; padding: 6px 8px; border: 1px solid var(--linea); border-radius: var(--r-s); background: var(--granito); }
</style>
