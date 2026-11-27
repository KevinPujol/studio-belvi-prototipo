// Light markup for editable texts: editors write **bold**, *italic* and line breaks, never HTML.

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Editable text → safe HTML (escaped, then **bold**, *italic*, line breaks). */
export function md(s: string | null | undefined): string {
  if (!s) return '';
  return escape(s.trim())
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\r?\n/g, '<br>');
}

/** Editable text → plain text (for titles, alt and meta tags). */
export function plain(s: string | null | undefined): string {
  return (s ?? '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*([^*\n]+?)\*/g, '$1').replace(/\s*\n\s*/g, ' ').trim();
}

/** "The Wedding Signs" → "the-wedding-signs" (anchors for packs without an explicit slug). */
export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
