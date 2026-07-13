import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './AdminSidebar';

export { Sidebar };

const MOCK_STATS = { totalDonations:42, totalAmount:1465000, activeCampaigns:5, totalUsers:128, totalDonors:120, recentLogins:14, lockedUsers:2 };
const MOCK_CHART = [
  {month:'Jan',amount:120000},{month:'Feb',amount:185000},{month:'Mar',amount:95000},
  {month:'Apr',amount:220000},{month:'May',amount:310000},{month:'Jun',amount:175000},
  {month:'Jul',amount:260000},{month:'Aug',amount:190000},{month:'Sep',amount:280000},
  {month:'Oct',amount:340000},{month:'Nov',amount:220000},{month:'Dec',amount:410000},
];
const PIE_COLORS = ['#6c3ce8','#10b981','#f59e0b','#3b82f6','#ec4899'];

const ACT_META = {
  LOGIN_SUCCESS:     {icon:'🔑',color:'#10b981',label:'Login'},
  LOGIN_FAILED:      {icon:'❌',color:'#ef4444',label:'Login Failed'},
  USER_REGISTERED:   {icon:'✅',color:'#3b82f6',label:'Registered'},
  ACCOUNT_VERIFIED:  {icon:'✔️',color:'#10b981',label:'Verified'},
  ACCOUNT_LOCKED:    {icon:'🔒',color:'#ef4444',label:'Locked'},
  DONATION_SUCCESS:  {icon:'💰',color:'#10b981',label:'Donated'},
  DONATION_INITIATED:{icon:'💜',color:'#8b5cf6',label:'Donation'},
  CAMPAIGN_CREATED:  {icon:'🎯',color:'#f59e0b',label:'Campaign'},
  PASSWORD_CHANGED:  {icon:'🔐',color:'#f59e0b',label:'Password Changed'},
  PASSWORD_RESET_REQUESTED:{icon:'🔐',color:'#f59e0b',label:'Password Reset'},
  LOGOUT:            {icon:'🚪',color:'#9090b0',label:'Logout'},
  LOGIN:             {icon:'🔑',color:'#10b981',label:'Login'},
};

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats,    setStats]    = useState(MOCK_STATS);
  const [chart,    setChart]    = useState(MOCK_CHART);
  const [actStats, setActStats] = useState({});
  const [recent,   setRecent]   = useState([]);
  const [campaigns,setCampaigns]= useState([]);
  const [subStats, setSubStats] = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/admin/stats').catch(() => null),
      axiosInstance.get('/api/admin/donations/monthly').catch(() => null),
      axiosInstance.get('/api/admin/activities/stats').catch(() => null),
      axiosInstance.get('/api/admin/recent-activities?limit=10').catch(() => null),
      axiosInstance.get('/api/user/subscription/admin/stats').catch(() => null),
      axiosInstance.get('/api/admin/campaigns').catch(() => null),
    ]).then(([sR,cR,aR,rR,subR,campR]) => {
      if (sR?.data?.data)  setStats(s => ({...s, ...sR.data.data}));
      if (cR?.data?.data)  setChart(cR.data.data);
      if (aR?.data?.data)  setActStats(aR.data.data);
      if (rR?.data?.data)  setRecent(Array.isArray(rR.data.data) ? rR.data.data : []);
      if (subR?.data?.data) setSubStats(subR.data.data);
      if (campR?.data?.data) setCampaigns(campR.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = v => v>=100000?'₹'+(v/100000).toFixed(1)+'L':v>=1000?'₹'+(v/1000).toFixed(1)+'K':'₹'+v;

  const catData = Object.entries(
    campaigns.reduce((acc,c) => { acc[c.category]=(acc[c.category]||0)+Number(c.collectedAmount||0); return acc; }, {})
  ).map(([name,value]) => ({name,value}));

  const statCards = [
    {label:'Total Donations',   value:stats.totalDonations,   icon:'💰',color:'#6c3ce8',bg:'rgba(108,60,232,0.12)',to:'/admin/donations'},
    {label:'Amount Raised',     value:fmt(Number(stats.totalAmount||0)), icon:'📈',color:'#10b981',bg:'rgba(16,185,129,0.12)', to:'/admin/reports'},
    {label:'Active Campaigns',  value:stats.activeCampaigns,  icon:'🎯',color:'#f59e0b',bg:'rgba(245,158,11,0.12)', to:'/admin/campaigns'},
    {label:'Total Users',       value:stats.totalUsers,        icon:'👥',color:'#3b82f6',bg:'rgba(59,130,246,0.12)',  to:'/admin/users'},
    {label:'Monthly Donors',    value:subStats.activeMonthly||0, icon:'🔄',color:'#a78bfa',bg:'rgba(167,139,250,0.12)',to:'/admin/users'},
    {label:'Logins (24h)',      value:stats.recentLogins||0,   icon:'🔑',color:'#10b981',bg:'rgba(16,185,129,0.12)', to:'/admin/audit-logs'},
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* Header */}
          <div style={{ marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(108,60,232,0.1)',border:'1px solid rgba(108,60,232,0.25)',borderRadius:99,padding:'4px 14px',fontSize:12,color:'var(--primary-light)',marginBottom:12 }}>
                👑 ADMIN PANEL
              </div>
              <h1 style={{ fontSize:28,fontWeight:900 }}>Dashboard Overview</h1>
              <p style={{ color:'var(--text-muted)',marginTop:6,fontSize:14 }}>
                Welcome back, {user?.fullName||'Admin'} — {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
              </p>
            </div>
            <div style={{ display:'flex',gap:10 }}>
              <Link to="/admin/campaigns/new" className="btn btn-primary btn-sm">+ New Campaign</Link>
              <Link to="/admin/activities"    className="btn btn-secondary btn-sm">📡 Activities</Link>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28 }}>
            {statCards.map((s,i) => (
              <Link key={s.label} to={s.to} style={{ textDecoration:'none' }}>
                <motion.div className="stat-card" style={{ borderRadius:16 }}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.08 }} whileHover={{ y:-4, scale:1.02 }}>
                  <div className="stat-icon" style={{ background:s.bg,color:s.color,borderRadius:12 }}>{s.icon}</div>
                  <div>
                    <div className="stat-value" style={{ color:s.color,fontSize:24 }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Alert row */}
          {stats.lockedUsers > 0 && (
            <div style={{ marginBottom:24,padding:'12px 20px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,display:'flex',alignItems:'center',gap:12 }}>
              <span style={{ fontSize:20 }}>🔒</span>
              <span style={{ color:'#fca5a5',fontSize:14 }}><strong>{stats.lockedUsers}</strong> account(s) are locked due to failed login attempts.</span>
              <Link to="/admin/users" style={{ marginLeft:'auto',color:'#ef4444',fontSize:13,fontWeight:600 }}>Review →</Link>
            </div>
          )}

          {/* Charts */}
          <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr',gap:24,marginBottom:28 }}>
            <div className="card" style={{ padding:24 }}>
              <div style={{ marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <h3 style={{ fontWeight:700,fontSize:16 }}>Monthly Donations</h3>
                  <p style={{ color:'var(--text-muted)',fontSize:13,marginTop:2 }}>Full year performance</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6c3ce8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6c3ce8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="month" tick={{fill:'#9090b0',fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={fmt} tick={{fill:'#9090b0',fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,fontSize:12}}
                    formatter={v=>['₹'+Number(v).toLocaleString('en-IN'),'Donations']}/>
                  <Area type="monotone" dataKey="amount" stroke="#6c3ce8" strokeWidth={3} fill="url(#grad)"
                    dot={{fill:'#8b5cf6',strokeWidth:0,r:3}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ padding:24 }}>
              <h3 style={{ fontWeight:700,fontSize:16,marginBottom:4 }}>By Category</h3>
              <p style={{ color:'var(--text-muted)',fontSize:13,marginBottom:16 }}>Fund distribution</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={catData.length?catData:[{name:'No Data',value:1}]} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                    {(catData.length?catData:[{name:'No Data',value:1}]).map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} opacity={0.9}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,fontSize:12}}
                    formatter={v=>['₹'+Number(v).toLocaleString('en-IN')]}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:'#9090b0'}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subscription stats */}
          {Object.keys(subStats).length > 0 && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28 }}>
              {[
                {label:'Active Monthly',   value:subStats.activeMonthly||0,   color:'#10b981'},
                {label:'Paused',           value:subStats.pausedMonthly||0,   color:'#f59e0b'},
                {label:'Cancelled',        value:subStats.cancelledMonthly||0,color:'#ef4444'},
                {label:'Due in 7 Days',    value:subStats.upcomingDonations7Days||0, color:'#a78bfa'},
              ].map(s=>(
                <div key={s.label} style={{ background:'var(--bg-glass)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 18px',textAlign:'center' }}>
                  <p style={{ fontSize:24,fontWeight:800,color:s.color }}>{s.value}</p>
                  <p style={{ fontSize:12,color:'var(--text-muted)',marginTop:4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bottom row */}
          <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr',gap:24 }}>
            {/* Recent activities */}
            <div className="card" style={{ padding:24 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
                <div>
                  <h3 style={{ fontWeight:700,fontSize:16 }}>Recent Activities</h3>
                  <p style={{ color:'var(--text-muted)',fontSize:12,marginTop:2 }}>Live system events</p>
                </div>
                <Link to="/admin/audit-logs" style={{ fontSize:13,color:'var(--primary-light)' }}>View all →</Link>
              </div>
              {recent.length===0 ? (
                <p style={{ color:'var(--text-muted)',fontSize:13 }}>No recent activities. Actions will appear here after users interact with the system.</p>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {recent.slice(0,8).map((a,i) => {
                    const meta = ACT_META[a.type||a.action] || {icon:'📋',color:'#9090b0',label:a.action||a.type||'Event'};
                    return (
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width:34,height:34,borderRadius:'50%',flexShrink:0,background:`${meta.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>
                          {meta.icon}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <p style={{ fontWeight:600,fontSize:13 }}>{a.user||'System'}</p>
                          <p style={{ color:'var(--text-muted)',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                            {a.details||a.action?.replace(/_/g,' ')||meta.label}
                          </p>
                        </div>
                        <div style={{ textAlign:'right',flexShrink:0 }}>
                          <p style={{ fontSize:11,color:meta.color,fontWeight:600 }}>{meta.label}</p>
                          <p style={{ fontSize:10,color:'var(--text-muted)',marginTop:2 }}>{timeAgo(a.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick actions + campaign performance */}
            <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontWeight:700,fontSize:16,marginBottom:16 }}>Quick Actions</h3>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {[
                    {to:'/admin/campaigns/new', icon:'🎯',label:'Create Campaign',    color:'rgba(108,60,232,0.15)',border:'rgba(108,60,232,0.3)'},
                    {to:'/admin/users',         icon:'👥',label:'Manage Users',       color:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)'},
                    {to:'/admin/activities',    icon:'📡',label:'Activity Monitor',   color:'rgba(167,139,250,0.12)',border:'rgba(167,139,250,0.3)'},
                    {to:'/admin/audit-logs',    icon:'📋',label:'Audit Logs',         color:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.3)'},
                    {to:'/admin/donations',     icon:'💰',label:'All Donations',      color:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.3)'},
                    {to:'/admin/reports',       icon:'📊',label:'Reports',            color:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)'},
                  ].map(a=>(
                    <Link key={a.to} to={a.to} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:a.color,border:`1px solid ${a.border}`,transition:'all 0.2s',color:'var(--text)',textDecoration:'none',fontSize:12,fontWeight:500 }}
                      onMouseEnter={e=>e.currentTarget.style.transform='translateX(3px)'}
                      onMouseLeave={e=>e.currentTarget.style.transform='translateX(0)'}>
                      <span style={{fontSize:16}}>{a.icon}</span>{a.label}
                      <span style={{marginLeft:'auto',opacity:0.4,fontSize:14}}>→</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Campaign performance mini */}
              {campaigns.length > 0 && (
                <div className="card" style={{ padding:20 }}>
                  <h3 style={{ fontWeight:700,fontSize:14,marginBottom:14 }}>Campaign Progress</h3>
                  {campaigns.slice(0,4).map(c => {
                    const pct = c.goalAmount > 0 ? Math.min(100,(Number(c.collectedAmount||0)/Number(c.goalAmount||1))*100) : 0;
                    return (
                      <div key={c.campaignId} style={{ marginBottom:12 }}>
                        <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4 }}>
                          <span style={{ fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%' }}>{c.campaignName}</span>
                          <span style={{ color:'#10b981',fontWeight:700 }}>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height:4,background:'rgba(255,255,255,0.08)',borderRadius:99,overflow:'hidden' }}>
                          <div style={{ height:'100%',borderRadius:99,width:`${pct}%`,background:pct>=80?'linear-gradient(90deg,#10b981,#34d399)':'linear-gradient(90deg,var(--primary),var(--primary-light))' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
