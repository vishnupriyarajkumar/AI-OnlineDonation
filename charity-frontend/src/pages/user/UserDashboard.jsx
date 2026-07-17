import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axiosInstance from '../../api/axiosInstance';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';
import GamificationWidget from '../../components/GamificationWidget';
import VoiceAssistant from '../../components/VoiceAssistant';

/* ── Stat Card ─────────────────────────────────────── */
function StatCard({ icon, label, value, color, delay, prefix='', suffix='' }) {
  return (
    <motion.div className="stat-card"
      initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.5, delay }} whileHover={{ y:-4, scale:1.02 }}>
      <div className="stat-icon" style={{ background:`${color}20`, border:`1px solid ${color}40` }}>
        <span style={{ fontSize:22 }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value" style={{ color }}>{prefix}{value}{suffix}</div>
        <div className="stat-label">{label}</div>
      </div>
    </motion.div>
  );
}

/* ── Donation Row ─────────────────────────────────── */
function DonationRow({ d, i }) {
  const statusColors = { COMPLETED:'#10b981', PENDING:'#f59e0b', FAILED:'#ef4444' };
  return (
    <motion.tr initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: i * 0.06 }}>
      <td style={{ fontWeight:600 }}>#{d.donationId}</td>
      <td style={{ fontSize:12, color:'var(--text-muted)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.campaignName}</td>
      <td style={{ fontWeight:700, color:'#a78bfa' }}>₹{Number(d.amount).toLocaleString('en-IN')}</td>
      <td><span className="badge" style={{ background:`${statusColors[d.status]||'#888'}22`, color:statusColors[d.status]||'#888', border:`1px solid ${statusColors[d.status]||'#888'}44` }}>{d.status}</span></td>
      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{d.donationDate ? new Date(d.donationDate).toLocaleDateString('en-IN') : '—'}</td>
    </motion.tr>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [donations,  setDonations]  = useState([]);
  const [stats,      setStats]      = useState({ totalDonated: 0, campaignsBacked: 0, totalTransactions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [sub,        setSub]        = useState(null);
  const [campaigns,  setCampaigns]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [greeting,   setGreeting]   = useState('');
  const [profile,    setProfile]    = useState(null);

  const firstName = user?.fullName?.split(' ')[0] || 'Friend';
  const hour = new Date().getHours();

  useEffect(() => {
    const greetings = {
      en: hour < 12 ? '🌅 Good morning' : hour < 17 ? '☀️ Good afternoon' : '🌙 Good evening',
      ta: hour < 12 ? '🌅 காலை வணக்கம்' : hour < 17 ? '☀️ மதிய வணக்கம்' : '🌙 மாலை வணக்கம்',
      hi: hour < 12 ? '🌅 सुप्रभात' : hour < 17 ? '☀️ नमस्कार' : '🌙 शुभ संध्या',
      te: hour < 12 ? '🌅 శుభోదయం' : hour < 17 ? '☀️ నమస్కారం' : '🌙 శుభ సాయంత్రం',
      ml: hour < 12 ? '🌅 സുപ്രഭാതം' : hour < 17 ? '☀️ നമസ്കാരം' : '🌙 ശുഭ സന്ധ്യ',
      kn: hour < 12 ? '🌅 ಶುಭೋದಯ' : hour < 17 ? '☀️ ನಮಸ್ಕಾರ' : '🌙 ಶುಭ ಸಂಜೆ',
    };
    const g = greetings[lang] || greetings.en;
    setGreeting(`${g}, ${firstName}!`);
  }, [firstName, hour, lang]);

  useEffect(() => {
    // Fetch stats separately for real-time accuracy
    axiosInstance.get('/api/user/stats')
      .then(r => setStats(r.data?.data || { totalDonated: 0, campaignsBacked: 0, totalTransactions: 0 }))
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    Promise.all([
      axiosInstance.get('/api/user/donations/my').catch(()=>({ data:{ data:[] } })),
      axiosInstance.get('/api/user/subscription/status').catch(()=>({ data:{ data:null } })),
      axiosInstance.get('/api/campaigns/public').catch(()=>({ data:{ data:[] } })),
      axiosInstance.get('/api/user/profile').catch(()=>({ data:{ data:null } })),
    ]).then(([d, s, c, p]) => {
      setDonations(d.data?.data || []);
      setSub(s.data?.data);
      setCampaigns((c.data?.data || []).slice(0, 3));
      setProfile(p.data?.data);
    }).finally(() => setLoading(false));
  }, []);

  // Use backend-computed stats; fall back to client-side calculation if stats not yet loaded
  const totalDonated    = statsLoading ? null : stats.totalDonated;
  const campaignsBacked = statsLoading ? null : stats.campaignsBacked;
  const totalTx         = statsLoading ? null : stats.totalTransactions;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth:1240, margin:'0 auto', padding:'32px 24px' }}>

        {/* ── Welcome Banner ─────────────────────────────── */}
        <motion.div
          style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(16,185,129,0.1))', border:'1px solid rgba(167,139,250,0.2)', borderRadius:20, padding:'28px 32px', marginBottom:32, position:'relative', overflow:'hidden' }}
          initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <motion.div
            style={{ position:'absolute', right:-20, top:-20, fontSize:100, opacity:0.06, pointerEvents:'none' }}
            animate={{ rotate:[0,10,-10,0] }} transition={{ duration:8, repeat:Infinity }}>
            💜
          </motion.div>
          <div style={{ position:'relative', zIndex:1 }}>
            <motion.h1 style={{ fontSize:28, fontWeight:900, marginBottom:6 }}
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
              {greeting}
            </motion.h1>
            <motion.p style={{ color:'var(--text-muted)', fontSize:15 }}
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>
              {donations.length > 0
                ? (t('dashboard.donationsMade')||`You've made {n} donation(s) so far. Thank you! 💜`).replace('{n}', donations.filter(d=>d.status==='COMPLETED').length)
                : t('dashboard.noDonationsMsg')||'Start your giving journey today — browse campaigns and make your first donation! 🎯'}
            </motion.p>
            {donations.length === 0 && (
              <motion.div style={{ marginTop:16 }} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}>
                <Link to="/campaigns">
                  <motion.button className="btn-primary-full"
                    style={{ width:'auto', padding:'10px 28px' }}
                    whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}>
                    {t('browseCampaigns')||'Browse Campaigns'} 🚀
                  </motion.button>
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid-4" style={{ marginBottom:32 }}>
          {statsLoading ? (
            [0,1,2,3].map(i => (
              <div key={i} className="stat-card" style={{ borderRadius:16 }}>
                <div className="skeleton" style={{ width:52, height:52, borderRadius:12, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div className="skeleton" style={{ height:28, width:'60%', borderRadius:6, marginBottom:8 }} />
                  <div className="skeleton" style={{ height:12, width:'80%', borderRadius:6 }} />
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard icon="💰" label={t('totalDonated')||'Total Donated'}
                value={`₹${Number(totalDonated||0).toLocaleString('en-IN')}`} color="#a78bfa" delay={0} />
              <StatCard icon="🎯" label={t('campaignsBacked')||'Campaigns Backed'}
                value={campaignsBacked||0} color="#34d399" delay={0.1} />
              <StatCard icon="📋" label={t('totalTransactions')||'Total Transactions'}
                value={totalTx||0} color="#60a5fa" delay={0.2} />
              <StatCard icon="📅" label={t('myPlan')||'Plan'}
                value={sub?.donorType==='MONTHLY' ? `⭐ ${t('sub.monthlyGiving')||'Monthly'}` : `🎁 ${t('sub.generalDonor')||'General'}`}
                color="#fbbf24" delay={0.3} />
            </>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24 }}>

          {/* ── Recent Donations ───────────────────────── */}
          <motion.div className="glass-card" style={{ padding:0, overflow:'hidden' }}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(167,139,250,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontWeight:700, fontSize:16 }}>📋 {t('dashboard.recentDonations')||'Recent Donations'}</h2>
              <Link to="/user/donations">
                <span style={{ fontSize:12, color:'var(--primary-light)', cursor:'pointer' }}>{t('common.viewAll')||'View all'} →</span>
              </Link>
            </div>
            {loading ? (
              <div style={{ padding:24 }}>
                {[0,1,2].map(i=><div key={i} className="skeleton" style={{ height:44, borderRadius:8, marginBottom:10 }}/>)}
              </div>
            ) : donations.length === 0 ? (
              <div style={{ padding:40, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>💜</div>
                <p style={{ color:'var(--text-muted)', marginBottom:16 }}>{t('dashboard.noDonationsYet')||'No donations yet — make your first one!'}</p>
                <Link to="/campaigns">
                  <button className="btn btn-primary btn-sm">{t('browseCampaigns')||'Browse Campaigns'} →</button>
                </Link>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#ID</th>
                      <th>{t('common.campaign')||'Campaign'}</th>
                      <th>{t('common.amount')||'Amount'}</th>
                      <th>{t('common.status')||'Status'}</th>
                      <th>{t('common.date')||'Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.slice(0,8).map((d,i)=><DonationRow key={d.donationId} d={d} i={i}/>)}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* ── Right Panel ────────────────────────────── */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Gamification widget */}
            <GamificationWidget />

            {/* Profile card */}
            <motion.div className="glass-card" style={{ padding:24 }}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.25 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),var(--primary-light))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {firstName[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700 }}>{profile?.fullName || user?.fullName}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{profile?.email || user?.email}</div>
                </div>
              </div>
              {/* Extra user details */}
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14, fontSize:12 }}>
                {(profile?.phone || user?.phone) && (
                  <div style={{ display:'flex', gap:8, color:'var(--text-muted)' }}>
                    <span>📱</span><span>{profile?.phone || user?.phone}</span>
                  </div>
                )}
                {(profile?.address) && (
                  <div style={{ display:'flex', gap:8, color:'var(--text-muted)', wordBreak:'break-word' }}>
                    <span>📍</span><span>{profile.address}</span>
                  </div>
                )}
                <div style={{ display:'flex', gap:8, color:'var(--text-muted)' }}>
                  <span>🌐</span><span style={{ textTransform:'uppercase' }}>{profile?.preferredLanguage || user?.preferredLanguage || 'en'}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <span className="badge badge-active" style={{ fontSize:10 }}>✅ {t('verifiedLabel')||'Verified'}</span>
                <span className="badge badge-purple" style={{ fontSize:10 }}>💜 {t('nav.dashboard')||'Donor'}</span>
              </div>
              <Link to="/user/profile" style={{ display:'block' }}>
                <motion.button className="btn-secondary-full" style={{ padding:'9px' }} whileHover={{ scale:1.02 }}>
                  {t('editProfile')||'Edit Profile'} →
                </motion.button>
              </Link>
            </motion.div>

            {/* Subscription card */}
            <motion.div className="glass-card" style={{ padding:24 }}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35 }}>
              <h3 style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>📅 {t('sub.title')||'Subscription Plan'}</h3>
              {sub?.donorType === 'MONTHLY' ? (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
                    <span style={{ color:'var(--text-muted)' }}>{t('myPlan')||'Plan'}</span>
                    <span style={{ fontWeight:700, color:'#fbbf24' }}>⭐ {t('sub.monthlyGiving')||'Monthly Giving'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
                    <span style={{ color:'var(--text-muted)' }}>{t('sub.amount')||'Amount'}</span>
                    <span style={{ fontWeight:700, color:'#a78bfa' }}>₹{sub.monthlyAmount}/mo</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, fontSize:13 }}>
                    <span style={{ color:'var(--text-muted)' }}>{t('common.status')||'Status'}</span>
                    <span className="badge badge-active" style={{ fontSize:11 }}>{sub.status}</span>
                  </div>
                </>
              ) : (
                <div style={{ marginBottom:16 }}>
                  <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12, lineHeight:1.6 }}>
                    {t('upgradeMonthlyDesc')||'Upgrade to Monthly Giving for automated donations, reminders & receipts.'}
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {[
                      t('sub.automated')||'✅ Automated monthly donations',
                      t('sub.reminders')||'📧 Pre-donation reminders',
                      t('sub.receipts')||'🧾 Monthly tax receipts',
                      t('sub.control')||'⏸ Pause or cancel anytime',
                    ].map((f,i)=>(
                      <div key={i} style={{ fontSize:12, color:'var(--text-muted)', display:'flex', gap:6 }}>{f}</div>
                    ))}
                  </div>
                </div>
              )}
              <Link to="/user/subscription">
                <motion.button className="btn-primary-full" style={{ padding:'9px', fontSize:13 }} whileHover={{ scale:1.02 }}>
                  {sub?.donorType==='MONTHLY' ? t('sub.managePlan')||'Manage Plan →' : t('upgradeMonthly')||'Upgrade to Monthly 🚀'}
                </motion.button>
              </Link>
            </motion.div>

            {/* Quick donate */}
            <motion.div className="glass-card" style={{ padding:24 }}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.45 }}>
              <h3 style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>⚡ {t('dashboard.quickActions')||'Quick Actions'}</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { icon:'💜', label: t('btn.donateNow')||'Donate Now',         to:'/campaigns' },
                  { icon:'📋', label: t('myDonations')||'All My Donations',     to:'/user/donations' },
                  { icon:'🔗', label: t('nav.blockchain')||'Blockchain Verification', to:'/user/blockchain' },
                  { icon:'👤', label: t('editProfile')||'Edit Profile',          to:'/user/profile' },
                  { icon:'📬', label: t('nav.contact')||'Contact Us',            to:'/contact' },
                ].map(({ icon, label, to }) => (
                  <Link key={to} to={to}>
                    <motion.div
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', cursor:'pointer', fontSize:13, fontWeight:500 }}
                      whileHover={{ background:'rgba(124,58,237,0.1)', borderColor:'rgba(167,139,250,0.3)', x:4 }}
                      transition={{ duration:0.2 }}>
                      <span>{icon}</span>{label}
                      <span style={{ marginLeft:'auto', opacity:0.4 }}>→</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Featured Campaigns ─────────────────────── */}
        {campaigns.length > 0 && (
          <motion.div style={{ marginTop:32 }}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontWeight:800, fontSize:20 }}>🎯 {t('dashboard.campaignsForYou')||'Campaigns for You'}</h2>
              <Link to="/campaigns"><span style={{ fontSize:13, color:'var(--primary-light)' }}>{t('common.seeAll')||'See all'} →</span></Link>
            </div>
            <div className="grid-3">
              {campaigns.map((c, i) => (
                <motion.div key={c.campaignId} className="glass-card" style={{ padding:0, overflow:'hidden' }}
                  whileHover={{ y:-6 }} transition={{ duration:0.25 }}>
                  <img src={c.imageUrl||'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400'} alt={c.campaignName}
                    style={{ width:'100%', height:140, objectFit:'cover' }}/>
                  <div style={{ padding:'14px 16px' }}>
                    <p style={{ fontWeight:700, fontSize:14, marginBottom:6, lineHeight:1.4 }}>{c.campaignName}</p>
                    <div className="progress-bar" style={{ marginBottom:10 }}>
                      <div className="progress-fill" style={{ width:`${Math.min(100,(c.collectedAmount/c.goalAmount)*100||0)}%` }}/>
                    </div>
                    <Link to={`/user/donate/${c.campaignId}`}>
                      <button className="btn btn-primary btn-sm" style={{ width:'100%', justifyContent:'center' }}>
                        {t('btn.donate')||'Donate'} 💜
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <VoiceAssistant />
      <Footer />
    </div>
  );
}
