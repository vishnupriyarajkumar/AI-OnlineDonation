import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axiosInstance from '../api/axiosInstance';

/* ─── 10 Avatar Styles ─────────────────────────────────────── */
const AVATARS = [
  { emoji: '🧙‍♀️', bg: 'linear-gradient(135deg,#7c3aed,#a78bfa)', name: 'Mystic' },
  { emoji: '🦸‍♂️', bg: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', name: 'Hero' },
  { emoji: '🧚‍♀️', bg: 'linear-gradient(135deg,#ec4899,#f9a8d4)', name: 'Fairy' },
  { emoji: '🤖', bg: 'linear-gradient(135deg,#10b981,#34d399)', name: 'Bot' },
  { emoji: '🦊', bg: 'linear-gradient(135deg,#f59e0b,#fcd34d)', name: 'Fox' },
  { emoji: '🐉', bg: 'linear-gradient(135deg,#ef4444,#fca5a5)', name: 'Dragon' },
  { emoji: '🧜‍♀️', bg: 'linear-gradient(135deg,#06b6d4,#67e8f9)', name: 'Mermaid' },
  { emoji: '🦁', bg: 'linear-gradient(135deg,#d97706,#fbbf24)', name: 'Lion' },
  { emoji: '🧝‍♀️', bg: 'linear-gradient(135deg,#8b5cf6,#c4b5fd)', name: 'Elf' },
  { emoji: '🐺', bg: 'linear-gradient(135deg,#6366f1,#a5b4fc)', name: 'Wolf' },
];

function getAvatarIndex(userId) {
  if (!userId) return 0;
  return Number(userId) % AVATARS.length;
}

/* ─── Contextual Messages ───────────────────────────────────── */
function getGreeting(name, lang) {
  const firstName = name?.split(' ')[0] || 'Friend';
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? '🌅 Good morning' : hour < 17 ? '☀️ Good afternoon' : '🌙 Good evening';

  const msgs = {
    en: [
      `${timeGreet}, ${firstName}! Ready to change lives today? 💜`,
      `Welcome back, ${firstName}! Your kindness makes the world better. 🌍`,
      `Hey ${firstName}! There are campaigns waiting for your support. 🎯`,
    ],
    ta: [
      `${timeGreet}, ${firstName}! இன்று வாழ்க்கைகளை மாற்ற தயாரா? 💜`,
      `மீண்டும் வரவேற்கிறோம், ${firstName}! உங்கள் கருணை உலகை சிறப்பாக்குகிறது. 🌍`,
    ],
    hi: [
      `${timeGreet}, ${firstName}! आज जीवन बदलने के लिए तैयार हैं? 💜`,
      `वापस स्वागत है, ${firstName}! आपकी दयालुता दुनिया को बेहतर बनाती है। 🌍`,
    ],
    te: [`${timeGreet}, ${firstName}! ఈరోజు జీవితాలు మార్చడానికి సిద్ధంగా ఉన్నారా? 💜`],
    ml: [`${timeGreet}, ${firstName}! ഇന്ന് ജീവിതങ്ങൾ മാറ്റാൻ തയ്യാറോ? 💜`],
    kn: [`${timeGreet}, ${firstName}! ಇಂದು ಜೀವನ ಬದಲಾಯಿಸಲು ಸಿದ್ಧರಾಗಿದ್ದೀರಾ? 💜`],
  };
  const pool = msgs[lang] || msgs.en;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getCelebrationMsg(name, amount, lang) {
  const firstName = name?.split(' ')[0] || 'Friend';
  const msgs = {
    en: `🎉 Amazing, ${firstName}! Your ₹${amount} donation just changed lives! You're a hero! ❤️`,
    ta: `🎉 அருமை, ${firstName}! உங்கள் ₹${amount} நன்கொடை வாழ்க்கைகளை மாற்றியது! நீங்கள் ஒரு ஹீரோ! ❤️`,
    hi: `🎉 शानदार, ${firstName}! आपके ₹${amount} के दान ने जीवन बदल दिया! आप एक नायक हैं! ❤️`,
    te: `🎉 అద్భుతం, ${firstName}! మీ ₹${amount} విరాళం జీవితాలు మార్చింది! మీరు హీరో! ❤️`,
    ml: `🎉 അടിപൊളി, ${firstName}! നിങ്ങളുടെ ₹${amount} സംഭാവന ജീവിതങ്ങൾ മാറ്റി! ❤️`,
    kn: `🎉 ಅದ್ಭುತ, ${firstName}! ನಿಮ್ಮ ₹${amount} ದೇಣಿಗೆ ಜೀವನ ಬದಲಾಯಿಸಿತು! ❤️`,
  };
  return msgs[lang] || msgs.en;
}

/* ─── Floating Particle ─────────────────────────────────────── */
function Particle({ emoji, style }) {
  return (
    <motion.div
      style={{ position: 'absolute', fontSize: 18, pointerEvents: 'none', ...style }}
      animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {emoji}
    </motion.div>
  );
}

/* ─── Main Companion ────────────────────────────────────────── */
export default function AICompanion({ mode = 'idle', donationAmount = null }) {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [open, setOpen]         = useState(false);
  const [message, setMessage]   = useState('');
  const [typing, setTyping]     = useState(false);
  const [input, setInput]       = useState('');
  const [msgs, setMsgs]         = useState([]);
  const [celebrating, setCelebrating] = useState(false);
  const bottomRef = useRef(null);

  const avatar = AVATARS[getAvatarIndex(user?.userId)];
  const displayName = user?.fullName?.split(' ')[0] || 'Friend';

  /* greeting on mount */
  useEffect(() => {
    if (!user) return;
    const greeting = getGreeting(user.fullName, lang);
    setMessage(greeting);
    setMsgs([{ from: 'bot', text: greeting }]);
  }, [user, lang]);

  /* celebrate donation */
  useEffect(() => {
    if (mode === 'celebrate' && donationAmount) {
      const msg = getCelebrationMsg(user?.fullName, donationAmount, lang);
      setCelebrating(true);
      setMessage(msg);
      setMsgs(p => [...p, { from: 'bot', text: msg, celebrate: true }]);
      setOpen(true);
      setTimeout(() => setCelebrating(false), 4000);
    }
  }, [mode, donationAmount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMsgs(p => [...p, { from: 'user', text: userMsg }]);
    setTyping(true);

    try {
      const r = await axiosInstance.post('/api/language/translate', {
        text: userMsg,
        language: lang === 'en' ? 'en' : lang,
      });
      const response = r.data?.data?.translated || buildLocalResponse(userMsg, lang, user);
      setMsgs(p => [...p, { from: 'bot', text: response }]);
    } catch {
      const response = buildLocalResponse(userMsg, lang, user);
      setMsgs(p => [...p, { from: 'bot', text: response }]);
    } finally {
      setTyping(false);
    }
  }, [input, lang, user]);

  if (!user) return null;

  return (
    <>
      {/* FAB */}
      <motion.button
        className="companion-fab"
        onClick={() => setOpen(p => !p)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={celebrating ? {
          scale: [1, 1.3, 1, 1.3, 1],
          rotate: [0, -10, 10, -10, 0],
        } : { scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ background: avatar.bg }}
        aria-label="AI Companion"
      >
        <span style={{ fontSize: 26 }}>{avatar.emoji}</span>
        {/* unread dot */}
        {!open && (
          <motion.div
            className="companion-dot"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="companion-window"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Header */}
            <div className="companion-header" style={{ background: avatar.bg }}>
              {celebrating && (
                <>
                  <Particle emoji="🎉" style={{ top: 5, left: '20%' }} />
                  <Particle emoji="⭐" style={{ top: 8, left: '60%' }} />
                  <Particle emoji="💜" style={{ top: 3, right: 60 }} />
                </>
              )}
              <motion.div
                className="companion-avatar"
                animate={celebrating
                  ? { rotate: [0, -15, 15, -15, 0], scale: [1, 1.2, 1] }
                  : { y: [0, -4, 0] }}
                transition={{ duration: celebrating ? 0.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {avatar.emoji}
              </motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{displayName}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  {celebrating ? '🎊 Celebrating with you!' : '● AI Companion • Online'}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="companion-close">✕</button>
            </div>

            {/* Messages */}
            <div className="companion-messages">
              {msgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.from === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className={`chat-bubble ${m.from}`} style={{
                    background: m.celebrate
                      ? 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(239,68,68,0.15))'
                      : undefined,
                    border: m.celebrate ? '1px solid rgba(245,158,11,0.4)' : undefined,
                  }}>
                    {m.celebrate && <div style={{ fontSize: 20, marginBottom: 4 }}>🎊</div>}
                    <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{m.text}</p>
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="chat-bubble bot">
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i}
                        style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary-light)' }}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            <div className="companion-suggestions">
              {getSuggestions(lang).map(s => (
                <button key={s} onClick={() => { setInput(s); }} className="suggestion-chip">{s}</button>
              ))}
            </div>

            {/* Input */}
            <div className="companion-input">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={lang === 'ta' ? 'என்னையும் கேளுங்கள்…' : lang === 'hi' ? 'कुछ भी पूछें…' : 'Ask me anything…'}
                maxLength={200}
              />
              <motion.button
                onClick={sendMessage}
                disabled={!input.trim()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ background: avatar.bg }}
              >
                ➤
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function getSuggestions(lang) {
  const s = {
    en: ['How to donate?', 'Show campaigns', 'My donations', 'Need help'],
    ta: ['எப்படி நன்கொடை?', 'பிரச்சாரங்கள்', 'என் நன்கொடைகள்'],
    hi: ['दान कैसे करें?', 'अभियान दिखाएं', 'मेरे दान'],
    te: ['విరాళం ఎలా?', 'ప్రచారాలు', 'నా విరాళాలు'],
    ml: ['സംഭാവന ചെയ്യൂ?', 'കാമ്പെയ്‌നുകൾ', 'എന്റെ സംഭാവനകൾ'],
    kn: ['ದೇಣಿಗೆ ಹೇಗೆ?', 'ಅಭಿಯಾನಗಳು', 'ನನ್ನ ದೇಣಿಗೆಗಳು'],
  };
  return s[lang] || s.en;
}

function buildLocalResponse(text, lang, user) {
  const lower = text.toLowerCase();
  const name = user?.fullName?.split(' ')[0] || 'Friend';
  if (lower.includes('donat') || lower.includes('நன்கொடை') || lower.includes('दान') || lower.includes('విరాళం') || lower.includes('സംഭാവന') || lower.includes('ದೇಣಿಗೆ')) {
    return lang === 'ta'
      ? `நன்கொடை செய்ய:\n1. பிரச்சாரங்கள் பக்கத்திற்கு செல்லுங்கள்\n2. "நன்கொடை 💜" என்பதை கிளிக் செய்யுங்கள்\n3. தொகையை தேர்ந்தெடுங்கள்\n4. கட்டணம் செய்யுங்கள்`
      : lang === 'hi'
      ? `दान करने के लिए:\n1. अभियान पृष्ठ पर जाएं\n2. "दान करें 💜" पर क्लिक करें\n3. राशि चुनें\n4. भुगतान करें`
      : `To donate:\n1. Browse Campaigns\n2. Click "Donate 💜"\n3. Choose amount\n4. Complete payment\n\nAll donations qualify for 80G tax deduction! ✅`;
  }
  if (lower.includes('campaign') || lower.includes('பிரச்சார') || lower.includes('अभियान')) {
    return lang === 'ta'
      ? `நாங்கள் பல வகை பிரச்சாரங்களை நடத்துகிறோம்:\n💧 தண்ணீர் & சுகாதாரம்\n📚 கல்வி\n🏥 சுகாதாரம்\n🍱 உணவு`
      : `We have active campaigns in:\n💧 Water & Sanitation\n📚 Education\n🏥 Healthcare\n🍱 Food & Nutrition\n🌱 Environment\n\nVisit /campaigns to explore! 🎯`;
  }
  return lang === 'ta'
    ? `வணக்கம் ${name}! 💜 நான் உங்களுக்கு நன்கொடை, பிரச்சாரங்கள் மற்றும் கணக்கு பற்றி உதவலாம்.`
    : lang === 'hi'
    ? `नमस्ते ${name}! 💜 मैं दान, अभियान और खाते के बारे में मदद कर सकता हूं।`
    : `Hi ${name}! 💜 I can help with donations, campaigns, your account, and more. What would you like to know?`;
}
