import type { APIRoute } from 'astro';

// Built from SITE_URL / BASE_PATH, so the prototype and production each point to their own sitemap.
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const sitemap = new URL(`${base}/sitemap-index.xml`, site).href;
  return new Response(`User-agent: *\nAllow: /\nDisallow: ${base}/admin/\nSitemap: ${sitemap}\n`, { headers: { 'Content-Type': 'text/plain' } });
};
