import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const OTP_LENGTH = 6;
const PWD_REGEX  = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Step 1: Enter email
// Step 2: Enter OTP + new password
// Step 3: Success

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step,      setStep]      = useState(1);
  const [email,     setEmail]     = useState('');
  const [otp,       setOtp]       = useState('');
  const [newPwd,    setNewPwd]    = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [cooldown,  setCooldown]  = useState(0);
  const [resending, setResending] = useState(false);

  // Step 1 — request OTP
  const requestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const r = await axiosInstance.post('/api/auth/forgot-password', { email: email.trim() });
      setCooldown(30);
      const interval = setInterval(() => setCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0; } return c - 1;
      }), 1000);
      setStep(2);
      toast.success(r.data?.message || 'Reset code sent! Check your inbox.', { icon: '📧', duration: 5000 });
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('not verified')) {
        toast.error('Please verify your account first before resetting password.', { duration: 6000 });
      } else if (msg.includes('Please wait')) {
        toast.error(msg);
      } else if (err.response?.status === 400 || err.response?.status === 404) {
        toast.error('No account found with this email. Please register first.');
      } else {
        // Move to step 2 anyway — prevent enumeration on 500 errors
        setStep(2);
        toast('Check your email if an account exists.', { icon: '📧' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP + set new password
  const resetPassword = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) { toast.error('Enter the full 6-digit code'); return; }
    if (!PWD_REGEX.test(newPwd)) {
      toast.error('Password needs 8+ chars with upper, lower, digit & special char');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/reset-password', {
        email: email.trim(),
        otp:   otp.trim(),
        newPassword: newPwd,
      });
      setStep(3);
      toast.success('Password reset successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired code. Please try again.';
      toast.error(msg, { duration: 5000 });
      if (msg.includes('expired') || msg.includes('No OTP')) {
        // Reset to step 1 if OTP expired completely
        setOtp('');
        setCooldown(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await axiosInstance.post('/api/auth/forgot-password', { email: email.trim() });
      setCooldown(30);
      const interval = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; }), 1000);
      toast.success('New code sent!', { icon: '📧' });
    } catch {}
    finally { setResending(false); }
  };

  return (
    <div className="auth-wrapper" style={{ minHeight:'100vh', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 70% 50% at 50% 0%,rgba(108,60,232,0.22) 0%,transparent 60%)' }} />

      <div className="auth-card" style={{ position:'relative', zIndex:1, maxWidth:460 }}>

        {/* Step 1 — Email */}
        {step === 1 && (
          <>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:52, marginBottom:8 }}>🔓</div>
              <h1 className="auth-title gradient-text">{t('forgotPassword') || 'Forgot Password?'}</h1>
              <p className="auth-subtitle">{t('enterRegisteredEmail') || 'Enter your registered email to receive a reset code.'}</p>
            </div>
            <div className="card" style={{ padding:'36px 40px' }}>
              <form onSubmit={requestOtp}>
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:8, display:'block' }}>
                    {t('registeredEmail') || 'Registered Email'}
                  </label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',opacity:0.4 }}>✉️</span>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                      placeholder="you@example.com" className="form-control"
                      style={{ paddingLeft:42 }} autoFocus required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full"
                  disabled={loading} style={{ justifyContent:'center', padding:'14px', fontWeight:700 }}>
                  {loading ? (
                    <span style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} />
                      {t('sending') || 'Sending…'}
                    </span>
                  ) : `${t('sendResetCode') || 'Send Reset Code'} 📧`}
                </button>
              </form>
              <div style={{ textAlign:'center',marginTop:20,fontSize:14 }}>
                <Link to="/login" style={{ color:'var(--primary-light)' }}>{t('backToLogin') || '← Back to Login'}</Link>
              </div>
            </div>
          </>
        )}

        {/* Step 2 — OTP + New Password */}
        {step === 2 && (
          <>
            <button onClick={() => setStep(1)}
              style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',gap:6,marginBottom:20,padding:'6px 0' }}>
              {t('back') || '← Back'}
            </button>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:52, marginBottom:8 }}>🔐</div>
              <h1 className="auth-title gradient-text">{t('resetPassword') || 'Reset Password'}</h1>
              <p style={{ color:'var(--text-muted)',fontSize:14,marginTop:8 }}>
                {t('enterCodeSentTo') || 'Enter the code sent to'} <strong style={{ color:'var(--primary-light)' }}>{email}</strong>
              </p>
            </div>
            <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:13 }}>
              <p style={{ color:'#93c5fd', margin:0, lineHeight:1.6 }}>
                📧 <strong>Check your inbox</strong> at <span style={{ color:'#a78bfa' }}>{email}</span>.
              </p>
              <p style={{ color:'#6b7280', margin:'6px 0 0', fontSize:12 }}>
                ⚠️ Don't see it? Check <strong>Spam / Junk</strong> folder. Also visible in the backend terminal console.
              </p>
            </div>
            <div className="card" style={{ padding:'32px 36px' }}>
              <form onSubmit={resetPassword}>
                {/* OTP input */}
                <div className="form-group">
                  <label style={{ fontSize:13,fontWeight:600,color:'var(--text-muted)',marginBottom:8,display:'block' }}>
                    {t('verificationCode6Digits') || 'Verification Code (6 digits)'}
                  </label>
                  <input className="form-control" type="text" inputMode="numeric"
                    maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}
                    placeholder="e.g. 123456" required
                    style={{ fontSize:24, letterSpacing:12, textAlign:'center', fontFamily:'monospace' }} />
                </div>

                {/* New password */}
                <div className="form-group">
                  <label style={{ fontSize:13,fontWeight:600,color:'var(--text-muted)',marginBottom:8,display:'block' }}>
                    {t('newPassword') || 'New Password'}
                  </label>
                  <div style={{ position:'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} value={newPwd}
                      onChange={e=>setNewPwd(e.target.value)}
                      placeholder="Min 8 chars with upper, lower, digit, special"
                      className="form-control" style={{ paddingRight:48 }} required />
                    <button type="button" onClick={()=>setShowPwd(p=>!p)}
                      style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:18,opacity:0.6 }}>
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <p style={{ fontSize:11,color:'var(--text-muted)',marginTop:4 }}>
                    {t('passwordRequirementInfo') || 'Must include uppercase, lowercase, number and special character'}
                  </p>
                </div>

                <button type="submit" className="btn btn-primary w-full"
                  disabled={loading} style={{ justifyContent:'center',padding:'14px',fontWeight:700,marginBottom:16 }}>
                  {loading ? (
                    <span style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} />
                      {t('resetting') || 'Resetting…'}
                    </span>
                  ) : `✓ ${t('resetPassword') || 'Reset Password'}`}
                </button>

                {/* Resend */}
                <div style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>
                  {t('didNotReceiveCode') || "Didn't receive the code?"}{' '}
                  {cooldown > 0 ? (
                    <span>{t('resendIn') || 'Resend in'} {cooldown}s</span>
                  ) : (
                    <button type="button" onClick={resendOtp} disabled={resending}
                      style={{ background:'none',border:'none',color:'var(--primary-light)',cursor:'pointer',fontSize:13,fontWeight:600 }}>
                      {resending ? (t('sending') || 'Sending…') : (t('resendCode') || 'Resend Code')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="card" style={{ padding:48,textAlign:'center' }}>
            <div style={{ fontSize:72,marginBottom:16 }}>✅</div>
            <h2 className="gradient-text" style={{ fontSize:24,fontWeight:900,marginBottom:12 }}>
              {t('passwordResetSuccess') || 'Password Reset!'}
            </h2>
            <p style={{ color:'var(--text-muted)',fontSize:14,marginBottom:28 }}>
              {t('passwordResetSuccessDesc') || 'Your password has been reset successfully. You can now sign in with your new password.'}
            </p>
            <button className="btn btn-primary w-full" style={{ justifyContent:'center' }}
              onClick={() => navigate('/login')}>
              {t('goToLogin') || 'Go to Login →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
