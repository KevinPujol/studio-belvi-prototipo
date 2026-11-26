import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { priceText, type Price } from '../src/lib/price';

const LANGS = ['en', 'es', 'ca'] as const;
const content = (rel: string) => YAML.parse(fs.readFileSync(path.join('src/content', rel), 'utf8'));
const familySlugs = fs.readdirSync('src/content/families').map((f) => f.replace(/\.yaml$/, ''));
const faqPublished = content('faq.yaml').es.published !== false;
const routes = ['', 'creative-direction', 'sparks', 'chapters', 'universe', 'packs', ...familySlugs.map((s) => `packs/${s}`), 'memorabilia', 'scenography', 'immersion', 'portfolio', ...(faqPublished ? ['faq'] : []), 'privacy'];
const url = (route: string, lang: (typeof LANGS)[number]) => (lang === 'en' ? '' : `/${lang}`) + (route ? `/${route}.html` : '/');
const isMobile = (name: string) => name === 'pixel' || name === 'iphone';

// Each test starts with the language preference of the page it visits (no redirect from a stored choice).
async function open(page: Page, path: string) {
  await page.addInitScript(() => { try { localStorage.clear(); } catch {} });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const res = await page.goto(path);
  return { res, errors };
}

test.describe('every page in every language', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop-chromium', 'full sweep on one browser'));
  for (const lang of LANGS) {
    for (const route of routes) {
      test(`${url(route, lang)}`, async ({ page }) => {
        const { res, errors } = await open(page, url(route, lang));
        expect(res?.status()).toBe(200);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('h1, h2').first()).toBeVisible();
        await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
        expect(errors).toEqual([]);
      });
    }
  }
});

test.describe('layout', () => {
  for (const route of ['', 'packs', 'packs/wedding-paper-suite', 'creative-direction', 'memorabilia', 'privacy']) {
    test(`no horizontal scroll: ${route || 'home'}`, async ({ page }) => {
      await open(page, url(route, 'es'));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('mobile menu opens and navigates', async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), 'mobile only');
    await open(page, '/privacy.html');
    await expect(page.locator('.nav-links a', { hasText: 'Packs' })).toBeHidden();
    await page.locator('.menu-toggle').click();
    await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'true');
    await page.locator('.nav-links a', { hasText: 'Packs' }).click();
    await expect(page).toHaveURL(/\/packs\.html$/);
  });

  test('pack "Includes" is an accordion on mobile and open on desktop', async ({ page }, info) => {
    await open(page, '/packs/wedding-signs.html');
    const first = page.locator('details[data-accordion]').first();
    if (isMobile(info.project.name)) {
      await expect(first).not.toHaveAttribute('open', '');
      await first.locator('summary').click();
      await expect(first).toHaveAttribute('open', '');
      await expect(first.locator('li').first()).toBeVisible();
    } else {
      await expect(first).toHaveAttribute('open', '');
      await expect(first.locator('summary')).toBeHidden();
    }
  });

  test('desktop nav shows all links', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'desktop only');
    await open(page, '/');
    await expect(page.locator('.nav-links a')).toHaveCount(faqPublished ? 7 : 6);
    await expect(page.locator('.menu-toggle')).toBeHidden();
  });
});

