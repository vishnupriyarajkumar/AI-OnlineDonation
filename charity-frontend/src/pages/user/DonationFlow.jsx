import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const METHODS = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING'];
const METHOD_ICONS  = { UPI: '📱', CREDIT_CARD: '💳', DEBIT_CARD: '🏧', NET_BANKING: '🏦' };
const QUICK = [100, 500, 1000, 5000, 10000];

const MOCK_CAMPAIGNS = {
  1: { campaignId: 1, campaignName: 'Clean Water for Rural Villages', category: 'Water', urgencyLevel: 'CRITICAL' },
  2: { campaignId: 2, campaignName: 'Education for Every Child', category: 'Education', urgencyLevel: 'HIGH' },
  3: { campaignId: 3, campaignName: 'Free Medical Camp for Elderly', category: 'Healthcare', urgencyLevel: 'MEDIUM' },
  4: { campaignId: 4, campaignName: 'Flood Relief — Emergency Aid', category: 'Food', urgencyLevel: 'CRITICAL' },
  5: { campaignId: 5, campaignName: 'Plant a Million Trees', category: 'Environment', urgencyLevel: 'LOW' },
};

export default function DonationFlow() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { t }     = useLanguage();

  const METHOD_LABELS = {
    UPI: t('upi') || 'UPI',
    CREDIT_CARD: t('creditCard') || 'Credit Card',
    DEBIT_CARD: t('debitCard') || 'Debit Card',
    NET_BANKING: t('netBanking') || 'Net Banking'
  };

  const [campaign, setCampaign]     = useState(null);
  const [isOffline, setIsOffline]   = useState(false);
  const [step, setStep]             = useState(1);   // 1=Amount 2=Payment 3=Success 4=Screenshot
  const [amount, setAmount]         = useState('');
  const [method, setMethod]         = useState('UPI');
  const [anon, setAnon]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [receipt, setReceipt]       = useState(null);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const [savingScreenshot, setSavingScreenshot] = useState(false);

  // ── Fetch campaign ──────────────────────────────────────────
  useEffect(() => {
    axiosInstance.get(`/api/campaigns/public/${id}`)
      .then(r => { setCampaign(r.data?.data); setIsOffline(false); })
      .catch(err => {
        if (!err.response) {
          setIsOffline(true);
          setCampaign(MOCK_CAMPAIGNS[Number(id)] || {
            campaignId: Number(id), campaignName: 'Charity Campaign',
            category: 'General', urgencyLevel: 'MEDIUM',
          });
          toast('⚡ Offline Demo Mode', { icon: '📴' });
        } else {
          toast.error('Campaign not found');
          navigate('/user');
        }
      });
  }, [id]);

  // ── Donation handler ────────────────────────────────────────
  const initiate = async () => {
    if (!amount || Number(amount) < 10) {
      toast.error('Minimum donation is ₹10'); return;
    }
    setLoading(true);

    // OFFLINE demo mode
    if (isOffline) {
      await new Promise(r => setTimeout(r, 1200));
      const demoReceipt = {
        receiptNumber: `DEMO-${Date.now()}`,
        campaignName: campaign.campaignName,
        amount, method,
        donorName: user?.fullName || 'Donor',
        donationDate: new Date().toLocaleString('en-IN'),
        transactionId: 'DEMO-TXN-' + Date.now(),
      };
      setReceipt(demoReceipt);
      setStep(3);
      toast.success('Donation recorded (Demo Mode)!');
      setLoading(false);
      return;
    }

    // ONLINE Razorpay flow
    try {
      const r = await axiosInstance.post('/api/user/donations', {
        campaignId: String(id),
        amount: Number(amount),
        paymentMethod: method,
        anonymous: anon,
      });
      const donationId = r.data?.data?.donationId;
      const orderRes   = await axiosInstance.post(`/api/user/donations/${donationId}/order`);
      const { orderId, keyId } = orderRes.data?.data;

      // Dev bypass — activate immediately for placeholder keys
      // This runs BEFORE creating the Razorpay instance
      const devBypass = !keyId || keyId.includes('XXX') || keyId.includes('your_') || keyId.startsWith('rzp_test_XXX');
      if (devBypass) {
        toast.success('Payment bypassed (test keys). Processing…');
        await new Promise(r => setTimeout(r, 800));
        const vRes = await axiosInstance.post(
          `/api/user/donations/${donationId}/verify`, null, {
            params: {
              razorpayOrderId:   orderId || 'demo_order_' + Date.now(),
              razorpayPaymentId: 'mock_pay_' + Date.now(),
              razorpaySignature: 'mock_sig',
            }
          }
        );
        const data = vRes.data?.data;
        setReceipt({
          receiptNumber: data?.receiptNumber || 'RCP-' + Date.now(),
          campaignName:  campaign.campaignName,
          amount, method,
          donorName:     anon ? 'Anonymous' : (user?.fullName || 'Donor'),
          donationDate:  new Date().toLocaleString('en-IN'),
          transactionId: 'mock_pay_' + Date.now(),
        });
        setStep(3);
        toast.success('Donation successful! Thank you! 🎉');
        setLoading(false);
        return;
      }

      const options = {
        key: keyId,
        amount: Number(amount) * 100,
        currency: 'INR',
        name: 'New Dawn Foundation Trust',
        description: campaign.campaignName,
        order_id: orderId,
        handler: async (resp) => {
          const vRes = await axiosInstance.post(
            `/api/user/donations/${donationId}/verify`, null, {
              params: {
                razorpayOrderId:   resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              }
            }
          );
          const data = vRes.data?.data;
          setReceipt({
            receiptNumber: data?.receiptNumber || 'RCP-' + Date.now(),
            campaignName:  campaign.campaignName,
            amount, method,
            donorName:     anon ? 'Anonymous' : (user?.fullName || 'Donor'),
            donationDate:  new Date().toLocaleString('en-IN'),
            transactionId: resp.razorpay_payment_id,
          });
          setStep(3);
          toast.success('Donation successful! Thank you! 🎉');
        },
        theme: { color: '#6c3ce8' },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Screenshot: uses print dialog (no external dependency needed)
  const downloadScreenshot = async () => {
    setSavingScreenshot(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Pop-up blocked. Please allow pop-ups for this site.');
        setSavingScreenshot(false);
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Donation Receipt — ${receipt.receiptNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; background: #fff; color: #111; padding: 40px; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg,#6c3ce8,#8b5cf6); color: white; padding: 28px 32px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h2 { font-size: 22px; margin-bottom: 4px; }
            .header p { font-size: 13px; opacity: 0.85; }
            .body { border: 1px solid #ddd; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 32px; }
            .donor-msg { font-size: 15px; margin-bottom: 22px; color: #333; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 11px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
            td:first-child { color: #666; width: 42%; }
            td:last-child { font-weight: 700; color: #111; }
            .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #888; }
            .success-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 2px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; }
            @media print {
              body { padding: 20px; }
              button { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size:36px;margin-bottom:10px">🎉</div>
            <h2>Donation Receipt</h2>
            <p>New Dawn Foundation Trust</p>
          </div>
          <div class="body">
            <p class="donor-msg">Thank you, <strong>${receipt.donorName}</strong>! Your generosity makes a real difference. 💜</p>
            <table>
              <tr><td>🎯 Campaign</td><td>${receipt.campaignName}</td></tr>
              <tr><td>💰 Amount</td><td>₹${Number(receipt.amount).toLocaleString('en-IN')}</td></tr>
              <tr><td>💳 Payment Method</td><td>${METHOD_LABELS[receipt.method] || receipt.method}</td></tr>
              <tr><td>🧾 Receipt No.</td><td>${receipt.receiptNumber}</td></tr>
              <tr><td>🔖 Transaction ID</td><td>${receipt.transactionId || '—'}</td></tr>
              <tr><td>📅 Date & Time</td><td>${receipt.donationDate}</td></tr>
              <tr><td>✅ Status</td><td><span class="success-badge">Payment Confirmed</span></td></tr>
              <tr><td>🏛️ 80G Tax Exempt</td><td>✅ Yes — Tax Deductible</td></tr>
            </table>
            <div class="footer">
              <p>New Dawn Foundation Trust • newdawnfoundationtrust@gmail.com</p>
              <p style="margin-top:4px">Registered Charitable Trust • Thank you for your support</p>
            </div>
          </div>
          <div style="text-align:center;margin-top:20px">
            <button onclick="window.print()" style="background:#6c3ce8;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-right:10px">
              🖨️ Print Receipt
            </button>
            <button onclick="window.close()" style="background:#eee;color:#333;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer">
              Close
            </button>
          </div>
          <script>
            // Auto-open print dialog after a short delay
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      toast.success('Receipt opened — use Print → Save as PDF or print it! 🖨️', { duration: 5000 });
      setScreenshotTaken(true);
    } catch (e) {
      toast.error('Could not open receipt window.');
    } finally {
      setSavingScreenshot(false);
    }
  };

  if (!campaign) return (
    <><Navbar /><div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner"/></div></>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <motion.div className="container"
        style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 680 }}
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>

        {/* Progress steps */}
        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
            {[t('amount') || 'Amount', t('payment') || 'Payment', t('receipt') || 'Receipt'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  background: i < step ? 'linear-gradient(135deg,var(--primary),var(--primary-light))' : 'rgba(255,255,255,0.08)',
                  color: i < step ? '#fff' : 'var(--text-muted)',
                  border: i + 1 === step ? '2px solid var(--primary-light)' : 'none',
                }}>{i < step - 1 ? '✓' : i + 1}</div>
                <span style={{ fontSize: 12, color: i + 1 === step ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: i + 1 === step ? 600 : 400 }}>{s}</span>
                {i < 2 && <span style={{ color: 'var(--border)', fontSize: 14 }}>›</span>}
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 1: Amount ──────────────────────────────────── */}
        {step === 1 && (
          <div className="card" style={{ padding: 36 }}>
            {isOffline && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#f59e0b' }}>
                📴 {t('offlineDemoModeInfo') || 'Offline Demo Mode — no real payment processed'}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(108,60,232,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💜</div>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: 20 }}>{t('donateToCampaign') || 'Donate to Campaign'}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{campaign.campaignName}</p>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>{t('selectAmount') || 'Select Amount (₹)'}</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0 14px' }}>
                {QUICK.map(q => (
                  <button key={q}
                    className={`btn btn-sm ${Number(amount) === q ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAmount(String(q))}>
                    ₹{q.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
              <input className="form-control" type="number" min="10"
                placeholder={t('customAmountPlaceholder') || 'Or enter custom amount'} value={amount}
                onChange={e => setAmount(e.target.value)} />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                {t('donateAnonymously') || 'Donate anonymously'}
              </label>
            </div>

            <button className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: 14, fontSize: 15 }}
              onClick={() => setStep(2)} disabled={!amount || Number(amount) < 10}>
              {t('continueSelectPayment') || 'Continue → Select Payment'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Payment Method ──────────────────────────── */}
        {step === 2 && (
          <div className="card" style={{ padding: 36 }}>
            <button onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 20, fontSize: 14 }}>
              {t('back') || '← Back'}
            </button>
            <h2 style={{ fontWeight: 900, fontSize: 20, marginBottom: 4 }}>{t('choosePaymentMethod') || 'Choose Payment Method'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
              {(t('donatingTo') || 'Donating {amount} to {campaign}').replace('{amount}', `₹${Number(amount).toLocaleString('en-IN')}`).replace('{campaign}', campaign.campaignName)}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`btn ${method === m ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flexDirection: 'column', padding: '18px 12px', gap: 8, borderRadius: 12,
                    boxShadow: method === m ? '0 0 0 2px var(--primary-light)' : 'none' }}>
                  <span style={{ fontSize: 30 }}>{METHOD_ICONS[m]}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{METHOD_LABELS[m]}</span>
                </button>
              ))}
            </div>

            {method === 'UPI' && amount >= 10 && (
              <div style={{ textAlign: 'center', marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>{t('scanUpiQR') || 'Scan this QR code using any UPI app (GPay, PhonePe, Paytm)'}</p>
                <div style={{ background: '#fff', padding: 12, display: 'inline-block', borderRadius: 12, border: '2px solid var(--primary-light)' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=newdawn@ybl&pn=NewDawnFoundation&am=${amount}&cu=INR`} alt="UPI QR Code" style={{ width: 150, height: 150 }} />
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
              🔒 {isOffline ? (t('demoModeNoRealCharge') || 'Demo mode — no real charge made') : (t('paymentsSecuredByRazorpay') || 'Payments secured by Razorpay. Card data never stored.')}
            </div>

            <button className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: 14, fontSize: 15 }}
              onClick={initiate} disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  {t('processing') || 'Processing…'}
                </span>
              ) : isOffline ? (
                `${t('payDemo') || 'Pay {amount} (Demo)'}`.replace('{amount}', `₹${Number(amount).toLocaleString('en-IN')}`)
              ) : (
                `${t('paySecurely') || 'Pay {amount} Securely 🔒'}`.replace('{amount}', `₹${Number(amount).toLocaleString('en-IN')}`)
              )}
            </button>
          </div>
        )}

        {/* ── STEP 3: Success + Screenshot prompt ──────────────────── */}
        {step === 3 && receipt && (
          <div>
            {/* Receipt card — this is what gets screenshotted */}
            <div style={{ background: '#0f0f1e', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(108,60,232,0.35)', marginBottom: 24 }}>
              {/* Receipt header */}
              <div style={{ background: 'linear-gradient(135deg,#6c3ce8,#8b5cf6)', padding: '28px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
                <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 22, marginBottom: 4 }}>{t('donationSuccessful') || 'Donation Successful!'}</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>New Dawn Foundation Trust</p>
              </div>

              {/* Receipt body */}
              <div style={{ padding: '28px 32px' }}>
                <p style={{ textAlign: 'center', color: '#e0e0ff', fontSize: 15, marginBottom: 24 }}>
                  {(t('receiptThankYou') || 'Thank you, {name}! Your generosity makes a difference. 💜').replace('{name}', receipt.donorName)}
                </p>

                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                  {[
                    [`🎯 ${t('campaign') || 'Campaign'}`,        receipt.campaignName],
                    [`💰 ${t('amount') || 'Amount'}`,          `₹${Number(receipt.amount).toLocaleString('en-IN')}`],
                    [`💳 ${t('paymentMethod') || 'Payment Method'}`,  METHOD_LABELS[receipt.method] || receipt.method],
                    [`🧾 ${t('receiptNo') || 'Receipt No.'}`,     receipt.receiptNumber],
                    [`🔖 ${t('transactionId') || 'Transaction ID'}`,  receipt.transactionId || '—'],
                    [`📅 ${t('dateTime') || 'Date & Time'}`,     receipt.donationDate],
                    [`✅ ${t('status') || 'Status'}`,          t('paymentConfirmed') || 'Payment Confirmed'],
                    [`🏛️ ${t('taxExempt80G') || '80G Exempt'}`,      t('taxDeductibleYes') || 'Yes — Tax Deductible'],
                  ].map(([k, v], i) => (
                    <div key={k} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 18px',
                      borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <span style={{ color: '#9090b0', fontSize: 13 }}>{k}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, maxWidth: '55%', textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 8 }}>
                  newdawnfoundationtrust@gmail.com • Reg. Charity Trust
                </div>
              </div>
            </div>

            {/* Screenshot prompt */}
            <div className="card" style={{ padding: 28, marginBottom: 20, border: '1px solid rgba(108,60,232,0.3)', background: 'rgba(108,60,232,0.06)' }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>📸 {t('saveYourReceipt') || 'Save Your Receipt'}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                {t('saveReceiptPrompt') || 'Would you like to save a screenshot of your donation receipt? It will be downloaded as a PNG image to your device.'}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '13px' }}
                  onClick={downloadScreenshot} disabled={savingScreenshot}>
                  {savingScreenshot ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      {t('saving') || 'Saving…'}
                    </span>
                  ) : screenshotTaken ? (t('savedDownloadAgain') || '✓ Saved! Download Again') : `📥 ${t('yesSaveReceiptScreenshot') || 'Yes, Save Receipt Screenshot'}`}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setStep(4)}>
                  {t('noThanks') || 'No Thanks'}
                </button>
              </div>
              {screenshotTaken && (
                <p style={{ color: '#10b981', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                  ✅ {t('receiptSavedDownloadsFolder') || 'Receipt saved to your Downloads folder'}
                </p>
              )}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate('/user/donations')}>
                📋 {t('myDonations') || 'My Donations'}
              </button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate('/user')}>
                💜 {t('donateAgain') || 'Donate Again'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: After skipping screenshot ─────────────── */}
        {step === 4 && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💜</div>
            <h2 style={{ fontWeight: 900, marginBottom: 8, color: '#10b981' }}>{t('thankYou') || 'Thank You!'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 15 }}>
              {(t('donationToConfirmed') || 'Your donation to {campaign} has been confirmed.').replace('{campaign}', campaign.campaignName)}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
              {(t('receiptSentToEmail') || 'Receipt {receipt} has been sent to your registered email.').replace('{receipt}', receipt.receiptNumber)}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/user/donations')}>{t('viewMyDonations') || 'View My Donations'}</button>
              <button className="btn btn-primary"   onClick={() => navigate('/user')}>{t('backToDashboard') || 'Back to Dashboard'}</button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
