import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Language } from "../types";
import { translations, type TranslationKey } from "./translations";

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLanguage(): Language {
  if (typeof window === "undefined") return "pl";
  const stored = window.localStorage.getItem("kolejowe-lang");
  if (stored === "pl" || stored === "en") return stored;
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "pl";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem("kolejowe-lang", lang);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  };

  const t = useMemo(() => {
    return (key: TranslationKey, vars?: Record<string, string | number>) => {
      let str: string = translations[language][key] ?? translations.pl[key];
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
