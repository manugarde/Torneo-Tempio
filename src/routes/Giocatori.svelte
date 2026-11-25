<script>
  import { getContext } from 'svelte'
  import TeamBadge from '../components/TeamBadge.svelte'
  import EventIcon from '../components/EventIcon.svelte'
  import { topScorers } from '../lib/calc/scorers.js'
  import { isSuspended, atRisk } from '../lib/calc/suspensions.js'
  import { perId, prossimaPartita, trovaGiocatore } from '../lib/util.js'

  const ed = getContext('ed')
  const calc = getContext('calc')
  const squadre = $derived(perId(ed.squadre))
  const marcatori = $derived(topScorers(ed.squadre, ed.partite))

  // Squalificato per la prossima partita della sua squadra (o in attesa di una partita non ancora creata).
  const squalificati = $derived(
    [...calc.sospensioni].flatMap(([id, s]) => {
      const prossima = prossimaPartita(ed.partite, s.squadraId)
      const fermo = prossima ? isSuspended(calc.sospensioni, id, prossima.id) : s.residue > 0
      const trovato = fermo ? trovaGiocatore(ed.squadre, id) : null
      return trovato ? [trovato] : []
    }),
  )
  const aRischio = $derived(
    atRisk(calc.sospensioni, ed.impostazioni).map((id) => trovaGiocatore(ed.squadre, id)).filter(Boolean),
  )
</script>

<h1>Giocatori</h1>

<section class="sezione">
  <h2>Marcatori</h2>
  {#if !marcatori.length}
    <p class="vuoto">Nessun gol ancora segnato.</p>
  {:else}
    <ol class="lista">
      {#each marcatori.slice(0, 30) as m, i (m.giocatoreId)}
        <li class="riga">
          <span class="pos num muted">{i > 0 && marcatori[i - 1].gol === m.gol ? '' : i + 1}</span>
          <span class="chi">
            <span class="nome">{m.nome}</span>
            <TeamBadge squadra={squadre.get(m.squadraId)} size="sm" />
          </span>
          <span class="gol num">{m.gol}</span>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<section class="sezione">
  <h2>Squalificati</h2>
  {#if !squalificati.length}
    <p class="vuoto">Nessun giocatore squalificato per la prossima partita.</p>
  {:else}
    <ul class="lista">
      {#each squalificati as { giocatore, squadra } (giocatore.id)}
        <li class="riga">
          <EventIcon tipo="rosso" />
          <span class="chi"><span class="nome">{giocatore.nome}</span><TeamBadge {squadra} size="sm" /></span>
          <span class="small muted">Salta la prossima</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

{#if aRischio.length}
  <section class="sezione">
    <h2>Diffidati</h2>
    <p class="small muted">Con un'altra ammonizione saltano la partita successiva.</p>
    <ul class="lista">
      {#each aRischio as { giocatore, squadra } (giocatore.id)}
        <li class="riga">
          <EventIcon tipo="giallo" />
          <span class="chi"><span class="nome">{giocatore.nome}</span><TeamBadge {squadra} size="sm" /></span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .riga { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px; padding: 10px 16px; min-height: 56px; }
  .chi { display: grid; gap: 2px; min-width: 0; }
  .nome { font-weight: 600; }
  .chi :global(.badge) { font-size: 0.85rem; color: var(--ardesia-2); }
  .gol { font-family: var(--font-titolo); font-weight: 800; font-size: 1.5rem; }
</style>
