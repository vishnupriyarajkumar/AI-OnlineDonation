import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function Unauthorized() {
  const { t } = useLanguage();
  return (
    <motion.div
      style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20, textAlign:'center', padding:24 }}
      initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.4 }}>
      <motion.div style={{ fontSize:80 }}
        animate={{ rotate:[-5,5,-5,0] }} transition={{ duration:1, delay:0.3 }}>🚫</motion.div>
      <h1 style={{ fontSize:40, fontWeight:900 }}>{t('accessDenied') || 'Access Denied'}</h1>
      <p style={{ color:'var(--text-muted)' }}>{t('noPermissionToView') || "You don't have permission to view this page."}</p>
      <Link to="/">
        <motion.button className="btn btn-primary" whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}>
          {t('goHome') || 'Go Home'}
        </motion.button>
      </Link>
    </motion.div>
  );
}
