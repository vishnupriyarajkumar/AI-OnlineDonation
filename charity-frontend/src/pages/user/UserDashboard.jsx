import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const URGENCY_COLOR = { LOW:'#10b981', MEDIUM:'#f59e0b', HIGH:'#ef4444', CRITICAL:'#dc2626' };
const CATS = ['All','Water','Education','Healthcare','Food','Environment'];

const MOCK_CAMPAIGNS = [
  { campaignId:1, campaignName:'Clean Water for Rural Villages', description:'Safe drinking water for 500 families.', category:'Water', urgencyLevel:'CRITICAL', collectedAmount:450000, goalAmount:500000, progressPercent:90, daysRemaining:5, beneficiaries:500, imageUrl:'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600' },
  { campaignId:2, campaignName:'Education for Every Child', description:'School kits for 200 children.', category:'Education', urgencyLevel:'HIGH', collectedAmount:120000, goalAmount:300000, progressPercent:40, daysRemaining:15, beneficiaries:200, imageUrl:'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600' },
  { campaignId:3, campaignName:'Free Medical Camp for Elderly', description:'Free checkups for 300 seniors.', category:'Healthcare', urgencyLevel:'MEDIUM', collectedAmount:85000, goalAmount:100000, progressPercent:85, daysRemaining:8, beneficiaries:300, imageUrl:'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600' },
  { campaignId:4, campaignName:'Flood Relief — Emergency Aid', description:'Emergency aid for 2500 families.', category:'Food', urgencyLevel:'CRITICAL', collectedAmount:750000, goalAmount:1000000, progressPercent:75, daysRemaining:3, beneficiaries:2500, imageUrl:'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600' },
  { campaignId:5, campaignName:'Plant a Million Trees', description:'Reforestation across Karnataka.', category:'Environment', urgencyLevel:'LOW', collectedAmount:60000, goalAmount:200000, progressPercent:30, daysRemaining:60, beneficiaries:10000, imageUrl:'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600' },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [tab,       setTab]       = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [myDons,    setMyDons]    = useState([]);
  const [sub,       setSub]       = useState(null);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');
  const [sortBy,    setSortBy]    = useState('urgent');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/user/campaigns').catch(() => null),
      axiosInstance.get('/api/user/donations/my').catch(() => null),
      axiosInstance.get('/api/user/subscription').catch(() => null),
    ]).then(([cR, dR, sR]) => {
      const c = cR?.data?.data?.length ? cR.data.data : MOCK_CAMPAIGNS;
      setCampaigns(c); setFiltered(c);
      setMyDons(dR?.data?.data || []);
      setSub(sR?.data?.data || null);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = [...campaigns];
    if (search) list = list.filter(c =>
      c.campaignName.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All') list = list.filter(c => c.category === category);
    const ORDER = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 };
    if (sortBy==='urgent')   list.sort((a,b)=>ORDER[a.urgencyLevel]-ORDER[b.urgencyLevel]);
    if (sortBy==='ending')   list.sort((a,b)=>a.daysRemaining-b.daysRemaining);
    if (sortBy==='progress') list.sort((a,b)=>b.progressPercent-a.progressPercent);
    setFiltered(list);
  }, [search, category, sortBy, campaigns]);

  const totalDonated = myDons.filter(d=>d.status==='SUCCESS').reduce((s,d)=>s+Number(d.amount||0),0);
  const isMonthly    = sub?.donorType === 'MONTHLY';

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop:40, paddingBottom:80 }}>

        {/* Welcome hero */}
        <div style={{ borderRadius:20, marginBottom:28, padding:'28px 32px', position:'relative', overflow:'hidden', background:'linear-gradient(135deg,rgba(108,60,232,0.22) 0%,rgba(16,185,129,0.10) 100%)', border:'1px solid rgba(108,60,232,0.25)' }}>
          <div style={{ position:'absolute',right:-40,top:-40,width:180,height:180,borderRadius:'50%',background:'rgba(108,60,232,0.08)',pointerEvents:'none' }} />
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16 }}>
            <div>
              <p style={{ color:'var(--primary-light)',fontSize:12,fontWeight:600,marginBottom:4 }}>👋 WELCOME BACK</p>
              <h1 style={{ fontWeight:900,fontSize:26,marginBottom:6 }}>{user?.fullName || 'Donor'} 💜</h1>
              <p style={{ color:'var(--text-muted)',fontSize:13 }}>Your generosity changes lives every day.</p>
            </div>
            <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
              <Link to="/user/donations"   className="btn btn-secondary btn-sm">📋 {t('myDonations')}</Link>
              <Link to="/user/profile"     className="btn btn-secondary btn-sm">👤 {t('profile')}</Link>
              <Link to="/user/subscription" className="btn btn-secondary btn-sm">🔄 {t('myPlan') || 'My Plan'}</Link>
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginTop:24 }}>
            {[
              {icon:'🎯',label: t('activeCampaigns'), value:campaigns.length},
              {icon:'💰',label: t('totalDonated'),    value:'₹'+(totalDonated/1000).toFixed(1)+'K'},
              {icon:'🏆',label: t('campaignsBacked'), value:new Set(myDons.map(d=>d.campaignName)).size},
            ].map(s=>(
              <div key={s.label} style={{ background:'rgba(255,255,255,0.06)',borderRadius:12,padding:'14px 18px',border:'1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize:20 }}>{s.icon}</p>
                <p style={{ fontSize:22,fontWeight:800,marginTop:4 }}>{s.value}</p>
                <p style={{ fontSize:12,color:'var(--text-muted)',marginTop:2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile + Plan row */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24 }}>

          {/* Personal details card */}
          <div className="card" style={{ padding:24 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <h3 style={{ fontWeight:700,fontSize:16 }}>👤 {t('myDetails')}</h3>
              <Link to="/user/profile" style={{ fontSize:12,color:'var(--primary-light)' }}>{t('edit')} →</Link>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:16 }}>
              <div style={{ width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#6c3ce8,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff',flexShrink:0 }}>
                {(user?.fullName||user?.email||'?')[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight:700,fontSize:15 }}>{user?.fullName||'—'}</p>
                <p style={{ color:'var(--text-muted)',fontSize:12,marginTop:2 }}>{user?.email||user?.phone||'—'}</p>
              </div>
            </div>
            {[
              [t('userId') || 'User ID',  '#'+(user?.userId||'—')],
              [t('mobile') || 'Mobile',   user?.phone||t('notSet') || 'Not set'],
              [t('role') || 'Role',     user?.role||'USER'],
              [t('status'),   '✅ '+t('verified')],
            ].map(([k,v])=>(
              <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',fontSize:13 }}>
                <span style={{ color:'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Subscription plan card */}
          <div className="card" style={{ padding:24, background: isMonthly ? 'rgba(108,60,232,0.06)' : 'var(--bg-glass)', border: isMonthly ? '1px solid rgba(108,60,232,0.3)' : '1px solid var(--border)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <h3 style={{ fontWeight:700,fontSize:16 }}>{isMonthly ? '🔄 Monthly Plan' : '🎁 General Donor'}</h3>
              <Link to="/user/subscription" style={{ fontSize:12,color:'var(--primary-light)' }}>Manage →</Link>
            </div>
            {isMonthly ? (
              <>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14 }}>
                  {[
                    ['Amount',       '₹'+Number(sub.monthlyAmount||0).toLocaleString('en-IN')+'/mo'],
                    ['Day',          'Day '+sub.donationDay],
                    ['Status',       sub.status],
                    ['Next Date',    sub.nextDonationDate||'—'],
                  ].map(([k,v])=>(
                    <div key={k} style={{ background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'10px 12px' }}>
                      <p style={{ fontSize:11,color:'var(--text-muted)',marginBottom:3 }}>{k}</p>
                      <p style={{ fontWeight:700,fontSize:13 }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  {sub.status==='ACTIVE' && <button className="btn btn-secondary btn-sm" onClick={()=>axiosInstance.post('/api/user/subscription/pause').then(()=>{toast.success('Paused');setSub(p=>({...p,status:'PAUSED'}))})}>⏸ Pause</button>}
                  {sub.status==='PAUSED' && <button className="btn btn-secondary btn-sm" onClick={()=>axiosInstance.post('/api/user/subscription/resume').then(()=>{toast.success('Resumed');setSub(p=>({...p,status:'ACTIVE'}))})}>▶️ Resume</button>}
                  <button className="btn btn-danger btn-sm" onClick={()=>{if(window.confirm('Cancel subscription?'))axiosInstance.post('/api/user/subscription/cancel').then(()=>{toast.success('Cancelled');setSub(p=>({...p,donorType:'GENERAL',status:'CANCELLED'}))}).catch(()=>toast.error('Failed'))}}>❌ Cancel</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ color:'var(--text-muted)',fontSize:13,lineHeight:1.7,marginBottom:16 }}>
                  {t('upgradeMonthlyDesc') || 'Upgrade to Monthly Giving for automated donations, pre-donation reminders, and monthly receipts.'}
                </p>
                <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:16 }}>
                  {['🔄 Automatic monthly donations','⏰ Pre-donation reminders','📋 Monthly tax receipts','⏸ Pause or cancel anytime'].map(f=>(
                    <p key={f} style={{ fontSize:12,color:'var(--text-muted)' }}>{f}</p>
                  ))}
                </div>
                <Link to="/user/subscription" className="btn btn-primary w-full" style={{ justifyContent:'center' }}>🚀 {t('upgradeMonthly')}</Link>
              </>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display:'flex',gap:10,marginBottom:20 }}>
          {[['campaigns',`🎯 ${t('campaigns')}`],['history',`📋 ${t('myDonations')}`]].map(([tabId,l])=>(
            <button key={tabId} onClick={()=>setTab(tabId)} style={{
              padding:'8px 20px',borderRadius:99,fontSize:13,fontWeight:600,border:'none',cursor:'pointer',
              background:tab===tabId?'linear-gradient(135deg,var(--primary),var(--primary-light))':'rgba(255,255,255,0.06)',
              color:tab===tabId?'#fff':'var(--text-muted)',
              boxShadow:tab===tabId?'0 4px 14px rgba(108,60,232,0.35)':'none',
            }}>{l}</button>
          ))}
        </div>

        {/* Campaigns tab */}
        {tab==='campaigns' && (<>
          <div className="card" style={{ marginBottom:20,padding:18 }}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr auto auto',gap:12,marginBottom:12,alignItems:'center' }}>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',opacity:0.4 }}>🔍</span>
                <input className="form-control" placeholder="Search campaigns…" value={search}
                  onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:40 }} />
              </div>
              <select className="form-control" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ width:160 }}>
                <option value="urgent">{t('mostUrgent')}</option>
                <option value="ending">{t('endingSoon')}</option>
                <option value="progress">{t('nearGoal')}</option>
              </select>
              <button className="btn btn-secondary btn-sm" onClick={()=>{setSearch('');setCategory('All');setSortBy('urgent');}}>{t('clear') || 'Clear'}</button>
            </div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {CATS.map(c=>(
                <button key={c} onClick={()=>setCategory(c)} style={{
                  padding:'5px 14px',borderRadius:99,fontSize:12,fontWeight:600,border:'none',cursor:'pointer',
                  background:category===c?'linear-gradient(135deg,var(--primary),var(--primary-light))':'rgba(255,255,255,0.06)',
                  color:category===c?'#fff':'var(--text-muted)',
                }}>{c}</button>
              ))}
            </div>
          </div>

          {loading ? <div className="spinner"/> : (
            <div className="grid-3">
              {filtered.map(c=>{
                const pct = c.goalAmount>0 ? Math.min(100,(Number(c.collectedAmount)/Number(c.goalAmount))*100) : (c.progressPercent||0);
                return (
                  <div key={c.campaignId} className="campaign-card" style={{ borderRadius:16 }}>
                    <div style={{ position:'relative' }}>
                      <img src={c.imageUrl||'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600'}
                        alt={c.campaignName} loading="lazy"
                        style={{ width:'100%',height:180,objectFit:'cover' }} />
                      <div style={{ position:'absolute',top:10,right:10,background:URGENCY_COLOR[c.urgencyLevel]+'22',border:`1px solid ${URGENCY_COLOR[c.urgencyLevel]}44`,borderRadius:99,padding:'3px 10px',fontSize:11,fontWeight:700,color:URGENCY_COLOR[c.urgencyLevel],backdropFilter:'blur(8px)' }}>
                        {c.urgencyLevel==='CRITICAL'?'🔥':c.urgencyLevel==='HIGH'?'⚡':c.urgencyLevel==='MEDIUM'?'📌':'🌱'} {c.urgencyLevel}
                      </div>
                      {(c.daysRemaining<=7) && <div style={{ position:'absolute',top:10,left:10,background:'rgba(239,68,68,0.85)',borderRadius:99,padding:'3px 10px',fontSize:11,fontWeight:700,color:'#fff' }}>⏰ {c.daysRemaining}d left</div>}
                    </div>
                    <div className="campaign-card-body">
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                        <span style={{ background:'rgba(108,60,232,0.15)',color:'var(--primary-light)',borderRadius:99,padding:'2px 10px',fontSize:11,fontWeight:700 }}>{c.category}</span>
                        <span style={{ fontSize:11,color:'var(--text-muted)',marginLeft:'auto' }}>👥 {Number(c.beneficiaries||0).toLocaleString('en-IN')}</span>
                      </div>
                      <h3 style={{ fontSize:15,fontWeight:700,marginBottom:6,lineHeight:1.4 }}>{c.campaignName}</h3>
                      <p style={{ fontSize:12,color:'var(--text-muted)',lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{c.description}</p>
                      <div style={{ marginTop:14 }}>
                        <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5 }}>
                          <span style={{ color:'var(--text-muted)' }}>₹{Number(c.collectedAmount||0).toLocaleString('en-IN')}</span>
                          <span style={{ color:'#10b981',fontWeight:700 }}>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height:5,background:'rgba(255,255,255,0.08)',borderRadius:99,overflow:'hidden' }}>
                          <div style={{ height:'100%',borderRadius:99,width:`${pct}%`,background:pct>=80?'linear-gradient(90deg,#10b981,#34d399)':'linear-gradient(90deg,var(--primary),var(--primary-light))' }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ padding:'12px 18px',borderTop:'1px solid var(--border)',display:'flex',gap:8 }}>
                      <Link to={`/campaigns/${c.campaignId}`} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:'center' }}>{t('details')}</Link>
                      <Link to={`/user/donate/${c.campaignId}`} className="btn btn-primary btn-sm" style={{ flex:2,justifyContent:'center' }}>{t('donateNow')} 💜</Link>
                    </div>
                  </div>
                );
              })}
              {filtered.length===0 && (
                <div className="card text-center" style={{ padding:60,gridColumn:'1/-1' }}>
                  <div style={{ fontSize:48,marginBottom:16 }}>🔍</div>
                  <h3>No campaigns match</h3>
                </div>
              )}
            </div>
          )}
        </>)}

        {/* Donations history tab */}
        {tab==='history' && (
          myDons.length===0 ? (
            <div className="card text-center" style={{ padding:60 }}>
              <div style={{ fontSize:48,marginBottom:16 }}>💜</div>
              <h3>No donations yet</h3>
              <p style={{ color:'var(--text-muted)',marginTop:8 }}>Start making a difference today!</p>
              <button className="btn btn-primary" style={{ marginTop:20 }} onClick={()=>setTab('campaigns')}>Browse Campaigns</button>
            </div>
          ) : (
            <div className="card" style={{ padding:0 }}>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>{t('campaign')}</th><th>{t('amount')}</th><th>{t('method')}</th><th>{t('date')}</th><th>{t('status')}</th><th>{t('receipt')}</th></tr></thead>
                  <tbody>
                    {myDons.map((d,i)=>(
                      <tr key={i}>
                        <td style={{ fontWeight:600,fontSize:13 }}>{d.campaignName||'—'}</td>
                        <td style={{ color:'#10b981',fontWeight:700 }}>₹{Number(d.amount).toLocaleString('en-IN')}</td>
                        <td style={{ fontSize:12,color:'var(--text-muted)' }}>{d.paymentMethod?.replace(/_/g,' ')||'—'}</td>
                        <td style={{ fontSize:12,color:'var(--text-muted)' }}>{d.donationDate?new Date(d.donationDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
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
            </div>
          )
        )}

      </div>
    </div>
  );
}
