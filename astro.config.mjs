// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import YAML from 'yaml';

// Pages left out of the sitemap: the back office and unpublished (draft) pages.
const faqPublished = YAML.parse(fs.readFileSync('src/content/faq.yaml', 'utf8')).es.published !== false;

// Account-independent: the site URL and base path come from the environment.
// Production (studiobelvi.com): SITE_URL=https://studiobelvi.com, BASE_PATH unset.
// Prototype on a project page: SITE_URL=https://<user>.github.io, BASE_PATH=/<repo>.
const site = process.env.SITE_URL || 'https://studiobelvi.com';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  // 'preserve' keeps today's URLs: sparks.html, faq.html… and es/index.html for /es/
  build: { format: 'preserve' },
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es', ca: 'ca' } },
      filter: (page) => !page.includes('/admin/') && (faqPublished || !/\/faq\.html$/.test(page)),
    }),
  ],
});
