import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar } from './AdminSidebar';
import toast from 'react-hot-toast';

export default function FundAllocation() {
  const [campaigns,   setCampaigns]   = useState([]);
  const [selected,    setSelected]    = useState('');
  const [campaign,    setCampaign]    = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [form,        setForm]        = useState({ amount:'', purpose:'', description:'' });
  const [loading,     setLoading]     = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/api/admin/campaigns')
      .then(r => {
        const active = (r.data?.data || []).filter(c => c.status === 'ACTIVE');
        setCampaigns(active);
      })
      .finally(() => setPageLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) { setAllocations([]); setCampaign(null); return; }
    const found = campaigns.find(c => String(c.campaignId) === String(selected));
    setCampaign(found || null);
    axiosInstance.get(`/api/admin/fund-allocations/${selected}`)
      .then(r => setAllocations(r.data?.data || []))
      .catch(() => setAllocations([]));
  }, [selected, campaigns]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const allocate = async e => {
    e.preventDefault();
    if (!selected) { toast.error('Please select a campaign'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setLoading(true);
    try {
      await axiosInstance.post('/api/admin/fund-allocations', {
        campaignId: Number(selected),
        amount: Number(form.amount),
        purpose: form.purpose,
        description: form.description,
      });
      toast.success('Funds allocated successfully!');
      setForm({ amount:'', purpose:'', description:'' });
      const r = await axiosInstance.get(`/api/admin/fund-allocations/${selected}`);
      setAllocations(r.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally { setLoading(false); }
  };

  const totalAllocated = allocations.reduce((s,a) => s + Number(a.amount||0), 0);
  const raised = campaign ? Number(campaign.collectedAmount||0) : 0;
  const remaining = raised - totalAllocated;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:26, fontWeight:900 }}>Fund <span className="gradient-text">Allocation</span></h1>
            <p style={{ color:'var(--text-muted)', marginTop:4 }}>Allocate collected funds to campaign activities transparently</p>
          </div>

          {/* Campaign selector */}
          <div className="card" style={{ marginBottom:24, padding:20 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:8, display:'block' }}>
              Select Active Campaign
            </label>
            {pageLoading ? <div className="spinner" style={{ margin:'10px auto' }} /> : (
              <select className="form-control" value={selected} onChange={e => setSelected(e.target.value)}>
                <option value="">— Choose a campaign —</option>
                {campaigns.map(c => (
                  <option key={c.campaignId} value={c.campaignId}>{c.campaignName}</option>
                ))}
              </select>
            )}
          </div>

          {/* Campaign stats bar */}
          {campaign && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
              {[
                { icon:'💰', label:'Total Raised',    value:`₹${raised.toLocaleString('en-IN')}`,         color:'#10b981' },
                { icon:'💼', label:'Total Allocated', value:`₹${totalAllocated.toLocaleString('en-IN')}`, color:'#6c3ce8' },
                { icon:'🏦', label:'Remaining',       value:`₹${remaining.toLocaleString('en-IN')}`,      color: remaining>=0 ? '#f59e0b' : '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ background:'var(--bg-glass)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:28 }}>{s.icon}</span>
                  <div>
                    <p style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</p>
                    <p style={{ fontSize:12, color:'var(--text-muted)' }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:24 }}>
            {/* Allocation form */}
            <div className="card" style={{ padding:28 }}>
              <h3 style={{ fontWeight:700, marginBottom:20, fontSize:16 }}>➕ New Allocation</h3>
              <form onSubmit={allocate}>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input className="form-control" type="number" name="amount" min="1"
                    placeholder="e.g. 50000" value={form.amount} onChange={handle} required />
                  {campaign && remaining > 0 && (
                    <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                      Available: ₹{remaining.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label>Purpose *</label>
                  <input className="form-control" name="purpose"
                    placeholder="e.g. Water pump installation" value={form.purpose} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" name="description" rows={3}
                    placeholder="Additional details (optional)" value={form.description} onChange={handle} />
                </div>
                <button type="submit" className="btn btn-primary w-full"
                  disabled={loading || !selected} style={{ justifyContent:'center', padding:14 }}>
                  {loading ? (
                    <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                      Allocating…
                    </span>
                  ) : 'Allocate Funds 💼'}
                </button>
              </form>
            </div>

            {/* History */}
            <div className="card" style={{ padding:0, display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'20px 20px 0' }}>
                <h3 style={{ fontWeight:700, fontSize:16 }}>📋 Allocation History</h3>
                {selected && <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>
                  {allocations.length} allocation{allocations.length !== 1 ? 's' : ''} for selected campaign
                </p>}
              </div>
              {!selected ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:48, color:'var(--text-muted)', fontSize:14 }}>
                  Select a campaign to view allocations
                </div>
              ) : allocations.length === 0 ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:48, color:'var(--text-muted)', fontSize:14 }}>
                  No allocations yet for this campaign
                </div>
              ) : (
                <div style={{ overflow:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--text-muted)', background:'rgba(255,255,255,0.025)', borderBottom:'1px solid var(--border)' }}>Purpose</th>
                        <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--text-muted)', background:'rgba(255,255,255,0.025)', borderBottom:'1px solid var(--border)' }}>Amount</th>
                        <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--text-muted)', background:'rgba(255,255,255,0.025)', borderBottom:'1px solid var(--border)' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((a,i) => (
                        <tr key={a.allocationId||i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding:'12px 16px' }}>
                            <div style={{ fontWeight:600, fontSize:13 }}>{a.purpose}</div>
                            {a.description && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{a.description}</div>}
                          </td>
                          <td style={{ padding:'12px 16px', fontWeight:700, color:'#f59e0b', fontSize:13 }}>
                            ₹{Number(a.amount).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding:'12px 16px', fontSize:12, color:'var(--text-muted)' }}>
                            {(a.allocatedAt || a.createdAt)
                              ? new Date(a.allocatedAt || a.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)', display:'flex', justifyContent:'space-between' }}>
                    <span>Total: {allocations.length} allocations</span>
                    <span style={{ color:'#6c3ce8', fontWeight:700 }}>₹{totalAllocated.toLocaleString('en-IN')} allocated</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

