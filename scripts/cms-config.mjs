// Generates the Sveltia CMS back office config (public/admin/config.yml) and the preview stylesheet
// (public/admin/preview.css). See specs/06-backoffice.md.
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
const MARKUP = 'Negrita: **texto**. Cursiva: *texto*. Salto de línea: Intro.';
const str = (name, label, o = {}) => ({ name, label, widget: 'string', ...T, ...o });
const txt = (name, label, o = {}) => ({ name, label, widget: 'text', hint: MARKUP, ...T, ...o });
const bool = (name, label, def, o = {}) => ({ name, label, widget: 'boolean', default: def, ...D, ...o });
const num = (name, label, o = {}) => ({ name, label, widget: 'number', value_type: 'int', ...D, ...o });
const img = (name, label, o = {}) => ({ name, label, widget: 'image', required: false, ...D, ...o });
const strList = (name, label, o = {}) => ({ name, label, widget: 'list', required: false, field: { name: 'item', label: 'Texto', widget: 'string' }, ...T, ...o });
// Which part of a photo stays visible when it is cropped (cards, mobile). Values are CSS object-position.
const position = (name, label = 'Encuadre de la foto') => ({
  name, label, widget: 'select', required: false, default: '50% 50%', ...D,
  hint: 'Qué parte de la foto se ve cuando se recorta, sobre todo en el móvil. Elige dónde está lo importante (por ejemplo, la pareja).',
  options: [
    { label: 'Centro', value: '50% 50%' }, { label: 'Izquierda', value: '20% 50%' }, { label: 'Derecha', value: '80% 50%' },
    { label: 'Arriba', value: '50% 20%' }, { label: 'Abajo', value: '50% 80%' },
    { label: 'Arriba a la izquierda', value: '20% 20%' }, { label: 'Arriba a la derecha', value: '80% 20%' },
    { label: 'Abajo a la izquierda', value: '20% 80%' }, { label: 'Abajo a la derecha', value: '80% 80%' },
  ],
});
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
const media = (folder) => ({ media_folder: `/public/assets/images/${folder}`, public_folder: `/assets/images/${folder}` });

