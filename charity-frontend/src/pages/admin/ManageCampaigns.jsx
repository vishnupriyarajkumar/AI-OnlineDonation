import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar } from './AdminSidebar';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  ACTIVE:    { bg:'rgba(16,185,129,0.12)',  color:'#10b981', border:'rgba(16,185,129,0.3)'  },
  DRAFT:     { bg:'rgba(148,163,184,0.12)', color:'#94a3b8', border:'rgba(148,163,184,0.3)' },
  COMPLETED: { bg:'rgba(59,130,246,0.12)',  color:'#60a5fa', border:'rgba(59,130,246,0.3)'  },
  CLOSED:    { bg:'rgba(239,68,68,0.12)',   color:'#ef4444', border:'rgba(239,68,68,0.3)'   },
};

export default function ManageCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('All');

  const load = () => {
    setLoading(true);
    axiosInstance.get('/api/admin/campaigns')
      .then(r => setCampaigns(r.data?.data || []))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try {
      await axiosInstance.put(`/api/admin/campaigns/${id}/approve`);
      toast.success('Campaign approved and set to ACTIVE!');
      setCampaigns(p => p.map(c => c.campaignId === id ? {...c, status:'ACTIVE'} : c));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve'); }
  };

  const setStatus = async (id, status) => {
    try {
      await axiosInstance.put(`/api/admin/campaigns/${id}/status?status=${status}`);
      toast.success(`Campaign set to ${status}`);
      setCampaigns(p => p.map(c => c.campaignId === id ? {...c, status} : c));
    } catch { toast.error('Failed to update status'); }
  };

  const deleteCampaign = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/api/admin/campaigns/${id}`);
      toast.success('Campaign deleted');
      setCampaigns(p => p.filter(c => c.campaignId !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const displayed = campaigns.filter(c => {
    if (filter !== 'All' && c.status !== filter) return false;
    if (search) return c.campaignName?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const total   = campaigns.length;
  const active  = campaigns.filter(c => c.status === 'ACTIVE').length;
  const draft   = campaigns.filter(c => c.status === 'DRAFT').length;
  const raised  = campaigns.reduce((s,c) => s + Number(c.collectedAmount||0), 0);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:16 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:900 }}>Manage <span className="gradient-text">Campaigns</span></h1>
              <p style={{ color:'var(--text-muted)', marginTop:4 }}>{total} campaigns • ₹{(raised/100000).toFixed(1)}L raised</p>
            </div>
            <Link to="/admin/campaigns/new" className="btn btn-primary">+ Create Campaign</Link>
          </div>

          {/* Stats */}
          <div className="grid-4" style={{ marginBottom:28 }}>
            {[
              { label:'Total',     value:total,                  color:'#6c3ce8', bg:'rgba(108,60,232,0.12)', icon:'🎯' },
              { label:'Active',    value:active,                 color:'#10b981', bg:'rgba(16,185,129,0.12)',  icon:'✅' },
              { label:'Draft',     value:draft,                  color:'#94a3b8', bg:'rgba(148,163,184,0.12)', icon:'📝' },
              { label:'Total Raised', value:`₹${(raised/100000).toFixed(1)}L`, color:'#f59e0b', bg:'rgba(245,158,11,0.12)', icon:'💰' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ borderRadius:14 }}>
                <div className="stat-icon" style={{ background:s.bg, color:s.color }}>{s.icon}</div>
                <div>
                  <div className="stat-value" style={{ color:s.color, fontSize:22 }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="card" style={{ padding:'14px 20px', marginBottom:16, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ flex:1, position:'relative', minWidth:200 }}>
              <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:0.4 }}>🔍</span>
              <input className="form-control" placeholder="Search campaigns…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft:36, height:36 }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {['All','ACTIVE','DRAFT','COMPLETED','CLOSED'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600,
                  border:'none', cursor:'pointer',
                  background: filter===f ? 'linear-gradient(135deg,var(--primary),var(--primary-light))' : 'rgba(255,255,255,0.06)',
                  color: filter===f ? '#fff' : 'var(--text-muted)',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? <div className="spinner" /> : (
            <div className="card" style={{ padding:0 }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Campaign</th>
                      <th>Category</th>
                      <th>Goal</th>
                      <th>Raised</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                        No campaigns found
                      </td></tr>
                    ) : displayed.map((c, i) => {
                      const st = STATUS_COLOR[c.status] || STATUS_COLOR.DRAFT;
                      const pct = c.goalAmount > 0
                        ? Math.min(100, (Number(c.collectedAmount) / Number(c.goalAmount)) * 100)
                        : 0;
                      return (
                        <tr key={c.campaignId}>
                          <td style={{ color:'var(--text-muted)', fontSize:12 }}>{i+1}</td>
                          <td style={{ maxWidth:200 }}>
                            <div style={{ fontWeight:600, fontSize:13 }}>{c.campaignName}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                              {c.endDate ? `Ends ${new Date(c.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}` : ''}
                            </div>
                          </td>
                          <td>
                            <span style={{ background:'rgba(108,60,232,0.12)', color:'var(--primary-light)', borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:600 }}>
                              {c.category || '—'}
                            </span>
                          </td>
                          <td style={{ fontWeight:600, fontSize:13 }}>₹{Number(c.goalAmount||0).toLocaleString('en-IN')}</td>
                          <td style={{ color:'#10b981', fontWeight:700, fontSize:13 }}>₹{Number(c.collectedAmount||0).toLocaleString('en-IN')}</td>
                          <td style={{ minWidth:120 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden' }}>
                                <div style={{ height:'100%', borderRadius:99, width:`${pct}%`,
                                  background: pct>=80 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,var(--primary),var(--primary-light))' }} />
                              </div>
                              <span style={{ fontSize:11, color:'var(--text-muted)', minWidth:30 }}>{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:700, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                              {c.status === 'DRAFT' && (
                                <button className="btn btn-success btn-sm" onClick={() => approve(c.campaignId)}>
                                  ✓ Approve
                                </button>
                              )}
                              {c.status === 'ACTIVE' && (
                                <button className="btn btn-secondary btn-sm" onClick={() => setStatus(c.campaignId, 'CLOSED')}>
                                  Close
                                </button>
                              )}
                              {c.status === 'CLOSED' && (
                                <button className="btn btn-secondary btn-sm" onClick={() => setStatus(c.campaignId, 'ACTIVE')}>
                                  Reopen
                                </button>
                              )}
                              <Link to={`/admin/campaigns/edit/${c.campaignId}`} className="btn btn-secondary btn-sm">
                                ✏️ Edit
                              </Link>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteCampaign(c.campaignId, c.campaignName)}>
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
                Showing {displayed.length} of {total} campaigns
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
