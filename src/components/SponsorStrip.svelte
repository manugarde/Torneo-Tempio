<script>
  /** @type {{ sponsor: Array<{ id: string, nome: string, logo?: string, sito?: string, creato?: Date }> }} */
  let { sponsor } = $props()

  const elenco = $derived([...sponsor].sort((a, b) => (a.creato?.getTime?.() ?? 0) - (b.creato?.getTime?.() ?? 0)))
  const scorre = $derived(elenco.length > 4)
  let tocco = $state(false)
</script>

{#snippet voci(copia)}
  {#each elenco as s (s.id)}
    <li>
      {#if s.sito}
        <a href={s.sito} target="_blank" rel="noopener noreferrer" tabindex={copia ? -1 : undefined} title={s.nome}>
          {#if s.logo}<img src={s.logo} alt={s.nome} />{:else}<span class="nome">{s.nome}</span>{/if}
        </a>
      {:else}
        <span class="voce" title={s.nome}>
          {#if s.logo}<img src={s.logo} alt={s.nome} />{:else}<span class="nome">{s.nome}</span>{/if}
        </span>
      {/if}
    </li>
  {/each}
{/snippet}

{#if scorre}
  <div
    class="striscia"
    class:fermo={tocco}
    onpointerdown={() => (tocco = true)}
    onpointerup={() => (tocco = false)}
    onpointercancel={() => (tocco = false)}
    onpointerleave={() => (tocco = false)}
  >
    <div class="nastro" style="--durata: {elenco.length * 4}s">
      <ul>{@render voci(false)}</ul>
      <ul class="copia" aria-hidden="true">{@render voci(true)}</ul>
    </div>
  </div>
{:else}
  <ul class="fermi">{@render voci(false)}</ul>
{/if}

<style>
  ul { list-style: none; margin: 0; padding: 0; display: flex; align-items: center; gap: 28px; }
  .fermi { flex-wrap: wrap; justify-content: center; }
  li { flex: none; }
  a, .voce { display: flex; align-items: center; justify-content: center; min-height: 44px; text-decoration: none; }
  img { height: 56px; width: auto; max-width: 140px; object-fit: contain; }
  .nome { font-weight: 600; white-space: nowrap; }

  /* Striscia che scorre: due copie affiancate, il nastro si sposta di metà e riparte. */
  .striscia { overflow: hidden; width: 100%; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
  .nastro { display: flex; width: max-content; animation: scorri var(--durata) linear infinite; }
  .nastro ul { padding-right: 28px; }
  .striscia:hover .nastro, .striscia:focus-within .nastro, .striscia.fermo .nastro { animation-play-state: paused; }
  @keyframes scorri { to { transform: translateX(-50%); } }

  @media (prefers-reduced-motion: reduce) {
    .striscia { overflow-x: auto; mask-image: none; }
    .nastro { animation: none; }
    .copia { display: none; }
  }
  @media (max-width: 719px) {
    ul { gap: 20px; }
    .nastro ul { padding-right: 20px; }
    img { height: 40px; max-width: 100px; }
  }
</style>
