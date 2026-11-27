// Languages, URLs and localisation of content files.
// Content files use Sveltia's `single_file` i18n structure: { es: {...}, en: {...}, ca: {...} }.
// Spanish is the source language (the original catalogue is in Spanish); EN and CA override it.

export const LANGS = ['en', 'es', 'ca'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en'; // public site default (served at the root)
export const SOURCE_LANG = 'es'; // content default (always complete)

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Only the production site (studiobelvi.com at the root) may be indexed; prototypes and previews ask for noindex. */
export function isIndexable(site: URL | undefined): boolean {
  return !!site && site.hostname.replace(/^www\./, '') === 'studiobelvi.com' && BASE === '';
}

/** Public URL of an asset or absolute path, honouring the base path. */
export function asset(path: string): string {
  if (!path || /^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  return BASE + (path.startsWith('/') ? path : '/' + path);
}

/** URL of a page route ('' = home, 'sparks', 'packs/the-wedding-signs'…) in a language. */
export function pageUrl(route: string, lang: Lang, hash = ''): string {
  const prefix = lang === DEFAULT_LANG ? '' : `/${lang}`;
  const path = route === '' ? `${prefix}/` : `${prefix}/${route}.html`;
  return BASE + path + (hash ? `#${hash}` : '');
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Deep merge: objects merge, arrays and scalars from `over` replace `base` when present and non-empty. */
function merge(base: unknown, over: unknown): unknown {
  if (over === undefined || over === null || over === '') return base;
  if (Array.isArray(over)) {
    if (over.length === 0) return base;
    // Lists of objects (packs, cards…) merge item by item so a partial translation keeps the rest.
    if (Array.isArray(base) && over.every(isObj)) return base.map((b, i) => merge(b, over[i]));
    return over;
  }
  if (isObj(base) && isObj(over)) {
    const out: Obj = { ...base };
    for (const [k, v] of Object.entries(over)) out[k] = merge(base[k], v);
    return out;
  }
  return over;
}

// Fields that are never translated (Sveltia `i18n: duplicate`); always read from the source language.
const SHARED = new Set(['slug', 'order', 'visible', 'featured', 'published', 'area', 'image', 'cover_image', 'images', 'position', 'cover_position', 'portfolio_image', 'portfolio_image_position', 'name', 'amount', 'kind', 'vat_mode', 'unit', 'plus']);

function stripShared(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripShared);
  if (isObj(v)) return Object.fromEntries(Object.entries(v).filter(([k]) => !SHARED.has(k)).map(([k, x]) => [k, stripShared(x)]));
  return v;
}

/** Content for a language: source (ES) + translation, with shared fields always from ES.
 *  Missing translations fall back to Spanish; scripts/check-content.mjs lists them after the build. */
export function localize<T>(file: Partial<Record<string, unknown>>, lang: Lang): T {
  const src = file[SOURCE_LANG];
  if (lang === SOURCE_LANG) return src as T;
  return merge(src, stripShared(file[lang])) as T;
}