// ---------- human labels for the page text files, in the order they appear on the page ----------
// [key, label, widget] — 'string' for short texts (titles, buttons), 'text' for paragraphs.
const HOME = [
  ['hero_small', 'Portada · antetítulo', 'string'], ['hero_title', 'Portada · titular', 'string'], ['hero_text', 'Portada · texto', 'text'], ['hero_cta', 'Portada · botón', 'string'],
  ['collab_span', 'Oferta · antetítulo', 'string'], ['collab_title', 'Oferta · título', 'string'], ['collab_text', 'Oferta · texto', 'text'],
  ['portfolio_span', 'Portfolio · antetítulo', 'string'], ['portfolio_title', 'Portfolio · título', 'string'], ['portfolio_text', 'Portfolio · texto', 'text'],
  ['portfolio_image', 'Portfolio · foto de la tarjeta', 'image'], ['portfolio_image_position', 'Portfolio · encuadre de la foto', 'position'],
  ['portfolio_card01_front', 'Portfolio · tarjeta: título (delante)', 'string'], ['portfolio_card01_back_title', 'Portfolio · tarjeta: título (detrás)', 'string'],
  ['portfolio_card01_back_text', 'Portfolio · tarjeta: texto (detrás)', 'text'], ['portfolio_card01_back_btn', 'Portfolio · tarjeta: botón', 'string'],
  ['services_span', 'Qué hacemos · antetítulo', 'string'], ['services_title', 'Qué hacemos · título', 'string'], ['services_text', 'Qué hacemos · texto', 'text'],
  ['services_card01_title', 'Qué hacemos · Memorabilia: título', 'string'], ['services_card01_text', 'Qué hacemos · Memorabilia: texto', 'text'],
  ['services_card02_title', 'Qué hacemos · Escenografía: título', 'string'], ['services_card02_text', 'Qué hacemos · Escenografía: texto', 'text'],
  ['services_card03_title', 'Qué hacemos · Inmersión: título', 'string'], ['services_card03_text', 'Qué hacemos · Inmersión: texto', 'text'],
  ['process_span', 'Proceso · antetítulo', 'string'], ['process_title', 'Proceso · título', 'string'],
  ...[1, 2, 3, 4].flatMap((n) => [[`process_card0${n}_title`, `Proceso · paso ${n}: título`, 'string'], [`process_card0${n}_text`, `Proceso · paso ${n}: texto`, 'text']]),
  ['contact_title', 'Contacto · título', 'string'], ['contact_text', 'Contacto · texto', 'text'],
];
const UI = [
  ['nav01', 'Menú · Portfolio'], ['nav02', 'Menú · Qué hacemos'], ['nav03', 'Menú · Qué necesitas (oferta)'], ['nav_packs', 'Menú · Packs'],
  ['nav04', 'Menú · Proceso'], ['nav05', 'Menú · Contacto'], ['nav06', 'Menú · FAQ'], ['menu', 'Menú · botón "Menú" (móvil)'], ['close', 'Menú · botón "Cerrar" (móvil)'],
  ['offer_cd_title', 'Home, oferta · título de dirección creativa'], ['offer_cd_link', 'Home, oferta · enlace a la comparativa'],
  ['offer_pp_title', 'Home, oferta · título de packs'], ['offer_pp_link', 'Home, oferta · enlace a todos los packs'],
  ['see_level', 'Dirección creativa · enlace "Ver el nivel"'], ['ideal_for', 'Dirección creativa · "Ideal para"'], ['compare_title', 'Dirección creativa · título de la comparativa'],
  ['featured_packs', 'Packs · etiqueta "Destacados"'], ['includes', 'Packs · "Incluye"'], ['common_inclusions', 'Packs · "Incluye en todos los niveles"'],
  ['possibilities', 'Packs · "Posibilidades"'], ['extras_addon', 'Packs · título "Ampliaciones"'], ['extras_additional_piece', 'Packs · título "Piezas adicionales"'],
  ['extras_combo', 'Packs · título "Combinaciones"'], ['extras_vat_note', 'Packs · nota de IVA en ampliaciones'], ['filter_all', 'Packs · filtro "Todas"'],
  ['interest', 'Packs · botón "Me interesa"'], ['back_to_packs', 'Packs · enlace "Todos los packs"'],
  ['area_memorabilia', 'Áreas · Memorabilia'], ['area_scenography', 'Áreas · Escenografía'], ['area_immersion', 'Áreas · Inmersión'], ['area_packs_title', 'Áreas · título "Packs de esta área"'],
  ['form_name', 'Formulario · Nombre'], ['form_email', 'Formulario · Email'], ['form_date', 'Formulario · Fecha'], ['form_date_placeholder', 'Formulario · fecha: texto inicial'],
  ['form_date_unknown', 'Formulario · fecha: "Aún no lo sabemos"'], ['form_guests', 'Formulario · Invitados'], ['form_interest', 'Formulario · Qué te interesa'],
  ['form_message', 'Formulario · Mensaje'], ['form_privacy', 'Formulario · casilla de privacidad'], ['privacy_read', 'Formulario · enlace "Leer"'],
  ['form_send', 'Formulario · botón Enviar'], ['form_or_email', 'Formulario · "O escríbenos a"'], ['form_sent', 'Formulario · mensaje de enviado'], ['form_error', 'Formulario · mensaje de error'],
  ['footer_text', 'Pie · texto'], ['privacy_link', 'Pie · enlace de privacidad'], ['meta_description', 'Buscadores · descripción de la web'],
];
// Fields for a page text file: labelled and ordered as above; keys not listed are appended with their raw name.
function pageFields(rel, map, defaultWidget = 'string') {
  const keys = Object.keys(YAML.parse(fs.readFileSync(path.join(root, rel), 'utf8')).es);
  const known = new Set(map.map(([k]) => k));
  return [...map.filter(([k]) => keys.includes(k)), ...keys.filter((k) => !known.has(k)).map((k) => [k, k.replace(/_/g, ' '), defaultWidget])]
    .map(([k, label, widget = defaultWidget]) => {
      if (widget === 'image') return img(k, label);
      if (widget === 'position') return position(k, label);
      return widget === 'text' ? txt(k, label, { required: false }) : str(k, label, { required: false });
    });
}

// ---------- collections ----------
const levelFields = [
  num('order', 'Orden'), bool('visible', 'Visible', true),
  str('name', 'Nombre', D), str('motto', 'Lema'), txt('description', 'Descripción'), txt('ideal_for', 'Ideal para'),
  str('price_label', 'Etiqueta del precio', { required: false }), price(),
  strList('includes', 'Qué incluye'),
];
const levelFile = (slug, label) => ({ name: slug, label, file: `src/content/creative-levels/${slug}.yaml`, format: 'yaml', i18n: true, fields: levelFields });

