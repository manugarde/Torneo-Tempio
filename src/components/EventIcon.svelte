<script>
  /** @type {{ tipo: 'gol'|'autogol'|'giallo'|'rosso' }} */
  let { tipo } = $props()
  const etichette = { gol: 'Gol', autogol: 'Autogol', giallo: 'Ammonizione', rosso: 'Espulsione' }
</script>

<svg class="icona {tipo}" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label={etichette[tipo]}>
  {#if tipo === 'gol' || tipo === 'autogol'}
    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5" />
    <path d="M8 4.5l3 2.2-1.1 3.5H6.1L5 6.7z" fill="currentColor" />
  {:else}
    <rect x="4" y="2" width="8" height="12" rx="1.2" />
  {/if}
</svg>

<style>
  .icona { flex: none; vertical-align: -3px; }
  .autogol { color: var(--rosso); }
  .giallo rect { fill: var(--giallo); }
  .rosso rect { fill: var(--rosso); }
</style>
