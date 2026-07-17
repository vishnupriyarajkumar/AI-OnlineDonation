import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axiosInstance from '../../api/axiosInstance';
import { useLanguage } from '../../context/LanguageContext';

const CATEGORIES = ['All', 'Water', 'Education', 'Healthcare', 'Food', 'Environment', 'Other'];
const STATUSES   = ['All', 'ACTIVE', 'COMPLETED', 'DRAFT', 'CLOSED'];
const SORT_OPTIONS = [
  { value: 'newest',      label: '🕐 Newest' },
  { value: 'oldest',      label: '📅 Oldest' },
  { value: 'mostDonated', label: '💰 Most Donated' },
  { value: 'highGoal',    label: '⬆️ Highest Goal' },
  { value: 'lowGoal',     label: '⬇️ Lowest Goal' },
  { value: 'ending',      label: '⏰ Ending Soon' },
  { value: 'trending',    label: '🔥 Trending' },
];
const URGENCY_COLORS = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626' };

const isCompleted = c =>
  c.status === 'CLOSED' || c.status === 'COMPLETED' ||
  (Number(c.collectedAmount) >= Number(c.goalAmount) && Number(c.goalAmount) > 0);

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SkeletonCard() {
  return (
    <div className="skeleton-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 180 }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 15, width: '85%', borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 5, borderRadius: 99, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 38, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.35)', cursor: 'pointer' }}
      onClick={onRemove}
    >
      {label} ✕
    </motion.span>
  );
}

