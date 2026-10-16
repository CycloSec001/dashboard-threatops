import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdErrorOutline, MdMinimize, MdCropSquare } from 'react-icons/md'
import { PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip as RechTooltip } from 'recharts'
import { customTooltip } from '../utils/mockData'
import KpiExpandModal from './KpiExpandModal'
import { CHART_SIZES } from '../utils/chartSizes'

// ── Skeleton shimmer strip ──────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div
      className={`rounded bg-white/5 animate-pulse ${className}`}
      style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
    />
  )
}

// ── Gauge (half-arc) ─────────────────────────────────────────────────────────
function GaugeViz({ value, color, thresholds }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0))
  const data = [{ name: 'Value', v: pct }, { name: 'Remaining', v: 100 - pct }]
  
  const renderThresholds = () => {
    if (!thresholds || !Array.isArray(thresholds)) return null
    return thresholds.map((t, i) => {
      const angle = 180 - (t.value / 100) * 180
      const rad = (angle * Math.PI) / 180
      const cx = 55
      const cy = 52
      const rInner = 28
      const rOuter = 38
      const x1 = cx + rInner * Math.cos(rad)
      const y1 = cy - rInner * Math.sin(rad)
      const x2 = cx + rOuter * Math.cos(rad)
      const y2 = cy - rOuter * Math.sin(rad)
      return (
        <line 
          key={i} 
          x1={x1} y1={y1} x2={x2} y2={y2} 
          stroke={t.color || '#fff'} 
          strokeWidth="2" 
          opacity="0.8"
        />
      )
    })
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 my-auto overflow-hidden">
      <div className="relative flex items-center justify-center" style={{ width: 110, height: 48 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={28}
              outerRadius={38}
              dataKey="v"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={color} />
              <Cell fill="rgba(255, 255, 255, 0.05)" />
            </Pie>
            <RechTooltip contentStyle={customTooltip} formatter={(v, name) => [`${v}%`, name]} />
          </PieChart>
        </ResponsiveContainer>
        {thresholds && (
          <svg className="absolute inset-0 pointer-events-none" width="110" height="48">
            {renderThresholds()}
          </svg>
        )}
        <div
          className="absolute font-bold text-white pointer-events-none text-center"
          style={{ bottom: -2, left: '50%', transform: 'translateX(-50%)', fontSize: 13, lineHeight: 1 }}
        >
          {pct}%
        </div>
      </div>
    </div>
  )
}

// ── Mini Chart ──────────────────────────────────────────────────────────────
function MiniChartViz({ value, sparklineData, color, type }) {
  const safe = Array.isArray(sparklineData) && sparklineData.length > 1
    ? sparklineData
    : [value, value, value, value, value].map(v => v || 0)
  const chartData = safe.map((v, i) => ({ i, v }))

  const cleanColor = (color || '#39FF6A').replace('#', '')

  return (
    <div className="relative flex items-center justify-between flex-1 h-full w-full gap-2 mt-0.5">
      <div className="flex flex-col justify-center min-w-0 flex-shrink-0">
        <span className="text-[17px] font-bold tracking-tight text-white leading-none font-sans whitespace-nowrap">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      <div className="flex-1 min-w-[40px] max-w-[70px] h-[32px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          ) : type === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id={`grad-${cleanColor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} fillOpacity={1} fill={`url(#grad-${cleanColor})`} strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Main Card ─────────────────────────────────────────────────────────────────
export default function OverviewMetricCard({
  config,
  title,
  value,
  label,
  subtext,
  sparklineData = [],
  isLoading,
  isError,
  isEmpty,
  onClick,
  trend,
  type,
  visualization,
  color,
  thresholds,
  id,
  selectedTime = 'Last 24 Hours',
}) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  const pageConfig = config || {}
  const resolvedTitle = title || pageConfig.title || 'Metric'
  const resolvedVisualization = type || visualization || pageConfig.visualization || 'mini-line'
  const resolvedColor = color || pageConfig.color || '#39FF6A'
  const resolvedValue = value ?? pageConfig.value ?? 0
  const resolvedLabel = label || pageConfig.label || ''
  const resolvedSubtext = subtext || pageConfig.subtext || ''
  const resolvedThresholds = thresholds || pageConfig.thresholds
  const resolvedId = id || pageConfig.id || pageConfig.key || 'generic'
  const resolvedSparklineData = Array.isArray(sparklineData) && sparklineData.length ? sparklineData : pageConfig.sparklineData || []

  const kpiData = {
    id: resolvedId,
    title: resolvedTitle,
    value: resolvedValue,
    subtext: resolvedSubtext,
    label: resolvedLabel,
    trend: typeof trend === 'object' ? `${trend.direction === 'up' ? '+' : '-'}${trend.percentage}%` : (trend || ''),
    color: resolvedColor
  }

  const base = (content, headerContent = null) => (
    <>
      <AnimatePresence>
        {isMaximized && (
          <KpiExpandModal
            kpi={kpiData}
            timeRange={selectedTime}
            onClose={() => setIsMaximized(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        onClick={onClick}
        whileHover={{ borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
        transition={{ duration: 0.15 }}
        className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] relative flex flex-col text-left rounded-[10px] overflow-hidden group cursor-pointer p-2.5"
        style={{ height: isMinimized ? 'auto' : '82px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full relative z-10 min-w-0">
          {headerContent ? (
            headerContent
          ) : (
            <span 
              className="text-[10.5px] font-medium text-slate-300 uppercase tracking-wider leading-tight truncate"
              style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              title={resolvedTitle}
            >
              {resolvedTitle}
            </span>
          )}

          {!isLoading && !isError && (
            <div className="flex items-center gap-0.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(v => !v) }}
                className="hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <MdMinimize size={11} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMaximized(true) }}
                className="hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
                title="Expand full view"
              >
                <MdCropSquare size={11} />
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden relative z-10 justify-center"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )

  if (isLoading) {
    return base(
      <>
        <Skeleton className="h-[9px] w-20 mb-1.5" />
        <Skeleton className="h-5 w-12" />
      </>,
      <Skeleton className="h-[9px] w-20" />
    )
  }

  if (isError) {
    return (
      <div className="bg-black/5 backdrop-blur-[1px] border border-rose-500/20 relative flex flex-col h-full rounded-[10px] overflow-hidden p-2.5">
        <span className="text-[10.5px] font-medium text-slate-300 uppercase tracking-wider mb-1 z-10 relative truncate">{title}</span>
        <div className="flex-1 flex flex-col items-center justify-center gap-0.5 text-rose-400/90 z-10 relative">
          <MdErrorOutline size={14} />
          <span className="text-[9px]">Failed</span>
        </div>
      </div>
    )
  }

  if (isEmpty || value === undefined || value === null) {
    return base(
      <div className="flex-1 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-500">—</span>
      </div>
    )
  }

  let innerContent = null;
  if (resolvedVisualization === 'gauge') {
    innerContent = <GaugeViz value={resolvedValue} color={resolvedColor} thresholds={resolvedThresholds} />
  } else if (resolvedVisualization === 'mini-area') {
    innerContent = <MiniChartViz value={resolvedValue} sparklineData={resolvedSparklineData} color={resolvedColor} type="area" />
  } else if (resolvedVisualization === 'mini-bar') {
    innerContent = <MiniChartViz value={resolvedValue} sparklineData={resolvedSparklineData} color={resolvedColor} type="bar" />
  } else if (resolvedVisualization === 'mini-line') {
    innerContent = <MiniChartViz value={resolvedValue} sparklineData={resolvedSparklineData} color={resolvedColor} type="line" />
  } else if (resolvedVisualization === 'rag-indicator') {
    innerContent = (
      <div className="flex-1 flex items-center justify-start gap-2.5 my-auto">
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center border-2"
          style={{ 
            borderColor: resolvedColor, 
            backgroundColor: `${resolvedColor}15`,
          }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: resolvedColor }} />
        </div>
        <span className="text-[16px] font-bold text-white leading-none capitalize">
          {resolvedValue}
        </span>
      </div>
    )
  } else {
    innerContent = (
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[18px] font-bold text-white leading-none whitespace-nowrap font-sans">
            {typeof resolvedValue === 'number' ? resolvedValue.toLocaleString() : resolvedValue}
          </span>
          {resolvedLabel && <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider truncate">{resolvedLabel}</span>}
        </div>
        {trend && (
          <span className="text-[9.5px] font-semibold text-emerald-400 mt-0.5">
            {typeof trend === 'object' ? `${trend.direction === 'up' ? '▲' : '▼'} ${trend.value || ''}` : trend}
          </span>
        )}
      </div>
    )
  }

  return base(innerContent)
}