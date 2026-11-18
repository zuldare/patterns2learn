import { en } from './en';
import { es } from './es';

export type Locale = 'es' | 'en';
export type UiKey = keyof typeof en;

const dict: Record<Locale, Record<UiKey, string>> = { es, en };

export function t(lang: Locale, key: UiKey): string {
  return dict[lang][key];
}
