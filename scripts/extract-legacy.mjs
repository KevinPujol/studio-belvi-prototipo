// One-off: extracts texts (EN/ES/CA) and image lists from the legacy hand-written HTML pages
// (commit 4c19754) into YAML content files. Usage: node scripts/extract-legacy.mjs <legacyDir> <outDir>
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import YAML from 'yaml';

const [legacyDir, outDir] = process.argv.slice(2);
const LANGS = ['es', 'en', 'ca'];
const read = (f) => fs.readFileSync(path.join(legacyDir, f), 'utf8');
const dict = (html) => {
  const m = html.match(/const translations = (\{[\s\S]*?\n\s*\});\s*\n\s*const languageSwitcher/);
  if (!m) throw new Error('translations not found');
  return vm.runInNewContext('(' + m[1] + ')');
};
const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const write = (rel, data) => {
  const f = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, YAML.stringify(data, { lineWidth: 0 }));
  console.log('wrote', rel);
};
const perLang = (fn) => Object.fromEntries(LANGS.map((l) => [l, fn(l)]));
const img = (src) => src.replace(/^\.\//, '/');

// UI strings shared by every page
const home = dict(read('index.html'));
const uiKeys = ['nav01', 'nav02', 'nav03', 'nav04', 'nav05', 'nav06', 'footer_text'];
write('ui-legacy.yaml', perLang((l) => Object.fromEntries(uiKeys.map((k) => [k, clean(home[l][k])]))));

// Home page texts (all keys except shared UI)
write('pages/home.yaml', perLang((l) => Object.fromEntries(Object.entries(home[l]).filter(([k]) => !uiKeys.includes(k)).map(([k, v]) => [k, clean(v)]))));

// Sparks / Chapters / Universe: current page texts
for (const p of ['sparks', 'chapters', 'universe']) {
  const d = dict(read(p + '.html'));
  write(`pages/${p}.yaml`, perLang((l) => ({ title: clean(d[l].info_title), text: clean(d[l].info_text), how_title: clean(d[l].info_extra_title), how_text: clean(d[l].info_extra_text) })));
}

// FAQ
{
  const d = dict(read('faq.html'));
  const n = Object.keys(d.en).filter((k) => /^question\d+$/.test(k)).length;
  write('faq.yaml', perLang((l) => ({ title: clean(d[l].faq_title), intro: clean(d[l].faq_text), items: Array.from({ length: n }, (_, i) => { const k = String(i + 1).padStart(2, '0'); return { question: clean(d[l]['question' + k]), answer: clean(d[l]['answer' + k]) }; }) })));
}

// Portfolio project
{
  const html = read('portfolio.html');
  const d = dict(html);
  const srcs = [...html.matchAll(/<div class="portfolio-item[^"]*">\s*<img src="([^"]+)" alt="([^"]*)"/g)].map((m) => img(m[1]));
  write('galleries/portfolio.yaml', perLang((l) => ({ title: clean(d[l].portfolio_title), text: clean(d[l].portfolio_text), cards: srcs.map((s) => ({ image: s, caption: '' })) })));
}

// Area galleries: image + caption per card
for (const p of ['memorabilia', 'scenography', 'immersion']) {
  const html = read(p + '.html');
  const d = dict(html);
  const cards = [...html.matchAll(/<div class="portfolio-item[\s\S]*?<img\s+src="([^"]+)"[\s\S]*?data-i18n="([^"]+)"/g)].map((m) => ({ src: img(m[1]), key: m[2] }));
  write(`galleries/${p}.yaml`, perLang((l) => ({ title: clean(d[l].header_title), text: '', cards: cards.map((c) => ({ image: c.src, caption: clean(d[l][c.key]) })) })));
}
