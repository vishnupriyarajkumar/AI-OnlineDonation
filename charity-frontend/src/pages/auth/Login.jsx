import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as loginApi } from '../../api/authService';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

export default function Login() {
  const { user, login, setPendingVerification } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const emailRef = useRef(null);

  // Already logged in → redirect
  useEffect(() => {
    if (user) navigate(user.role === 'ADMIN' ? '/admin' : '/user', { replace: true });
  }, [user, navigate]);

  // Restore remembered email
  useEffect(() => {
    const saved = localStorage.getItem('remembered_email');
    if (saved) { setEmail(saved); setRemember(true); }
    emailRef.current?.focus();
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email    = t('emailRequired') || 'Email is required';
    if (!password)     e.password = t('passwordRequired') || 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      if (remember) localStorage.setItem('remembered_email', email);
      else          localStorage.removeItem('remembered_email');

      const data = await loginApi(email, password, remember);

      // Account not yet verified — redirect to verification page
      if (data?.needsVerification) {
        setPendingVerification(email);
        toast('Please verify your email first.', { icon: '📧' });
        navigate('/verify-account', {
          state: { email, cooldown: data.resendCooldownSeconds },
        });
        return;
      }

      // Verified — JWT returned directly, log in immediately
      login(data);
      toast.success(`Welcome back, ${data.fullName?.split(' ')[0]}! 🎉`);
      // First login → show subscription onboarding
      if (data.isFirstLogin) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(data.role === 'ADMIN' ? '/admin' : '/user', { replace: true });
      }

    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg, { duration: 5000 });
      if (msg.toLowerCase().includes('locked')) {
        setErrors({ general: msg });
      } else if (msg.toLowerCase().includes('no account') || msg.toLowerCase().includes('not found')) {
        setErrors({ general: msg + ' → Click "Create Free Account" below.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 30% 20%, rgba(108,60,232,0.3) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(16,185,129,0.15) 0%, transparent 50%)',
      }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(108,60,232,0.06)', top: -100, right: -100, animation: 'float 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(16,185,129,0.06)', bottom: -80, left: -80, animation: 'float 10s ease-in-out infinite reverse' }} />

      <div className="auth-card" style={{ position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(108,60,232,0.12)', border: '1px solid rgba(108,60,232,0.3)',
            borderRadius: 99, padding: '6px 16px', fontSize: 13, color: 'var(--primary-light)', marginBottom: 16,
          }}>
            🔐 Secure Login
          </div>
          <div style={{ fontSize: 56, marginBottom: 8, lineHeight: 1 }}>💜</div>
          <h1 className="auth-title gradient-text" style={{ fontSize: 32 }}>{t('welcomeBack')}</h1>
          <p className="auth-subtitle">{t('signInToAccount') || 'Sign in to your CharityOrg account'}</p>
        </div>

        <div className="card" style={{ padding: '36px 40px' }}>
          {errors.general && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#fca5a5', fontSize: 13 }}>
              🔒 {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>{t('emailAddress')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', opacity: 0.5 }}>✉️</span>
                <input
                  ref={emailRef} type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  placeholder="you@example.com" className="form-control"
                  style={{ paddingLeft: 42, ...(errors.email && { borderColor: '#ef4444' }) }}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', opacity: 0.5 }}>🔑</span>
                <input
                  type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                  placeholder="Your password" className="form-control"
                  style={{ paddingLeft: 42, paddingRight: 48, ...(errors.password && { borderColor: '#ef4444' }) }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, opacity: 0.6 }}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.password}</p>}
            </div>

            {/* Remember me + Forgot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} />
                {t('rememberMe')} <span style={{ fontSize: 11, opacity: 0.6 }}>(30 {t('days') || 'days'})</span>
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary-light)', fontWeight: 500 }}>
                {t('forgotPassword')}
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary w-full" disabled={loading}
              style={{ justifyContent: 'center', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 10 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  {t('signingIn') || 'Signing in…'}
                </span>
              ) : `${t('signIn')} →`}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>NEW TO CHARITYORG?</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <Link to="/register" className="btn btn-secondary w-full" style={{ justifyContent: 'center', padding: '12px', fontSize: 14 }}>
            {t('createFreeAccount') || 'Create Free Account'} 🚀
          </Link>
        </div>

        {/* Security badges */}
        <div style={{ marginTop: 16, padding: '12px 20px', textAlign: 'center', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <span>🔒 BCrypt Encrypted</span><span style={{ opacity: 0.3 }}>|</span>
          <span>🛡️ JWT Auth</span><span style={{ opacity: 0.3 }}>|</span>
          <span>⏰ 30-day Remember Me</span>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
      `}</style>
    </div>
  );
}
