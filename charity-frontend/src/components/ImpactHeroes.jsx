import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/* ── Character data ─────────────────────────────────────────── */
const HEROES = [
  {
    id: 'aarav',
    emoji: '🧒',
    color: '#6366f1',
    glowColor: 'rgba(99,102,241,0.4)',
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    nameKey: 'AARAV',
    roleKey: 'The Volunteer',
    descKey: 'Welcomes users, guides them around and explains how donations create real impact.',
    animation: 'wave',
    icon: '🤝',
    translations: {
      ta: { name: 'அரவ்', role: 'தன்னார்வலர்', desc: 'பயனர்களை வரவேற்று வழிநடத்துகிறார்.' },
      hi: { name: 'आरव', role: 'स्वयंसेवक', desc: 'उपयोगकर्ताओं का स्वागत और मार्गदर्शन करता है।' },
      te: { name: 'ఆరవ్', role: 'స్వచ్ఛంద సేవకుడు', desc: 'వినియోగదారులకు స్వాగతం పలికి మార్గనిర్దేశం చేస్తాడు.' },
      ml: { name: 'ആരവ്', role: 'സന്നദ്ധ സേവകൻ', desc: 'ഉപയോക്താക്കളെ സ്വാഗതം ചെയ്ത് വഴി കാണിക്കുന്നു.' },
      kn: { name: 'ಆರವ್', role: 'ಸ್ವಯಂಸೇವಕ', desc: 'ಬಳಕೆದಾರರಿಗೆ ಸ್ವಾಗತ ಹೇಳಿ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತಾನೆ.' },
    },
  },
  {
    id: 'miya',
    emoji: '👧',
    color: '#ec4899',
    glowColor: 'rgba(236,72,153,0.4)',
    gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)',
    nameKey: 'MIYA',
    roleKey: 'The Donor',
    descKey: 'Encourages people to donate and shows how every contribution brings hope and changes lives.',
    animation: 'bounce',
    icon: '💜',
    translations: {
      ta: { name: 'மியா', role: 'நன்கொடையாளர்', desc: 'நன்கொடை செய்ய ஊக்குவிக்கிறாள்.' },
      hi: { name: 'मिया', role: 'दाता', desc: 'दान के लिए प्रोत्साहित करती है।' },
      te: { name: 'మియా', role: 'దాత', desc: 'విరాళాలు ఇవ్వడానికి ప్రోత్సహిస్తుంది.' },
      ml: { name: 'മിയ', role: 'ദാതാവ്', desc: 'സംഭാവന ചെയ്യാൻ പ്രോത്സാഹിപ്പിക്കുന്നു.' },
      kn: { name: 'ಮಿಯಾ', role: 'ದಾನಿ', desc: 'ದೇಣಿಗೆ ನೀಡಲು ಪ್ರೋತ್ಸಾಹಿಸುತ್ತಾಳೆ.' },
    },
  },
  {
    id: 'rayan',
    emoji: '🧑',
    color: '#0ea5e9',
    glowColor: 'rgba(14,165,233,0.4)',
    gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    nameKey: 'RAYAN',
    roleKey: 'The Explorer',
    descKey: 'Helps users explore campaigns, discover needs and find the right causes to support.',
    animation: 'float',
    icon: '🔍',
    translations: {
      ta: { name: 'ரயான்', role: 'ஆய்வாளர்', desc: 'பிரச்சாரங்களை ஆராய உதவுகிறார்.' },
      hi: { name: 'रयान', role: 'खोजकर्ता', desc: 'अभियानों को खोजने में मदद करता है।' },
      te: { name: 'రయాన్', role: 'అన్వేషకుడు', desc: 'ప్రచారాలను కనుగొనడంలో సహాయం చేస్తాడు.' },
      ml: { name: 'റയാൻ', role: 'അന്വേഷകൻ', desc: 'കാമ്പെയ്‌നുകൾ കണ്ടുപിടിക്കാൻ സഹായിക്കുന്നു.' },
      kn: { name: 'ರಯಾನ್', role: 'ಅನ್ವೇಷಕ', desc: 'ಅಭಿಯಾನಗಳನ್ನು ಹುಡುಕಲು ಸಹಾಯ ಮಾಡುತ್ತಾನೆ.' },
    },
  },
  {
    id: 'tara',
    emoji: '👩',
    color: '#10b981',
    glowColor: 'rgba(16,185,129,0.4)',
    gradient: 'linear-gradient(135deg,#10b981,#0ea5e9)',
    nameKey: 'TARA',
    roleKey: 'The Creator',
    descKey: 'Helps NGOs and organizations create campaigns easily and share their mission.',
    animation: 'pulse',
    icon: '✨',
    translations: {
      ta: { name: 'தாரா', role: 'படைப்பாளி', desc: 'NGO-களுக்கு பிரச்சாரங்கள் உருவாக்க உதவுகிறாள்.' },
      hi: { name: 'तारा', role: 'निर्माता', desc: 'NGO को अभियान बनाने में मदद करती है।' },
      te: { name: 'తారా', role: 'సృష్టికర్త', desc: 'NGO లకు ప్రచారాలు సృష్టించడంలో సహాయం చేస్తుంది.' },
      ml: { name: 'താര', role: 'സ്രഷ്ടാവ്', desc: 'NGO-കൾക്ക് കാമ്പെയ്‌ൻ ഉണ്ടാക്കാൻ സഹായിക്കുന്നു.' },
      kn: { name: 'ತಾರಾ', role: 'ಸೃಷ್ಟಿಕರ್ತ', desc: 'NGO ಗಳಿಗೆ ಅಭಿಯಾನ ರಚಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತಾಳೆ.' },
    },
  },
  {
    id: 'vivan',
    emoji: '🧔',
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.4)',
    gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    nameKey: 'VIVAN',
    roleKey: 'The Guardian',
    descKey: 'Represents trust, safety and transparency in every transaction and process.',
    animation: 'shake',
    icon: '🛡️',
    translations: {
      ta: { name: 'விவான்', role: 'பாதுகாவலர்', desc: 'நம்பகத்தன்மை மற்றும் வெளிப்படைத்தன்மையை உறுதிப்படுத்துகிறார்.' },
      hi: { name: 'विवान', role: 'संरक्षक', desc: 'विश्वास और पारदर्शिता सुनिश्चित करता है।' },
      te: { name: 'వివాన్', role: 'సంరక్షకుడు', desc: 'విశ్వాసం మరియు పారదర్శకతను నిర్ధారిస్తాడు.' },
      ml: { name: 'വിവൻ', role: 'കാവൽക്കാരൻ', desc: 'വിശ്വാസ്യതയും സുതാര്യതയും ഉറപ്പാക്കുന്നു.' },
      kn: { name: 'ವಿವಾನ್', role: 'ರಕ್ಷಕ', desc: 'ವಿಶ್ವಾಸಾರ್ಹತೆ ಮತ್ತು ಪಾರದರ್ಶಕತೆ ಖಾತ್ರಿಪಡಿಸುತ್ತಾನೆ.' },
    },
  },
  {
    id: 'noor',
    emoji: '👱‍♀️',
    color: '#a78bfa',
    glowColor: 'rgba(167,139,250,0.4)',
    gradient: 'linear-gradient(135deg,#a78bfa,#ec4899)',
    nameKey: 'NOOR',
    roleKey: 'The Supporter',
    descKey: 'Helps users with queries, support and ensures a smooth donation experience.',
    animation: 'spin',
    icon: '💫',
    translations: {
      ta: { name: 'நூர்', role: 'ஆதரவாளர்', desc: 'பயனர்களுக்கு உதவி மற்றும் ஆதரவு வழங்குகிறாள்.' },
      hi: { name: 'नूर', role: 'समर्थक', desc: 'उपयोगकर्ताओं को सहायता और समर्थन प्रदान करती है।' },
      te: { name: 'నూర్', role: 'మద్దతుదారుడు', desc: 'వినియోగదారులకు మద్దతు అందిస్తుంది.' },
      ml: { name: 'നൂർ', role: 'പിന്തുണ നൽകുന്നവർ', desc: 'ഉപയോക്താക്കൾക്ക് സഹായവും പിന്തുണയും നൽകുന്നു.' },
      kn: { name: 'ನೂರ್', role: 'ಬೆಂಬಲಿಗ', desc: 'ಬಳಕೆದಾರರಿಗೆ ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ ನೀಡುತ್ತಾಳೆ.' },
    },
  },
];

