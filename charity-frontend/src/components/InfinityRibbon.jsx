import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

/* ── Particle ─────────────────────────────────────────────── */
function Particle({ x, y, color, size = 4, delay = 0, burst = false }) {
  return (
    <motion.circle
      cx={x} cy={y} r={size}
      fill={color}
      initial={{ opacity: 0, scale: 0 }}
      animate={burst
        ? { opacity: [0, 1, 0], scale: [0, 1.5, 0], x: [(Math.random() - 0.5) * 40], y: [(Math.random() - 0.5) * 40] }
        : { opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }
      }
      transition={{ duration: burst ? 0.6 : 2.5, delay, repeat: burst ? 0 : Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ── Orbiting particle ────────────────────────────────────── */
function OrbitParticle({ radius, speed, color, offset = 0 }) {
  return (
    <motion.circle
      r={3} fill={color}
      animate={{
        cx: [100 + radius * Math.cos(offset), 100 + radius * Math.cos(offset + Math.PI), 100 + radius * Math.cos(offset + 2 * Math.PI)],
        cy: [60 + radius * 0.4 * Math.sin(offset), 60 + radius * 0.4 * Math.sin(offset + Math.PI), 60 + radius * 0.4 * Math.sin(offset + 2 * Math.PI)],
        opacity: [0.4, 1, 0.4],
      }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
    />
  );
}

const IDLE_PARTICLES = [
  { x: 60, y: 30, color: '#c084fc', delay: 0 },
  { x: 140, y: 30, color: '#60a5fa', delay: 0.4 },
  { x: 40, y: 70, color: '#34d399', delay: 0.8 },
  { x: 160, y: 70, color: '#f59e0b', delay: 1.2 },
  { x: 100, y: 15, color: '#a78bfa', delay: 0.6 },
  { x: 100, y: 105, color: '#818cf8', delay: 1.0 },
];

export default function InfinityRibbon({
  size = 200,
  onChatOpen,
  aiThinking = false,
  donationSuccess = false,
  hasNotification = false,
  className = '',
  style = {},
}) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [burst, setBurst] = useState(false);
  const controls = useAnimation();
  const glowControls = useAnimation();
  const theme = document.documentElement.getAttribute('data-theme');
  const isDark = theme !== 'light';

  // Color palette per state
  const colors = donationSuccess
    ? { a: '#fbbf24', b: '#f59e0b', c: '#fcd34d', glow: 'rgba(251,191,36,0.6)' }
    : aiThinking
    ? { a: '#818cf8', b: '#6366f1', c: '#a5b4fc', glow: 'rgba(99,102,241,0.6)' }
    : hovered
    ? { a: '#c084fc', b: '#60a5fa', c: '#34d399', glow: 'rgba(192,132,252,0.7)' }
    : { a: '#7c3aed', b: '#a78bfa', c: '#10b981', glow: 'rgba(124,58,237,0.4)' };

  const animSpeed = donationSuccess ? 1.2 : aiThinking ? 0.8 : hovered ? 1.5 : 2.5;

  useEffect(() => {
    if (donationSuccess) {
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
  }, [donationSuccess]);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 600);
    onChatOpen?.();
  };

  const scale = hovered ? 1.12 : clicked ? 0.92 : 1;

  // The ∞ path: two lobes meeting at center (100,60)
  const path = "M100,60 C100,30 140,10 160,30 C180,50 180,70 160,90 C140,110 100,90 100,60 C100,30 60,10 40,30 C20,50 20,70 40,90 C60,110 100,90 100,60 Z";

  return (
    <div
      className={className}
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer', ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      title="Open AI Assistant"
    >
      <motion.svg
        width={size} height={size * 0.6}
        viewBox="0 0 200 120"
        animate={{ scale, rotate: clicked ? [0, -5, 5, 0] : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 ${hovered ? 18 : donationSuccess ? 24 : 10}px ${colors.glow})`, overflow: 'visible' }}
      >
        <defs>
          {/* Animated gradient */}
          <motion.linearGradient id="ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%"
            animate={{ x1: ['0%', '100%', '0%'], y1: ['0%', '100%', '0%'] }}
            transition={{ duration: animSpeed * 2, repeat: Infinity, ease: 'linear' }}>
            <stop offset="0%" stopColor={colors.a} />
            <stop offset="50%" stopColor={colors.b} />
            <stop offset="100%" stopColor={colors.c} />
          </motion.linearGradient>

          {/* Glow filter */}
          <filter id="ribbon-glow">
            <feGaussianBlur stdDeviation={hovered || donationSuccess ? '4' : '2'} result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Clip path for ribbon stroke animation */}
          <clipPath id="ribbon-clip">
            <path d={path} />
          </clipPath>
        </defs>

        {/* Glow background path */}
        <motion.path
          d={path}
          fill="none"
          stroke={colors.glow}
          strokeWidth={hovered ? 14 : 10}
          opacity={0.3}
          animate={{ strokeWidth: [8, hovered ? 16 : 12, 8], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: animSpeed, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Main ribbon path */}
        <motion.path
          d={path}
          fill="none"
          stroke="url(#ribbon-grad)"
          strokeWidth={hovered ? 7 : 5}
          strokeLinecap="round"
          filter="url(#ribbon-glow)"
          animate={{
            strokeDashoffset: [0, -600],
            strokeWidth: hovered ? [6, 8, 6] : [4, 6, 4],
          }}
          style={{ strokeDasharray: 600 }}
          transition={{ strokeDashoffset: { duration: animSpeed, repeat: Infinity, ease: 'linear' }, strokeWidth: { duration: animSpeed, repeat: Infinity } }}
        />

        {/* Inner shimmer path */}
        <motion.path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={2}
          strokeLinecap="round"
          animate={{ strokeDashoffset: [0, -600], opacity: [0.1, 0.5, 0.1] }}
          style={{ strokeDasharray: 600 }}
          transition={{ strokeDashoffset: { duration: animSpeed * 0.7, repeat: Infinity, ease: 'linear' }, opacity: { duration: animSpeed, repeat: Infinity } }}
        />

        {/* Floating idle particles */}
        {IDLE_PARTICLES.map((p, i) => (
          <Particle key={i} {...p} burst={burst} />
        ))}

        {/* Orbiting particles when AI thinking */}
        {aiThinking && [0, 1, 2].map(i => (
          <OrbitParticle key={i} radius={55 + i * 10} speed={1.5 + i * 0.4} color={colors.b} offset={(i * Math.PI * 2) / 3} />
        ))}

        {/* Donation success sparkles */}
        {donationSuccess && [
          { x: 50, y: 20 }, { x: 150, y: 20 }, { x: 30, y: 80 }, { x: 170, y: 80 }, { x: 100, y: 10 }
        ].map((p, i) => (
          <motion.text key={i} x={p.x} y={p.y} fontSize="12" textAnchor="middle"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [p.y, p.y - 20] }}
            transition={{ duration: 1, delay: i * 0.1 }}>
            ✨
          </motion.text>
        ))}

        {/* Ripple on click */}
        <AnimatePresence>
          {clicked && (
            <motion.circle cx={100} cy={60} r={10} fill="none" stroke={colors.a} strokeWidth={2}
              initial={{ r: 10, opacity: 0.8 }}
              animate={{ r: 60, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Notification pulse dot */}
        {hasNotification && (
          <motion.circle cx={160} cy={25} r={6} fill="#ef4444"
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}

        {/* Floating motion wrapper */}
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(10,10,25,0.95)', border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600,
              color: '#a78bfa', whiteSpace: 'nowrap', pointerEvents: 'none',
              backdropFilter: 'blur(12px)',
            }}
          >
            {aiThinking ? '🤖 AI is thinking…' : '💬 Open AI Assistant'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
