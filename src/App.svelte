<script>
  import { route } from './lib/router.svelte.js'
  import { useMeta } from './lib/store.svelte.js'
  import { authState } from './lib/auth.svelte.js'
  import Vista from './Vista.svelte'
  import Benvenuto from './routes/Benvenuto.svelte'

  const meta = useMeta()
  const anno = $derived(route.query.ed ?? meta.corrente)
  // Schermata d'avvio di index.html: senza edizione la toglie qui, altrimenti Vista.svelte.
  $effect(() => { if (meta.ready && !anno) document.getElementById('avvio')?.remove() })
</script>

{#if !meta.ready}
  <!-- in attesa: si vede la schermata d'avvio di index.html -->
{:else if !anno}
  <Benvenuto staff={authState.isStaff} />
{:else}
  {#key anno}
    <Vista {anno} storica={!!route.query.ed && route.query.ed !== meta.corrente} edizioni={meta.edizioni} />
  {/key}
{/if}
