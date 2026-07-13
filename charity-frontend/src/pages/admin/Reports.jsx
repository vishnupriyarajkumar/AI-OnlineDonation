import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar } from './AdminSidebar';
import toast from 'react-hot-toast';

const COLORS = ['#6c3ce8','#10b981','#f59e0b','#3b82f6','#ec4899'];

export default function Reports() {
  const [monthly, setMonthly]   = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axiosInstance.get('/api/admin/donations/monthly'),
      axiosInstance.get('/api/admin/campaigns'),
    ]).then(([m, c]) => {
      const raw = m.data?.data || [];
      setMonthly(raw.map(row => ({
        month:  row.month  || '',
        amount: Number(row.amount || 0),
      })));
      setCampaigns(c.data?.data || []);
    }).catch(err => {
      console.error('Reports load failed:', err);
      setMonthly([]);
      setCampaigns([]);
    }).finally(() => setLoading(false));
  }, [year]);

  const catData = Object.entries(
    campaigns.reduce((acc, c) => {
      acc[c.category] = (acc[c.category]||0) + Number(c.collectedAmount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="page-header flex justify-between items-center">
            <div>
              <h1>Financial <span className="gradient-text">Reports</span></h1>
              <p>Analytics and visualizations</p>
            </div>
            <select className="form-control" value={year} onChange={e=>setYear(Number(e.target.value))}
              style={{ width:120 }}>
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {loading ? <div className="spinner" /> : (
            <>
              <div className="card" style={{ marginBottom:28 }}>
                <h3 style={{ fontWeight:700, marginBottom:20 }}>📈 Monthly Donations — {year}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill:'#9090b0', fontSize:12 }} />
                    <YAxis tick={{ fill:'#9090b0', fontSize:12 }} />
                    <Tooltip contentStyle={{ background:'#13132a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8 }}
                      formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#6c3ce8" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3 style={{ fontWeight:700, marginBottom:20 }}>🎯 Donations by Category</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                        {catData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background:'#13132a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8 }}
                        formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Raised']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h3 style={{ fontWeight:700, marginBottom:20 }}>📊 Campaign Performance</h3>
                  <div style={{ overflowY:'auto', maxHeight:240 }}>
                    {campaigns.slice(0,6).map(c => (
                      <div key={c.campaignId} style={{ marginBottom:14 }}>
                        <div className="flex justify-between" style={{ fontSize:13, marginBottom:4 }}>
                          <span style={{ fontWeight:600 }}>{c.campaignName}</span>
                          <span style={{ color:'#10b981', fontWeight:700 }}>{c.progressPercent?.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width:`${c.progressPercent}%` }} />
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
                          ₹{Number(c.collectedAmount).toLocaleString('en-IN')} / ₹{Number(c.goalAmount).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

