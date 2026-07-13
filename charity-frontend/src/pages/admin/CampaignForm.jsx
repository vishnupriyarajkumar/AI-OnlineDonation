import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar } from './AdminSidebar';
import toast from 'react-hot-toast';

const CATEGORIES   = ['Education','Healthcare','Food','Water','Environment','General'];
const URGENCY_OPTS = ['LOW','MEDIUM','HIGH','CRITICAL'];

export default function CampaignForm() {
  const { id }    = useParams();
  const isEdit    = Boolean(id);
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    campaignName: '', description: '', goalAmount: '',
    startDate: '', endDate: '', imageUrl: '',
    category: 'General', beneficiaries: '', urgencyLevel: 'MEDIUM',
  });
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    if (!isEdit) return;
    axiosInstance.get(`/api/campaigns/public/${id}`)
      .then(r => {
        const c = r.data?.data;
        if (c) setForm({
          campaignName: c.campaignName   || '',
          description:  c.description    || '',
          goalAmount:   c.goalAmount     || '',
          startDate:    c.startDate      ? c.startDate.slice(0,10) : '',
          endDate:      c.endDate        ? c.endDate.slice(0,10)   : '',
          imageUrl:     c.imageUrl       || '',
          category:     c.category       || 'General',
          beneficiaries: c.beneficiaries || '',
          urgencyLevel: c.urgencyLevel   || 'MEDIUM',
        });
      })
      .catch(() => toast.error('Failed to load campaign'))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.campaignName.trim()) e.campaignName = 'Name is required';
    if (!form.description.trim())  e.description  = 'Description is required';
    if (!form.goalAmount || Number(form.goalAmount) < 1000) e.goalAmount = 'Goal must be ≥ ₹1000';
    if (!form.startDate)           e.startDate    = 'Start date is required';
    if (!form.endDate)             e.endDate      = 'End date is required';
    if (form.startDate && form.endDate && form.endDate <= form.startDate) e.endDate = 'End date must be after start date';
    if (!form.beneficiaries || Number(form.beneficiaries) < 1) e.beneficiaries = 'Enter number of beneficiaries';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the errors'); return; }
    setLoading(true);

    const payload = {
      campaignName:  form.campaignName.trim(),
      description:   form.description.trim(),
      goalAmount:    Number(form.goalAmount),
      startDate:     form.startDate,
      endDate:       form.endDate,
      imageUrl:      form.imageUrl.trim() || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600',
      category:      form.category,
      beneficiaries: Number(form.beneficiaries),
      urgencyLevel:  form.urgencyLevel,
    };

    try {
      if (isEdit) {
        await axiosInstance.put(`/api/admin/campaigns/${id}`, payload);
        toast.success('Campaign updated successfully! ✅');
      } else {
        await axiosInstance.post('/api/admin/campaigns', payload);
        toast.success('Campaign created! It is in DRAFT — approve it to make it active. 🎯');
      }
      navigate('/admin/campaigns');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.data?.campaignName || 'Action failed';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main"><div className="dashboard-content"><div className="spinner" /></div></main>
    </div>
  );

  const F = ({ label, name, type='text', placeholder, required, min, step, children }) => (
    <div className="form-group">
      <label style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:6, display:'block' }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </label>
      <input className="form-control" type={type} name={name}
        placeholder={placeholder} value={form[name]} min={min} step={step}
        onChange={e => set(name, e.target.value)}
        style={errors[name] ? { borderColor:'#ef4444' } : {}} />
      {errors[name] && <p style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>⚠ {errors[name]}</p>}
      {children}
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:26, fontWeight:900 }}>
              {isEdit ? '✏️ Edit' : '🎯 Create'} <span className="gradient-text">Campaign</span>
            </h1>
            <p style={{ color:'var(--text-muted)', marginTop:4 }}>
              {isEdit ? 'Update campaign details' : 'New campaigns start as DRAFT — approve them from the campaigns list'}
            </p>
          </div>

          <div className="card" style={{ maxWidth:820, padding:36 }}>
            <form onSubmit={handleSubmit} noValidate>

              {/* Campaign Name */}
              <F label="Campaign Name" name="campaignName" placeholder="e.g. Clean Water for 500 Families" required />

              {/* Description */}
              <div className="form-group">
                <label style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:6, display:'block' }}>
                  Description <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <textarea className="form-control" rows={4}
                  placeholder="Describe the campaign purpose and impact…"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  style={errors.description ? { borderColor:'#ef4444' } : {}} />
                {errors.description && <p style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>⚠ {errors.description}</p>}
              </div>

              {/* Goal + Beneficiaries */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <F label="Goal Amount (₹)" name="goalAmount" type="number" min="1000" step="100" placeholder="500000" required />
                <F label="Beneficiaries" name="beneficiaries" type="number" min="1" placeholder="500" required />
              </div>

              {/* Dates */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <F label="Start Date" name="startDate" type="date" required />
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:6, display:'block' }}>
                    End Date <span style={{ color:'#ef4444' }}>*</span>
                  </label>
                  <input className="form-control" type="date" name="endDate"
                    value={form.endDate} min={form.startDate}
                    onChange={e => set('endDate', e.target.value)}
                    style={errors.endDate ? { borderColor:'#ef4444' } : {}} />
                  {errors.endDate && <p style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>⚠ {errors.endDate}</p>}
                </div>
              </div>

              {/* Category + Urgency */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:6, display:'block' }}>Category</label>
                  <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:6, display:'block' }}>Urgency Level</label>
                  <select className="form-control" value={form.urgencyLevel} onChange={e => set('urgencyLevel', e.target.value)}>
                    {URGENCY_OPTS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Image URL */}
              <div className="form-group">
                <label style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:6, display:'block' }}>
                  Image URL <span style={{ fontSize:11, opacity:0.6 }}>(optional — uses default if blank)</span>
                </label>
                <input className="form-control" type="url" name="imageUrl"
                  placeholder="https://images.unsplash.com/..."
                  value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview"
                    style={{ marginTop:10, width:'100%', height:140, objectFit:'cover', borderRadius:8, opacity:0.8 }}
                    onError={e => e.target.style.display='none'} />
                )}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
                <button type="button" className="btn btn-secondary"
                  onClick={() => navigate('/admin/campaigns')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}
                  style={{ minWidth:140, justifyContent:'center' }}>
                  {loading ? (
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                      Saving…
                    </span>
                  ) : isEdit ? '✓ Update Campaign' : '🚀 Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