test.describe('languages', () => {
  test('switcher keeps the page and remembers the choice', async ({ page }) => {
    await open(page, '/packs/wedding-signs.html');
    await page.locator('.lang-switcher a[data-lang="es"]').click();
    await expect(page).toHaveURL(/\/es\/packs\/wedding-signs\.html$/);
    expect(await page.evaluate(() => localStorage.getItem('studioBelviLanguage'))).toBe('es');
  });

  test('a returning visitor with a stored choice lands on their language', async ({ page }) => {
    await page.addInitScript(() => { try { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('studioBelviLanguage', 'ca'); sessionStorage.setItem('seeded', '1'); } } catch {} });
    await page.goto('/packs.html');
    await expect(page).toHaveURL(/\/ca\/packs\.html$/);
  });

  test('legacy texts are translated (home title)', async ({ page }) => {
    const home = content('pages/home.yaml');
    for (const lang of LANGS) {
      await open(page, url('', lang));
      await expect(page.locator('h1')).toHaveText(home[lang].hero_title.replace(/<[^>]+>/g, ''));
    }
  });

  test('catalogue is translated (family tagline in EN and CA)', async ({ page }) => {
    const fam = content('families/wedding-signs.yaml');
    for (const lang of ['en', 'ca'] as const) {
      await open(page, url('packs/wedding-signs', lang));
      await expect(page.getByText(fam[lang].tagline).first()).toBeVisible();
    }
  });

  test('draft FAQ is not published: no menu link, old URL redirects home', async ({ page }) => {
    test.skip(faqPublished, 'FAQ is published');
    await open(page, '/');
    await expect(page.locator('.nav-links a[href$="faq.html"]')).toHaveCount(0);
    await page.goto('/faq.html');
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('catalogue', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop-chromium', 'data checks on one browser'));

  for (const slug of familySlugs) {
    test(`every price of ${slug} matches the data (ES and EN)`, async ({ page }) => {
      const file = content(`families/${slug}.yaml`);
      const fam = file.es;
      for (const lang of ['es', 'en'] as const) {
        await open(page, url(`packs/${slug}`, lang));
        const shown = await page.locator('[data-price]').allTextContents();
        const expected: string[] = [];
        // Amounts always come from ES; only the note is translated.
        const tr = lang === 'es' ? fam : file[lang] ?? {};
        const withNote = (p: Price, t?: { note?: string }) => ({ ...p, note: t?.note || p.note });
        if (fam.price_from) expected.push(priceText(withNote(fam.price_from, tr.price_from), lang));
        fam.packs.forEach((p: { visible?: boolean; price: Price }, i: number) => { if (p.visible !== false) expected.push(priceText(withNote(p.price, tr.packs?.[i]?.price), lang)); });
        (fam.extras ?? []).forEach((e: { price?: Price }, i: number) => { if (e.price) expected.push(priceText(withNote(e.price, tr.extras?.[i]?.price), lang, { vat: false })); });
        for (const e of expected) expect(shown, `${lang}: ${e}`).toContain(e);
      }
    });
  }

  test('creative direction levels show the PDF prices', async ({ page }) => {
    await open(page, '/es/creative-direction.html');
    for (const t of ['490 € IVA incluido', '950 € IVA incluido', '1.850 € IVA incluido']) await expect(page.getByText(t).first()).toBeVisible();
    await open(page, '/creative-direction.html');
    await expect(page.getByText('€1,850 VAT included').first()).toBeVisible();
  });

  test('hidden pack is not published', async ({ page }) => {
    // Guard for R-14: a pack with visible:false must not appear. All packs are visible today, so check the rule on data.
    const fam = content('families/wedding-paper-suite.yaml').es;
    await open(page, '/packs/wedding-paper-suite.html');
    await expect(page.locator('.pack')).toHaveCount(fam.packs.filter((p: { visible?: boolean }) => p.visible !== false).length);
  });

  test('packs page filters by area', async ({ page }) => {
    await open(page, '/packs.html');
    await page.locator('.filter-btn[data-filter="immersion"]').click();
    const visible = await page.locator('#family-grid .family-card:visible').count();
    const expected = familySlugs.filter((s) => content(`families/${s}.yaml`).es.area === 'immersion').length;
    expect(visible).toBe(expected);
  });
});

test.describe('contact', () => {
  test('"I\'m interested" pre-selects the pack in the form', async ({ page }) => {
    await open(page, '/packs/wedding-signs.html');
    await page.locator('#the-essentials .interest-btn').click();
    await expect(page).toHaveURL(/interest=The%20Wedding%20Signs&pack=The%20Essentials#contact$/);
    await expect(page.locator('input[name="interest"][value="The Wedding Signs"]')).toBeChecked();
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/^The Essentials \(The Wedding Signs\)/);
  });

  test('the form requires name, email, message and privacy consent', async ({ page }) => {
    await open(page, '/#contact');
    const form = page.locator('#contact-form');
    expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
    await form.locator('input[name="name"]').fill('Test');
    await form.locator('input[name="email"]').fill('test@example.com');
    await form.locator('textarea[name="message"]').fill('Hola');
    expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
    await form.locator('label.consent .box').click();
    await expect(form.locator('input[name="privacy"]')).toBeChecked();
    await form.locator('label.chip', { hasText: '50–80' }).click();
    await form.locator('select[name="wedding_date"]').selectOption({ index: 3 });
    await expect(form.locator('input[name="guests"][value="50–80"]')).toBeChecked();
    expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(true);
  });

  test('mailto stays available', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('a[href="mailto:hello@studiobelvi.com"]').first()).toBeAttached();
  });
});

test.describe('no PWA, SEO basics', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop-chromium', 'one browser'));
  test('no manifest or service worker; meta, sitemap and robots present', async ({ page, request }) => {
    await open(page, '/');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
    expect(await page.evaluate(() => navigator.serviceWorker?.controller ?? null)).toBeNull();
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
    expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:');
  });

  test('back office page and generated config are served', async ({ request }) => {
    const html = await (await request.get('/admin/index.html')).text();
    expect(html).toContain('@sveltia/cms@');
    const cfg = YAML.parse(await (await request.get('/admin/config.yml')).text());
    expect(cfg.backend.name).toBe('github');
    expect(cfg.i18n.locales).toEqual(['es', 'en', 'ca']);
    expect(cfg.collections.map((c: { name: string }) => c.name)).toEqual(['levels', 'families', 'general', 'pages', 'galleries', 'ui']);
  });
});
