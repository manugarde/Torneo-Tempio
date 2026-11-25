<script>
  import { getContext } from 'svelte'
  import TeamBadge from '../components/TeamBadge.svelte'
  import { formatGiorno } from '../lib/format.js'

  const ed = getContext('ed')

  const giornate = $derived([...ed.chiosco].sort((a, b) => a.giorno.localeCompare(b.giorno)))
  const ultima = $derived(giornate.at(-1))
  const classifica = $derived(
    ed.squadre
      .map((s) => ({
        squadra: s,
        punti: giornate.reduce((tot, g) => tot + (Number(g.punti?.[s.id]) || 0), 0),
        ultima: Number(ultima?.punti?.[s.id]) || 0,
      }))
      .sort((a, b) => b.punti - a.punti || a.squadra.nome.localeCompare(b.squadra.nome, 'it')),
  )
  const dataUltima = $derived(ultima ? formatGiorno(new Date(`${ultima.giorno}T12:00:00`)) : '')
</script>

<h1>Coppa Chiosco</h1>

{#if !ed.pronta('chiosco') || !ed.pronta('squadre')}
  <p class="muted" role="status">Caricamento…</p>
{:else if !giornate.length}
  <p class="vuoto">I punti vengono pubblicati dallo staff a fine giornata.</p>
{:else}
  <p class="small muted">Aggiornata a {dataUltima}.</p>
  <ol class="lista">
    {#each classifica as r, i (r.squadra.id)}
      <li class="riga" class:primo={i === 0 && r.punti > 0}>
        <span class="pos num">{i > 0 && classifica[i - 1].punti === r.punti ? '' : i + 1}</span>
        <TeamBadge squadra={r.squadra} />
        <span class="punti num">
          {r.punti}
          {#if r.ultima}<span class="delta small">+{r.ultima}</span>{/if}
        </span>
      </li>
    {/each}
  </ol>
{/if}

<style>
  .riga { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px; padding: 10px 16px; min-height: 56px; }
  .pos { color: var(--ardesia-2); }
  .primo .pos { color: var(--campo); font-weight: 700; }
  .punti { font-family: var(--font-titolo); font-weight: 800; font-size: 1.5rem; display: flex; align-items: baseline; gap: 6px; }
  .delta { font-family: var(--font-testo); font-weight: 600; color: var(--campo); }
</style>
