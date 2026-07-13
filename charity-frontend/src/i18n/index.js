import en from './en';
import ta from './ta';
import hi from './hi';
import te from './te';
import ml from './ml';
import kn from './kn';

export const translations = { en, ta, hi, te, ml, kn };

export const LANGUAGES = {
  en: { name: 'English',            flag: '🇬🇧', native: 'English'      },
  ta: { name: 'Tamil',              flag: '🇮🇳', native: 'தமிழ்'       },
  hi: { name: 'Hindi',              flag: '🇮🇳', native: 'हिन्दी'      },
  te: { name: 'Telugu',             flag: '🇮🇳', native: 'తెలుగు'      },
  ml: { name: 'Malayalam',          flag: '🇮🇳', native: 'മലയാളം'     },
  kn: { name: 'Kannada',            flag: '🇮🇳', native: 'ಕನ್ನಡ'       },
};

/**
 * Deep-get a nested translation key e.g. t('nav.home')
 * Falls back to English, then to the key itself.
 */
export function getT(lang) {
  const bundle  = translations[lang] || translations.en;
  const fallback = translations.en;

  return function t(dotPath) {
    const keys = dotPath.split('.');
    let val = bundle;
    for (const k of keys) {
      val = val?.[k];
      if (val === undefined) break;
    }
    if (typeof val === 'string') return val;

    // Fallback to English
    let fb = fallback;
    for (const k of keys) {
      fb = fb?.[k];
      if (fb === undefined) break;
    }
    return typeof fb === 'string' ? fb : dotPath;
  };
}
