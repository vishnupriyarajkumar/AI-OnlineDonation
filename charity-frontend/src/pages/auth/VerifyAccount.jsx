import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { verifyAccount, resendOtp } from '../../api/authService';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const OTP_LENGTH = 6;

/**
 * One-time account verification page.
 * Only shown after registration — never during login.
 * After successful verification, user is immediately logged in.
 */
export default function VerifyAccount() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, pendingVerification, clearPendingVerification } = useAuth();
  const { t } = useLanguage();

  const email = location.state?.email || pendingVerification || '';
  const method = location.state?.method || (email.includes('@') ? 'EMAIL' : 'MOBILE');
  const isPhone = method === 'MOBILE' || !email.includes('@');
  const channelLabel = isPhone ? 'mobile number' : 'email';

  const [digits,    setDigits]    = useState(Array(OTP_LENGTH).fill(''));
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(location.state?.cooldown || 30);
  const [attempts,  setAttempts]  = useState(0);
  const [error,     setError]     = useState('');
  const [shake,     setShake]     = useState(false);
  const [verified,  setVerified]  = useState(false);

  const inputRefs = useRef([]);

  // Redirect if arrived here without context
  useEffect(() => {
    if (!email) navigate('/register', { replace: true });
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Focus first box
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (digit && index === OTP_LENGTH - 1) {
      const full = next.join('');
      if (full.length === OTP_LENGTH) setTimeout(() => submit(full), 80);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits]; next[index - 1] = ''; setDigits(next);
      }
    } else if (e.key === 'ArrowLeft'  && index > 0)            inputRefs.current[index - 1]?.focus();
    else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) setTimeout(() => submit(pasted), 80);
  };

  const submit = async (otp = digits.join('')) => {
    if (otp.length < OTP_LENGTH) { setError('Please enter all 6 digits'); triggerShake(); return; }
    setLoading(true);
    setError('');
    try {
      const data = await verifyAccount(email, otp);
      setVerified(true);
      login(data);
      toast.success(`Account verified! Welcome, ${data.fullName?.split(' ')[0]}! 🎉`, { duration: 4000 });
      // First-ever login → show onboarding
      setTimeout(() => navigate(
        data.role === 'ADMIN' ? '/admin' : '/onboarding',
        { replace: true }
      ), 800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid code. Please try again.';
      setError(msg);
      setAttempts(a => a + 1);
      triggerShake();
      toast.error(msg);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const data = await resendOtp(email);
      setCountdown(data?.resendCooldownSeconds || 30);
      setDigits(Array(OTP_LENGTH).fill(''));
      setError('');
      setAttempts(0);
      inputRefs.current[0]?.focus();
      toast.success(`New verification code sent to your ${channelLabel}!`, { icon: isPhone ? '📱' : '📧' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend code');
    } finally { setResending(false); }
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };
  const filled       = digits.filter(Boolean).length;
  const isComplete   = filled === OTP_LENGTH;

  if (verified) {
    return (
      <div className="auth-wrapper" style={{ minHeight: '100vh' }}>
        <div className="auth-card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="card" style={{ padding: 48 }}>
            <div style={{ fontSize: 72, marginBottom: 16, animation: 'bounce 0.6s ease' }}>✅</div>
            <h2 className="gradient-text" style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>{t('accountVerified') || 'Account Verified!'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('redirectingToDashboard') || 'Redirecting you to your dashboard…'}</p>
            <div className="spinner" style={{ margin: '20px auto 0' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(108,60,232,0.25) 0%, transparent 60%)' }} />

      <div className="auth-card" style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
        {/* Back */}
        <button onClick={() => { clearPendingVerification(); navigate('/register'); }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '6px 0' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-light)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          {t('backToRegister') || '← Back to Register'}
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(108,60,232,0.2), rgba(139,92,246,0.15))', border: '2px solid rgba(108,60,232,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            {isPhone ? '📱' : '📧'}
          </div>
          <h1 className="auth-title gradient-text" style={{ fontSize: 28 }}>
            {isPhone ? (t('verifyYourMobile') || 'Verify Your Mobile') : (t('verifyYourEmail') || 'Verify Your Email')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            {(t('enterCodeSentToChannel') || 'Enter the 6-digit code sent to your') + ' ' + (isPhone ? (t('mobileNumber') || 'mobile number') : (t('emailAddress') || 'email'))}
          </p>
          <p style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: 15, marginTop: 6, background: 'rgba(108,60,232,0.1)', display: 'inline-block', padding: '4px 18px', borderRadius: 99, border: '1px solid rgba(108,60,232,0.25)' }}>
            {email}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 10, background: 'rgba(16,185,129,0.08)', padding: '6px 14px', borderRadius: 8, display: 'inline-block', border: '1px solid rgba(16,185,129,0.2)' }}>
            ✅ {t('verificationRequiredOnce') || 'This verification is required only once'}
          </p>
        </div>

        {/* Email delivery notice */}
        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 4, fontSize: 13 }}>
          <p style={{ color: '#93c5fd', margin: 0, lineHeight: 1.6 }}>
            📧 <strong>Check your inbox</strong> at <span style={{ color: '#a78bfa' }}>{email}</span> for the verification code.
          </p>
          <p style={{ color: '#6b7280', margin: '6px 0 0', fontSize: 12 }}>
            ⚠️ If the email doesn't arrive within 1 minute, check your <strong>Spam / Junk</strong> folder. The code is also printed in the backend terminal for testing.
          </p>
        </div>

        <div className="card" style={{ padding: '32px 36px' }}>
          {/* OTP boxes */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 8, animation: shake ? 'shake 0.5s ease' : 'none' }} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input key={i} ref={el => inputRefs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onFocus={e => e.target.select()}
                style={{
                  width: 52, height: 62, textAlign: 'center', fontSize: 26, fontWeight: 800, fontFamily: 'monospace',
                  background: d ? 'rgba(108,60,232,0.15)' : 'rgba(255,255,255,0.04)',
                  border: error ? '2px solid rgba(239,68,68,0.6)' : d ? '2px solid rgba(108,60,232,0.6)' : '1px solid var(--border)',
                  borderRadius: 12, color: 'var(--text)', outline: 'none', transition: 'all 0.2s',
                  boxShadow: d ? '0 0 14px rgba(108,60,232,0.25)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {Array(OTP_LENGTH).fill(0).map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', transition: 'background 0.2s', background: i < filled ? 'var(--primary-light)' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>
              ⚠ {error}
            </div>
          )}

          {attempts > 0 && attempts < 3 && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 14px', marginBottom: 16, color: '#fcd34d', fontSize: 12, textAlign: 'center' }}>
              ⚡ {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining
            </div>
          )}

          <button onClick={() => submit()} className="btn btn-primary w-full" disabled={loading || !isComplete}
            style={{ justifyContent: 'center', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 10, marginBottom: 20 }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                {t('verifying') || 'Verifying…'}
              </span>
            ) : isComplete ? (t('verifyActivateAccount') || '✓ Verify & Activate Account') : `${t('enterMoreDigits') || 'Enter'} ${OTP_LENGTH - filled} ${t('moreDigits') || 'more digits'}`}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{t('didNotReceiveCode') || "Didn't receive the code?"}</p>
            {countdown > 0 ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 99, padding: '8px 20px' }}>
                <svg width="28" height="28" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                  <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  <circle cx="14" cy="14" r="11" fill="none" stroke="var(--primary-light)" strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 11}`}
                    strokeDashoffset={`${2 * Math.PI * 11 * (1 - countdown / 30)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('resendIn') || 'Resend in'} {countdown}s</span>
              </div>
            ) : (
              <button onClick={handleResend} disabled={resending}
                style={{ background: 'none', border: '1px solid var(--primary-light)', color: 'var(--primary-light)', borderRadius: 99, padding: '8px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,60,232,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                {resending ? (t('sending') || 'Sending…') : (t('resendCode') || '↺ Resend Code')}
              </button>
            )}
          </div>
        </div>

        {/* Info strip */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <span>{t('expiresIn5Min') || '⏱ Expires in 5 min'}</span>
          <span>{t('max3Attempts') || '🔄 Max 3 attempts'}</span>
          <span>{t('oneTimeOnly') || '🔑 One-time only'}</span>
        </div>
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-6px)} 60%{transform:translateX(6px)} 75%{transform:translateX(-4px)} 90%{transform:translateX(4px)} }
        @keyframes bounce { 0%{transform:scale(0.3)} 60%{transform:scale(1.1)} 80%{transform:scale(0.9)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  );
}