/* ── Animation variants per character ────────────────────── */
const ANIM_VARIANTS = {
  wave: {
    animate: { rotate: [0, 15, -5, 15, 0], y: [0, -4, 0, -4, 0] },
    transition: { duration: 2.5, repeat: Infinity, repeatDelay: 2 },
  },
  bounce: {
    animate: { y: [0, -18, 0, -10, 0], scaleY: [1, 1.05, 0.95, 1.03, 1] },
    transition: { duration: 1.8, repeat: Infinity, repeatDelay: 1.5 },
  },
  float: {
    animate: { y: [0, -14, 0], rotate: [-3, 3, -3] },
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
  pulse: {
    animate: { scale: [1, 1.12, 1, 1.08, 1] },
    transition: { duration: 2, repeat: Infinity, repeatDelay: 1 },
  },
  shake: {
    animate: { x: [0, -5, 5, -5, 5, 0], rotate: [0, -3, 3, -3, 0] },
    transition: { duration: 0.7, repeat: Infinity, repeatDelay: 2.5 },
  },
  spin: {
    animate: { rotate: [0, 360] },
    transition: { duration: 6, repeat: Infinity, ease: 'linear' },
  },
};

/* ── Single hero card ─────────────────────────────────────── */
function HeroCard({ hero, index, lang }) {
  const [hovered, setHovered] = useState(false);
  const anim = ANIM_VARIANTS[hero.animation];
  const tr = hero.translations[lang];

  const name = tr ? tr.name : hero.nameKey;
  const role = tr ? tr.role : hero.roleKey;
  const desc = tr ? tr.desc : hero.descKey;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      <motion.div
        whileHover={{ y: -10, scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          background: hovered
            ? `linear-gradient(160deg, rgba(15,15,30,0.95), rgba(15,15,30,0.8))`
            : 'rgba(15,15,30,0.85)',
          border: hovered
            ? `1px solid ${hero.color}66`
            : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '28px 20px',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
          transition: 'border-color 0.3s, background 0.3s',
          boxShadow: hovered ? `0 20px 50px ${hero.glowColor}` : 'none',
        }}
      >
        {/* Glow blob behind character */}
        <motion.div
          style={{
            position: 'absolute', width: 90, height: 90, borderRadius: '50%',
            background: hero.gradient, opacity: hovered ? 0.25 : 0.1,
            filter: 'blur(20px)', top: 20, left: '50%', transform: 'translateX(-50%)',
            transition: 'opacity 0.3s',
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Animated character emoji */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 12 }}>
          {/* Avatar circle */}
          <motion.div
            style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 8px',
              background: hero.gradient, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 40,
              boxShadow: `0 0 24px ${hero.glowColor}`,
              border: `2px solid ${hero.color}55`,
            }}
            animate={anim.animate}
            transition={anim.transition}
          >
            {hero.emoji}
          </motion.div>

          {/* Role icon badge */}
          <motion.div
            style={{
              position: 'absolute', bottom: 0, right: 'calc(50% - 52px)',
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(10,10,25,0.9)', border: `1px solid ${hero.color}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
          >
            {hero.icon}
          </motion.div>
        </div>

        {/* Name with color accent */}
        <motion.h3
          style={{
            fontWeight: 900, fontSize: 18, marginBottom: 4,
            background: hero.gradient,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.5px',
          }}
          animate={hovered ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {name}
        </motion.h3>

        {/* Role tag */}
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700,
          padding: '3px 12px', borderRadius: 99, marginBottom: 12,
          background: `${hero.color}18`,
          color: hero.color, border: `1px solid ${hero.color}44`,
          letterSpacing: '0.3px',
        }}>
          {role}
        </div>

        {/* Description */}
        <p style={{
          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65,
          minHeight: 52,
        }}>
          {desc}
        </p>

        {/* Speech bubble on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
                background: hero.gradient, borderRadius: 10,
                padding: '6px 14px', fontSize: 12, color: '#fff', fontWeight: 600,
                whiteSpace: 'nowrap', zIndex: 10,
                boxShadow: `0 4px 20px ${hero.glowColor}`,
              }}
            >
              {lang === 'ta' ? `வணக்கம்! நான் ${name}` :
               lang === 'hi' ? `नमस्ते! मैं ${name} हूं` :
               lang === 'te' ? `నమస్కారం! నేను ${name}` :
               lang === 'ml' ? `നമസ്കാരം! ഞാൻ ${name}` :
               lang === 'kn' ? `ನಮಸ್ಕಾರ! ನಾನು ${name}` :
               `Hi, I'm ${name}!`}
              <div style={{
                position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                width: 12, height: 6, overflow: 'hidden',
              }}>
                <div style={{
                  width: 12, height: 12, background: hero.color,
                  transform: 'rotate(45deg)', transformOrigin: 'top left',
                  marginTop: -6,
                }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ── Section labels per language ─────────────────────────── */
const SECTION_LABELS = {
  en: { title: 'Meet Our Impact', highlight: 'Heroes', sub: 'Young. Caring. Determined to make a difference.', tag: '💜 Our Characters' },
  ta: { title: 'எங்கள் தாக்க', highlight: 'நாயகர்களை சந்தியுங்கள்', sub: 'இளமையான. அக்கறையுள்ள. மாற்றம் செய்ய உறுதியுள்ள.', tag: '💜 எங்கள் கதாபாத்திரங்கள்' },
  hi: { title: 'हमारे प्रभाव', highlight: 'नायकों से मिलें', sub: 'युवा। देखभाल करने वाले। बदलाव लाने के लिए प्रतिबद्ध।', tag: '💜 हमारे पात्र' },
  te: { title: 'మా ప్రభావ', highlight: 'హీరోలను కలవండి', sub: 'యువ. శ్రద్ధగల. మార్పు తీసుకురావడానికి నిశ్చయించిన.', tag: '💜 మా పాత్రలు' },
  ml: { title: 'ഞങ്ങളുടെ ഇംപാക്ട്', highlight: 'ഹീറോകളെ കണ്ടുമുട്ടൂ', sub: 'യുവ. ശ്രദ്ധാലു. മാറ്റം കൊണ്ടുവരാൻ ദൃഢനിശ്ചയം.', tag: '💜 ഞങ്ങളുടെ കഥാപാത്രങ്ങൾ' },
  kn: { title: 'ನಮ್ಮ ಪ್ರಭಾವ', highlight: 'ಹೀರೋಗಳನ್ನು ಭೇಟಿ ಮಾಡಿ', sub: 'ಯುವ. ಕಾಳಜಿಯುಳ್ಳ. ಬದಲಾವಣೆ ತರಲು ದೃಢನಿಶ್ಚಯ.', tag: '💜 ನಮ್ಮ ಪಾತ್ರಗಳು' },
};

/* ── Main exported section ────────────────────────────────── */
export default function ImpactHeroes() {
  const { lang } = useLanguage();
  const lbl = SECTION_LABELS[lang] || SECTION_LABELS.en;

  return (
    <section style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.05) 0%, transparent 70%)',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section header */}
        <motion.div
          style={{ textAlign: 'center', marginBottom: 56 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <motion.span
            className="chip chip-glow"
            style={{ marginBottom: 16, display: 'inline-block' }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {lbl.tag}
          </motion.span>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, marginBottom: 12 }}>
            {lbl.title}{' '}
            <span className="gradient-text">{lbl.highlight}</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>{lbl.sub}</p>
        </motion.div>

        {/* Hero cards grid */}
        <div className="heroes-grid">
          {HEROES.map((hero, i) => (
            <HeroCard key={hero.id} hero={hero} index={i} lang={lang} />
          ))}
        </div>

        {/* Bottom tagline */}
        <motion.div
          style={{ textAlign: 'center', marginTop: 48 }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <p style={{
            fontSize: 14, color: 'var(--text-muted)',
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: 12, padding: '12px 28px', display: 'inline-block',
          }}>
            {lang === 'ta' ? '🌟 ஒவ்வொரு நன்கொடையிலும் நாம் ஒரு வாழ்க்கையை மாற்றுகிறோம்' :
             lang === 'hi' ? '🌟 हर दान से हम एक जीवन बदलते हैं' :
             lang === 'te' ? '🌟 ప్రతి విరాళంతో మనం ఒక జీవితాన్ని మారుస్తాం' :
             lang === 'ml' ? '🌟 ഓരോ സംഭാവനയിലും നാം ഒരു ജീവിതം മാറ്റുന്നു' :
             lang === 'kn' ? '🌟 ಪ್ರತಿ ದೇಣಿಗೆಯಲ್ಲೂ ನಾವು ಒಂದು ಜೀವನ ಬದಲಾಯಿಸುತ್ತೇವೆ' :
             '🌟 Together we are one personality, one mission — to build a better world through every donation'}
          </p>
        </motion.div>
      </div>

      {/* Responsive grid */}
      <style>{`
        @media (max-width: 1100px) {
          .heroes-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .heroes-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}
