import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_ICONS = {
  DONATION_SUCCESS:  { icon: '💰', color: '#10b981', label: 'New Donation' },
  CAMPAIGN_CREATED:  { icon: '🎯', color: '#a78bfa', label: 'New Campaign' },
  CAMPAIGN_APPROVED: { icon: '✅', color: '#34d399', label: 'Campaign Approved' },
  USER_REGISTERED:   { icon: '🌟', color: '#60a5fa', label: 'New Member' },
  GOAL_ACHIEVED:     { icon: '🏆', color: '#fbbf24', label: 'Goal Achieved!' },
  VOLUNTEER_JOINED:  { icon: '🤝', color: '#06b6d4', label: 'Volunteer Joined' },
  ACCOUNT_VERIFIED:  { icon: '✔️', color: '#10b981', label: 'Account Verified' },
  ACHIEVEMENT:       { icon: '🏅', color: '#f59e0b', label: 'Achievement Unlocked' },
};

// Fallback mock events for when WebSocket is unavailable
const MOCK_EVENTS = [
  { type: 'DONATION_SUCCESS',  message: 'Someone donated ₹2,500 to Clean Water Campaign',      timestamp: new Date().toISOString() },
  { type: 'USER_REGISTERED',   message: 'A new donor joined CharityOrg!',                        timestamp: new Date(Date.now()-60000).toISOString() },
  { type: 'CAMPAIGN_APPROVED', message: 'Education for Every Child was approved',               timestamp: new Date(Date.now()-120000).toISOString() },
  { type: 'GOAL_ACHIEVED',     message: 'Flood Relief campaign reached its target! 🎉',          timestamp: new Date(Date.now()-180000).toISOString() },
  { type: 'DONATION_SUCCESS',  message: 'Anonymous donor contributed ₹5,000 to Healthcare',     timestamp: new Date(Date.now()-240000).toISOString() },
  { type: 'VOLUNTEER_JOINED',  message: '3 volunteers joined Plant a Million Trees initiative',  timestamp: new Date(Date.now()-300000).toISOString() },
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ago`;
}

export default function LiveActivityFeed({ maxItems = 6, compact = false }) {
  const [events,   setEvents]   = useState(MOCK_EVENTS);
  const [connected,setConnected]= useState(false);
  const [pulse,    setPulse]    = useState(false);
  const wsRef = useRef(null);

  /* ── Try WebSocket connection ──────────────────────── */
  useEffect(() => {
    let stompClient = null;
    let reconnectTimer = null;

    const connect = () => {
      try {
        // Dynamic import to avoid breaking if @stomp/stompjs is not installed
        import('@stomp/stompjs').then(({ Client }) => {
          stompClient = new Client({
            brokerURL: 'ws://localhost:8080/ws/websocket',
            reconnectDelay: 10000,
            onConnect: () => {
              setConnected(true);
              stompClient.subscribe('/topic/activity-feed', (msg) => {
                const event = JSON.parse(msg.body);
                setEvents(prev => [event, ...prev].slice(0, 20));
                setPulse(true);
                setTimeout(() => setPulse(false), 800);
              });
            },
            onDisconnect: () => setConnected(false),
            onStompError:  () => setConnected(false),
          });
          stompClient.activate();
        }).catch(() => {
          // @stomp/stompjs not installed — use mock data only
          setConnected(false);
        });
      } catch {
        setConnected(false);
      }
    };

    connect();
    // Rotate mock events every 8 seconds when disconnected
    const mockInterval = setInterval(() => {
      if (!connected) {
        const fake = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
        setEvents(prev => [{ ...fake, timestamp: new Date().toISOString() }, ...prev].slice(0, 20));
        setPulse(true);
        setTimeout(() => setPulse(false), 800);
      }
    }, 8000);

    return () => {
      stompClient?.deactivate();
      clearInterval(mockInterval);
      clearTimeout(reconnectTimer);
    };
  }, []);

  if (compact) {
    return (
      <div style={{ overflow: 'hidden' }}>
        {events.slice(0, maxItems).map((ev, i) => {
          const meta = EVENT_ICONS[ev.type] || { icon: '📡', color: '#9090b0', label: 'Event' };
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderRadius: 10, marginBottom: 6,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: `${meta.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>{meta.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.message}
                </p>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                {timeAgo(ev.timestamp)}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-glass)', border: '1px solid var(--border)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(16,185,129,0.04)',
      }}>
        <motion.div
          animate={pulse ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#10b981' : '#f59e0b',
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 14 }}>📡 Live Activity Feed</span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: connected ? '#10b981' : '#f59e0b',
          background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          padding: '2px 8px', borderRadius: 99,
        }}>
          {connected ? '● Live' : '○ Simulated'}
        </span>
      </div>

      {/* Events */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
          {events.slice(0, maxItems).map((ev, i) => {
            const meta = EVENT_ICONS[ev.type] || { icon: '📡', color: '#9090b0', label: 'Event' };
            return (
              <motion.div
                key={`${ev.timestamp}-${i}`}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  borderBottom: i < events.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `${meta.color}20`, border: `1px solid ${meta.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{meta.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{ev.message}</p>
                  <p style={{ fontSize: 11, color: meta.color, marginTop: 2 }}>{meta.label}</p>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {timeAgo(ev.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
