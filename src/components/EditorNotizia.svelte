<script>
  import { onMount } from 'svelte'
  import { resizeLogo } from '../lib/image.js'

  /** @type {{ html: string, onchange: (html: string) => void, onerrore: (msg: string) => void }} */
  let { html, onchange, onerrore } = $props()
  let box
  let quill

  onMount(async () => {
    // Quill solo in Gestione: import dinamico, il sito pubblico non lo scarica.
    const [{ default: Quill }] = await Promise.all([import('quill'), import('quill/dist/quill.snow.css')])
    quill = new Quill(box, {
      theme: 'snow',
      placeholder: 'Scrivi la notizia…',
      modules: {
        toolbar: {
          container: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'image'], ['clean']],
          handlers: { image: scegliImmagine },
        },
      },
    })
    if (html) quill.clipboard.dangerouslyPasteHTML(html)
    quill.on('text-change', () => onchange(quill.getLength() > 1 ? quill.getSemanticHTML() : ''))
  })

  function scegliImmagine() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const src = await resizeLogo(file, 1000, 250000)
        const pos = quill.getSelection(true)?.index ?? quill.getLength()
        quill.insertEmbed(pos, 'image', src, 'user')
        quill.setSelection(pos + 1)
      } catch (err) {
        onerrore(err.message)
      }
    }
    input.click()
  }
</script>

<div class="editor"><div bind:this={box}></div></div>

<style>
  .editor { background: var(--superficie); border-radius: var(--r-s); }
  .editor :global(.ql-container) { font: inherit; min-height: 220px; height: auto; } /* Quill mette height:100% e sborderebbe sotto la barra */
  .editor :global(.ql-editor img) { max-width: 100%; border-radius: var(--r-s); }
  .editor :global(.ql-toolbar) { border-radius: var(--r-s) var(--r-s) 0 0; }
  .editor :global(.ql-container) { border-radius: 0 0 var(--r-s) var(--r-s); }
</style>
