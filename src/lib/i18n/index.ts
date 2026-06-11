import { useMemo } from 'react';
import { pl } from './translations/pl';
import { en } from './translations/en';
import type { Translations } from './translations/pl';

export type Lang = 'pl' | 'en';

export const TRANSLATIONS: Record<Lang, Translations> = { pl, en };

export const DEFAULT_LANG: Lang = 'pl';

/** Returns the full translation dict for a given language. */
export function getTranslations(lang: Lang): Translations {
  return TRANSLATIONS[lang] ?? TRANSLATIONS[DEFAULT_LANG];
}

/**
 * Type-safe deep key accessor.
 * Supports dot-notation: t('nav.login'), t('sections.role.name')
 */
type DeepKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? DeepKeyOf<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
          : `${Prefix}${K}`
        : never;
    }[keyof T]
  : never;

export type TranslationKey = DeepKeyOf<Translations>;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : path;
}

/** Returns a `t(key)` function for the given language. */
export function getT(lang: Lang): (key: string) => string {
  const dict = getTranslations(lang) as unknown as Record<string, unknown>;
  return (key: string) => getNestedValue(dict, key);
}

/**
 * React hook — call with the lang prop passed from Astro.
 * Returns a memoized `t` function and the current lang.
 *
 * @example
 * const { t, lang } = useI18n(props.lang);
 * <h1>{t('dashboard.title')}</h1>
 */
export function useI18n(lang: Lang): { t: (key: string) => string; lang: Lang; translations: Translations } {
  return useMemo(() => {
    const translations = getTranslations(lang);
    const dict = translations as unknown as Record<string, unknown>;
    return {
      t: (key: string) => getNestedValue(dict, key),
      lang,
      translations,
    };
  }, [lang]);
}

/** Parse language from cookie string (server-side). */
export function parseLangCookie(cookieHeader: string | null): Lang {
  if (!cookieHeader) return DEFAULT_LANG;
  const match = cookieHeader.match(/(?:^|;\s*)lang=([^;]+)/);
  const value = match?.[1];
  return value === 'en' || value === 'pl' ? value : DEFAULT_LANG;
}
