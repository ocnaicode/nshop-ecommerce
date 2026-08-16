'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/use-language';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

const LABELS: Record<string, string> = {
  en: 'English',
  bn: 'বাংলা',
};

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="relative inline-flex items-center rounded-full border border-border bg-white text-sm">
      <Globe className="w-4 h-4 text-gray-500 ml-2.5 mr-1" />
      <div className="flex rounded-full p-0.5">
        {SUPPORTED_LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              lang === code
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label={LABELS[code]}
          >
            {code === 'bn' ? 'বাংলা' : 'EN'}
          </button>
        ))}
      </div>
    </div>
  );
}
