import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { login as loginApi } from '../../api/authService';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';
import InfinityRibbon from '../../components/InfinityRibbon';

const PARTICLES = [
  { emoji: '💜', x: 5,  y: 15, d: 0   }, { emoji: '🌟', x: 90, y: 10, d: 0.8 },
  { emoji: '❤️', x: 8,  y: 80, d: 1.5 }, { emoji: '✨', x: 88, y: 75, d: 2.2 },
  { emoji: '🎯', x: 50, y: 5,  d: 1   }, { emoji: '🌍', x: 75, y: 90, d: 0.5 },
];

export default function Login() {
  const { user, login, setPendingVerification } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const emailRef = useRef(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (user.role === 'NGO') navigate('/ngo', { replace: true });
      else navigate('/user', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const saved = localStorage.getItem('remembered_email');
    if (saved) { setEmail(saved); setRemember(true); }
    emailRef.current?.focus();
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email    = t('auth.email') + ' is required';
    if (!password)     e.password = t('auth.password') + ' is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (remember) localStorage.setItem('remembered_email', email);
      else          localStorage.removeItem('remembered_email');
      const data = await loginApi(email, password, remember);
      if (data?.needsVerification) {
        setPendingVerification(email);
        toast('Please verify your email first.', { icon: '📧' });
        navigate('/verify-account', { state: { email, cooldown: data.resendCooldownSeconds } });
        return;
      }
      login(data);
      toast.success(`Welcome back, ${data.fullName?.split(' ')[0]}! 🎉`);
      const target = data.isFirstLogin ? '/onboarding' :
        (data.role === 'ADMIN' ? '/admin' : (data.role === 'NGO' ? '/ngo' : '/user'));
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg, { duration: 5000 });
      if (msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('no account')) {
        setErrors({ general: msg });
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      {/* Animated bg */}
      <motion.div
        style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(108,60,232,0.35) 0%, transparent 60%)' }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', bottom: -150, right: -100, zIndex: 0 }}
        animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
      />
      {PARTICLES.map((p, i) => (
        <motion.div key={i}
          style={{ position: 'fixed', left: `${p.x}%`, top: `${p.y}%`, fontSize: 20, zIndex: 0, pointerEvents: 'none' }}
          animate={{ y: [0, -18, 0], opacity: [0.4, 0.8, 0.4], rotate: [-5, 5, -5] }}
          transition={{ duration: 4 + p.d, repeat: Infinity, delay: p.d }}
        >{p.emoji}</motion.div>
      ))}

      {/* Card */}
      <motion.div
        style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(108,60,232,0.12)', border: '1px solid rgba(108,60,232,0.3)', borderRadius: 99, padding: '6px 16px', fontSize: 13, color: 'var(--primary-light)', marginBottom: 16 }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            🔐 Secure Login
          </motion.div>
          <motion.div
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
          >
            <InfinityRibbon size={90} />
          </motion.div>
          <motion.h1
            className="auth-title gradient-text"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          >
            {t('auth.welcomeBack') || 'Welcome Back'}
          </motion.h1>
          <motion.p className="auth-subtitle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          >
            {t('auth.signInTo') || 'Sign in to your account'}
          </motion.p>
        </div>

        <motion.div
          className="glass-card"
          style={{ padding: '36px 40px' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#fca5a5', fontSize: 13 }}
              >
                🔒 {errors.general}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <motion.div className="form-group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <label className="form-label">{t('auth.emailOrMobile') || 'Email or Mobile'}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>✉️</span>
                <input
                  ref={emailRef} type="text" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  placeholder="you@example.com or 9876543210"
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  style={{ paddingLeft: 42 }} autoComplete="username"
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div className="form-group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <label className="form-label">{t('auth.password') || 'Password'}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔑</span>
                <input
                  type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                  placeholder="Your password"
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: 42, paddingRight: 48 }} autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: 0.6 }}
                  aria-label="Toggle password">{showPwd ? '🙈' : '👁️'}</button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} />
                {t('auth.rememberMe') || 'Remember me'}
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary-light)', fontWeight: 500 }}>
                {t('auth.forgotPassword') || 'Forgot password?'}
              </Link>
            </motion.div>

            <motion.button
              type="submit"
              className="btn-primary-full"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <motion.span
                    style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }}
                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                  Signing in…
                </span>
              ) : `${t('auth.signIn') || 'Sign In'} →`}
            </motion.button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>NEW HERE?</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <Link to="/register">
            <motion.button
              className="btn-secondary-full"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              {t('auth.registerFree') || 'Create Free Account'} 🚀
            </motion.button>
          </Link>
        </motion.div>

        <motion.div
          style={{ marginTop: 16, padding: '12px 20px', textAlign: 'center', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >
          <span>🔒 BCrypt Encrypted</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>🛡️ JWT Auth</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>⏰ 30-day Session</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
