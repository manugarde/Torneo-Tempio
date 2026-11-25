<script>
  import TeamBadge from './TeamBadge.svelte'
  import { matchScore, matchWinner } from '../lib/calc/score.js'
  import { formatOra } from '../lib/format.js'
  import { href } from '../lib/router.svelte.js'

  /** @type {{ partita: any, squadre: Map<string, any>, mostraData?: string }} */
  let { partita, squadre, mostraData } = $props()

  const s = $derived(matchScore(partita))
  const vince = $derived(matchWinner(partita))
  const giocata = $derived(partita.stato !== 'programmata')
</script>

<a class="riga" href={href(`/partita/${partita.id}`)}>
  <span class="quando small">
    {#if partita.stato === 'live'}
      <span class="live">Live</span>
    {:else if partita.stato === 'finita'}
      <span class="muted">Finale</span>
    {:else}
      <span class="num">{mostraData ?? formatOra(partita.dataOra)}</span>
    {/if}
    <span class="muted">{partita.fase === 'eliminazione' ? partita.turno : `Girone ${partita.girone}`}</span>
  </span>
  <span class="squadre">
    <span class="lato">
      <TeamBadge squadra={squadre.get(partita.casaId)} size="sm" link={false} vincente={vince && vince === partita.casaId} />
      {#if giocata}<span class="gol num">{s.casa}</span>{/if}
    </span>
    <span class="lato">
      <TeamBadge squadra={squadre.get(partita.ospiteId)} size="sm" link={false} vincente={vince && vince === partita.ospiteId} />
      {#if giocata}<span class="gol num">{s.ospite}</span>{/if}
    </span>
    {#if partita.rigori && partita.stato === 'finita'}
      <span class="muted small">Rigori {partita.rigori.casa}–{partita.rigori.ospite}</span>
    {/if}
  </span>
</a>

<style>
  .riga {
    display: grid; grid-template-columns: 76px 1fr; gap: 12px; align-items: center;
    padding: 12px 16px; text-decoration: none; min-height: 64px;
  }
  .quando { display: grid; gap: 2px; line-height: 1.2; }
  .squadre { display: grid; gap: 6px; min-width: 0; }
  .lato { display: flex; justify-content: space-between; align-items: center; gap: 8px; min-width: 0; }
  .gol { font-family: var(--font-titolo); font-weight: 800; font-size: 1.25rem; min-width: 1.2em; text-align: right; }
  .live { color: var(--campo); font-weight: 700; }
  .live::before {
    content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 5px; border-radius: 50%;
    background: var(--campo); animation: pulsa 1.6s ease-out infinite;
  }
  @keyframes pulsa { 50% { opacity: 0.25; } }
</style>
