import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axiosInstance from '../../api/axiosInstance';
import { useLanguage } from '../../context/LanguageContext';

export default function Campaigns() {
  const { t } = useLanguage();
  const [campaigns, setCampaigns] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [sortBy, setSortBy]       = useState('newest');
  const [loading, setLoading]     = useState(true);

  const CATEGORIES = ['All','Water','Education','Healthcare','Food','Environment','Other'];
  const urgencyColors = { LOW:'#10b981', MEDIUM:'#f59e0b', HIGH:'#ef4444', CRITICAL:'#dc2626' };

  useEffect(() => {
    axiosInstance.get('/api/campaigns/public')
      .catch(() => ({ data: { data: [
        { campaignId: 1, campaignName: 'Clean Water for 500 Families', description: 'Providing safe drinking water to remote villages in Maharashtra. This initiative will install 5 deep tube wells and solar pumps to ensure year-round water supply.', category: 'Water', urgencyLevel: 'CRITICAL', collectedAmount: 450000, goalAmount: 500000, progressPercent: 90, daysRemaining: 5, beneficiaries: 500 },
        { campaignId: 2, campaignName: 'Education for Every Child', description: 'Sponsoring school kits and tuition fees for underprivileged children. We are partnering with local schools to ensure zero dropout rates.', category: 'Education', urgencyLevel: 'HIGH', collectedAmount: 120000, goalAmount: 300000, progressPercent: 40, daysRemaining: 15, beneficiaries: 200 },
        { campaignId: 3, campaignName: 'Medical Camp for Elderly', description: 'Free checkups and medicines for senior citizens in rural areas. Includes free cataract surgeries and diabetes medication.', category: 'Healthcare', urgencyLevel: 'MEDIUM', collectedAmount: 85000, goalAmount: 100000, progressPercent: 85, daysRemaining: 2, beneficiaries: 300 },
        { campaignId: 4, campaignName: 'Flood Relief in Assam', description: 'Emergency food, shelter, and medical supplies for victims of the recent floods.', category: 'Food', urgencyLevel: 'CRITICAL', collectedAmount: 750000, goalAmount: 1000000, progressPercent: 75, daysRemaining: 10, beneficiaries: 2500 }
      ] } }))
      .then(r => { const d = r.data?.data || []; setCampaigns(d); setFiltered(d); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = [...campaigns];
    if (search) list = list.filter(c =>
      c.campaignName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All') list = list.filter(c => c.category === category);
    if (sortBy === 'newest') list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'urgent') {
      const order = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 };
      list.sort((a,b) => order[a.urgencyLevel] - order[b.urgencyLevel]);
    } else if (sortBy === 'ending') list.sort((a,b) => a.daysRemaining - b.daysRemaining);
    else if (sortBy === 'progress') list.sort((a,b) => b.progressPercent - a.progressPercent);
    setFiltered(list);
  }, [search, category, sortBy, campaigns]);

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop:60, paddingBottom:80 }}>
        <div className="page-header text-center">
          <h1>{t('all') || 'All'} <span className="gradient-text">{t('campaigns')}</span></h1>
          <p>{t('chooseCause') || 'Choose a cause and make a difference today'}</p>
        </div>
        <div className="card" style={{ marginBottom:32, padding:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16 }}>
            <input className="form-control" placeholder={`🔍 ${t('searchCampaigns')}`}
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="form-control" value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ width:180 }}>
              <option value="newest">{t('newestFirst') || 'Newest First'}</option>
              <option value="urgent">{t('mostUrgent')}</option>
              <option value="ending">{t('endingSoon')}</option>
              <option value="progress">{t('mostFunded') || 'Most Funded'}</option>
            </select>
          </div>
          <div className="flex gap-2" style={{ marginTop:16, flexWrap:'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} className={`btn btn-sm ${category===cat?'btn-primary':'btn-secondary'}`}
                onClick={() => setCategory(cat)}>{cat}</button>
            ))}
          </div>
        </div>
        {loading ? <div className="spinner" /> : (
          <>
            <p style={{ color:'var(--text-muted)', marginBottom:24, fontSize:14 }}>
              {t('showing') || 'Showing'} {filtered.length} {t('of') || 'of'} {campaigns.length} {t('campaigns')}
            </p>
            {filtered.length === 0 ? (
              <div className="text-center card" style={{ padding:60 }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
                <h3>{t('noCampaignsFound') || 'No campaigns found'}</h3>
                <p className="text-muted">{t('tryAdjust') || 'Try adjusting your search or filters'}</p>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.map(c => (
                  <div key={c.campaignId} className="campaign-card">
                    <img src={c.imageUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600'}
                         alt={c.campaignName} loading="lazy" />
                    <div className="campaign-card-body">
                      <div className="flex justify-between items-center" style={{ marginBottom:8 }}>
                        <span className="badge badge-active">{c.category}</span>
                        <span style={{ fontSize:11, color:urgencyColors[c.urgencyLevel], fontWeight:700 }}>
                          ⚡ {c.urgencyLevel}
                        </span>
                      </div>
                      <h3 className="campaign-card-title">{c.campaignName}</h3>
                      <p className="campaign-card-desc">{c.description}</p>
                      <div style={{ marginTop:14 }}>
                        <div className="flex justify-between" style={{ fontSize:13, marginBottom:6 }}>
                          <span style={{ color:'var(--text-muted)' }}>{t('raised')}</span>
                          <span style={{ fontWeight:700, color:'#10b981' }}>
                            ₹{Number(c.collectedAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width:`${c.progressPercent}%` }} />
                        </div>
                        <div className="flex justify-between" style={{ fontSize:12, marginTop:6, color:'var(--text-muted)' }}>
                          <span>{t('goal')}: ₹{Number(c.goalAmount).toLocaleString('en-IN')}</span>
                          <span>⏳ {c.daysRemaining}{t('daysLeft')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="campaign-card-footer">
                      <Link to={`/campaigns/${c.campaignId}`} className="btn btn-primary w-full"
                        style={{ justifyContent:'center' }}>{t('viewAndDonate') || 'View & Donate'} 💜</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
