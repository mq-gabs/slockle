import type { HintSpec } from '@slockle/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { KEY_PREFIX, storage } from '../game/storage';
import { HINT_WRITERS } from './hints';
import { LANGS, type Lang, type StringKey } from './strings';

const STORE_KEY = `${KEY_PREFIX}lang`;

function detect(): Lang {
  const saved = storage.get<string>(STORE_KEY, '');
  if (saved in LANGS) return saved as Lang;
  for (const pref of navigator.languages ?? [navigator.language]) {
    const code = String(pref).toLowerCase().split('-')[0];
    if (code && code in LANGS) return code as Lang;
  }
  return 'en';
}

export interface I18n {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: (key: StringKey, ...args: unknown[]) => string;
  hintText: (spec: HintSpec, n: number) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    storage.set(STORE_KEY, next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANGS[lang].locale;
  }, [lang]);

  const value = useMemo<I18n>(() => {
    const strings = LANGS[lang].strings;
    return {
      lang,
      locale: LANGS[lang].locale,
      setLang,
      t: (key, ...args) => {
        const v = strings[key];
        return typeof v === 'function' ? v(...args) : v;
      },
      hintText: (spec, n) => HINT_WRITERS[lang](spec, n),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
