<script>
  import { getContext } from 'svelte'
  import Scoreboard from '../components/Scoreboard.svelte'
  import MatchRow from '../components/MatchRow.svelte'
  import { perId, ordinaPerData } from '../lib/util.js'
  import { chiaveGiorno, formatGiorno } from '../lib/format.js'

  const ed = getContext('ed')
  const squadre = $derived(perId(ed.squadre))
  const ordinate = $derived(ordinaPerData(ed.partite))
  const live = $derived(ordinate.filter((p) => p.stato === 'live'))

  // Giorni in ordine; si apre sul primo giorno con partite non finite.
  const giorni = $derived.by(() => {
    const g = new Map()
    for (const p of ordinate) {
      const k = chiaveGiorno(p.dataOra) || 'da-definire'
      if (!g.has(k)) g.set(k, { chiave: k, data: p.dataOra, partite: [] })
      g.get(k).partite.push(p)
    }
    return [...g.values()]
  })
  const oggi = chiaveGiorno(new Date())
</script>

<h1 class="sr">Partite</h1>

{#if live.length}
  <section class="sezione" aria-label="Partite in corso">
    {#each live as p (p.id)}<Scoreboard partita={p} {squadre} />{/each}
  </section>
{/if}

{#if !ed.pronta('partite')}
  <p class="muted" role="status">Caricamento partite…</p>
{:else if !giorni.length}
  <p class="vuoto">Il calendario non è ancora stato pubblicato.</p>
{:else}
  {#each giorni as g (g.chiave)}
    <section class="sezione" id="giorno-{g.chiave}">
      <h2 class="giorno">
        {g.data ? formatGiorno(g.data) : 'Data da definire'}
        {#if g.chiave === oggi}<span class="oggi small">Oggi</span>{/if}
      </h2>
      <ul class="lista">
        {#each g.partite as p (p.id)}<li><MatchRow partita={p} {squadre} /></li>{/each}
      </ul>
    </section>
  {/each}
{/if}

<style>
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .giorno { font-size: 1.35rem; display: flex; align-items: center; gap: 10px; }
  .giorno::first-letter { text-transform: uppercase; }
  .oggi { font-family: var(--font-testo); font-weight: 600; color: var(--su-campo); background: var(--campo); padding: 1px 8px; border-radius: 999px; }
</style>
