<script>
  import { getContext } from 'svelte'
  import Scoreboard from '../components/Scoreboard.svelte'
  import MatchRow from '../components/MatchRow.svelte'
  import { perId, ordinaPerData, TURNI } from '../lib/util.js'
  import { chiaveGiorno, formatGiorno } from '../lib/format.js'

  const ed = getContext('ed')
  const squadre = $derived(perId(ed.squadre))
  const ordinate = $derived(ordinaPerData(ed.partite))
  const live = $derived(ordinate.filter((p) => p.stato === 'live'))

  const finali = $derived(ordinate.filter((p) => p.fase === 'eliminazione'))
  const diGirone = $derived(ordinate.filter((p) => p.fase !== 'eliminazione'))
  // Si apre sulla fase finale quando i gironi sono tutti giocati.
  let scelta = $state(null)
  const scheda = $derived(scelta ?? (finali.length && diGirone.every((p) => p.stato === 'finita') ? 'finale' : 'gironi'))
  const turni = $derived(TURNI.map((t) => ({ turno: t, partite: finali.filter((p) => p.turno === t) })).filter((t) => t.partite.length))

  // Giorni in ordine.
  const giorni = $derived.by(() => {
    const g = new Map()
    for (const p of diGirone) {
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

{#if finali.length}
  <div class="schede" role="tablist" aria-label="Fase">
    <button role="tab" aria-selected={scheda === 'gironi'} onclick={() => (scelta = 'gironi')}>Gironi</button>
    <button role="tab" aria-selected={scheda === 'finale'} onclick={() => (scelta = 'finale')}>Fase finale</button>
  </div>
{/if}

{#if !ed.pronta('partite')}
  <p class="muted" role="status">Caricamento partite…</p>
{:else if scheda === 'finale'}
  {#each turni as t (t.turno)}
    <section class="sezione">
      <h2 class="giorno">{t.turno}</h2>
      <ul class="lista">
        {#each t.partite as p (p.id)}<li><MatchRow partita={p} {squadre} /></li>{/each}
      </ul>
    </section>
  {/each}
{:else if !giorni.length}
  <p class="vuoto">Il calendario dei gironi non è ancora stato pubblicato.</p>
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
  .schede { display: flex; gap: 6px; }
  .schede button {
    flex: 1; min-height: 44px; padding: 6px 14px; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--linea); background: var(--superficie); font-weight: 600;
  }
  .schede button[aria-selected='true'] { background: var(--ardesia); color: var(--granito); border-color: var(--ardesia); }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .giorno { font-size: 1.35rem; display: flex; align-items: center; gap: 10px; }
  .giorno::first-letter { text-transform: uppercase; }
  .oggi { font-family: var(--font-testo); font-weight: 600; color: var(--su-campo); background: var(--campo); padding: 1px 8px; border-radius: 999px; }
</style>
