<script>
  import { setContext, onDestroy } from 'svelte'
  import { Edizione } from './lib/store.svelte.js'
  import { route } from './lib/router.svelte.js'
  import { authState } from './lib/auth.svelte.js'
  import { computeSuspensions } from './lib/calc/suspensions.js'
  import Header from './components/Header.svelte'
  import Nav from './components/Nav.svelte'
  import Partite from './routes/Partite.svelte'
  import Gironi from './routes/Gironi.svelte'
  import Giocatori from './routes/Giocatori.svelte'
  import Tabellone from './routes/Tabellone.svelte'
  import Chiosco from './routes/Chiosco.svelte'
  import Squadra from './routes/Squadra.svelte'
  import Partita from './routes/Partita.svelte'
  import Admin from './routes/admin/Admin.svelte'

  /** @type {{ anno: string, storica: boolean, edizioni: string[] }} */
  let { anno, storica, edizioni } = $props()

  // App.svelte ricrea questo componente con {#key anno}: il valore iniziale basta.
  // svelte-ignore state_referenced_locally
  const ed = new Edizione(anno)
  setContext('ed', ed)
  onDestroy(() => ed.chiudi())

  // Calcolate solo quando una vista le legge ($derived è pigro).
  const sospensioni = $derived(computeSuspensions(ed.squadre, ed.partite, ed.squalificheManuali, ed.impostazioni))
  setContext('calc', { get sospensioni() { return sospensioni } })

  const viste = { '': Partite, gironi: Gironi, giocatori: Giocatori, tabellone: Tabellone, chiosco: Chiosco, squadra: Squadra, partita: Partita }
  const Corrente = $derived(route.nome === 'admin' && authState.isStaff ? Admin : viste[route.nome] ?? Partite)
</script>

<Header {storica} />
<main class="pagina">
  <Corrente param={route.param} />
  {#if edizioni.length > 1}
    <nav class="edizioni small" aria-label="Edizioni">
      <span class="muted">Edizioni:</span>
      {#each edizioni as e (e)}
        <a href={`#/?ed=${e}`} aria-current={e === anno ? 'page' : undefined}>{e}</a>
      {/each}
    </nav>
  {/if}
</main>
<Nav />

<style>
  .edizioni { display: flex; flex-wrap: wrap; gap: 4px 12px; padding-top: 12px; border-top: 1px solid var(--linea); }
  .edizioni a[aria-current='page'] { font-weight: 700; text-decoration: none; }
</style>
