import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import { NgoSidebar } from './NgoSidebar';
import toast from 'react-hot-toast';

export default function NgoCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await axiosInstance.get('/api/campaigns/public');
      setCampaigns(res.data?.data || []);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await axiosInstance.patch(`/api/admin/campaigns/${id}/status?status=${nextStatus}`);
      toast.success(`Campaign ${nextStatus.toLowerCase()} successfully`);
      fetchCampaigns();
    } catch {
      toast.error('Failed to update campaign status');
    }
  };

  return (
    <div className="dashboard-layout">
      <NgoSidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900 }}>My Campaigns</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Manage and track all fundraising initiatives registered by your organization.
              </p>
            </div>
            <Link to="/ngo/create">
              <motion.button className="btn-primary-full" style={{ width: 'auto', padding: '12px 24px' }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                ➕ Create Campaign
              </motion.button>
            </Link>
          </div>

          {/* Table / Grid */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, display: 'grid', gap: 12 }}>
                {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
              </div>
            ) : campaigns.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <span style={{ fontSize: 60 }}>🎯</span>
                <h3 style={{ marginTop: 16, fontWeight: 700 }}>No Campaigns Found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
                  Start raising funds by creating your first campaign.
                </p>
                <Link to="/ngo/create" style={{ display: 'inline-block', marginTop: 20 }}>
                  <button className="btn-primary-full" style={{ width: 'auto', padding: '10px 24px' }}>Create Now</button>
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Campaign</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Category</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Progress</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Urgency</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {campaigns.map((c, i) => {
                        const pct = c.goalAmount > 0 ? Math.min(100, (Number(c.collectedAmount||0) / Number(c.goalAmount||1)) * 100) : 0;
                        return (
                          <motion.tr key={c.campaignId}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={c.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.campaignName}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                    Goal: ₹{Number(c.goalAmount).toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 99 }}>
                                {c.category}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', width: 160 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                                <span>₹{Number(c.collectedAmount).toLocaleString('en-IN')}</span>
                                <span style={{ fontWeight: 700 }}>{pct.toFixed(0)}%</span>
                              </div>
                              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary-light)', borderRadius: 99 }} />
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: c.urgencyLevel === 'CRITICAL' ? 'rgba(239,68,68,0.15)' :
                                            c.urgencyLevel === 'HIGH' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                color: c.urgencyLevel === 'CRITICAL' ? '#f87171' :
                                       c.urgencyLevel === 'HIGH' ? '#fbbf24' : '#34d399',
                              }}>{c.urgencyLevel}</span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: c.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                                color: c.status === 'ACTIVE' ? '#34d399' : 'var(--text-muted)',
                              }}>{c.status}</span>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleToggleStatus(c.campaignId, c.status)}
                                  style={{
                                    padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)',
                                    background: 'rgba(255,255,255,0.04)', color: 'var(--text)',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                  }}
                                >
                                  {c.status === 'ACTIVE' ? '⏸ Pause' : '▶ Activate'}
                                </button>
                                <Link to={`/admin/campaigns/edit/${c.campaignId}`}>
                                  <button style={{
                                    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(167,139,250,0.3)',
                                    background: 'rgba(167,139,250,0.1)', color: 'var(--primary-light)',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                  }}>✏ Edit</button>
                                </Link>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
