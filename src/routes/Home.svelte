<script>
  import { getContext } from 'svelte'
  import { href } from '../lib/router.svelte.js'
  import { testoPeriodo, formatDataOra, formatGiorno, formatOra, dataGiorno, chiaveGiorno, anteprimaNotizia, normalizzaSito } from '../lib/format.js'
  import { prossimaSerata, ordinaPerData, perId } from '../lib/util.js'
  import SponsorStrip from '../components/SponsorStrip.svelte'
  import MatchRow from '../components/MatchRow.svelte'
  import Gironi from './Gironi.svelte'

  /** @type {{ storica?: boolean }} */
  let { storica = false } = $props()

  const ed = getContext('ed')
  const imp = $derived(ed.impostazioni)
  const logo = $derived(imp.logo || `${import.meta.env.BASE_URL}logo.webp`)
  const instagram = $derived(normalizzaSito(imp.instagram))
  // Su telefono si vede solo la prima (CSS), su PC le ultime 4.
  const notizie = $derived([...ed.notizie].sort((a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0)).slice(0, 4)
    .map((n) => ({ ...n, ...(n.html ? anteprimaNotizia(n.html) : { immagine: '', testo: n.testo ?? '', fotoSopra: false }) })))
  const evento = $derived(prossimaSerata(ed.serate, chiaveGiorno(new Date())))
  // Partite in calendario la sera del prossimo evento.
  const partiteSera = $derived(evento ? ed.partite.filter((p) => p.dataOra && chiaveGiorno(p.dataOra) === evento.data).sort((a, b) => a.dataOra - b.dataOra) : [])
  // Solo PC: prossime partite e ultimi risultati.
  const squadre = $derived(perId(ed.squadre))
  const inOrdine = $derived(ordinaPerData(ed.partite))
  const prossime = $derived(inOrdine.filter((p) => p.stato !== 'finita' && p.dataOra).slice(0, 4))
  const risultati = $derived(inOrdine.filter((p) => p.stato === 'finita').slice(-3).reverse())

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

