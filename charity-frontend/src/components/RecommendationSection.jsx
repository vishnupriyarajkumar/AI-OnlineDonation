import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function getRecommendationReason(campaignName, category, topCategory) {
  try {
    const prompt = topCategory
      ? `In one short sentence (max 12 words), explain why a donor who frequently donates to "${topCategory}" campaigns would like "${campaignName}" (${category}). Be specific and warm.`
      : `In one short sentence (max 12 words), explain why "${campaignName}" (${category}) is trending and worth donating to. Be warm.`;
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

function SkeletonCard() {
  return (
    <div className="skeleton-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 140 }} />
      <div style={{ padding: '14px 16px' }}>
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 6, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 5, borderRadius: 99, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 34, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function RecommendationCard({ campaign: c, reason, index }) {
  const pct = c.goalAmount > 0 ? Math.min(100, (c.collectedAmount / c.goalAmount) * 100) : c.progressPercent || 0;
  const urgencyColors = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626' };

  return (
    <motion.div
      className="glass-card"
      style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
        <img
          src={c.imageUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400'}
          alt={c.campaignName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6),transparent)' }} />
        {c.daysRemaining <= 7 && (
          <motion.div
            style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}
            animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ⏰ {c.daysRemaining}d left
          </motion.div>
        )}
        <div style={{ position: 'absolute', top: 8, right: 8, background: `${urgencyColors[c.urgencyLevel] || '#7c3aed'}22`, border: `1px solid ${urgencyColors[c.urgencyLevel] || '#7c3aed'}66`, color: urgencyColors[c.urgencyLevel] || '#a78bfa', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, backdropFilter: 'blur(8px)' }}>
          ⚡ {c.urgencyLevel || 'MEDIUM'}
        </div>
      </div>

      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span className="chip" style={{ fontSize: 10, marginBottom: 6, alignSelf: 'flex-start' }}>{c.category || 'General'}</span>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {c.campaignName}
        </p>
        {c.createdBy && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>🏢 {c.createdBy}</p>
        )}

        {/* AI reason */}
        {reason && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: 11, color: '#a78bfa', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '5px 8px', marginBottom: 8, lineHeight: 1.4 }}
          >
            🤖 {reason}
          </motion.div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>₹{Number(c.collectedAmount || 0).toLocaleString('en-IN')}</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>{pct.toFixed(0)}%</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 6 }}>
            <motion.div className="progress-fill"
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
            <span>Goal: ₹{Number(c.goalAmount || 0).toLocaleString('en-IN')}</span>
            <span>⏳ {c.daysRemaining}d left</span>
          </div>
          <Link to={`/user/donate/${c.campaignId}`}>
            <motion.button
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              Donate 💜
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function Section({ title, campaigns, reasons, loading, cols = 3 }) {
  if (!loading && campaigns.length === 0) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
        {loading
          ? [0, 1, 2].map(i => <SkeletonCard key={i} />)
          : campaigns.slice(0, cols).map((c, i) => (
            <RecommendationCard key={c.campaignId} campaign={c} reason={reasons[c.campaignId]} index={i} />
          ))
        }
      </div>
    </div>
  );
}

export default function RecommendationSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState({ forYou: [], trending: [], newCampaigns: [], similar: [], categoryRecs: [] });
  const [reasons, setReasons] = useState({});
  const [topCategory, setTopCategory] = useState(null);

  const buildRecommendations = useCallback(async (campaigns, donations) => {
    const completed = donations.filter(d => d.status === 'COMPLETED');

    // Find top donated category
    const catCount = {};
    completed.forEach(d => {
      const c = campaigns.find(c => c.campaignId === d.campaignId);
      if (c?.category) catCount[c.category] = (catCount[c.category] || 0) + 1;
    });
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    setTopCategory(topCat);

    const donatedIds = new Set(completed.map(d => d.campaignId));
    const active = campaigns.filter(c => c.status === 'ACTIVE' || !c.status);

    // For You: category match first, then urgency
    const forYou = topCat
      ? [...active.filter(c => c.category === topCat && !donatedIds.has(c.campaignId)),
         ...active.filter(c => c.category !== topCat && !donatedIds.has(c.campaignId))]
      : active.filter(c => ['CRITICAL', 'HIGH'].includes(c.urgencyLevel));

    // Trending: most collected relative to goal
    const trending = [...active].sort((a, b) => (b.progressPercent || 0) - (a.progressPercent || 0));

    // New: most recently created
    const newCampaigns = [...active].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Similar: same category as most recent donation
    const lastDonatedCampaign = completed.length > 0
      ? campaigns.find(c => c.campaignId === completed[0].campaignId)
      : null;
    const similar = lastDonatedCampaign
      ? active.filter(c => c.category === lastDonatedCampaign.category && c.campaignId !== lastDonatedCampaign.campaignId)
      : [];

    // Category recs: urgent campaigns in top category
    const categoryRecs = topCat
      ? active.filter(c => c.category === topCat).sort((a, b) => {
          const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return (order[a.urgencyLevel] || 2) - (order[b.urgencyLevel] || 2);
        })
      : [];

    setSections({ forYou: forYou.slice(0, 3), trending: trending.slice(0, 3), newCampaigns: newCampaigns.slice(0, 3), similar: similar.slice(0, 3), categoryRecs: categoryRecs.slice(0, 3) });

    // Fetch Gemini reasons for "For You" section (max 3 calls)
    const reasonMap = {};
    await Promise.all(forYou.slice(0, 3).map(async c => {
      const r = await getRecommendationReason(c.campaignName, c.category, topCat);
      if (r) reasonMap[c.campaignId] = r;
    }));
    setReasons(reasonMap);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axiosInstance.get('/api/campaigns/public').catch(() => ({ data: { data: [] } })),
      user ? axiosInstance.get('/api/user/donations/my').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
    ]).then(([c, d]) => {
      buildRecommendations(c.data?.data || [], d.data?.data || []);
    }).finally(() => setLoading(false));
  }, [buildRecommendations, user]);

  const hasAny = Object.values(sections).some(s => s.length > 0);
  if (!loading && !hasAny) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ marginTop: 32 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
            🤖 AI Recommendations
          </h2>
          {topCategory && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Personalized based on your <span style={{ color: '#a78bfa' }}>{topCategory}</span> donation history
            </p>
          )}
        </div>
        <Link to="/campaigns">
          <span style={{ fontSize: 13, color: 'var(--primary-light)' }}>See all →</span>
        </Link>
      </div>

      <Section title="✨ Recommended For You" campaigns={sections.forYou} reasons={reasons} loading={loading} />
      <Section title="🔥 Trending Now" campaigns={sections.trending} reasons={{}} loading={loading} />
      {sections.similar.length > 0 && (
        <Section title="🔗 Similar Campaigns" campaigns={sections.similar} reasons={{}} loading={false} />
      )}
      {sections.categoryRecs.length > 0 && topCategory && (
        <Section title={`📂 More in ${topCategory}`} campaigns={sections.categoryRecs} reasons={{}} loading={false} />
      )}
      <Section title="🆕 Newly Added" campaigns={sections.newCampaigns} reasons={{}} loading={loading} />
    </motion.div>
  );
}
