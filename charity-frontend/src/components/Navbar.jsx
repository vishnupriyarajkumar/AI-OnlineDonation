import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationPanel from './NotificationPanel';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useLanguage();           // re-renders whenever lang changes
  const { pathname } = useLocation();
  const [scrolled,  setScrolled]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isActive = (p) => pathname === p || (p !== '/' && pathname.startsWith(p));

  const NAV_LINKS = [
    { to: '/',          label: t('nav.home')         || 'Home'          },
    { to: '/campaigns', label: t('nav.campaigns')    || 'Campaigns'     },
    { to: '/about',     label: t('nav.about')        || 'About'         },
    { to: '/contact',   label: t('nav.contact')      || 'Contact'       },
  ];

  return (
    <motion.nav
      className="navbar"
      style={{
        background: scrolled ? 'rgba(8,8,20,0.95)' : 'rgba(8,8,20,0.6)',
        backdropFilter: 'blur(24px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 0.3s ease',
      }}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <motion.div
          className="nav-logo"
          whileHover={{ scale: 1.03 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <motion.span
            style={{ fontSize: 22 }}
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          >💜</motion.span>
          <span className="gradient-text" style={{ fontWeight: 900, fontSize: 17 }}>
            New Dawn Foundation
          </span>
        </motion.div>
      </Link>

      {/* Desktop nav links */}
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {NAV_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} style={{ position: 'relative', textDecoration: 'none' }}>
            <motion.span
              className={`nav-link ${isActive(to) ? 'active' : ''}`}
              whileHover={{ color: '#a78bfa' }}
              style={{ display: 'block', padding: '8px 14px', fontSize: 14, fontWeight: 500 }}
            >
              {label}
              {isActive(to) && (
                <motion.div
                  layoutId="nav-underline"
                  style={{
                    position: 'absolute', bottom: 2, left: 14, right: 14,
                    height: 2, background: 'var(--primary-light)', borderRadius: 99,
                  }}
                />
              )}
            </motion.span>
          </Link>
        ))}

        {/* Language selector */}
        <LanguageSelector />

        {/* Auth area */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.span
              style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: 'rgba(108,60,232,0.15)', color: 'var(--primary-light)',
                border: '1px solid rgba(108,60,232,0.3)', whiteSpace: 'nowrap',
              }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              {isAdmin() ? '👑 ADMIN' : '💜 DONOR'}
            </motion.span>
            {!isAdmin() && <NotificationPanel />}
            <Link to={isAdmin() ? '/admin' : '/user'}>
              <motion.button className="btn btn-secondary btn-sm"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                {t('nav.dashboard') || 'Dashboard'}
              </motion.button>
            </Link>
            <motion.button onClick={logout} className="btn btn-sm"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              {t('nav.logout') || 'Logout'}
            </motion.button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/login">
              <motion.span className="nav-link"
                style={{ padding: '8px 14px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                whileHover={{ color: '#a78bfa' }}>
                {t('nav.login') || 'Login'}
              </motion.span>
            </Link>
            <Link to="/register">
              <motion.button className="btn btn-primary btn-sm"
                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.97 }}>
                {t('nav.register') || 'Register'}
              </motion.button>
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
