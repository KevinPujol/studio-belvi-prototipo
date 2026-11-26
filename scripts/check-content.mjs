// Runs after `astro build`. Reports missing translations (EN/CA fall back to Spanish on the site)
// and fails if a shared field (price, visibility, order…) differs between languages.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src/content');
const SHARED = new Set(['slug', 'order', 'visible', 'featured', 'published', 'area', 'image', 'cover_image', 'images', 'name', 'amount', 'kind', 'vat_mode', 'unit', 'plus']);
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

function compare(src, tr, where, file, lang) {
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

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  const html = [];
  (function walk(dir) { for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.html')) html.push(p); } })(dist);
  console.log(`check-content: ${html.length} HTML pages in dist/.`);
}

if (conflicts.length) {
  console.error(`\ncheck-content: ${conflicts.length} shared fields differ between languages:\n  ` + conflicts.join('\n  '));
  process.exit(1);
}
