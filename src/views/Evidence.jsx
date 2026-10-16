import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  MdRefresh, MdWarningAmber, MdDownload, MdSearch, MdFilterList,
  MdOutlineRemoveRedEye, MdError, MdCheckCircleOutline, MdOutlineTimer,
  MdHourglassEmpty,
} from 'react-icons/md'
import {
  BiArchive, BiNetworkChart, BiLink, BiBug, BiShieldQuarter
} from 'react-icons/bi'
import PageShell from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import DetailTable from '../components/DetailTable'
import { evidenceKpis } from '../data/threatOpsEvidenceKpis'
import {
  fetchEvidenceSummary,
  fetchEvidenceTrends,
  fetchEvidenceSources,
  fetchEvidenceRecords,
} from '../api/evidenceApi'

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const TT_STYLE = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '11px',

}

const DATE_RANGES = ['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days']
const SOURCE_OPTIONS = ['All Sources', 'Endpoint', 'Network', 'Email', 'Cloud', 'Identity', 'Other']
const TYPE_OPTIONS = ['All Types', 'File', 'PCAP', 'Log', 'Email', 'Memory Dump', 'Registry']
const SEV_OPTIONS = ['All Severity', 'Critical', 'High', 'Medium', 'Low']

const SEV_CLASSES = {
  Critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  High: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// Skeleton shimmer strip
function Skeleton({ className = '' }) {
  return (
    <div
      className={`rounded bg-white/5 ${className}`}
      style={{
        background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  )
}

// Simple select control styled for the dark theme
function FilterSelect({ label, value, options, onChange, width = 'w-36' }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[9.5px] text-slate-400 font-semibold uppercase tracking-wider pl-1">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`${width} bg-black/5 backdrop-blur-[1px] border-white/[0.05] text-slate-200 text-[9.5px] rounded-[6px] px-2.5 py-1.5 outline-none appearance-none pr-7 focus:border-cyan-500/40 transition-colors cursor-pointer`}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▾</div>
      </div>
    </div>
  )
}

// Stale data banner
function StaleBanner({ lastUpdated, onRefresh }) {
  if (!lastUpdated) return null
  const minutesAgo = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000)
  const isStale = minutesAgo >= 2
  if (!isStale) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex items-center gap-3 bg-black/5 border border-cyan-500/20 rounded-[10px] px-3 py-2"
    >
      <MdOutlineTimer className="text-cyan-400 flex-shrink-0" size={14} />
      <span className="text-[11px] text-slate-300 flex-1">
        Data last updated {minutesAgo} minute{minutesAgo !== 1 ? 's' : ''} ago
      </span>
      <button onClick={onRefresh} className="text-[9.5px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
        Refresh ↻
      </button>
    </motion.div>
  )
}

// Partial data banner
function PartialBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex items-center gap-3 bg-black/5 border border-amber-500/20 rounded-[10px] px-3 py-2"
    >
      <MdWarningAmber className="text-amber-400 flex-shrink-0" size={14} />
      <span className="text-[11px] text-amber-200/90">
        Some evidence data is unavailable. Partial results are shown.
      </span>
    </motion.div>
  )
}

// Section error state
function SectionError({ onRetry, label = 'evidence data' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 bg-black/5 border border-white/[0.05] rounded-[10px]">
      <MdError className="text-rose-400/80" size={24} />
      <p className="text-[11.5px] text-slate-300 font-semibold">Unable to load {label}</p>
      <button
        onClick={onRetry}
        className="px-3 py-1 rounded-[6px] bg-black/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-[9.5px] font-medium transition-all"
      >
        Retry
      </button>
    </div>
  )
}

// Section empty state
function SectionEmpty({ message = 'No evidence data for the selected filters.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 bg-black/5 border border-white/[0.05] rounded-[10px]">
      <MdHourglassEmpty className="text-slate-500" size={24} />
      <p className="text-[11.5px] text-slate-300 font-semibold">No data available</p>
      <p className="text-[10px] text-slate-400">{message}</p>
    </div>
  )
}

// Custom donut centre label
function DonutCenterLabel({ cx, cy, total }) {
  return (
    <g>
      <text x={cx} y={cy - 5} textAnchor="middle" fill="#ffffff" fontSize={16} fontWeight={700}>
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="#94a3b8" fontSize={8.5} fontWeight={600} letterSpacing={1.2}>
        TOTAL
      </text>
    </g>
  )
}

