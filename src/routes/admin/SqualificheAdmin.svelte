<script>
  import { getContext } from 'svelte'
  import { saveSqualificaManuale, deleteSqualificaManuale } from '../../lib/api.js'
  import { perId, ordinaPerData, trovaGiocatore } from '../../lib/util.js'
  import { formatDataOra } from '../../lib/format.js'

  const ed = getContext('ed')
  const squadre = $derived(perId(ed.squadre))
  const auto = $derived(ed.impostazioni.squalifiche.modo === 'auto')

  let bozza = $state(null)
  let errore = $state('')

  const partiteSquadra = $derived(bozza ? ordinaPerData(ed.partite.filter((p) => p.casaId === bozza.squadraId || p.ospiteId === bozza.squadraId)) : [])
  const avversario = (p) => squadre.get(p.casaId === bozza.squadraId ? p.ospiteId : p.casaId)?.nome ?? 'da definire'

  async function salva(e) {
    e.preventDefault()
    errore = ''
    try {
      await saveSqualificaManuale(ed.anno, { ...bozza, partite: bozza.tipo === 'aggiungi' ? Number(bozza.partite) : null })
      bozza = null
    } catch (err) {
      errore = err.message
    }
  }

  const descrivi = (s) => {
    const p = ed.partite.find((x) => x.id === s.daPartitaId)
    const quando = p ? formatDataOra(p.dataOra) : 'partita eliminata'
    return s.tipo === 'aggiungi' ? `Fermo ${s.partite} partit${s.partite === 1 ? 'a' : 'e'} da ${quando}` : `Squalifica annullata per ${quando}`
  }
</script>

<p class="small muted">
  {auto
    ? 'Modo automatico: le squalifiche da cartellini sono calcolate da sole. Qui aggiungi squalifiche disciplinari o annulli quelle automatiche.'
    : 'Modo manuale: le squalifiche sono solo quelle inserite qui.'}
</p>

{#if bozza}
  <form class="form" onsubmit={salva}>
    <h2>Nuova decisione</h2>
    <div class="form-riga">
      <label class="campo-form">Squadra
        <select required bind:value={bozza.squadraId} onchange={() => { bozza.giocatoreId = ''; bozza.daPartitaId = '' }}>
          <option value="" disabled>Scegli</option>
          {#each ed.squadre as s (s.id)}<option value={s.id}>{s.nome}</option>{/each}
        </select>
      </label>
      <label class="campo-form">Giocatore
        <select required bind:value={bozza.giocatoreId} disabled={!bozza.squadraId}>
          <option value="" disabled>Scegli</option>
          {#each squadre.get(bozza.squadraId)?.giocatori ?? [] as g (g.id)}<option value={g.id}>{g.numero ?? ''} {g.nome}</option>{/each}
        </select>
      </label>
    </div>
    <div class="form-riga">
      <label class="campo-form">Tipo
        <select bind:value={bozza.tipo}>
          <option value="aggiungi">Squalifica</option>
          {#if auto}<option value="annulla">Annulla squalifica automatica</option>{/if}
        </select>
      </label>
      <label class="campo-form">{bozza.tipo === 'aggiungi' ? 'Dalla partita' : 'Nella partita'}
        <select required bind:value={bozza.daPartitaId} disabled={!bozza.squadraId}>
          <option value="" disabled>Scegli</option>
          {#each partiteSquadra as p (p.id)}<option value={p.id}>{formatDataOra(p.dataOra)} contro {avversario(p)}</option>{/each}
        </select>
      </label>
      {#if bozza.tipo === 'aggiungi'}
        <label class="campo-form">Partite di stop <input type="number" min="1" required bind:value={bozza.partite} /></label>
      {/if}
    </div>
    <label class="campo-form">Nota <input placeholder="Es. comportamento antisportivo" bind:value={bozza.nota} /></label>
    {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
    <div class="azioni">
      <button class="btn primario">Salva</button>
      <button type="button" class="btn" onclick={() => (bozza = null)}>Annulla</button>
    </div>
  </form>
{:else}
  <button class="btn primario" onclick={() => (bozza = { squadraId: '', giocatoreId: '', tipo: 'aggiungi', daPartitaId: '', partite: 1, nota: '' })}>Nuova decisione</button>
  {#if !ed.squalificheManuali.length}
    <p class="vuoto">Nessuna decisione manuale.</p>
  {:else}
    <ul class="lista">
      {#each ed.squalificheManuali as s (s.id)}
        {@const t = trovaGiocatore(ed.squadre, s.giocatoreId)}
        <li class="voce-admin">
          <span>
            <strong>{t?.giocatore.nome ?? 'Giocatore rimosso'}</strong> <span class="muted">{t?.squadra.nome ?? ''}</span><br />
            <span class="small">{descrivi(s)}{s.nota ? ` · ${s.nota}` : ''}</span>
          </span>
          <button class="btn pericolo" onclick={() => confirm('Eliminare questa decisione?') && deleteSqualificaManuale(ed.anno, s.id)}>Elimina</button>
        </li>
      {/each}
    </ul>
  {/if}
{/if}
