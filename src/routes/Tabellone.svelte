<script>
  import { getContext } from 'svelte'
  import TeamBadge from '../components/TeamBadge.svelte'
  import { matchScore, matchWinner } from '../lib/calc/score.js'
  import { perId, TURNI } from '../lib/util.js'
  import { formatDataOra } from '../lib/format.js'
  import { href } from '../lib/router.svelte.js'

  const ed = getContext('ed')
  const squadre = $derived(perId(ed.squadre))

  // Colonne nell'ordine dei turni; il 3° posto va sotto la finale, non in una colonna sua.
  const turni = $derived.by(() => {
    const finali = ed.partite.filter((x) => x.fase === 'eliminazione')
    const delTurno = (t) => finali.filter((p) => p.turno === t).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
    const colonne = TURNI.filter((t) => t !== '3° posto').map((nome) => ({ nome, partite: delTurno(nome), extra: null }))
    const terzo = delTurno('3° posto')
    const finale = colonne.find((c) => c.nome === 'Finale')
    if (terzo.length && finale) finale.extra = { nome: '3° posto', partite: terzo }
    return colonne.filter((c) => c.partite.length)
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
        {@render incontri(t.partite)}
        {#if t.extra}
          <h2 class="extra">{t.extra.nome}</h2>
          {@render incontri(t.extra.partite)}
        {/if}
      </section>
    {/each}
  </div>
{/if}

{#snippet incontri(partite)}
        <ul>
          {#each partite as p (p.id)}
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
{/snippet}

<style>
  .tabellone {
    display: grid; grid-auto-flow: column; grid-auto-columns: minmax(230px, 1fr); gap: 12px;
    overflow-x: auto; scroll-snap-type: x mandatory; margin: 0 -16px; padding: 0 16px 8px;
  }
  .turno { display: flex; flex-direction: column; gap: 10px; scroll-snap-align: start; }
  .turno > ul { flex: 1; }
  .extra { margin-top: 12px; }
  /* Su schermi larghi il tabellone esce dai 640px della pagina (fino a 1120px) per non scorrere di lato. */
  @media (min-width: 720px) {
    .tabellone { margin-inline: calc(50% - min(50vw - 24px, 560px)); padding-inline: 0; grid-auto-columns: minmax(200px, 1fr); }
  }
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
