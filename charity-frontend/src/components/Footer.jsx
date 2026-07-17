import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const FOOTER_COPY = {
  en: {
    tagline: 'Together we can change the world. Every rupee you donate makes a real, transparent, and lasting impact.',
    quickLinks: 'Quick Links', forDonors: 'For Donors', contact: 'Contact Us',
    privacy: 'Privacy Policy', terms: 'Terms & Conditions', faq: 'FAQ',
    copyright: 'All rights reserved.',
    trust: ['🔒 SSL Secured', '📄 80G Eligible', '✅ FCRA Compliant', '💳 Razorpay Powered'],
  },
  ta: {
    tagline: 'ஒன்றாக நாம் உலகை மாற்றலாம். நீங்கள் கொடுக்கும் ஒவ்வொரு ரூபாயும் உண்மையான தாக்கத்தை ஏற்படுத்துகிறது.',
    quickLinks: 'விரைவு இணைப்புகள்', forDonors: 'நன்கொடையாளர்களுக்கு', contact: 'தொடர்பு கொள்ளுங்கள்',
    privacy: 'தனியுரிமை கொள்கை', terms: 'விதிமுறைகள்', faq: 'அடிக்கடி கேட்கும் கேள்விகள்',
    copyright: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    trust: ['🔒 SSL பாதுகாப்பு', '📄 80G தகுதி', '✅ FCRA இணக்கம்', '💳 Razorpay மூலம்'],
  },
  hi: {
    tagline: 'साथ मिलकर हम दुनिया बदल सकते हैं। आपका हर रुपया एक वास्तविक, पारदर्शी और स्थायी प्रभाव डालता है।',
    quickLinks: 'त्वरित लिंक', forDonors: 'दाताओं के लिए', contact: 'संपर्क करें',
    privacy: 'गोपनीयता नीति', terms: 'नियम और शर्तें', faq: 'अक्सर पूछे जाने वाले प्रश्न',
    copyright: 'सभी अधिकार सुरक्षित।',
    trust: ['🔒 SSL सुरक्षित', '📄 80G पात्र', '✅ FCRA अनुपालन', '💳 Razorpay द्वारा'],
  },
  te: {
    tagline: 'కలిసి మనం ప్రపంచాన్ని మార్చగలం. మీరు ఇచ్చే ప్రతి రూపాయి నిజమైన, పారదర్శకమైన ప్రభావాన్ని చూపుతుంది.',
    quickLinks: 'త్వరిత లింకులు', forDonors: 'దాతలకు', contact: 'సంప్రదించండి',
    privacy: 'గోప్యతా విధానం', terms: 'నిబంధనలు', faq: 'తరచుగా అడిగే ప్రశ్నలు',
    copyright: 'అన్ని హక్కులు సంరక్షించబడ్డాయి.',
    trust: ['🔒 SSL భద్రత', '📄 80G అర్హత', '✅ FCRA అనుకూలత', '💳 Razorpay ద్వారా'],
  },
  ml: {
    tagline: 'ഒരുമിച്ച് നമുക്ക് ലോകം മാറ്റാം. നിങ്ങൾ കൊടുക്കുന്ന ഓരോ രൂപയും യഥാർഥ, സുതാര്യ ആഘാതം ഉണ്ടാക്കുന്നു.',
    quickLinks: 'ദ്രുത ലിങ്കുകൾ', forDonors: 'ദാതാക്കൾക്ക്', contact: 'ബന്ധപ്പെടൂ',
    privacy: 'സ്വകാര്യതാ നയം', terms: 'നിബന്ധനകൾ', faq: 'പതിവ് ചോദ്യങ്ങൾ',
    copyright: 'എല്ലാ അവകാശങ്ങളും സംരക്ഷിച്ചിരിക്കുന്നു.',
    trust: ['🔒 SSL സുരക്ഷ', '📄 80G യോഗ്യത', '✅ FCRA അനുകൂലം', '💳 Razorpay വഴി'],
  },
  kn: {
    tagline: 'ಒಟ್ಟಾಗಿ ನಾವು ಜಗತ್ತನ್ನು ಬದಲಾಯಿಸಬಹುದು. ನೀವು ಕೊಡುವ ಪ್ರತಿ ರೂಪಾಯಿ ನಿಜವಾದ, ಪಾರದರ್ಶಕ ಪ್ರಭಾವ ಬೀರುತ್ತದೆ.',
    quickLinks: 'ತ್ವರಿತ ಲಿಂಕ್‌ಗಳು', forDonors: 'ದಾನಿಗಳಿಗೆ', contact: 'ಸಂಪರ್ಕಿಸಿ',
    privacy: 'ಗೌಪ್ಯತಾ ನೀತಿ', terms: 'ನಿಯಮಗಳು', faq: 'ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು',
    copyright: 'ಎಲ್ಲ ಹಕ್ಕುಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
    trust: ['🔒 SSL ಸುರಕ್ಷಿತ', '📄 80G ಅರ್ಹತೆ', '✅ FCRA ಅನುಕೂಲತೆ', '💳 Razorpay ಮೂಲಕ'],
  },
};

