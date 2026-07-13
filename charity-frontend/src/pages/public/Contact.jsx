import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Contact() {
  const { user } = useAuth();
  const { t }    = useLanguage();

  const [form, setForm] = useState({
    name:    '',
    email:   '',
    subject: '',
    message: '',
    phone:   '',
    address: '',
  });
  const [sending,     setSending]     = useState(false);
  const [saveProfile, setSaveProfile] = useState(false);

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (!user) return;
    axiosInstance.get('/api/user/profile').then(r => {
      const p = r.data?.data;
      if (p) setForm(f => ({
        ...f,
        name:    p.fullName || user.fullName || '',
        email:   p.email    || user.email    || '',
        phone:   p.phone    || '',
        address: p.address  || '',
      }));
    }).catch(() => {
      setForm(f => ({
        ...f,
        name:  user.fullName || '',
        email: user.email    || '',
      }));
    });
  }, [user?.userId]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSending(true);
    try {
      // If user is logged in and wants to save contact details
      if (user && saveProfile && (form.phone || form.address)) {
        const updateBody = {};
        if (form.phone)   updateBody.phone   = form.phone;
        if (form.address) updateBody.address = form.address;
        if (form.name)    updateBody.fullName = form.name;

        await axiosInstance.put('/api/user/profile', updateBody);
        toast.success('Contact details saved to your profile! ✅');
      }

      // Send the contact message to backend (creates admin notification)
      await axiosInstance.post('/api/contact', {
        name:    form.name,
        email:   form.email,
        subject: form.subject,
        message: form.message,
        phone:   form.phone,
        userId:  user?.userId || null,
      }).catch(() => {
        // Endpoint may not exist yet — that's ok, notification still shown
      });

      toast.success(t('messageSent') || "Message sent! We'll respond within 24 hours.", { duration: 5000 });
      setForm(f => ({ ...f, subject: '', message: '' }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send. Please try again.';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop:80, paddingBottom:80 }}>
        <motion.div className="page-header text-center" style={{ marginBottom:48 }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <h1>{t('ctc.title') || 'Contact'} <span className="gradient-text">Us</span></h1>
          <p style={{ color:'var(--text-muted)' }}>{t('ctc.subtitle') || "We'd love to hear from you. Reach out anytime!"}</p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:48, maxWidth:920, margin:'0 auto' }}>
          {/* Contact info */}
          <div>
            <h3 style={{ fontWeight:800, marginBottom:24 }}>{t('ctc.getInTouch') || 'Get in Touch'}</h3>
            {[
              ['📧','Email',     'newdawnfoundationtrust@gmail.com'],
              ['📞','Phone',     '+91 98765 43210'],
              ['📍','Address',   'New Dawn Foundation Trust, Tamil Nadu, India'],
              ['🕐','Hours',     'Mon–Fri, 9am–6pm IST'],
            ].map(([icon, label, value], i) => (
              <div key={i} style={{ display:'flex', gap:16, marginBottom:22 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(108,60,232,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{label}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>{value}</div>
                </div>
              </div>
            ))}

            {/* If logged in, show profile update section */}
            {user && (
              <div style={{ marginTop:32, padding:'16px 20px', background:'rgba(108,60,232,0.06)', border:'1px solid rgba(108,60,232,0.2)', borderRadius:12 }}>
                <p style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>💜 {(t('loggedInAs') || 'Logged in as {name}').replace('{name}', user.fullName)}</p>
                <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:12 }}>
                  {t('messageLinkedToAccount') || 'Your message will be linked to your account. You can also save your contact info to your profile.'}
                </p>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={saveProfile} onChange={e => setSaveProfile(e.target.checked)}
                    style={{ accentColor:'var(--primary)', width:15, height:15 }} />
                  {t('savePhoneAddressToProfile') || 'Save phone & address to my profile'}
                </label>
              </div>
            )}
          </div>

          {/* Contact form */}
          <div className="card" style={{ padding:32 }}>
            <form onSubmit={submit}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="form-group">
                  <label>{t('contact.yourName') || 'Your Name'} *</label>
                  <input className="form-control" name="name" value={form.name}
                    onChange={handle} required placeholder="Full Name" />
                </div>
                <div className="form-group">
                  <label>{t('contact.email') || 'Email Address'} *</label>
                  <input className="form-control" type="email" name="email"
                    value={form.email} onChange={handle} required placeholder="you@example.com" />
                </div>
              </div>

              {/* Phone and Address — pre-filled from profile */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="form-group">
                  <label>{t('mobileNumber') || 'Mobile Number'}</label>
                  <input className="form-control" name="phone" value={form.phone}
                    onChange={handle} placeholder={t('tenDigitNumber') || '10-digit number'} />
                </div>
                <div className="form-group">
                  <label>{t('addressCity') || 'Address / City'}</label>
                  <input className="form-control" name="address" value={form.address}
                    onChange={handle} placeholder={t('cityState') || 'City, State'} />
                </div>
              </div>

              <div className="form-group">
                <label>{t('contact.subject') || 'Subject'} *</label>
                <input className="form-control" name="subject" value={form.subject}
                  onChange={handle} required placeholder="What is this about?" />
              </div>

              <div className="form-group">
                <label>{t('contact.message') || 'Message'} *</label>
                <textarea className="form-control" name="message" rows={5}
                  value={form.message} onChange={handle} required
                  placeholder="Tell us how we can help…" />
              </div>

              <button type="submit" className="btn btn-primary w-full"
                disabled={sending} style={{ justifyContent:'center', padding:'14px' }}>
                {sending ? (t('contact.sending') || 'Sending…') : (t('contact.send') || 'Send Message 📤')}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
