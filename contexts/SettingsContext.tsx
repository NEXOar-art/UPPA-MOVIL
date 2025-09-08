
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light' | 'high-contrast';
type Language = 'es' | 'en';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: number;
  setFontSize: (update: (prev: number) => number) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string }) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState<number>(16);
  const [language, setLanguage] = useState<Language>('es');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`);
        if (!response.ok) {
          throw new Error(`Could not load ${language}.json`);
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error("Failed to fetch translations:", error);
        if (language !== 'es') {
          const fallbackResponse = await fetch(`/locales/es.json`);
          const data = await fallbackResponse.json();
          setTranslations(data);
        }
      }
    };
    fetchTranslations();
  }, [language]);

  const t = useCallback((key: string, replacements?: { [key: string]: string }) => {
    let translation = translations[key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        });
    }
    return translation;
  }, [translations]);

  const value = { theme, setTheme, fontSize, setFontSize, language, setLanguage, t };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
