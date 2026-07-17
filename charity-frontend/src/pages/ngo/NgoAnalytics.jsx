import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NgoSidebar } from './NgoSidebar';
import axiosInstance from '../../api/axiosInstance';

const COLORS = ['#0ea5e9', '#10b981', '#fbbf24', '#a78bfa', '#f43f5e', '#64748b'];

const MOCK_DONATIONS = [
  { day: 'Mon', amount: 5000 }, { day: 'Tue', amount: 12000 }, { day: 'Wed', amount: 8000 },
  { day: 'Thu', amount: 15000 }, { day: 'Fri', amount: 25000 }, { day: 'Sat', amount: 18000 },
  { day: 'Sun', amount: 32000 },
];

const MOCK_CATEGORIES = [
  { name: 'Water', value: 450000 }, { name: 'Education', value: 120000 },
  { name: 'Healthcare', value: 85000 }, { name: 'Food', value: 750000 },
  { name: 'Environment', value: 60000 },
];

export default function NgoAnalytics() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-layout">
      <NgoSidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900 }}>Campaign Analytics</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Detailed insights into donation trends, category distribution, and audience metrics.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
              <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Daily Trend */}
              <motion.div className="card" style={{ padding: 24 }}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              >
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📈 Daily Donation Volume</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={MOCK_DONATIONS}>
                    <defs>
                      <linearGradient id="gradDaily" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `₹${v/1000}K`} tick={{ fill: '#9090b0', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                      formatter={v => ['₹' + Number(v).toLocaleString('en-IN'), 'Donations']} />
                    <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={3} fill="url(#gradDaily)" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Category Breakdown */}
              <motion.div className="card" style={{ padding: 24 }}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              >
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📊 Donations by Category</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: '50%', height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={MOCK_CATEGORIES} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                          {MOCK_CATEGORIES.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => '₹' + Number(v).toLocaleString('en-IN')} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {MOCK_CATEGORIES.map((item, index) => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                          ₹{(item.value / 1000).toFixed(0)}K
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
