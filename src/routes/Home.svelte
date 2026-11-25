<script>
  import { getContext } from 'svelte'
  import { href } from '../lib/router.svelte.js'
  import { testoPeriodo, avvisoVisibile } from '../lib/format.js'

  /** @type {{ storica?: boolean }} */
  let { storica = false } = $props()
  const ed = getContext('ed')
  const imp = $derived(ed.impostazioni)
  const logo = $derived(imp.logo || `${import.meta.env.BASE_URL}logo.png`)

  const menu = [
    { percorso: '/partite', testo: 'Risultati e calendario' },
    { percorso: '/gironi', testo: 'Classifica gironi' },
    { percorso: '/giocatori', testo: 'Classifica marcatori' },
    { percorso: '/chiosco', testo: 'Coppa Chiosco' },
    { percorso: '/tabellone', testo: 'Tabellone fase finale' },
    { percorso: '/serate', testo: 'Eventi giornalieri' },
  ]
</script>

<section class="evento">
  <img class="logo" src={logo} alt={imp.nome} width="240" height="240" />
  <h1 class="num">{testoPeriodo(imp.periodo, ed.anno)}</h1>
  {#if imp.luogo?.trim()}<p class="luogo">{imp.luogo}</p>{/if}
  {#if imp.orari?.trim()}<p class="orari">{imp.orari}</p>{/if}
</section>

{#if avvisoVisibile(imp.avviso, storica)}
  <p class="avviso" role="status">{imp.avviso}</p>
{/if}

<nav aria-label="Menu del torneo">
  <ul class="lista">
    {#each menu as v (v.percorso)}
      <li>
        <a href={href(v.percorso)}>
          <span>{v.testo}</span>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </a>
      </li>
    {/each}
  </ul>
</nav>

{#if imp.sponsor?.length}
  <footer class="sponsor">
    <h2 class="small">Sponsor</h2>
    <ul>
      {#each imp.sponsor as s, i (i)}<li>{s}</li>{/each}
    </ul>
  </footer>
{/if}

<style>
  .evento { display: grid; justify-items: center; gap: 6px; text-align: center; }
  .logo { width: min(240px, 70vw); height: auto; aspect-ratio: 1; object-fit: contain; margin-bottom: 6px; }
  h1 { font-size: 2.4rem; color: var(--campo); }
  .luogo { font-weight: 600; }
  .orari { color: var(--ardesia-2); }

  .avviso {
    padding: 12px 16px; border-radius: var(--r-m);
    background: var(--giallo); color: #1e282c; font-weight: 600; white-space: pre-line;
  }

  nav a {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    min-height: 56px; padding: 10px 16px;
    font-family: var(--font-titolo); font-weight: 700; font-size: 1.35rem; text-decoration: none;
  }
  nav svg { flex: none; fill: none; stroke: var(--campo); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }

  .sponsor { display: grid; gap: 6px; justify-items: center; padding-top: 12px; border-top: 1px solid var(--linea); text-align: center; }
  .sponsor h2 { font-family: var(--font-testo); font-weight: 600; text-transform: uppercase; color: var(--ardesia-2); }
  .sponsor ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 16px; font-weight: 600; }
</style>