const creative = {
  name: 'creative', label: 'Dirección creativa', i18n: true, ...media('creative-direction'),
  description: 'Los tres niveles, la tabla comparativa y los textos de la página.',
  files: [
    levelFile('sparks', 'Story Sparks'), levelFile('chapters', 'Story Chapters'), levelFile('universe', 'Story Universe'),
    { name: 'comparison', label: 'Tabla comparativa', file: 'src/content/comparison.yaml', format: 'yaml', i18n: true, fields: [
      { name: 'rows', label: 'Filas', label_singular: 'Fila', widget: 'list', ...T, summary: '{{fields.label}}', fields: [str('label', 'Fila'), str('sparks', 'Sparks'), str('chapters', 'Chapters'), str('universe', 'Universe')] },
    ] },
    { name: 'creative_page', label: 'Textos de la página y "Expand your story"', file: 'src/content/creative-direction.yaml', format: 'yaml', i18n: true, fields: [
      str('cd_title', 'Título'), txt('cd_intro', 'Introducción'), str('cd_levels_intro', 'Antetítulo'),
      str('expand_title', 'Expand your story: título'), txt('expand_intro', 'Expand your story: introducción'), str('expand_price_header', 'Expand your story: pie de precios'),
      { name: 'expand', label: 'Expand your story: servicios', label_singular: 'Servicio', widget: 'list', ...T, summary: '{{fields.label}}', fields: [str('label', 'Servicio'), price()] },
    ] },
  ],
};

const pack = {
  name: 'packs', label: 'Packs', label_singular: 'Pack', widget: 'list', ...T, collapsed: true, summary: '{{fields.name}}',
  min: 1, hint: 'Cada familia necesita al menos un pack.',
  fields: [
    str('name', 'Nombre (se mantiene en inglés)', D),
    str('slug', 'Enlace directo', { ...D, required: false, readonly: true, hint: 'Se crea solo a partir del nombre. Es el enlace directo al pack.' }),
    bool('visible', 'Visible', true), bool('featured', 'Destacado en la home', false),
    txt('description', 'Descripción', { required: false }), price(),
    { name: 'inclusion_groups', label: 'Qué incluye', label_singular: 'Grupo', widget: 'list', required: false, ...T, summary: '{{fields.title}}',
      fields: [str('title', 'Título del grupo (opcional)', { required: false }), str('description', 'Texto del grupo (opcional)', { required: false }), strList('items', 'Puntos')] },
    strList('possibilities', 'Posibilidades'),
    { name: 'images', label: 'Imágenes', widget: 'list', required: false, ...D, field: { name: 'image', label: 'Imagen', widget: 'image' } },
  ],
};

