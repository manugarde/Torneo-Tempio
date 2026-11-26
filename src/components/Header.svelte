<script>
  import { getContext } from 'svelte'
  import { authState, logout } from '../lib/auth.svelte.js'
  import { href } from '../lib/router.svelte.js'
  import LoginDialog from './LoginDialog.svelte'

  /** @type {{ storica: boolean, largo?: boolean }} largo: in home su PC la pagina è larga 1120px */
  let { storica, largo = false } = $props()
  const ed = getContext('ed')
  let login = $state(false)
</script>

<header class:largo>
  <span></span>
  <a class="titolo" href={href('/')}>
    <span class="nome">{ed.impostazioni.nome}</span>
    <span class="anno num">{ed.anno}</span>
  </a>
  <div class="staff">
    {#if authState.isStaff}
      {#if ed.pending}<span class="attesa small" role="status">In attesa di rete</span>{/if}
      <a class="btn" href={href('/admin')}>Gestione</a>
      <button class="btn" onclick={logout}>Esci</button>
    {:else if authState.user}
      <button class="btn" onclick={logout}>Esci</button>
    {:else}
      <button class="btn chiave" onclick={() => (login = true)} aria-label="Area staff">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3" /></svg>
      </button>
    {/if}
  </div>
</header>
{#if storica}
  <p class="storica small">Stai guardando l'edizione {ed.anno}. <a href="#/">Vai all'edizione in corso</a></p>
{/if}
{#if login}<LoginDialog onchiudi={() => (login = false)} />{/if}

<style>
  header {
    max-width: 640px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px;
    padding: calc(12px + env(safe-area-inset-top)) 16px 4px;
  }
  .titolo { display: flex; align-items: baseline; gap: 8px; text-decoration: none; min-width: 0; }
  .nome { font-family: var(--font-titolo); font-weight: 800; font-size: clamp(1.25rem, 6vw, 1.7rem); line-height: 1; white-space: nowrap; }
  .anno { font-family: var(--font-titolo); font-weight: 700; font-size: 1.2rem; color: var(--campo); }
  .staff { display: flex; align-items: center; gap: 6px; justify-self: end; }
  .staff .btn { min-height: 40px; padding: 6px 12px; text-decoration: none; display: inline-flex; align-items: center; }
  .chiave { border-color: transparent; background: transparent; color: var(--ardesia-2); }
  .chiave svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linejoin: round; }
  .attesa { color: var(--rosso); font-weight: 600; }
  @media (min-width: 1000px) { header.largo { max-width: 1120px; } }
  .storica { max-width: 640px; margin: 8px auto 0; padding: 8px 16px; background: var(--giallo); color: #1e282c; }
</style>
