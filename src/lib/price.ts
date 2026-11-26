// Builds the price text from the structured `price` object (R-07). Nobody writes a price inside a sentence.
import type { Lang } from './i18n';

export type Price = {
  kind: 'from' | 'fixed' | 'quote';
  amount?: number | null;
  vat_mode?: 'included' | 'excluded' | 'unspecified';
  unit?: 'month' | 'unit' | 'piece' | null;
  plus?: boolean; // add-on price shown as "+180 €"
  note?: string | null; // e.g. "según tirada y piezas"
};

const T = {
  en: { from: 'From', quote: 'Quote', quoteCustom: 'Custom quote', incl: 'VAT included', excl: '+ VAT', month: '/month', unit: '/unit', piece: '/piece' },
  es: { from: 'Desde', quote: 'Presupuesto', quoteCustom: 'Presupuesto personalizado', incl: 'IVA incluido', excl: '+ IVA', month: '/mes', unit: '/unidad', piece: '/pieza' },
  ca: { from: 'Des de', quote: 'Pressupost', quoteCustom: 'Pressupost personalitzat', incl: 'IVA inclòs', excl: '+ IVA', month: '/mes', unit: '/unitat', piece: '/peça' },
} as const;

/** 1450 → "1.450 €" (ES, CA) or "€1,450" (EN). */
export function money(n: number, lang: Lang): string {
  if (lang === 'en') return '€' + n.toLocaleString('en-US');
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
}

export function priceText(p: Price | undefined | null, lang: Lang, opts: { vat?: boolean } = {}): string {
  if (!p) return '';
  const t = T[lang];
  const showVat = opts.vat !== false;
  if (p.kind === 'quote' || p.amount == null) {
    return p.note ? `${t.quote} ${p.note}` : t.quoteCustom;
  }
  let amount = money(p.amount, lang);
  if (p.unit) amount = lang === 'en' ? amount + t[p.unit] : amount.replace(' €', ` €${t[p.unit]}`);
  if (p.plus) amount = '+' + amount;
  const parts = [p.kind === 'from' ? `${t.from} ${amount}` : amount];
  if (p.note) parts.push(p.note);
  if (showVat && p.vat_mode === 'included') parts.push(t.incl);
  if (showVat && p.vat_mode === 'excluded') parts.push(t.excl);
  return parts.join(' ');
}
