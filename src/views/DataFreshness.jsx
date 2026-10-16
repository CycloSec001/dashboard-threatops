import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  MdRefresh, MdSearch, MdFilterList, MdOutlineVisibility, MdClose, MdErrorOutline,
  MdCheckCircle, MdWarningAmber, MdTimer, MdSensors, MdInfo, MdCancel, MdCloudOff
} from 'react-icons/md'
import PageShell, { ActSection } from '../components/PageShell'
import { KpiBigNumber } from '../components/KpiCards'
import DetailTable from '../components/DetailTable'

// ── Shared styles ──────────────────────────────────────────────────────────────
const TT = {
  contentStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '11px',
    padding: '6px 10px',
  },
  labelStyle: {
    color: '#f3f4f6',
  },
  itemStyle: {
    color: '#f3f4f6',
  },
}

// ── Badges ─────────────────────────────────────────────────────────────────────
function StatusBadge({ val }) {
  const map = {
    'Healthy': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Available': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Success': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Stale': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Degraded': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Offline': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Failed': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Configured': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Unknown': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${map[val] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
      {val}
    </span>
  )
}

// ── Filter select ──────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9.5px] text-slate-400 font-semibold uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] text-white rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-white/[0.12] appearance-none cursor-pointer transition-colors"
        style={{ minWidth: 110 }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ── Gauge Chart ────────────────────────────────────────────────────────────────
function AvailabilityGauge({ available, total }) {
  const percent = total > 0 ? (available / total) * 100 : 0
  const color =
    percent >= 95 ? '#22c55e' :
      percent >= 80 ? '#f59e0b' :
        '#ef4444'

  const data = [
    { name: 'Available', value: available, fill: color },
    { name: 'Unavailable', value: total - available, fill: '#1f2937' },
  ]

  return (
    <div className="relative w-full h-[220px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="72%"
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            cornerRadius={5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute left-0 right-0 top-[105px] flex flex-col items-center pointer-events-none">
        <span
          className="text-[26px] font-bold leading-none"
          style={{ color }}
        >
          {percent.toFixed(1)}%
        </span>

        <span className="text-[10px] text-slate-300 mt-2">
          {available} of {total} Sources
        </span>

        <span className="text-[9px] text-slate-500 mt-1">
          Target: 95%
        </span>
      </div>
    </div>
  )
}
// ── Last Event Timeline ────────────────────────────────────────────────────────
const TIMELINE_ICONS = {
  'Healthy': { icon: MdCheckCircle, color: '#22c55e' },
  'Stale': { icon: MdWarningAmber, color: '#f59e0b' },
  'Offline': { icon: MdCloudOff, color: '#ef4444' },
  'Degraded': { icon: MdWarningAmber, color: '#f59e0b' },
}

function LastEventTimeline({ events, onSelectEvent }) {
  return (
    <div className="relative border-l border-white/[0.05] ml-4 py-2">
      {events.map((ev, i) => {
        const meta = TIMELINE_ICONS[ev.status] || { icon: MdInfo, color: '#8b5cf6' }
        const Icon = meta.icon
        return (
          <div key={ev.id} className="relative pl-6 py-3 group cursor-pointer" onClick={() => onSelectEvent(ev)}>
            {/* Connector dot */}
            <div className="absolute left-[-9px] top-4 w-4 h-4 rounded-full flex items-center justify-center bg-black/5 border border-white/[0.05] group-hover:border-white/[0.12]  transition-colors">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
            </div>

            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 group-hover:border-white/[0.12] transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color: meta.color }} />
                  <span className="text-[11px] font-semibold text-slate-200">{ev.source}</span>
                  <span className={`text-[9.5px] font-bold uppercase tracking-wider border rounded-[4px] px-2 py-0.5 bg-opacity-10`}
                    style={{ color: meta.color, borderColor: `${meta.color}40`, backgroundColor: `${meta.color}15` }}>
                    {ev.status}
                  </span>
                </div>
                <span className="text-[9.5px] text-slate-400 font-mono">{ev.timestamp}</span>
              </div>
              <p className="text-[9.5px] text-slate-300 mb-2">{ev.eventType}</p>
              <div className="flex items-center gap-4 text-[9.5px] text-slate-400">
                <span>Age: <span className={ev.age.includes('ms') || ev.age.includes('sec') || ev.age.includes('min') ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>{ev.age}</span></span>
                <span>Processing: <span className={ev.processingStatus === 'Success' ? 'text-white' : 'text-[#ef4444]'}>{ev.processingStatus}</span></span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
function SourceDetailModal({ record, onClose }) {
  if (!record) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] w-full max-w-[700px] max-h-[85vh] flex flex-col">

          <div className="flex items-start justify-between p-3 pb-3 border-b border-white/[0.05] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-black/5 border border-white/[0.05] flex items-center justify-center">
                <MdSensors size={20} className="text-[#3b82f6]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                    {record.source || record.sourceName}
                  </h2>
                  {record.status && <StatusBadge val={record.status} />}
                </div>
                <p className="text-[9.5px] text-slate-400">DATA SOURCE RECORD</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-[6px] hover:bg-white/10 transition-colors">
              <MdClose size={18} />
            </button>
          </div>

          <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(record).map(([k, v]) => {
                if (['id', 'source', 'sourceName', 'status', 'errorInformation'].includes(k)) return null
                if (v === null || v === undefined || v === '') return null
                return (
                  <div
                    key={k}
                    className="bg-black/5 backdrop-blur-[1px] rounded-[10px] border border-white/[0.05] p-3"
                  >
                    <p className="text-[9.5px] text-slate-400 uppercase tracking-wider mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <div className="text-[9.5px] text-white font-bold truncate" title={v}>{v}</div>
                  </div>
                )
              })}
            </div>

            {record.errorInformation && (
              <div className="bg-black/5 backdrop-blur-[1px] rounded-[10px] border border-white/[0.05] border-l-4 border-l-[#ef4444] p-3">
                <p className="text-[9.5px] text-[#ef4444] uppercase tracking-wider mb-2 font-bold">Error Information</p>
                <div className="text-[13px] text-[#d1d5db] whitespace-pre-wrap leading-relaxed font-mono">{record.errorInformation}</div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Backend-ready data service ─────────────────────────────────────────────────
async function fetchDataFreshnessData(timeFilter) {
  return { kpis: {}, sources: [], unsupported: 'Data-freshness analytics are not exposed by the backend API.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, Math.random() * 500 + 400))
  const m = { 'Last 24 Hours': 1, 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90 }[timeFilter] || 1
  const j = (b, r = 0.1) => Math.max(0, Math.round(b * (1 - r + Math.random() * r * 2)))

  const configuredSources = 86
  const healthy = 79
  const stale = 5
  const offline = 2

  const kpis = {
    healthy: { value: healthy, trend: { value: '2', direction: 'up', color: 'green' } },
    stale: { value: stale, trend: { value: '1', direction: 'up', color: 'red' } },
    lag: { value: '45ms', trend: { value: '12ms', direction: 'down', color: 'green' } },
  }

  const availability = {
    configured: configuredSources,
    available: healthy + stale,
  }

  const tLabels = timeFilter === 'Last 7 Days' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : timeFilter === 'Last 30 Days' ? ['W1', 'W2', 'W3', 'W4']
      : timeFilter === 'Last 90 Days' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']

  const processingLagTrend = tLabels.map(t => ({
    t,
    lag: j(45, 0.3) + (Math.random() > 0.8 ? j(100, 0.2) : 0) // random spikes
  }))

  const lastEvents = [
    { id: 'LE-001', timestamp: 'May 26, 2025 15:45:12', source: 'AWS CloudTrail', eventType: 'AssumeRole', status: 'Healthy', age: '12ms', processingStatus: 'Success' },
    { id: 'LE-002', timestamp: 'May 26, 2025 15:45:09', source: 'CrowdStrike Falcon', eventType: 'ProcessExecution', status: 'Healthy', age: '150ms', processingStatus: 'Success' },
    { id: 'LE-003', timestamp: 'May 26, 2025 15:44:22', source: 'Okta System Logs', eventType: 'user.session.start', status: 'Healthy', age: '1.2s', processingStatus: 'Success' },
    { id: 'LE-004', timestamp: 'May 26, 2025 13:10:00', source: 'Palo Alto FW - NY', eventType: 'Traffic Log', status: 'Stale', age: '2h 35m', processingStatus: 'Success' },
    { id: 'LE-005', timestamp: 'May 25, 2025 09:00:00', source: 'Legacy AS400', eventType: 'System Audit', status: 'Offline', age: '1d 6h', processingStatus: 'Failed' },
  ]

  const sources = [
    { id: 'S-101', sourceName: 'AWS CloudTrail', sourceType: 'Cloud Service', status: 'Healthy', lastEvent: '12ms ago', eventLag: '12ms', processingLag: '5ms', eventsReceived: j(1450000 * m).toLocaleString(), availability: '100%', lastSuccessfulSync: 'Just now' },
    { id: 'S-102', sourceName: 'CrowdStrike Falcon', sourceType: 'EDR', status: 'Healthy', lastEvent: '150ms ago', eventLag: '150ms', processingLag: '10ms', eventsReceived: j(2850000 * m).toLocaleString(), availability: '100%', lastSuccessfulSync: 'Just now' },
    { id: 'S-103', sourceName: 'Okta System Logs', sourceType: 'Identity', status: 'Healthy', lastEvent: '1.2s ago', eventLag: '1.2s', processingLag: '8ms', eventsReceived: j(420000 * m).toLocaleString(), availability: '99.9%', lastSuccessfulSync: '1s ago' },
    { id: 'S-104', sourceName: 'Palo Alto FW - NY', sourceType: 'Network', status: 'Stale', lastEvent: '2h 35m ago', eventLag: '2h 35m', processingLag: '14ms', eventsReceived: j(8900000 * m).toLocaleString(), availability: '98.5%', lastSuccessfulSync: '2h 35m ago', errorInformation: 'Connection timeout while polling S3 bucket: bucket-fw-logs-ny.' },
    { id: 'S-105', sourceName: 'Legacy AS400', sourceType: 'Server', status: 'Offline', lastEvent: '1d 6h ago', eventLag: '1d 6h', processingLag: '—', eventsReceived: '0', availability: '0%', lastSuccessfulSync: 'Yesterday', errorInformation: 'Connection refused by remote host. Agent offline.' },
    { id: 'S-106', sourceName: 'Azure AD', sourceType: 'Identity', status: 'Healthy', lastEvent: '45s ago', eventLag: '45s', processingLag: '12ms', eventsReceived: j(560000 * m).toLocaleString(), availability: '100%', lastSuccessfulSync: '45s ago' },
    { id: 'S-107', sourceName: 'O365 Mail Logs', sourceType: 'SaaS', status: 'Degraded', lastEvent: '5m 12s ago', eventLag: '5m 12s', processingLag: '4m 30s', eventsReceived: j(125000 * m).toLocaleString(), availability: '100%', lastSuccessfulSync: '5m 12s ago', errorInformation: 'API throttling detected. Rate limit exceeded, backing off.' },
  ]

  return {
    kpis, availability, processingLagTrend, lastEvents, sources,
    _lastUpdated: new Date().toISOString()
  }
}

// ── Skeleton Components ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col min-h-[120px] animate-pulse">
      <div className="h-3 w-24 bg-white/5 rounded mb-3" />
      <div className="h-8 w-20 bg-white/5 rounded mb-2" />
      <div className="h-2 w-16 bg-white/5 rounded" />
    </div>
  )
}

function SkeletonTimeline() {
  return (
    <div className="border-l border-white/[0.05] ml-4 py-2 animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="pl-6 relative">
          <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-white/10" />
          <div className="h-4 w-48 bg-white/5 rounded mb-2" />
          <div className="h-3 w-64 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DataFreshness({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [selectedSource, setSelectedSource] = useState(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchDataFreshnessData(selectedTime)) }
    catch { setIsError(true) }
    finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { load() }, [load])

  const filteredSources = useMemo(() => {
    if (!data?.sources) return []
    return data.sources.filter(s => {
      if (statusFilter !== 'All' && s.status !== statusFilter) return false
      if (typeFilter !== 'All' && s.sourceType !== typeFilter) return false
      if (searchQuery && !`${s.sourceName} ${s.sourceType}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [data, statusFilter, typeFilter, searchQuery])

  // Table columns
  const sourceCols = [
    { accessor: 'sourceName', header: 'Source Name', render: v => <span className="font-bold text-[9.5px] text-white">{v}</span> },
    { accessor: 'sourceType', header: 'Source Type', render: v => <span className="text-[9.5px] text-slate-400">{v}</span> },
    { accessor: 'status', header: 'Status', render: v => <StatusBadge val={v} /> },
    { accessor: 'lastEvent', header: 'Last Event', render: v => <span className="font-mono text-[9.5px] text-slate-200">{v}</span> },
    { accessor: 'eventLag', header: 'Event Lag', render: v => <span className="font-mono text-[9.5px] text-amber-400">{v}</span> },
    { accessor: 'processingLag', header: 'Processing Lag', render: v => <span className="font-mono text-[9.5px] text-cyan-400">{v}</span> },
    { accessor: 'eventsReceived', header: 'Events Received', render: v => <span className="text-[9.5px] text-slate-300">{v}</span> },
    { accessor: 'availability', header: 'Availability', render: v => <span className="text-[9.5px] text-emerald-400">{v}</span> },
    {
      accessor: '_view', header: 'Actions', render: (_, row) => (
        <button onClick={e => { e.stopPropagation(); setSelectedSource(row) }} className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10">
          <MdOutlineVisibility size={14} />
        </button>
      )
    },
  ]

  const kpiState = isLoading ? 'loading' : isError ? 'error' : 'ready'
  const isLoadingNoData = isLoading && !data

  return (
    <PageShell section="Governance & Trust" title="Data Freshness" subtitle="Monitor source health, event availability and processing latency across the ThreatOps platform." selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>
      <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      // style={{ background: 'linear-gradient(#141B21 1px,transparent 1px),linear-gradient(90deg,#141B21 1px,transparent 1px),#0B0F12', backgroundSize: '40px 40px' }}//
      >
        <div className="flex flex-col gap-3 px-3 sm:px-4 lg:px-5 pt-4 pb-6">

          {/* ── Header ─────────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                Governance &amp; Trust · Data Freshness
              </p>
              <h1 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Data Freshness</h1>
              <p className="text-[9.5px] text-slate-400 mt-1">Monitor source health, event availability and processing latency across the ThreatOps platform.</p>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-shrink-0">
              {data?._lastUpdated && !isLoading && !isError && (
                <>
                  <div className="flex items-center gap-1.5 bg-black/5 border border-rose-500/20 px-2.5 py-1.5 rounded-[7px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                    <span className="text-[9.5px] text-rose-400">Stale Data</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400">Last updated: {new Date(data._lastUpdated).toLocaleTimeString()}</span>
                </>
              )}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all">
                <MdFilterList size={14} /> Filters
              </motion.button>
              <motion.button onClick={load} disabled={isLoading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold text-slate-400 hover:text-white hover:border-white/[0.12]">
                <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                  <MdRefresh size={13} />
                </motion.div>
                Refresh
              </motion.button>
            </div>
          </div>

          {/* ── Filters bar ────────────────────────────────────────────────────── */}
          <div
            id="freshness-filters"
            className="flex flex-wrap items-end justify-between bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 gap-3 transition-all hover:border-white/[0.12]"
          >
            <div className="flex flex-wrap gap-3">
              <FilterSelect label="Time Range" value={selectedTime} onChange={() => { }}
                options={[selectedTime, 'Custom Range...']} />
              <FilterSelect label="Freshness Status" value={statusFilter} onChange={setStatusFilter}
                options={['All', 'Healthy', 'Stale', 'Degraded', 'Offline']} />
              <FilterSelect label="Source Type" value={typeFilter} onChange={setTypeFilter}
                options={['All', 'Cloud Service', 'EDR', 'Identity', 'Network', 'Server', 'SaaS']} />
              <FilterSelect label="Environment" value={'All'} onChange={() => { }}
                options={['All', 'Production', 'Staging', 'Development']} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[6px] px-3 py-1.5 focus-within:border-white/[0.12] transition-colors w-full sm:w-auto" style={{ minWidth: 180 }}>
                <MdSearch size={15} className="text-[#6b7280] flex-shrink-0" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search sources..." className="bg-transparent text-[9.5px] text-white placeholder:text-slate-400 outline-none w-full" />
              </div>
              <button className="flex items-center gap-1.5 text-[9.5px] text-slate-400 hover:text-white transition-colors">
                <MdFilterList size={14} /> Advanced ▾
              </button>
            </div>
          </div>

          {/* ── Error ──────────────────────────────────────────────────────────── */}
          {isError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-8 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px]">
              <MdErrorOutline className="text-red-400/60" size={48} />
              <p className="text-[11px] font-semibold text-slate-200">Unable to load Data Freshness information</p>
              <button onClick={load} className="px-3 py-1.5 rounded-[6px] bg-black/5 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all text-[9.5px] font-medium">Retry</button>
            </motion.div>
          )}

          {!isError && (
            <div className="flex flex-col gap-3">

              {/* ── KPIs Row ───────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {isLoadingNoData ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  <>
                    <KpiBigNumber title="Healthy Sources" subtitle="meeting freshness target" icon={MdCheckCircle} iconColor="#22c55e" value={data?.kpis?.healthy?.value} trend={data?.kpis?.healthy?.trend} dataState={kpiState} />
                    <KpiBigNumber title="Stale Sources" subtitle="exceeding lag threshold" icon={MdWarningAmber} iconColor="#f59e0b" value={data?.kpis?.stale?.value} trend={data?.kpis?.stale?.trend} dataState={kpiState} />
                    <KpiBigNumber title="Event Lag (Avg)" subtitle="across active sources" icon={MdTimer} iconColor="#3b82f6" value={data?.kpis?.lag?.value} trend={data?.kpis?.lag?.trend} dataState={kpiState} />
                  </>
                )}
              </div>

              {/* ── Visualizations Row ─────────────────────────────────────────── */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px_450px] gap-3">

                {/* Processing Lag Chart */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[320px] hover:border-white/[0.12] transition-all">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Processing Lag</h3>
                    <span className="text-[9.5px] text-slate-400 bg-black/5 border border-white/[0.05] px-2 py-1 rounded-[5px]">Group By 1 Hour ▾</span>
                  </div>
                  {isLoadingNoData ? (
                    <div className="flex-1 flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={20} className="text-[#3b82f6]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={data?.processingLagTrend || []}
                          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="t" stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
                          <YAxis stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} />
                          <RTooltip contentStyle={TT.contentStyle} formatter={v => [`${v} ms`, 'Avg Lag']} />
                          <Line type="monotone" dataKey="lag" stroke="#3b82f6" strokeWidth={2} name="Processing Lag" dot={{ r: 3, fill: '#111827', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#3b82f6' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.05] flex-shrink-0">
                    <span className="w-3 h-0.5 bg-[#3b82f6] rounded" />
                    <span className="text-[9.5px] text-slate-400">Lag (milliseconds)</span>
                  </div>
                </div>

                {/* Source Availability Gauge */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[320px] hover:border-white/[0.12] transition-all">
                  <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2 flex-shrink-0">Source Availability</h3>
                  <p className="text-[9.5px] text-slate-400 mb-3 flex-shrink-0">Available vs Configured</p>
                  {isLoadingNoData ? (
                    <div className="flex-1 flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#22c55e]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center min-h-0">
                      <AvailabilityGauge available={data?.availability?.available ?? 0} total={data?.availability?.configured ?? 0} />
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t border-white/[0.05] flex-shrink-0 text-center">
                    <span className="text-[9.5px] text-cyan-400 cursor-pointer hover:text-white transition-colors">View availability metrics →</span>
                  </div>
                </div>

                {/* Last Event Timeline */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[320px] hover:border-white/[0.12] transition-all">
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Last Event</h3>
                    <span className="text-[9.5px] text-slate-400">Latest by Source ▾</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                    {isLoadingNoData ? (
                      <SkeletonTimeline />
                    ) : (
                      <LastEventTimeline events={data?.lastEvents || []} onSelectEvent={ev => setSelectedSource(ev)} />
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/[0.05] flex-shrink-0">
                    <span className="text-[9.5px] text-cyan-400 cursor-pointer hover:text-white transition-colors">View all events →</span>
                  </div>
                </div>

              </div>

              {/* ── Main Data Sources Table ────────────────────────────────────── */}
              <div
                className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&_thead_tr]:!bg-black/10 [&_th]:!bg-black/10 [&_td]:py-2 [&_th]:py-2.5 [&_td]:px-3 [&_th]:px-3 [&_tr:hover]:bg-white/[0.02] transition-all duration-200 hover:border-white/[0.12]">
                <DetailTable
                  title="Data Sources"
                  description="List of all configured data sources, health status and current ingestion lag."
                  columns={sourceCols}
                  data={filteredSources}
                  searchable={false}
                />
                {filteredSources.length === 0 && !isLoading && (
                  <div className="rounded-b-[10px] bg-black/5 backdrop-blur-[1px] border border-t-0 border-white/[0.05] px-3 py-4 text-center -mt-1">
                    <p className="text-[9.5px] text-slate-400">No data-source freshness information is available for the selected filters.</p>
                    <button onClick={() => { setStatusFilter('All'); setTypeFilter('All'); setSearchQuery('') }}
                      className="mt-2 text-[9.5px] text-cyan-400 hover:text-white transition-colors">Reset filters</button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
        {selectedSource && <SourceDetailModal record={selectedSource} onClose={() => setSelectedSource(null)} />}
      </div>
    </PageShell>
  )
}
