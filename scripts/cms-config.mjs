// Generates public/admin/config.yml for Sveltia CMS (specs/06-backoffice.md).
// Account-independent: repo, branch and OAuth URL come from the environment.
//   CMS_REPO      owner/repo the CMS commits to (CI sets it to github.repository)
//   CMS_BRANCH    branch to publish to (default: main)
//   CMS_AUTH_URL  optional Sveltia CMS Authenticator (Cloudflare Worker) URL; without it, log in with a GitHub token
//   SITE_URL / BASE_PATH  public site, used for the "view site" links
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
const siteUrl = (env.SITE_URL || 'https://studiobelvi.com') + (env.BASE_PATH && env.BASE_PATH !== '/' ? env.BASE_PATH : '');

// ---------- field helpers (labels in Spanish: the editors write in Spanish) ----------
const T = { i18n: true };
const D = { i18n: 'duplicate' };
const str = (name, label, o = {}) => ({ name, label, widget: 'string', ...T, ...o });
const txt = (name, label, o = {}) => ({ name, label, widget: 'text', ...T, ...o });
const bool = (name, label, def, o = {}) => ({ name, label, widget: 'boolean', default: def, ...D, ...o });
const num = (name, label, o = {}) => ({ name, label, widget: 'number', value_type: 'int', ...D, ...o });
const img = (name, label, o = {}) => ({ name, label, widget: 'image', required: false, ...D, ...o });
const strList = (name, label, o = {}) => ({ name, label, widget: 'list', required: false, field: { name: 'item', label: 'Texto', widget: 'string' }, ...T, ...o });
const slugField = (hint) => str('slug', 'Identificador (URL)', { ...D, pattern: ['^[a-z0-9-]+$', 'Solo minúsculas, números y guiones'], hint });
const price = (name = 'price', label = 'Precio', required = true) => ({
  name, label, widget: 'object', required, ...T,
  hint: 'La web compone el texto: "Desde 750 € + IVA", "490 € IVA incluido", "Presupuesto personalizado".',
  fields: [
    { name: 'kind', label: 'Tipo', widget: 'select', ...D, default: 'from', options: [
      { label: 'Desde', value: 'from' }, { label: 'Precio cerrado', value: 'fixed' }, { label: 'Presupuesto', value: 'quote' }] },
    { name: 'amount', label: 'Importe (€, sin decimales)', widget: 'number', value_type: 'int', min: 0, required: false, ...D, hint: 'Obligatorio salvo en "Presupuesto".' },
    { name: 'vat_mode', label: 'IVA', widget: 'select', ...D, default: 'excluded', options: [
      { label: '+ IVA (no incluido)', value: 'excluded' }, { label: 'IVA incluido', value: 'included' }, { label: 'Sin indicar', value: 'unspecified' }] },
    { name: 'unit', label: 'Unidad', widget: 'select', required: false, ...D, options: [
      { label: '€/mes', value: 'month' }, { label: '€/unidad', value: 'unit' }, { label: '€/pieza', value: 'piece' }] },
    { name: 'plus', label: 'Mostrar como suplemento (+)', widget: 'boolean', default: false, required: false, ...D },
    { name: 'note', label: 'Nota (p. ej. "según tirada y piezas")', widget: 'string', required: false, ...T },
  ],
});

// Fields generated from the keys of a legacy page file (text kept as-is, may contain <b>, <br>, <i>).
const keysOf = (rel) => Object.keys(YAML.parse(fs.readFileSync(path.join(root, rel), 'utf8')).es);
const dictFields = (rel) => keysOf(rel).map((k) => ({ name: k, label: k.replace(/_/g, ' '), widget: 'text', ...T, required: false }));

// ---------- collections ----------
const levels = {
  name: 'levels', label: 'Dirección creativa', label_singular: 'Nivel',
  folder: 'src/content/creative-levels', extension: 'yaml', format: 'yaml', i18n: true,
  create: false, delete: false, identifier_field: 'name', summary: '{{name}} · {{price.amount}} €',
  sortable_fields: ['order', 'name'],
  fields: [
    slugField('No cambiar: es la URL (sparks, chapters, universe).'), num('order', 'Orden'), bool('visible', 'Visible', true),
    str('name', 'Nombre', D), str('motto', 'Lema'), txt('description', 'Descripción'), txt('ideal_for', 'Ideal para'),
    str('price_label', 'Etiqueta del precio', { required: false }), price(),
    strList('includes', 'Qué incluye'),
  ],
};

