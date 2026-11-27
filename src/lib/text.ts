// Light markup for editable texts: editors write **bold**, *italic* and line breaks, never HTML.

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Markdown escapes the rich text editor writes for literal characters (e.g. "\\*" for a real asterisk).
const ESCAPED = /\\([\\`*_{}\[\]()#+\-.!~|<>])/g;
const PLACEHOLDER = (i: number) => `\u0000${i}\u0000`;

/** Editable text → safe HTML (escaped, then **bold**, *italic* or _italic_, line breaks).
 *  Same light markup the back office rich text editor (bold and italic buttons) writes. */
export function md(s: string | null | undefined): string {
  if (!s) return '';
  const literals: string[] = [];
  const protectedText = s.trim().replace(ESCAPED, (_, ch) => PLACEHOLDER(literals.push(ch) - 1));
  return escape(protectedText)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^\w_])_([^_\n]+?)_(?![\w_])/g, '$1<em>$2</em>')
    .replace(/\r?\n/g, '<br>')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => escape(literals[Number(i)]));
}

/** Editable text → plain text (for titles, alt and meta tags). */
export function plain(s: string | null | undefined): string {
  return (s ?? '')
    .replace(ESCAPED, '$1')
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => a ?? b)
    .replace(/\*([^*\n]+?)\*/g, '$1')
    .replace(/(^|[^\w_])_([^_\n]+?)_(?![\w_])/g, '$1$2')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

/** "The Wedding Signs" → "the-wedding-signs" (anchors for packs without an explicit slug). */
export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
