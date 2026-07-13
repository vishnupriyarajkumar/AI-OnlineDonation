import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const STEP_ICONS = ['📧', '🔐', '🎉'];

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [step,     setStep]     = useState(0);   // 0=email, 1=otp+newpwd, 2=success
  const [email,    setEmail]    = useState('');
  const [otp,      setOtp]      = useState('');
  const [newPwd,   setNewPwd]   = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  /* ── Step 0: send OTP ─────────────────────────────── */
  const sendOtp = async (ev) => {
    ev.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: t('val.emailInvalid') || 'Enter a valid email address' });
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/forgot-password', { email });
      toast.success('Reset code sent to your email! 📧');
      setStep(1);
      setErrors({});
    } catch (err) {
      setErrors({ email: err.response?.data?.message || 'No account found with this email.' });
    } finally { setLoading(false); }
  };

  /* ── Step 1: verify OTP + reset password ─────────── */
  const resetPassword = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!otp || otp.length !== 6) e.otp = t('val.otpInvalid') || 'OTP must be 6 digits';
    if (!newPwd || newPwd.length < 8) e.newPwd = t('val.passwordWeak') || 'Min 8 characters';
    if (newPwd !== confirm) e.confirm = t('val.passwordMismatch') || 'Passwords do not match';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/reset-password', { email, otp, newPassword: newPwd });
      setStep(2);
      setErrors({});
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || 'Invalid or expired OTP.' });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px' }}>
      {/* bg */}
      <motion.div style={{ position:'fixed', inset:0, zIndex:0, background:'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.28) 0%, transparent 60%)' }}
        animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:6, repeat:Infinity }}/>

      {[{e:'🔑',x:6,y:12,d:0},{e:'🛡️',x:88,y:10,d:1},{e:'💜',x:10,y:80,d:2},{e:'✨',x:85,y:78,d:0.5}].map((p,i)=>(
        <motion.div key={i} style={{ position:'fixed', left:`${p.x}%`, top:`${p.y}%`, fontSize:20, zIndex:0, pointerEvents:'none' }}
          animate={{ y:[0,-16,0], opacity:[0.3,0.7,0.3] }} transition={{ duration:4+p.d, repeat:Infinity, delay:p.d }}>
          {p.e}
        </motion.div>
      ))}

      <motion.div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:1 }}
        initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>

        {/* Progress steps */}
        <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:28 }}>
          {['Send Code', 'Reset', 'Done'].map((label, i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <motion.div
                animate={{ scale: step===i ? 1.15 : 1 }}
                style={{
                  width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18, fontWeight:700,
                  background: step>i ? 'linear-gradient(135deg,var(--primary),var(--primary-light))' : step===i ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                  border: step===i ? '2px solid var(--primary-light)' : step>i ? 'none' : '1px solid var(--border)',
                  color: step===i ? 'var(--primary-light)' : step>i ? '#fff' : 'var(--text-muted)',
                }}>
                {step > i ? '✓' : STEP_ICONS[i]}
              </motion.div>
              <span style={{ fontSize:10, color: step===i ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: step===i ? 700 : 400 }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginBottom:24 }}>
          <motion.div style={{ fontSize:52, lineHeight:1, marginBottom:8 }}
            animate={{ rotate:[0,-5,5,0] }} transition={{ duration:4, repeat:Infinity }}>
            {STEP_ICONS[step]}
          </motion.div>
          <h1 className="auth-title gradient-text">
            {step===0 ? (t('auth.forgotTitle')||'Forgot Password?') : step===1 ? (t('auth.resetPassword')||'Reset Password') : (t('auth.passwordResetSuccess')||'Password Reset!')}
          </h1>
          <p className="auth-subtitle">
            {step===0 ? "Enter your registered email to receive a reset code."
            : step===1 ? `Enter the 6-digit code sent to ${email}`
            : 'Your password has been reset successfully!'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" className="glass-card" style={{ padding:'32px 36px' }}
              initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:30 }}
              transition={{ duration:0.3 }}>
              <form onSubmit={sendOtp} noValidate>
                <div className="form-group">
                  <label className="form-label">{t('auth.email')||'Email Address'}</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', opacity:0.5 }}>✉️</span>
                    <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErrors({})}}
                      placeholder="your@email.com" className={`form-control${errors.email?' error':''}`}
                      style={{ paddingLeft:42 }} autoComplete="email" autoFocus/>
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p initial={{ opacity:0,y:-5 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-5 }}
                        style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>⚠ {errors.email}</motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <SpinButton loading={loading} label={t('auth.sendResetCode')||'Send Reset Code 📧'}/>
              </form>
              <div style={{ marginTop:20, textAlign:'center' }}>
                <Link to="/login" style={{ fontSize:13, color:'var(--primary-light)' }}>
                  {t('auth.backToLogin')||'← Back to Login'}
                </Link>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" className="glass-card" style={{ padding:'32px 36px' }}
              initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
              transition={{ duration:0.3 }}>
              <form onSubmit={resetPassword} noValidate>
                {/* OTP */}
                <div className="form-group">
                  <label className="form-label">🔢 {t('auth.verificationCode')||'Verification Code (6 digits)'}</label>
                  <input value={otp} onChange={e=>{setOtp(e.target.value.replace(/\D/g,'').slice(0,6));setErrors(p=>({...p,otp:''}))}}
                    placeholder="Enter 6-digit code"
                    className={`form-control${errors.otp?' error':''}`}
                    style={{ fontSize:22, letterSpacing:8, textAlign:'center' }}
                    maxLength={6} inputMode="numeric"/>
                  <AnimatePresence>
                    {errors.otp && (
                      <motion.p initial={{ opacity:0,y:-5 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-5 }}
                        style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>⚠ {errors.otp}</motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* New password */}
                <div className="form-group">
                  <label className="form-label">🔑 {t('auth.newPassword')||'New Password'}</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPwd?'text':'password'} value={newPwd}
                      onChange={e=>{setNewPwd(e.target.value);setErrors(p=>({...p,newPwd:''}))}}
                      placeholder="Min 8 chars, upper+lower+digit+special"
                      className={`form-control${errors.newPwd?' error':''}`}
                      style={{ paddingRight:48 }} autoComplete="new-password"/>
                    <button type="button" onClick={()=>setShowPwd(p=>!p)}
                      style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:18, opacity:0.6 }}>
                      {showPwd?'🙈':'👁️'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.newPwd && (
                      <motion.p initial={{ opacity:0,y:-5 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-5 }}
                        style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>⚠ {errors.newPwd}</motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirm */}
                <div className="form-group">
                  <label className="form-label">🔐 {t('auth.confirmPassword')||'Confirm New Password'}</label>
                  <input type="password" value={confirm}
                    onChange={e=>{setConfirm(e.target.value);setErrors(p=>({...p,confirm:''}))}}
                    placeholder="Repeat new password"
                    className={`form-control${errors.confirm?' error':''}`}
                    autoComplete="new-password"/>
                  <AnimatePresence>
                    {errors.confirm && (
                      <motion.p initial={{ opacity:0,y:-5 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-5 }}
                        style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>⚠ {errors.confirm}</motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <SpinButton loading={loading} label={t('auth.resetPassword')||'Reset Password'} icon="🔐"/>
              </form>
              <button onClick={()=>{setStep(0);setOtp('');setErrors({})}}
                style={{ marginTop:16, background:'none', border:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer', width:'100%', textAlign:'center' }}>
                {t('auth.backToLogin')||'← Back'}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" className="glass-card" style={{ padding:'36px', textAlign:'center' }}
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ type:'spring', stiffness:260, damping:20 }}>
              <motion.div style={{ fontSize:72, marginBottom:16 }}
                animate={{ scale:[0.5,1.2,1], rotate:[0,10,-10,0] }}
                transition={{ duration:0.6 }}>
                🎉
              </motion.div>
              <h2 style={{ fontWeight:800, fontSize:22, marginBottom:8 }}>
                {t('auth.passwordResetSuccess')||'Password Reset Successfully!'}
              </h2>
              <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:28 }}>
                You can now sign in with your new password.
              </p>
              <Link to="/login">
                <motion.button className="btn-primary-full" whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
                  {t('goToLogin')||'Go to Login →'}
                </motion.button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SpinButton({ loading, label, icon='' }) {
  return (
    <motion.button type="submit" className="btn-primary-full" disabled={loading}
      whileHover={!loading?{scale:1.02,y:-1}:{}} whileTap={!loading?{scale:0.98}:{}}>
      {loading ? (
        <span style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
          <motion.span style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block' }}
            animate={{ rotate:360 }} transition={{ duration:0.7, repeat:Infinity, ease:'linear' }}/>
          Processing…
        </span>
      ) : `${icon} ${label}`}
    </motion.button>
  );
}
