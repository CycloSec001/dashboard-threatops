import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

/* ---------- Inline NIST SVG Wheel ---------- */
function NistWheel() {
  return (
    <svg
      viewBox="0 0 280 280"
      width="230"
      height="230"
      style={{ overflow: 'visible', flexShrink: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Left teal glow */}
        <radialGradient id="leftGlow" cx="30%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#06b6d4" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        
        {/* Right purple glow */}
        <radialGradient id="rightGlow" cx="70%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#a855f7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>

        {/* Orb sphere gradient - bright green center */}
        <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#3bff5b" stopOpacity="1" />
          <stop offset="40%"  stopColor="#3bff5b" stopOpacity="0.8" />
          <stop offset="75%"  stopColor="#ccffcc" stopOpacity="0.9" />
          <stop offset="95%"  stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </radialGradient>

        {/* Glow filter for white ring */}
        <filter id="whiteGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Green glow for NIST text */}
        <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
          <feFlood floodColor="#3bff5b" floodOpacity="1" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="cb"/>
          <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Circular text path: center 140,140, r=88 */}
        <path
          id="circleText"
          d="M140,52 A88,88 0 1,1 139.99,52"
          fill="none"
        />
      </defs>

      {/* Behind-orb colored glows */}
      <circle cx="140" cy="140" r="85" fill="url(#leftGlow)" />
      <circle cx="140" cy="140" r="95" fill="url(#rightGlow)" />

      {/* Sunburst radial dashes inside the glow */}
      <circle cx="140" cy="140" r="62" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" strokeDasharray="1.5 4" />
      <circle cx="140" cy="140" r="62" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="8" strokeDasharray="1.5 4" strokeDashoffset="140" opacity="0.6"/>
      <circle cx="140" cy="140" r="62" fill="none" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="8" strokeDasharray="1.5 4" strokeDashoffset="280" opacity="0.6"/>

      {/* Main glowing orb */}
      <circle cx="140" cy="140" r="54" fill="url(#orbGrad)" filter="url(#whiteGlow)" />

      {/* NIST text - stylized */}
      <text
        x="140" y="142"
        fontFamily="'Inter', sans-serif"
        fontWeight="900"
        fontSize="26"
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="2"
        filter="url(#textGlow)"
      >NIST</text>

      {/* Cube icon below orb */}
      <g transform="translate(129, 218)">
        <polygon
          points="11,1 22,7 22,19 11,25 0,19 0,7"
          stroke="#3bff5b"
          strokeWidth="2.5"
          fill="none"
          opacity="0.9"
        />
        <line x1="11" y1="1"  x2="11" y2="25" stroke="#3bff5b" strokeWidth="2" opacity="0.8" />
        <line x1="0"  y1="7"  x2="22" y2="7"  stroke="#3bff5b" strokeWidth="2" opacity="0.8" />
        <line x1="0"  y1="19" x2="22" y2="19" stroke="#3bff5b" strokeWidth="2" opacity="0.8" />
      </g>

      {/* Circular text around ring */}
      <text
        fontFamily="'Inter', sans-serif"
        fontSize="12.5"
        fontWeight="800"
        fill="#e5e7eb"
        letterSpacing="5"
        opacity="0.9"
      >
        <textPath href="#circleText" startOffset="50%" textAnchor="middle">
          IDENTIFY  PROTECT  DETECT  RESPOND  RECOVER  
        </textPath>
      </text>

      {/* Decorative circuit lines and dots */}
      <g stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none">
        
        {/* 10 o'clock: straight up-left to hollow ring */}
        <polyline points="75,85 55,65" />
        <circle cx="55" cy="65" r="3.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="#121816" />

        {/* 9:30: left, bend up-left to green dot */}
        <polyline points="65,115 45,115 35,105 15,105" />
        <circle cx="15" cy="105" r="2.5" fill="#3bff5b" stroke="none" />

        {/* 8 o'clock: left, bend down, bend left to hollow ring */}
        <polyline points="65,155 45,155 35,175 25,175" />
        <circle cx="25" cy="175" r="3.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="#121816" />

        {/* 7 o'clock: down-left to red dot */}
        <polyline points="85,195 65,215 50,215" />
        <circle cx="50" cy="215" r="2.5" fill="#ef4444" stroke="none" />

        {/* 2 o'clock: right, bend up-right to green dot */}
        <polyline points="215,85 235,65 255,65" />
        <circle cx="255" cy="65" r="2.5" fill="#3bff5b" stroke="none" />

        {/* 3 o'clock: straight right to hollow ring */}
        <polyline points="225,115 260,115" />
        <circle cx="260" cy="115" r="3.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="#121816" />

        {/* 4 o'clock: right, bend down to red dot */}
        <polyline points="215,155 245,155 255,165 270,165" />
        <circle cx="270" cy="165" r="2.5" fill="#ef4444" stroke="none" />

        {/* 5 o'clock: down-right to hollow ring */}
        <polyline points="195,195 215,215 235,215" />
        <circle cx="235" cy="215" r="3.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="#121816" />
      </g>
    </svg>
  )
}

