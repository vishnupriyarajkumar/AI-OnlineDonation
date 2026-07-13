import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar } from './AdminSidebar';

const TYPE_META = {
  REGISTERED:           { icon:'✅', color:'#10b981', label:'Registered'         },
  EMAIL_VERIFIED:       { icon:'📧', color:'#3b82f6', label:'Email Verified'     },
  MOBILE_VERIFIED:      { icon:'📱', color:'#3b82f6', label:'Mobile Verified'    },
  LOGGED_IN:            { icon:'🔑', color:'#10b981', label:'Login'              },
  LOGGED_OUT:           { icon:'🚪', color:'#9090b0', label:'Logout'             },
  LOGIN_FAILED:         { icon:'❌', color:'#ef4444', label:'Login Failed'        },
  ACCOUNT_LOCKED:       { icon:'🔒', color:'#ef4444', label:'Account Locked'     },
  PASSWORD_CHANGED:     { icon:'🔐', color:'#f59e0b', label:'Password Changed'   },
  PROFILE_UPDATED:      { icon:'👤', color:'#a78bfa', label:'Profile Updated'    },
  DONATION_INITIATED:   { icon:'💜', color:'#8b5cf6', label:'Donation Started'  },
  DONATION_COMPLETED:   { icon:'💰', color:'#10b981', label:'Donation Success'  },
  DONATION_FAILED:      { icon:'⚠️', color:'#ef4444', label:'Donation Failed'   },
  CAMPAIGN_VIEWED:      { icon:'👁️', color:'#9090b0', label:'Campaign Viewed'   },
  USER_CREATED:         { icon:'➕', color:'#10b981', label:'User Created'       },
  USER_DELETED:         { icon:'🗑', color:'#ef4444', label:'User Deleted'       },
  USER_LOCKED:          { icon:'🔒', color:'#ef4444', label:'User Locked'        },
  USER_UNLOCKED:        { icon:'🔓', color:'#10b981', label:'User Unlocked'      },
  CAMPAIGN_CREATED:     { icon:'🎯', color:'#f59e0b', label:'Campaign Created'  },
  CAMPAIGN_UPDATED:     { icon:'✏️', color:'#f59e0b', label:'Campaign Updated'  },
  CAMPAIGN_DELETED:     { icon:'🗑', color:'#ef4444', label:'Campaign Deleted'  },
  FUND_ALLOCATED:       { icon:'💼', color:'#f59e0b', label:'Fund Allocated'    },
};

