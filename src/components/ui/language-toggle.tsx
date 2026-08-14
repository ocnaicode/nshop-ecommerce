'use client';

import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLanguage, setLanguage, type Language } from '@/lib/i18n';

/**
 * Language toggle — switches between English and Bengali.
 * Persists to localStorage and syncs the <html lang> attribute.
 */
export function LanguageToggle() {
  const [lang, setLangState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLangState(getLanguage());
  }, []);

  function toggle() {
    const next: Language = lang === 'en' ? 'bn' : 'en';
    setLanguage(next);
    setLangState(next);
    document.documentElement.lang = next;
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Switch language" disabled>
        <Languages className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={lang === 'en' ? 'Switch to Bengali' : 'Switch to English'}
      onClick={toggle}
      className="gap-1.5"
    >
      <Languages className="w-4 h-4" />
      <span className="text-xs font-semibold">{lang === 'en' ? 'বাংলা' : 'EN'}</span>
    </Button>
  );
}
