import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="nav-logo gradient-text">💜 CharityOrg</div>
            <p>Empowering communities through transparent donations and impactful campaigns since 2024.</p>
          </div>
          <div className="footer-section">
            <h4>{t('quickLinks') || 'Quick Links'}</h4>
            <Link to="/">{t('home')}</Link>
            <Link to="/campaigns">{t('campaigns')}</Link>
            <Link to="/about">{t('about')}</Link>
            <Link to="/contact">{t('contact')}</Link>
          </div>
          <div className="footer-section">
            <h4>{t('forDonors') || 'For Donors'}</h4>
            <Link to="/register">{t('register')}</Link>
            <Link to="/login">{t('login')}</Link>
            <Link to="/user/donations">{t('myDonations')}</Link>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <a href="mailto:support@charityorg.com">support@charityorg.com</a>
            <a href="tel:1800XXXXXX">1800-XXX-XXXX (Toll Free)</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms & Conditions</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2024 CharityOrg. All rights reserved.</span>
          <span>Made with 💜 for a better world</span>
        </div>
      </div>
    </footer>
  );
}
