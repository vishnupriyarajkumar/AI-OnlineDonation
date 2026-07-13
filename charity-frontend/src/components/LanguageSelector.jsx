import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const LANG_LIST = [
  { code:'en', native:'English',   flag:'🇬🇧' },
  { code:'ta', native:'தமிழ்',    flag:'🇮🇳' },
  { code:'hi', native:'हिन्दी',   flag:'🇮🇳' },
  { code:'te', native:'తెలుగు',   flag:'🇮🇳' },
  { code:'ml', native:'മലയാളം',  flag:'🇮🇳' },
  { code:'kn', native:'ಕನ್ನಡ',   flag:'🇮🇳' },
];

export default function LanguageSelector() {
  const { lang, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANG_LIST.find(l => l.code === lang) || LANG_LIST[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="lang-selector" ref={ref}>
      <motion.button
        className="lang-btn"
        onClick={() => setOpen(p => !p)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        aria-label="Select language"
      >
        <span>{current.flag}</span>
        <span>{current.native}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ fontSize: 10, opacity: 0.6 }}>▼</motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="lang-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {LANG_LIST.map(l => (
              <motion.div
                key={l.code}
                className={`lang-option ${lang === l.code ? 'active' : ''}`}
                onClick={() => { changeLanguage(l.code); setOpen(false); }}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
              >
                <span style={{ fontSize: 18 }}>{l.flag}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: lang === l.code ? 700 : 500 }}>{l.native}</div>
                </div>
                {lang === l.code && (
                  <span style={{ marginLeft: 'auto', color: 'var(--primary-light)', fontSize: 14 }}>✓</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
