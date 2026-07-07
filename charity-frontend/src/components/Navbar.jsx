import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationPanel from './NotificationPanel';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { user, logout, isAdmin, isUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const getDashboardLink = () => {
    if (isAdmin()) return '/admin';
    if (isUser()) return '/user';
    return '/';
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo gradient-text">💜 New Dawn Foundation Trust</Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">{t('home')}</Link>
        <Link to="/campaigns" className="nav-link">{t('campaigns')}</Link>
        <Link to="/about" className="nav-link">{t('about')}</Link>
        <Link to="/contact" className="nav-link">{t('contact')}</Link>

        {/* Language selector always visible */}
        <LanguageSelector />

        {user ? (
          <div className="flex items-center gap-3">
            <span style={{
              fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
              background:'rgba(108,60,232,0.15)', color:'var(--primary-light)',
              border:'1px solid rgba(108,60,232,0.3)',
            }}>
              {isAdmin() ? '👑 ADMIN' : '💜 DONOR'}
            </span>

            {/* Notification bell — users only */}
            {!isAdmin() && <NotificationPanel />}

            <Link to={getDashboardLink()} className="btn btn-secondary btn-sm">
              {t('dashboard')}
            </Link>
            <button onClick={logout} className="btn btn-sm"
              style={{ background:'rgba(239,68,68,0.1)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.2)' }}>
              {t('logout')}
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="nav-link">{t('login')}</Link>
            <Link to="/register" className="btn btn-primary btn-sm">{t('register')}</Link>
          </>
        )}
      </div>
    </nav>
  );
}
