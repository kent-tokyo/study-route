'use client';

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import ja from './locales/ja.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

export type Locale = 'ja' | 'en' | 'zh';

const VALID_LOCALES = new Set<string>(['ja', 'en', 'zh']);
const messages: Record<Locale, Record<string, unknown>> = { ja, en, zh };

const STORAGE_KEY = 'plactice_math_locale';

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

function isValidLocale(v: string | null): v is Locale {
  return v !== null && VALID_LOCALES.has(v);
}

/** Read ?lang= from current URL */
function getUrlLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('lang');
  return isValidLocale(param) ? param : null;
}

/** Update ?lang= in URL without full reload */
function setUrlLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('lang', locale);
  window.history.replaceState({}, '', url.toString());
}

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'ja',
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ja');

  useEffect(() => {
    // Priority: URL ?lang= > localStorage > default (ja)
    const urlLocale = getUrlLocale();
    if (urlLocale) {
      setLocaleState(urlLocale);
      localStorage.setItem(STORAGE_KEY, urlLocale);
      document.documentElement.lang = urlLocale;
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isValidLocale(saved)) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
    setUrlLocale(l);
  }, []);

  const t = useCallback((key: string): string => {
    return getNestedValue(messages[locale] as Record<string, unknown>, key);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
