<script>
  import { getContext } from 'svelte'
  import TeamBadge from '../components/TeamBadge.svelte'
  import MatchRow from '../components/MatchRow.svelte'
  import { perId, ordinaPerData, prossimaPartita } from '../lib/util.js'
  import { isSuspended } from '../lib/calc/suspensions.js'
  import { formatDataOra } from '../lib/format.js'

  /** @type {{ param: string }} */
  let { param } = $props()
  const ed = getContext('ed')
  const calc = getContext('calc')

  const squadre = $derived(perId(ed.squadre))
  const squadra = $derived(squadre.get(param))
  const partite = $derived(ordinaPerData(ed.partite.filter((p) => p.casaId === param || p.ospiteId === param)))
  const prossima = $derived(prossimaPartita(ed.partite, param))

  // Gol e cartellini per giocatore, da tutte le partite della squadra.
  const conteggi = $derived.by(() => {
    const c = new Map()
    for (const p of partite) {
      for (const e of p.eventi ?? []) {
        if (!e.giocatoreId || e.tipo === 'autogol') continue
        const x = c.get(e.giocatoreId) ?? { gol: 0, giallo: 0, rosso: 0 }
        x[e.tipo]++
        c.set(e.giocatoreId, x)
      }
    }
    return c
  })
  const rosa = $derived([...(squadra?.giocatori ?? [])].sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99)))
  const fermo = (g) => prossima ? isSuspended(calc.sospensioni, g.id, prossima.id) : (calc.sospensioni.get(g.id)?.residue ?? 0) > 0
</script>

{#if !ed.pronta('squadre')}
  <p class="muted" role="status">Caricamento…</p>
{:else if !squadra}
  <p class="vuoto">Squadra non trovata. <a href="#/gironi">Vai ai gironi</a></p>
{:else}
  <header class="testata">
    <TeamBadge {squadra} size="lg" link={false} />
    <p class="muted">Girone {squadra.girone}{prossima ? ` · prossima partita ${formatDataOra(prossima.dataOra)}` : ''}</p>
  </header>

  <section class="sezione">
    <h2>Rosa</h2>
    {#if !rosa.length}
      <p class="vuoto">La rosa non è ancora stata inserita.</p>
    {:else}
      <table class="lista num">
        <thead>
          <tr><th scope="col"><abbr title="Numero">N.</abbr></th><th scope="col" class="sx">Giocatore</th><th scope="col">Gol</th><th scope="col"><abbr title="Ammonizioni">Amm.</abbr></th><th scope="col"><abbr title="Espulsioni">Esp.</abbr></th></tr>
        </thead>
        <tbody>
          {#each rosa as g (g.id)}
            {@const c = conteggi.get(g.id)}
            <tr>
              <td class="numero">{g.numero ?? ''}</td>
              <td class="sx">{g.nome} {#if fermo(g)}<span class="tag squalificato">Squalificato</span>{/if}</td>
              <td>{c?.gol || ''}</td><td>{c?.giallo || ''}</td><td>{c?.rosso || ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>

  <section class="sezione">
    <h2>Partite</h2>
    {#if !partite.length}
      <p class="vuoto">Nessuna partita in calendario.</p>
    {:else}
      <ul class="lista">
        {#each partite as p (p.id)}<li><MatchRow partita={p} {squadre} mostraData={formatDataOra(p.dataOra)} /></li>{/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  .testata { display: grid; gap: 8px; }
  table { width: 100%; border-collapse: collapse; display: table; }
  th, td { padding: 10px 6px; text-align: center; }
  th { font-size: 0.8rem; font-weight: 600; color: var(--ardesia-2); }
  tbody tr td { border-top: 1px solid var(--linea); }
  abbr { text-decoration: none; }
  .sx { text-align: left; }
  .numero { font-family: var(--font-titolo); font-weight: 800; width: 3ch; }
</style>
