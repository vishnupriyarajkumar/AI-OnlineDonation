import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Unauthorized() {
  const { t } = useLanguage();
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20, textAlign:'center' }}>
      <div style={{ fontSize:80 }}>🚫</div>
      <h1 style={{ fontSize:40, fontWeight:900 }}>{t('accessDenied') || 'Access Denied'}</h1>
      <p style={{ color:'var(--text-muted)' }}>{t('noPermissionToView') || "You don't have permission to view this page."}</p>
      <Link to="/" className="btn btn-primary">{t('goHome') || 'Go Home'}</Link>
    </div>
  );
}
