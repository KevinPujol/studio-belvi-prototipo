// Reads and validates the YAML content edited from /admin/ (Sveltia CMS).
// The Spanish block of every file is validated: an invalid file fails the build,
// so the published site keeps the previous version (see specs/06-backoffice.md).
import { z } from 'astro/zod';
import YAML from 'yaml';
import { localize, type Lang } from './i18n';
import type { Price } from './price';

const raw = import.meta.glob('/src/content/**/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function load<S extends z.ZodTypeAny>(path: string, schema: S): Record<string, unknown> {
  const text = raw[path];
  if (text === undefined) throw new Error(`Content file not found: ${path}`);
  const data = YAML.parse(text) ?? {};
  const res = schema.safeParse(data.es);
  if (!res.success) {
    const issues = res.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid content in ${path} (es):\n${issues}`);
  }
  return { ...data, es: res.data };
}

// ---------- Schemas (field names follow specs/02) ----------
const text = z.string().default('');
const list = z.array(z.string()).default([]);

// Sveltia writes empty optional fields as '' (e.g. `unit: ''`, `note: ''`): treat them as not set.
const empty = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((v) => (v === '' ? null : v), schema);

export const priceSchema = z
  .object({
    kind: z.enum(['from', 'fixed', 'quote']),
    amount: empty(z.number().int().nonnegative().nullish()),
    vat_mode: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.enum(['included', 'excluded', 'unspecified']).default('unspecified')),
    unit: empty(z.enum(['month', 'unit', 'piece']).nullish()),
    plus: z.boolean().optional(),
    note: z.string().nullish(),
  })
  .refine((p) => p.kind === 'quote' || p.amount != null, { message: 'A price "from" or "fixed" needs an amount' });

const packSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  visible: z.boolean().default(true),
  featured: z.boolean().default(false),
  description: text,
  price: priceSchema,
  inclusion_groups: z.array(z.object({ title: z.string().nullish(), description: z.string().nullish(), items: list })).default([]),
  possibilities: list,
  images: z.array(z.string()).default([]),
});

const extraSchema = z.object({
  kind: z.enum(['addon', 'additional_piece', 'combo', 'support']),
  label: z.string().min(1),
  description: z.string().nullish(),
  price: priceSchema.nullish(),
});

const familySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int(),
  visible: z.boolean().default(true),
  featured: z.boolean().default(true),
  area: z.enum(['memorabilia', 'scenography', 'immersion']),
  name: z.string().min(1),
  cover_image: z.string().nullish(),
  tagline: text,
  intro: text,
  price_from: priceSchema.nullish(),
  common_inclusions: list,
  notes: list,
  packs: z.array(packSchema).min(1),
  extras: z.array(extraSchema).default([]),
});

const levelSchema = z.object({
  slug: z.enum(['sparks', 'chapters', 'universe']),
  order: z.number().int(),
  visible: z.boolean().default(true),
  name: z.string(),
  motto: text,
  description: text,
  ideal_for: text,
  price_label: text,
  price: priceSchema,
  includes: list,
});

const catalogSchema = z.object({
  cd_title: z.string(), cd_intro: text, cd_levels_intro: text,
  expand_title: text, expand_intro: text, expand_price_header: text,
  expand: z.array(z.object({ label: z.string(), price: priceSchema })).default([]),
  pp_title: z.string(), pp_intro: text,
  extension_types_title: text,
  extension_types: z.array(z.object({ name: z.string(), meaning: text, example: text })).default([]),
  conditions_title: text, conditions: list, home_note: text,
});

const comparisonSchema = z.object({ rows: z.array(z.object({ label: z.string(), sparks: z.string(), chapters: z.string(), universe: z.string() })) });
const gallerySchema = z.object({ title: z.string(), text: text, cards: z.array(z.object({ image: z.string(), caption: text })) });
const faqSchema = z.object({ published: z.boolean().default(true), title: z.string(), intro: text, items: z.array(z.object({ question: z.string(), answer: z.string() })) });
const privacySchema = z.object({ title: z.string(), draft_notice: text, sections: z.array(z.object({ heading: z.string(), body: z.string() })) });
const dictSchema = z.record(z.string(), z.string());

// ---------- Types ----------
export type Pack = z.infer<typeof packSchema> & { price: Price };
export type Extra = z.infer<typeof extraSchema>;
export type Family = Omit<z.infer<typeof familySchema>, 'packs'> & { packs: Pack[] };
export type Level = z.infer<typeof levelSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type Gallery = z.infer<typeof gallerySchema>;
export type Area = Family['area'];

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;
const filesIn = (dir: string) => Object.keys(raw).filter((p) => p.startsWith(`/src/content/${dir}/`)).sort();

// ---------- Getters (localised, visible only) ----------
export function families(lang: Lang, { all = false } = {}): Family[] {
  return filesIn('families')
    .map((p) => localize<Family>(load(p, familySchema), lang))
    .filter((f) => all || f.visible)
    .map((f) => ({ ...f, packs: all ? f.packs : f.packs.filter((p) => p.visible) }))
    .sort(byOrder);
}
export const family = (slug: string, lang: Lang) => families(lang).find((f) => f.slug === slug);

export function levels(lang: Lang): Level[] {
  return filesIn('creative-levels').map((p) => localize<Level>(load(p, levelSchema), lang)).filter((l) => l.visible).sort(byOrder);
}
export const level = (slug: string, lang: Lang) => levels(lang).find((l) => l.slug === slug);

export const catalog = (lang: Lang) => localize<Catalog>(load('/src/content/catalog.yaml', catalogSchema), lang);
export const comparison = (lang: Lang) => localize<z.infer<typeof comparisonSchema>>(load('/src/content/comparison.yaml', comparisonSchema), lang);
export const gallery = (name: string, lang: Lang) => localize<Gallery>(load(`/src/content/galleries/${name}.yaml`, gallerySchema), lang);
export const faq = (lang: Lang) => localize<z.infer<typeof faqSchema>>(load('/src/content/faq.yaml', faqSchema), lang);
export const privacy = (lang: Lang) => localize<z.infer<typeof privacySchema>>(load('/src/content/privacy.yaml', privacySchema), lang);
export const ui = (lang: Lang) => localize<Record<string, string>>(load('/src/content/ui.yaml', dictSchema), lang);
export const pageText = (name: string, lang: Lang) => localize<Record<string, string>>(load(`/src/content/pages/${name}.yaml`, dictSchema), lang);