const pack = {
  name: 'packs', label: 'Packs', label_singular: 'Pack', widget: 'list', ...T, collapsed: true, summary: '{{fields.name}}',
  fields: [
    slugField('Para el enlace directo al pack.'), str('name', 'Nombre (se mantiene en inglés)', D),
    bool('visible', 'Visible', true), bool('featured', 'Destacado en la home', false),
    txt('description', 'Descripción', { required: false }), price(),
    { name: 'inclusion_groups', label: 'Qué incluye', label_singular: 'Grupo', widget: 'list', required: false, ...T, summary: '{{fields.title}}',
      fields: [str('title', 'Título del grupo (opcional)', { required: false }), str('description', 'Texto del grupo (opcional)', { required: false }), strList('items', 'Puntos')] },
    strList('possibilities', 'Posibilidades'),
    { name: 'images', label: 'Imágenes', widget: 'list', required: false, ...D, field: { name: 'image', label: 'Imagen', widget: 'image' } },
  ],
};

const families = {
  name: 'families', label: 'Packs', label_singular: 'Familia',
  folder: 'src/content/families', extension: 'yaml', format: 'yaml', i18n: true,
  create: true, slug: '{{fields.slug}}', identifier_field: 'name', summary: '{{order}}. {{name}}',
  sortable_fields: ['order', 'name'],
  fields: [
    slugField('Es la URL de la familia: packs/identificador.html'), num('order', 'Orden'),
    bool('visible', 'Visible', true), bool('featured', 'Mostrar en la home', true),
    { name: 'area', label: 'Área', widget: 'select', ...D, options: [
      { label: 'Memorabilia', value: 'memorabilia' }, { label: 'Escenografía', value: 'scenography' }, { label: 'Inmersión', value: 'immersion' }] },
    str('name', 'Nombre (se mantiene en inglés)', D), img('cover_image', 'Imagen de portada'),
    txt('tagline', 'Lema'), txt('intro', 'Introducción', { required: false }),
    price('price_from', 'Precio "desde" de la familia', false),
    strList('common_inclusions', 'Incluye en todos los niveles'), strList('notes', 'Notas'),
    pack,
    { name: 'extras', label: 'Ampliaciones, piezas adicionales y combinaciones', label_singular: 'Ampliación', widget: 'list', required: false, ...T, collapsed: true, summary: '{{fields.label}}',
      fields: [
        { name: 'kind', label: 'Tipo', widget: 'select', ...D, default: 'addon', options: [
          { label: 'Ampliación', value: 'addon' }, { label: 'Pieza adicional', value: 'additional_piece' }, { label: 'Combinación', value: 'combo' }, { label: 'Acompañamiento', value: 'support' }] },
        str('label', 'Nombre'), txt('description', 'Descripción', { required: false }), price('price', 'Precio (vacío si no tiene)', false),
      ] },
  ],
};

const general = {
  name: 'general', label: 'Textos del catálogo', i18n: true,
  files: [
    { name: 'catalog', label: 'Textos, condiciones y "Expand your story"', file: 'src/content/catalog.yaml', format: 'yaml', i18n: true, fields: [
      str('cd_title', 'Dirección creativa: título'), txt('cd_intro', 'Dirección creativa: introducción'), str('cd_levels_intro', 'Dirección creativa: subtítulo'),
      str('expand_title', 'Expand your story: título'), txt('expand_intro', 'Expand your story: introducción'), str('expand_price_header', 'Expand your story: pie de precios'),
      { name: 'expand', label: 'Expand your story: servicios', widget: 'list', ...T, summary: '{{fields.label}}', fields: [str('label', 'Servicio'), price()] },
      str('pp_title', 'Production packs: título'), txt('pp_intro', 'Production packs: introducción'),
      str('extension_types_title', 'Tipos de ampliación: título'),
      { name: 'extension_types', label: 'Tipos de ampliación', widget: 'list', ...T, summary: '{{fields.name}}', fields: [str('name', 'Tipo', D), str('meaning', 'Qué significa'), str('example', 'Ejemplo')] },
      str('conditions_title', 'Condiciones: título'), strList('conditions', 'Condiciones'), str('home_note', 'Nota de condiciones en la home'),
    ] },
    { name: 'comparison', label: 'Tabla comparativa de niveles', file: 'src/content/comparison.yaml', format: 'yaml', i18n: true, fields: [
      { name: 'rows', label: 'Filas', widget: 'list', ...T, summary: '{{fields.label}}', fields: [str('label', 'Fila'), str('sparks', 'Sparks'), str('chapters', 'Chapters'), str('universe', 'Universe')] },
    ] },
  ],
};

