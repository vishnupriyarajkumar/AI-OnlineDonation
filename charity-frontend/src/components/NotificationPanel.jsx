import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const TYPE_ICON = {
  DONATION_SUCCESS:        '💰',
  DONATION_FAILED:         '⚠️',
  DONATION_RECEIPT:        '📄',
  SUBSCRIPTION_ACTIVATED:  '🎉',
  SUBSCRIPTION_REMINDER:   '⏰',
  SUBSCRIPTION_PROCESSED:  '✅',
  SUBSCRIPTION_RECEIPT:    '📋',
  SUBSCRIPTION_MODIFIED:   '✏️',
  SUBSCRIPTION_DATE_CHANGED:'📅',
  SUBSCRIPTION_PAUSED:     '⏸',
  SUBSCRIPTION_RESUMED:    '▶️',
  SUBSCRIPTION_CANCELLED:  '❌',
  CAMPAIGN_UPDATE:         '📢',
  CAMPAIGN_MILESTONE:      '🎯',
  CAMPAIGN_COMPLETED:      '🏆',
  IMPACT_REPORT:           '📊',
  WELCOME:                 '💜',
  ACCOUNT_VERIFIED:        '✅',
  ADMIN_NEW_USER:          '👤',
  ADMIN_NEW_SUBSCRIPTION:  '🔄',
  ADMIN_DONATION:          '💰',
  ADMIN_CAMPAIGN_UPDATE:   '🎯',
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

export default function NotificationPanel() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [open,        setOpen]        = useState(false);
  const [notifs,      setNotifs]      = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading,     setLoading]     = useState(false);
  const panelRef = useRef(null);

  // Poll unread count every 30 seconds
  useEffect(() => {
    if (!user) return;
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCount = async () => {
    try {
      const r = await axiosInstance.get('/api/user/notifications/unread-count');
      setUnreadCount(r.data?.data?.count || 0);
    } catch {}
  };

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get('/api/user/notifications?page=0&size=15');
      setNotifs(r.data?.data?.content || []);
    } catch {}
    finally { setLoading(false); }
  };

  const togglePanel = () => {
    if (!open) fetchNotifs();
    setOpen(p => !p);
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.post('/api/user/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifs(p => p.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const handleClick = async (n) => {
    if (!n.read) {
      try {
        await axiosInstance.post(`/api/user/notifications/${n.id}/read`);
        setNotifs(p => p.map(x => x.id === n.id ? {...x, read:true} : x));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch {}
    }
    if (n.link) { setOpen(false); navigate(n.link); }
  };

  if (!user) return null;

  return (
    <div ref={panelRef} style={{ position:'relative' }}>
      {/* Bell button */}
      <button onClick={togglePanel}
        style={{ position:'relative', background:'none', border:'none', cursor:'pointer', padding:'6px 8px', borderRadius:8, color:'var(--text-muted)', fontSize:20, display:'flex', alignItems:'center', transition:'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
        aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span style={{ position:'absolute', top:2, right:2, background:'#ef4444', color:'#fff', fontSize:10, fontWeight:800, borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg)' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:360, maxHeight:480, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, boxShadow:'0 20px 60px rgba(0,0,0,0.5)', zIndex:9999, display:'flex', flexDirection:'column', overflow:'hidden', animation:'fadeUp 0.2s ease' }}>
          {/* Header */}
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
            <div>
              <span style={{ fontWeight:700, fontSize:15 }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ background:'rgba(108,60,232,0.15)', color:'var(--primary-light)', borderRadius:99, padding:'1px 8px', fontSize:11, fontWeight:700, marginLeft:8 }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                style={{ background:'none', border:'none', color:'var(--primary-light)', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY:'auto', flex:1 }}>
            {loading ? (
              <div style={{ padding:32, textAlign:'center' }}>
                <div className="spinner" style={{ margin:'0 auto', width:28, height:28, borderWidth:2 }} />
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🔔</div>
                <p style={{ fontSize:13 }}>No notifications yet</p>
              </div>
            ) : notifs.map(n => (
              <div key={n.id} onClick={() => handleClick(n)}
                style={{ display:'flex', gap:12, padding:'12px 16px', cursor: n.link ? 'pointer' : 'default', borderBottom:'1px solid rgba(255,255,255,0.04)', background: n.read ? 'transparent' : 'rgba(108,60,232,0.06)', transition:'background 0.2s' }}
                onMouseEnter={e => { if (n.link) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(108,60,232,0.06)'}>
                <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:'rgba(108,60,232,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
                  {TYPE_ICON[n.type] || '🔔'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <p style={{ fontWeight: n.read ? 500 : 700, fontSize:13, lineHeight:1.4 }}>{n.title}</p>
                    {!n.read && <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--primary-light)', flexShrink:0, marginTop:3 }} />}
                  </div>
                  <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:3, lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {n.message}
                  </p>
                  <p style={{ color:'var(--text-muted)', fontSize:11, marginTop:4, opacity:0.6 }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', textAlign:'center', flexShrink:0 }}>
            <button onClick={() => { setOpen(false); navigate('/user/notifications'); }}
              style={{ background:'none', border:'none', color:'var(--primary-light)', fontSize:12, cursor:'pointer', fontWeight:600 }}>
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
