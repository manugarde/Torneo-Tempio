<script>
  import { getContext } from 'svelte'
  import { formatDataOra } from '../lib/format.js'
  import { pulisciHtml } from '../lib/pulisci.js'

  const ed = getContext('ed')
  const notizie = $derived([...ed.notizie].sort((a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0)))
</script>

<h1>Notizie</h1>

{#if !ed.pronta('notizie')}
  <p class="muted" role="status">Caricamento…</p>
{:else if !notizie.length}
  <p class="vuoto">Nessuna notizia per ora.</p>
{:else}
  {#each notizie as n (n.id)}
    <article class="notizia">
      <p class="small muted">{formatDataOra(n.data)}</p>
      <h2>{n.titolo}</h2>
      {#if n.html}<div class="contenuto">{@html pulisciHtml(n.html)}</div>{:else}<p class="testo">{n.testo}</p>{/if}
    </article>
  {/each}
{/if}

<style>
  .notizia { display: grid; gap: 6px; padding: 16px; background: var(--superficie); border-radius: var(--r-m); }
  h2 { font-size: 1.35rem; }
  .testo { white-space: pre-line; }
  .contenuto { display: grid; gap: 10px; overflow-wrap: anywhere; }
  .contenuto :global(h2) { font-size: 1.25rem; }
  .contenuto :global(h3) { font-size: 1.1rem; }
  .contenuto :global(ul), .contenuto :global(ol) { margin: 0; padding-left: 1.3em; }
  .contenuto :global(img) { width: 100%; height: auto; border-radius: var(--r-s); }
  .contenuto :global(a) { color: var(--campo); font-weight: 600; }
  .contenuto :global(p:empty) { display: none; }
</style>
