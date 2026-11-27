// Runs after `astro build`. Reports missing translations (EN/CA fall back to Spanish on the site)
// and notes shared fields (price, visibility, order…) whose EN/CA copy differs from ES (the site always uses ES).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src/content');
const SHARED = new Set(['slug', 'order', 'visible', 'featured', 'published', 'area', 'image', 'cover_image', 'images', 'position', 'cover_position', 'portfolio_image', 'portfolio_image_position', 'name', 'amount', 'kind', 'vat_mode', 'unit', 'plus']);
const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.yaml')) files.push(p);
  }
})(contentDir);

let missingTotal = 0;
const conflicts = [];
const report = {};

const structural = [];
function compare(src, tr, where, file, lang) {
  const isEmpty = (v) => v === undefined || v === null || v === '';
  if (isEmpty(src) && !isEmpty(tr) && !(Array.isArray(tr) && !tr.length) && !(isObj(tr) && Object.values(tr).every(isEmpty))) {
    structural.push(`${file} ${where} (${lang}): translated but empty in Spanish, not shown`);
    return;
  }
  if (Array.isArray(src) && Array.isArray(tr) && tr.length && tr.length !== src.length) {
    structural.push(`${file} ${where} (${lang}): ${tr.length} items vs ${src.length} in Spanish, the site shows the Spanish list`);
  }
  if (typeof src === 'string') {
    if (src.trim() && (tr === undefined || tr === null || tr === '')) { missingTotal++; (report[file] ??= { en: 0, ca: 0 })[lang]++; }
  } else if (Array.isArray(src)) {
    src.forEach((s, i) => compare(s, Array.isArray(tr) ? tr[i] : undefined, `${where}[${i}]`, file, lang));
  } else if (isObj(src)) {
    for (const [k, v] of Object.entries(src)) {
      const t = isObj(tr) ? tr[k] : undefined;
      if (SHARED.has(k)) {
        // Sveltia fills shared fields of other locales with null/'' (not set): only a real, different value is a conflict.
        const unset = (x) => x === undefined || x === null || x === '' || (isObj(x) && Object.values(x).every(unset));
        const setPart = (x) => (isObj(x) ? Object.fromEntries(Object.entries(x).filter(([, y]) => !unset(y))) : x);
        if (!unset(t) && JSON.stringify(setPart(t)) !== JSON.stringify(setPart(v))) conflicts.push(`${file} ${where}.${k}: es=${JSON.stringify(v)} ${lang}=${JSON.stringify(t)}`);
      } else compare(v, t, `${where}.${k}`, file, lang);
    }
  }
}

for (const f of files) {
  const rel = path.relative(contentDir, f);
  const data = YAML.parse(fs.readFileSync(f, 'utf8')) ?? {};
  if (!data.es) continue;
  for (const lang of ['en', 'ca']) compare(data.es, data[lang], '', rel, lang);
}

const pending = Object.entries(report).filter(([, c]) => c.en || c.ca);
if (pending.length) {
  console.log(`\ncheck-content: ${missingTotal} texts without translation (the site shows the Spanish text):`);
  for (const [file, c] of pending) console.log(`  ${file.padEnd(40)} EN ${String(c.en).padStart(3)}   CA ${String(c.ca).padStart(3)}`);
} else console.log('\ncheck-content: all texts translated.');

if (structural.length) {
  console.log(`\ncheck-content: ${structural.length} translations need attention (the site falls back to Spanish there):`);
  for (const line of structural.slice(0, 15)) console.log('  ' + line);
  if (structural.length > 15) console.log(`  … and ${structural.length - 15} more`);
}

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  const html = [];
  (function walk(dir) { for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.html')) html.push(p); } })(dist);
  console.log(`check-content: ${html.length} HTML pages in dist/.`);
}

// Shared fields (prices, order, images…) are always read from Spanish, so a different value in EN/CA never reaches
// the site. Sveltia sometimes writes defaults there (e.g. a price kind inside a translated list), so this is a warning.
if (conflicts.length) {
  console.warn(`\ncheck-content: note, ${conflicts.length} shared fields in EN/CA differ from ES (ignored by the site, which uses ES):\n  ` + conflicts.slice(0, 10).join('\n  ') + (conflicts.length > 10 ? `\n  … and ${conflicts.length - 10} more` : ''));
}
