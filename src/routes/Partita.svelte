<script>
  import { getContext } from 'svelte'
  import Scoreboard from '../components/Scoreboard.svelte'
  import MatchEditor from '../components/MatchEditor.svelte'
  import EventIcon from '../components/EventIcon.svelte'
  import TeamBadge from '../components/TeamBadge.svelte'
  import { authState } from '../lib/auth.svelte.js'
  import { simulazione } from '../lib/store.svelte.js'
  import { href } from '../lib/router.svelte.js'
  import { removeEvento } from '../lib/api.js'
  import { perId, trovaGiocatore } from '../lib/util.js'
  import { isSuspended } from '../lib/calc/suspensions.js'

  /** @type {{ param: string }} */
  let { param } = $props()
  const ed = getContext('ed')
  const calc = getContext('calc')

  const squadre = $derived(perId(ed.squadre))
  const partita = $derived(ed.partite.find((p) => p.id === param))
  const eventi = $derived(partita?.eventi ?? [])
  const nomi = { gol: 'Gol', autogol: 'Autogol', giallo: 'Ammonizione', rosso: 'Espulsione' }

  // Squalificati per questa partita, per avvisare pubblico e staff.
  const fermi = $derived.by(() => {
    if (!partita || partita.stato === 'finita') return []
    return [partita.casaId, partita.ospiteId].flatMap((id) =>
      (squadre.get(id)?.giocatori ?? []).filter((g) => isSuspended(calc.sospensioni, g.id, partita.id)))
  })

  let errore = $state('')
  function annulla(e) {
    errore = ''
    removeEvento(ed.anno, partita.id, e).catch((err) => { errore = err.message })
  }
  // In simulazione niente comandi di modifica: salverebbero risultati finti.
  const modifica = $derived(authState.isStaff && !simulazione())
</script>

{#if !ed.pronta('partite')}
  <p class="muted" role="status">Caricamento…</p>
{:else if !partita}
  <p class="vuoto">Partita non trovata. <a href={href('/partite')}>Torna alle partite</a></p>
{:else}
  <Scoreboard {partita} {squadre} link={false} />

  {#if fermi.length}
    <p class="avviso small">Squalificati: {fermi.map((g) => g.nome).join(', ')}</p>
  {/if}

  {#if modifica}<MatchEditor {partita} {squadre} />{/if}

  <section class="sezione">
    <h2>Eventi</h2>
    {#if !eventi.length}
      <p class="vuoto">{partita.stato === 'programmata' ? 'La partita non è ancora iniziata.' : 'Nessun evento registrato.'}</p>
    {:else}
      <ol class="lista">
        {#each [...eventi].reverse() as e (e.id)}
          {@const g = trovaGiocatore(ed.squadre, e.giocatoreId)}
          <li class="evento" class:ospite={e.squadraId === partita.ospiteId}>
            <EventIcon tipo={e.tipo} />
            <span class="chi">
              <span class="nome">{g?.giocatore.nome ?? (e.giocatoreId ? 'Giocatore rimosso' : 'Marcatore sconosciuto')}</span>
              <span class="small muted">{nomi[e.tipo]} · <TeamBadge squadra={squadre.get(e.squadraId)} size="sm" nome={true} link={false} /></span>
            </span>
            {#if modifica}
              <button class="btn pericolo piccolo" onclick={() => annulla(e)} aria-label="Annulla {nomi[e.tipo]} {g?.giocatore.nome ?? ''}">Annulla</button>
            {/if}
          </li>
        {/each}
      </ol>
      {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
    {/if}
  </section>
{/if}

<style>
  .avviso { padding: 8px 12px; border-radius: var(--r-s); background: var(--rosso); color: #fff; font-weight: 600; }
  .evento { display: grid; grid-template-columns: 20px 1fr auto; align-items: center; gap: 10px; padding: 10px 16px; min-height: 56px; }
  .chi { display: grid; gap: 2px; min-width: 0; }
  .nome { font-weight: 600; }
  .chi :global(.badge) { display: inline-flex; vertical-align: middle; }
  .piccolo { min-height: 40px; padding: 4px 10px; }
</style>
