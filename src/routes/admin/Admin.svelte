<script>
  import Squadre from './Squadre.svelte'
  import Calendario from './Calendario.svelte'
  import TabelloneAdmin from './TabelloneAdmin.svelte'
  import ChioscoAdmin from './ChioscoAdmin.svelte'
  import SerateAdmin from './SerateAdmin.svelte'
  import SqualificheAdmin from './SqualificheAdmin.svelte'
  import Impostazioni from './Impostazioni.svelte'

  const sezioni = [
    { id: 'squadre', testo: 'Squadre', c: Squadre },
    { id: 'calendario', testo: 'Calendario', c: Calendario },
    { id: 'tabellone', testo: 'Tabellone', c: TabelloneAdmin },
    { id: 'chiosco', testo: 'Chiosco', c: ChioscoAdmin },
    { id: 'serate', testo: 'Serate', c: SerateAdmin },
    { id: 'squalifiche', testo: 'Squalifiche', c: SqualificheAdmin },
    { id: 'impostazioni', testo: 'Impostazioni', c: Impostazioni },
  ]
  let attiva = $state('squadre')
  const Corrente = $derived(sezioni.find((s) => s.id === attiva).c)
</script>

<h1>Gestione</h1>
<p class="small muted">Per segnare gol e cartellini apri la partita dalla sezione Partite.</p>

<div class="schede" role="tablist" aria-label="Sezioni di gestione">
  {#each sezioni as s (s.id)}
    <button role="tab" aria-selected={attiva === s.id} onclick={() => (attiva = s.id)}>{s.testo}</button>
  {/each}
</div>

<div role="tabpanel"><Corrente /></div>

<style>
  .schede { display: flex; gap: 6px; overflow-x: auto; margin: 0 -16px; padding: 0 16px 4px; }
  .schede button {
    flex: none; min-height: 40px; padding: 6px 14px; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--linea); background: var(--superficie); font-weight: 600;
  }
  .schede button[aria-selected='true'] { background: var(--ardesia); color: var(--granito); border-color: var(--ardesia); }
  [role='tabpanel'] { display: grid; gap: 20px; }
</style>