const families = {
  name: 'families', label: 'Packs', label_singular: 'Familia', ...media('packs'),
  description: 'Las familias de Production packs, cada una con sus packs y ampliaciones.',
  folder: 'src/content/families', extension: 'yaml', format: 'yaml', i18n: true,
  create: true, slug: '{{name}}', identifier_field: 'name', summary: '{{order}}. {{name}}',
  sortable_fields: ['order', 'name'],
  fields: [
    str('name', 'Nombre (se mantiene en inglés)', D), num('order', 'Orden'),
    bool('visible', 'Visible', true), bool('featured', 'Mostrar en la home', true),
    { name: 'area', label: 'Área', widget: 'select', ...D, options: [
      { label: 'Memorabilia', value: 'memorabilia' }, { label: 'Escenografía', value: 'scenography' }, { label: 'Inmersión', value: 'immersion' }] },
    img('cover_image', 'Imagen de portada'), position('cover_position', 'Encuadre de la portada'),
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

const packsGeneral = {
  name: 'packs_general', label: 'Packs · condiciones', i18n: true,
  files: [{ name: 'packs_page', label: 'Introducción, tipos de ampliación y condiciones', file: 'src/content/packs-general.yaml', format: 'yaml', i18n: true, fields: [
    str('pp_title', 'Título de la página de packs'), txt('pp_intro', 'Introducción'),
    str('extension_types_title', 'Tipos de ampliación: título'),
    { name: 'extension_types', label: 'Tipos de ampliación', label_singular: 'Tipo', widget: 'list', ...T, summary: '{{fields.name}}', fields: [str('name', 'Tipo', D), str('meaning', 'Qué significa'), str('example', 'Ejemplo')] },
    str('conditions_title', 'Condiciones: título'), strList('conditions', 'Condiciones'), str('home_note', 'Nota de condiciones en la home'),
  ] }],
};

const galleryFile = (name, label) => ({
  name, label, file: `src/content/galleries/${name}.yaml`, format: 'yaml', i18n: true, fields: [
    str('title', 'Título'), txt('text', 'Texto', { required: false }),
    { name: 'cards', label: 'Fotos', label_singular: 'Foto', widget: 'list', ...T, summary: '{{fields.caption}}', fields: [img('image', 'Imagen', { required: true }), position('position'), str('caption', 'Pie de foto', { required: false })] },
  ],
});

const pages = {
  name: 'pages', label: 'Páginas', i18n: true, ...media('pages'),
  files: [
    { name: 'home', label: 'Home', file: 'src/content/pages/home.yaml', format: 'yaml', i18n: true, fields: pageFields('src/content/pages/home.yaml', HOME, 'text') },
    { name: 'faq', label: 'FAQ', file: 'src/content/faq.yaml', format: 'yaml', i18n: true, fields: [
      bool('published', 'Publicada (si no, queda como borrador y no sale en la web)', true),
      str('title', 'Título'), txt('intro', 'Introducción'),
      { name: 'items', label: 'Preguntas', label_singular: 'Pregunta', widget: 'list', ...T, summary: '{{fields.question}}', fields: [str('question', 'Pregunta'), txt('answer', 'Respuesta')] },
    ] },
    { name: 'privacy', label: 'Privacidad', file: 'src/content/privacy.yaml', format: 'yaml', i18n: true, fields: [
      str('title', 'Título'), str('draft_notice', 'Aviso de borrador (vaciar al publicar)', { required: false }),
      { name: 'sections', label: 'Apartados', label_singular: 'Apartado', widget: 'list', ...T, summary: '{{fields.heading}}', fields: [str('heading', 'Título'), txt('body', 'Texto')] },
    ] },
  ],
};

const galleries = {
  name: 'galleries', label: 'Galerías', i18n: true, ...media('galleries'),
  files: [galleryFile('memorabilia', 'Memorabilia'), galleryFile('scenography', 'Scenography'), galleryFile('immersion', 'Immersion'), galleryFile('portfolio', 'Portfolio: Once upon a story…')],
};

const uiTexts = {
  name: 'ui', label: 'Textos de la web', i18n: true,
  files: [{ name: 'ui', label: 'Menú, botones, formulario y pie', file: 'src/content/ui.yaml', format: 'yaml', i18n: true, fields: pageFields('src/content/ui.yaml', UI) }],
};

const backend = { name: 'github', repo: env.CMS_REPO || 'KevinPujol/studio-belvi-prototipo', branch: env.CMS_BRANCH || 'main' };
if (env.CMS_AUTH_URL) backend.base_url = env.CMS_AUTH_URL;

const config = {
  backend,
  publish_mode: 'editorial_workflow',
  site_url: siteUrl,
  display_url: siteUrl,
  // The whole image folder, so editors can reuse today's photos; each collection uploads into its own subfolder.
  media_folder: 'public/assets/images',
  public_folder: '/assets/images',
  // Convert uploads to WebP and cap their size (accepted by Sveltia 5.0.2 without warnings).
  media_libraries: { default: { config: { max_file_size: 8000000, slugify_filename: true, transformations: { raster_image: { format: 'webp', quality: 85, width: 2400, height: 2400 } } } } },
  i18n: { structure: 'single_file', locales: ['es', 'en', 'ca'], default_locale: 'es' },
  // Catalogue first, then the rest of the website, with a divider between them.
  collections: [creative, families, packsGeneral, { divider: true }, pages, galleries, uiTexts],
};

const out = path.join(root, 'public/admin/config.yml');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, '# GENERATED by scripts/cms-config.mjs. Do not edit by hand.\n' + YAML.stringify(config, { lineWidth: 0 }));
// The preview pane uses the website's own stylesheet, so entries look like the real page.
fs.copyFileSync(path.join(root, 'src/styles/global.css'), path.join(root, 'public/admin/preview.css'));
console.log(`cms-config: ${path.relative(root, out)} (repo ${backend.repo}, branch ${backend.branch}${backend.base_url ? ', OAuth ' + backend.base_url : ', token login'})`);
