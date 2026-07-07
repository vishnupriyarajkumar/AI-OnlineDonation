import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar } from './AdminSidebar';
import toast from 'react-hot-toast';

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const MOCK = [
  { userId:1, fullName:'System Admin', email:'admin@charityorg.com', phone:'+919876543210', role:{roleName:'ADMIN'}, locked:false, enabled:true, isVerified:true,  createdAt:'2024-01-01T00:00:00' },
  { userId:2, fullName:'Riya Sharma',  email:'riya@example.com',     phone:'+919876500001', role:{roleName:'USER'},  locked:false, enabled:true, isVerified:true,  createdAt:'2024-02-10T00:00:00' },
  { userId:3, fullName:'Arjun Mehta', email:'arjun@example.com',     phone:'+919876500002', role:{roleName:'USER'},  locked:true,  enabled:true, isVerified:true,  createdAt:'2024-03-05T00:00:00' },
  { userId:4, fullName:'Vicky Demo',   email:'mrvicks67@gmail.com',  phone:'+919876500004', role:{roleName:'USER'},  locked:false, enabled:true, isVerified:false, createdAt:'2024-04-15T00:00:00' },
];

export default function ManageUsers() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('All'); // All | Active | Locked | Unverified
  const [showAdd,  setShowAdd]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [selected, setSelected] = useState(null); // user to view activity
  const [activity, setActivity] = useState([]);
  const [actLoad,  setActLoad]  = useState(false);
  const [newUser,  setNewUser]  = useState({ fullName:'', email:'', password:'', phone:'', address:'' });
  const [pwdErr,   setPwdErr]   = useState('');

  const load = () => {
    setLoading(true);
    axiosInstance.get('/api/admin/users')
      .then(r => setUsers(r.data?.data || []))
      .catch(() => { setUsers(MOCK); toast('Showing demo data', { icon:'📴' }); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const viewActivity = async (u) => {
    setSelected(u);
    setActLoad(true);
    try {
      const r = await axiosInstance.get(`/api/admin/users/${u.userId}/activity`);
      setActivity(r.data?.data || []);
    } catch { setActivity([]); }
    finally { setActLoad(false); }
  };

  const toggleLock = async (id, locked) => {
    try {
      const r = await axiosInstance.put(`/api/admin/users/${id}/toggle-lock`);
      toast.success(r.data?.message || 'Updated');
      setUsers(p => p.map(u => u.userId === id ? { ...u, locked: !locked, failedLoginAttempts: !locked ? 0 : u.failedLoginAttempts } : u));
    } catch { toast.error('Action failed'); }
  };

  const toggleEnable = async (id, enabled) => {
    try {
      const r = await axiosInstance.put(`/api/admin/users/${id}/toggle-enable`);
      toast.success(r.data?.message || 'Updated');
      setUsers(p => p.map(u => u.userId === id ? { ...u, enabled: !enabled } : u));
    } catch { toast.error('Action failed'); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete user "${u.fullName}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/api/admin/users/${u.userId}`);
      toast.success('User deleted');
      setUsers(p => p.filter(x => x.userId !== u.userId));
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!PWD_REGEX.test(newUser.password)) { setPwdErr('Min 8 chars: upper, lower, digit, special'); return; }
    setSaving(true);
    try {
      await axiosInstance.post('/api/auth/register', { ...newUser, confirmPassword: newUser.password });
      toast.success(`User "${newUser.fullName}" created! They must verify their email.`);
      setShowAdd(false);
      setNewUser({ fullName:'', email:'', password:'', phone:'', address:'' });
      setPwdErr('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u => {
    if (filter === 'Active'     && (u.locked || !u.enabled)) return false;
    if (filter === 'Locked'     && !u.locked)                return false;
    if (filter === 'Unverified' && u.isVerified)             return false;
    if (search) {
      const q = search.toLowerCase();
      return u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    All: users.length,
    Active: users.filter(u => !u.locked && u.enabled).length,
    Locked: users.filter(u => u.locked).length,
    Unverified: users.filter(u => !u.isVerified).length,
  };

  const RC = { ADMIN:'#ef4444', USER:'#10b981' };

  // ── Activity drawer ──────────────────────────────────────────
  if (selected) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="dashboard-content">
            <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm" style={{ marginBottom:20 }}>
              ← Back to Users
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:`${RC[selected.role?.roleName] || '#888'}22`, border:`2px solid ${RC[selected.role?.roleName] || '#888'}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:RC[selected.role?.roleName] }}>
                {selected.fullName?.[0]}
              </div>
              <div>
                <h2 style={{ fontWeight:900, fontSize:22 }}>{selected.fullName}</h2>
                <p style={{ color:'var(--text-muted)', fontSize:13 }}>{selected.email} • {selected.role?.roleName}</p>
              </div>
            </div>

            <div className="card" style={{ padding:0 }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
                <h3 style={{ fontWeight:700 }}>Login History</h3>
              </div>
              {actLoad ? <div className="spinner" style={{ margin:40 }} /> : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Date & Time</th><th>Status</th><th>IP Address</th><th>Device</th><th>Logout</th></tr></thead>
                    <tbody>
                      {activity.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No login history found</td></tr>
                      ) : activity.map((a,i) => (
                        <tr key={i}>
                          <td style={{ fontSize:13 }}>{a.loginTime ? new Date(a.loginTime).toLocaleString('en-IN') : '—'}</td>
                          <td>
                            <span style={{ borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:700,
                              background: a.status==='SUCCESS'?'rgba(16,185,129,0.12)':a.status==='FAILED'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)',
                              color: a.status==='SUCCESS'?'#10b981':a.status==='FAILED'?'#ef4444':'#f59e0b' }}>
                              {a.status==='SUCCESS'?'✅ Success':a.status==='FAILED'?'❌ Failed':'🔒 Locked'}
                            </span>
                          </td>
                          <td style={{ fontFamily:'monospace', fontSize:12 }}>{a.ipAddress || '—'}</td>
                          <td style={{ fontSize:11, color:'var(--text-muted)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.deviceInfo || '—'}</td>
                          <td style={{ fontSize:12, color:'var(--text-muted)' }}>{a.logoutTime ? new Date(a.logoutTime).toLocaleString('en-IN') : '—'}</td>
                        </tr>
                      ))}
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

  // ── Main list ────────────────────────────────────────────────
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:16 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:900 }}>Manage <span className="gradient-text">Users</span></h1>
              <p style={{ color:'var(--text-muted)', marginTop:4 }}>{users.length} registered accounts</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setShowAdd(p=>!p); setPwdErr(''); }}>
              {showAdd ? '✕ Cancel' : '+ Add User'}
            </button>
          </div>

          {/* Add User Form */}
          {showAdd && (
            <div className="card" style={{ marginBottom:24, padding:28, border:'1px solid rgba(108,60,232,0.3)' }}>
              <h3 style={{ fontWeight:700, marginBottom:20, fontSize:16 }}>➕ Create New User Account</h3>
              <form onSubmit={handleAdd}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input required className="form-control" placeholder="John Doe"
                      value={newUser.fullName} onChange={e=>setNewUser(p=>({...p,fullName:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input required type="email" className="form-control" placeholder="john@example.com"
                      value={newUser.email} onChange={e=>setNewUser(p=>({...p,email:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input required type="password" className="form-control" placeholder="Min 8 chars"
                      value={newUser.password} onChange={e=>{setNewUser(p=>({...p,password:e.target.value}));setPwdErr('');}}/>
                    {pwdErr && <p style={{color:'#ef4444',fontSize:12,marginTop:4}}>⚠ {pwdErr}</p>}
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="form-control" placeholder="9876543210"
                      value={newUser.phone} onChange={e=>setNewUser(p=>({...p,phone:e.target.value}))}/>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Address</label>
                    <input className="form-control" placeholder="City, State"
                      value={newUser.address} onChange={e=>setNewUser(p=>({...p,address:e.target.value}))}/>
                  </div>
                </div>
                <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
                  <p style={{ color:'#93c5fd', fontSize:12 }}>📧 User will receive a verification email and must verify before logging in.</p>
                </div>
                <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Creating…' : '✓ Create User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {['All','Active','Locked','Unverified'].map(f => (
              <button key={f} onClick={()=>setFilter(f)} style={{
                padding:'6px 16px', borderRadius:99, fontSize:12, fontWeight:600, border:'none', cursor:'pointer',
                background: filter===f ? 'linear-gradient(135deg,var(--primary),var(--primary-light))' : 'rgba(255,255,255,0.06)',
                color: filter===f ? '#fff' : 'var(--text-muted)',
              }}>
                {f} <span style={{ opacity:0.7 }}>({counts[f]})</span>
              </button>
            ))}
            <div style={{ marginLeft:'auto', position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', opacity:0.4 }}>🔍</span>
              <input className="form-control" placeholder="Search…" value={search}
                onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:36, width:220, height:34 }}/>
            </div>
          </div>

          {/* Table */}
          {loading ? <div className="spinner"/> : (
            <div className="card" style={{ padding:0 }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>User</th><th>Phone</th><th>Role</th>
                      <th>Verified</th><th>Joined</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u,i) => (
                      <tr key={u.userId}>
                        <td style={{ color:'var(--text-muted)', fontSize:13 }}>{i+1}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:`${RC[u.role?.roleName]||'#888'}22`, border:`1px solid ${RC[u.role?.roleName]||'#888'}44`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:RC[u.role?.roleName] }}>
                              {u.fullName?.[0]||'?'}
                            </div>
                            <div>
                              <p style={{ fontWeight:600, fontSize:14 }}>{u.fullName}</p>
                              <p style={{ color:'var(--text-muted)', fontSize:12 }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize:13 }}>{u.phone||'—'}</td>
                        <td>
                          <span style={{ background:`${RC[u.role?.roleName]||'#888'}18`, color:RC[u.role?.roleName]||'#888', border:`1px solid ${RC[u.role?.roleName]||'#888'}33`, borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
                            {u.role?.roleName==='ADMIN'?'👑':'👤'} {u.role?.roleName}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize:12, color: u.isVerified ? '#10b981' : '#f59e0b', fontWeight:600 }}>
                            {u.isVerified ? '✅ Verified' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ fontSize:12, color:'var(--text-muted)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td>
                          <span style={{ borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:700,
                            background: u.locked ? 'rgba(239,68,68,0.12)' : !u.enabled ? 'rgba(107,114,128,0.15)' : 'rgba(16,185,129,0.12)',
                            color: u.locked ? '#ef4444' : !u.enabled ? '#9ca3af' : '#10b981',
                            border: `1px solid ${u.locked ? 'rgba(239,68,68,0.3)' : !u.enabled ? 'rgba(107,114,128,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                            {u.locked ? '🔒 Locked' : !u.enabled ? '⛔ Disabled' : '✅ Active'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            <button className="btn btn-secondary btn-sm" onClick={()=>viewActivity(u)} title="View login activity">
                              📋
                            </button>
                            {u.role?.roleName !== 'ADMIN' && (<>
                              <button className={`btn btn-sm ${u.locked ? 'btn-primary' : 'btn-danger'}`}
                                onClick={()=>toggleLock(u.userId, u.locked)} title={u.locked ? 'Unlock' : 'Lock'}>
                                {u.locked ? '🔓' : '🔒'}
                              </button>
                              <button className="btn btn-secondary btn-sm"
                                onClick={()=>toggleEnable(u.userId, u.enabled)} title={u.enabled ? 'Disable' : 'Enable'}>
                                {u.enabled ? '⛔' : '✅'}
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={()=>deleteUser(u)} title="Delete user">
                                🗑
                              </button>
                            </>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
