<script>
  import { login } from '../lib/auth.svelte.js'

  /** @type {{ onchiudi: () => void }} */
  let { onchiudi } = $props()

  let email = $state('')
  let password = $state('')
  let errore = $state('')
  let invio = $state(false)
  let dialog

  $effect(() => { dialog.showModal() })

  async function accedi(e) {
    e.preventDefault()
    errore = ''
    invio = true
    try {
      await login(email, password)
      onchiudi()
    } catch (err) {
      errore = err.message
    } finally {
      invio = false
    }
  }
</script>

<dialog bind:this={dialog} onclose={onchiudi} aria-labelledby="titolo-login">
  <form onsubmit={accedi}>
    <h2 id="titolo-login">Area staff</h2>
    <label class="campo-form">
      Email
      <input type="email" autocomplete="username" required bind:value={email} />
    </label>
    <label class="campo-form">
      Password
      <input type="password" autocomplete="current-password" required bind:value={password} />
    </label>
    {#if errore}<p class="errore" role="alert">{errore}</p>{/if}
    <div class="azioni">
      <button type="button" class="btn" onclick={() => dialog.close()}>Annulla</button>
      <button class="btn primario" disabled={invio}>{invio ? 'Accesso…' : 'Accedi'}</button>
    </div>
  </form>
</dialog>

<style>
  dialog {
    width: min(400px, calc(100vw - 32px)); border: none; border-radius: var(--r-m);
    padding: 20px; background: var(--superficie); color: var(--ardesia);
  }
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
  form { display: grid; gap: 14px; }
  .azioni { display: flex; justify-content: flex-end; gap: 8px; }
</style>
