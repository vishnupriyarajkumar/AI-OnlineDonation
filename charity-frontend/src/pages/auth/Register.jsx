import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code:'en', label:'English', flag:'🇬🇧' },
  { code:'ta', label:'தமிழ்', flag:'🇮🇳' },
  { code:'hi', label:'हिन्दी', flag:'🇮🇳' },
  { code:'te', label:'తెలుగు', flag:'🇮🇳' },
  { code:'ml', label:'മലയാളം', flag:'🇮🇳' },
  { code:'kn', label:'ಕನ್ನಡ', flag:'🇮🇳' },
];

const PWD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName:'', email:'', mobile:'', address:'', password:'', confirmPassword:'', preferredLanguage:'en' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [locating, setLocating] = useState(false);

  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser.');
      return;
    }
    setLocating(true);
    toast('📍 Detecting your location…', { duration: 2000 });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&email=newdawnfoundationtrust@gmail.com`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data?.address) {
            const a = data.address;
            const parts = [
              a.road || a.neighbourhood || a.suburb,
              a.city || a.town || a.village || a.county,
              a.state_district || a.district,
              a.state,
              a.postcode,
            ].filter(Boolean);
            set('address', parts.join(', '));
            toast.success('📍 Location detected!');
          } else {
            toast.error('Could not read address. Enter manually.');
          }
        } catch {
          toast.error('Location lookup failed. Enter address manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED)
          toast.error('Location access denied. Allow location in browser settings.');
        else
          toast.error('Location unavailable. Please enter manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const set = (k, v) => { setForm(p => ({ ...p, [k]:v })); setErrors(p => ({ ...p, [k]:'' })); };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = t('val.nameRequired') || 'Full name required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('val.emailInvalid') || 'Valid email required';
    if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile)) e.mobile = t('val.mobileInvalid') || 'Valid 10-digit mobile required';
    if (!PWD_RE.test(form.password)) e.password = t('val.passwordWeak') || 'Min 8 chars, upper, lower, digit & special';
    if (form.password !== form.confirmPassword) e.confirmPassword = t('val.passwordMismatch') || 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/register', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.mobile.trim(),
        address: form.address.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        preferredLanguage: form.preferredLanguage,
      });
      toast.success('Account created! Please verify your email. 📧');
      navigate('/verify-account', { state: { email: form.email.trim() } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setErrors(p => ({ ...p, email: msg }));
      else if (msg.toLowerCase().includes('mobile') || msg.toLowerCase().includes('phone')) setErrors(p => ({ ...p, mobile: msg }));
    } finally { setLoading(false); }
  };

  const inputProps = (key, type='text', placeholder='') => ({
    type, value: form[key], placeholder,
    onChange: e => set(key, e.target.value),
    className: `form-control${errors[key] ? ' error' : ''}`,
  });

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px' }}>
      {/* Background */}
      <motion.div style={{ position:'fixed', inset:0, zIndex:0, background:'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.3) 0%, transparent 60%)' }}
        animate={{ opacity:[0.7,1,0.7] }} transition={{ duration:6, repeat:Infinity }}/>
      {[{e:'💜',x:5,y:15,d:0},{e:'🌟',x:90,y:10,d:0.8},{e:'❤️',x:8,y:80,d:1.5},{e:'✨',x:88,y:75,d:2.2},{e:'🤝',x:50,y:5,d:1}].map((p,i)=>(
        <motion.div key={i} style={{ position:'fixed', left:`${p.x}%`, top:`${p.y}%`, fontSize:20, zIndex:0, pointerEvents:'none' }}
          animate={{ y:[0,-18,0], opacity:[0.3,0.7,0.3] }} transition={{ duration:4+p.d, repeat:Infinity, delay:p.d }}>
          {p.e}
        </motion.div>
      ))}

      <motion.div style={{ width:'100%', maxWidth:500, position:'relative', zIndex:1 }}
        initial={{ opacity:0, y:40, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.5, ease:'easeOut' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <motion.span className="chip chip-glow" style={{ marginBottom:16, display:'inline-block' }}
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            🚀 Join New Dawn Foundation
          </motion.span>
          <motion.div style={{ fontSize:56, lineHeight:1, marginBottom:8 }}
            animate={{ rotate:[0,-5,5,0] }} transition={{ duration:4, repeat:Infinity, delay:1 }}>
            🌟
          </motion.div>
          <motion.h1 className="auth-title gradient-text"
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.25 }}>
            {t('auth.createAccount') || 'Create Account'}
          </motion.h1>
          <motion.p className="auth-subtitle"
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>
            {t('joinSubtitle') || 'Join us and start making a difference'}
          </motion.p>
        </div>

        <motion.div className="glass-card" style={{ padding:'32px 36px' }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <form onSubmit={handleSubmit} noValidate>

            {/* Full Name */}
            <Field label={t('auth.fullName')||'Full Name'} icon="👤" error={errors.fullName}>
              <input {...inputProps('fullName','text','Vishnu Priya')} style={{ paddingLeft:42 }} autoComplete="name"/>
            </Field>

            {/* Email */}
            <Field label={t('auth.email')||'Email Address'} icon="✉️" error={errors.email}>
              <input {...inputProps('email','email','you@example.com')} style={{ paddingLeft:42 }} autoComplete="email"/>
            </Field>

            {/* Mobile */}
            <Field label={t('auth.mobile')||'Mobile Number'} icon="📱" error={errors.mobile}>
              <input {...inputProps('mobile','tel','9876543210')} style={{ paddingLeft:42 }} autoComplete="tel" maxLength={10}/>
            </Field>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">{`${t('auth.address')||'Address'} (optional)`}</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', opacity:0.5, pointerEvents:'none' }}>🏠</span>
                <input {...inputProps('address','text','Your city / area')} style={{ paddingLeft:42, paddingRight:48 }} autoComplete="street-address"/>
                <button type="button" onClick={autoDetectLocation} disabled={locating}
                  title="Auto-detect my location"
                  style={{
                    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor: locating ? 'not-allowed' : 'pointer',
                    fontSize:18, padding:4, opacity: locating ? 0.5 : 0.8,
                    display:'flex', alignItems:'center',
                  }}>
                  {locating
                    ? <span style={{ width:16, height:16, border:'2px solid rgba(167,139,250,0.3)', borderTopColor:'var(--primary-light)', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>
                    : '📍'
                  }
                </button>
              </div>
              {errors.address && <p style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>⚠ {errors.address}</p>}
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Click 📍 to auto-fill your address</p>
            </div>

            {/* Password */}
            <Field label={t('auth.password')||'Password'} icon="🔑" error={errors.password}>
              <input {...inputProps('password', showPwd?'text':'password', 'Min 8 chars, upper+lower+digit+special')} style={{ paddingLeft:42, paddingRight:48 }} autoComplete="new-password"/>
              <EyeBtn show={showPwd} toggle={()=>setShowPwd(p=>!p)}/>
              {!errors.password && form.password && (
                <StrengthBar password={form.password}/>
              )}
            </Field>

            {/* Confirm Password */}
            <Field label={t('auth.confirmPassword')||'Confirm Password'} icon="🔐" error={errors.confirmPassword}>
              <input {...inputProps('confirmPassword', showConfirm?'text':'password', 'Repeat your password')} style={{ paddingLeft:42, paddingRight:48 }} autoComplete="new-password"/>
              <EyeBtn show={showConfirm} toggle={()=>setShowConfirm(p=>!p)}/>
            </Field>

            {/* Language */}
            <div className="form-group">
              <label className="form-label">🌐 {t('preferredLanguage')||'Preferred Language'}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {LANGUAGES.map(l=>(
                  <motion.button key={l.code} type="button"
                    onClick={()=>set('preferredLanguage',l.code)}
                    whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                    style={{
                      padding:'8px 10px', borderRadius:10, fontSize:12, fontWeight:600,
                      border: form.preferredLanguage===l.code ? '2px solid var(--primary-light)' : '1px solid var(--border)',
                      background: form.preferredLanguage===l.code ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                      color: form.preferredLanguage===l.code ? 'var(--primary-light)' : 'var(--text-muted)',
                      cursor:'pointer', display:'flex', alignItems:'center', gap:6, justifyContent:'center',
                    }}>
                    {l.flag} {l.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button type="submit" className="btn-primary-full" disabled={loading}
              whileHover={!loading?{scale:1.02,y:-1}:{}} whileTap={!loading?{scale:0.98}:{}}
              style={{ marginTop:8 }}>
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
                  <motion.span style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block' }}
                    animate={{ rotate:360 }} transition={{ duration:0.7, repeat:Infinity, ease:'linear' }}/>
                  {t('creatingAccount')||'Creating Account…'}
                </span>
              ) : `🚀 ${t('auth.registerFree')||'Create Free Account'}`}
            </motion.button>
          </form>

          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.5px' }}>ALREADY A MEMBER?</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>
          <Link to="/login">
            <motion.button className="btn-secondary-full" whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
              {t('auth.signIn')||'Sign In'} →
            </motion.button>
          </Link>
        </motion.div>

        <motion.p style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)', marginTop:16 }}
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}>
          🔒 Your data is encrypted · {t('auth.otpOnce')||'OTP verification required only once'}
        </motion.p>
      </motion.div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────── */
function Field({ label, icon, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', opacity:0.5, pointerEvents:'none' }}>{icon}</span>
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-5 }}
            style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>⚠ {error}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" onClick={toggle} aria-label="Toggle password"
      style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:18, opacity:0.6, padding:4 }}>
      {show ? '🙈' : '👁️'}
    </button>
  );
}

function StrengthBar({ password }) {
  const checks = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/, /[@$!%*?&]/];
  const strength = checks.filter(r => r.test(password)).length;
  const colors = ['#ef4444','#f59e0b','#f59e0b','#10b981','#10b981'];
  const labels = ['Weak','Fair','Fair','Strong','Very Strong'];
  return (
    <div style={{ marginTop:6 }}>
      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
        {[1,2,3,4,5].map(i=>(
          <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i<=strength ? colors[strength-1] : 'rgba(255,255,255,0.08)', transition:'background 0.3s' }}/>
        ))}
      </div>
      <span style={{ fontSize:11, color: colors[strength-1]||'var(--text-muted)' }}>
        {strength > 0 ? labels[strength-1] : ''}
      </span>
    </div>
  );
}
