import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLanguage } from '../../context/LanguageContext';

const COPY = {
  en: { pageTitle:'About', pageHighlight:'New Dawn Foundation', subtitle:'Empowering communities through transparent giving since 2020', missionTitle:'Our Mission', mission1:'New Dawn Foundation Trust was founded with a simple but powerful mission — to eliminate the trust gap between donors and charities. We believe every rupee donated should be accounted for, every campaign should be transparent, and every donor should feel the direct impact.', mission2:'Through technology, we connect verified campaigns with generous donors, ensuring funds reach those who need them most with full financial accountability.', valuesTitle:'🎯 Our Values', values:['Transparency — Every rupee tracked publicly','Security — Bank-grade payment encryption','Impact — Measurable outcomes for every campaign','Community — Building bridges between givers & receivers'], donors:'Donors', campaigns:'Campaigns', raised:'Raised', volunteers:'Volunteers', ctaBtn:'Support a Campaign →' },
  ta: { pageTitle:'பற்றி', pageHighlight:'நியூ டான் ஃபவுண்டேஷன்', subtitle:'2020 முதல் வெளிப்படையான நன்கொடை மூலம் சமூகங்களை வலுப்படுத்துகிறோம்', missionTitle:'எங்கள் நோக்கம்', mission1:'நியூ டான் ஃபவுண்டேஷன் நன்கொடையாளர்களுக்கும் தொண்டு நிறுவனங்களுக்கும் இடையிலான நம்பிக்கை இடைவெளியை நீக்கும் நோக்கத்துடன் நிறுவப்பட்டது.', mission2:'தொழில்நுட்பத்தின் மூலம் சரிபார்க்கப்பட்ட பிரச்சாரங்களை தாராள நன்கொடையாளர்களுடன் இணைக்கிறோம்.', valuesTitle:'🎯 எங்கள் மதிப்புகள்', values:['வெளிப்படைத்தன்மை — ஒவ்வொரு ரூபாயும் கண்காணிக்கப்படும்','பாதுகாப்பு — வங்கி அளவிலான கட்டண குறியாக்கம்','தாக்கம் — அளவிடக்கூடிய முடிவுகள்','சமூகம் — பாலங்கள் கட்டுதல்'], donors:'நன்கொடையாளர்கள்', campaigns:'பிரச்சாரங்கள்', raised:'திரட்டப்பட்டது', volunteers:'தன்னார்வலர்கள்', ctaBtn:'பிரச்சாரத்தை ஆதரியுங்கள் →' },
  hi: { pageTitle:'के बारे में', pageHighlight:'न्यू डॉन फाउंडेशन', subtitle:'2020 से पारदर्शी दान के माध्यम से समुदायों को सशक्त बना रहे हैं', missionTitle:'हमारा मिशन', mission1:'न्यू डॉन फाउंडेशन ट्रस्ट दाताओं और धर्मार्थ संस्थाओं के बीच विश्वास की खाई को पाटने के मिशन के साथ स्थापित किया गया था।', mission2:'प्रौद्योगिकी के माध्यम से, हम सत्यापित अभियानों को उदार दाताओं से जोड़ते हैं।', valuesTitle:'🎯 हमारे मूल्य', values:['पारदर्शिता — हर रुपया ट्रैक','सुरक्षा — बैंक-ग्रेड एन्क्रिप्शन','प्रभाव — मापने योग्य परिणाम','समुदाय — पुल बनाना'], donors:'दाता', campaigns:'अभियान', raised:'जुटाया', volunteers:'स्वयंसेवक', ctaBtn:'एक अभियान का समर्थन करें →' },
  te: { pageTitle:'గురించి', pageHighlight:'న్యూ డాన్ ఫౌండేషన్', subtitle:'2020 నుండి పారదర్శక విరాళాల ద్వారా సమాజాలను సాధికారత పరుస్తున్నాం', missionTitle:'మా లక్ష్యం', mission1:'న్యూ డాన్ ఫౌండేషన్ ట్రస్ట్ దాతలు మరియు స్వచ్ఛంద సంస్థల మధ్య విశ్వాస అంతరాన్ని తొలగించాలనే లక్ష్యంతో స్థాపించబడింది.', mission2:'సాంకేతికత ద్వారా ధృవీకరించబడిన ప్రచారాలను ఉదారమైన దాతలతో కలుపుతాం.', valuesTitle:'🎯 మా విలువలు', values:['పారదర్శకత','భద్రత — బ్యాంక్-గ్రేడ్','ప్రభావం — కొలవగల ఫలితాలు','సమాజం — వంతెనలు నిర్మించడం'], donors:'దాతలు', campaigns:'ప్రచారాలు', raised:'సేకరించారు', volunteers:'స్వచ్ఛంద సేవకులు', ctaBtn:'ప్రచారాన్ని మద్దతు ఇవ్వండి →' },
  ml: { pageTitle:'ഞങ്ങളെ കുറിച്ച്', pageHighlight:'ന്യൂ ഡോൺ ഫൗണ്ടേഷൻ', subtitle:'2020 മുതൽ സുതാര്യ ദാനത്തിലൂടെ സമൂഹങ്ങളെ ശക്തിപ്പെടുത്തുന്നു', missionTitle:'ഞങ്ങളുടെ ദൗത്യം', mission1:'ദാതാക്കളും ചാരിറ്റി സ്ഥാപനങ്ങളും തമ്മിലുള്ള വിശ്വാസ വിടവ് ഇല്ലാതാക്കാൻ ന്യൂ ഡോൺ ഫൗണ്ടേഷൻ ട്രസ്റ്റ് സ്ഥാപിതമായി.', mission2:'സാങ്കേതിക വിദ്യയിലൂടെ പരിശോധിക്കപ്പെട്ട കാമ്പെയ്‌നുകളെ ഉദാര ദാതാക്കളുമായി ബന്ധിപ്പിക്കുന്നു.', valuesTitle:'🎯 ഞങ്ങളുടെ മൂല്യങ്ങൾ', values:['സുതാര്യത','സുരക്ഷ — ബാങ്ക്-ഗ്രേഡ്','ആഘാതം — അളക്കാവുന്ന ഫലങ്ങൾ','സമൂഹം — പാലങ്ങൾ'], donors:'ദാതാക്കൾ', campaigns:'കാമ്പെയ്‌നുകൾ', raised:'ശേഖരിച്ചു', volunteers:'സന്നദ്ധ സേവകർ', ctaBtn:'ഒരു കാമ്പെയ്‌ൻ പിന്തുണക്കൂ →' },
  kn: { pageTitle:'ಬಗ್ಗೆ', pageHighlight:'ನ್ಯೂ ಡಾನ್ ಫೌಂಡೇಶನ್', subtitle:'2020 ರಿಂದ ಪಾರದರ್ಶಕ ದೇಣಿಗೆಯ ಮೂಲಕ ಸಮುದಾಯಗಳನ್ನು ಸಶಕ್ತಗೊಳಿಸುತ್ತಿದ್ದೇವೆ', missionTitle:'ನಮ್ಮ ಮಿಷನ್', mission1:'ಪಾರದರ್ಶಕ ದೇಣಿಗೆ ಮೂಲಕ ದಾನಿಗಳು ಮತ್ತು ದಾತೃ ಸಂಸ್ಥೆಗಳ ನಡುವಿನ ವಿಶ್ವಾಸದ ಅಂತರ ತೊಡೆಯಲು ಸ್ಥಾಪಿಸಲಾಯಿತು.', mission2:'ತಂತ್ರಜ್ಞಾನದ ಮೂಲಕ ಪರಿಶೀಲಿತ ಅಭಿಯಾನಗಳನ್ನು ಉದಾರ ದಾನಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತೇವೆ.', valuesTitle:'🎯 ನಮ್ಮ ಮೌಲ್ಯಗಳು', values:['ಪಾರದರ್ಶಕತೆ','ಭದ್ರತೆ — ಬ್ಯಾಂಕ್-ಗ್ರೇಡ್','ಪ್ರಭಾವ — ಅಳೆಯಬಹುದಾದ ಫಲಿತಾಂಶ','ಸಮುದಾಯ — ಸೇತುವೆ ನಿರ್ಮಾಣ'], donors:'ದಾನಿಗಳು', campaigns:'ಅಭಿಯಾನಗಳು', raised:'ಸಂಗ್ರಹಿಸಲಾಗಿದೆ', volunteers:'ಸ್ವಯಂಸೇವಕರು', ctaBtn:'ಅಭಿಯಾನ ಬೆಂಬಲಿಸಿ →' },
};

