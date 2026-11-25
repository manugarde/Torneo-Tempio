<script>
  import { getContext } from 'svelte'
  import { href } from '../lib/router.svelte.js'
  import { testoPeriodo, formatDataOra, formatGiorno, dataGiorno, chiaveGiorno } from '../lib/format.js'
  import { ultimaNotizia, prossimaSerata } from '../lib/util.js'
  import SponsorStrip from '../components/SponsorStrip.svelte'

  const ed = getContext('ed')
  const imp = $derived(ed.impostazioni)
  const logo = $derived(imp.logo || `${import.meta.env.BASE_URL}logo.webp`)
  const notizia = $derived(ultimaNotizia(ed.notizie))
  const evento = $derived(prossimaSerata(ed.serate, chiaveGiorno(new Date())))

  const menu = [
    // mobile: false → su telefono la voce c'è già nella barra in basso
    { percorso: '/partite', testo: 'Risultati e calendario', mobile: false },
    { percorso: '/gironi', testo: 'Classifica gironi', mobile: false },
    { percorso: '/giocatori', testo: 'Classifica marcatori', mobile: false },
    { percorso: '/chiosco', testo: 'Coppa Chiosco', mobile: false },
    { percorso: '/tabellone', testo: 'Tabellone fase finale', mobile: false },
    { percorso: '/notizie', testo: 'Notizie', mobile: true },
    { percorso: '/serate', testo: 'Eventi giornalieri', mobile: true },
  ]
</script>

<section class="evento">
  <img class="logo" src={logo} alt={imp.nome} width="240" height="240" />
  <h1 class="num">{testoPeriodo(imp.periodo, ed.anno)}</h1>
  {#if imp.luogo?.trim()}<p class="luogo">{imp.luogo}</p>{/if}
  {#if imp.orari?.trim()}<p class="orari">{imp.orari}</p>{/if}
</section>

{#if notizia || evento}
  <div class="riquadri">
    {#if notizia}
      <article class="riquadro">
        <p class="etichetta small">Ultima notizia · {formatDataOra(notizia.data)}</p>
        <h2>{notizia.titolo}</h2>
        <p class="testo">{notizia.testo}</p>
        <a class="small" href={href('/notizie')}>Tutte le notizie</a>
      </article>
    {/if}
    {#if evento}
      <article class="riquadro">
        <p class="etichetta small">Prossimo evento</p>
        <h2 class="giorno">{formatGiorno(dataGiorno(evento.data))}</h2>
        {#if evento.fase}<p class="fase">{evento.fase}</p>{/if}
        {#if evento.musica}<p>{evento.musica}</p>{/if}
        <a class="small" href={href('/serate')}>Tutti gli eventi</a>
      </article>
    {/if}
  </div>
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

  .riquadri { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .riquadro { display: grid; gap: 6px; align-content: start; padding: 16px; background: var(--superficie); border-radius: var(--r-m); border-left: 4px solid var(--campo); }
  .riquadro h2 { font-size: 1.35rem; }
  .riquadro a { font-weight: 600; color: var(--campo); }
  .etichetta { font-weight: 600; text-transform: uppercase; color: var(--ardesia-2); }
  .testo { white-space: pre-line; display: -webkit-box; -webkit-line-clamp: 4; line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .giorno::first-letter { text-transform: uppercase; }
  .fase { font-weight: 600; color: var(--campo); }

  nav a {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    min-height: 56px; padding: 10px 16px;
    font-family: var(--font-titolo); font-weight: 700; font-size: 1.35rem; text-decoration: none;
  }
  nav svg { flex: none; fill: none; stroke: var(--campo); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }

  @media (max-width: 719px) {
    .solo-desktop { display: none; }
    .lista > li.solo-desktop + li:not(.solo-desktop) { border-top: 0; } /* prima voce visibile: niente riga sopra */
  }
  .sponsor { display: grid; gap: 10px; justify-items: center; min-width: 0; padding-top: 12px; border-top: 1px solid var(--linea); text-align: center; }
  .sponsor h2 { font-family: var(--font-testo); font-weight: 600; text-transform: uppercase; color: var(--ardesia-2); }
</style>
