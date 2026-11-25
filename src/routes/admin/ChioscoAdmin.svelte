<script>
  import { getContext } from 'svelte'
  import TeamBadge from '../../components/TeamBadge.svelte'
  import { saveChiosco } from '../../lib/api.js'
  import { chiaveGiorno } from '../../lib/format.js'

  const ed = getContext('ed')
  let giorno = $state(chiaveGiorno(new Date()))
  let punti = $state({})
  let errore = $state('')
  let salvato = $state(false)

  // Ricarica i punti già salvati quando cambia il giorno (non a ogni snapshot, per non perdere modifiche in corso).
  let caricato = ''
  $effect(() => {
    if (!ed.pronta('chiosco') || caricato === giorno) return
    caricato = giorno
    punti = { ...(ed.chiosco.find((c) => c.id === giorno)?.punti ?? {}) }
    salvato = false
  })

  async function salva(e) {
    e.preventDefault()
    errore = ''
    const puliti = Object.fromEntries(Object.entries(punti).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, Number(v)]))
    try {
      await saveChiosco(ed.anno, giorno, puliti)
      salvato = true
    } catch (err) {
      errore = err.message
    }
  }
</script>

<form class="form" onsubmit={salva}>
  <h2>Punti Coppa Chiosco</h2>
  <label class="campo-form">Giornata <input type="date" required bind:value={giorno} /></label>
  {#each ed.squadre as s (s.id)}
    <label class="riga">
      <TeamBadge squadra={s} link={false} />
      <input class="num" type="number" inputmode="numeric" placeholder="0" aria-label="Punti {s.nome}" bind:value={punti[s.id]} oninput={() => (salvato = false)} />
    </label>
  {:else}
    <p class="muted">Prima inserisci le squadre.</p>
  {/each}
  {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
  <button class="btn primario">{salvato ? 'Punti salvati' : 'Salva punti della giornata'}</button>
</form>

<style>
  .riga { display: grid; grid-template-columns: 1fr 90px; align-items: center; gap: 10px; }
  .riga input { min-height: 44px; padding: 6px 8px; border: 1px solid var(--linea); border-radius: var(--r-s); background: var(--granito); text-align: right; }
</style>