export default function Campaigns() {
  const { t } = useLanguage();
  const [campaigns, setCampaigns] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('newest');
  const debouncedSearch         = useDebounce(search, 280);

  const [category, setCategory] = useState('All');
  const [status, setStatus]     = useState('All');
  const [minGoal, setMinGoal]   = useState('');
  const [maxGoal, setMaxGoal]   = useState('');
  const [minRaised, setMinRaised] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  useEffect(() => {
    axiosInstance.get('/api/campaigns/public')
      .catch(() => ({ data: { data: [
        { campaignId: '1', campaignName: 'Clean Water for 500 Families', description: 'Providing safe drinking water to remote villages in Maharashtra.', category: 'Water', urgencyLevel: 'CRITICAL', collectedAmount: 450000, goalAmount: 500000, progressPercent: 90, daysRemaining: 5, status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
        { campaignId: '2', campaignName: 'Education for Every Child', description: 'Sponsoring school kits for underprivileged children.', category: 'Education', urgencyLevel: 'HIGH', collectedAmount: 120000, goalAmount: 300000, progressPercent: 40, daysRemaining: 15, status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
        { campaignId: '3', campaignName: 'Medical Camp for Elderly', description: 'Free checkups and medicines for senior citizens.', category: 'Healthcare', urgencyLevel: 'MEDIUM', collectedAmount: 85000, goalAmount: 100000, progressPercent: 85, daysRemaining: 2, status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
        { campaignId: '4', campaignName: 'Flood Relief in Assam', description: 'Emergency food, shelter, and medical supplies for flood victims.', category: 'Food', urgencyLevel: 'CRITICAL', collectedAmount: 750000, goalAmount: 1000000, progressPercent: 75, daysRemaining: 10, status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
      ] } }))
      .then(r => { const d = r.data?.data || []; setCampaigns(d); setFiltered(d); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = [...campaigns];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(c =>
        c.campaignName?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.createdBy?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    }
    if (category !== 'All') list = list.filter(c => c.category === category);
    if (status !== 'All')   list = list.filter(c => c.status === status);
    if (minGoal)  list = list.filter(c => Number(c.goalAmount) >= Number(minGoal));
    if (maxGoal)  list = list.filter(c => Number(c.goalAmount) <= Number(maxGoal));
    if (minRaised) list = list.filter(c => Number(c.collectedAmount) >= Number(minRaised));
    if (dateFrom) list = list.filter(c => c.createdAt && new Date(c.createdAt) >= new Date(dateFrom));
    if (dateTo)   list = list.filter(c => c.createdAt && new Date(c.createdAt) <= new Date(dateTo));

    switch (sortBy) {
      case 'oldest':      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'newest':      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'mostDonated': list.sort((a, b) => Number(b.collectedAmount) - Number(a.collectedAmount)); break;
      case 'highGoal':    list.sort((a, b) => Number(b.goalAmount) - Number(a.goalAmount)); break;
      case 'lowGoal':     list.sort((a, b) => Number(a.goalAmount) - Number(b.goalAmount)); break;
      case 'ending':      list.sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999)); break;
      case 'trending':    list.sort((a, b) => (b.progressPercent || 0) - (a.progressPercent || 0)); break;
      default: break;
    }
    setFiltered(list);
  }, [debouncedSearch, category, status, minGoal, maxGoal, minRaised, dateFrom, dateTo, sortBy, campaigns]);

  const clearAll = () => {
    setSearch(''); setCategory('All'); setStatus('All');
    setMinGoal(''); setMaxGoal(''); setMinRaised('');
    setDateFrom(''); setDateTo(''); setSortBy('newest');
  };

  const activeFilters = [
    category !== 'All'  && { key: 'cat',      label: `📂 ${category}`,          clear: () => setCategory('All') },
    status !== 'All'    && { key: 'status',    label: `🔖 ${status}`,            clear: () => setStatus('All') },
    minGoal             && { key: 'minGoal',   label: `Goal ≥ ₹${minGoal}`,      clear: () => setMinGoal('') },
    maxGoal             && { key: 'maxGoal',   label: `Goal ≤ ₹${maxGoal}`,      clear: () => setMaxGoal('') },
    minRaised           && { key: 'minRaised', label: `Raised ≥ ₹${minRaised}`,  clear: () => setMinRaised('') },
    dateFrom            && { key: 'dateFrom',  label: `From ${dateFrom}`,         clear: () => setDateFrom('') },
    dateTo              && { key: 'dateTo',    label: `To ${dateTo}`,             clear: () => setDateTo('') },
  ].filter(Boolean);

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="page-header text-center">
          <h1>All <span className="gradient-text">{t('nav.campaigns') || 'Campaigns'}</span></h1>
          <p>{t('chooseCause') || 'Choose a cause and make a difference today'}</p>
        </div>

        {/* ── Search + Sort bar ─────────────────────────── */}
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
              <input
                className="form-control"
                placeholder={t('searchCampaigns') || 'Search by name, NGO, description…'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
            </div>
            <select className="form-control" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 170 }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <motion.button
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowFilters(p => !p)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ whiteSpace: 'nowrap' }}
            >
              🎛️ Filters{activeFilters.length > 0 && (
                <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>
                  {activeFilters.length}
                </span>
              )}
            </motion.button>
          </div>

          {/* Category quick-filter */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <motion.button
                key={cat}
                className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategory(cat)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Advanced Filter Panel ─────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="card"
              style={{ marginBottom: 16, padding: 20, overflow: 'hidden' }}
              initial={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16, paddingTop: 20, paddingBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
                <div>
                  <label className="form-label">Campaign Status</label>
                  <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Min Goal (₹)</label>
                  <input className="form-control" type="number" placeholder="e.g. 50000" value={minGoal} onChange={e => setMinGoal(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Max Goal (₹)</label>
                  <input className="form-control" type="number" placeholder="e.g. 500000" value={maxGoal} onChange={e => setMaxGoal(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Min Amount Raised (₹)</label>
                  <input className="form-control" type="number" placeholder="e.g. 10000" value={minRaised} onChange={e => setMinRaised(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Created From</label>
                  <input className="form-control" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Created To</label>
                  <input className="form-control" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <motion.button className="btn btn-secondary btn-sm" onClick={clearAll} whileHover={{ scale: 1.03 }}>
                  🗑️ Clear All Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Active filter chips ───────────────────────── */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Active filters:</span>
              {activeFilters.map(f => <FilterChip key={f.key} label={f.label} onRemove={f.clear} />)}
              {activeFilters.length > 1 && (
                <motion.button className="btn btn-sm btn-danger" onClick={clearAll} whileHover={{ scale: 1.03 }} style={{ fontSize: 11 }}>
                  Clear All
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results count ─────────────────────────────── */}
        {!loading && (
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 13 }}>
            {t('showing') || 'Showing'} <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> {t('ofLabel') || 'of'} <strong style={{ color: 'var(--text)' }}>{campaigns.length}</strong> campaigns
            {debouncedSearch && <span> for "<em style={{ color: '#a78bfa' }}>{debouncedSearch}</em>"</span>}
          </p>
        )}

        {/* ── Campaign Grid ─────────────────────────────── */}
        {loading ? (
          <div className="grid-3">
            {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div className="text-center card" style={{ padding: 60 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <h3 style={{ marginBottom: 8 }}>{t('noCampaignsFound') || 'No campaigns found'}</h3>
            <p className="text-muted" style={{ marginBottom: 20 }}>{t('tryAdjust') || 'Try adjusting your search or filters'}</p>
            {activeFilters.length > 0 && (
              <motion.button className="btn btn-primary btn-sm" onClick={clearAll} whileHover={{ scale: 1.03 }}>
                🗑️ Clear All Filters
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="grid-3">
            {filtered.map((c, idx) => (
              <motion.div key={c.campaignId} className="campaign-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(idx, 5) * 0.06 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
              >
                <div style={{ position: 'relative', overflow: 'hidden', height: 180 }}>
                  <motion.img
                    src={c.imageUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600'}
                    alt={c.campaignName} loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    whileHover={{ scale: 1.05 }} transition={{ duration: 0.4 }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.55),transparent)' }} />
                  {c.daysRemaining <= 7 && (
                    <motion.div
                      style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}
                      animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                    >⏰ {c.daysRemaining}d left</motion.div>
                  )}
                </div>

                <div className="campaign-card-body">
                  <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                    <span className="badge badge-active">{c.category}</span>
                    {isCompleted(c) ? (
                      <span style={{ background:'linear-gradient(135deg,#10b981,#34d399)', color:'#fff', borderRadius:99, padding:'3px 12px', fontSize:11, fontWeight:700 }}>🎉 COMPLETED</span>
                    ) : (
                      <span style={{ fontSize: 11, color: URGENCY_COLORS[c.urgencyLevel], fontWeight: 700 }}>⚡ {c.urgencyLevel}</span>
                    )}
                  </div>
                  <h3 className="campaign-card-title">{c.campaignName}</h3>
                  {c.createdBy && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>🏢 {c.createdBy}</p>}
                  <p className="campaign-card-desc">{c.description}</p>

                  <div style={{ marginTop: 14 }}>
                    <div className="flex justify-between" style={{ fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('raised') || 'Raised'}</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(c.collectedAmount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div className="progress-fill"
                        initial={{ width: 0 }} whileInView={{ width: `${c.progressPercent}%` }}
                        viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    <div className="flex justify-between" style={{ fontSize: 11, marginTop: 5, color: 'var(--text-muted)' }}>
                      <span>{t('goal') || 'Goal'}: ₹{Number(c.goalAmount).toLocaleString('en-IN')}</span>
                      {isCompleted(c)
                        ? <span style={{ color:'#10b981', fontWeight:700 }}>🎉 Goal Achieved</span>
                        : <span>⏳ {c.daysRemaining}{t('daysLeft') || 'd left'}</span>}
                    </div>
                  </div>
                </div>

                <div className="campaign-card-footer">
                  {isCompleted(c) ? (
                    <button className="btn w-full" disabled style={{ justifyContent:'center', opacity:0.55, cursor:'not-allowed', background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(52,211,153,0.1))', color:'#10b981', border:'1px solid rgba(16,185,129,0.3)', fontWeight:700 }}>
                      🎉 Campaign Completed
                    </button>
                  ) : (
                    <Link to={`/campaigns/${c.campaignId}`} className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                      {t('viewAndDonate') || 'View & Donate'} 💜
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
