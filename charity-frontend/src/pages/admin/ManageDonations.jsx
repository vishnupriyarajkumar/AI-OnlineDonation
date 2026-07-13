import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar } from './AdminSidebar';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  SUCCESS:  { bg:'rgba(16,185,129,0.12)',  color:'#10b981', border:'rgba(16,185,129,0.3)'  },
  PENDING:  { bg:'rgba(245,158,11,0.12)',  color:'#f59e0b', border:'rgba(245,158,11,0.3)'  },
  FAILED:   { bg:'rgba(239,68,68,0.12)',   color:'#ef4444', border:'rgba(239,68,68,0.3)'   },
  REFUNDED: { bg:'rgba(148,163,184,0.12)', color:'#94a3b8', border:'rgba(148,163,184,0.3)' },
};

export default function ManageDonations() {
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('All');

  useEffect(() => {
    axiosInstance.get('/api/admin/donations')
      .then(r => setDonations(r.data?.data || []))
      .catch(() => toast.error('Failed to load donations'))
      .finally(() => setLoading(false));
  }, []);

  const displayed = donations.filter(d => {
    if (filter !== 'All' && d.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.donorName?.toLowerCase().includes(q) ||
             d.campaignName?.toLowerCase().includes(q) ||
             d.transactionId?.toLowerCase().includes(q);
    }
    return true;
  });

  const total    = donations.filter(d => d.status === 'SUCCESS').reduce((s,d) => s + Number(d.amount), 0);
  const pending  = donations.filter(d => d.status === 'PENDING').length;
  const success  = donations.filter(d => d.status === 'SUCCESS').length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:26, fontWeight:900 }}>
              All <span className="gradient-text">Donations</span>
            </h1>
            <p style={{ color:'var(--text-muted)', marginTop:4 }}>Complete donation history with donor details</p>
          </div>

          {/* Stats */}
          <div className="grid-3" style={{ marginBottom:28 }}>
            {[
              { icon:'💜', label:'Total Donations', value: donations.length,                               color:'#6c3ce8', bg:'rgba(108,60,232,0.12)' },
              { icon:'✅', label:'Successful',      value: success,                                         color:'#10b981', bg:'rgba(16,185,129,0.12)'  },
              { icon:'💰', label:'Amount Collected', value:`₹${total.toLocaleString('en-IN')}`,            color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ borderRadius:16 }}>
                <div className="stat-icon" style={{ background:s.bg, color:s.color }}>{s.icon}</div>
                <div>
                  <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="card" style={{ padding:'14px 20px', marginBottom:16, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ flex:1, position:'relative', minWidth:200 }}>
              <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:0.4 }}>🔍</span>
              <input className="form-control" placeholder="Search donor, campaign, transaction…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft:36, height:36 }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {['All','SUCCESS','PENDING','FAILED'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600,
                  border:'none', cursor:'pointer',
                  background: filter===f ? 'linear-gradient(135deg,var(--primary),var(--primary-light))' : 'rgba(255,255,255,0.06)',
                  color: filter===f ? '#fff' : 'var(--text-muted)',
                }}>{f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
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
                      <th>Donor</th>
                      <th>Campaign</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                        No donations found
                      </td></tr>
                    ) : displayed.map((d, i) => {
                      const st = STATUS_STYLE[d.status] || STATUS_STYLE.FAILED;
                      return (
                        <tr key={d.donationId}>
                          <td style={{ color:'var(--text-muted)', fontSize:12 }}>{i+1}</td>
                          <td>
                            <div style={{ fontWeight:600, fontSize:13 }}>
                              {d.anonymous ? '🕵️ Anonymous' : (d.donorName || '—')}
                            </div>
                            {!d.anonymous && d.donorEmail && (
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{d.donorEmail}</div>
                            )}
                          </td>
                          <td style={{ fontWeight:600, fontSize:13, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {d.campaignName}
                          </td>
                          <td style={{ fontWeight:700, color:'#10b981', fontSize:14 }}>
                            ₹{Number(d.amount).toLocaleString('en-IN')}
                          </td>
                          <td style={{ fontSize:12, color:'var(--text-muted)' }}>
                            {d.paymentMethod?.replace(/_/g,' ') || '—'}
                          </td>
                          <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                            {d.donationDate ? new Date(d.donationDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                          </td>
                          <td>
                            <span style={{
                              borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:700,
                              background:st.bg, color:st.color, border:`1px solid ${st.border}`,
                            }}>
                              {d.status}
                            </span>
                          </td>
                          <td style={{ fontSize:12, color:'var(--primary-light)', fontFamily:'monospace' }}>
                            {d.receiptNumber || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
                Showing {displayed.length} of {donations.length} donations
                {pending > 0 && <span style={{ marginLeft:12, color:'#f59e0b' }}>⚠ {pending} pending</span>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

