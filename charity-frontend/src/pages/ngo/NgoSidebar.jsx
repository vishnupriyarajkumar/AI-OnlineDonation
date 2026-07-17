import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';

const NAV_ITEMS = [
  { to: '/ngo',              icon: '📊', label: 'Dashboard' },
  { to: '/ngo/campaigns',   icon: '🎯', label: 'My Campaigns' },
  { to: '/ngo/create',      icon: '➕', label: 'Create Campaign' },
  { to: '/ngo/analytics',   icon: '📈', label: 'Analytics' },
  { to: '/ngo/volunteers',  icon: '🤝', label: 'Volunteers' },
  { to: '/ngo/profile',     icon: '👤', label: 'NGO Profile' },
];

export function NgoSidebar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { logout }   = useAuth();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <aside className="dashboard-sidebar">
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(167,139,250,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#06b6d4,#38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🏢</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>CharityOrg</div>
            <div style={{ fontSize: 11, color: '#38bdf8' }}>NGO Portal</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.to || (item.to !== '/ngo' && pathname.startsWith(item.to));
          return (
            <Link key={item.to} to={item.to} style={{ display: 'block', marginBottom: 4, textDecoration: 'none' }}>
              <motion.div
                className={`sidebar-item ${active ? 'active' : ''}`}
                whileHover={{ x: 3 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  background: active ? 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(56,189,248,0.1))' : 'transparent',
                  color: active ? '#38bdf8' : 'var(--text-muted)',
                  border: active ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '12px 12px 20px' }}>
        <motion.button
          onClick={handleLogout}
          style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)',
            background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          whileHover={{ background: 'rgba(239,68,68,0.15)' }}
        >
          🚪 Logout
        </motion.button>
      </div>
    </aside>
  );
}

export default NgoSidebar;
