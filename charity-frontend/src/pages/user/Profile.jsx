import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axiosInstance from '../../api/axiosInstance';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const LANG_FLAGS = { en:'🇬🇧', ta:'🇮🇳', hi:'🇮🇳', te:'🇮🇳', ml:'🇮🇳', kn:'🇮🇳' };
const PWD_REGEX  = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Profile() {
  const { user, login }        = useAuth();
  const { lang, changeLanguage, t, LANGUAGES } = useLanguage();

  const [activeTab, setActiveTab]   = useState('details');
  const [editing,   setEditing]     = useState(false);
  const [saving,    setSaving]      = useState(false);
  const [locating,  setLocating]    = useState(false); // auto-location state
  const [stats,     setStats]       = useState({ total:0, successful:0, amount:0 });
  const [sub,       setSub]         = useState(null);
  const [loginHist, setLoginHist]   = useState([]);
  const [donations, setDonations]   = useState([]);
  const [notifs,    setNotifs]      = useState([]);
  const [form,      setForm]        = useState({ fullName:'', phone:'', address:'' });
  const [pwdForm,   setPwdForm]     = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [showPwds,  setShowPwds]    = useState({ current:false, new:false, confirm:false });
  const [pwdSaving, setPwdSaving]   = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/user/profile'),
      axiosInstance.get('/api/user/donations/my').catch(() => null),
      axiosInstance.get('/api/user/subscription').catch(() => null),
    ]).then(([pR, dR, sR]) => {
      const p = pR.data?.data;
      if (p) setForm({ fullName: p.fullName||'', phone: p.phone||'', address: p.address||'' });
      const d = dR?.data?.data || [];
      setDonations(d);
      setStats({
        total:      d.length,
        successful: d.filter(x=>x.status==='SUCCESS').length,
        amount:     d.filter(x=>x.status==='SUCCESS').reduce((s,x)=>s+Number(x.amount),0),
      });
      if (sR?.data?.data) setSub(sR.data.data);
    }).catch(() => {
      setForm({ fullName: user?.fullName||'', phone:'', address:'' });
    });
  }, [user?.userId]);

  useEffect(() => {
    if (activeTab === 'history') {
      axiosInstance.get('/api/user/login-history').catch(() => null)
        .then(r => setLoginHist(r?.data?.data?.content || r?.data?.data || []));
    }
    if (activeTab === 'notifications') {
      axiosInstance.get('/api/user/notifications?page=0&size=20').catch(() => null)
        .then(r => setNotifs(r?.data?.data?.content || []));
    }
  }, [activeTab]);

  const handle = e => setForm(p => ({...p, [e.target.name]: e.target.value}));

  // ── Auto-detect location via Geolocation API + OpenStreetMap Nominatim ──
  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    toast('📍 Detecting your location…', { duration: 2000 });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // OpenStreetMap Nominatim — free, no API key needed
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&email=newdawnfoundationtrust@gmail.com`,
            { headers: { 'Accept-Language': lang === 'ta' ? 'ta' : lang === 'hi' ? 'hi' : 'en' } }
          );
          const data = await res.json();

          if (data?.address) {
            const a = data.address;
            // Build a readable address from components
            const parts = [
              a.house_number,
              a.road || a.neighbourhood || a.suburb,
              a.city || a.town || a.village || a.county,
              a.state_district || a.district,
              a.state,
              a.postcode,
            ].filter(Boolean);

            const address = parts.join(', ');
            setForm(p => ({ ...p, address }));
            toast.success('📍 Location detected!');
          } else {
            toast.error('Could not read address. Please enter manually.');
          }
        } catch {
          toast.error('Location lookup failed. Please enter address manually.');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location access denied. Please allow location in browser settings.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error('Location unavailable. Please enter address manually.');
        } else {
          toast.error('Location timeout. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const save = async e => {
    e.preventDefault();
    if (!form.fullName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const r = await axiosInstance.put('/api/user/profile', {
        fullName: form.fullName.trim(),
        phone:    form.phone.trim() || null,
        address:  form.address.trim() || null,
      });
      login({ ...user, fullName: r.data?.data?.fullName || form.fullName });
      toast.success('Profile updated! ✅');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally { setSaving(false); }
  };

  const changePassword = async e => {
    e.preventDefault();
    if (!PWD_REGEX.test(pwdForm.newPassword)) {
      toast.error('New password needs 8+ chars with upper, lower, digit & special char'); return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    setPwdSaving(true);
    try {
      await axiosInstance.post('/api/user/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword:     pwdForm.newPassword,
      });
      toast.success('Password changed successfully! ✅');
      setPwdForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
    } finally { setPwdSaving(false); }
  };

  const avatarLetter = (user?.fullName || user?.email || '?')[0]?.toUpperCase();

  const TABS = [
    { id:'details',       label:'👤 Profile'        },
    { id:'password',      label:'🔐 Password'       },
    { id:'language',      label:'🌐 Language'       },
    { id:'history',       label:'📋 Login History'  },
    { id:'donations',     label:'💰 Donations'      },
    { id:'notifications', label:'🔔 Notifications'  },
  ];

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar />
      <motion.div
        className="container"
        style={{ paddingTop:40, paddingBottom:80, maxWidth:900 }}
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.4 }}
      >
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:26, fontWeight:900 }}>My <span className="gradient-text">Profile</span></h1>
          <p style={{ color:'var(--text-muted)', marginTop:4 }}>Manage your account, security, language and history</p>
        </div>

        {/* Profile header */}
        <div className="card" style={{ padding:24, marginBottom:20, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div style={{ width:68, height:68, borderRadius:'50%', background:'linear-gradient(135deg,#6c3ce8,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#fff', flexShrink:0 }}>
            {avatarLetter}
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ fontWeight:800, fontSize:20 }}>{form.fullName || user?.fullName}</h2>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>{user?.email || user?.phone}</p>
            <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
              <span style={{ background:'rgba(16,185,129,0.12)',color:'#10b981',borderRadius:99,padding:'2px 10px',fontSize:11,fontWeight:700,border:'1px solid rgba(16,185,129,0.3)' }}>✅ Verified</span>
              <span style={{ background:'rgba(108,60,232,0.12)',color:'var(--primary-light)',borderRadius:99,padding:'2px 10px',fontSize:11,fontWeight:700,border:'1px solid rgba(108,60,232,0.3)' }}>👤 {user?.role}</span>
              <span style={{ background:'rgba(255,255,255,0.06)',color:'var(--text-muted)',borderRadius:99,padding:'2px 10px',fontSize:11,fontWeight:700 }}>
                {LANG_FLAGS[lang]} {LANGUAGES[lang]?.native || LANGUAGES[lang]?.name || lang.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, textAlign:'right' }}>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>Total Donated</div>
            <div style={{ fontSize:22, fontWeight:800, color:'#10b981' }}>₹{stats.amount.toLocaleString('en-IN')}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{stats.successful} donations</div>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
          {TABS.map(tab => (
            <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              style={{
                padding:'8px 16px', borderRadius:99, fontSize:12, fontWeight:600, border:'none', cursor:'pointer',
                background: activeTab===tab.id ? 'linear-gradient(135deg,var(--primary),var(--primary-light))' : 'rgba(255,255,255,0.06)',
                color: activeTab===tab.id ? '#fff' : 'var(--text-muted)',
                boxShadow: activeTab===tab.id ? '0 4px 14px rgba(108,60,232,0.35)' : 'none',
                transition: 'background 0.2s, color 0.2s',
              }}>{tab.label}
            </motion.button>
          ))}
        </div>

        {/* ── TAB: Profile Details ── */}
        {activeTab === 'details' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div className="card" style={{ padding:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <h3 style={{ fontWeight:700, fontSize:16 }}>Account Details</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(p=>!p)}>
                  {editing ? '✕ Cancel' : '✏️ Edit'}
                </button>
              </div>
              {editing ? (
                <form onSubmit={save}>
                  {[['fullName','Full Name *'],['phone','Mobile'],['address','Address']].map(([n,l]) => (
                    <div key={n} className="form-group">
                      <label style={{ fontSize:12,color:'var(--text-muted)',marginBottom:4,display:'block' }}>{l}</label>
                      {n === 'address' ? (
                        <>
                        <div style={{ position:'relative' }}>
                          <input className="form-control" name={n} value={form[n]} onChange={handle}
                            placeholder={locating ? '📍 Detecting location…' : 'Enter address or use location 📍'}
                            style={{ paddingRight: 46 }}
                            disabled={locating}
                          />
                          <button
                            type="button"
                            onClick={autoDetectLocation}
                            disabled={locating}
                            title="Auto-detect my location"
                            style={{
                              position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
                              background: locating ? 'rgba(108,60,232,0.3)' : 'rgba(108,60,232,0.15)',
                              border:'1px solid rgba(108,60,232,0.4)',
                              borderRadius:8, padding:'4px 8px', cursor:'pointer',
                              fontSize:16, lineHeight:1, transition:'all 0.2s',
                              animation: locating ? 'locatePulse 1s ease infinite' : 'none',
                            }}
                            aria-label="Auto detect location"
                          >
                            {locating ? '⏳' : '📍'}
                          </button>
                        </div>
                        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                          Click 📍 to auto-fill from your current location
                        </p>

                        <style>{`
                          @keyframes locatePulse {
                            0%,100%{box-shadow:0 0 0 0 rgba(108,60,232,0.5)}
                            50%{box-shadow:0 0 0 6px rgba(108,60,232,0)}
                          }
                        `}</style>
                        </>
                      ) : (
                        <input className="form-control" name={n} value={form[n]} onChange={handle}
                          required={n==='fullName'} placeholder={l} />
                      )}
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:10 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                      {saving ? 'Saving…' : '✓ Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {[
                    ['User ID',  '#'+(user?.userId||'—')],
                    ['Full Name', form.fullName||user?.fullName||'—'],
                    ['Email',    user?.email||'—'],
                    ['Mobile',   form.phone||'—'],
                    ['Address',  form.address||'—'],
                    ['Role',     user?.role||'—'],
                    ['Status',   '✅ Active & Verified'],
                  ].map(([k,v],i) => (
                    <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:i<6?'1px solid rgba(255,255,255,0.05)':'none',fontSize:13 }}>
                      <span style={{ color:'var(--text-muted)' }}>{k}</span>
                      <span style={{ fontWeight:600,maxWidth:'55%',textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card" style={{ padding:24 }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>Donation Summary</h3>
              {[
                { icon:'💜', label:'Total Donations',   value:stats.total,     color:'#6c3ce8' },
                { icon:'✅', label:'Successful',        value:stats.successful, color:'#10b981' },
                { icon:'💰', label:'Total Contributed', value:'₹'+stats.amount.toLocaleString('en-IN'), color:'#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 14px',background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.05)',marginBottom:10 }}>
                  <span style={{ fontSize:22 }}>{s.icon}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:12,color:'var(--text-muted)' }}>{s.label}</p>
                    <p style={{ fontWeight:800,fontSize:18,color:s.color,marginTop:2 }}>{s.value}</p>
                  </div>
                </div>
              ))}
              <Link to="/user/subscription" className="btn btn-secondary w-full" style={{ justifyContent:'center',marginTop:4 }}>
                {sub?.donorType==='MONTHLY' ? '🔄 Manage Monthly Plan' : '🚀 Upgrade to Monthly'}
              </Link>
            </div>
          </div>
        )}

        {/* ── TAB: Change Password ── */}
        {activeTab === 'password' && (
          <div className="card" style={{ padding:32, maxWidth:480 }}>
            <h3 style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>🔐 Change Password</h3>
            <form onSubmit={changePassword}>
              {[
                ['currentPassword','Current Password','current'],
                ['newPassword','New Password','new'],
                ['confirmPassword','Confirm New Password','confirm'],
              ].map(([field, label, key]) => (
                <div key={field} className="form-group">
                  <label style={{ fontSize:13,fontWeight:600,color:'var(--text-muted)',marginBottom:6,display:'block' }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <input className="form-control" type={showPwds[key]?'text':'password'}
                      value={pwdForm[field]} onChange={e=>setPwdForm(p=>({...p,[field]:e.target.value}))}
                      placeholder={label} required style={{ paddingRight:44 }} />
                    <button type="button" onClick={()=>setShowPwds(p=>({...p,[key]:!p[key]}))}
                      style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:16,opacity:0.6 }}>
                      {showPwds[key]?'🙈':'👁️'}
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:20 }}>
                <p style={{ color:'#93c5fd',fontSize:12 }}>Password must be 8+ chars with uppercase, lowercase, digit and special character (@$!%*?&)</p>
              </div>
              <button type="submit" className="btn btn-primary" disabled={pwdSaving} style={{ justifyContent:'center',padding:'12px 28px' }}>
                {pwdSaving ? 'Changing…' : '✓ Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB: Language ── */}
        {activeTab === 'language' && (
          <div className="card" style={{ padding:32, maxWidth:520 }}>
            <h3 style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>🌐 Language Preference</h3>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:24 }}>
              Your selected language is saved and applied automatically every time you log in.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {Object.entries(LANGUAGES).map(([code, info]) => (
                <button key={code} onClick={() => changeLanguage(code)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderRadius:12,
                    background: lang===code ? 'linear-gradient(135deg,rgba(108,60,232,0.25),rgba(139,92,246,0.15))' : 'rgba(255,255,255,0.04)',
                    border: lang===code ? '2px solid rgba(108,60,232,0.5)' : '1px solid var(--border)',
                    cursor:'pointer', transition:'all 0.2s', textAlign:'left',
                    boxShadow: lang===code ? '0 0 20px rgba(108,60,232,0.2)' : 'none',
                  }}>
                  <span style={{ fontSize:28 }}>{info.flag}</span>
                  <div>
                    <p style={{ fontWeight: lang===code ? 800 : 500, fontSize:14, color: lang===code ? 'var(--primary-light)' : 'var(--text)' }}>{info.native}</p>
                    <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{info.name}</p>
                  </div>
                  {lang===code && <span style={{ marginLeft:'auto',color:'var(--primary-light)',fontSize:18 }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ marginTop:20, padding:'12px 16px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, fontSize:13, color:'var(--text-muted)' }}>
              Current: <strong style={{ color:'var(--primary-light)' }}>{LANGUAGES[lang]?.native}</strong> — All pages, notifications and emails will use this language.
            </div>
          </div>
        )}

        {/* ── TAB: Login History ── */}
        {activeTab === 'history' && (
          <div className="card" style={{ padding:0 }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
              <h3 style={{ fontWeight:700, fontSize:16 }}>📋 Login History</h3>
              <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>Complete record of all your login sessions</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Date & Time</th><th>Status</th><th>IP Address</th><th>Device</th><th>Logout</th></tr></thead>
                <tbody>
                  {loginHist.length===0 ? (
                    <tr><td colSpan={5} style={{ textAlign:'center',padding:40,color:'var(--text-muted)' }}>No login history yet</td></tr>
                  ) : loginHist.map((h,i) => (
                    <tr key={i}>
                      <td style={{ fontSize:12,whiteSpace:'nowrap' }}>
                        {h.loginTime ? new Date(h.loginTime).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}
                      </td>
                      <td>
                        <span style={{ borderRadius:99,padding:'3px 10px',fontSize:11,fontWeight:700,
                          background:h.status==='SUCCESS'?'rgba(16,185,129,0.12)':h.status==='FAILED'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)',
                          color:h.status==='SUCCESS'?'#10b981':h.status==='FAILED'?'#ef4444':'#f59e0b' }}>
                          {h.status==='SUCCESS'?'✅ Success':h.status==='FAILED'?'❌ Failed':'🔒 Locked'}
                        </span>
                      </td>
                      <td style={{ fontSize:12,fontFamily:'monospace' }}>{h.ipAddress||'—'}</td>
                      <td style={{ fontSize:11,color:'var(--text-muted)',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.deviceInfo||'—'}</td>
                      <td style={{ fontSize:12,color:'var(--text-muted)' }}>
                        {h.logoutTime ? new Date(h.logoutTime).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: Donation History ── */}
        {activeTab === 'donations' && (
          <div className="card" style={{ padding:0 }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
              <h3 style={{ fontWeight:700, fontSize:16 }}>💰 Donation History</h3>
            </div>
            {donations.length===0 ? (
              <div style={{ padding:60, textAlign:'center', color:'var(--text-muted)' }}>
                <div style={{ fontSize:40,marginBottom:12 }}>💜</div>
                <p>No donations yet. <Link to="/user" style={{ color:'var(--primary-light)' }}>Browse campaigns →</Link></p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Date</th><th>Campaign</th><th>Amount</th><th>Method</th><th>Status</th><th>Receipt</th></tr></thead>
                  <tbody>
                    {donations.map((d,i) => (
                      <tr key={i}>
                        <td style={{ fontSize:12,color:'var(--text-muted)',whiteSpace:'nowrap' }}>{d.donationDate?new Date(d.donationDate).toLocaleDateString('en-IN'):'—'}</td>
                        <td style={{ fontWeight:600,fontSize:13 }}>{d.campaignName||'—'}</td>
                        <td style={{ color:'#10b981',fontWeight:700 }}>₹{Number(d.amount).toLocaleString('en-IN')}</td>
                        <td style={{ fontSize:12,color:'var(--text-muted)' }}>{d.paymentMethod?.replace(/_/g,' ')||'—'}</td>
                        <td>
                          <span style={{ borderRadius:99,padding:'3px 10px',fontSize:11,fontWeight:700,
                            background:d.status==='SUCCESS'?'rgba(16,185,129,0.12)':'rgba(245,158,11,0.12)',
                            color:d.status==='SUCCESS'?'#10b981':'#f59e0b' }}>
                            {d.status==='SUCCESS'?'✅ Success':'⏳ '+d.status}
                          </span>
                        </td>
                        <td style={{ fontSize:12,color:'var(--primary-light)',fontFamily:'monospace' }}>{d.receiptNumber||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Notifications ── */}
        {activeTab === 'notifications' && (
          <div className="card" style={{ padding:0 }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ fontWeight:700, fontSize:16 }}>🔔 Notification History</h3>
                <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>All system notifications for your account</p>
              </div>
              <button className="btn btn-secondary btn-sm"
                onClick={() => axiosInstance.post('/api/user/notifications/mark-all-read').then(() => {
                  setNotifs(p => p.map(n=>({...n,read:true}))); toast.success('All marked read');
                })}>
                ✓ Mark all read
              </button>
            </div>
            {notifs.length===0 ? (
              <div style={{ padding:60, textAlign:'center', color:'var(--text-muted)' }}>
                <div style={{ fontSize:40,marginBottom:12 }}>🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' }}>
                {notifs.map((n,i) => (
                  <div key={i} style={{ display:'flex',gap:14,padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)',background:n.read?'transparent':'rgba(108,60,232,0.06)',cursor:'pointer' }}
                    onClick={() => axiosInstance.post(`/api/user/notifications/${n.id}/read`).then(()=>setNotifs(p=>p.map(x=>x.id===n.id?{...x,read:true}:x)))}>
                    <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(108,60,232,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>
                      🔔
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex',justifyContent:'space-between',gap:8 }}>
                        <p style={{ fontWeight:n.read?400:700,fontSize:13 }}>{n.title}</p>
                        {!n.read && <div style={{ width:8,height:8,borderRadius:'50%',background:'var(--primary-light)',flexShrink:0,marginTop:4 }} />}
                      </div>
                      <p style={{ color:'var(--text-muted)',fontSize:12,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{n.message}</p>
                      <p style={{ fontSize:11,color:'var(--text-muted)',marginTop:4,opacity:0.6 }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
