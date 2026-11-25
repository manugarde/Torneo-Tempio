<script>
  import { getContext } from 'svelte'
  import PlayerPicker from './PlayerPicker.svelte'
  import EventIcon from './EventIcon.svelte'
  import { addEvento, setStato, setRigori } from '../lib/api.js'
  import { matchScore, canFinish } from '../lib/calc/score.js'
  import { advanceUpdates } from '../lib/calc/bracket.js'

  /** @type {{ partita: any, squadre: Map<string, any> }} */
  let { partita, squadre } = $props()
  const ed = getContext('ed')

  let picker = $state(null) // { lato, tipo }
  let errore = $state('')

  const s = $derived(matchScore(partita))
  const pari = $derived(s.casa === s.ospite)
  const serveRigori = $derived(partita.fase === 'eliminazione' && pari && partita.stato !== 'programmata')
  const rigori = $derived(partita.rigori ?? { casa: 0, ospite: 0 })

  // Non si attende il server: offline le scritture vanno in coda.
  function esegui(promessa) {
    errore = ''
    promessa.catch((e) => { errore = e.message ?? 'Salvataggio non riuscito.' })
  }

  function registra(giocatoreId) {
    const squadraId = picker.lato === 'casa' ? partita.casaId : partita.ospiteId
    esegui(addEvento(ed.anno, partita.id, { tipo: picker.tipo, squadraId, giocatoreId }))
  }

  function cambiaStato(stato) {
    try {
      esegui(setStato(ed.anno, partita, stato))
    } catch (e) {
      errore = e.message
    }
  }

  function aggiornaRigori(lato, valore) {
    esegui(setRigori(ed.anno, partita.id, { ...rigori, [lato]: Math.max(0, Number(valore) || 0) }))
  }

  // Correzione di una partita a eliminazione già chiusa: riallinea la squadra nel turno successivo.
  $effect(() => {
    if (partita.stato !== 'finita' || !partita.prossima) return
    const [u] = advanceUpdates(partita)
    const prossima = ed.partite.find((p) => p.id === u.partitaId)
    if (prossima && (prossima[u.campo] ?? null) !== u.valore) esegui(setStato(ed.anno, partita, 'finita'))
  })

  const tipi = [
    { tipo: 'gol', testo: 'Gol' },
    { tipo: 'giallo', testo: 'Giallo' },
    { tipo: 'rosso', testo: 'Rosso' },
    { tipo: 'autogol', testo: 'Autogol' },
  ]
</script>

<section class="editor" aria-label="Gestione partita">
  <div class="colonne">
    {#each ['casa', 'ospite'] as lato (lato)}
      {@const sq = squadre.get(lato === 'casa' ? partita.casaId : partita.ospiteId)}
      <div class="colonna">
        <h3>{sq?.nome ?? 'Da definire'}</h3>
        {#each tipi as t (t.tipo)}
          <button class="btn evento {t.tipo}" disabled={!sq} onclick={() => (picker = { lato, tipo: t.tipo })}>
            <EventIcon tipo={t.tipo} /> {t.testo}
          </button>
        {/each}
      </div>
    {/each}
  </div>

  {#if serveRigori}
    <fieldset class="rigori">
      <legend>Rigori</legend>
      {#each ['casa', 'ospite'] as lato (lato)}
        <label class="campo-form">
          {squadre.get(lato === 'casa' ? partita.casaId : partita.ospiteId)?.nome ?? lato}
          <input type="number" inputmode="numeric" min="0" value={rigori[lato]} onchange={(e) => aggiornaRigori(lato, e.currentTarget.value)} />
        </label>
      {/each}
    </fieldset>
  {/if}

  <div class="stato">
    {#if partita.stato === 'programmata'}
      <button class="btn primario largo" disabled={!partita.casaId || !partita.ospiteId} onclick={() => cambiaStato('live')}>Inizia partita</button>
    {:else if partita.stato === 'live'}
      <button class="btn primario largo" disabled={!canFinish(partita)} onclick={() => cambiaStato('finita')}>Termina partita</button>
      {#if !canFinish(partita)}<p class="small muted">Pareggio in fase finale: inserisci i rigori per chiudere.</p>{/if}
    {:else}
      <button class="btn largo" onclick={() => cambiaStato('live')}>Riapri partita</button>
    {/if}
  </div>
  {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
</section>

{#if picker}
  {@const sq = squadre.get(picker.lato === 'casa' ? partita.casaId : partita.ospiteId)}
  <PlayerPicker squadra={sq} tipo={picker.tipo} partitaId={partita.id} onscegli={registra} onchiudi={() => (picker = null)} />
{/if}

<style>
  .editor { display: grid; gap: 16px; padding: 16px; background: var(--superficie); border-radius: var(--r-m); border: 2px solid var(--campo); }
  .colonne { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .colonna { display: grid; gap: 8px; align-content: start; }
  h3 { font-size: 1.1rem; overflow-wrap: anywhere; }
  .evento { min-height: 52px; display: flex; align-items: center; justify-content: flex-start; gap: 10px; }
  .evento.gol { border-color: var(--campo); }
  .rigori { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border: 1px solid var(--linea); border-radius: var(--r-s); }
  .stato { display: grid; gap: 6px; }
  .largo { width: 100%; min-height: 52px; }
</style>