/* ---------- Animated Particle Dot ---------- */
function Dot({ x, y, color, size = 2, glow = false }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x, top: y,
        width: size, height: size,
        backgroundColor: color,
        boxShadow: glow ? `0 0 8px 2px ${color}` : 'none',
        opacity: glow ? 0.9 : 0.4,
      }}
      animate={{ opacity: glow ? [0.9, 0.6, 0.9] : [0.4, 0.2, 0.4] }}
      transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

/* Scattered dots that match reference image */
const dots = [
  // Left area dots
  { x: '12%', y: '22%', color: '#ffffff', size: 1.5 },
  { x: '18%', y: '72%', color: '#ffffff', size: 1.5 },
  { x: '8%',  y: '50%', color: '#ffffff', size: 1 },

  // Mid-left dots
  { x: '30%', y: '18%', color: '#ffffff', size: 1 },
  { x: '26%', y: '80%', color: '#ffffff', size: 1 },
  { x: '35%', y: '58%', color: '#ffffff', size: 1 },

  // Center dots
  { x: '42%', y: '30%', color: '#ffffff', size: 1.5 },
  { x: '50%', y: '70%', color: '#3bff5b', size: 2, glow: true },
  { x: '55%', y: '20%', color: '#ffffff', size: 1 },

  // Accent colored dots
  { x: '22%', y: '82%', color: '#ec4899', size: 2.5, glow: true },  // magenta
  { x: '60%', y: '78%', color: '#ef4444', size: 2.5, glow: true },  // red
  { x: '68%', y: '22%', color: '#eab308', size: 2, glow: true },    // yellow
  { x: '72%', y: '68%', color: '#06b6d4', size: 2, glow: true },    // cyan
  { x: '40%', y: '88%', color: '#3bff5b', size: 1.5, glow: true },  // green

  // Right side (near NIST)
  { x: '80%', y: '15%', color: '#ffffff', size: 1 },
  { x: '84%', y: '85%', color: '#ffffff', size: 1 },
]

/* ---------- Main HeroBanner Component ---------- */
export default function HeroBanner() {
  return (
    <div
      className="relative flex items-center justify-between overflow-hidden"
      style={{
        width: '100%',
        height: '165px',
        background: 'rgba(10, 16, 24, 0.42)',
        backdropFilter: 'blur(16px) saturate(120%)',
        WebkitBackdropFilter: 'blur(16px) saturate(120%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        padding: '32px',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Scattered glow particles */}
      {dots.map((d, i) => <Dot key={i} {...d} />)}

      {/* LEFT — Text */}
      <div style={{ width: '45%', zIndex: 2 }}>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.2,
            margin: 0,
            letterSpacing: '-0.2px',
          }}
        >
          Security Operations Center (SOC) Overview
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: '#9CA3AF',
            lineHeight: 1.6,
            maxWidth: '380px',
            marginTop: '12px',
            marginBottom: 0,
          }}
        >
          Access real-time telemetry to discover and analyze all anomalous
          <br />activity across the Cyclosec Enterprise network.
        </p>
      </div>

      {/* Spacer — keeps large gap between text and image */}
      <div style={{ flex: 1 }} />

      {/* RIGHT — NIST Wheel positioned at far right */}
      <div
        style={{
          width: '35%',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Radial green glow behind wheel */}
        <div
          style={{
            position: 'absolute',
            right: '-10px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,255,91,0.14) 0%, rgba(59,255,91,0.04) 55%, transparent 75%)',
            pointerEvents: 'none',
          }}
        />
        <NistWheel />
      </div>
    </div>
  )
}
