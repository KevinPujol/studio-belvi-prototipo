import type { APIRoute } from 'astro';
import { isIndexable } from '../lib/i18n';

// Built from SITE_URL / BASE_PATH. Production lists its sitemap; any other host (the prototype)
// carries noindex on every page instead. Crawling stays allowed so search engines can read that noindex.
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const lines = ['User-agent: *', 'Allow: /', `Disallow: ${base}/admin/`];
  if (isIndexable(site)) lines.push(`Sitemap: ${new URL(`${base}/sitemap-index.xml`, site).href}`);
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain' } });
};
