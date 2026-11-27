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

/** Translation over Spanish (the source):
 *  - a translation only counts where the Spanish value exists (clearing or deleting in Spanish clears it everywhere);
 *  - lists are paired item by item only when both have the same length; otherwise the Spanish list is shown
 *    (a reordered or shortened list must never put a translated label next to another item's price);
 *  - only keys present in Spanish are kept (orphan translations are ignored). */
function merge(base: unknown, over: unknown): unknown {
  const empty = (v: unknown) => v === undefined || v === null || v === '';
  if (empty(base) || empty(over)) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(over) || over.length !== base.length) return base;
    return base.map((b, i) => merge(b, over[i]));
  }
  if (isObj(base)) {
    if (!isObj(over)) return base;
    const out: Obj = {};
    for (const [k, v] of Object.entries(base)) out[k] = merge(v, over[k]);
    return out;
  }
  return typeof over === typeof base ? over : base;
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
