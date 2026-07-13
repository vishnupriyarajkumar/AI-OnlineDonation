import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axiosInstance from '../../api/axiosInstance';
import { useLanguage } from '../../context/LanguageContext';

/* ── Floating particle ─────────────────────────────── */
function FloatParticle({ emoji, x, y, delay }) {
  return (
    <motion.div
      style={{ position:'absolute', left:`${x}%`, top:`${y}%`, fontSize:22, pointerEvents:'none', zIndex:1 }}
      animate={{ y:[0,-24,0], opacity:[0.4,0.9,0.4], rotate:[-8,8,-8] }}
      transition={{ duration:4+delay, repeat:Infinity, delay, ease:'easeInOut' }}
    >{emoji}</motion.div>
  );
}

/* ── Animated counter ─────────────────────────────── */
function Counter({ target, prefix='', suffix='' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

/* ── Campaign card ────────────────────────────────── */
function CampaignCard({ campaign: c, index, t }) {
  const urgencyColor = { LOW:'#10b981', MEDIUM:'#f59e0b', HIGH:'#ef4444', CRITICAL:'#dc2626' };
  const pct = c.goalAmount > 0 ? Math.min(100,(c.collectedAmount/c.goalAmount)*100) : c.progressPercent||0;
  return (
    <motion.div
      className="campaign-card"
      initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }} transition={{ duration:0.5, delay:index*0.12 }}
      whileHover={{ y:-8, transition:{ duration:0.25 } }}
    >
      <div style={{ position:'relative', overflow:'hidden', height:180 }}>
        <motion.img
          src={c.imageUrl||'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600'}
          alt={c.campaignName} loading="lazy"
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
          whileHover={{ scale:1.06 }} transition={{ duration:0.4 }}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.65),transparent)' }}/>
        {c.daysRemaining<=7 && (
          <motion.div
            style={{ position:'absolute', top:10, left:10, background:'rgba(239,68,68,0.92)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99 }}
            animate={{ scale:[1,1.06,1] }} transition={{ repeat:Infinity, duration:1.5 }}
          >⏰ {c.daysRemaining}{t('camp.daysLeft')||'d left'}</motion.div>
        )}
        <div style={{ position:'absolute', top:10, right:10, background:`${urgencyColor[c.urgencyLevel]||'#7c3aed'}22`, border:`1px solid ${urgencyColor[c.urgencyLevel]||'#7c3aed'}66`, color:urgencyColor[c.urgencyLevel]||'#a78bfa', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, backdropFilter:'blur(8px)' }}>
          ⚡ {c.urgencyLevel||'MEDIUM'}
        </div>
      </div>
      <div style={{ padding:'18px 20px', flex:1, display:'flex', flexDirection:'column' }}>
        <span className="chip" style={{ fontSize:11, marginBottom:8 }}>{c.category||'General'}</span>
        <h3 style={{ fontWeight:700, fontSize:15, margin:'4px 0 6px', lineHeight:1.4 }}>{c.campaignName}</h3>
        <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, flex:1, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{c.description}</p>
        <div style={{ marginTop:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
            <span style={{ color:'var(--text-muted)' }}>₹{Number(c.collectedAmount||0).toLocaleString('en-IN')} {t('camp.raised')||'raised'}</span>
            <span style={{ fontWeight:700, color:'#10b981' }}>{pct.toFixed(0)}%</span>
          </div>
          <div className="progress-bar">
            <motion.div className="progress-fill"
              initial={{ width:0 }} whileInView={{ width:`${pct}%` }}
              viewport={{ once:true }} transition={{ duration:1.1, delay:0.3 }}
              style={{ background: pct>=80 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,var(--primary),var(--primary-light))' }}
            />
          </div>
          <Link to={`/user/donate/${c.campaignId}`} style={{ display:'block', marginTop:14 }}>
            <motion.button className="btn-primary-full" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
              {t('btn.donateNow')||'Donate Now 💜'}
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

const PARTICLES = [
  {emoji:'💜',x:7,y:18,delay:0},{emoji:'🎯',x:85,y:12,delay:1},
  {emoji:'❤️',x:12,y:72,delay:2},{emoji:'🌟',x:88,y:65,delay:0.5},
  {emoji:'💰',x:48,y:8,delay:1.5},{emoji:'🤝',x:76,y:82,delay:2.5},
  {emoji:'🌍',x:28,y:88,delay:3},{emoji:'✨',x:62,y:78,delay:0.8},
];

const DEFAULT_STATS = { totalCampaigns:24, totalDonors:1450, totalRaised:8500000, totalVolunteers:320 };

export default function Home() {
  const { t } = useLanguage();
  const [stats,     setStats]     = useState(DEFAULT_STATS);
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/stats/public').catch(()=>({ data:{ data:DEFAULT_STATS } })),
      axiosInstance.get('/api/campaigns/public').catch(()=>({ data:{ data:[] } })),
    ]).then(([s,c]) => {
      setStats(s.data?.data || DEFAULT_STATS);
      setCampaigns((c.data?.data||[]).slice(0,3));
    }).finally(()=>setLoading(false));
  }, []);

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section style={{ position:'relative', minHeight:'92vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
        <motion.div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(124,58,237,0.4) 0%, transparent 60%)', zIndex:0 }}
          animate={{ opacity:[0.7,1,0.7] }} transition={{ duration:5, repeat:Infinity }} />
        <motion.div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 70%)', right:-120, bottom:-120, zIndex:0 }}
          animate={{ scale:[1,1.15,1], rotate:[0,30,0] }} transition={{ duration:14, repeat:Infinity }} />

        {PARTICLES.map((p,i)=><FloatParticle key={i} {...p}/>)}

        <div className="container" style={{ position:'relative', zIndex:2 }}>
          <div style={{ maxWidth:700 }}>
            <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
              <span className="chip chip-glow">{t('nav.home') ? '🌍 ' + (t('transparentGiving') || 'Transparent & Secure Giving') : '🌍 Transparent & Secure Giving'}</span>
            </motion.div>

            <motion.h1
              style={{ fontSize:'clamp(38px,6vw,72px)', fontWeight:900, lineHeight:1.08, margin:'20px 0' }}
              initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1 }}
            >
              {t('landing.heroTitle')?.split(' ').slice(0,3).join(' ') || 'Change Lives with'}{' '}
              <span className="gradient-text">
                {t('landing.heroTitle')?.split(' ').slice(3,5).join(' ') || 'Every Rupee'}
              </span>{' '}
              {t('landing.heroTitle')?.split(' ').slice(5).join(' ') || 'You Give'}
            </motion.h1>

            <motion.p
              style={{ fontSize:18, color:'var(--text-muted)', marginBottom:36, maxWidth:520, lineHeight:1.7 }}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
            >
              {t('landing.heroSubtitle') || 'Join thousands of donors supporting verified campaigns. Every donation is tracked, every rupee accounted for — full financial transparency guaranteed.'}
            </motion.p>

            <motion.div style={{ display:'flex', gap:16, flexWrap:'wrap' }}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.3 }}>
              <Link to="/campaigns">
                <motion.button className="btn-hero-primary" whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:0.97 }}>
                  🚀 {t('landing.heroCta') || 'Start Donating'}
                </motion.button>
              </Link>
              <Link to="/about">
                <motion.button className="btn-hero-secondary" whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:0.97 }}>
                  {t('landing.heroStats') || 'View Our Impact'} →
                </motion.button>
              </Link>
            </motion.div>

            <motion.div style={{ display:'flex', gap:24, marginTop:36, flexWrap:'wrap' }}
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}>
              {[
                t('trustBadge1')||'🔒 Bank-grade Security',
                t('trustBadge2')||'📄 80G Tax Receipts',
                t('trustBadge3')||'✅ Verified Campaigns',
              ].map((b,i)=>(
                <span key={i} style={{ fontSize:12, color:'var(--text-muted)' }}>{b}</span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* scroll indicator */}
        <motion.div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', zIndex:2 }}
          animate={{ y:[0,8,0] }} transition={{ repeat:Infinity, duration:1.5 }}>
          <div style={{ width:28, height:44, border:'2px solid rgba(255,255,255,0.2)', borderRadius:99, display:'flex', justifyContent:'center', paddingTop:6 }}>
            <motion.div style={{ width:4, height:8, background:'var(--primary-light)', borderRadius:99 }}
              animate={{ y:[0,14,0], opacity:[1,0,1] }} transition={{ repeat:Infinity, duration:1.5 }}/>
          </div>
        </motion.div>
      </section>

      {/* ─── STATS ────────────────────────────────────────── */}
      <section style={{ padding:'70px 0', background:'rgba(124,58,237,0.04)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div className="grid-4">
            {[
              { icon:'🎯', label: t('dashboard.activeCampaigns') || 'Active Campaigns', value:stats.totalCampaigns,    suffix:'+', color:'#a78bfa' },
              { icon:'👥', label: t('totalDonors') || 'Total Donors',     value:stats.totalDonors,       suffix:'+', color:'#34d399' },
              { icon:'💰', label: t('amountRaised') || 'Amount Raised',    value:stats.totalRaised,       prefix:'₹', suffix:'', color:'#fbbf24', big:true },
              { icon:'🤝', label: t('volunteers') || 'Volunteers',       value:stats.totalVolunteers,   suffix:'+', color:'#60a5fa' },
            ].map((s,i)=>(
              <motion.div key={i} className="stat-glass-card"
                initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ duration:0.5, delay:i*0.1 }}
                whileHover={{ y:-4 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:s.big?28:34, fontWeight:900, color:s.color, lineHeight:1 }}>
                  {s.big ? <span>₹{((s.value||0)/100000).toFixed(1)}L</span>
                         : <Counter target={s.value||0} prefix={s.prefix||''} suffix={s.suffix||''}/>}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED CAMPAIGNS ───────────────────────────── */}
      <section style={{ padding:'80px 0' }}>
        <div className="container">
          <motion.div className="section-header"
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <h2 className="section-title">{t('landing.featuredCampaigns') || 'Featured'} <span className="gradient-text">Campaigns</span></h2>
            <p className="section-sub">{t('landing.featuredSubtitle') || 'Support causes that matter most right now'}</p>
          </motion.div>

          {loading ? (
            <div className="grid-3">
              {[0,1,2].map(i=>(
                <div key={i} className="skeleton-card">
                  <div className="skeleton" style={{ height:180 }}/>
                  <div style={{ padding:20 }}>
                    <div className="skeleton" style={{ height:14, width:'60%', marginBottom:10, borderRadius:8 }}/>
                    <div className="skeleton" style={{ height:12, width:'90%', marginBottom:6, borderRadius:8 }}/>
                    <div className="skeleton" style={{ height:12, width:'75%', borderRadius:8 }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid-3">
              {campaigns.map((c,i)=><CampaignCard key={c.campaignId} campaign={c} index={i} t={t}/>)}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
              <p>Campaigns loading soon — check back in a moment.</p>
            </div>
          )}

          <motion.div style={{ textAlign:'center', marginTop:40 }}
            initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
            <Link to="/campaigns">
              <motion.button className="btn-outline-primary" whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}>
                {t('viewAllCampaigns') || 'View All Campaigns'} →
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────── */}
      <section style={{ padding:'80px 0', background:'rgba(255,255,255,0.015)' }}>
        <div className="container">
          <motion.div className="section-header"
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <h2 className="section-title">{t('landing.howItWorks')||'How It'} <span className="gradient-text">{t('landing.works')||'Works'}</span></h2>
            <p className="section-sub">{t('landing.howSubtitle')||'Simple, transparent, and impactful'}</p>
          </motion.div>
          <div className="grid-3">
            {[
              { step:'01', icon:'🔍', title: t('landing.step1')||'Browse Campaigns',   desc: t('landing.step1Desc')||'Explore verified campaigns across health, education, environment and more.' },
              { step:'02', icon:'💜', title: t('landing.step2')||'Choose & Donate',    desc: t('landing.step2Desc')||'Securely donate any amount using UPI, card, or net banking.' },
              { step:'03', icon:'📈', title: t('landing.step3')||'Track Your Impact',  desc: t('landing.step3Desc')||'Receive receipts, updates, and see the difference your donation makes.' },
            ].map((s,i)=>(
              <motion.div key={i} className="how-card"
                initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.15 }}
                whileHover={{ y:-6 }}>
                <div className="step-badge">{s.step}</div>
                <div style={{ fontSize:44, margin:'14px 0 10px' }}>{s.icon}</div>
                <h3 style={{ fontWeight:700, marginBottom:8 }}>{s.title}</h3>
                <p style={{ color:'var(--text-muted)', fontSize:14, lineHeight:1.7 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRANSPARENCY ─────────────────────────────────── */}
      <section style={{ padding:'80px 0' }}>
        <div className="container">
          <div className="grid-2" style={{ alignItems:'center', gap:60 }}>
            <motion.div initial={{ opacity:0, x:-30 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}>
              <h2 className="section-title">{t('landing.fullWord')||'Full'} <span className="gradient-text">{t('landing.transparencyWord')||'Transparency'}</span></h2>
              <p style={{ color:'var(--text-muted)', marginBottom:24, lineHeight:1.8 }}>
                {t('landing.transparencyDesc')||'We believe every donor deserves to know exactly where their money goes. Track fund allocations in real time.'}
              </p>
              {[
                { icon:'🔍', title: t('landing.realtimeTracking')||'Real-time Tracking',        desc: t('landing.realtimeTrackingDesc')||'Every donation tracked from receipt to utilization.' },
                { icon:'📊', title: t('landing.fundReports')||'Fund Allocation Reports',        desc: t('landing.fundReportsDesc')||'Detailed breakdown of how funds are spent per campaign.' },
                { icon:'🔒', title: t('landing.securePayments')||'Secure Payments',             desc: t('landing.securePaymentsDesc')||'Razorpay-powered with bank-level security.' },
                { icon:'🧾', title: t('landing.taxReceipts')||'Tax Receipts',                   desc: t('landing.taxReceiptsDesc')||'Auto-generated 80G-eligible receipts for every donation.' },
              ].map((f,i)=>(
                <motion.div key={i} style={{ display:'flex', gap:14, marginBottom:18 }}
                  initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }}
                  viewport={{ once:true }} transition={{ delay:i*0.1 }}>
                  <div style={{ fontSize:24, width:40, flexShrink:0, textAlign:'center' }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight:700, marginBottom:2 }}>{f.title}</div>
                    <div style={{ fontSize:13, color:'var(--text-muted)' }}>{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div className="premium-card" style={{ padding:32 }}
              initial={{ opacity:0, x:30 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}>
              <h3 style={{ fontWeight:800, marginBottom:24 }}>📈 {t('landing.fundUtilization')||'Fund Utilization'}</h3>
              {[
                { label: t('landing.directAid')||'Direct Aid',   pct:65, color:'#a78bfa' },
                { label: t('landing.operations')||'Operations',  pct:20, color:'#34d399' },
                { label: t('landing.adminCost')||'Admin',        pct:10, color:'#fbbf24' },
                { label: t('landing.reserve')||'Reserve',        pct:5,  color:'#60a5fa' },
              ].map((b,i)=>(
                <div key={i} style={{ marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:6 }}>
                    <span>{b.label}</span><span style={{ color:b.color, fontWeight:700 }}>{b.pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div style={{ height:'100%', borderRadius:99, background:b.color }}
                      initial={{ width:0 }} whileInView={{ width:`${b.pct}%` }}
                      viewport={{ once:true }} transition={{ duration:1.2, delay:i*0.15 }}/>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section style={{ padding:'80px 0' }}>
        <div className="container">
          <motion.div className="cta-glass"
            initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}>
            {['💜','🌍','⭐','🎯'].map((e,i)=>(
              <FloatParticle key={i} emoji={e} x={8+i*26} y={15+(i%2)*55} delay={i*0.7}/>
            ))}
            <h2 style={{ fontSize:42, fontWeight:900, marginBottom:16, position:'relative', zIndex:1 }}>
              {t('landing.readyTo')||'Ready to'} <span className="gradient-text">{t('landing.makeImpact')||'Make an Impact?'}</span>
            </h2>
            <p style={{ color:'var(--text-muted)', fontSize:16, marginBottom:32, position:'relative', zIndex:1 }}>
              {t('landing.ctaSubtitle')||'Join 10,000+ donors who trust New Dawn Foundation for transparent, impactful giving.'}
            </p>
            <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', position:'relative', zIndex:1 }}>
              <Link to="/register">
                <motion.button className="btn-hero-primary" whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}>
                  {t('btn.getStarted')||'Get Started Free'}
                </motion.button>
              </Link>
              <Link to="/campaigns">
                <motion.button className="btn-hero-secondary" whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}>
                  {t('browseCampaigns')||'Browse Campaigns'}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
