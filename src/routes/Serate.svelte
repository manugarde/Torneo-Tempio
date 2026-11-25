<script>
  import { getContext } from 'svelte'
  import { chiaveGiorno, formatGiorno, dataGiorno } from '../lib/format.js'

  const ed = getContext('ed')
  const serate = $derived([...ed.serate].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? '')))
  const oggi = chiaveGiorno(new Date())
</script>

<h1>Eventi giornalieri</h1>

{#if !ed.pronta('serate')}
  <p class="muted" role="status">Caricamento…</p>
{:else if !serate.length}
  <p class="vuoto">Il programma delle serate non è ancora stato pubblicato.</p>
{:else}
  {#each serate as s (s.id)}
    <article class="serata" class:oggi={s.data === oggi}>
      <h2 class="giorno">
        {formatGiorno(dataGiorno(s.data))}
        {#if s.data === oggi}<span class="badge small">Oggi</span>{/if}
      </h2>
      {#if s.fase}<p class="fase">{s.fase}</p>{/if}
      <dl>
        {#if s.menu}<dt>Si mangia</dt><dd>{s.menu}</dd>{/if}
        {#if s.musica}<dt>Evento</dt><dd>{s.musica}</dd>{/if}
        {#if s.note}<dt>Note</dt><dd>{s.note}</dd>{/if}
      </dl>
    </article>
  {/each}
{/if}

<style>
  .serata { display: grid; gap: 8px; padding: 16px; background: var(--superficie); border-radius: var(--r-m); }
  .serata.oggi { outline: 2px solid var(--campo); }
  .giorno { font-size: 1.35rem; display: flex; align-items: center; gap: 10px; }
  .giorno::first-letter { text-transform: uppercase; }
  .badge { font-family: var(--font-testo); font-weight: 600; color: var(--su-campo); background: var(--campo); padding: 1px 8px; border-radius: 999px; }
  .fase { font-weight: 600; color: var(--campo); }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0; }
  dl:empty { display: none; }
  dt { color: var(--ardesia-2); font-size: 0.85rem; padding-top: 2px; }
  dd { margin: 0; white-space: pre-line; }
</style>
