import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getT, LANGUAGES } from '../i18n/index';

const LanguageContext = createContext(null);

// Re-export for backwards compat
export { LANGUAGES as SUPPORTED_LANGUAGES };

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('preferredLang') || 'en';
  });

  // t() is a NEW function reference every time lang changes
  // This forces every component that calls useLanguage() to re-render
  const t = useCallback(
    (key) => getT(lang)(key),
    [lang]   // <-- new function on every lang change
  );

  // Apply lang attribute to <html>
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  const changeLanguage = useCallback((newLang) => {
    if (!LANGUAGES[newLang]) return;
    setLang(newLang);
    localStorage.setItem('preferredLang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.setAttribute('data-lang', newLang);
    // Persist to server (best-effort, non-blocking)
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        fetch('http://localhost:8080/api/language/preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ language: newLang }),
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // Context value — new object every time lang changes, ensuring all consumers update
  const value = useMemo(() => ({
    lang,
    t,
    changeLanguage,
    LANGUAGES,
  }), [lang, t, changeLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
