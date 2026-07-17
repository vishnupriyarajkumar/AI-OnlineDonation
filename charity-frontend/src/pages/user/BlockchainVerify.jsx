import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLanguage } from '../../context/LanguageContext';

function BlockchainTimeline({ donation }) {
  const steps = [
    { label: 'Donation Created',     icon: '💜', done: true  },
    { label: 'Payment Successful',   icon: '💳', done: donation?.status === 'SUCCESS' || donation?.status === 'COMPLETED' },
    { label: 'Blockchain Hash Generated', icon: '🔗', done: !!donation?.blockchainHash },
    { label: 'NGO Received Funds',   icon: '🏢', done: true  },
    { label: 'Funds Utilized',       icon: '🎯', done: false },
    { label: 'Campaign Completed',   icon: '✅', done: false },
  ];

  return (
    <div style={{ position: 'relative', padding: '8px 0' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < steps.length - 1 ? 0 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.div
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${s.done ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                fontSize: 16,
              }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
            >{s.icon}</motion.div>
            {i < steps.length - 1 && (
              <div style={{
                width: 2, height: 36,
                background: s.done ? 'linear-gradient(#10b981,#10b98180)' : 'rgba(255,255,255,0.08)',
              }} />
            )}
          </div>
          <div style={{ flex: 1, paddingTop: 6, paddingBottom: i < steps.length - 1 ? 36 : 0 }}>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: s.done ? 'var(--text)' : 'var(--text-muted)',
            }}>{s.label}</span>
            {s.done && <span style={{ marginLeft: 8, fontSize: 11, color: '#10b981' }}>✓ Confirmed</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BlockchainVerify() {
  const { t } = useLanguage();
  const [txns,     setTxns]    = useState([]);
  const [selected, setSelected]= useState(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult,setVerifyResult]= useState(null);
  const [loading,  setLoading] = useState(true);
  const [verifying,setVerifying]= useState(false);

  useEffect(() => {
    axiosInstance.get('/api/user/blockchain')
      .then(r => setTxns(r.data?.data || []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleVerify() {
    if (!verifyInput.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const r = await axiosInstance.get(`/api/blockchain/verify/${verifyInput.trim()}`);
      setVerifyResult(r.data?.data);
    } catch {
      setVerifyResult({ verified: false, txHash: verifyInput });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 99, padding: '4px 14px', fontSize: 12, color: '#34d399', marginBottom: 16,
          }}>🔗 CharityChain Testnet</span>
          <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 8 }}>
            Blockchain <span className="gradient-text">Transparency</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32 }}>
            Every donation generates an immutable blockchain record. Verify exactly where your money went.
          </p>
        </motion.div>

        {/* Verify Hash Input */}
        <motion.div
          className="glass-card" style={{ padding: 24, marginBottom: 32 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🔍 Verify Any Transaction Hash</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={verifyInput}
              onChange={e => setVerifyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="Enter transaction hash (e.g. 0x1a2b3c…)"
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13,
              }}
            />
            <motion.button
              onClick={handleVerify}
              disabled={verifying || !verifyInput.trim()}
              className="btn-primary-full"
              style={{ width: 'auto', padding: '12px 24px' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              {verifying ? '⏳ Verifying…' : '✔ Verify'}
            </motion.button>
          </div>

          <AnimatePresence>
            {verifyResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  marginTop: 16, padding: '14px 18px', borderRadius: 12,
                  background: verifyResult.verified ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${verifyResult.verified ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}
              >
                <div style={{ fontWeight: 700, color: verifyResult.verified ? '#34d399' : '#f87171', marginBottom: 4 }}>
                  {verifyResult.verified ? '✅ Transaction Verified!' : '❌ Transaction Not Found'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Network: {verifyResult.network} · Hash: {verifyResult.txHash}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* My Blockchain Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>🔗 My Blockchain Records</h2>

          {loading ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
            </div>
          ) : txns.length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔗</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
                Your donations will appear here as blockchain records after your first successful donation.
              </p>
              <Link to="/campaigns" style={{ display: 'inline-block', marginTop: 20 }}>
                <button className="btn-primary-full" style={{ width: 'auto', padding: '10px 28px' }}>
                  Browse Campaigns
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {txns.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  className="glass-card"
                  style={{ padding: 20, cursor: 'pointer' }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setSelected(selected?.id === tx.id ? null : tx)}
                  whileHover={{ y: -2 }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>🔗</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{tx.campaignName}</span>
                        <span style={{ fontWeight: 800, color: '#34d399', fontSize: 15 }}>
                          ₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0' }}>
                        Block #{tx.blockNumber} · {tx.networkName}
                      </div>
                      <div style={{
                        fontSize: 11, fontFamily: 'monospace', color: '#a78bfa',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {tx.transactionHash}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 99,
                        background: 'rgba(16,185,129,0.15)', color: '#34d399',
                        border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700,
                      }}>✅ CONFIRMED</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {new Date(tx.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {selected?.id === tx.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 20 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div>
                              <h4 style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>📊 Block Details</h4>
                              {[
                                ['Block Number', `#${tx.blockNumber}`],
                                ['Block Hash', tx.blockHash?.substring(0,20) + '…'],
                                ['Previous Hash', tx.previousHash?.substring(0,20) + '…'],
                                ['Merkle Root', tx.merkleRoot?.substring(0,20) + '…'],
                                ['Confirmations', `${tx.confirmations} blocks`],
                                ['Donor', tx.donorName],
                              ].map(([k,v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <h4 style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>📅 Donation Journey</h4>
                              <BlockchainTimeline donation={{ ...tx, blockchainHash: tx.blockHash }} />
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(tx.transactionHash); }}
                            style={{
                              marginTop: 14, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                              background: 'rgba(255,255,255,0.04)', color: 'var(--primary-light)',
                              cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            }}
                          >📋 Copy Transaction Hash</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
