import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';



export default function SubscriptionManagement() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sub,       setSub]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [modal,     setModal]     = useState(null); // 'upgrade'|'amount'|'date'
  const [form,      setForm]      = useState({ amount:'', day:'1', campaignId:'' });
  const [saving,    setSaving]    = useState(false);

  const STATUS_STYLE = {
    ACTIVE:    { color:'#10b981', bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.3)',  label: `✅ ${t('active') || 'Active'}`   },
    PAUSED:    { color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.3)',  label: `⏸ ${t('paused') || 'Paused'}`   },
    CANCELLED: { color:'#ef4444', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.3)',   label: `❌ ${t('cancelled') || 'Cancelled'}`},
  };

  const load = async () => {
    setLoading(true);
    try {
      const [sR, cR] = await Promise.all([
        axiosInstance.get('/api/user/subscription'),
        axiosInstance.get('/api/campaigns/public'),
      ]);
      setSub(sR.data?.data);
      setCampaigns(cR.data?.data || []);
    } catch { toast.error('Failed to load subscription'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const action = async (endpoint, method='POST', body=null) => {
    setSaving(true);
    try {
      const fn = method === 'PUT' ? axiosInstance.put : axiosInstance.post;
      const r = await fn(`/api/user/subscription/${endpoint}`, body || {});
      setSub(r.data?.data);
      setModal(null);
      toast.success(r.data?.message || 'Updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setSaving(false); }
  };

  const isMonthly = sub?.donorType === 'MONTHLY';
  const st = sub ? (STATUS_STYLE[sub.status] || STATUS_STYLE.ACTIVE) : null;

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop:40, paddingBottom:80, maxWidth:780 }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:26, fontWeight:900 }}>
            {t('subscription') || 'Subscription'} <span className="gradient-text">{t('management') || 'Management'}</span>
          </h1>
          <p style={{ color:'var(--text-muted)', marginTop:4 }}>
            {t('manageDonationPlanPreferences') || 'Manage your donation plan and preferences'}
          </p>
        </div>

        {loading ? <div className="spinner" /> : !sub ? null : (
          <>
            {/* Status card */}
            <div className="card" style={{ padding:28, marginBottom:24, background: isMonthly ? 'rgba(108,60,232,0.06)' : 'var(--bg-glass)', border: isMonthly ? '1px solid rgba(108,60,232,0.3)' : '1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom: isMonthly ? 24 : 0 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                    <span style={{ fontSize:32 }}>{isMonthly ? '🔄' : '🎁'}</span>
                    <div>
                      <h2 style={{ fontWeight:800, fontSize:20 }}>
                        {isMonthly ? (t('monthlyGiving') || 'Monthly Giving') : (t('generalDonor') || 'General Donor')}
                      </h2>
                      {isMonthly && st && (
                        <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}`, borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:700 }}>
                          {st.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ color:'var(--text-muted)', fontSize:14 }}>
                    {isMonthly
                      ? `₹${Number(sub.monthlyAmount||0).toLocaleString('en-IN')}/${t('month') || 'month'}`
                      : t('generalDonorDesc') || 'One-time donations — no recurring charges'}
                  </p>
                </div>
                {!isMonthly && (
                  <button className="btn btn-primary" onClick={() => setModal('upgrade')}>
                    🚀 {t('upgradeToMonthlyGiving') || 'Upgrade to Monthly Giving'}
                  </button>
                )}
              </div>

              {/* Monthly details */}
              {isMonthly && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                  {[
                    { icon:'💰', label: t('monthlyAmount') || 'Monthly Amount',  value:`₹${Number(sub.monthlyAmount||0).toLocaleString('en-IN')}` },
                    { icon:'📅', label: t('donationDay') || 'Donation Day',    value: (t('dayOfMonth') || 'Day {day} of month').replace('{day}', sub.donationDay) },
                    { icon:'🎯', label: t('campaign') || 'Campaign',        value: sub.campaignName || (t('allActiveCampaigns') || 'All Active Campaigns') },
                    { icon:'⏭️', label: t('nextDonation') || 'Next Donation',   value: sub.nextDonationDate || '—' },
                    { icon:'✅', label: t('lastDonation') || 'Last Donation',   value: sub.lastDonationDate || (t('notYet') || 'Not yet') },
                    { icon:'📊', label: t('status') || 'Status',          value: st?.label || sub.status },
                  ].map(s => (
                    <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize:20, marginBottom:6 }}>{s.icon}</p>
                      <p style={{ fontSize:14, fontWeight:700 }}>{s.value}</p>
                      <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {isMonthly && (
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontWeight:700, marginBottom:20, fontSize:16 }}>{t('manageSubscription') || 'Manage Subscription'}</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <button className="btn btn-secondary" onClick={() => { setForm({ amount: sub.monthlyAmount, day: sub.donationDay, campaignId: sub.campaignId || '' }); setModal('amount'); }}>
                    ✏️ {t('editAmount') || 'Edit Amount'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setForm({ ...form, day: sub.donationDay }); setModal('date'); }}>
                    📅 {t('changeDate') || 'Change Date'}
                  </button>
                  {sub.status === 'ACTIVE' && (
                    <button className="btn btn-secondary" style={{ color:'#f59e0b', borderColor:'rgba(245,158,11,0.3)' }}
                      onClick={() => { if (window.confirm(t('pauseConfirmPrompt') || 'Pause your monthly subscription?')) action('pause'); }}>
                      ⏸ {t('pauseSubscription') || 'Pause Subscription'}
                    </button>
                  )}
                  {sub.status === 'PAUSED' && (
                    <button className="btn btn-secondary" style={{ color:'#10b981', borderColor:'rgba(16,185,129,0.3)' }}
                      onClick={() => action('resume')}>
                      ▶️ {t('resumeSubscription') || 'Resume Subscription'}
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={() => { if (window.confirm(t('cancelConfirmPrompt') || 'Cancel your Monthly Giving subscription?\nYou can upgrade again anytime.')) action('cancel'); }}>
                    ❌ {t('cancelSubscription') || 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            )}

            {/* Info for general */}
            {!isMonthly && (
              <div className="card" style={{ padding:24, background:'rgba(108,60,232,0.06)', border:'1px solid rgba(108,60,232,0.2)' }}>
                <h3 style={{ fontWeight:700, marginBottom:12 }}>{t('whyMonthlyGiving') || 'Why Monthly Giving?'}</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    ['🔄', t('automatedDonations') || 'Automated donations', t('noNeedToRemember') || 'No need to remember — we handle it.'],
                    ['⏰', t('preDonationReminders') || 'Pre-donation reminders', t('emailReminderBeforeDonation') || 'Email reminder before every donation.'],
                    ['📋', t('monthlyReceipts') || 'Monthly receipts', t('automaticReceipts') || 'Automatic 80G tax receipts.'],
                    ['⏸', t('fullControl') || 'Full control', t('pauseResumeCancelAnytime') || 'Pause, resume or cancel anytime.'],
                  ].map(([icon, title, desc]) => (
                    <div key={title} style={{ display:'flex', gap:12, padding:'12px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize:22, flexShrink:0 }}>{icon}</span>
                      <div>
                        <p style={{ fontWeight:600, fontSize:13 }}>{title}</p>
                        <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:2 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ marginTop:20, justifyContent:'center' }} onClick={() => setModal('upgrade')}>
                  🚀 {t('upgradeToMonthlyGiving') || 'Upgrade to Monthly Giving'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Modals ── */}
        {modal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setModal(null)}>
            <div className="card" style={{ maxWidth:480, width:'100%', padding:32 }} onClick={e => e.stopPropagation()}>

              {/* Upgrade modal */}
              {modal === 'upgrade' && (
                <>
                  <h3 style={{ fontWeight:800, fontSize:20, marginBottom:6 }}>🚀 {t('upgradeToMonthlyGiving') || 'Upgrade to Monthly Giving'}</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:24 }}>{t('upgradeMonthlyDesc') || 'Set your monthly amount and preferred date.'}</p>
                  <div className="form-group">
                    <label>{t('monthlyAmount') || 'Monthly Amount'} (₹) *</label>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                      {[100,250,500,1000,2500].map(a => (
                        <button key={a} type="button" className={`btn btn-sm ${Number(form.amount)===a?'btn-primary':'btn-secondary'}`}
                          onClick={() => setForm(p=>({...p,amount:String(a)}))}>
                          ₹{a.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                    <input className="form-control" type="number" min="50" placeholder={t('customAmount') || 'Custom amount'}
                      value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>{t('donationDay') || 'Donation Day'}</label>
                    <select className="form-control" value={form.day} onChange={e => setForm(p=>({...p,day:e.target.value}))}>
                      {[1,5,10,15,20,25,28].map(d => <option key={d} value={d}>{(t('dayOfMonth') || 'Day {day}').replace('{day}', d)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('campaignOptional') || 'Campaign (optional)'}</label>
                    <select className="form-control" value={form.campaignId} onChange={e => setForm(p=>({...p,campaignId:e.target.value}))}>
                      <option value="">{t('supportAllActiveCampaigns') || '— All active campaigns —'}</option>
                      {campaigns.map(c => <option key={c.campaignId} value={c.campaignId}>{c.campaignName}</option>)}
                    </select>
                  </div>
                  <div style={{ display:'flex', gap:12 }}>
                    <button className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }} onClick={() => setModal(null)}>{t('cancel') || 'Cancel'}</button>
                    <button className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={saving}
                      onClick={() => action('upgrade','POST',{ monthlyAmount:Number(form.amount), donationDay:Number(form.day), campaignId:form.campaignId||null })}>
                      {saving ? (t('activating') || 'Activating…') : `✓ ${t('activateMonthlyGiving') || 'Activate Monthly Giving'}`}
                    </button>
                  </div>
                </>
              )}

              {/* Edit amount modal */}
              {modal === 'amount' && (
                <>
                  <h3 style={{ fontWeight:800, fontSize:20, marginBottom:20 }}>✏️ {t('editMonthlyAmount') || 'Edit Monthly Amount'}</h3>
                  <div className="form-group">
                    <label>{t('newMonthlyAmount') || 'New Monthly Amount'} (₹) *</label>
                    <input className="form-control" type="number" min="50"
                      value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} />
                  </div>
                  <div style={{ display:'flex', gap:12 }}>
                    <button className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }} onClick={() => setModal(null)}>{t('cancel') || 'Cancel'}</button>
                    <button className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={saving}
                      onClick={() => action('modify-amount','PUT',{ monthlyAmount:Number(form.amount) })}>
                      {saving ? (t('saving') || 'Saving…') : `✓ ${t('updateAmount') || 'Update Amount'}`}
                    </button>
                  </div>
                </>
              )}

              {/* Change date modal */}
              {modal === 'date' && (
                <>
                  <h3 style={{ fontWeight:800, fontSize:20, marginBottom:20 }}>📅 {t('changeDonationDate') || 'Change Donation Date'}</h3>
                  <div className="form-group">
                    <label>{t('newDonationDay') || 'New Donation Day'}</label>
                    <select className="form-control" value={form.day} onChange={e => setForm(p=>({...p,day:e.target.value}))}>
                      {[1,5,10,15,20,25,28].map(d => <option key={d} value={d}>{(t('dayOfEveryMonth') || 'Day {day} of every month').replace('{day}', d)}</option>)}
                    </select>
                  </div>
                  <div style={{ display:'flex', gap:12 }}>
                    <button className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }} onClick={() => setModal(null)}>{t('cancel') || 'Cancel'}</button>
                    <button className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={saving}
                      onClick={() => action('change-date','PUT',{ donationDay:Number(form.day) })}>
                      {saving ? (t('saving') || 'Saving…') : `✓ ${t('updateDate') || 'Update Date'}`}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
