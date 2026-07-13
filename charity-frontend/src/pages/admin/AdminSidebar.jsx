import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to:'/',                      icon:'🏠', label:'Home'            },
  { to:'/admin',                 icon:'📊', label:'Dashboard'       },
  { to:'/admin/users',           icon:'👥', label:'Manage Users'    },
  { to:'/admin/campaigns',       icon:'🎯', label:'Campaigns'       },
  { to:'/admin/donations',       icon:'💰', label:'Donations'       },
  { to:'/admin/activities',      icon:'📡', label:'Activity Monitor'},
  { to:'/admin/audit-logs',      icon:'📋', label:'Audit Logs'      },
  { to:'/admin/fund-allocation', icon:'💼', label:'Fund Allocation' },
  { to:'/admin/reports',         icon:'📈', label:'Reports'         },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { pathname }     = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="gradient-text">💜 CharityOrg</span>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, fontWeight:400 }}>
          Admin Panel
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon, label }, i) => {
          const active = to === '/'
            ? pathname === '/'
            : to === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(to);
          return (
            <motion.div key={to}
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.05 }}>
              <Link to={to} className={`sidebar-link ${active ? 'active' : ''}`}>
                <span style={{ fontSize:18 }}>{icon}</span>
                {label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'10px 14px', marginBottom:8,
          background:'rgba(255,255,255,0.04)',
          borderRadius:10, border:'1px solid var(--border)',
        }}>
          <div style={{
            width:34, height:34, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,#6c3ce8,#8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:700, color:'#fff',
          }}>
            {user?.fullName?.[0] || 'A'}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.fullName || 'Admin'}
            </p>
            <p style={{ fontSize:11, color:'var(--text-muted)' }}>Administrator</p>
          </div>
        </div>
        <button onClick={logout} style={{
          width:'100%', padding:'10px', borderRadius:8,
          background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
          color:'#fca5a5', fontSize:13, fontWeight:600, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
