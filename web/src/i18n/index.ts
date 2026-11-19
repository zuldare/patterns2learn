import { en } from './en';
import { es } from './es';

/** Every site locale, in display order. */
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export type UiKey = keyof typeof en;

const dict: Record<Locale, Record<UiKey, string>> = { es, en };

export function t(lang: Locale, key: UiKey): string {
  return dict[lang][key];
}
