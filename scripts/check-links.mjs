// Checks that every internal href/src in the built HTML points to an existing file.
// Usage: node scripts/check-links.mjs [distDir] [basePath]
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] || 'dist');
const base = (process.argv[3] || '/').replace(/\/$/, '');
const pages = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.html')) pages.push(p); } })(dist);

const broken = new Map();
let checked = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  for (const m of html.matchAll(/\s(?:href|src)="([^"#?]*)[^"]*"/g)) {
    const ref = m[1];
    if (!ref || /^(https?:|mailto:|tel:|data:|\/\/)/.test(ref)) continue;
    let target;
    if (ref.startsWith('/')) {
      if (base && !ref.startsWith(base + '/') && ref !== base) { broken.set(`${ref} (missing base ${base})`, path.relative(dist, page)); continue; }
      target = path.join(dist, ref.slice(base.length));
    } else target = path.join(path.dirname(page), ref);
    if (target.endsWith(path.sep) || (fs.existsSync(target) && fs.statSync(target).isDirectory())) target = path.join(target, 'index.html');
    checked++;
    if (!fs.existsSync(target)) broken.set(ref, path.relative(dist, page));
  }
}
console.log(`check-links: ${pages.length} pages, ${checked} internal links checked, ${broken.size} broken.`);
for (const [ref, page] of broken) console.log(`  ${ref}  (first seen in ${page})`);
process.exit(broken.size ? 1 : 0);
