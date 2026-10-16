import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdAdd, MdClose, MdRefresh, MdSearch, MdDashboard,
  MdMoreVert, MdDelete, MdEdit, MdOpenInFull,
  MdSave, MdRestartAlt, MdGridView, MdCheckCircle,
  MdWarningAmber, MdErrorOutline, MdHourglassEmpty,
  MdSchedule
} from 'react-icons/md'
import { RiLayoutGridLine } from 'react-icons/ri'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip as RechTooltip,
  ResponsiveContainer
} from 'recharts'
import PageShell, { ActSection } from '../components/PageShell'
import { fetchCustomDashboardWidgetData } from '../api/threatOpsApi'
import {
  WIDGET_CATALOGUE, CATEGORIES, VIZ_LABELS, CATEGORY_COLORS
} from '../data/threatOpsCustomDashboardConfig'
import { customTooltip } from '../utils/mockData'
import { CHART_SIZES } from '../utils/chartSizes'

const STORAGE_KEY = 'threatops-custom-dashboard-v2'
const STALE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(isoStr) {
  if (!isoStr) return null
  const diff = Date.now() - new Date(isoStr).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

function isStale(isoStr) {
  if (!isoStr) return false
  return Date.now() - new Date(isoStr).getTime() > STALE_THRESHOLD_MS
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton shimmer
// ─────────────────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div
      className={`rounded-[4px] ${className}`}
      style={{
        background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Viz pill tab switcher
// ─────────────────────────────────────────────────────────────────────────────
function VizPills({ supported, active, onChange, color }) {
  return (
    <div className="flex gap-0.5 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[4px] p-0.5">
      {supported.map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="px-2 py-[2px] rounded-[4px] text-[9.5px] font-semibold uppercase tracking-wider transition-all"
          style={
            active === v
              ? { backgroundColor: color + '25', color }
              : { color: '#4a5568' }
          }
        >
          {VIZ_LABELS[v]}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Three-dot widget menu
// ─────────────────────────────────────────────────────────────────────────────
function WidgetMenu({ onRefresh, onRemove, onResize, currentSpan }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-6 h-6 flex items-center justify-center rounded-[4px] text-slate-400 hover:text-white hover:bg-white/[0.02] transition-all"
      >
        <MdMoreVert size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-7 z-50 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] py-1 min-w-[130px]"
            style={{}}
          >
            <button
              onClick={() => { onRefresh(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-[9.5px] text-slate-400 hover:text-white hover:bg-white/[0.02] transition-colors"
            >
              <MdRefresh size={13} /> Refresh
            </button>
            {onResize && (
              <button
                onClick={() => { onResize(currentSpan === 2 ? 1 : 2); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[9.5px] text-slate-400 hover:text-white hover:bg-white/[0.02] transition-colors"
              >
                {currentSpan === 2 ? <MdOpenInFull size={13} className="rotate-45" /> : <MdOpenInFull size={13} />}
                {currentSpan === 2 ? 'Make Half Width' : 'Make Full Width'}
              </button>
            )}
            <div className="border-t border-white/[0.05] my-1" />
            <button
              onClick={() => { onRemove(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-[9.5px] text-red-400 hover:text-red-300 hover:bg-red-500/[0.05] transition-colors"
            >
              <MdDelete size={13} /> Remove
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Gauge mini component
// ─────────────────────────────────────────────────────────────────────────────
function MiniGauge({ value, color, size = 90 }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0))
  const r = size * 0.38
  const cx = size / 2, cy = size * 0.58
  const startAngle = Math.PI, endAngle = 0
  const toXY = (a) => [cx + r * Math.cos(a), cy - r * Math.sin(a)]
  const [sx, sy] = toXY(startAngle)
  const [ex, ey] = toXY(endAngle)
  const angle = Math.PI - (pct / 100) * Math.PI
  const [vx, vy] = toXY(angle)
  const ri = r * 0.72
  const [six, siy] = [cx + ri * Math.cos(startAngle), cy - ri * Math.sin(startAngle)]
  const [eix, eiy] = [cx + ri * Math.cos(endAngle), cy - ri * Math.sin(endAngle)]
  const [vix, viy] = [cx + ri * Math.cos(angle), cy - ri * Math.sin(angle)]

  return (
    <svg width={size} height={size * 0.65} className="overflow-visible">
      {/* bg arc */}
      <path d={`M ${sx},${sy} A ${r},${r} 0 0 1 ${ex},${ey} L ${eix},${eiy} A ${ri},${ri} 0 0 0 ${six},${siy} Z`}
        fill="#1c2631" />
      {/* value arc */}
      <path d={`M ${sx},${sy} A ${r},${r} 0 0 1 ${vx},${vy} L ${vix},${viy} A ${ri},${ri} 0 0 0 ${six},${siy} Z`}
        fill={color} opacity={0.9} />
      {/* center value */}
      <text x={cx} y={cy + 2} textAnchor="middle" fill="white" fontSize={size * 0.18} fontWeight="700">{pct}%</text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Treemap component (pure CSS, no external lib needed)
// ─────────────────────────────────────────────────────────────────────────────
function SimpleTreemap({ data }) {
  if (!data || !data.length) return null
  const total = data.reduce((a, b) => a + b.value, 0)
  const sorted = [...data].sort((a, b) => b.value - a.value)
  return (
    <div className="flex flex-wrap gap-1 w-full h-full p-1">
      {sorted.map((d, i) => {
        const pct = (d.value / total) * 100
        return (
          <div
            key={i}
            className="flex items-center justify-center rounded-[4px] text-[10px] font-semibold text-white text-center overflow-hidden transition-all hover:opacity-90"
            title={`${d.name}: ${d.value}`}
            style={{
              backgroundColor: d.color + '50',
              borderLeft: `3px solid ${d.color}`,
              flexBasis: `${Math.max(pct, 12)}%`,
              flexGrow: pct,
              minHeight: 36,
            }}
          >
            <span className="px-1 truncate">{d.name}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Network "visualization" (node-link approximation using SVG)
// ─────────────────────────────────────────────────────────────────────────────
function NetworkViz({ data, color }) {
  const nodes = data?.scatter || []
  if (!nodes.length) return null
  const W = 320, H = 180
  // Use x/y from data, normalized to canvas
  const normalize = (val, max) => (val / 100) * (max - 40) + 20
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* draw edges between first node and others */}
      {nodes.slice(1, 6).map((n, i) => (
        <line key={i}
          x1={normalize(nodes[0].x, W)} y1={normalize(nodes[0].y, H)}
          x2={normalize(n.x, W)} y2={normalize(n.y, H)}
          stroke={color} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="3 3"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={normalize(n.x, W)} cy={normalize(n.y, H)}
            r={i === 0 ? 8 : Math.max(3, n.z / 6)}
            fill={i === 0 ? color : color + '70'}
            stroke={color} strokeWidth={i === 0 ? 2 : 1} strokeOpacity={0.5}
          />
          {i < 4 && (
            <text x={normalize(n.x, W) + 6} y={normalize(n.y, H) - 4}
              fontSize="8" fill="#9ca3af">{n.name}</text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline renderer
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const safe = Array.isArray(data) && data.length > 1 ? data : [0, 0]
  const chartData = safe.map((v, i) => ({ i, v }))
  const trend = safe[safe.length - 1] - safe[0]
  const trendColor = trend >= 0 ? '#EF4444' : '#39FF6A' // higher = worse for security metrics

  return (
    <div className="flex items-end gap-3 flex-1">
      <div style={{ width: 80, height: 36 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span className="text-[10px] font-semibold mb-0.5" style={{ color: trendColor }}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget content renderer (pure, no state)
// ─────────────────────────────────────────────────────────────────────────────
function WidgetContent({ catalogue, vizType, widgetData }) {
  const { color, dataKey, nameKey } = catalogue

  // ── KPI: mini-area ─────────────────────────────────────────────────────
  if (vizType === 'mini-area') {
    const safe = Array.isArray(widgetData.sparkline) && widgetData.sparkline.length > 1
      ? widgetData.sparkline : [widgetData.value, widgetData.value, widgetData.value]
    const sparkChartData = safe.map((v, i) => ({ i, v }))
    const cleanColor = (color || '#39FF6A').replace('#', '')
    return (
      <div className="relative flex flex-col flex-1 w-full overflow-hidden">
        <div className="absolute top-0 right-0 z-10 bg-black/5 backdrop-blur-[1px] px-2 py-0.5 rounded-[4px] border border-white/[0.05] pointer-events-none">
          <span className="text-[11px] font-bold text-white">{typeof widgetData.value === 'number' ? widgetData.value.toLocaleString() : widgetData.value}</span>
        </div>
        <div className="flex-1 -mx-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkChartData}>
              <defs>
                <linearGradient id={`cdg-mini-area-${cleanColor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} fillOpacity={1} fill={`url(#cdg-mini-area-${cleanColor})`} strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // ── KPI: mini-bar ──────────────────────────────────────────────────────
  if (vizType === 'mini-bar') {
    const safe = Array.isArray(widgetData.sparkline) && widgetData.sparkline.length > 1
      ? widgetData.sparkline : [widgetData.value, widgetData.value, widgetData.value]
    const sparkChartData = safe.map((v, i) => ({ i, v }))
    return (
      <div className="relative flex flex-col flex-1 w-full overflow-hidden">
        <div className="absolute top-0 right-0 z-10 bg-black/5 backdrop-blur-[1px] px-2 py-0.5 rounded-[4px] border border-white/[0.05] pointer-events-none">
          <span className="text-[11px] font-bold text-white">{typeof widgetData.value === 'number' ? widgetData.value.toLocaleString() : widgetData.value}</span>
        </div>
        <div className="flex-1 -mx-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sparkChartData}>
              <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // ── KPI: mini-line ─────────────────────────────────────────────────────
  if (vizType === 'mini-line') {
    const safe = Array.isArray(widgetData.sparkline) && widgetData.sparkline.length > 1
      ? widgetData.sparkline : [widgetData.value, widgetData.value, widgetData.value]
    const sparkChartData = safe.map((v, i) => ({ i, v }))
    return (
      <div className="relative flex flex-col flex-1 w-full overflow-hidden">
        <div className="absolute top-0 right-0 z-10 bg-black/5 backdrop-blur-[1px] px-2 py-0.5 rounded-[4px] border border-white/[0.05] pointer-events-none">
          <span className="text-[11px] font-bold text-white">{typeof widgetData.value === 'number' ? widgetData.value.toLocaleString() : widgetData.value}</span>
        </div>
        <div className="flex-1 -mx-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkChartData}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // ── KPI: gauge ─────────────────────────────────────────────────────────
  if (vizType === 'gauge') {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <MiniGauge value={widgetData.value} color={color} size={100} />
      </div>
    )
  }

  // ── Trend charts ───────────────────────────────────────────────────────
  const dk = dataKey || (widgetData.series?.[0] && Object.keys(widgetData.series[0]).find(k => k !== 'time')) || 'value'
  const gradId = `cdg-${catalogue.key}`

  if (vizType === 'line' && widgetData.series) {
    return (
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={widgetData.series} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
            <YAxis stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} />
            <RechTooltip contentStyle={customTooltip} itemStyle={{ color }} />
            <Line type="monotone" dataKey={dk} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (vizType === 'area' && widgetData.series) {
    return (
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={widgetData.series} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
            <YAxis stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} />
            <RechTooltip contentStyle={customTooltip} itemStyle={{ color }} />
            <Area type="monotone" dataKey={dk} stroke={color} strokeWidth={2} fill={`url(#${gradId})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // ── Distribution: bar ─────────────────────────────────────────────────
  if (vizType === 'bar' && widgetData.distribution) {
    const nk = nameKey || 'name'
    const dvk = dataKey || 'value'
    return (
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={widgetData.distribution} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey={nk} stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
            <YAxis stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} />
            <RechTooltip contentStyle={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey={dvk} radius={[3, 3, 0, 0]} barSize={16}>
              {widgetData.distribution.map((entry, i) => (
                <Cell key={i} fill={entry.color || color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // ── Distribution: donut ───────────────────────────────────────────────
  if (vizType === 'donut' && widgetData.distribution) {
    const dvk = dataKey || 'value'
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={widgetData.distribution} cx="50%" cy="50%" innerRadius="38%" outerRadius="68%"
                dataKey={dvk} stroke="none">
                {widgetData.distribution.map((e, i) => <Cell key={i} fill={e.color || color} />)}
              </Pie>
              <RechTooltip contentStyle={customTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center pt-1">
          {widgetData.distribution.slice(0, 4).map((d, i) => (
            <div key={i} className="flex items-center gap-1 text-[9px] text-[#6b7280]">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color || color }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Distribution: treemap ─────────────────────────────────────────────
  if (vizType === 'treemap' && widgetData.distribution) {
    return (
      <div className="flex-1 min-h-0">
        <SimpleTreemap data={widgetData.distribution} />
      </div>
    )
  }

  // ── Relationship: scatter / bubble ────────────────────────────────────
  if ((vizType === 'scatter' || vizType === 'bubble') && widgetData.scatter) {
    return (
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis type="number" dataKey="x" stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} name="Freq" dy={3} />
            <YAxis type="number" dataKey="y" stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} name="Sev" />
            {vizType === 'bubble' && <ZAxis type="number" dataKey="z" range={[30, 160]} name="Impact" />}
            <RechTooltip contentStyle={customTooltip} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={widgetData.scatter} fill={color} fillOpacity={0.65} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // ── Relationship: network ─────────────────────────────────────────────
  if (vizType === 'network' && widgetData.scatter) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <NetworkViz data={widgetData} color={color} />
      </div>
    )
  }

  return <div className="flex-1 flex items-center justify-center text-[#374151] text-[11px]">Unsupported visualization</div>
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Widget Card (4-col grid)
// ─────────────────────────────────────────────────────────────────────────────
function KpiWidgetCard({ widgetId, vizType, selectedTime, onRemove, onVizChange }) {
  const catalogue = WIDGET_CATALOGUE.find(w => w.key === widgetId)
  const [widgetData, setWidgetData] = useState(null)
  const [status, setStatus] = useState('loading') // loading|ok|error|empty
  const [fetchedAt, setFetchedAt] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const result = await fetchCustomDashboardWidgetData(widgetId, selectedTime)
      if (!result || Object.keys(result).length === 0) { setStatus('empty'); setWidgetData(null); return }
      setWidgetData(result)
      setFetchedAt(new Date().toISOString())
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [widgetId, selectedTime])

  useEffect(() => { load() }, [load])

  const stale = fetchedAt && isStale(fetchedAt) && status === 'ok'
  if (!catalogue) return null

  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }}
      className="relative flex flex-col rounded-[10px] border border-white/[0.05] bg-black/5 backdrop-blur-[1px] overflow-hidden group hover:border-white/[0.12] transition-all duration-200"
      style={{
        height: CHART_SIZES.kpi.default.height,
        borderColor: stale ? '#78350f50' : undefined,

      }}
    >
      {/* Colored accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-10" style={{ backgroundColor: catalogue.color }} />

      {/* Stale indicator */}
      {stale && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-[4px] px-2 py-0.5 z-10">
          <MdSchedule size={9} className="text-amber-400" />
          <span className="text-[9.5px] text-amber-400">Stale</span>
        </div>
      )}

      <div className="flex flex-col h-full px-3 pt-3 pb-3 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider leading-[1.25]" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              {catalogue.label}
            </span>
            <span className="text-[9.5px] text-slate-400 mt-0.5 leading-snug max-w-[140px] truncate">
              {catalogue.description}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <WidgetMenu onRefresh={load} onRemove={() => onRemove(widgetId)} />
          </div>
        </div>

        {/* Content */}
        {status === 'loading' && (
          <div className="flex-1 flex flex-col gap-2 justify-end">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-2 w-16" />
          </div>
        )}
        {status === 'error' && (
          <div className="flex-1 flex items-center gap-1.5 text-red-400/60">
            <MdErrorOutline size={14} />
            <span className="text-[10px]">Failed to load</span>
            <button onClick={load} className="text-[9px] underline text-red-400 hover:text-red-300">retry</button>
          </div>
        )}
        {status === 'empty' && (
          <div className="flex-1 flex items-center gap-1.5 text-slate-500">
            <MdHourglassEmpty size={14} />
            <span className="text-[10px]">No data for period</span>
          </div>
        )}
        {status === 'ok' && widgetData && (
          <WidgetContent catalogue={catalogue} vizType={vizType} widgetData={widgetData} />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/[0.05]">
          <VizPills supported={catalogue.supportedVisualizations} active={vizType}
            onChange={(v) => onVizChange(widgetId, v)} color={catalogue.color} />
          {fetchedAt && status === 'ok' && (
            <span className="text-[9.5px] text-slate-400">{timeAgo(fetchedAt)}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart Widget Card (2-col grid, taller)
// ─────────────────────────────────────────────────────────────────────────────
function ChartWidgetCard({ widgetId, vizType, colSpan, selectedTime, onRemove, onVizChange, onResize }) {
  const catalogue = WIDGET_CATALOGUE.find(w => w.key === widgetId)
  const [widgetData, setWidgetData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [fetchedAt, setFetchedAt] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const result = await fetchCustomDashboardWidgetData(widgetId, selectedTime)
      if (!result || Object.keys(result).length === 0) { setStatus('empty'); setWidgetData(null); return }
      setWidgetData(result)
      setFetchedAt(new Date().toISOString())
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [widgetId, selectedTime])

  useEffect(() => { load() }, [load])

  const stale = fetchedAt && isStale(fetchedAt) && status === 'ok'
  if (!catalogue) return null

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
      className={`relative flex flex-col rounded-[10px] border border-white/[0.05] bg-black/5 backdrop-blur-[1px] overflow-hidden group ${colSpan === 2 ? 'col-span-2' : 'col-span-1'}`}

      style={{
        height: CHART_SIZES[vizType]?.container || CHART_SIZES.default.container,
        borderColor: stale ? '#78350f50' : undefined,

      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: catalogue.color }} />

      {stale && (
        <div className="absolute top-2 right-8 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-[4px] px-2 py-0.5 z-10">
          <MdSchedule size={9} className="text-amber-400" />
          <span className="text-[9.5px] font-bold text-amber-400">Stale</span>
        </div>
      )}

      <div className="flex flex-col h-full px-3 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">{catalogue.label}</h3>
            <p className="text-[9.5px] text-slate-400 mt-0.5">{catalogue.description}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <VizPills supported={catalogue.supportedVisualizations} active={vizType}
                onChange={(v) => onVizChange(widgetId, v)} color={catalogue.color} />
            </div>
            <WidgetMenu onRefresh={load} onRemove={() => onRemove(widgetId)} onResize={(s) => onResize(widgetId, s)} currentSpan={colSpan || 1} />
          </div>
        </div>

        {/* Content */}
        {status === 'loading' && (
          <div className="flex-1 flex flex-col gap-2 justify-center px-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-4/5 mt-2" />
          </div>
        )}
        {status === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-red-400/60">
            <MdErrorOutline size={22} />
            <span className="text-[9.5px] text-slate-400">Failed to load widget</span>
            <button onClick={load} className="text-[9.5px] px-2 py-0.5 border border-red-500/20 rounded-[4px] text-red-400 hover:text-red-300 hover:bg-red-500/[0.05] transition-colors">Retry</button>
          </div>
        )}
        {status === 'empty' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-500">
            <MdHourglassEmpty size={22} />
            <span className="text-[9.5px]">No data available for period</span>
          </div>
        )}
        {status === 'ok' && widgetData && (
          <WidgetContent catalogue={catalogue} vizType={vizType} widgetData={widgetData} />
        )}

        {/* Footer */}
        {fetchedAt && status === 'ok' && (
          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/[0.05]">
            <MdSchedule size={9} className="text-slate-400" />
            <span className="text-[9.5px] text-slate-400">Updated {timeAgo(fetchedAt)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget Picker Modal
// ─────────────────────────────────────────────────────────────────────────────
function WidgetPickerModal({ addedKeys, onAdd, onClose }) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const tabs = ['All', ...CATEGORIES]

  const filtered = WIDGET_CATALOGUE.filter(w => {
    const matchCat = activeTab === 'All' || w.category === activeTab
    const q = search.toLowerCase()
    const matchSearch = !q || w.label.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  // Group by category for All tab
  const grouped = activeTab === 'All'
    ? CATEGORIES.reduce((acc, cat) => {
      const items = filtered.filter(w => w.category === cat)
      if (items.length) acc[cat] = items
      return acc
    }, {})
    : { [activeTab]: filtered }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-6"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.14 }}
        className="w-full max-w-[700px] flex flex-col rounded-[10px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] overflow-hidden"
        style={{ maxHeight: '82vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-3 border-b border-white/[0.05]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <MdGridView size={16} className="text-htb-green" />
              <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Add Widget</h2>
            </div>
            <p className="text-[9.5px] text-slate-400">Select a KPI or visualization to add to your custom dashboard</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-[4px] hover:bg-white/[0.02]">
            <MdClose size={18} />
          </button>
        </div>

        {/* Search + tabs */}
        <div className="px-3 pt-3 pb-3 border-b border-white/[0.05] space-y-3">
          <div className="flex items-center gap-2 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] px-3 py-2 focus-within:border-white/[0.12] transition-colors">
            <MdSearch size={14} className="text-[#374151] flex-shrink-0" />
            <input
              autoFocus value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search widgets…"
              className="bg-transparent text-[9.5px] text-white placeholder:text-slate-500 outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-[5px] text-[9.5px] font-semibold transition-all ${activeTab === tab
                  ? 'bg-[#39FF6A] text-[#0B0F12]'
                  : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04]'
                  }`}
              >
                {tab}
                {tab !== 'All' && (
                  <span className="ml-1.5 text-[9.5px] opacity-70">
                    {WIDGET_CATALOGUE.filter(w => w.category === tab).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Widget list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              {activeTab === 'All' && (
                <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  <span className="text-[9.5px] font-bold uppercase tracking-widest"
                    style={{ color: CATEGORY_COLORS[cat] }}>{cat}</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: CATEGORY_COLORS[cat] + '30' }} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {items.map(w => {
                  const isAdded = addedKeys.includes(w.key)
                  return (
                    <div key={w.key}
                      className={`group relative rounded-[10px] border p-3 cursor-pointer transition-all ${isAdded
                        ? 'border-white/[0.05] bg-black/5 opacity-50 cursor-not-allowed'
                        : 'border-white/[0.05] bg-black/5 hover:border-white/[0.12] hover:bg-white/[0.02] cursor-pointer'
                        }`}
                      onClick={() => !isAdded && onAdd(w)}
                    >
                      <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: w.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9.5px] font-semibold text-slate-200 truncate">{w.label}</span>
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-[4px] flex-shrink-0"
                            style={{ color: CATEGORY_COLORS[w.category], backgroundColor: CATEGORY_COLORS[w.category] + '18', border: `1px solid ${CATEGORY_COLORS[w.category]}30` }}>
                            {w.category}
                          </span>
                          {isAdded && <span className="text-[9.5px] text-htb-green ml-auto">✓ Added</span>}
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 line-clamp-2">{w.description}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {w.supportedVisualizations.map(v => (
                            <span key={v} className="text-[9.5px] bg-black/5 border border-white/[0.05] text-slate-400 rounded-[4px] px-2 py-0.5">
                              {VIZ_LABELS[v]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-[#374151]">
              <MdSearch size={28} />
              <p className="text-[12px]">No widgets match your search</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Save confirmation toast
// ─────────────────────────────────────────────────────────────────────────────
function SaveToast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-6 right-6 z-50 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] px-3 py-2"
          style={{
            // boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(57,255,106,0.1)'
          }}
        >
          <MdCheckCircle size={14} className="text-htb-green" />
          <span className="text-[9.5px] text-slate-200 font-medium">Dashboard saved</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Custom Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────
const KPI_CATEGORIES = ['KPI']
const CHART_CATEGORIES = ['Trend', 'Distribution', 'Relationship']

export default function CustomDashboard({ selectedTime, setActive }) {
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [showPicker, setShowPicker] = useState(false)
  const [saveVisible, setSaveVisible] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)

  const addedKeys = widgets.map(w => w.key)
  const kpiWidgets = widgets.filter(w => {
    const cat = WIDGET_CATALOGUE.find(c => c.key === w.key)?.category
    return KPI_CATEGORIES.includes(cat)
  })
  const chartWidgets = widgets.filter(w => {
    const cat = WIDGET_CATALOGUE.find(c => c.key === w.key)?.category
    return CHART_CATEGORIES.includes(cat)
  })

  const handleAdd = (cat) => {
    setWidgets(prev => [...prev, { key: cat.key, vizType: cat.defaultVisualization }])
    setHasUnsaved(true)
  }
  const handleRemove = (key) => {
    setWidgets(prev => prev.filter(w => w.key !== key))
    setHasUnsaved(true)
  }
  const handleVizChange = (key, newViz) => {
    setWidgets(prev => prev.map(w => w.key === key ? { ...w, vizType: newViz } : w))
    setHasUnsaved(true)
  }
  const handleResize = (key, newSpan) => {
    setWidgets(prev => prev.map(w => w.key === key ? { ...w, colSpan: newSpan } : w))
    setHasUnsaved(true)
  }
  const handleSave = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)) } catch { }
    setHasUnsaved(false)
    setSaveVisible(true)
    setTimeout(() => setSaveVisible(false), 2500)
  }
  const handleReset = () => {
    setWidgets([])
    localStorage.removeItem(STORAGE_KEY)
    setHasUnsaved(false)
  }

  return (
    <PageShell section="Analytics" title="Custom Dashboard" subtitle="Build and manage a personalized security analytics dashboard with configurable KPIs and visualizations" selectedTime={selectedTime} isLoading={false} isError={false} isPartial={false} lastUpdated={null} onRefresh={() => { }}>
      <div
        className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      // style={{
      //   background: `linear-gradient(#141B21 1px,transparent 1px),linear-gradient(90deg,#141B21 1px,transparent 1px),#0B0F12`,
      //   backgroundSize: '40px 40px',
      // }}
      >
        <div className="flex flex-col gap-4 px-3 sm:px-4 lg:px-5 pt-4 pb-6 max-w-7xl mx-auto w-full">

          {/* ── Page header ──────────────────────────────────────── */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9.5px] font-semibold text-htb-green uppercase tracking-wider mb-1">Analytics</p>
              <h1 className="text-[18px] font-bold text-white leading-tight">Custom Dashboard</h1>
              <p className="text-[9.5px] text-slate-400 mt-1">
                Build and monitor a personalized security operations view
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {/* Save with unsaved indicator */}
              {hasUnsaved && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-htb-green/40 bg-htb-green/10 text-htb-green text-[9.5px] font-semibold hover:bg-htb-green/20 transition-all"
                >
                  <MdSave size={12} /> Save
                  <span className="w-1.5 h-1.5 rounded-full bg-htb-green animate-pulse ml-0.5" />
                </motion.button>
              )}

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-white/[0.05] bg-black/5 text-slate-400 text-[9.5px] font-medium hover:text-white hover:border-white/[0.12] transition-all"
              >
                <MdRestartAlt size={12} /> Reset
              </button>

              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-htb-green text-[#0B0F12] text-[9.5px] font-bold hover:brightness-110 transition-all"
              // style={{ boxShadow: '0 0 14px rgba(57,255,106,0.2)' }}
              >
                <MdAdd size={14} /> Add Widget
              </button>
            </div>
          </div>

          {/* ── Toolbar ──────────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-white/[0.05] bg-black/5 backdrop-blur-[1px]">
            <RiLayoutGridLine size={13} className="text-slate-400" />
            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mr-2">Layout</span>
            <div className="w-px h-4 bg-white/[0.05]" />
            <div className="flex items-center gap-1.5 ml-2 text-[9.5px] text-slate-400">
              <span className="text-slate-200">{widgets.length}</span> widget{widgets.length !== 1 ? 's' : ''}
              {kpiWidgets.length > 0 && <> · <span className="text-slate-200">{kpiWidgets.length}</span> KPI</>}
              {chartWidgets.length > 0 && <> · <span className="text-slate-200">{chartWidgets.length}</span> chart{chartWidgets.length !== 1 ? 's' : ''}</>}
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-[9.5px] text-slate-400">
              <MdSchedule size={11} />
              <span>{selectedTime}</span>
            </div>
          </div>

          {/* ── Empty State ──────────────────────────────────────── */}
          {widgets.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center py-8"
            >
              <div
                className="flex flex-col items-center gap-4 px-6 py-8 rounded-[10px] bg-black/5 backdrop-blur-[1px] border border-dashed border-white/[0.05] max-w-md w-full"

              >
                <div className="w-14 h-14 rounded-[12px] bg-black/5 border border-white/[0.05] flex items-center justify-center">
                  <MdDashboard size={24} className="text-[#374151]" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-slate-200">No widgets configured</p>
                  <p className="text-[9.5px] text-slate-400 mt-1.5 leading-relaxed max-w-[240px]">
                    Build your security view by adding KPIs, trends, distributions, or relationships.
                  </p>
                </div>
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-htb-green text-[#0B0F12] text-[9.5px] font-bold hover:brightness-110 transition-all"
                // style={{ boxShadow: '0 0 14px rgba(57,255,106,0.2)' }}
                >
                  <MdAdd size={14} /> Add Widget
                </button>
                <p className="text-[9.5px] text-slate-400 text-center">
                  Your layout is saved automatically and persists across sessions.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── KPI Grid (4-col) ─────────────────────────────────── */}
          {kpiWidgets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">KPI Metrics</span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">
                  {kpiWidgets.map(w => (
                    <KpiWidgetCard
                      key={w.key}
                      widgetId={w.key}
                      vizType={w.vizType}
                      selectedTime={selectedTime}
                      onRemove={handleRemove}
                      onVizChange={handleVizChange}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ── Chart Grid (2-col) ───────────────────────────────── */}
          {chartWidgets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Charts & Visualizations</span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {chartWidgets.map(w => (
                    <ChartWidgetCard
                      key={w.key}
                      widgetId={w.key}
                      vizType={w.vizType}
                      colSpan={w.colSpan}
                      selectedTime={selectedTime}
                      onRemove={handleRemove}
                      onVizChange={handleVizChange}
                      onResize={handleResize}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* ── Widget Picker Modal ───────────────────────────────────── */}
        <AnimatePresence>
          {showPicker && (
            <WidgetPickerModal
              addedKeys={addedKeys}
              onAdd={(cat) => { handleAdd(cat); setShowPicker(false) }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </AnimatePresence>

        <SaveToast visible={saveVisible} />
      </div>
    </PageShell>
  )
}
