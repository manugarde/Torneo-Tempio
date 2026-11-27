<script>
  import { setContext, onDestroy } from 'svelte'
  import { Edizione, simulazione } from './lib/store.svelte.js'
  import { route } from './lib/router.svelte.js'
  import { authState } from './lib/auth.svelte.js'
  import { computeSuspensions } from './lib/calc/suspensions.js'
  import Header from './components/Header.svelte'
  import Nav from './components/Nav.svelte'
  import Home from './routes/Home.svelte'
  import Partite from './routes/Partite.svelte'
  import Serate from './routes/Serate.svelte'
  import Notizie from './routes/Notizie.svelte'
  import Gironi from './routes/Gironi.svelte'
  import Giocatori from './routes/Giocatori.svelte'
  import Tabellone from './routes/Tabellone.svelte'
  import Chiosco from './routes/Chiosco.svelte'
  import Squadra from './routes/Squadra.svelte'
  import Partita from './routes/Partita.svelte'

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

  const viste = { '': Home, partite: Partite, serate: Serate, notizie: Notizie, gironi: Gironi, giocatori: Giocatori, tabellone: Tabellone, chiosco: Chiosco, squadra: Squadra, partita: Partita }
  const inAdmin = $derived(route.nome === 'admin' && authState.isStaff)
  const Corrente = $derived(inAdmin ? null : viste[route.nome] ?? Home)

  // Si disegna solo con i dati arrivati (impostazioni e, in home, notizie e partite): niente salti di layout.
  const DATI_HOME = ['notizie', 'partite', 'squadre', 'serate']
  const pronta = $derived(ed.pronta('impostazioni') && (Corrente !== Home || DATI_HOME.every((k) => ed.pronta(k))))
  $effect(() => { if (pronta) document.getElementById('avvio')?.remove() })
</script>

{#if pronta}
<Header {storica} largo={Corrente === Home} />
<main class="pagina">
  {#if simulazione()}
    <p class="simulazione" role="status">Simulazione: i risultati dei gironi non giocati sono inventati. <a href={'#/' + [route.nome, route.param].filter(Boolean).join('/') + (route.query.ed ? `?ed=${route.query.ed}` : '')}>Torna ai dati veri</a></p>
  {/if}
  {#if inAdmin}
    <!-- Gestione caricata solo per lo staff: il pubblico non scarica quel codice. -->
    {#await import('./routes/admin/Admin.svelte')}
      <p class="muted" role="status">Caricamento…</p>
    {:then { default: Admin }}
      <Admin param={route.param} {storica} />
    {/await}
  {:else}
    <Corrente param={route.param} {storica} />
  {/if}
  {#if edizioni.length > 1}
    <nav class="edizioni small" aria-label="Edizioni">
      <span class="muted">Edizioni:</span>
      {#each edizioni as e (e)}
        <a href={`#/?ed=${e}`} aria-current={e === anno ? 'page' : undefined}>{e}</a>
      {/each}
    </nav>
  {/if}
</main>
<!-- In home la barra serve solo su telefono: su PC ci sono i bottoni del menu. -->
<div class:solo-mobile={Corrente === Home}><Nav /></div>
{/if}

<style>
  .simulazione { margin: 0 0 16px; padding: 10px 16px; border-radius: var(--r-m); background: var(--ardesia); color: var(--su-tabellone); font-weight: 600; }
  .simulazione a { color: inherit; }
  @media (min-width: 720px) { .solo-mobile { display: none; } }
  .edizioni { display: flex; flex-wrap: wrap; gap: 4px 12px; padding-top: 12px; border-top: 1px solid var(--linea); }
  .edizioni a[aria-current='page'] { font-weight: 700; text-decoration: none; }
</style>