export default function Footer() {
  const { t, lang } = useLanguage();
  const year = new Date().getFullYear();
  const c = FOOTER_COPY[lang] || FOOTER_COPY.en;

  const NAV_LINKS = [
    { to: '/',          label: t('nav.home')      || 'Home' },
    { to: '/campaigns', label: t('nav.campaigns') || 'Campaigns' },
    { to: '/contact',   label: t('nav.contact')   || 'Contact' },
  ];

  const DONOR_LINKS = [
    { to: '/login',             label: t('nav.login')    || 'Login' },
    { to: '/register',          label: t('nav.register') || 'Register' },
    { to: '/user/donations',    label: t('myDonations')  || 'My Donations' },
    { to: '/user/subscription', label: t('nav.monthlyGiving') || 'Monthly Giving' },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          {/* Brand column */}
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              <span className="gradient-text">💜 New Dawn Foundation Trust</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
              {c.tagline}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {['🌐', '📘', '🐦', '📸'].map((icon, i) => (
                <motion.a key={i} href="#" whileHover={{ scale: 1.15, y: -2 }}
                  style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="footer-section">
            <h4>{c.quickLinks}</h4>
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}>
                <motion.span whileHover={{ x: 4, color: 'var(--primary-light)' }}
                  style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, transition: 'color 0.2s' }}>
                  → {label}
                </motion.span>
              </Link>
            ))}
          </div>

          {/* For Donors */}
          <div className="footer-section">
            <h4>{c.forDonors}</h4>
            {DONOR_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}>
                <motion.span whileHover={{ x: 4, color: 'var(--primary-light)' }}
                  style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, transition: 'color 0.2s' }}>
                  → {label}
                </motion.span>
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h4>{c.contact}</h4>
            {[
              { icon: '✉️', text: 'newdawnfoundationtrust@gmail.com' },
              { icon: '📞', text: '+91 98765 43210' },
              { icon: '📍', text: 'Tamil Nadu, India' },
              { icon: '⏰', text: 'Mon–Sat, 9 AM – 6 PM' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', padding: '20px 0', borderTop: '1px solid rgba(167,139,250,0.08)', borderBottom: '1px solid rgba(167,139,250,0.08)', marginBottom: 20 }}>
          {c.trust.map((badge, i) => (
            <span key={i} style={{ fontSize: 12, color: 'var(--text-muted)' }}>{badge}</span>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <span>© {year} New Dawn Foundation Trust. {c.copyright}</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[c.privacy, c.terms, c.faq].map((label, i) => (
              <Link key={i} to="#">
                <motion.span whileHover={{ color: 'var(--primary-light)' }}
                  style={{ color: 'var(--text-muted)', fontSize: 12, transition: 'color 0.2s' }}>
                  {label}
                </motion.span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
