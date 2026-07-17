import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../api/axiosInstance';
import confetti from 'canvas-confetti';

const LEVEL_INFO = {
  Newcomer:  { color: '#9090b0', icon: '🌱', next: 50 },
  Starter:   { color: '#60a5fa', icon: '⭐', next: 200 },
  Supporter: { color: '#34d399', icon: '💪', next: 500 },
  Hero:      { color: '#f59e0b', icon: '🦸', next: 1000 },
  Champion:  { color: '#a78bfa', icon: '🏆', next: 2000 },
  Legend:    { color: '#ef4444', icon: '👑', next: null },
};

export default function GamificationWidget({ compact = false }) {
  const [achievements, setAchievements] = useState([]);
  const [stats,        setStats]        = useState({ xp: 0, level: 'Newcomer', achievementCount: 0 });
  const [leaderboard,  setLeaderboard]  = useState([]);
  const [tab,          setTab]          = useState('badges');
  const [loading,      setLoading]      = useState(true);
  const [celebrated,   setCelebrated]   = useState(new Set());

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/user/achievements').catch(() => ({ data: { data: [] } })),
      axiosInstance.get('/api/user/achievements/stats').catch(() => ({ data: { data: {} } })),
      axiosInstance.get('/api/leaderboard').catch(() => ({ data: { data: [] } })),
    ]).then(([a, s, l]) => {
      const achievs = a.data?.data || [];
      setAchievements(achievs);
      setStats(s.data?.data || { xp: 0, level: 'Newcomer', achievementCount: 0 });
      setLeaderboard((l.data?.data || []).slice(0, 10));

      // Confetti for new achievements not yet celebrated
      achievs.forEach(ach => {
        if (!celebrated.has(ach.achievementId)) {
          const earned = new Date(ach.earnedAt);
          if (Date.now() - earned.getTime() < 5 * 60 * 1000) {
            launchConfetti();
          }
        }
      });
    }).finally(() => setLoading(false));
  }, []);

  function launchConfetti() {
    confetti({
      particleCount: 120, spread: 80, origin: { y: 0.6 },
      colors: ['#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#f9a8d4'],
    });
  }

  const lvl = LEVEL_INFO[stats.level] || LEVEL_INFO.Newcomer;
  const prevXp   = stats.level === 'Newcomer' ? 0 :
    stats.level === 'Starter' ? 50 : stats.level === 'Supporter' ? 200 :
    stats.level === 'Hero' ? 500 : stats.level === 'Champion' ? 1000 : 2000;
  const xpProgress = lvl.next ? Math.min(100, ((stats.xp - prevXp) / (lvl.next - prevXp)) * 100) : 100;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: `${lvl.color}10`, border: `1px solid ${lvl.color}30`, borderRadius: 12 }}>
        <span style={{ fontSize: 28 }}>{lvl.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: lvl.color }}>{stats.level}</span>
            <span style={{ color: 'var(--text-muted)' }}>{stats.xp} XP</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
            <motion.div style={{ height: '100%', borderRadius: 99, background: lvl.color }}
              initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1 }} />
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{achievements.length} 🏅</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
      {/* XP Banner */}
      <div style={{
        padding: '24px 24px 20px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${lvl.color}25, ${lvl.color}10)`,
        borderBottom: '1px solid var(--border)',
      }}>
        <motion.div style={{ position: 'absolute', right: -10, top: -10, fontSize: 80, opacity: 0.08 }}
          animate={{ rotate: [0,10,-10,0] }} transition={{ duration: 6, repeat: Infinity }}>
          {lvl.icon}
        </motion.div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <motion.div
            style={{ fontSize: 48 }}
            animate={{ y: [0,-6,0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >{lvl.icon}</motion.div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: lvl.color }}>{stats.level}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              {stats.xp} XP · {achievements.length} Achievements
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${lvl.color},${lvl.color}cc)` }}
                initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
            {lvl.next && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                {lvl.next - stats.xp} XP until next level
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {['badges', 'leaderboard'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === t ? 'rgba(167,139,250,0.1)' : 'transparent',
            color: tab === t ? 'var(--primary-light)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--primary-light)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {t === 'badges' ? '🏅 Badges' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20, minHeight: 200 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
          </div>
        ) : tab === 'badges' ? (
          achievements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <p style={{ fontSize: 14 }}>Make your first donation to unlock achievements!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
              {achievements.map((a, i) => (
                <motion.div key={a.achievementId}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4, scale: 1.04 }}
                  style={{
                    padding: '14px 10px', borderRadius: 14, textAlign: 'center', cursor: 'default',
                    background: `${a.badgeColor || '#a78bfa'}15`,
                    border: `1px solid ${a.badgeColor || '#a78bfa'}35`,
                  }}
                >
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{a.badgeEmoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date(a.earnedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div>
            {leaderboard.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No data yet.</p>
            ) : (
              leaderboard.map((entry, i) => (
                <motion.div key={entry.userId}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    borderRadius: 10, marginBottom: 6,
                    background: i < 3 ? `rgba(${i===0?'251,191,36':i===1?'167,139,250':'96,165,250'},0.08)` : 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ width: 28, textAlign: 'center', fontWeight: 900, fontSize: 16 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.level} · {entry.xp} XP</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#34d399', fontSize: 13 }}>
                    ₹{Number(entry.totalDonated).toLocaleString('en-IN')}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
