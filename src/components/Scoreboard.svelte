<script>
  import TeamBadge from './TeamBadge.svelte'
  import { matchScore } from '../lib/calc/score.js'
  import { formatDataOra } from '../lib/format.js'
  import { href } from '../lib/router.svelte.js'

  /** Il pannello del punteggio: l'elemento forte della grafica. */
  /** @type {{ partita: any, squadre: Map<string, any>, link?: boolean }} */
  let { partita, squadre, link = true } = $props()

  const s = $derived(matchScore(partita))
  const casa = $derived(squadre.get(partita.casaId))
  const ospite = $derived(squadre.get(partita.ospiteId))
  const stato = $derived(
    partita.stato === 'live' ? 'In corso' : partita.stato === 'finita' ? 'Finale' : formatDataOra(partita.dataOra),
  )
</script>

{#snippet pannello()}
  <div class="intestazione small">
    <span class:live={partita.stato === 'live'}>{stato}</span>
    <span>{partita.fase === 'eliminazione' ? partita.turno : `Girone ${partita.girone}`}{partita.campo ? ` · ${partita.campo}` : ''}</span>
  </div>
  <div class="corpo">
    <div class="squadra"><TeamBadge squadra={casa} size="lg" nome={false} link={false} /><span class="nome">{casa?.nome ?? 'Da definire'}</span></div>
    <div class="punteggio num" aria-label="Punteggio {s.casa} a {s.ospite}">
      {#if partita.stato === 'programmata'}<span class="vs">–</span>{:else}{s.casa}<span class="trattino">–</span>{s.ospite}{/if}
    </div>
    <div class="squadra"><TeamBadge squadra={ospite} size="lg" nome={false} link={false} /><span class="nome">{ospite?.nome ?? 'Da definire'}</span></div>
  </div>
  {#if partita.rigori && (partita.rigori.casa || partita.rigori.ospite)}
    <p class="rigori small num">Rigori {partita.rigori.casa}–{partita.rigori.ospite}</p>
  {/if}
{/snippet}

{#if link}
  <a class="tabellone" href={href(`/partita/${partita.id}`)}>{@render pannello()}</a>
{:else}
  <div class="tabellone">{@render pannello()}</div>
{/if}

<style>
  .tabellone {
    display: grid; gap: 14px; padding: 14px 16px 18px;
    background: var(--tabellone); color: var(--su-tabellone);
    border-radius: var(--r-m); text-decoration: none;
    border-bottom: 4px solid var(--campo);
  }
  .intestazione { display: flex; justify-content: space-between; gap: 12px; opacity: 0.8; }
  .live { color: #7fd8a0; font-weight: 700; opacity: 1; }
  .corpo { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; }
  .squadra { display: grid; justify-items: center; gap: 8px; text-align: center; min-width: 0; }
  .nome { font-family: var(--font-titolo); font-weight: 700; font-size: 1.1rem; line-height: 1.1; overflow-wrap: anywhere; }
  .punteggio {
    font-family: var(--font-titolo); font-weight: 800;
    font-size: clamp(3.2rem, 16vw, 4.5rem); line-height: 1;
    display: flex; align-items: center; gap: 6px;
  }
  .trattino, .vs { opacity: 0.5; }
  .rigori { text-align: center; opacity: 0.85; }
</style>
