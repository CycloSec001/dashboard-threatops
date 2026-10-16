import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  MdRefresh, MdWarningAmber, MdSearch, MdFilterList, MdPerson,
  MdClose, MdShield, MdLocationOn, MdDevices, MdHistory,
  MdArrowUpward, MdArrowDownward, MdSecurity, MdBolt,
  MdPersonOff, MdVisibilityOff, MdLock, MdTravelExplore
} from 'react-icons/md'
import { fetchUebaKPIs } from '../api/threatOpsApi'
import { uebaKpis } from '../data/threatOpsUebaKpis'
import DetailTable from '../components/DetailTable'

// ── Tooltip style ─────────────────────────────────────────────────────────────
const TT = {
  backgroundColor: '#0d1117',
  border: '1px solid #21262d',
  borderRadius: '8px',
  color: '#e8f0ea',
  fontSize: '11px',
  padding: '8px 12px',
}

// ── Risk badge ────────────────────────────────────────────────────────────────
const RiskBadge = ({ val }) => {
  const v = String(val).toLowerCase()
  let cls = 'text-gray-400 bg-gray-500/10 border-gray-500/20'
  if (v === 'critical') cls = 'text-red-400 bg-red-500/10 border-red-500/20'
  else if (v === 'high') cls = 'text-orange-400 bg-orange-500/10 border-orange-500/20'
  else if (v === 'medium') cls = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  else if (v === 'low') cls = 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  else if (v === 'active') cls = 'text-green-400 bg-green-500/10 border-green-500/20'
  else if (v === 'suspended') cls = 'text-red-400 bg-red-500/10 border-red-500/20'
  else if (v === 'mfa required') cls = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  else if (v === 'open') cls = 'text-red-400 bg-red-500/10 border-red-500/20'
  else if (v === 'investigating') cls = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  else if (v === 'resolved') cls = 'text-green-400 bg-green-500/10 border-green-500/20'
  else if (v === 'terminated') cls = 'text-gray-400 bg-gray-500/10 border-gray-500/20'
  else if (v === 'reviewing') cls = 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  return (
    <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {val}
    </span>
  )
}

// ── KPI Icon map ──────────────────────────────────────────────────────────────
const KPI_ICONS = {
  users: MdPerson,
  risky: MdPersonOff,
  anomaly: MdBolt,
  session: MdVisibilityOff,
  location: MdTravelExplore,
  privilege: MdLock,
  compromise: MdShield,
  gauge: MdSecurity,
}

