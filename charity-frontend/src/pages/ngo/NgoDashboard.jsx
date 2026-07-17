import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { NgoSidebar } from './NgoSidebar';
import LiveActivityFeed from '../../components/LiveActivityFeed';

const MOCK_CHART = [
  { month: 'Jan', amount: 12000 }, { month: 'Feb', amount: 28000 }, { month: 'Mar', amount: 18000 },
  { month: 'Apr', amount: 35000 }, { month: 'May', amount: 52000 }, { month: 'Jun', amount: 41000 },
];

export default function NgoDashboard() {
  const { user }   = useAuth();
  const [campaigns,setCampaigns] = useState([]);
  const [loading,  setLoading]   = useState(true);

  useEffect(() => {
    axiosInstance.get('/api/campaigns/public')
      .then(r => setCampaigns(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalGoal      = campaigns.reduce((s, c) => s + Number(c.goalAmount || 0), 0);
  const totalCollected = campaigns.reduce((s, c) => s + Number(c.collectedAmount || 0), 0);
  const activeCamp     = campaigns.filter(c => c.status === 'ACTIVE').length;

  const statCards = [
    { icon: '🎯', label: 'Active Campaigns', value: activeCamp,                               color: '#38bdf8' },
    { icon: '💰', label: 'Total Raised',      value: `₹${totalCollected.toLocaleString('en-IN')}`, color: '#34d399' },
    { icon: '🎯', label: 'Total Goal',        value: `₹${totalGoal.toLocaleString('en-IN')}`,      color: '#a78bfa' },
    { icon: '📊', label: 'Avg. Progress',
      value: campaigns.length ? `${Math.round(totalCollected / Math.max(totalGoal, 1) * 100)}%` : '0%',
      color: '#fbbf24' },
  ];

  return (
    <div className="dashboard-layout">
      <NgoSidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
              borderRadius: 99, padding: '4px 14px', fontSize: 12, color: '#38bdf8', marginBottom: 12,
            }}>🏢 NGO PORTAL</div>
            <h1 style={{ fontSize: 28, fontWeight: 900 }}>Organisation Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
              Welcome, {user?.fullName} — manage your campaigns and track impact
            </p>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
            {statCards.map((s, i) => (
              <motion.div key={s.label} className="stat-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} whileHover={{ y: -4, scale: 1.02 }}
              >
                <div className="stat-icon" style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                </div>
                <div>
                  <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart + Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📈 Monthly Donations Received</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={MOCK_CHART}>
                  <defs>
                    <linearGradient id="gradNgo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₹${v/1000}K`} tick={{ fill: '#9090b0', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                    formatter={v => ['₹' + Number(v).toLocaleString('en-IN'), 'Donations']} />
                  <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={3} fill="url(#gradNgo)"
                    dot={{ fill: '#38bdf8', strokeWidth: 0, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>⚡ Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { to: '/ngo/create',    icon: '➕', label: 'Create New Campaign',  color: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.3)' },
                  { to: '/ngo/campaigns', icon: '🎯', label: 'Manage Campaigns',     color: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
                  { to: '/ngo/analytics', icon: '📊', label: 'View Analytics',       color: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)' },
                  { to: '/ngo/volunteers',icon: '🤝', label: 'Volunteer Management', color: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
                ].map(a => (
                  <Link key={a.to} to={a.to} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 8, background: a.color, border: `1px solid ${a.border}`,
                    textDecoration: 'none', color: 'var(--text)', fontSize: 12, fontWeight: 500,
                    transition: 'transform 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <span style={{ fontSize: 16 }}>{a.icon}</span>{a.label}
                    <span style={{ marginLeft: 'auto', opacity: 0.4 }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign Progress + Live Feed */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            {/* Campaign cards */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>🎯 Campaign Progress</h3>
                <Link to="/ngo/campaigns" style={{ fontSize: 13, color: 'var(--primary-light)' }}>View all →</Link>
              </div>
              {loading ? (
                [0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10, marginBottom: 10 }} />)
              ) : campaigns.slice(0, 4).map(c => {
                const pct = c.goalAmount > 0 ? Math.min(100, (Number(c.collectedAmount||0) / Number(c.goalAmount||1)) * 100) : 0;
                return (
                  <div key={c.campaignId} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{c.campaignName}</span>
                      <span style={{ color: pct >= 80 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', borderRadius: 99, background: pct >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#06b6d4,#38bdf8)' }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span>₹{Number(c.collectedAmount||0).toLocaleString('en-IN')} raised</span>
                      <span>Goal: ₹{Number(c.goalAmount||0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Feed */}
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📡 Live Activity</h3>
              <LiveActivityFeed maxItems={5} compact />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