<div class="home">
  {#if !storica && imp.avviso?.trim()}
    <p class="avviso largo" role="status">{imp.avviso}</p>
  {/if}

  <section class="evento largo">
    <img class="logo" src={logo} alt={imp.nome} width="240" height="240" fetchpriority="high" />
    <div class="info">
      <h1 class="num">{testoPeriodo(imp.periodo, ed.anno)}</h1>
      {#if imp.luogo?.trim()}<p class="luogo">{imp.luogo}</p>{/if}
      {#if imp.orari?.trim()}<p class="orari">{imp.orari}</p>{/if}
      {#if instagram}
        <a class="instagram" href={instagram} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" /></svg>
          Seguici su Instagram!
        </a>
      {/if}
    </div>
  </section>

  <div class="principale">
    {#if notizie.length}
      <section class="sezione notizie">
        <div class="testata"><h2>Notizie recenti</h2><a class="small" href={href('/notizie')}>Tutte le notizie</a></div>
        <ul>
          {#each notizie as n (n.id)}
            <li>
              <article class="riquadro">
                <h3>{n.titolo}</h3>
                <p class="small muted">{formatDataOra(n.data)}</p>
                {#if n.immagine && n.fotoSopra}<img class="copertina" src={n.immagine} alt="" />{/if}
                {#if n.testo}<p class="testo">{n.testo}</p>{/if}
                {#if n.immagine && !n.fotoSopra}<img class="copertina" src={n.immagine} alt="" />{/if}
              </article>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if ed.squadre.length}
      <section class="sezione solo-pc">
        <div class="testata"><h2>Classifica gironi</h2><a class="small" href={href('/gironi')}>Dettagli</a></div>
        <Gironi incorporata />
      </section>
    {/if}
  </div>

  <aside class="laterale">
    {#if evento}
      <article class="riquadro">
        <p class="etichetta small">Prossimo evento</p>
        <h2 class="giorno">{formatGiorno(dataGiorno(evento.data))}</h2>
        {#if evento.fase}<p class="fase">{evento.fase}</p>{/if}
        <dl>
          {#if partiteSera.length}<dt>Partite</dt><dd>{partiteSera.length} {partiteSera.length === 1 ? 'partita' : 'partite'}, la prima alle {formatOra(partiteSera[0].dataOra)}</dd>{/if}
          {#if evento.menu}<dt>Si mangia</dt><dd>{evento.menu}</dd>{/if}
          {#if evento.musica}<dt>Evento</dt><dd>{evento.musica}</dd>{/if}
          {#if evento.note}<dt>Note</dt><dd>{evento.note}</dd>{/if}
        </dl>
        <a class="small" href={href('/serate')}>Tutti gli eventi</a>
      </article>
    {/if}

    {#each [['Prossime partite', prossime], ['Ultimi risultati', risultati]] as [titolo, elenco] (titolo)}
      {#if elenco.length}
        <section class="sezione solo-pc">
          <h2>{titolo}</h2>
          <ul class="lista">
            {#each elenco as p (p.id)}<li><MatchRow partita={p} {squadre} mostraData={formatDataOra(p.dataOra)} /></li>{/each}
          </ul>
        </section>
      {/if}
    {/each}

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
  </aside>

  {#if ed.sponsor.length}
    <footer class="sponsor largo">
      <h2 class="small">Sponsor</h2>
      <SponsorStrip sponsor={ed.sponsor} />
    </footer>
  {/if}
</div>

<style>
  .home, .principale, .laterale { display: grid; gap: 28px; align-content: start; min-width: 0; }
  .avviso { padding: 12px 16px; border-radius: var(--r-m); background: var(--giallo); color: #1e282c; font-weight: 600; white-space: pre-line; }

  .evento { display: grid; justify-items: center; gap: 6px; text-align: center; }
  .info { display: grid; justify-items: inherit; gap: 6px; }
  .logo { width: min(240px, 70vw); height: auto; aspect-ratio: 1; object-fit: contain; margin-bottom: 6px; }
  h1 { font-size: 2.4rem; color: var(--campo); }
  .luogo { font-weight: 600; }
  .orari { color: var(--ardesia-2); }
  .instagram {
    display: inline-flex; align-items: center; gap: 8px; min-height: 44px; margin-top: 6px; padding: 8px 16px;
    border-radius: 999px; background: var(--superficie); font-weight: 700; text-decoration: none; color: var(--campo);
  }
  .instagram svg { fill: none; stroke: currentColor; stroke-width: 2; }

  .testata { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .testata a, .riquadro a { font-weight: 600; color: var(--campo); }
  .notizie ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .notizie li, .notizie article { height: 100%; }
  .riquadro { display: grid; gap: 6px; align-content: start; padding: 16px; background: var(--superficie); border-radius: var(--r-m); border-left: 4px solid var(--campo); }
  .riquadro h2 { font-size: 1.35rem; }
  .riquadro h3 { font-size: 1.2rem; }
  .etichetta { font-weight: 600; text-transform: uppercase; color: var(--ardesia-2); }
  .testo { white-space: pre-line; display: -webkit-box; -webkit-line-clamp: 4; line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .copertina { width: 100%; max-height: 220px; object-fit: cover; border-radius: var(--r-s); }
  .giorno::first-letter { text-transform: uppercase; }
  .fase { font-weight: 600; color: var(--campo); }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0; }
  dl:empty { display: none; }
  dt { color: var(--ardesia-2); font-size: 0.85rem; padding-top: 2px; }
  dd { margin: 0; white-space: pre-line; }

  nav a {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    min-height: 56px; padding: 10px 16px;
    font-family: var(--font-titolo); font-weight: 700; font-size: 1.35rem; text-decoration: none;
  }
  nav svg { flex: none; fill: none; stroke: var(--campo); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }

  @media (max-width: 719px) {
    .solo-desktop { display: none; }
    .lista > li.solo-desktop + li:not(.solo-desktop) { border-top: 0; } /* prima voce visibile: niente riga sopra */
    .notizie li + li { display: none; } /* su telefono solo l'ultima notizia */
  }
  @media (max-width: 999px) { .solo-pc { display: none; } }
  /* PC: la home esce dai 640px della pagina (fino a 1120px) e va su due colonne. */
  @media (min-width: 1000px) {
    .home { margin-inline: calc(50% - min(50vw - 24px, 560px)); grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
    .largo { grid-column: 1 / -1; }
    .evento { grid-template-columns: auto 1fr; justify-items: start; align-items: center; gap: 32px; text-align: left; }
    .logo { width: 200px; margin: 0; }
    h1 { font-size: 3rem; }
    nav a { font-size: 1.15rem; min-height: 48px; }
  }
  .sponsor { display: grid; gap: 10px; justify-items: center; min-width: 0; padding-top: 12px; border-top: 1px solid var(--linea); text-align: center; }
  .sponsor h2 { font-family: var(--font-testo); font-weight: 600; text-transform: uppercase; color: var(--ardesia-2); }
</style>
