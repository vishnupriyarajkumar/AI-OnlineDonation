import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { verifyOtp, resendOtp } from '../../api/authService';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const OTP_LENGTH = 6;

export default function VerifyOtp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, otpPending, clearOtpPending } = useAuth();
  const { t } = useLanguage();

  // Email comes from navigation state or context
  const email = location.state?.email || otpPending || '';

  const [digits, setDigits]       = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(location.state?.cooldown || 30);
  const [attempts, setAttempts]   = useState(0);
  const [error, setError]         = useState('');
  const [shake, setShake]         = useState(false);

  const inputRefs = useRef([]);

  // Redirect if no email context
  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  // OTP resend countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus first box
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigit = (index, value) => {
    // Accept only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = [...next].join('');
      if (fullOtp.length === OTP_LENGTH) {
        setTimeout(() => handleVerify(fullOtp), 80);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    // Focus last filled box
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) {
      setTimeout(() => handleVerify(pasted), 80);
    }
  };

  const handleVerify = async (otp = digits.join('')) => {
    if (otp.length < OTP_LENGTH) {
      setError('Please enter all 6 digits');
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');

    try {
      const data = await verifyOtp(email, otp);
      login(data);
      toast.success(`Welcome back, ${data.fullName?.split(' ')[0]}! 🎉`);
      navigate(data.role === 'ADMIN' ? '/admin' : '/user', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(msg);
      setAttempts(a => a + 1);
      triggerShake();
      toast.error(msg);
      // Clear digits on error
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
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
      toast.success('New OTP sent to your email!', { icon: '📧' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend OTP');
    } finally {
      setResending(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleBack = () => {
    clearOtpPending();
    navigate('/login');
  };

  const filled = digits.filter(Boolean).length;
  const isComplete = filled === OTP_LENGTH;

  return (
    <div className="auth-wrapper" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(108,60,232,0.25) 0%, transparent 60%)',
      }} />

      <div className="auth-card" style={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
        {/* Back button */}
        <button
          onClick={handleBack}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center',
            gap: 6, marginBottom: 20, padding: '6px 0', transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--primary-light)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >
          {t('backToLogin') || '← Back to Login'}
        </button>

        {/* Icon + Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(108,60,232,0.2), rgba(139,92,246,0.15))',
            border: '2px solid rgba(108,60,232,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, animation: 'pulse-ring 2s ease-in-out infinite',
          }}>
            📱
          </div>
          <h1 className="auth-title gradient-text" style={{ fontSize: 28 }}>{t('verifyYourIdentity') || 'Verify Your Identity'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            {t('weSentCodeTo') || 'We sent a 6-digit code to'}
          </p>
          <p style={{
            color: 'var(--primary-light)', fontWeight: 700, fontSize: 15, marginTop: 4,
            background: 'rgba(108,60,232,0.1)', display: 'inline-block',
            padding: '4px 16px', borderRadius: 99, border: '1px solid rgba(108,60,232,0.25)',
          }}>
            {email}
          </p>
        </div>

        <div className="card" style={{ padding: '32px 36px' }}>
          {/* OTP digit boxes */}
          <div
            style={{
              display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 8,
              animation: shake ? 'shake 0.5s ease' : 'none',
            }}
            onPaste={handlePaste}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onFocus={e => e.target.select()}
                style={{
                  width: 52, height: 60, textAlign: 'center',
                  fontSize: 24, fontWeight: 800, fontFamily: 'monospace',
                  background: d
                    ? 'rgba(108,60,232,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  border: error
                    ? '2px solid rgba(239,68,68,0.6)'
                    : d
                    ? '2px solid rgba(108,60,232,0.6)'
                    : '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'all 0.2s',
                  caretColor: 'var(--primary-light)',
                  boxShadow: d ? '0 0 12px rgba(108,60,232,0.2)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {Array(OTP_LENGTH).fill(0).map((_, i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: i < filled ? 'var(--primary-light)' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: '#fca5a5', fontSize: 13, textAlign: 'center',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Attempts warning */}
          {attempts > 0 && attempts < 3 && (
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8, padding: '8px 14px', marginBottom: 16,
              color: '#fcd34d', fontSize: 12, textAlign: 'center',
            }}>
              ⚡ {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining
            </div>
          )}

          {/* Verify button */}
          <button
            onClick={() => handleVerify()}
            className="btn btn-primary w-full"
            disabled={loading || !isComplete}
            style={{ justifyContent: 'center', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 10, marginBottom: 20 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                  display: 'inline-block',
                }} />
                {t('verifying') || 'Verifying…'}
              </span>
            ) : (
              isComplete ? (t('verifySignIn') || '✓ Verify & Sign In') : `${t('enterMoreDigits') || 'Enter'} ${OTP_LENGTH - filled} ${t('moreDigits') || 'more digits'}`
            )}
          </button>

          {/* Resend section */}
          <div style={{ textAlign: 'center' }}>
            {countdown > 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {t('didNotReceiveCode') || "Didn't receive the code?"}
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 99, padding: '8px 20px',
                }}>
                  {/* Circular countdown */}
                  <div style={{ position: 'relative', width: 28, height: 28 }}>
                    <svg width="28" height="28" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                      <circle cx="14" cy="14" r="11" fill="none"
                        stroke="var(--primary-light)" strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 11}`}
                        strokeDashoffset={`${2 * Math.PI * 11 * (1 - countdown / 30)}`}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                      />
                    </svg>
                    <span style={{
                      position: 'absolute', inset: 0, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: 'var(--primary-light)',
                    }}>
                      {countdown}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {t('resendIn') || 'Resend in'} {countdown}s
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {t('didNotReceiveCode') || "Didn't receive the code?"}
                </p>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{
                    background: 'none', border: '1px solid var(--primary-light)',
                    color: 'var(--primary-light)', borderRadius: 99, padding: '8px 24px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.target.style.background = 'rgba(108,60,232,0.15)'; }}
                  onMouseLeave={e => { e.target.style.background = 'none'; }}
                >
                  {resending ? (t('sending') || 'Sending…') : (t('resendOtp') || '↺ Resend OTP')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
          borderRadius: 10, fontSize: 12, color: 'var(--text-muted)',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center',
        }}>
          <span>{t('expiresIn5Min') || '⏱ Expires in 5 min'}</span>
          <span>{t('max3Attempts') || '🔄 Max 3 attempts'}</span>
          <span>{t('checkYourInbox') || '📧 Check your inbox'}</span>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(108,60,232,0.2); }
          50% { box-shadow: 0 0 0 12px rgba(108,60,232,0); }
        }
      `}</style>
    </div>
  );
}
