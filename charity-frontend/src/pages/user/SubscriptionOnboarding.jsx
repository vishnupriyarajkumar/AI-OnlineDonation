import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Shown once after a user's very first login.
 * They choose GENERAL (one-time donations) or MONTHLY (recurring).
 * Skipping defaults to GENERAL.
 */
export default function SubscriptionOnboarding() {
  const navigate  = useNavigate();
  const { t } = useLanguage();
  const [step,    setStep]    = useState(1); // 1=choose 2=monthly-setup
  const [loading, setLoading] = useState(false);
  const [monthly, setMonthly] = useState({ amount: '500', day: '1', campaignId: '' });
  const [campaigns, setCampaigns] = useState([]);

  const fetchCampaigns = async () => {
    try {
      const r = await axiosInstance.get('/api/campaigns/public');
      setCampaigns(r.data?.data || []);
    } catch {}
  };

  const chooseGeneral = async () => {
    setLoading(true);
    try {
      await axiosInstance.post('/api/user/subscription/choose-plan', { donorType: 'GENERAL' });
      toast.success('Account set up as General Donor!');
    } catch {}
    navigate('/user', { replace: true });
    setLoading(false);
  };

  const startMonthly = () => {
    fetchCampaigns();
    setStep(2);
  };

  const confirmMonthly = async () => {
    if (!monthly.amount || Number(monthly.amount) < 50) {
      toast.error('Minimum monthly amount is ₹50'); return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/api/user/subscription/choose-plan', {
        donorType:    'MONTHLY',
        monthlyAmount: Number(monthly.amount),
        donationDay:   Number(monthly.day),
        campaignId:    monthly.campaignId || null,
      });
      toast.success('Monthly Giving activated! 🎉', { duration: 5000 });
      navigate('/user', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed');
    } finally { setLoading(false); }
  };

  const skip = () => {
    axiosInstance.post('/api/user/subscription/choose-plan', { donorType: 'GENERAL' }).catch(() => {});
    navigate('/user', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative',
    }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(108,60,232,0.25) 0%, transparent 60%)' }} />

      <motion.div
        style={{ width: '100%', maxWidth: 680, position: 'relative', zIndex: 1 }}
        initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
        {/* Header */}
        <motion.div style={{ textAlign: 'center', marginBottom: 36 }}
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
          <motion.div style={{ fontSize: 56, marginBottom: 12 }}
            animate={{ rotate:[0,-5,5,0], scale:[1,1.05,1] }}
            transition={{ duration:3, repeat:Infinity, repeatDelay:2 }}>💜</motion.div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
            {t('welcomeTo') || 'Welcome to'} <span className="gradient-text">New Dawn Foundation Trust</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            {t('howLikeToContribute') || 'How would you like to contribute? You can change this anytime.'}
          </p>
        </motion.div>

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* General Donor card */}
            <div className="card" style={{ padding: 32, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}
              onClick={chooseGeneral}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108,60,232,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>🎁</div>
              <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>{t('generalDonor') || 'General Donor'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                {t('generalDonorDesc') || 'Make one-time donations whenever you wish. No recurring payments, no commitments.'}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                {[
                  `✅ ${t('oneTimeDonations') || 'One-time donations'}`,
                  `✅ ${t('noRecurringCharges') || 'No recurring charges'}`,
                  `✅ ${t('donateAnyCampaign') || 'Donate any campaign'}`,
                  `✅ ${t('fullDonationHistory') || 'Full donation history'}`
                ].map(f => (
                  <li key={f} style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{f}</li>
                ))}
              </ul>
              <button className="btn btn-secondary w-full" disabled={loading}
                style={{ justifyContent: 'center' }}>
                {loading ? (t('settingUp') || 'Setting up…') : (t('continueAsGeneralDonor') || 'Continue as General Donor')}
              </button>
            </div>

            {/* Monthly Giving card */}
            <div className="card" style={{ padding: 32, cursor: 'pointer', border: '2px solid rgba(108,60,232,0.5)', background: 'rgba(108,60,232,0.06)', position: 'relative', overflow: 'hidden' }}
              onClick={startMonthly}>
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'linear-gradient(135deg,#6c3ce8,#8b5cf6)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                {t('recommended') || 'RECOMMENDED'}
              </div>
              <div style={{ fontSize: 44, marginBottom: 16 }}>🔄</div>
              <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>{t('monthlyGiving') || 'Monthly Giving'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                {t('monthlyGivingDesc') || 'Set a recurring monthly donation. Automated, consistent impact every month.'}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                {[
                  `✅ ${t('automaticMonthlyDonations') || 'Automatic monthly donations'}`,
                  `✅ ${t('preDonationReminders') || 'Pre-donation reminders'}`,
                  `✅ ${t('monthlyReceipts') || 'Monthly receipts'}`,
                  `✅ ${t('pauseResumeAnytime') || 'Pause / resume anytime'}`,
                  `✅ ${t('cancelAnytime') || 'Cancel anytime'}`
                ].map(f => (
                  <li key={f} style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{f}</li>
                ))}
              </ul>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                {t('setUpMonthlyGiving') || 'Set Up Monthly Giving'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card" style={{ padding: 36 }}>
            <button onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>
              {t('back') || '← Back'}
            </button>
            <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>🔄 {t('setUpMonthlyGivingTitle') || 'Set Up Monthly Giving'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
              {t('chooseMonthlyAmount') || 'Choose your monthly amount, donation date, and campaign.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Amount */}
              <div className="form-group">
                <label>{t('monthlyAmount') || 'Monthly Amount'} (₹) *</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {[100,250,500,1000,2500].map(a => (
                    <button key={a} type="button"
                      className={`btn btn-sm ${Number(monthly.amount)===a?'btn-primary':'btn-secondary'}`}
                      onClick={() => setMonthly(p => ({...p, amount: String(a)}))}>
                      ₹{a.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
                <input className="form-control" type="number" min="50" placeholder={t('customAmount') || 'Custom amount'}
                  value={monthly.amount} onChange={e => setMonthly(p => ({...p, amount: e.target.value}))} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{t('minimumMonthlyAmountInfo') || 'Minimum ₹50/month'}</p>
              </div>

              {/* Donation Day */}
              <div className="form-group">
                <label>{t('donationDayOfMonth') || 'Donation Day of Month'} *</label>
                <select className="form-control" value={monthly.day}
                  onChange={e => setMonthly(p => ({...p, day: e.target.value}))}>
                  {[1,5,10,15,20,25,28].map(d => (
                    <option key={d} value={d}>{(t('dayOfEveryMonth') || 'Day {day} of every month').replace('{day}', d)}</option>
                  ))}
                </select>
              </div>

              {/* Campaign */}
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>{t('campaignOptional') || 'Campaign (optional)'}</label>
                <select className="form-control" value={monthly.campaignId}
                  onChange={e => setMonthly(p => ({...p, campaignId: e.target.value}))}>
                  <option value="">{t('supportAllActiveCampaigns') || '— Support all active campaigns —'}</option>
                  {campaigns.map(c => (
                    <option key={c.campaignId} value={c.campaignId}>{c.campaignName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: 'rgba(108,60,232,0.08)', border: '1px solid rgba(108,60,232,0.25)', borderRadius: 10, padding: '14px 18px', marginTop: 8, marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t('monthlyGivingSummary') || 'Your Monthly Giving Summary'}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {`₹${Number(monthly.amount||0).toLocaleString('en-IN')} `}
                {(t('monthlyGivingSummaryDesc') || 'will be donated on day {day} of each month').replace('{day}', monthly.day)}
                {monthly.campaignId ? ` ${t('toCampaign') || 'to'} "${campaigns.find(c=>String(c.campaignId)===String(monthly.campaignId))?.campaignName}"` : ` ${t('acrossActiveCampaigns') || 'across active campaigns'}`}.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={chooseGeneral}>
                {t('skipGoGeneral') || 'Skip, go General'}
              </button>
              <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={confirmMonthly} disabled={loading}>
                {loading ? (t('activating') || 'Activating…') : `🚀 ${t('activateMonthlyGiving') || 'Activate Monthly Giving'}`}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          <button onClick={skip} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
            {t('skipForNowDecideLater') || 'Skip for now — decide later'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