const galleryFile = (name, label) => ({
  name, label, file: `src/content/galleries/${name}.yaml`, format: 'yaml', i18n: true, fields: [
    str('title', 'Título'), txt('text', 'Texto', { required: false }),
    { name: 'cards', label: 'Fotos', label_singular: 'Foto', widget: 'list', ...T, summary: '{{fields.caption}}', fields: [img('image', 'Imagen', { required: true }), str('caption', 'Pie de foto', { required: false })] },
  ],
});

const pages = {
  name: 'pages', label: 'Páginas', i18n: true,
  files: [
    { name: 'home', label: 'Home', file: 'src/content/pages/home.yaml', format: 'yaml', i18n: true, fields: dictFields('src/content/pages/home.yaml') },
    { name: 'faq', label: 'FAQ', file: 'src/content/faq.yaml', format: 'yaml', i18n: true, fields: [
      bool('published', 'Publicada (si no, queda como borrador y no sale en la web)', true),
      str('title', 'Título'), txt('intro', 'Introducción'),
      { name: 'items', label: 'Preguntas', label_singular: 'Pregunta', widget: 'list', ...T, summary: '{{fields.question}}', fields: [str('question', 'Pregunta'), txt('answer', 'Respuesta')] },
    ] },
    { name: 'privacy', label: 'Privacidad', file: 'src/content/privacy.yaml', format: 'yaml', i18n: true, fields: [
      str('title', 'Título'), str('draft_notice', 'Aviso de borrador (vaciar al publicar)', { required: false }),
      { name: 'sections', label: 'Apartados', widget: 'list', ...T, summary: '{{fields.heading}}', fields: [str('heading', 'Título'), txt('body', 'Texto')] },
    ] },
  ],
};

const galleries = {
  name: 'galleries', label: 'Galerías', i18n: true,
  files: [galleryFile('memorabilia', 'Memorabilia'), galleryFile('scenography', 'Scenography'), galleryFile('immersion', 'Immersion'), galleryFile('portfolio', 'Portfolio: Once upon a story…')],
};

const uiTexts = {
  name: 'ui', label: 'Textos de la web', i18n: true,
  files: [{ name: 'ui', label: 'Menú, botones, formulario y pie', file: 'src/content/ui.yaml', format: 'yaml', i18n: true, fields: dictFields('src/content/ui.yaml') }],
};

const backend = { name: 'github', repo: env.CMS_REPO || 'KevinPujol/studio-belvi-prototipo', branch: env.CMS_BRANCH || 'main' };
if (env.CMS_AUTH_URL) backend.base_url = env.CMS_AUTH_URL;

const config = {
  backend,
  publish_mode: 'editorial_workflow',
  site_url: siteUrl,
  display_url: siteUrl,
  // The whole image folder, so editors can reuse today's photos as well as upload new ones.
  media_folder: 'public/assets/images',
  public_folder: '/assets/images',
  // Convert uploads to WebP and cap their size (Sveltia 0.273.1 accepts these options without warnings).
  media_libraries: { default: { config: { max_file_size: 8000000, slugify_filename: true, transformations: { raster_image: { format: 'webp', quality: 85, width: 2400, height: 2400 } } } } },
  i18n: { structure: 'single_file', locales: ['es', 'en', 'ca'], default_locale: 'es' },
  collections: [levels, families, general, pages, galleries, uiTexts],
};

const out = path.join(root, 'public/admin/config.yml');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, '# GENERATED by scripts/cms-config.mjs. Do not edit by hand.\n' + YAML.stringify(config, { lineWidth: 0 }));
console.log(`cms-config: ${path.relative(root, out)} (repo ${backend.repo}, branch ${backend.branch}${backend.base_url ? ', OAuth ' + backend.base_url : ', token login'})`);
