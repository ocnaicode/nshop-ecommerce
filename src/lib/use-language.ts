'use client';

import { useCallback, useState } from 'react';
import { Language, translate, LANGUAGE_COOKIE, normalizeLanguage } from '@/lib/i18n';

function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('lang');
  return normalizeLanguage(stored);
}

/**
 * Client language hook.
 * - `lang`: current language (cookie + localStorage backed)
 * - `t`: translation lookup for the current language
 * - `setLang`: switch language; reloads the page so server-rendered
 *   strings (html lang, metadata) also switch.
 */
export function useLanguage(): { lang: Language; setLang: (lang: Language) => void; t: (key: string) => string } {
  const [lang, setLangState] = useState<Language>(() => getBrowserLanguage());

  const setLang = useCallback((next: Language) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lang', next);
    document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setLangState(next);
    window.location.reload();
  }, []);

  return { lang, setLang, t: (key: string) => translate(key, lang) };
}
