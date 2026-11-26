// Every page of the site. Same route in the three languages: EN at the root, ES under /es/, CA under /ca/.
import { families, faq } from './content';

export type View = 'home' | 'creative-direction' | 'level' | 'packs' | 'family' | 'area' | 'portfolio' | 'faq' | 'privacy' | 'redirect';
export type RouteDef = { route: string; view: View; key?: string };

/** Routes that are real pages (not redirects): for the menu and the sitemap. */
export const isPublished = (route: string) => allRoutes().some((r) => r.route === route && r.view !== 'redirect');

export function allRoutes(): RouteDef[] {
  return [
    { route: '', view: 'home' },
    { route: 'creative-direction', view: 'creative-direction' },
    ...['sparks', 'chapters', 'universe'].map((key) => ({ route: key, view: 'level' as const, key })),
    { route: 'packs', view: 'packs' },
    ...families('es').map((f) => ({ route: `packs/${f.slug}`, view: 'family' as const, key: f.slug })),
    ...['memorabilia', 'scenography', 'immersion'].map((key) => ({ route: key, view: 'area' as const, key })),
    { route: 'portfolio', view: 'portfolio' },
    // Draft FAQ: keep the legacy URL alive as a redirect to the home page.
    faq('es').published ? { route: 'faq', view: 'faq' as const } : { route: 'faq', view: 'redirect' as const, key: '' },
    { route: 'privacy', view: 'privacy' },
  ];
}
