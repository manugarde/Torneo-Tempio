<script>
  import { getContext } from 'svelte'
  import { href } from '../lib/router.svelte.js'
  import { testoPeriodo, avvisoVisibile } from '../lib/format.js'
  import SponsorStrip from '../components/SponsorStrip.svelte'

  /** @type {{ storica?: boolean }} */
  let { storica = false } = $props()
  const ed = getContext('ed')
  const imp = $derived(ed.impostazioni)
  const logo = $derived(imp.logo || `${import.meta.env.BASE_URL}logo.webp`)

  const menu = [
    // mobile: false → su telefono la voce c'è già nella barra in basso
    { percorso: '/partite', testo: 'Risultati e calendario', mobile: false },
    { percorso: '/gironi', testo: 'Classifica gironi', mobile: false },
    { percorso: '/giocatori', testo: 'Classifica marcatori', mobile: false },
    { percorso: '/chiosco', testo: 'Coppa Chiosco', mobile: false },
    { percorso: '/tabellone', testo: 'Tabellone fase finale', mobile: false },
    { percorso: '/serate', testo: 'Eventi giornalieri', mobile: true },
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
      <li class:solo-desktop={!v.mobile}>
        <a href={href(v.percorso)}>
          <span>{v.testo}</span>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </a>
      </li>
    {/each}
  </ul>
</nav>

{#if ed.sponsor.length}
  <footer class="sponsor">
    <h2 class="small">Sponsor</h2>
    <SponsorStrip sponsor={ed.sponsor} />
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

  @media (max-width: 719px) {
    .solo-desktop { display: none; }
    .lista > li:not(.solo-desktop) { border-top: 0; } /* resta solo Eventi: niente riga sopra */
  }
  .sponsor { display: grid; gap: 10px; justify-items: center; min-width: 0; padding-top: 12px; border-top: 1px solid var(--linea); text-align: center; }
  .sponsor h2 { font-family: var(--font-testo); font-weight: 600; text-transform: uppercase; color: var(--ardesia-2); }
</style>
