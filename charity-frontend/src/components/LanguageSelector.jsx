import { useState, useRef, useEffect } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

const LANG_FLAGS = { en:'🇬🇧', ta:'🇮🇳', hi:'🇮🇳', te:'🇮🇳', ml:'🇮🇳', kn:'🇮🇳' };
const LANG_SHORT = { en:'EN', ta:'TA', hi:'HI', te:'TE', ml:'ML', kn:'KN' };

export default function LanguageSelector({ compact = false }) {
  const { lang, changeLanguage, loading } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const select = (code) => { changeLanguage(code); setOpen(false); };

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(p => !p)}
        style={{
          display:'flex', alignItems:'center', gap:6,
          background:'rgba(255,255,255,0.07)', border:'1px solid var(--border)',
          borderRadius:8, padding: compact ? '5px 10px' : '7px 14px',
          cursor:'pointer', color:'var(--text)', fontSize:13, fontWeight:600,
          transition:'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
        aria-label="Select language">
        <span style={{ fontSize:16 }}>{loading ? '⏳' : LANG_FLAGS[lang]}</span>
        {!compact && <span>{LANG_SHORT[lang]}</span>}
        <span style={{ opacity:0.6, fontSize:10 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', right:0,
          background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
          zIndex:9999, minWidth:200, overflow:'hidden',
          animation:'fadeUp 0.15s ease',
        }}>
          <div style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid var(--border)' }}>
            🌐 Select Language
          </div>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <button key={code} onClick={() => select(code)}
              style={{
                display:'flex', alignItems:'center', gap:12, width:'100%',
                padding:'10px 16px', background: lang===code ? 'rgba(108,60,232,0.15)' : 'transparent',
                border:'none', cursor:'pointer', color: lang===code ? 'var(--primary-light)' : 'var(--text)',
                fontSize:13, fontWeight: lang===code ? 700 : 400, textAlign:'left',
                transition:'background 0.15s',
              }}
              onMouseEnter={e => { if (lang!==code) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (lang!==code) e.currentTarget.style.background='transparent'; }}>
              <span style={{ fontSize:20 }}>{LANG_FLAGS[code]}</span>
              <span style={{ flex:1 }}>{name}</span>
              {lang===code && <span style={{ color:'var(--primary-light)' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