export default function About() {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY.en;

  return (
    <div>
      <Navbar />
      <section style={{ paddingTop:80, paddingBottom:80 }}>
        <div className="container">
          <motion.div style={{ textAlign:'center', marginBottom:60 }}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
            <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:900, marginBottom:12 }}>
              {c.pageTitle} <span className="gradient-text">{c.pageHighlight}</span>
            </h1>
            <p style={{ color:'var(--text-muted)', fontSize:16 }}>{c.subtitle}</p>
          </motion.div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center', marginBottom:80 }}>
            <motion.div initial={{ opacity:0, x:-30 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }} transition={{ duration:0.5 }}>
              <h2 style={{ fontSize:28, fontWeight:800, marginBottom:16 }}>{c.missionTitle}</h2>
              <p style={{ color:'var(--text-muted)', lineHeight:1.8, marginBottom:16 }}>{c.mission1}</p>
              <p style={{ color:'var(--text-muted)', lineHeight:1.8 }}>{c.mission2}</p>
            </motion.div>
            <motion.div className="card" style={{ padding:32 }}
              initial={{ opacity:0, x:30 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }} transition={{ duration:0.5 }}>
              <h3 style={{ fontWeight:800, marginBottom:20 }}>{c.valuesTitle}</h3>
              {c.values.map((v,i)=>(
                <motion.div key={i} style={{ display:'flex', gap:12, marginBottom:14, fontSize:14 }}
                  initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }}
                  viewport={{ once:true }} transition={{ delay:i*0.1 }}>
                  <span style={{ color:'var(--accent)', flexShrink:0 }}>✓</span>
                  <span style={{ color:'var(--text-muted)' }}>{v}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="grid-4" style={{ marginBottom:60 }}>
            {[{icon:'💜',num:'10,000+',label:c.donors},{icon:'🎯',num:'50+',label:c.campaigns},{icon:'💰',num:'₹85L+',label:c.raised},{icon:'🤝',num:'320+',label:c.volunteers}].map((s,i)=>(
              <motion.div key={i} className="stat-glass-card"
                initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.1 }}
                whileHover={{ y:-4 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:32, fontWeight:900, color:'var(--primary-light)' }}>{s.num}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div style={{ textAlign:'center' }}
            initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
            <Link to="/campaigns">
              <motion.button className="btn-hero-primary" whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}>
                {c.ctaBtn}
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
