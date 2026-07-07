import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function About() {
  const { t } = useLanguage();
  const team = [
    { name:'Priya Sharma', role: t('execDirector') || 'Executive Director', emoji:'👩‍💼' },
    { name:'Rahul Verma',  role: t('techLead')      || 'Tech Lead',           emoji:'👨‍💻' },
    { name:'Anita Singh',  role: t('campaignMgr')   || 'Campaign Manager',    emoji:'👩‍🎨' },
    { name:'Dev Patel',    role: t('financeOfficer') || 'Finance Officer',     emoji:'👨‍💼' },
  ];
  return (
    <div>
      <Navbar />
      <section style={{ paddingTop:80, paddingBottom:80 }}>
        <div className="container">
          <div className="text-center page-header">
            <h1>{t('about')} <span className="gradient-text">CharityOrg</span></h1>
            <p>{t('aboutSubtitle') || 'Empowering communities through transparent giving since 2024'}</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center', marginBottom:80 }}>
            <div>
              <h2 style={{ fontSize:28, fontWeight:800, marginBottom:16 }}>{t('ourMission') || 'Our Mission'}</h2>
              <p style={{ color:'var(--text-muted)', lineHeight:1.8, marginBottom:16 }}>
                {t('missionDesc1') || 'CharityOrg was founded with a simple but powerful mission — to eliminate the trust gap between donors and charities. We believe every rupee donated should be accounted for, every campaign should be transparent, and every donor should feel the direct impact.'}
              </p>
              <p style={{ color:'var(--text-muted)', lineHeight:1.8 }}>
                {t('missionDesc2') || 'Through technology, we connect verified campaigns with generous donors, ensuring funds reach those who need them most with full financial accountability.'}
              </p>
            </div>
            <div className="card" style={{ padding:32 }}>
              <h3 style={{ fontWeight:800, marginBottom:20 }}>🎯 {t('ourValues') || 'Our Values'}</h3>
              {[
                t('value1') || 'Transparency — Every rupee tracked publicly',
                t('value2') || 'Security — Bank-grade payment encryption',
                t('value3') || 'Impact — Measurable outcomes for every campaign',
                t('value4') || 'Community — Building bridges between givers & receivers'
              ].map((v,i) => (
                <div key={i} style={{ display:'flex', gap:12, marginBottom:14, fontSize:14 }}>
                  <span style={{ color:'var(--accent)' }}>✓</span>
                  <span style={{ color:'var(--text-muted)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center" style={{ marginBottom:48 }}>
            <h2 style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>{t('meetThe') || 'Meet the'} <span className="gradient-text">{t('team') || 'Team'}</span></h2>
          </div>
          <div className="grid-4">
            {team.map((t,i) => (
              <div key={i} className="card text-center" style={{ padding:28 }}>
                <div style={{ fontSize:52, marginBottom:12 }}>{t.emoji}</div>
                <div style={{ fontWeight:700 }}>{t.name}</div>
                <div style={{ color:'var(--text-muted)', fontSize:13 }}>{t.role}</div>
              </div>
            ))}
          </div>
          <div className="text-center" style={{ marginTop:60 }}>
            <Link to="/campaigns" className="btn btn-primary btn-lg">{t('supportCampaign') || 'Support a Campaign'} →</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