// ── Gauge Component ───────────────────────────────────────────────────────────
function RiskGauge({ value, color }) {
  const clamped = Math.min(100, Math.max(0, value || 0))
  const angle = (clamped / 100) * 180 - 90
  const r = 52
  const cx = 70, cy = 70
  const startX = cx - r, startY = cy
  const rad = (angle * Math.PI) / 180
  const endX = cx + r * Math.cos(rad)
  const endY = cy + r * Math.sin(rad)

  const riskColor = clamped >= 70 ? '#EF4444' : clamped >= 40 ? '#F59E0B' : '#10B981'

  return (
    <svg viewBox="0 0 140 90" className="w-full max-w-[130px]">
      <defs>
        <linearGradient id="gaugeTrack" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#1f2937" strokeWidth="10" strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
        fill="none" stroke="url(#gaugeTrack)" strokeWidth="10" strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={cx + (r - 10) * Math.cos(rad)}
        y2={cy + (r - 10) * Math.sin(rad)}
        stroke={riskColor} strokeWidth="2" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="4" fill={riskColor} />
      {/* Value */}
      <text x={cx} y={cy + 18} textAnchor="middle" fill={riskColor} fontSize="16" fontWeight="bold">{clamped}</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#6b7280" fontSize="7">AVG RISK</text>
    </svg>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ config, data, isLoading }) {
  const Icon = KPI_ICONS[config.icon] || MdPerson
  const value = data?.[config.key]
  const isGauge = config.visualization === 'gauge'

  if (isLoading) {
    return (
      <div className="kpi-glass-card flex flex-col justify-between p-4 border border-white/[0.08] rounded-[12px] h-[140px] animate-pulse">
        <div className="w-10 h-10 bg-white/5 rounded-[8px]" />
        <div className="h-8 bg-white/5 rounded mt-2 w-2/3" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="kpi-glass-card flex flex-col justify-between p-4 border border-white/[0.08] rounded-[12px] h-[140px] hover:border-white/[0.20] transition-all cursor-default relative overflow-hidden"
    >
      <div className="flex items-start gap-3 relative z-10">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-[8px] flex-shrink-0"
          style={{ backgroundColor: `${config.color}18`, border: `1px solid ${config.color}30` }}
        >
          <Icon size={20} style={{ color: config.color }} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[12px] font-semibold text-slate-200 leading-[1.25]" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{config.title}</span>
          {isGauge ? (
            <div className="flex items-center justify-start mt-1 -ml-2">
              <RiskGauge value={value} color={config.color} />
            </div>
          ) : (
            <span className="text-[28px] font-bold text-white leading-tight mt-1 whitespace-nowrap">
              {value !== undefined && value !== null ? value.toLocaleString() : '—'}
            </span>
          )}
        </div>
      </div>
      <span className="text-[11px] text-slate-400 relative z-10">{config.subtext}</span>
    </motion.div>
  )
}

// ── Heatmap Component ─────────────────────────────────────────────────────────
function ActivityHeatmap() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const cells = useMemo(() => Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0)), [])
  return (
    <div className="flex flex-col text-[10px] text-[#6b7280] select-none">
      <div className="flex mb-1 ml-8">
        {hours.map(h => (
          <div key={h} className="flex-1 text-center" style={{ minWidth: 0 }}>
            {h % 6 === 0 ? `${h}h` : ''}
          </div>
        ))}
      </div>
      {days.map((d, di) => (
        <div key={d} className="flex items-center mb-[2px]">
          <div className="w-8 shrink-0 text-right pr-2">{d}</div>
          <div className="flex flex-1 gap-[2px]">
            {hours.map(h => {
              const v = cells[di]?.[h] ?? 0
              const isAnomaly = v > 0.87
              return (
                <div
                  key={h}
                  className="flex-1 rounded-[2px] cursor-default"
                  style={{
                    aspectRatio: '1/1',
                    backgroundColor: isAnomaly
                      ? `rgba(239,68,68,${0.6 + v * 0.4})`
                      : `rgba(0,217,255,${v * 0.45 + 0.04})`,
                  }}
                  title={`${d} ${h}:00 — ${isAnomaly ? '⚠ Anomaly' : 'Normal'} (${(v * 100).toFixed(0)}%)`}
                />
              )
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-5 mt-3 ml-8 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[2px]" style={{ background: 'rgba(0,217,255,0.3)' }} />
          Normal Activity
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[2px] bg-red-500/80" />
          Behavioral Anomaly
        </span>
      </div>
    </div>
  )
}

// ── Auth Geography Map ────────────────────────────────────────────────────────
const GEO_COLORS = { Critical: '#EF4444', High: '#F97316', Medium: '#F59E0B', Low: '#3B82F6' }

function AuthGeoMap({ locations }) {
  const [tooltip, setTooltip] = useState(null)
  return (
    <div className="relative w-full h-full bg-[#0a0f14] rounded-md overflow-hidden border border-[#1f2937]">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1000 500">
        {Array.from({ length: 18 }, (_, i) => (
          <line key={`v${i}`} x1={i * 55.5} y1={0} x2={i * 55.5} y2={500} stroke="#374151" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 55.5} x2={1000} y2={i * 55.5} stroke="#374151" strokeWidth="0.5" />
        ))}
        {/* Continent silhouettes */}
        <path d="M160,120 Q200,100 240,140 T280,160 T300,110 T220,70 Z" fill="#1f2937" />
        <path d="M300,180 Q320,165 345,200 T360,240 T315,265 Z" fill="#1f2937" />
        <path d="M450,80 Q490,60 520,110 T575,130 T600,75 T530,40 Z" fill="#1f2937" />
        <path d="M580,130 Q615,120 640,160 T695,180 T720,105 T665,90 Z" fill="#1f2937" />
        <path d="M740,235 Q775,225 805,265 T855,285 T875,200 T810,185 Z" fill="#1f2937" />
        <path d="M470,215 Q500,200 525,240 T545,280 T490,305 Z" fill="#1f2937" />
        <path d="M395,130 Q415,120 435,145 T448,188 T400,208 Z" fill="#1f2937" />
      </svg>

      {/* Location pins */}
      {(locations || []).map((loc, i) => {
        const x = (loc.lng + 180) * (100 / 360)
        const y = (90 - loc.lat) * (100 / 180)
        const color = GEO_COLORS[loc.risk] || '#9ca3af'
        const size = Math.max(6, Math.min(24, Math.sqrt(loc.authCount) * 1.4))
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05, type: 'spring' }}
            className="absolute cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
            onMouseEnter={() => setTooltip(loc)}
            onMouseLeave={() => setTooltip(null)}
          >
            <div
              className="rounded-full relative flex items-center justify-center"
              style={{ width: size, height: size, backgroundColor: `${color}40`, boxShadow: `0 0 ${size * 1.2}px ${color}70` }}
            >
              <div className="rounded-full absolute" style={{ width: size * 0.45, height: size * 0.45, backgroundColor: color }} />
            </div>
          </motion.div>
        )
      })}

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute top-3 right-3 bg-[#111827] border border-[#374151] rounded-md px-3 py-2.5 z-20 text-[11px] min-w-[160px] shadow-xl">
          <p className="font-bold text-white mb-1">{tooltip.city}, {tooltip.country}</p>
          <div className="space-y-0.5 text-[#9ca3af]">
            <p>Auth Events: <span className="text-white font-mono">{tooltip.authCount}</span></p>
            <p>Users: <span className="text-white font-mono">{tooltip.userCount}</span></p>
            <p>Risk: <span className="font-bold" style={{ color: GEO_COLORS[tooltip.risk] }}>{tooltip.risk}</span></p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 bg-[#111827]/80 backdrop-blur-sm border border-[#1f2937] p-2 rounded-md">
        {Object.entries(GEO_COLORS).map(([risk, color]) => (
          <div key={risk} className="flex items-center gap-1.5 text-[10px] text-[#9ca3af]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {risk}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = useMemo(() => (data || []).reduce((s, d) => s + d.value, 0), [data])
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={78} dataKey="value" stroke="#0B0F12" strokeWidth={2}>
              {(data || []).map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
            <RTooltip contentStyle={TT} itemStyle={{ color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pb-2">
        {(data || []).map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-[#9ca3af]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
            {d.name}
            <span className="font-semibold text-white">{d.value.toLocaleString()}</span>
            <span className="text-[#6b7280]">({total ? ((d.value / total) * 100).toFixed(0) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Chart Card Wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, isLoading, isEmpty, children }) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-4 flex flex-col h-full">
      <p className="text-[13px] font-bold text-white mb-0.5">{title}</p>
      {subtitle && <p className="text-[11px] text-[#6b7280] mb-3">{subtitle}</p>}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="w-full h-full bg-white/5 rounded-md animate-pulse" />
        ) : isEmpty ? (
          <div className="flex items-center justify-center h-full text-[#6b7280] text-[12px]">No data for this period</div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

// ── User Detail Drawer ────────────────────────────────────────────────────────
function UserDetailDrawer({ user, onClose }) {
  if (!user) return null
  const riskColor = user.riskLevel === 'Critical' ? '#EF4444' : user.riskLevel === 'High' ? '#F97316' : '#F59E0B'

  return (
    <AnimatePresence>
      <motion.div
        key="drawer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        key="drawer-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="fixed right-0 top-0 h-full w-[520px] max-w-[95vw] bg-[#0d1117] border-l border-[#1f2937] z-50 flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#1f2937] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1f2937] flex items-center justify-center text-white font-bold text-lg">
              {user.displayName?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-[15px] font-bold text-white">{user.displayName}</p>
              <p className="text-[12px] text-[#6b7280]">{user.name} · {user.title} · {user.dept}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[6px] text-[#6b7280] hover:text-white hover:bg-[#1f2937] transition-colors">
            <MdClose size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">

          {/* Risk Overview */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-4">
            <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3">Risk Overview</p>
            <div className="flex items-center gap-6">
              <div className="relative flex items-center justify-center">
                <svg viewBox="0 0 60 60" className="w-20 h-20">
                  <circle cx="30" cy="30" r="26" fill="none" stroke="#1f2937" strokeWidth="5" />
                  <circle
                    cx="30" cy="30" r="26"
                    fill="none"
                    stroke={riskColor}
                    strokeWidth="5"
                    strokeDasharray={`${(user.riskScore / 100) * 163.4} 163.4`}
                    strokeLinecap="round"
                    transform="rotate(-90 30 30)"
                    style={{ filter: `drop-shadow(0 0 6px ${riskColor}80)` }}
                  />
                  <text x="30" y="34" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{user.riskScore}</text>
                </svg>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><RiskBadge val={user.riskLevel} /><span className="text-[12px] text-white font-bold">Risk Level</span></div>
                <div className="text-[12px] text-[#9ca3af]">Anomalies: <span className="text-white font-mono">{user.anomalyCount}</span></div>
                <div className="text-[12px] text-[#9ca3af]">Sessions: <span className="text-white font-mono">{user.suspiciousSessions}</span></div>
                <div className="text-[12px] text-[#9ca3af]">Status: <RiskBadge val={user.status} /></div>
              </div>
            </div>
          </div>

          {/* Why Risky */}
          {user.riskReasons?.length > 0 && (
            <div className="bg-[#1c1a10] border border-yellow-700/30 rounded-[10px] p-4">
              <p className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MdWarningAmber size={14} /> Why is this user considered risky?
              </p>
              <ul className="space-y-1.5">
                {user.riskReasons.map((r, i) => (
                  <li key={i} className="text-[12px] text-yellow-300/80 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">▸</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Behavior Baseline */}
          {user.baseline && (
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-4">
              <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdHistory size={14} /> Behavior Baseline
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Typical Hours', user.baseline.typicalLoginHours],
                  ['Avg Daily Events', user.baseline.avgDailyEvents],
                  ['Data Access', user.baseline.avgDataAccess],
                  ['Locations', user.baseline.typicalLocations?.join(', ')],
                ].map(([label, val]) => (
                  <div key={label} className="text-[11px]">
                    <p className="text-[#6b7280] mb-0.5">{label}</p>
                    <p className="text-white font-medium truncate">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Anomalies */}
          {user.recentAnomalies?.length > 0 && (
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-4">
              <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdBolt size={14} /> Recent Anomalies
              </p>
              <div className="space-y-2.5">
                {user.recentAnomalies.map((a, i) => (
                  <div key={i} className="flex gap-3 p-2.5 rounded-[8px] bg-[#0d1117] border border-[#1f2937]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <RiskBadge val={a.severity} />
                        <span className="text-[12px] font-bold text-white">{a.type}</span>
                      </div>
                      <p className="text-[11px] text-[#9ca3af]">{a.description}</p>
                      <p className="text-[10px] text-[#6b7280] mt-1 font-mono">{a.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auth History */}
          {user.authHistory?.length > 0 && (
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-4">
              <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdHistory size={14} /> Authentication History
              </p>
              <div className="space-y-2">
                {user.authHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] py-1.5 border-b border-[#1f2937] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${h.result === 'Failed' ? 'bg-red-500' : 'bg-green-500'}`} />
                      <span className="text-[#d1d5db] font-mono">{h.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#9ca3af]">
                      <span className="flex items-center gap-1"><MdLocationOn size={11} />{h.location}</span>
                      <span className="font-mono">{h.ip}</span>
                      <span className={h.result === 'Failed' ? 'text-red-400 font-bold' : 'text-green-400'}>{h.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Devices */}
          {user.devices?.length > 0 && (
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-4">
              <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdDevices size={14} /> Devices
              </p>
              <div className="space-y-2">
                {user.devices.map((d, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#0d1117] rounded-[8px] px-3 py-2 text-[11px]">
                    <div>
                      <p className="text-white font-medium">{d.name}</p>
                      <p className="text-[#6b7280]">{d.os} · Last seen {d.lastSeen}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] ${d.trusted ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {d.trusted ? 'Trusted' : 'Unmanaged'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privilege Changes */}
          {user.privilegeChanges?.length > 0 && (
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-4">
              <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdLock size={14} /> Privilege Changes
              </p>
              <div className="space-y-2">
                {user.privilegeChanges.map((p, i) => (
                  <div key={i} className="flex justify-between text-[11px] border-b border-[#1f2937] last:border-0 pb-2">
                    <div>
                      <span className="text-amber-400 font-bold">{p.action}</span>
                      <span className="text-[#d1d5db] ml-2">→ {p.target}</span>
                    </div>
                    <span className="text-[#6b7280] font-mono">{p.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Alerts & Incidents */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Related Alerts', value: user.relatedAlerts, color: '#F59E0B' },
              { label: 'Related Incidents', value: user.relatedIncidents, color: '#EF4444' },
            ].map(card => (
              <div key={card.label} className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-4 text-center">
                <p className="text-[28px] font-bold" style={{ color: card.color }}>{card.value}</p>
                <p className="text-[11px] text-[#6b7280] mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-2 pb-2">
            {[
              { label: 'Force Re-authentication', cls: 'bg-[#1f2937] text-white border-[#374151] hover:bg-[#374151]' },
              { label: 'Enforce MFA', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' },
              { label: 'Suspend User Session', cls: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' },
            ].map(btn => (
              <button key={btn.label} className={`w-full text-[12px] font-semibold border px-4 py-2.5 rounded-[8px] transition-all ${btn.cls}`}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
const FilterSelect = ({ label, options }) => (
  <select className="bg-[#1a2332] border border-[#2d3748] text-[12px] font-medium text-white rounded-[6px] px-2.5 py-1.5 outline-none hover:border-[#4a5568] transition-colors cursor-pointer appearance-none pr-6"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '14px' }}
  >
    <option>{label}</option>
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
)

// ── Main UEBA Page ────────────────────────────────────────────────────────────
export default function Ueba({ selectedTime }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      setData(await fetchUebaKPIs(selectedTime))
    } catch (err) {
      console.error('UEBA fetch error:', err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTime])

  useEffect(() => { load() }, [load])

  const isEmpty = !isLoading && !isError && data && Object.keys(data).length === 0
  const isPartial = !isLoading && !isError && data && uebaKpis.some(k => data[k.key] === undefined || data[k.key] === null)

  // Table column definitions
  const riskyUsersCols = [
    { header: 'User', accessor: 'displayName', render: (v, row) => (
      <div>
        <p className="text-white font-medium text-[12px]">{v}</p>
        <p className="text-[#6b7280] text-[10px] font-mono">{row.name}</p>
      </div>
    )},
    { header: 'Risk Score', accessor: 'riskScore', render: v => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-[#1f2937] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: v >= 70 ? '#EF4444' : v >= 40 ? '#F59E0B' : '#10B981' }} />
        </div>
        <span className="text-white font-mono text-[12px]">{v}</span>
      </div>
    )},
    { header: 'Risk Level', accessor: 'riskLevel', render: v => <RiskBadge val={v} /> },
    { header: 'Anomalies', accessor: 'anomalyCount', render: v => <span className="font-mono text-[12px] text-white">{v}</span> },
    { header: 'Suspicious Sessions', accessor: 'suspiciousSessions', render: v => <span className="font-mono text-[12px] text-amber-400">{v}</span> },
    { header: 'Last Activity', accessor: 'lastActivity', render: v => <span className="text-[11px] text-[#9ca3af]">{v}</span> },
    { header: 'Status', accessor: 'status', render: v => <RiskBadge val={v} /> },
  ]

  const anomalyCols = [
    { header: 'User', accessor: 'user', render: v => <span className="font-mono text-[12px] text-white">{v}</span> },
    { header: 'Behavior', accessor: 'behavior', render: v => <span className="text-[12px] text-white">{v}</span> },
    { header: 'Risk', accessor: 'riskLevel', render: v => <RiskBadge val={v} /> },
    { header: 'Source', accessor: 'source', render: v => <span className="text-[11px] text-[#9ca3af]">{v}</span> },
    { header: 'Timestamp', accessor: 'timestamp', render: v => <span className="font-mono text-[10px] text-[#6b7280]">{v}</span> },
    { header: 'Status', accessor: 'status', render: v => <RiskBadge val={v} /> },
  ]

  const sessionCols = [
    { header: 'User', accessor: 'user', render: v => <span className="font-mono text-[12px] text-white">{v}</span> },
    { header: 'Source IP', accessor: 'sourceIp', render: v => <span className="font-mono text-[11px] text-[#9ca3af]">{v}</span> },
    { header: 'Location', accessor: 'location', render: v => <span className="text-[11px] text-white">{v}</span> },
    { header: 'Device', accessor: 'device', render: v => <span className="text-[11px] text-[#9ca3af]">{v}</span> },
    { header: 'Risk', accessor: 'riskLevel', render: v => <RiskBadge val={v} /> },
    { header: 'Timestamp', accessor: 'timestamp', render: v => <span className="font-mono text-[10px] text-[#6b7280]">{v}</span> },
    { header: 'Status', accessor: 'status', render: v => <RiskBadge val={v} /> },
  ]

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      style={{
        background: `linear-gradient(#141B21 1px, transparent 1px), linear-gradient(90deg, #141B21 1px, transparent 1px), #0B0F12`,
        backgroundSize: '40px 40px',
      }}
    >
      <div className="flex flex-col gap-6 px-7 pt-6 pb-12">

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-white leading-tight">User Behavior Analytics</h1>
            <p className="text-[13px] text-[#6b7280] mt-1">
              Behavioral risk and anomaly visibility across users and identities. Anomalies indicate deviation — verify intent before action.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-center gap-2 bg-[#1c1a10] border border-yellow-700/40 rounded-[8px] px-4 py-2.5">
          <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
          <span className="text-[11px] font-semibold text-yellow-300/80 uppercase tracking-wider">
            UEBA anomalies indicate behavioral deviation, not confirmed attacks. Verify intent before sanctioning.
          </span>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#111827] border border-[#1f2937] p-3 rounded-[10px]">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <span className="flex items-center gap-1.5 text-[12px] text-[#6b7280] font-medium">
              <MdFilterList size={14} /> Filters:
            </span>
            <FilterSelect label="All Users" options={['jdoe', 'asmith', 'bwilliams', 'mchen', 'rkumar']} />
            <FilterSelect label="All Risk Levels" options={['Critical', 'High', 'Medium', 'Low']} />
            <FilterSelect label="All Departments" options={['Finance', 'IT', 'Engineering', 'HR', 'Sales', 'Legal', 'Vendor']} />
            <FilterSelect label="All Locations" options={['USA', 'UK', 'Russia', 'China', 'Nigeria']} />
            <FilterSelect label="Auth Source" options={['Azure AD', 'Okta', 'ADFS', 'Google']} />
            <FilterSelect label="All Devices" options={['Managed', 'Unmanaged', 'Mobile']} />
            <FilterSelect label="Behavior Type" options={['Mass Download', 'Impossible Travel', 'Off-hours Login', 'Privilege Escalation']} />
            <FilterSelect label="All Tenants" options={['Corp', 'Partner', 'Dev']} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#1a2332] border border-[#2d3748] focus-within:border-[#4a5568] transition-colors">
              <MdSearch size={14} className="text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Search users..."
                className="bg-transparent border-none outline-none text-[12px] text-white placeholder-[#6b7280] w-[150px]"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              {data?._lastUpdated && !isLoading && (
                <span className="text-[11px] text-[#4a5568] hidden lg:block">
                  Updated: {new Date(data._lastUpdated).toLocaleTimeString()}
                </span>
              )}
              <motion.button
                onClick={load}
                disabled={isLoading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#39FF6A]/10 border border-[#39FF6A]/30 text-[12px] font-medium text-[#39FF6A] hover:bg-[#39FF6A]/20 transition-all disabled:opacity-40"
              >
                <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                  <MdRefresh size={14} />
                </motion.div>
                Refresh
              </motion.button>
            </div>
          </div>
        </div>

        {/* Partial data banner */}
        <AnimatePresence>
          {isPartial && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-[#1c1a10] border border-yellow-700/40 rounded-[8px] px-4 py-2.5"
            >
              <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
              <span className="text-[12px] text-yellow-300/80">Some UEBA data is currently unavailable. Showing partial results.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 bg-[#111827] rounded-[10px] border border-red-900/30">
            <div className="text-red-400/60 text-5xl">⚠</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">Unable to load UEBA data</p>
            <button onClick={load} className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 transition-all text-[13px] font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && !isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 bg-[#111827] rounded-[10px] border border-[#1f2937]">
            <MdPerson size={40} className="text-[#374151]" />
            <p className="text-[14px] text-[#6b7280]">No behavioral data available for this period.</p>
          </div>
        )}

        {/* Main content */}
        {!isError && !isEmpty && (
          <div className="flex flex-col gap-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
              {uebaKpis.map(kpi => (
                <KpiCard key={kpi.key} config={kpi} data={data} isLoading={isLoading} />
              ))}
            </div>

            {/* Row 1: Risk Over Time + Behavioral Anomalies */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ height: 280 }}>
              <ChartCard title="User Risk Over Time" subtitle="Risk level breakdown across monitored users" isLoading={isLoading} isEmpty={isEmpty}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.userRiskOverTime || []} margin={{ left: -25, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                    <XAxis dataKey="t" stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={TT} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#9ca3af', paddingTop: 4 }} />
                    <Line type="monotone" dataKey="critical" stroke="#EF4444" strokeWidth={2} dot={false} name="Critical" />
                    <Line type="monotone" dataKey="high" stroke="#F97316" strokeWidth={2} dot={false} name="High" />
                    <Line type="monotone" dataKey="medium" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Medium" />
                    <Line type="monotone" dataKey="low" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="Low" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Behavioral Anomalies" subtitle="Anomaly categories detected over time" isLoading={isLoading} isEmpty={isEmpty}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.behavioralAnomaliesChart || []} margin={{ left: -25, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                    <XAxis dataKey="t" stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={TT} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#9ca3af', paddingTop: 4 }} />
                    <Bar dataKey="insiderThreat" stackId="a" fill="#EF4444" name="Insider Threat" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="accountCompromise" stackId="a" fill="#F97316" name="Account Compromise" />
                    <Bar dataKey="dataExfiltration" stackId="a" fill="#F59E0B" name="Data Exfiltration" />
                    <Bar dataKey="privilegeAbuse" stackId="a" fill="#8B5CF6" name="Privilege Abuse" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 2: Risk Distribution + Auth Map */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4" style={{ height: 300 }}>
              <div className="xl:col-span-1">
                <ChartCard title="Risk Distribution" subtitle="Users grouped by risk score bucket" isLoading={isLoading} isEmpty={isEmpty}>
                  <DonutChart data={data?.riskDistribution} />
                </ChartCard>
              </div>
              <div className="xl:col-span-2">
                <ChartCard title="Authentication Geography" subtitle="Login origin heatmap — unusual locations highlighted" isLoading={isLoading} isEmpty={isEmpty}>
                  <AuthGeoMap locations={data?.authenticationGeography} />
                </ChartCard>
              </div>
            </div>

            {/* Row 3: Activity Heatmap + Privilege Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ChartCard title="Activity by Hour" subtitle="7-day behavioral heatmap — amber cells indicate anomalous activity" isLoading={isLoading} isEmpty={isEmpty}>
                <div className="py-2">
                  <ActivityHeatmap />
                </div>
              </ChartCard>

              <ChartCard title="Privilege Activity" subtitle="Role changes, escalations and revocations" isLoading={isLoading} isEmpty={isEmpty}>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.privilegeActivity || []} margin={{ left: -25, right: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                      <XAxis dataKey="t" stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                      <RTooltip contentStyle={TT} />
                      <Legend wrapperStyle={{ fontSize: 10, color: '#9ca3af', paddingTop: 4 }} />
                      <Bar dataKey="roleChanges" fill="#8B5CF6" name="Role Changes" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="escalations" fill="#EF4444" name="Escalations" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="revocations" fill="#6b7280" name="Revocations" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Tables */}
            <div className="flex flex-col gap-4">
              {/* Top Risky Users — clickable */}
              <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2937]">
                  <div>
                    <p className="text-[13px] font-bold text-white">Top Risky Users</p>
                    <p className="text-[11px] text-[#6b7280]">Click any row to view full user detail and context</p>
                  </div>
                </div>
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-[#1f2937]">
                          {riskyUsersCols.map(c => (
                            <th key={c.header} className="text-left px-4 py-2.5 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">
                              {c.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.topRiskyUsersData || []).map((row, i) => (
                          <tr
                            key={i}
                            onClick={() => setSelectedUser(row)}
                            className="border-b border-[#1f2937] last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            {riskyUsersCols.map(c => (
                              <td key={c.header} className="px-4 py-3 whitespace-nowrap">
                                {c.render ? c.render(row[c.accessor], row) : row[c.accessor]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Behavioral Anomalies */}
              <DetailTable
                title="Recent Behavioral Anomalies"
                description="Latest behavioral deviations detected across monitored identities"
                columns={anomalyCols}
                data={data?.recentBehavioralAnomaliesData}
                isLoading={isLoading}
              />

              {/* Suspicious Sessions */}
              <DetailTable
                title="Suspicious Sessions"
                description="Active and recent sessions flagged for high-risk geolocations or device anomalies"
                columns={sessionCols}
                data={data?.suspiciousSessionsData}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* User Detail Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
