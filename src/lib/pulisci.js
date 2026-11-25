import DOMPurify from 'dompurify'

// I link delle notizie si aprono in una nuova scheda, senza dare accesso alla pagina.
DOMPurify.addHook('afterSanitizeAttributes', (n) => {
  if (n.tagName === 'A') { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer') }
})

/** HTML delle notizie ripulito: solo formattazione, link e immagini (anche data:). */
export function pulisciHtml(html) {
  return DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS: ['h2', 'h3', 'p', 'br', 'strong', 'em', 'u', 's', 'ol', 'ul', 'li', 'a', 'img', 'blockquote', 'span'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class', 'data-list'],
  })
}
