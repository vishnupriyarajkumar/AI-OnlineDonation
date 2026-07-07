import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Register() {
  const navigate = useNavigate();
  const { setPendingVerification } = useAuth();
  const { t, lang } = useLanguage();

  const [method, setMethod] = useState('EMAIL'); // 'EMAIL' | 'MOBILE'
  const [form,   setForm]   = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', address: '',
    preferredLanguage: lang || 'en',
  });
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});

  const handle = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  /* password strength */
  const strength = (() => {
    const v = form.password; let s = 0;
    if (v.length >= 12) s++; if (/[A-Z]/.test(v)) s++;
    if (/\d/.test(v))   s++; if (/[@$!%*?&]/.test(v)) s++;
    return s;
  })();
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())    e.fullName = 'Full name is required';
    if (method === 'EMAIL') {
      if (!form.email)            e.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    } else {
      if (!form.phone)            e.phone = 'Mobile number is required';
      else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit number';
    }
    if (!form.password)           e.password = 'Password is required';
    else if (!PWD_REGEX.test(form.password)) e.password = 'Min 8 chars: upper, lower, digit & special';
    if (!form.confirmPassword)    e.confirmPassword = 'Please confirm password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName,
        password: form.password,
        confirmPassword: form.confirmPassword,
        address: form.address,
        registrationMethod: method,
        preferredLanguage: form.preferredLanguage,
        ...(method === 'EMAIL'  ? { email: form.email }  : {}),
        ...(method === 'MOBILE' ? { phone: form.phone }  : {}),
      };
      const data = await registerApi(payload);
      const identifier = method === 'EMAIL' ? form.email : form.phone;
      setPendingVerification(identifier);
      toast.success('Account created! Check your ' + (method === 'EMAIL' ? 'email' : 'mobile') + ' for the code.', { icon: '📧', duration: 5000 });
      navigate('/verify-account', {
        state: { email: identifier, cooldown: data?.resendCooldownSeconds || 30, method },
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('email'))  setErrors(p => ({ ...p, email: msg }));
      if (msg.toLowerCase().includes('mobile') || msg.toLowerCase().includes('phone'))
        setErrors(p => ({ ...p, phone: msg }));
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper" style={{ minHeight:'100vh', paddingTop:48, paddingBottom:48 }}>
      {/* background */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:'radial-gradient(ellipse 80% 40% at 50% 0%,rgba(108,60,232,0.22) 0%,transparent 60%)' }} />

      <div className="auth-card" style={{ maxWidth:560, position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🌟</div>
          <h1 className="auth-title gradient-text">{t('createAccount')}</h1>
          <p className="auth-subtitle">{t('joinSubtitle') || 'Join CharityOrg and start making a difference'}</p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:24 }}>
          {['Fill Details','Verify','Start Donating'].map((s,i) => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:11, fontWeight:700,
                background: i===0 ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                color: i===0 ? '#fff' : 'var(--text-muted)',
              }}>{i+1}</div>
              <span style={{ fontSize:12, color: i===0 ? 'var(--primary-light)' : 'var(--text-muted)',
                fontWeight: i===0 ? 600 : 400 }}>{s}</span>
              {i<2 && <span style={{ color:'var(--border)',fontSize:14 }}>›</span>}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding:'32px 36px' }}>

          {/* Method toggle */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:28 }}>
            {['EMAIL','MOBILE'].map(m => (
              <button key={m} type="button" onClick={() => { setMethod(m); setErrors({}); }}
                style={{
                  padding:'12px', borderRadius:10, border:'none', cursor:'pointer',
                  fontWeight:700, fontSize:13, transition:'all 0.2s',
                  background: method===m
                    ? 'linear-gradient(135deg,var(--primary),var(--primary-light))'
                    : 'rgba(255,255,255,0.06)',
                  color: method===m ? '#fff' : 'var(--text-muted)',
                  boxShadow: method===m ? '0 4px 20px rgba(108,60,232,0.4)' : 'none',
                }}>
                {m==='EMAIL' ? '✉️ Email' : '📱 Mobile'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label>{t('fullName')} *</label>
              <input className="form-control" name="fullName" placeholder="John Doe"
                value={form.fullName} onChange={handle}
                style={errors.fullName ? {borderColor:'#ef4444'} : {}} />
              {errors.fullName && <p style={{color:'#ef4444',fontSize:12,marginTop:4}}>⚠ {errors.fullName}</p>}
            </div>

            {/* Email or Phone */}
            {method === 'EMAIL' ? (
              <div className="form-group">
                <label>{t('emailAddress')} *</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',opacity:0.5 }}>✉️</span>
                  <input className="form-control" type="email" name="email"
                    placeholder="you@example.com" value={form.email} onChange={handle}
                    style={{ paddingLeft:42, ...(errors.email ? {borderColor:'#ef4444'} : {}) }} />
                </div>
                {errors.email && <p style={{color:'#ef4444',fontSize:12,marginTop:4}}>⚠ {errors.email}</p>}
              </div>
            ) : (
              <div className="form-group">
                <label>{t('mobileNumber')} *</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',opacity:0.5 }}>📱</span>
                  <input className="form-control" type="tel" name="phone"
                    placeholder="10-digit number (e.g. 9876543210)" value={form.phone} onChange={handle}
                    style={{ paddingLeft:42, ...(errors.phone ? {borderColor:'#ef4444'} : {}) }} />
                </div>
                {errors.phone && <p style={{color:'#ef4444',fontSize:12,marginTop:4}}>⚠ {errors.phone}</p>}
              </div>
            )}

            {/* Password row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="form-group">
                <label>{t('password')} *</label>
                <div style={{ position:'relative' }}>
                  <input className="form-control" name="password"
                    type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars"
                    value={form.password} onChange={handle}
                    style={{ paddingRight:44, ...(errors.password ? {borderColor:'#ef4444'} : {}) }} />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                      background:'none',border:'none',cursor:'pointer',fontSize:16,opacity:0.6 }}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop:6 }}>
                    <div style={{ display:'flex',gap:3,marginBottom:3 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1,height:3,borderRadius:99,transition:'background 0.3s',
                          background: i<=strength ? strColor[strength] : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize:11,color:strColor[strength] }}>{strLabel[strength]}</span>
                  </div>
                )}
                {errors.password && <p style={{color:'#ef4444',fontSize:12,marginTop:4}}>⚠ {errors.password}</p>}
              </div>

              <div className="form-group">
                <label>{t('confirmPassword')} *</label>
                <div style={{ position:'relative' }}>
                  <input className="form-control" name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                    value={form.confirmPassword} onChange={handle}
                    style={{ paddingRight:44, ...(errors.confirmPassword ? {borderColor:'#ef4444'} : {}) }} />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                      background:'none',border:'none',cursor:'pointer',fontSize:16,opacity:0.6 }}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <p style={{color:'#10b981',fontSize:12,marginTop:4}}>✓ Passwords match</p>
                )}
                {errors.confirmPassword && <p style={{color:'#ef4444',fontSize:12,marginTop:4}}>⚠ {errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label>{t('address')} ({t('optional') || 'optional'})</label>
              <input className="form-control" name="address" placeholder="City, State"
                value={form.address} onChange={handle} />
            </div>

            {/* Preferred Language */}
            <div className="form-group">
              <label>{t('preferredLanguage') || 'Preferred Language'}</label>
              <select className="form-control" name="preferredLanguage"
                value={form.preferredLanguage} onChange={handle}
                style={{ background:'rgba(255,255,255,0.05)', color:'var(--text)', border:'1px solid var(--border)' }}>
                <option value="en">English 🇬🇧</option>
                <option value="ta">தமிழ் (Tamil) 🇮🇳</option>
                <option value="hi">हिन्दी (Hindi) 🇮🇳</option>
                <option value="te">తెలుగు (Telugu) 🇮🇳</option>
                <option value="ml">മലയാളം (Malayalam) 🇮🇳</option>
                <option value="kn">ಕನ್ನಡ (Kannada) 🇮🇳</option>
              </select>
            </div>

            {/* OTP notice */}
            <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)',
              borderRadius:8, padding:'10px 14px', marginBottom:20 }}>
              <p style={{ color:'#93c5fd', fontSize:12 }}>
                {method === 'EMAIL'
                  ? '📧 A 6-digit code will be sent to your email. Verification required only once.'
                  : '📱 A 6-digit code will be sent via SMS. Verification required only once.'}
              </p>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}
              style={{ justifyContent:'center', padding:'14px', fontSize:15, fontWeight:700, borderRadius:10 }}>
              {loading ? (
                <span style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',
                    borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} />
                  {t('creatingAccount') || 'Creating Account…'}
                </span>
              ) : `${t('createAccount')} & ${t('verify') || 'Verify'} ${method === 'EMAIL' ? t('email') || 'Email' : t('mobileNumber')} 🚀`}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--text-muted)' }}>
            {t('alreadyAccount') || 'Already have an account?'}{' '}
            <Link to="/login" style={{ color:'var(--primary-light)', fontWeight:600 }}>{t('signIn') || 'Sign in'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
