<script>
  import { route, href } from '../lib/router.svelte.js'

  const voci = [
    { nome: '', testo: 'Home', d: 'M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5' },
    { nome: 'partite', testo: 'Partite', d: 'M4 5h16v14H4zM12 5v14M4 12h3M17 12h3' },
    { nome: 'gironi', testo: 'Gironi', d: 'M5 6h14M5 12h14M5 18h14M3 6h0M3 12h0M3 18h0' },
    { nome: 'giocatori', testo: 'Giocatori', d: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7' },
    { nome: 'tabellone', testo: 'Tabellone', d: 'M3 5h5v4H3zM3 15h5v4H3zM8 7h3v10H8M11 12h4M15 10h6v4h-6z' },
    { nome: 'chiosco', testo: 'Chiosco', d: 'M7 4h10l-1 16H8zM7 9h10' },
  ]
  const attiva = $derived(route.nome === 'partita' ? 'partite' : route.nome)
</script>

<nav aria-label="Sezioni">
  {#each voci as v (v.nome)}
    <a href={href(`/${v.nome}`)} aria-current={attiva === v.nome ? 'page' : undefined}>
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d={v.d} /></svg>
      <span>{v.testo}</span>
    </a>
  {/each}
</nav>

<style>
  nav {
    position: fixed; z-index: var(--z-nav); left: 0; right: 0; bottom: 0;
    display: grid; grid-template-columns: repeat(6, 1fr);
    height: calc(var(--nav-h) + env(safe-area-inset-bottom));
    padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    background: var(--superficie); border-top: 1px solid var(--linea);
  }
  a {
    display: grid; place-items: center; align-content: center; gap: 2px;
    text-decoration: none; font-size: 0.75rem; font-weight: 600; color: var(--ardesia-2);
  }
  svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  a[aria-current='page'] { color: var(--campo); }
  a[aria-current='page'] svg { stroke-width: 2.4; }
</style>
