<script>
  import { getContext } from 'svelte'
  import TeamBadge from '../components/TeamBadge.svelte'
  import { matchScore, matchWinner } from '../lib/calc/score.js'
  import { perId } from '../lib/util.js'
  import { formatDataOra } from '../lib/format.js'
  import { href } from '../lib/router.svelte.js'

  const ed = getContext('ed')
  const squadre = $derived(perId(ed.squadre))

  // Turni ordinati per la prima partita in calendario; partite per slot.
  const turni = $derived.by(() => {
    const t = new Map()
    for (const p of ed.partite.filter((x) => x.fase === 'eliminazione')) {
      if (!t.has(p.turno)) t.set(p.turno, [])
      t.get(p.turno).push(p)
    }
    const primo = (ps) => Math.min(...ps.map((p) => p.dataOra?.getTime() ?? Infinity))
    return [...t.entries()]
      .map(([nome, ps]) => ({ nome, partite: ps.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)) }))
      .sort((a, b) => primo(a.partite) - primo(b.partite))
  })
</script>

<h1>Tabellone</h1>

{#if !turni.length}
  <p class="vuoto">Il tabellone della fase finale sarà pubblicato al termine dei gironi.</p>
{:else}
  <div class="tabellone" style="--turni: {turni.length}">
    {#each turni as t (t.nome)}
      <section class="turno" aria-label={t.nome}>
        <h2>{t.nome}</h2>
        <ul>
          {#each t.partite as p (p.id)}
            {@const s = matchScore(p)}
            {@const v = matchWinner(p)}
            <li>
              <a class="incontro" class:live={p.stato === 'live'} href={href(`/partita/${p.id}`)}>
                {#each [['casaId', s.casa, 'casa'], ['ospiteId', s.ospite, 'ospite']] as [campo, gol, lato] (campo)}
                  <span class="lato" class:perde={v && v !== p[campo]}>
                    <TeamBadge squadra={squadre.get(p[campo])} size="sm" link={false} vincente={v === p[campo]} />
                    {#if p.stato !== 'programmata'}
                      <span class="num gol">{gol}{#if p.rigori && p.stato === 'finita'}<sup>{p.rigori[lato]}</sup>{/if}</span>
                    {/if}
                  </span>
                {/each}
                {#if p.stato === 'programmata'}<span class="small muted">{formatDataOra(p.dataOra)}</span>{/if}
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
{/if}

<style>
  .tabellone {
    display: grid; grid-auto-flow: column; grid-auto-columns: minmax(230px, 1fr); gap: 12px;
    overflow-x: auto; scroll-snap-type: x mandatory; margin: 0 -16px; padding: 0 16px 8px;
  }
  .turno { display: grid; grid-template-rows: auto 1fr; gap: 10px; scroll-snap-align: start; }
  h2 { font-size: 1.2rem; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; justify-content: space-around; gap: 12px; }
  .incontro {
    display: grid; gap: 6px; padding: 10px 12px; text-decoration: none;
    background: var(--superficie); border-radius: var(--r-s); border-left: 4px solid var(--linea);
  }
  .incontro.live { border-left-color: var(--campo); }
  .lato { display: flex; justify-content: space-between; align-items: center; gap: 8px; min-width: 0; }
  .perde { opacity: 0.55; }
  .gol { font-family: var(--font-titolo); font-weight: 800; font-size: 1.15rem; }
  sup { font-size: 0.65em; margin-left: 2px; }
</style>
