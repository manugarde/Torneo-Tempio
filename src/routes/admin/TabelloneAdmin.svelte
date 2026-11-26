<script>
  import { getContext } from 'svelte'
  import { savePartita, deletePartita, nuovoId } from '../../lib/api.js'
  import { computeStandings } from '../../lib/calc/standings.js'
  import { proposePairings } from '../../lib/calc/bracket.js'
  import { perId, perInputData, TURNI } from '../../lib/util.js'

  const ed = getContext('ed')
  const finali = $derived(ed.partite.filter((p) => p.fase === 'eliminazione'))
  const squadre = $derived(perId(ed.squadre))
  // Tutte le partite della fase finale, nell'ordine dei turni, per date e orari.
  const perTurno = $derived([...finali].sort((a, b) => TURNI.indexOf(a.turno) - TURNI.indexOf(b.turno) || a.slot - b.slot))
  const nomeSquadra = (id) => squadre.get(id)?.nome ?? 'Da definire'
  const NOMI = { 16: 'Ottavi', 8: 'Quarti', 4: 'Semifinale', 2: 'Finale' }

  let squadreTabellone = $state(4)
  let terzoPosto = $state(false)
  let errore = $state('')
  let messaggio = $state('')

  // Primo turno = turno con più partite.
  const primoTurno = $derived.by(() => {
    const perTurno = Object.groupBy(finali, (p) => p.turno)
    const [, ps] = Object.entries(perTurno).sort((a, b) => b[1].length - a[1].length)[0] ?? [null, []]
    return [...ps].sort((a, b) => a.slot - b.slot)
  })

  async function crea() {
    errore = ''
    // Turni dal primo alla finale; ogni partita i manda la vincente alla partita floor(i/2) del turno dopo.
    const turni = []
    for (let n = squadreTabellone; n >= 2; n /= 2) turni.push(Array.from({ length: n / 2 }, (_, i) => ({ id: nuovoId(), turno: NOMI[n], slot: i + 1 })))
    const partite = turni.flatMap((t, r) => t.map((p, i) => ({
      ...p, fase: 'eliminazione', girone: null, casaId: null, ospiteId: null, dataOra: null, campo: '',
      stato: 'programmata', eventi: [], rigori: null,
      prossima: turni[r + 1] ? { partitaId: turni[r + 1][Math.floor(i / 2)].id, lato: i % 2 ? 'ospite' : 'casa' } : null,
    })))
    if (terzoPosto) partite.push({ id: nuovoId(), turno: '3° posto', slot: 1, fase: 'eliminazione', girone: null, casaId: null, ospiteId: null, dataOra: null, campo: '', stato: 'programmata', eventi: [], rigori: null, prossima: null })
    try {
      await Promise.all(partite.map((p) => savePartita(ed.anno, p)))
      messaggio = 'Tabellone creato. Imposta date e orari dal Calendario.'
    } catch (err) {
      errore = err.message
    }
  }

  async function proponi() {
    errore = ''
    const coppie = proposePairings(computeStandings(ed.squadre, ed.partite, ed.impostazioni), ed.impostazioni.qualificatiPerGirone)
    if (!coppie.length || coppie.length !== primoTurno.length) {
      errore = `Proposta non disponibile per ${coppie.length || 'questi'} accoppiamenti su ${primoTurno.length} partite: assegna le squadre a mano.`
      return
    }
    await Promise.all(primoTurno.map((p, i) => savePartita(ed.anno, { id: p.id, ...coppie[i] })))
    messaggio = 'Accoppiamenti proposti dalle classifiche. Puoi correggerli qui sotto.'
  }

  const cambiaData = (p, valore) => savePartita(ed.anno, { id: p.id, dataOra: valore ? new Date(valore) : null }).catch((e) => { errore = e.message })
  const assegna = (p, campo, valore) => savePartita(ed.anno, { id: p.id, [campo]: valore || null }).catch((e) => { errore = e.message })

  async function eliminaTutto() {
    if (!confirm('Eliminare tutto il tabellone e i suoi risultati?')) return
    await Promise.all(finali.map((p) => deletePartita(ed.anno, p.id)))
    messaggio = ''
  }
</script>

{#if !finali.length}
  <div class="form">
    <h2>Crea il tabellone</h2>
    <label class="campo-form">Squadre nella fase finale
      <select bind:value={squadreTabellone}>
        {#each [2, 4, 8, 16] as n (n)}<option value={n}>{n} squadre ({NOMI[n]})</option>{/each}
      </select>
    </label>
    <label class="check"><input type="checkbox" bind:checked={terzoPosto} /> Finale 3° posto</label>
    <button class="btn primario" onclick={crea}>Crea tabellone</button>
  </div>
{:else}
  <div class="form">
    <h2>{primoTurno[0]?.turno}: accoppiamenti</h2>
    <button class="btn" onclick={proponi}>Proponi dalle classifiche</button>
    {#each primoTurno as p (p.id)}
      <div class="form-riga">
        {#each [['casaId', 'Casa'], ['ospiteId', 'Ospite']] as [campo, etichetta] (campo)}
          <label class="campo-form">{etichetta} {p.slot}
            <select value={p[campo] ?? ''} onchange={(e) => assegna(p, campo, e.currentTarget.value)}>
              <option value="">Da definire</option>
              {#each ed.squadre as s (s.id)}<option value={s.id}>{s.nome} ({s.girone})</option>{/each}
            </select>
          </label>
        {/each}
      </div>
    {/each}
    <p class="small muted">I turni successivi si riempiono da soli quando una partita viene chiusa. La finale 3° posto va assegnata qui o dal Calendario.</p>
  </div>
  <div class="form">
    <h2>Date e orari</h2>
    {#each perTurno as p (p.id)}
      <label class="campo-form">{p.turno}{p.turno === 'Finale' || p.turno === '3° posto' ? '' : ` ${p.slot}`} · {nomeSquadra(p.casaId)} – {nomeSquadra(p.ospiteId)}
        <input type="datetime-local" value={perInputData(p.dataOra)} onchange={(e) => cambiaData(p, e.currentTarget.value)} />
      </label>
    {/each}
  </div>
  <button class="btn pericolo" onclick={eliminaTutto}>Elimina tabellone</button>
{/if}
{#if messaggio}<p role="status">{messaggio}</p>{/if}
{#if errore}<p class="errore" role="alert">{errore}</p>{/if}

<style>
  .check { display: flex; align-items: center; gap: 8px; min-height: 44px; }
  .check input { width: 22px; height: 22px; }
</style>
