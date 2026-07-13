import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar } from './AdminSidebar';
import toast from 'react-hot-toast';

const ACTION_META = {
  LOGIN_SUCCESS:        { icon:'🔑', color:'#10b981', bg:'rgba(16,185,129,0.12)',  label:'Login Success'     },
  LOGIN_UNVERIFIED:     { icon:'📧', color:'#3b82f6', bg:'rgba(59,130,246,0.12)',  label:'Login Unverified'  },
  LOGIN_FAILED:         { icon:'❌', color:'#ef4444', bg:'rgba(239,68,68,0.12)',   label:'Login Failed'      },
  LOGIN_BLOCKED_LOCKED: { icon:'🔒', color:'#ef4444', bg:'rgba(239,68,68,0.12)',   label:'Login Blocked'     },
  OTP_VERIFICATION_FAILED:{ icon:'⚠️',color:'#f59e0b',bg:'rgba(245,158,11,0.12)', label:'OTP Failed'        },
  OTP_RESENT:           { icon:'🔄', color:'#a78bfa', bg:'rgba(167,139,250,0.12)',label:'OTP Resent'         },
  USER_REGISTERED:      { icon:'✅', color:'#10b981', bg:'rgba(16,185,129,0.12)', label:'Registered'         },
  ACCOUNT_VERIFIED:     { icon:'✔️', color:'#10b981', bg:'rgba(16,185,129,0.12)', label:'Email Verified'     },
  ACCOUNT_LOCKED:       { icon:'🔐', color:'#ef4444', bg:'rgba(239,68,68,0.12)',  label:'Account Locked'     },
  DONATION_INITIATED:   { icon:'💜', color:'#8b5cf6', bg:'rgba(139,92,246,0.12)',label:'Donation Started'    },
  DONATION_SUCCESS:     { icon:'💰', color:'#10b981', bg:'rgba(16,185,129,0.12)',label:'Donation Success'    },
  CAMPAIGN_CREATED:     { icon:'🎯', color:'#f59e0b', bg:'rgba(245,158,11,0.12)',label:'Campaign Created'    },
  LOGOUT:               { icon:'🚪', color:'#9090b0', bg:'rgba(144,144,176,0.1)',label:'Logout'              },
};

const FILTERS = ['All', 'Login', 'OTP', 'Donation', 'Account', 'Campaign'];
const FILTER_MAP = {
  Login:    ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_UNVERIFIED', 'LOGIN_BLOCKED_LOCKED'],
  OTP:      ['OTP_VERIFICATION_FAILED', 'OTP_RESENT'],
  Donation: ['DONATION_INITIATED', 'DONATION_SUCCESS'],
  Account:  ['USER_REGISTERED', 'ACCOUNT_VERIFIED', 'ACCOUNT_LOCKED'],
  Campaign: ['CAMPAIGN_CREATED', 'CAMPAIGN_APPROVED', 'CAMPAIGN_DELETED'],
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AuditLogs() {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter,     setFilter]     = useState('All');
  const [search,     setSearch]     = useState('');
  const [view,       setView]       = useState('all'); // 'all' | 'activity'

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(`/api/admin/audit-logs?page=${p}&size=25`);
      const data = r.data?.data;
      setLogs(data?.content || []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error('Audit logs load failed:', err);
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  // Stats
  const loginSuccessToday = logs.filter(l => l.action === 'LOGIN_SUCCESS').length;
  const failedLogins      = logs.filter(l => l.action === 'LOGIN_FAILED').length;
  const newUsers          = logs.filter(l => l.action === 'USER_REGISTERED').length;
  const lockedAccounts    = logs.filter(l => l.action === 'ACCOUNT_LOCKED').length;

  // Filter + search
  const displayed = logs.filter(l => {
    if (filter !== 'All' && !FILTER_MAP[filter]?.includes(l.action)) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.user?.email?.toLowerCase().includes(q) ||
             l.user?.fullName?.toLowerCase().includes(q) ||
             l.action?.toLowerCase().includes(q);
    }
    return true;
  });

  // Unique active users (login success)
  const activeUsers = [...new Set(
    logs.filter(l => l.action === 'LOGIN_SUCCESS').map(l => l.user?.email)
  )];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900 }}>Audit <span className="gradient-text">Logs</span></h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Complete system activity trail — user logins, OTP events, donations</p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { icon: '🔑', label: 'Logins',         value: loginSuccessToday, color: '#10b981' },
              { icon: '❌', label: 'Failed Logins',   value: failedLogins,      color: '#ef4444' },
              { icon: '✅', label: 'New Registrations',value: newUsers,          color: '#3b82f6' },
              { icon: '🔒', label: 'Locked Accounts', value: lockedAccounts,    color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-glass)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 20px', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <div>
                  <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {['all', 'activity'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: view === v ? 'linear-gradient(135deg,var(--primary),var(--primary-light))' : 'rgba(255,255,255,0.06)',
                color: view === v ? '#fff' : 'var(--text-muted)',
                boxShadow: view === v ? '0 4px 14px rgba(108,60,232,0.35)' : 'none',
              }}>
                {v === 'all' ? '📋 All Logs' : '👤 User Activity'}
              </button>
            ))}
          </div>

          {/* User Activity panel */}
          {view === 'activity' && (
            <div className="card" style={{ marginBottom: 24, padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
                👤 Recently Active Users
              </h3>
              {activeUsers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No login activity in current page.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeUsers.map(email => {
                    const userLogs = logs.filter(l => l.user?.email === email);
                    const lastLogin = userLogs.find(l => l.action === 'LOGIN_SUCCESS');
                    const donations = userLogs.filter(l => l.action === 'DONATION_SUCCESS').length;
                    const name = userLogs[0]?.user?.fullName || email;
                    return (
                      <div key={email} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg,rgba(108,60,232,0.3),rgba(139,92,246,0.2))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, color: 'var(--primary-light)', fontSize: 16,
                        }}>
                          {name[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{name}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{email}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                            Last login: {lastLogin ? timeAgo(lastLogin.timestamp) : '—'}
                          </p>
                          {donations > 0 && (
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              💰 {donations} donation{donations !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#10b981', flexShrink: 0,
                        }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Filter bar */}
          <div className="card" style={{ padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
              <input className="form-control" placeholder="Search user or action…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 36, height: 36 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: filter === f ? 'linear-gradient(135deg,var(--primary),var(--primary-light))' : 'rgba(255,255,255,0.06)',
                  color: filter === f ? '#fff' : 'var(--text-muted)',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Logs table */}
          {loading ? <div className="spinner" /> : (
            <>
              <div className="card" style={{ padding: 0, marginBottom: 20 }}>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Details</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map(l => {
                        const meta = ACTION_META[l.action] || { icon: '•', color: '#9090b0', bg: 'rgba(144,144,176,0.1)', label: l.action };
                        return (
                          <tr key={l.logId}>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              <div>{timeAgo(l.timestamp)}</div>
                              <div style={{ fontSize: 11, opacity: 0.6 }}>
                                {new Date(l.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{l.user?.fullName || 'System'}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{l.user?.email || '—'}</div>
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: meta.bg, color: meta.color,
                                border: `1px solid ${meta.color}30`,
                                borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}>
                                {meta.icon} {meta.label}
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {l.details || `${l.entityType || ''} ${l.entityId ? '#' + l.entityId : ''}`.trim() || '—'}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {l.ipAddress || '—'}
                            </td>
                          </tr>
                        );
                      })}
                      {displayed.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                          No logs match the selected filter
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Previous</button>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Page {page + 1} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

