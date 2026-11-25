<script>
  import { getContext } from 'svelte'
  import TeamBadge from '../components/TeamBadge.svelte'
  import { computeStandings } from '../lib/calc/standings.js'
  import { perId } from '../lib/util.js'

  const ed = getContext('ed')
  const squadre = $derived(perId(ed.squadre))
  const classifiche = $derived(computeStandings(ed.squadre, ed.partite, ed.impostazioni))
  const qualificati = $derived(ed.impostazioni.qualificatiPerGirone)
  const pariMerito = $derived(Object.values(classifiche).flat().some((r) => r.pariMerito && r.g > 0))
</script>

<h1>Gironi</h1>

{#if !ed.pronta('squadre')}
  <p class="muted" role="status">Caricamento…</p>
{:else if !Object.keys(classifiche).length}
  <p class="vuoto">Le squadre non sono ancora state inserite.</p>
{:else}
  {#each Object.entries(classifiche) as [girone, righe] (girone)}
    <section class="sezione">
      <h2>Girone {girone}</h2>
      <div class="tabella-wrap">
        <table class="num">
          <thead>
            <tr>
              <th scope="col" class="pos"><span class="sr">Posizione</span></th>
              <th scope="col" class="sq">Squadra</th>
              <th scope="col"><abbr title="Giocate">G</abbr></th>
              <th scope="col"><abbr title="Vinte">V</abbr></th>
              <th scope="col"><abbr title="Pareggiate">N</abbr></th>
              <th scope="col"><abbr title="Perse">P</abbr></th>
              <th scope="col"><abbr title="Differenza reti">DR</abbr></th>
              <th scope="col" class="pt"><abbr title="Punti">Pt</abbr></th>
            </tr>
          </thead>
          <tbody>
            {#each righe as r, i (r.squadraId)}
              <tr class:passa={i < qualificati}>
                <td class="pos">{i + 1}{r.pariMerito && r.g > 0 ? '*' : ''}</td>
                <td class="sq"><TeamBadge squadra={squadre.get(r.squadraId)} size="sm" /></td>
                <td>{r.g}</td><td>{r.v}</td><td>{r.n}</td><td>{r.p}</td>
                <td>{r.dr > 0 ? `+${r.dr}` : r.dr}</td>
                <td class="pt">{r.pt}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/each}
  <p class="small muted">
    <span class="legenda"></span> Accedono alla fase finale.
    {#if pariMerito}* Pari merito: l'ordine è deciso dallo staff.{/if}
  </p>
{/if}

<style>
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .tabella-wrap { background: var(--superficie); border-radius: var(--r-m); overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 10px 4px; text-align: center; }
  th { font-size: 0.8rem; font-weight: 600; color: var(--ardesia-2); border-bottom: 1px solid var(--linea); }
  abbr { text-decoration: none; }
  tbody tr + tr td { border-top: 1px solid var(--linea); }
  .pos { width: 34px; padding-left: 12px; text-align: left; color: var(--ardesia-2); }
  .sq { text-align: left; max-width: 150px; }
  .pt { font-weight: 700; padding-right: 12px; }
  tr.passa .pos { box-shadow: inset 4px 0 0 var(--campo); color: var(--campo); font-weight: 700; }
  .legenda { display: inline-block; width: 4px; height: 12px; background: var(--campo); vertical-align: -1px; margin-right: 4px; }
</style>
