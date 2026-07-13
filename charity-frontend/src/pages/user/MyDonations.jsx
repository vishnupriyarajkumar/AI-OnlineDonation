import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

export default function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    axiosInstance.get('/api/user/donations/my')
      .then(r => setDonations(r.data?.data || []))
      .catch(err => {
        if (!err.response) {
          // Backend down — show empty state not error
          setDonations([]);
        } else {
          toast.error('Failed to load donations');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const STATUS_BADGE = { SUCCESS:'badge-active', PENDING:'badge-pending', FAILED:'badge-critical', REFUNDED:'badge-draft' };
  const total = donations.filter(d => d.status === 'SUCCESS').reduce((s,d) => s + Number(d.amount), 0);

  return (
    <div>
      <Navbar />
      <motion.div className="container" style={{ paddingTop:48, paddingBottom:80 }}
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
        <div className="page-header">
          <h1>My <span className="gradient-text">Donations</span></h1>
          <p style={{ color:'var(--text-muted)' }}>Track all your contributions and download receipts</p>
        </div>
        <div className="grid-3" style={{ marginBottom:32 }}>
          {[
            { icon:'💜', label: t('totalDonations') || 'Total Donations', val: donations.length },
            { icon:'✅', label: t('successful') || 'Successful', val: donations.filter(d=>d.status==='SUCCESS').length },
            { icon:'₹', label: t('totalContributed') || 'Total Contributed', val: `₹${total.toLocaleString('en-IN')}` },
          ].map((s,i) => (
            <motion.div key={i} className="stat-card"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:i*0.1 }} whileHover={{ y:-4 }}>
              <div className="stat-icon" style={{ background:'rgba(108,60,232,0.15)', color:'var(--primary-light)', fontSize:20 }}>{s.icon}</div>
              <div><div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div></div>
            </motion.div>
          ))}
        </div>
        {loading ? <div className="spinner" /> : donations.length === 0 ? (
          <div className="card text-center" style={{ padding:60 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>💜</div>
            <h3>No donations yet</h3>
            <p className="text-muted">Start supporting campaigns to see your history here.</p>
          </div>
        ) : (
          <div className="card" style={{ padding:0 }}>
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>{t('campaign')}</th><th>{t('amount')}</th><th>{t('method')}</th>
                  <th>{t('date')}</th><th>{t('status')}</th><th>{t('receipt')}</th>
                </tr></thead>
                <tbody>
                  {donations.map(d => (
                    <tr key={d.donationId}>
                      <td style={{ fontWeight:600 }}>{d.campaignName}</td>
                      <td style={{ fontWeight:700, color:'#10b981' }}>₹{Number(d.amount).toLocaleString('en-IN')}</td>
                      <td>{d.paymentMethod?.replace('_',' ')}</td>
                      <td style={{ color:'var(--text-muted)', fontSize:13 }}>
                        {d.donationDate ? new Date(d.donationDate).toLocaleDateString('en-IN', { dateStyle:'medium' }) : '—'}
                      </td>
                      <td><span className={`badge ${STATUS_BADGE[d.status]||'badge-draft'}`}>{d.status}</span></td>
                      <td>
                        {d.receiptNumber ? (
                          <span style={{ color:'var(--primary-light)', fontWeight:600, fontSize:13 }}>
                            {d.receiptNumber}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
