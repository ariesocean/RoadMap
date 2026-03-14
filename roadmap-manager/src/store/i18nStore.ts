import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type TranslationKey } from '@/utils/translations';

export type Language = 'en' | 'zh';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'en' as Language,

      setLanguage: (language: Language) => {
        set({ language });
      },

      t: (key: TranslationKey): string => {
        const currentLang = get().language;
        const translation = translations[key] as Record<string, string> | undefined;
        if (!translation) return key;
        return translation[currentLang] ?? translation.en ?? key;
      },
    }),
    {
      name: 'language-storage',
    }
  )
);