const FILTER_GROUPS = {
  'All': null,
  'Auth': ['REGISTERED','EMAIL_VERIFIED','MOBILE_VERIFIED','LOGGED_IN','LOGGED_OUT','LOGIN_FAILED','ACCOUNT_LOCKED'],
  'Donations': ['DONATION_INITIATED','DONATION_COMPLETED','DONATION_FAILED'],
  'Profile': ['PROFILE_UPDATED','PASSWORD_CHANGED'],
  'Admin': ['USER_CREATED','USER_DELETED','USER_LOCKED','USER_UNLOCKED','CAMPAIGN_CREATED','CAMPAIGN_UPDATED','CAMPAIGN_DELETED','FUND_ALLOCATED'],
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

export default function ActivityLogs() {
  const [activities, setActivities] = useState([]);
  const [stats,      setStats]      = useState({});
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [group,      setGroup]      = useState('All');
  const [search,     setSearch]     = useState('');
  const [userId,     setUserId]     = useState('');

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const types = FILTER_GROUPS[group];
      const params = new URLSearchParams({ page: p, size: 25 });
      if (userId) params.set('userId', userId);

      const [aRes, sRes] = await Promise.all([
        axiosInstance.get(`/api/admin/activities?${params}`),
        axiosInstance.get('/api/admin/activities/stats'),
      ]);

      if (aRes?.data?.data?.content) {
        let content = aRes.data.data.content;
        // Client-side filter by group
        if (types && types.length > 0) {
          content = content.filter(a => types.includes(a.activityType));
        }
        // Client-side search
        if (search) {
          const q = search.toLowerCase();
          content = content.filter(a =>
            a.user?.email?.toLowerCase().includes(q) ||
            a.user?.fullName?.toLowerCase().includes(q) ||
            a.activityType?.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q));
        }
        setActivities(content);
        setTotalPages(aRes.data.data.totalPages || 1);
      } else {
        setActivities([]);
      }
      if (sRes?.data?.data) setStats(sRes.data.data);
    } catch (err) {
      console.error('Activity load failed:', err);
      setActivities([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page, group, userId]);

  const statCards = [
    { icon:'🔑', label:'Total Logins',         value: stats.totalLogins        || 0, color:'#10b981' },
    { icon:'✅', label:'Registrations',        value: stats.totalRegistrations  || 0, color:'#3b82f6' },
    { icon:'💰', label:'Donations Completed',  value: stats.totalDonations     || 0, color:'#8b5cf6' },
    { icon:'👥', label:'Active Users Today',   value: stats.activeUsersToday   || 0, color:'#f59e0b' },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:26, fontWeight:900 }}>Activity <span className="gradient-text">Monitor</span></h1>
            <p style={{ color:'var(--text-muted)', marginTop:4 }}>Track every user action — registrations, logins, donations, profile changes</p>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
            {statCards.map(s => (
              <div key={s.label} style={{ background:'var(--bg-glass)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:28 }}>{s.icon}</span>
                <div>
                  <p style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</p>
                  <p style={{ fontSize:12, color:'var(--text-muted)' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="card" style={{ padding:'16px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
              {Object.keys(FILTER_GROUPS).map(g => (
                <button key={g} onClick={() => { setGroup(g); setPage(0); }} style={{
                  padding:'6px 16px', borderRadius:99, fontSize:12, fontWeight:600,
                  border:'none', cursor:'pointer',
                  background: group===g ? 'linear-gradient(135deg,var(--primary),var(--primary-light))' : 'rgba(255,255,255,0.06)',
                  color: group===g ? '#fff' : 'var(--text-muted)',
                }}>{g}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:2, position:'relative' }}>
                <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:0.4 }}>🔍</span>
                <input className="form-control" placeholder="Search user or activity…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft:36, height:36 }} onKeyDown={e => e.key==='Enter' && load(0)} />
              </div>
              <div style={{ flex:1, position:'relative' }}>
                <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:0.4 }}>👤</span>
                <input className="form-control" placeholder="Filter by User ID"
                  value={userId} onChange={e => setUserId(e.target.value)}
                  style={{ paddingLeft:36, height:36 }} type="number" />
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setUserId(''); setGroup('All'); setPage(0); load(0); }}>
                Clear
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? <div className="spinner" /> : (
            <>
              <div className="card" style={{ padding:0, marginBottom:20 }}>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th><th>User</th><th>Activity</th><th>Description</th><th>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>
                          No activities found
                        </td></tr>
                      ) : activities.map(a => {
                        const meta = TYPE_META[a.activityType] || { icon:'•', color:'#9090b0', label: a.activityType };
                        return (
                          <tr key={a.id}>
                            <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                              <div style={{ fontWeight:500 }}>{timeAgo(a.timestamp)}</div>
                              <div style={{ fontSize:11, opacity:0.6 }}>
                                {new Date(a.timestamp).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                              </div>
                            </td>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0,
                                  background:'linear-gradient(135deg,rgba(108,60,232,0.3),rgba(139,92,246,0.2))',
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  fontWeight:700, color:'var(--primary-light)', fontSize:13 }}>
                                  {a.user?.fullName?.[0] || '?'}
                                </div>
                                <div>
                                  <p style={{ fontWeight:600, fontSize:13 }}>{a.user?.fullName || 'System'}</p>
                                  <p style={{ color:'var(--text-muted)', fontSize:11 }}>{a.user?.email || a.user?.phone || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                display:'inline-flex', alignItems:'center', gap:5,
                                background: meta.color + '18', color: meta.color,
                                border:`1px solid ${meta.color}30`,
                                borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:700, whiteSpace:'nowrap',
                              }}>
                                {meta.icon} {meta.label}
                              </span>
                            </td>
                            <td style={{ fontSize:12, color:'var(--text-muted)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {a.description || '—'}
                            </td>
                            <td style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace' }}>
                              {a.ipAddress || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div style={{ display:'flex', gap:12, alignItems:'center', justifyContent:'center' }}>
                <button className="btn btn-secondary btn-sm" disabled={page===0} onClick={() => setPage(p=>p-1)}>← Prev</button>
                <span style={{ color:'var(--text-muted)', fontSize:14 }}>Page {page+1} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page>=totalPages-1} onClick={() => setPage(p=>p+1)}>Next →</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

