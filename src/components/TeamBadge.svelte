<script>
  import { href } from '../lib/router.svelte.js'

  /** @type {{ squadra?: any, size?: 'sm'|'md'|'lg', nome?: boolean, link?: boolean, vincente?: boolean }} */
  let { squadra, size = 'md', nome = true, link = true, vincente = false } = $props()

  const iniziali = $derived(
    (squadra?.nome ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
  )
</script>

{#snippet contenuto()}
  {#if squadra?.logo}
    <img class="logo" src={squadra.logo} alt="" width="40" height="40" />
  {:else}
    <span class="logo iniziali" aria-hidden="true">{squadra ? iniziali : ''}</span>
  {/if}
  {#if nome}
    <span class="nome" class:vincente class:indefinita={!squadra}>{squadra?.nome ?? 'Da definire'}</span>
  {/if}
{/snippet}

{#if link && squadra}
  <a class="badge {size}" href={href(`/squadra/${squadra.id}`)}>{@render contenuto()}</a>
{:else}
  <span class="badge {size}">{@render contenuto()}</span>
{/if}

<style>
  .badge { display: inline-flex; align-items: center; gap: 8px; min-width: 0; text-decoration: none; }
  .logo { flex: none; width: 28px; height: 28px; border-radius: 50%; object-fit: cover; background: var(--superficie); }
  .md .logo { width: 32px; height: 32px; }
  .lg .logo { width: 56px; height: 56px; }
  .sm .logo { width: 22px; height: 22px; }
  .iniziali {
    display: grid; place-items: center;
    font-family: var(--font-titolo); font-weight: 800; font-size: 0.8rem;
    background: var(--campo-chiaro); color: var(--campo);
    border: 1px solid var(--linea);
  }
  .lg .iniziali { font-size: 1.3rem; }
  .nome { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
  .lg .nome { font-family: var(--font-titolo); font-weight: 800; font-size: 1.6rem; white-space: normal; }
  .vincente { font-weight: 700; }
  .indefinita { color: var(--ardesia-2); font-style: italic; }
</style>
