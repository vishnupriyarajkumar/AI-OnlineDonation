import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function CampaignDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    axiosInstance.get(`/api/campaigns/public/${id}`)
      .then(r => setCampaign(r.data?.data))
      .catch(() => navigate('/campaigns'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <><Navbar /><div className="spinner" style={{ marginTop:120 }} /></>;
  if (!campaign) return null;

  const pct = campaign.progressPercent?.toFixed(1);
  const urgencyColors = { LOW:'#10b981', MEDIUM:'#f59e0b', HIGH:'#ef4444', CRITICAL:'#dc2626' };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop:48, paddingBottom:80 }}>
        <Link to="/campaigns" style={{ color:'var(--text-muted)', fontSize:14 }}>{t('backToCampaigns') || '← Back to Campaigns'}</Link>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:40, marginTop:32 }}>
          {/* Left */}
          <div>
            <img src={campaign.imageUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800'}
                 alt={campaign.campaignName}
                 style={{ width:'100%', height:400, objectFit:'cover', borderRadius:14, marginBottom:28 }} />
            <div className="flex gap-2 items-center" style={{ marginBottom:16 }}>
              <span className="badge badge-active">{campaign.category}</span>
              <span style={{ fontSize:13, color:urgencyColors[campaign.urgencyLevel], fontWeight:700 }}>
                ⚡ {t(campaign.urgencyLevel?.toLowerCase()) || campaign.urgencyLevel} {t('urgency') || 'Urgency'}
              </span>
              <span className="badge badge-active">{campaign.status}</span>
            </div>
            <h1 style={{ fontSize:32, fontWeight:900, marginBottom:16 }}>{campaign.campaignName}</h1>
            <p style={{ color:'var(--text-muted)', lineHeight:1.8, marginBottom:28 }}>{campaign.description}</p>
            <div className="grid-2" style={{ gap:16, marginBottom:28 }}>
              {[
                { label: t('startDate') || 'Start Date', val: campaign.startDate },
                { label: t('endDate') || 'End Date', val: campaign.endDate },
                { label: t('beneficiaries') || 'Beneficiaries', val: campaign.beneficiaries?.toLocaleString('en-IN') },
                { label: t('createdBy') || 'Created By', val: campaign.createdBy },
              ].map((f,i) => (
                <div key={i} className="card" style={{ padding:16 }}>
                  <div style={{ color:'var(--text-muted)', fontSize:12, marginBottom:4 }}>{f.label}</div>
                  <div style={{ fontWeight:600 }}>{f.val || '—'}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right — Donation Box */}
          <div>
            <div className="card" style={{ position:'sticky', top:80, padding:28 }}>
              <h3 style={{ fontWeight:800, marginBottom:20 }}>💜 {t('supportCampaign') || 'Support This Campaign'}</h3>
              <div style={{ marginBottom:20 }}>
                <div className="flex justify-between" style={{ fontSize:13, marginBottom:8 }}>
                  <span style={{ color:'var(--text-muted)' }}>{t('raised') || 'Raised'}</span>
                  <span style={{ fontWeight:700, color:'#10b981' }}>
                    ₹{Number(campaign.collectedAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="progress-bar" style={{ height:10 }}>
                  <div className="progress-fill" style={{ width:`${campaign.progressPercent}%` }} />
                </div>
                <div className="flex justify-between" style={{ fontSize:13, marginTop:8 }}>
                  <span style={{ color:'var(--text-muted)' }}>
                    {t('goal') || 'Goal'}: ₹{Number(campaign.goalAmount).toLocaleString('en-IN')}
                  </span>
                  <span style={{ color:'var(--primary-light)', fontWeight:700 }}>{pct}%</span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                <div className="card" style={{ padding:14, textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'#10b981' }}>
                    ₹{Number(campaign.remainingAmount).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t('remaining') || 'Remaining'}</div>
                </div>
                <div className="card" style={{ padding:14, textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'#f59e0b' }}>{campaign.daysRemaining}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t('daysLeft') || 'Days Left'}</div>
                </div>
              </div>
              {user?.role === 'USER' ? (
                <Link to={`/user/donate/${campaign.campaignId}`}
                  className="btn btn-primary w-full" style={{ justifyContent:'center', fontSize:16 }}>
                  {t('donateNow') || 'Donate Now'} 💜
                </Link>
              ) : user ? (
                <div className="card" style={{ padding:16, textAlign:'center', background:'rgba(108,60,232,0.1)' }}>
                  <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                    {t('loginAsDonorToDonate') || 'Login as a Donor to donate to this campaign.'}
                  </p>
                </div>
              ) : (
                <div>
                  <Link to="/login" className="btn btn-primary w-full" style={{ justifyContent:'center', marginBottom:10 }}>
                    {t('loginToDonate') || 'Login to Donate'}
                  </Link>
                  <Link to="/register" className="btn btn-secondary w-full" style={{ justifyContent:'center' }}>
                    {t('registerAsDonor') || 'Register as Donor'}
                  </Link>
                </div>
              )}
              <div style={{ marginTop:20, padding:14, background:'rgba(16,185,129,0.08)', borderRadius:8,
                border:'1px solid rgba(16,185,129,0.2)', fontSize:12, color:'var(--text-muted)' }}>
                🔒 {t('securePaymentViaRazorpay') || 'Secure payment via Razorpay'}<br />
                🧾 {t('receiptAutoGenerated') || '80G receipt auto-generated'}<br />
                📊 {t('transparentFundUsage') || '100% transparent fund usage'}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
