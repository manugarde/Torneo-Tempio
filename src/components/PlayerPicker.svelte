<script>
  import { getContext } from 'svelte'
  import { isSuspended } from '../lib/calc/suspensions.js'

  /**
   * Scelta del giocatore dopo il tasto evento: il secondo dei 2 tocchi.
   * @type {{ squadra: any, tipo: string, partitaId: string, onscegli: (giocatoreId: string|null) => void, onchiudi: () => void }}
   */
  let { squadra, tipo, partitaId, onscegli, onchiudi } = $props()

  const calc = getContext('calc')
  const titoli = { gol: 'Chi ha segnato?', autogol: 'Chi ha fatto autogol?', giallo: 'Chi è ammonito?', rosso: 'Chi è espulso?' }
  const giocatori = $derived([...(squadra?.giocatori ?? [])].sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99)))
  let dialog

  $effect(() => { dialog.showModal() })

  function scegli(id) {
    onscegli(id)
    dialog.close()
  }
</script>

<dialog bind:this={dialog} onclose={onchiudi} aria-labelledby="titolo-picker">
  <h2 id="titolo-picker">{titoli[tipo]}</h2>
  <p class="small muted">{squadra?.nome}</p>
  <ul>
    {#if tipo === 'gol' || tipo === 'autogol'}
      <li><button class="voce sconosciuto" onclick={() => scegli(null)}>Marcatore sconosciuto</button></li>
    {/if}
    {#each giocatori as g (g.id)}
      <li>
        <button class="voce" onclick={() => scegli(g.id)}>
          <span class="numero num">{g.numero ?? ''}</span>
          <span>{g.nome}</span>
          {#if isSuspended(calc.sospensioni, g.id, partitaId)}<span class="tag squalificato">Squalificato</span>{/if}
        </button>
      </li>
    {:else}
      <li class="muted small">Rosa vuota: aggiungi i giocatori da Gestione → Squadre.</li>
    {/each}
  </ul>
  <button class="btn" onclick={() => dialog.close()}>Annulla</button>
</dialog>

<style>
  dialog {
    width: min(420px, calc(100vw - 24px)); max-height: 85dvh; border: none; border-radius: var(--r-m);
    padding: 16px; background: var(--superficie); color: var(--ardesia);
  }
  dialog[open] { display: grid; gap: 10px; }
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
  ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; display: grid; gap: 4px; }
  .voce {
    width: 100%; min-height: 52px; display: flex; align-items: center; gap: 12px; padding: 8px 12px;
    border: 1px solid var(--linea); border-radius: var(--r-s); background: var(--granito); text-align: left; cursor: pointer;
    font-weight: 600;
  }
  .sconosciuto { font-style: italic; font-weight: 500; }
  .numero { width: 2ch; font-family: var(--font-titolo); font-weight: 800; font-size: 1.2rem; text-align: right; }
  .tag { margin-left: auto; }
</style>
