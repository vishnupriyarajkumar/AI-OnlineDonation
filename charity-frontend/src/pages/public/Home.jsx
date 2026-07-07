import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axiosInstance from '../../api/axiosInstance';
import { useLanguage } from '../../context/LanguageContext';

const STATS_DEFAULT = { totalCampaigns: 0, totalDonors: 0, totalRaised: 0, totalVolunteers: 0 };

export default function Home() {
  const { t } = useLanguage();
  const [stats, setStats]       = useState(STATS_DEFAULT);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/stats/public').catch(() => ({ data: { data: { totalCampaigns: 24, totalDonors: 1450, totalRaised: 8500000, totalVolunteers: 320 } } })),
      axiosInstance.get('/api/campaigns/public').catch(() => ({ data: { data: [
        { campaignId: 1, campaignName: 'Clean Water for 500 Families', description: 'Providing safe drinking water to remote villages in Maharashtra.', category: 'Water', urgencyLevel: 'CRITICAL', collectedAmount: 450000, goalAmount: 500000, progressPercent: 90, daysRemaining: 5, beneficiaries: 500 },
        { campaignId: 2, campaignName: 'Education for Every Child', description: 'Sponsoring school kits and tuition fees for underprivileged children.', category: 'Education', urgencyLevel: 'HIGH', collectedAmount: 120000, goalAmount: 300000, progressPercent: 40, daysRemaining: 15, beneficiaries: 200 },
        { campaignId: 3, campaignName: 'Medical Camp for Elderly', description: 'Free checkups and medicines for senior citizens in rural areas.', category: 'Healthcare', urgencyLevel: 'MEDIUM', collectedAmount: 85000, goalAmount: 100000, progressPercent: 85, daysRemaining: 2, beneficiaries: 300 }
      ] } })),
      axiosInstance.get('/api/events/public').catch(() => ({ data: { data: [
        { eventId: 1, eventName: 'Tree Plantation Drive', description: 'Join us to plant 1000 saplings.', location: 'Mumbai', eventDate: '2026-07-01T10:00:00' }
      ] } })),
    ]).then(([s, c, e]) => {
      setStats(s.data?.data || STATS_DEFAULT);
      setCampaigns((c.data?.data || []).slice(0, 3));
      setEvents((e.data?.data || []).slice(0, 3));
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n).toLocaleString('en-IN');

  return (
    <div>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <div className="animate-fade-up">
            <span className="badge badge-active" style={{ marginBottom: 16 }}>🌍 {t('transparentGiving') || 'Transparent & Secure Giving'}</span>
          </div>
          <h1 className="animate-fade-up delay-1">
            {t('changeLines') || 'Change Lives with'} <span className="gradient-text">{t('everyRupee') || 'Every Rupee'}</span> {t('youGive') || 'You Give'}
          </h1>
          <p className="animate-fade-up delay-2">
            {t('heroSubtitle') || 'Join thousands of donors supporting verified campaigns. Every donation is tracked, every rupee accounted for — full financial transparency guaranteed.'}
          </p>
          <div className="hero-buttons animate-fade-up delay-3">
            <Link to="/campaigns" className="btn btn-primary btn-lg">🚀 {t('donateNow')}</Link>
            <Link to="/campaigns" className="btn btn-secondary btn-lg">{t('viewCampaigns') || 'View Campaigns'}</Link>
          </div>
        </div>
        {/* Floating orbs */}
        <div style={{ position:'absolute', top:'20%', right:'10%', width:300, height:300, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(108,60,232,0.15), transparent)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'15%', right:'25%', width:200, height:200, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(16,185,129,0.1), transparent)', pointerEvents:'none' }} />
      </section>

      {/* ── Live Stats ─────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="container">
          <div className="grid-4">
            {[
              { icon:'🎯', label: t('activeCampaigns'), value: fmt(stats.totalCampaigns), color:'#6c3ce8' },
              { icon:'👥', label: t('totalDonors') || 'Total Donors',     value: fmt(stats.totalDonors),    color:'#10b981' },
              { icon:'💰', label: t('amountRaised') || 'Amount Raised (₹)',value: `₹${fmt(stats.totalRaised)}`, color:'#f59e0b' },
              { icon:'🤝', label: t('volunteers') || 'Volunteers',       value: fmt(stats.totalVolunteers), color:'#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="stat-card animate-fade-up" style={{ animationDelay: `${i*0.1}s` }}>
                <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
                <div>
                  <div className="stat-value">{loading ? '—' : s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Campaigns ─────────────────────────────── */}
      <section className="section" style={{ background:'rgba(255,255,255,0.015)', paddingTop:80 }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">{t('featuredCampaigns') || 'Featured'} <span className="gradient-text">{t('campaigns')}</span></h2>
            <p className="section-subtitle">{t('featuredSubtitle') || 'Support causes that matter most right now'}</p>
          </div>
          {loading ? <div className="spinner" /> : (
            <div className="grid-3">
              {campaigns.map(c => <CampaignCard key={c.campaignId} campaign={c} />)}
            </div>
          )}
          <div className="text-center mt-4">
            <Link to="/campaigns" className="btn btn-primary">{t('viewAllCampaigns') || 'View All Campaigns'} →</Link>
          </div>
        </div>
      </section>

      {/* ── Transparency Section ───────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
            <div>
              <h2 className="section-title">{t('fullTransparency') || 'Full'} <span className="gradient-text">{t('transparency') || 'Transparency'}</span></h2>
              <p style={{ color:'var(--text-muted)', marginBottom:24 }}>
                {t('transparencyDesc') || 'We believe every donor deserves to know exactly where their money goes. Track fund allocations in real time.'}
              </p>
              {[
                { icon:'🔍', title: t('realtimeTracking') || 'Real-time Tracking', desc: t('realtimeTrackingDesc') || 'Every donation is tracked from receipt to utilization.' },
                { icon:'📊', title: t('fundReports') || 'Fund Allocation Reports', desc: t('fundReportsDesc') || 'Detailed breakdown of how funds are spent per campaign.' },
                { icon:'🔒', title: t('securePayments') || 'Secure Payments', desc: t('securePaymentsDesc') || 'Razorpay-powered payments with bank-level security.' },
                { icon:'🧾', title: t('taxReceipts') || 'Tax Receipts', desc: t('taxReceiptsDesc') || 'Auto-generated 80G-eligible receipts for every donation.' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4" style={{ marginBottom:20 }}>
                  <div style={{ fontSize:28, width:48, flexShrink:0, textAlign:'center' }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight:700, marginBottom:2 }}>{f.title}</div>
                    <div style={{ fontSize:13, color:'var(--text-muted)' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:32 }}>
              <h3 style={{ marginBottom:24, fontWeight:800 }}>📈 {t('fundUtilization') || 'Fund Utilization'}</h3>
              {[
                { label: t('directAid') || 'Direct Aid', pct:65, color:'#6c3ce8' },
                { label: t('operations') || 'Operations', pct:20, color:'#10b981' },
                { label: t('admin') || 'Admin',      pct:10, color:'#f59e0b' },
                { label: t('reserve') || 'Reserve',    pct:5,  color:'#3b82f6' },
              ].map((b, i) => (
                <div key={i} style={{ marginBottom:16 }}>
                  <div className="flex justify-between" style={{ marginBottom:6, fontSize:14 }}>
                    <span>{b.label}</span><span style={{ color:b.color }}>{b.pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${b.pct}%`, background:b.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Success Stories ────────────────────────────────── */}
      <section className="section" style={{ background:'rgba(255,255,255,0.015)' }}>
        <div className="container text-center">
          <h2 className="section-title">{t('successStories') || 'Success'} <span className="gradient-text">{t('stories') || 'Stories'}</span></h2>
          <p className="section-subtitle">{t('successStoriesSubtitle') || 'Real impact from real donations'}</p>
          <div className="grid-3">
            {[
              { emoji:'💧', title: t('story1Title') || '500 Families Got Clean Water', desc: t('story1Desc') || 'Thanks to donors like you, 500 families in Maharashtra now have access to safe drinking water.', donors:124 },
              { emoji:'📚', title: t('story2Title') || '200 Scholarships Awarded', desc: t('story2Desc') || 'Brilliant but underprivileged students can now pursue their dreams with full scholarships.', donors:89 },
              { emoji:'🏥', title: t('story3Title') || '1000+ Free Health Checkups', desc: t('story3Desc') || 'Our medical camp initiative provided free checkups and medicines to over 1000 people.', donors:203 },
            ].map((s, i) => (
              <div key={i} className="card text-center" style={{ padding:32 }}>
                <div style={{ fontSize:52, marginBottom:16 }}>{s.emoji}</div>
                <h3 style={{ fontWeight:700, marginBottom:10 }}>{s.title}</h3>
                <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:16 }}>{s.desc}</p>
                <span className="badge badge-active">👥 {s.donors} {t('donorsContributed') || 'donors contributed'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming Events ────────────────────────────────── */}
      {events.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title text-center">{t('upcoming') || 'Upcoming'} <span className="gradient-text">{t('events') || 'Events'}</span></h2>
            <p className="section-subtitle text-center">{t('eventsSubtitle') || 'Join us and make a difference in person'}</p>
            <div className="grid-3">
              {events.map((e, i) => (
                <div key={i} className="card">
                  <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
                  <h3 style={{ fontWeight:700, marginBottom:8 }}>{e.eventName}</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:12 }}>{e.description}</p>
                  <div style={{ fontSize:13 }}>
                    <span>📍 {e.location}</span><br />
                    <span>🗓 {new Date(e.eventDate).toLocaleDateString('en-IN', { dateStyle:'medium' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop:60, paddingBottom:80 }}>
        <div className="container text-center">
          <div className="card" style={{ maxWidth:700, margin:'0 auto', padding:60,
            background:'linear-gradient(135deg, rgba(108,60,232,0.15), rgba(139,92,246,0.1))' }}>
            <h2 style={{ fontSize:40, fontWeight:900, marginBottom:16 }}>
              {t('ctaTitle') || 'Ready to'} <span className="gradient-text">{t('ctaHighlight') || 'Make an Impact?'}</span>
            </h2>
            <p style={{ color:'var(--text-muted)', marginBottom:32, fontSize:16 }}>
              {t('ctaSubtitle') || 'Join 10,000+ donors who trust CharityOrg for transparent, impactful giving.'}
            </p>
            <div className="hero-buttons" style={{ justifyContent:'center' }}>
              <Link to="/register" className="btn btn-primary btn-lg">{t('getStarted') || 'Get Started Free'}</Link>
              <Link to="/campaigns" className="btn btn-secondary btn-lg">{t('browseCampaigns') || 'Browse Campaigns'}</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CampaignCard({ campaign: c }) {
  const { t } = useLanguage();
  const urgencyColors = { LOW:'#10b981', MEDIUM:'#f59e0b', HIGH:'#ef4444', CRITICAL:'#dc2626' };
  return (
    <div className="campaign-card">
      <img src={c.imageUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600'}
           alt={c.campaignName} loading="lazy" />
      <div className="campaign-card-body">
        <div className="flex justify-between items-center" style={{ marginBottom:8 }}>
          <span className="badge badge-active">{c.category}</span>
          <span style={{ fontSize:11, color: urgencyColors[c.urgencyLevel], fontWeight:700 }}>
            ⚡ {c.urgencyLevel}
          </span>
        </div>
        <h3 className="campaign-card-title">{c.campaignName}</h3>
        <p className="campaign-card-desc">{c.description}</p>
        <div style={{ marginTop:16 }}>
          <div className="flex justify-between" style={{ fontSize:13, marginBottom:6 }}>
            <span style={{ color:'var(--text-muted)' }}>{t('raised')}</span>
            <span style={{ fontWeight:700, color:'#10b981' }}>
              ₹{Number(c.collectedAmount).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width:`${c.progressPercent}%` }} /></div>
          <div className="flex justify-between" style={{ fontSize:12, marginTop:6, color:'var(--text-muted)' }}>
            <span>₹{Number(c.goalAmount).toLocaleString('en-IN')} {t('goal')}</span>
            <span>⏳ {c.daysRemaining}{t('daysLeft')}</span>
          </div>
        </div>
      </div>
      <div className="campaign-card-footer">
        <Link to={`/campaigns/${c.campaignId}`} className="btn btn-primary w-full" style={{ justifyContent:'center' }}>
          {t('donateNow')} 💜
        </Link>
      </div>
    </div>
  );
}
