<script>
  import { getContext } from 'svelte'
  import { formatDataOra } from '../lib/format.js'

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
      <p class="testo">{n.testo}</p>
    </article>
  {/each}
{/if}

<style>
  .notizia { display: grid; gap: 6px; padding: 16px; background: var(--superficie); border-radius: var(--r-m); }
  h2 { font-size: 1.35rem; }
  .testo { white-space: pre-line; }
</style>
