import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COMMANDS = [
  { patterns: ['dashboard', 'home'],              action: 'NAV', target: '/',           label: 'Going to Home' },
  { patterns: ['my dashboard', 'user dashboard'], action: 'NAV', target: '/user',       label: 'Opening Dashboard' },
  { patterns: ['campaigns', 'donate'],            action: 'NAV', target: '/campaigns',  label: 'Showing Campaigns' },
  { patterns: ['my donations', 'donation history'],action:'NAV', target: '/user/donations', label: 'Showing Donations' },
  { patterns: ['profile', 'my profile'],          action: 'NAV', target: '/user/profile',   label: 'Opening Profile' },
  { patterns: ['leaderboard', 'rankings'],        action: 'NAV', target: '/user/leaderboard',label: 'Opening Leaderboard'},
  { patterns: ['admin'],                          action: 'NAV', target: '/admin',       label: 'Opening Admin Panel' },
  { patterns: ['about'],                          action: 'NAV', target: '/about',       label: 'Going to About' },
  { patterns: ['contact'],                        action: 'NAV', target: '/contact',     label: 'Opening Contact' },
  { patterns: ['tamil', 'தமிழ்'],                action: 'LANG', target: 'ta',          label: 'Switching to Tamil' },
  { patterns: ['hindi', 'हिंदी'],               action: 'LANG', target: 'hi',          label: 'Switching to Hindi' },
  { patterns: ['english'],                        action: 'LANG', target: 'en',          label: 'Switching to English' },
  { patterns: ['telugu', 'తెలుగు'],             action: 'LANG', target: 'te',          label: 'Switching to Telugu' },
  { patterns: ['malayalam', 'മലയാളം'],          action: 'LANG', target: 'ml',          label: 'Switching to Malayalam' },
  { patterns: ['kannada', 'ಕನ್ನಡ'],            action: 'LANG', target: 'kn',          label: 'Switching to Kannada' },
];

const HELP_PHRASES = [
  'Open Dashboard', 'Show Campaigns', 'My Donations',
  'Open Profile', 'Switch to Tamil', 'Admin Panel',
];

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const { changeLanguage, lang } = useLanguage();
  const { user } = useAuth();

  const [listening,  setListening]  = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result,     setResult]     = useState('');
  const [open,       setOpen]       = useState(false);
  const [supported,  setSupported]  = useState(true);

  const recognitionRef = useRef(null);
  const timeoutRef     = useRef(null);

  /* ── Check browser support ──────────────────────────── */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' :
               lang === 'te' ? 'te-IN' : lang === 'ml' ? 'ml-IN' :
               lang === 'kn' ? 'kn-IN' : 'en-IN';

    rec.onresult = (e) => {
      const interim = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(interim);
    };

    rec.onend = () => {
      setListening(false);
      if (transcript) processCommand(transcript);
    };

    rec.onerror = (e) => {
      setListening(false);
      if (e.error !== 'no-speech') {
        setResult('⚠️ Could not hear you. Please try again.');
      }
    };

    recognitionRef.current = rec;
  }, [lang, transcript]);

  const startListening = useCallback(() => {
    if (!supported || listening) return;
    setTranscript('');
    setResult('');
    setListening(true);
    try {
      recognitionRef.current?.start();
    } catch {}
    // Auto-stop after 8 seconds
    timeoutRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
      setListening(false);
    }, 8000);
  }, [supported, listening]);

  const stopListening = useCallback(() => {
    clearTimeout(timeoutRef.current);
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  /* ── Process voice command ──────────────────────────── */
  const processCommand = useCallback((text) => {
    const lower = text.toLowerCase().trim();
    let matched = false;

    for (const cmd of COMMANDS) {
      if (cmd.patterns.some(p => lower.includes(p.toLowerCase()))) {
        matched = true;
        setResult(`✅ ${cmd.label}`);
        speak(cmd.label, lang);
        if (cmd.action === 'NAV') {
          setTimeout(() => { navigate(cmd.target); setOpen(false); }, 800);
        } else if (cmd.action === 'LANG') {
          changeLanguage(cmd.target);
        }
        break;
      }
    }

    if (!matched) {
      setResult(`🤔 Command not recognized. Try: "Show Campaigns" or "Open Dashboard"`);
      speak('Command not recognized. Please try again.', lang);
    }
  }, [navigate, changeLanguage, lang]);

  /* ── Text-to-speech ─────────────────────────────────── */
  function speak(text, language) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utt.rate = 1.1;
    window.speechSynthesis.speak(utt);
  }

  if (!user) return null;

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(p => !p)}
        className="voice-fab"
        style={{
          position: 'fixed', bottom: 104, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: listening
            ? 'linear-gradient(135deg,#ef4444,#dc2626)'
            : 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: listening
            ? '0 0 0 8px rgba(239,68,68,0.2), 0 4px 20px rgba(239,68,68,0.4)'
            : '0 4px 20px rgba(14,165,233,0.3)',
        }}
        animate={listening ? { scale: [1,1.15,1] } : { scale: 1 }}
        transition={{ repeat: listening ? Infinity : 0, duration: 0.8 }}
        whileHover={{ scale: 1.1 }}
        aria-label="Voice Assistant"
      >
        <span style={{ fontSize: 22 }}>{listening ? '🔴' : '🎤'}</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed', bottom: 168, right: 24, zIndex: 1001,
              width: 320, background: 'var(--bg-glass)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(14,165,233,0.25)',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
              background: 'linear-gradient(135deg,rgba(14,165,233,0.2),rgba(56,189,248,0.1))',
              borderBottom: '1px solid rgba(14,165,233,0.15)',
            }}>
              <span style={{ fontSize: 24 }}>🎙️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Voice Assistant</div>
                <div style={{ fontSize: 11, color: '#38bdf8' }}>
                  {supported ? (listening ? '● Listening…' : '○ Ready') : '⚠ Not supported'}
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Transcript */}
            <div style={{ padding: '16px 20px', minHeight: 80 }}>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    padding: '10px 14px', background: 'rgba(14,165,233,0.1)',
                    border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12,
                    fontSize: 13, marginBottom: 8, fontStyle: 'italic',
                  }}
                >
                  "{transcript}"
                </motion.div>
              )}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '10px 14px', background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12,
                    fontSize: 13, color: '#34d399',
                  }}
                >
                  {result}
                </motion.div>
              )}
              {!transcript && !result && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                  {supported ? 'Tap the mic and speak a command' : 'Your browser does not support voice recognition'}
                </p>
              )}
            </div>

            {/* Quick commands */}
            <div style={{ padding: '0 20px 12px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Try saying:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {HELP_PHRASES.map(p => (
                  <button key={p} onClick={() => processCommand(p)}
                    style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 99,
                      background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)',
                      color: '#38bdf8', cursor: 'pointer',
                    }}
                  >{p}</button>
                ))}
              </div>
            </div>

            {/* Mic Button */}
            <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 8 }}>
              <motion.button
                onClick={listening ? stopListening : startListening}
                disabled={!supported}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                  cursor: supported ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14,
                  background: listening
                    ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                    : 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
                  color: '#fff',
                }}
                whileHover={supported ? { scale: 1.02 } : {}}
                whileTap={supported ? { scale: 0.97 } : {}}
              >
                {listening ? '⏹ Stop' : '🎤 Start Listening'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