// Evidence source legend row
function LegendRow({ item, onFilter }) {
  const total = item._total || 1
  const pct = ((item.count / total) * 100).toFixed(1)
  return (
    <tr
      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer text-[9.5px]"
      onClick={() => onFilter(item.source)}
    >
      <td className="py-1.5 px-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-slate-300">{item.source}</span>
        </div>
      </td>
      <td className="py-1.5 px-2.5 text-right text-slate-300 font-mono">{item.count.toLocaleString()}</td>
      <td className="py-1.5 px-2.5 text-right text-slate-400 font-mono">{pct}%</td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Evidence({ selectedTime, setActive }) {
  // ── Filters ───────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState(selectedTime || 'Last 7 Days')
  const [source, setSource] = useState('All Sources')
  const [evidenceType, setType] = useState('All Types')
  const [severity, setSeverity] = useState('All Severity')

  // ── Data state ────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState(null)
  const [sources, setSources] = useState(null)
  const [records, setRecords] = useState(null)

  const [loadSummary, setLoadSummary] = useState(true)
  const [loadTrends, setLoadTrends] = useState(true)
  const [loadSources, setLoadSources] = useState(true)
  const [loadRecords, setLoadRecords] = useState(true)

  const [errSummary, setErrSummary] = useState(false)
  const [errTrends, setErrTrends] = useState(false)
  const [errSources, setErrSources] = useState(false)
  const [errRecords, setErrRecords] = useState(false)

  const lastFetchRef = useRef(null)

  // ── Derived filters object ─────────────────────────────────────────────────
  const filters = { timeLabel: dateRange, source, evidenceType, severity }

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    lastFetchRef.current = new Date().toISOString()

    setLoadSummary(true); setLoadTrends(true); setLoadSources(true); setLoadRecords(true)
    setErrSummary(false); setErrTrends(false); setErrSources(false); setErrRecords(false)

    const [sumRes, trendRes, srcRes, recRes] = await Promise.allSettled([
      fetchEvidenceSummary(filters),
      fetchEvidenceTrends(filters),
      fetchEvidenceSources(filters),
      fetchEvidenceRecords(filters),
    ])

    if (sumRes.status === 'fulfilled' && sumRes.value.status !== 'error') {
      setSummary(sumRes.value.data)
    } else { setErrSummary(true) }
    setLoadSummary(false)

    if (trendRes.status === 'fulfilled' && trendRes.value.status !== 'error') {
      setTrends(trendRes.value.data)
    } else { setErrTrends(true) }
    setLoadTrends(false)

    if (srcRes.status === 'fulfilled' && srcRes.value.status !== 'error') {
      const data = srcRes.value.data
      const total = data.reduce((s, d) => s + d.count, 0)
      setSources(data.map(d => ({ ...d, _total: total })))
    } else { setErrSources(true) }
    setLoadSources(false)

    if (recRes.status === 'fulfilled' && recRes.value.status !== 'error') {
      setRecords(recRes.value.data)
    } else { setErrRecords(true) }
    setLoadRecords(false)
  }, [dateRange, source, evidenceType, severity]) // eslint-disable-line

  useEffect(() => { loadAllData() }, [loadAllData])

  useEffect(() => {
    if (selectedTime && selectedTime !== dateRange) setDateRange(selectedTime)
  }, [selectedTime]) // eslint-disable-line

  const handleSourceFilter = useCallback((src) => {
    setSource(prev => prev === src ? 'All Sources' : src)
  }, [])

  // ── Table column config ────────────────────────────────────────────────────
  const evidenceCols = [
    {
      header: 'Evidence ID', accessor: 'id',
      render: (v) => (
        <span className="text-cyan-400 font-mono text-[10px] hover:underline cursor-pointer font-medium">{v}</span>
      )
    },
    { header: 'Evidence Name', accessor: 'name', render: (v) => <span className="font-mono text-[10px] text-slate-200">{v}</span> },
    { header: 'Source', accessor: 'source', render: (v) => <span className="text-slate-300">{v}</span> },
    { header: 'Type', accessor: 'type', render: (v) => <span className="text-slate-400">{v}</span> },
    {
      header: 'Linked Incident', accessor: 'linkedIncident',
      render: (v) => v
        ? <span className="text-cyan-400 font-mono text-[10px] hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); setActive('active_incidents') }}>{v}</span>
        : <span className="text-slate-600">—</span>
    },
    {
      header: 'Severity', accessor: 'severity',
      render: (v) => (
        <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${SEV_CLASSES[v] || ''}`}>{v}</span>
      )
    },
    { header: 'Collected At', accessor: 'collectedAt', render: (v) => <span className="text-[10px] font-mono text-slate-400">{v}</span> },
    {
      header: 'Actions', accessor: 'id',
      render: () => (
        <button className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10">
          <MdOutlineRemoveRedEye size={13} />
        </button>
      )
    },
  ]

  const isPartial = !loadSummary && !errSummary && summary &&
    (summary.evidenceItems === undefined || summary.completeness === undefined)

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageShell section="Investigation" title="Evidence" subtitle="Overview of evidence collection and quality." selectedTime={dateRange} isLoading={loadSummary || loadTrends || loadSources || loadRecords} isError={errSummary || errTrends || errSources || errRecords} isPartial={isPartial} lastUpdated={summary?.lastUpdated} onRefresh={loadAllData}>

      <div className="flex flex-col gap-3">

        {/* ── TOP FILTERS ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end gap-3 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 transition-all duration-200 hover:border-white/[0.12]">
          <FilterSelect label="Date Range" value={dateRange} options={DATE_RANGES} onChange={setDateRange} width="w-36" />
          <FilterSelect label="Source" value={source} options={SOURCE_OPTIONS} onChange={setSource} width="w-32" />
          <FilterSelect label="Evidence Type" value={evidenceType} options={TYPE_OPTIONS} onChange={setType} width="w-32" />
          <FilterSelect label="Severity" value={severity} options={SEV_OPTIONS} onChange={setSeverity} width="w-32" />
        </div>

        {/* ── BANNERS ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {isPartial && <PartialBanner />}
          {!loadSummary && summary?.isStale && (
            <StaleBanner lastUpdated={summary.lastUpdated} onRefresh={loadAllData} />
          )}
        </AnimatePresence>

        {/* ── KPI GRID ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {evidenceKpis.map(config => {
            let kpiValue, kpiTrend, kpiLabel, kpiSparkline, subtext

            if (config.key === 'evidenceItems') {
              kpiValue = summary?.evidenceItems
              kpiTrend = summary?.evidenceItemsTrend
              kpiSparkline = summary?.sparklines?.evidenceItems
            } else if (config.key === 'evidenceSources') {
              kpiValue = summary?.evidenceSources
              kpiTrend = summary?.sourcesTrend
              kpiSparkline = summary?.sparklines?.evidenceSources
            } else if (config.key === 'linkedToIncidents') {
              kpiValue = summary?.evidenceLinkedToIncidents
              kpiTrend = summary?.linkedToIncidentsTrend
              kpiSparkline = summary?.sparklines?.evidenceLinkedToIncidents
            } else if (config.key === 'criticalEvidence') {
              kpiValue = summary?.criticalEvidence
              kpiTrend = summary?.criticalTrend
              kpiSparkline = summary?.sparklines?.criticalEvidence
            } else if (config.key === 'completeness') {
              kpiValue = summary?.completeness
              kpiLabel = summary?.completenessStatus || ''
              subtext = summary?.completenessTrend ? `↑ ${summary.completenessTrend.value} vs prev period` : null
            }

            return (

              <OverviewMetricCard
                key={config.key}
                title={config.title}
                value={kpiValue}
                trend={kpiTrend}
                label={kpiLabel}
                subtext={subtext}
                sparklineData={kpiSparkline}
                type={config.visualization}
                color={config.color}
              />
            )
          })}
        </div>

        {/* ── CHARTS ROW (Reduced Height approx half) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch">

          {/* Evidence Over Time — spans 3 of 5 */}
          <div className="lg:col-span-3 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[210px] transition-all duration-200 hover:border-white/[0.12]">
            <div className="flex justify-between items-center mb-1">
              <div>
                <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Evidence Over Time</h2>
              </div>
            </div>

            {loadTrends ? (
              <div className="flex-1 flex flex-col gap-2 pt-2">
                <Skeleton className="h-full w-full min-h-[140px]" />
              </div>
            ) : errTrends ? (
              <SectionError onRetry={loadAllData} label="trend data" />
            ) : trends?.length === 0 ? (
              <SectionEmpty />
            ) : (
              <div className="flex-1 min-h-[140px] mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="evdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={9.5} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={9.5} tickLine={false} axisLine={false} />
                    <RTooltip
                      contentStyle={TT_STYLE}
                      formatter={(v) => [v.toLocaleString(), 'Evidence Items']}
                    />
                    <Area
                      type="monotone" dataKey="count" stroke="#ef4444" fill="url(#evdGrad)"
                      strokeWidth={2} dot={false}
                      activeDot={{ r: 4, fill: '#ef4444' }} name="Evidence Items"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Evidence by Source — spans 2 of 5 */}
          <div className="lg:col-span-2 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[210px] transition-all duration-200 hover:border-white/[0.12]">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Evidence by Source</h2>
            </div>

            {loadSources ? (
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-[100px] w-[100px] rounded-full mx-auto" />
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-3 w-full" />)}
              </div>
            ) : errSources ? (
              <SectionError onRetry={loadAllData} label="source data" />
            ) : !sources?.length ? (
              <SectionEmpty />
            ) : (
              <div className="flex-1 flex gap-2 items-center">
                {/* Donut */}
                <div className="w-[110px] h-[130px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sources}
                        cx="50%" cy="50%"
                        innerRadius={36} outerRadius={52}
                        dataKey="count" nameKey="source"
                        stroke="none"
                        onClick={(entry) => handleSourceFilter(entry.source)}
                        style={{ cursor: 'pointer' }}
                      >
                        {sources.map((entry) => (
                          <Cell
                            key={entry.source}
                            fill={entry.color}
                            opacity={source === 'All Sources' || source === entry.source ? 1 : 0.3}
                          />
                        ))}
                      </Pie>
                      <DonutCenterLabel
                        cx="50%" cy="50%"
                        total={sources.reduce((s, d) => s + d.count, 0)}
                      />
                      <RTooltip
                        contentStyle={TT_STYLE}
                        labelStyle={{ color: '#f3f4f6' }}
                        itemStyle={{ color: '#f3f4f6' }}
                        formatter={(v, name) => [v.toLocaleString(), name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend table */}
                <div className="flex-1 overflow-auto max-h-[130px] custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        <th className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Source</th>
                        <th className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 text-right">Items</th>
                        <th className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map(item => (
                        <LegendRow key={item.source} item={item} onFilter={handleSourceFilter} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RECENT EVIDENCE TABLE (Reduced Padding/Height) ─────────────── */}
        <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&>div]:!bg-transparent [&>div]:!border-0 [&>div]:!rounded-none [&>div]:!mt-0 [&>div]:!min-h-0 [&_table]:w-full [&_thead_tr]:!bg-black/10 [&_th]:!bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-2 [&_th]:py-2.5 [&_td]:px-3 [&_th]:px-3 text-[9.5px] transition-all duration-200 hover:border-white/[0.12]">
          {loadRecords ? (
            <div className="p-4">
              <Skeleton className="h-4 w-40 mb-3" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 mb-2.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-36 flex-1" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          ) : errRecords ? (
            <SectionError onRetry={loadAllData} label="evidence records" />
          ) : (
            <DetailTable
              title="Recent Evidence"
              description={`Showing evidence records for ${dateRange.toLowerCase()}`}
              columns={evidenceCols}
              data={records || []}
              searchable={true}
              searchPlaceholder="Search evidence..."
            />
          )}
        </div>

        {/* ── STATE LEGEND (bottom status bar) ─────────────────────────── */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1">
          {[
            { icon: <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />, label: 'Loading' },
            { icon: <MdHourglassEmpty size={13} className="text-slate-500" />, label: 'No data available' },
            { icon: <MdError size={13} className="text-rose-400" />, label: 'Error loading data' },
            { icon: <MdWarningAmber size={13} className="text-amber-400" />, label: 'Partial data' },
            { icon: <MdOutlineTimer size={13} className="text-cyan-400" />, label: 'Stale data' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[9.5px] text-slate-400">
              {icon}
              <span>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </PageShell>
  )
}