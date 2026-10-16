import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  MdRefresh, MdWarningAmber, MdSearch, MdFilterList,
  MdOutlineVisibility, MdClose, MdErrorOutline,
  MdArticle, MdManageAccounts, MdSecurity, MdPolicy,
  MdLogin, MdFileDownload, MdInfo
} from 'react-icons/md'
import PageShell, { ActSection } from '../components/PageShell'
import { KpiBigNumber } from '../components/KpiCards'
import DetailTable from '../components/DetailTable'

// ── Shared styles ──────────────────────────────────────────────────────────────
const TT = {
  contentStyle: {
    background: 'rgba(0,0,0,0.05)',
    backdropFilter: 'blur(1px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '10px',
    color: '#e8f0ea',
    fontSize: '9.5px',
  },
  cursor: { fill: 'rgba(255,255,255,0.02)' },

}

// ── Badges ─────────────────────────────────────────────────────────────────────
function OutcomeBadge({ val }) {
  const map = {
    'Success': 'bg-green-500/15 text-green-400 border-green-500/30',
    'Failure': 'bg-red-500/15 text-red-400 border-red-500/30',
    'Warning': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Info': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-[4px] border text-[10px] font-semibold ${map[val] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {val}
    </span>
  )
}

// ── Filter select ──────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] text-white rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-white/[0.12] appearance-none cursor-pointer"
        style={{ minWidth: 110 }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ── Donut Center Label ─────────────────────────────────────────────────────────
function DonutCenterLabel({ total }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-[20px] font-bold text-white">{total.toLocaleString()}</span>
      <span className="text-[9px] text-[#6b7280] uppercase tracking-wider">Total</span>
    </div>
  )
}

// ── Audit Detail Modal ─────────────────────────────────────────────────────────
function AuditDetailModal({ event, onClose }) {
  if (!event) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] w-full max-w-[660px] max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between p-3 pb-2 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-black/5 border border-white/[0.05] flex items-center justify-center">
                <MdInfo size={20} className="text-[#3b82f6]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">{event.eventType}</h2>
                  <OutcomeBadge val={event.outcome} />
                </div>
                <p className="text-[9.5px] text-slate-400">{event.id} · {event.timestamp}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[#6b7280] hover:text-white p-1 rounded-[6px] hover:bg-white/10 transition-colors">
              <MdClose size={18} />
            </button>
          </div>
          <div className="p-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Category', value: event.category },
                { label: 'User', value: event.user },
                { label: 'Resource / Entity', value: event.resource },
                { label: 'Action', value: event.actionType },
                { label: 'Source', value: event.source },
                { label: 'IP Address', value: event.ipAddress || '—', mono: true },
              ].map(f => (
                <div key={f.label} className="bg-black/5 backdrop-blur-[1px] rounded-[10px] border border-white/[0.05] p-3">
                  <p className="text-[9.5px] text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                  <div className={`text-[10px] text-white font-semibold ${f.mono ? 'font-mono text-[#a78bfa]' : ''}`}>{f.value}</div>
                </div>
              ))}
            </div>
            <div className="bg-black/5 backdrop-blur-[1px] rounded-[10px] border border-white/[0.05] p-3">
              <p className="text-[9.5px] text-slate-400 uppercase tracking-wider mb-1">
                Details
              </p>
              <div className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap">
                {event.details}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Backend-ready data service ─────────────────────────────────────────────────
async function fetchAuditData(timeFilter) {
  const unavailable = { value: null, trend: null }
  return {
    logs: [],
    records: [],
    kpis: {
      auditEvents: unavailable,
      adminActions: unavailable,
      security: unavailable,
      policy: unavailable,
      login: unavailable,
      export: unavailable,
    },
    categories: [],
    outcomes: [],
    topUsers: [],
    topResources: [],
    trend: [],
    unsupported: 'Audit data is available through the backend audit API; this legacy aggregate view is not exposed.',
    _lastUpdated: new Date().toISOString(),
  }
  await new Promise(r => setTimeout(r, Math.random() * 500 + 300))
  const m = { 'Last 24 Hours': 1, 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90 }[timeFilter] || 1
  const j = (b, r = 0.15) => Math.max(0, Math.round(b * m * (1 - r + Math.random() * r * 2)))

  const totalEvents = j(18742 / m)

  const kpis = {
    auditEvents: { value: totalEvents, trend: { value: '12.6%', direction: 'up', color: 'green' } },
    adminActions: { value: j(2845 / m), trend: { value: '8.3%', direction: 'up', color: 'green' } },
    security: { value: j(5673 / m), trend: { value: '15.1%', direction: 'up', color: 'green' } },
    policy: { value: j(1254 / m), trend: { value: '5.4%', direction: 'down', color: 'red' } },
    login: { value: j(6288 / m), trend: { value: '10.7%', direction: 'up', color: 'green' } },
    export: { value: j(687 / m), trend: { value: '3.7%', direction: 'down', color: 'red' } },
  }

  const tLabels = timeFilter === 'Last 7 Days' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : timeFilter === 'Last 30 Days' ? ['W1', 'W2', 'W3', 'W4']
      : timeFilter === 'Last 90 Days' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']

  const trend = tLabels.map(t => ({
    t,
    count: j(totalEvents / tLabels.length, 0.3)
  }))

  const categories = [
    { name: 'Administrative', value: kpis.adminActions.value, color: '#3b82f6' },
    { name: 'Security', value: kpis.security.value, color: '#22c55e' },
    { name: 'Authentication', value: kpis.login.value, color: '#8b5cf6' },
    { name: 'Policy', value: kpis.policy.value, color: '#f97316' },
    { name: 'Data Export', value: kpis.export.value, color: '#06b6d4' },
    { name: 'Other', value: j(995 / m), color: '#6b7280' },
  ].sort((a, b) => b.value - a.value)

  const outcomes = [
    { name: 'Success', value: j(totalEvents * 0.839), color: '#22c55e' },
    { name: 'Failure', value: j(totalEvents * 0.098), color: '#ef4444' },
    { name: 'Warning', value: j(totalEvents * 0.036), color: '#f59e0b' },
    { name: 'Info', value: j(totalEvents * 0.026), color: '#3b82f6' },
  ].sort((a, b) => b.value - a.value)

  const topUsers = [
    { name: 'admin@company.com', count: j(2845 / m) },
    { name: 'j.doe@company.com', count: j(2123 / m) },
    { name: 's.wilson@company.com', count: j(1891 / m) },
    { name: 'm.smith@company.com', count: j(1542 / m) },
    { name: 'r.lee@company.com', count: j(1201 / m) },
    { name: 'system', count: j(986 / m) },
    { name: 'service-account', count: j(732 / m) },
  ]

  const topResources = [
    { name: 'Console', count: j(5432 / m) },
    { name: 'Detection Rules', count: j(2143 / m) },
    { name: 'Users', count: j(1987 / m) },
    { name: 'Roles', count: j(1254 / m) },
    { name: 'Incidents', count: j(985 / m) },
    { name: 'API', count: j(687 / m) },
    { name: 'Policies', count: j(542 / m) },
  ]

  const recentEvents = [
    { id: 'EVT-001', timestamp: 'May 26, 2025 23:45:12', eventType: 'User Login', category: 'Authentication', user: 'j.doe@company.com', resource: 'Console Login', outcome: 'Success', actionType: 'login', source: 'Web UI', ipAddress: '192.168.1.45', details: 'MFA Success, IP: 192.168.1.45' },
    { id: 'EVT-002', timestamp: 'May 26, 2025 23:32:08', eventType: 'Role Updated', category: 'Administrative', user: 'admin@company.com', resource: 'Role: SOC_Analyst', outcome: 'Success', actionType: 'update', source: 'API', ipAddress: '10.0.0.2', details: 'Added permission: incident.read' },
    { id: 'EVT-003', timestamp: 'May 26, 2025 23:21:44', eventType: 'Detection Rule Modified', category: 'Policy', user: 's.wilson@company.com', resource: 'Rule: Brute Force Login', outcome: 'Success', actionType: 'update', source: 'Web UI', ipAddress: '192.168.1.101', details: 'Severity changed: Medium -> High' },
    { id: 'EVT-004', timestamp: 'May 26, 2025 23:15:33', eventType: 'API Key Created', category: 'Administrative', user: 'admin@company.com', resource: 'API Key for ThreatOps API', outcome: 'Success', actionType: 'create', source: 'Web UI', ipAddress: '10.0.0.2', details: 'Key ID: ak_78392d...' },
    { id: 'EVT-005', timestamp: 'May 26, 2025 22:58:19', eventType: 'Incident Exported', category: 'Data Export', user: 'm.smith@company.com', resource: 'Incident ID: INC-25231', outcome: 'Success', actionType: 'export', source: 'Web UI', ipAddress: '192.168.1.20', details: 'Format: PDF' },
    { id: 'EVT-006', timestamp: 'May 26, 2025 22:41:07', eventType: 'Failed Login', category: 'Authentication', user: 'unknown', resource: 'Console Login', outcome: 'Failure', actionType: 'login', source: 'Web UI', ipAddress: '203.0.113.22', details: 'Invalid password, IP: 203.0.113.22' },
    { id: 'EVT-007', timestamp: 'May 26, 2025 22:33:50', eventType: 'User Added', category: 'Administrative', user: 'admin@company.com', resource: 'User: r.lee@company.com', outcome: 'Success', actionType: 'create', source: 'Web UI', ipAddress: '10.0.0.2', details: 'Role: SOC_Analyst' },
    { id: 'EVT-008', timestamp: 'May 26, 2025 22:12:11', eventType: 'Policy Exception Created', category: 'Policy', user: 'r.lee@company.com', resource: 'Policy: USB Access', outcome: 'Warning', actionType: 'create', source: 'Web UI', ipAddress: '192.168.1.105', details: 'Reason: Business Requirement' },
  ]

  return {
    kpis, trend, categories, outcomes, topUsers, topResources, recentEvents,
    _lastUpdated: new Date().toISOString()
  }
}

// ── SkeletonCard ───────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col min-h-[120px] animate-pulse">
      <div className="h-3 w-24 bg-white/5 rounded mb-3" />
      <div className="h-8 w-20 bg-white/5 rounded mb-2" />
      <div className="h-2 w-16 bg-white/5 rounded" />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AuditLogs({ selectedTime, setSelectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [outcomeFilter, setOutcomeFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('All')
  const [userFilter, setUserFilter] = useState('All')
  const [resourceFilter, setResourceFilter] = useState('All')

  const [showFilters, setShowFilters] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchAuditData(selectedTime)) }
    catch { setIsError(true) }
    finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { load() }, [load])

  const filteredEvents = useMemo(() => {
    if (!data?.recentEvents) return []
    return data.recentEvents.filter(e => {
      if (categoryFilter !== 'All' && e.category !== categoryFilter) return false
      if (outcomeFilter !== 'All' && e.outcome !== outcomeFilter) return false

      if (eventTypeFilter !== 'All' && e.eventType !== eventTypeFilter) return false
      if (userFilter !== 'All' && e.user !== userFilter) return false
      if (resourceFilter !== 'All' && e.resource !== resourceFilter) return false

      if (searchQuery && !`${e.eventType} ${e.user} ${e.resource}`.toLowerCase().includes(searchQuery.toLowerCase())) return false

      return true
    })
  }, [data, categoryFilter, outcomeFilter, eventTypeFilter, userFilter, resourceFilter, searchQuery])

  const resetFilters = () => {
    setCategoryFilter('All')
    setOutcomeFilter('All')
    setSearchQuery('')
    setEventTypeFilter('All')
    setUserFilter('All')
    setResourceFilter('All')
  }

  // Table columns
  const eventCols = [
    { accessor: 'timestamp', header: 'Time', render: v => <span className="font-mono text-[10px] text-[#9ca3af]">{v}</span> },
    { accessor: 'eventType', header: 'Event Type', render: v => <span className="font-medium text-[11px] text-[#e5e7eb]">{v}</span> },
    { accessor: 'category', header: 'Category', render: v => <span className="text-[11px] text-[#9ca3af]">{v}</span> },
    {
      accessor: 'user',
      header: 'User',
      render: v => (
        <span className="text-[10px] text-slate-300">
          {v}
        </span>
      )
    },
    { accessor: 'resource', header: 'Resource / Entity', render: v => <span className="text-[11px] text-[#d1d5db]">{v}</span> },
    { accessor: 'outcome', header: 'Outcome', render: v => <OutcomeBadge val={v} /> },
    { accessor: 'details', header: 'Details', render: v => <span className="text-[11px] text-[#6b7280] truncate max-w-[200px] block" title={v}>{v}</span> },
    {
      accessor: '_view', header: 'Actions', render: (_, row) => (
        <button onClick={e => { e.stopPropagation(); setSelectedEvent(row) }} className="text-[#6b7280] hover:text-white transition-colors p-1">
          <MdOutlineVisibility size={14} />
        </button>
      )
    },
  ]

  const kpiState = isLoading ? 'loading' : isError ? 'error' : 'ready'
  const isLoadingNoData = isLoading && !data

  return (
    <PageShell section="Governance & Audit" title="Audit Logs" subtitle="Track and review system audit events, administrative actions and security activities." selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>

      <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
        style={{ background: 'linear-gradient(#141B21 1px,transparent 1px),linear-gradient(90deg,#141B21 1px,transparent 1px),#0B0F12', backgroundSize: '40px 40px' }}>
        <div className="flex flex-col gap-3 px-3 pt-3 pb-6">

          {/* ── Header ─────────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">
                Governance &amp; Audit · Audit Logs
              </p>
              <h1 className="text-[18px] font-bold text-white leading-tight">Audit Logs</h1>
              <p className="text-[9.5px] text-slate-400 mt-0.5">Track and review system audit events, administrative actions and security activities.</p>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-shrink-0">
              {data?._lastUpdated && !isLoading && !isError && (
                <>
                  <div className="flex items-center gap-1.5 bg-[#1f0f0f] border border-[#ef4444]/20 px-2.5 py-1.5 rounded-[7px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                    <span className="text-[11px] text-[#ef4444]">Stale Data</span>
                  </div>
                  <span className="text-[11px] text-[#4a5568]">Last updated: {new Date(data._lastUpdated).toLocaleTimeString()}</span>
                </>
              )}
              <motion.button
                onClick={() => setShowFilters(prev => !prev)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all"
              >
                <MdFilterList size={14} />
                {showFilters ? 'Hide Filters' : 'Filters'}
              </motion.button>
              <motion.button onClick={load} disabled={isLoading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-40">
                <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                  <MdRefresh size={13} />
                </motion.div>
                Refresh
              </motion.button>
            </div>
          </div>

          {/* ── Filters bar ────────────────────────────────────────────────────── */}
          {showFilters && (
            <div className="flex flex-wrap items-end justify-between bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 gap-3">
              <div className="flex flex-wrap gap-3">
                <FilterSelect
                  label="Event Time"
                  value={selectedTime}
                  onChange={setSelectedTime}
                  options={[
                    'Last 24 Hours',
                    'Last 7 Days',
                    'Last 30 Days',
                    'Last 90 Days'
                  ]}
                />
                <FilterSelect label="Event Category" value={categoryFilter} onChange={setCategoryFilter}
                  options={['All', 'Administrative', 'Security', 'Authentication', 'Policy', 'Data Export', 'Other']} />
                <FilterSelect label="Event Type" value={eventTypeFilter} onChange={setEventTypeFilter}
                  options={['All', 'User Login', 'Role Updated', 'Detection Rule Modified', 'API Key Created', 'Incident Exported', 'Failed Login', 'User Added', 'Policy Exception Created'
                  ]} />
                <FilterSelect label="User" value={userFilter} onChange={setUserFilter}
                  options={['All', 'j.doe@company.com', 'admin@company.com', 's.wilson@company.com', 'm.smith@company.com', 'r.lee@company.com', 'unknown'
                  ]} />
                <FilterSelect label="Resource / Entity" value={resourceFilter} onChange={setResourceFilter}
                  options={['All', 'Console Login', 'Role: SOC_Analyst', 'Rule: Brute Force Login', 'API Key for ThreatOps API', 'Incident ID: INC-25231', 'User: r.lee@company.com', 'Policy: USB Access'
                  ]} />
                <FilterSelect label="Outcome" value={outcomeFilter} onChange={setOutcomeFilter}
                  options={['All', 'Success', 'Failure', 'Warning', 'Info']} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[6px] px-3 py-1.5 focus-within:border-white/[0.12] transition-colors" style={{ minWidth: 200 }}>
                  <MdSearch size={15} className="text-[#6b7280] flex-shrink-0" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search audit logs..." className="bg-transparent text-[9.5px] text-white placeholder:text-slate-400 outline-none w-full" />
                </div>
                <button className="flex items-center gap-1.5 text-[11px] text-[#6b7280] hover:text-white transition-colors">
                  <MdFilterList size={14} /> Advanced Filters ▾
                </button>
              </div>
            </div>
          )}

          {/* ── Error ──────────────────────────────────────────────────────────── */}
          {isError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-10"
            >
              <MdErrorOutline
                className="text-red-400/60"
                size={32}
              />

              <p className="text-[11px] font-semibold text-slate-400">
                Unable to load audit logs
              </p>

              <button
                onClick={load}
                className="px-3 py-1.5 rounded-[10px] bg-black/5 backdrop-blur-[1px] border border-red-500/30 text-red-400 hover:border-red-500/50 transition-all text-[9.5px] font-semibold"
              >
                Retry
              </button>
            </motion.div>
          )}

          {!isError && (
            <div className="flex flex-col gap-3">

              {/* ── KPI Row ──────────────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {isLoadingNoData ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  <>
                    <KpiBigNumber title="Audit Events" subtitle="vs yesterday" icon={MdArticle} iconColor="#8B5CF6" value={data?.kpis?.auditEvents?.value} trend={data?.kpis?.auditEvents?.trend} dataState={kpiState} />
                    <KpiBigNumber title="Administrative Actions" subtitle="vs yesterday" icon={MdManageAccounts} iconColor="#3b82f6" value={data?.kpis?.adminActions?.value} trend={data?.kpis?.adminActions?.trend} dataState={kpiState} />
                    <KpiBigNumber title="Security Actions" subtitle="vs yesterday" icon={MdSecurity} iconColor="#22c55e" value={data?.kpis?.security?.value} trend={data?.kpis?.security?.trend} dataState={kpiState} />
                    <KpiBigNumber title="Policy Changes" subtitle="vs yesterday" icon={MdPolicy} iconColor="#f97316" value={data?.kpis?.policy?.value} trend={data?.kpis?.policy?.trend} dataState={kpiState} />
                    <KpiBigNumber title="Login Events" subtitle="vs yesterday" icon={MdLogin} iconColor="#06b6d4" value={data?.kpis?.login?.value} trend={data?.kpis?.login?.trend} dataState={kpiState} />
                    <KpiBigNumber title="Export Events" subtitle="vs yesterday" icon={MdFileDownload} iconColor="#6b7280" value={data?.kpis?.export?.value} trend={data?.kpis?.export?.trend} dataState={kpiState} />
                  </>
                )}
              </div>

              {/* ── Charts Row 1 ─────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch auto-rows-[250px]">
                {/* Over Time */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col transition-all duration-200 hover:border-white/[0.12]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Audit Events Over Time</h3>
                    <span className="text-[9.5px] text-slate-400 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] px-2 py-1 rounded-[6px]">Group By 1 Hour ▾</span>
                  </div>
                  {isLoadingNoData ? (
                    <div className="flex-1 min-h-[220px] flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={20} className="text-[#3b82f6]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 w-full pt-2 pr-3 overflow-hidden">
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={data?.trend || []} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                          <XAxis dataKey="t" stroke="#374151" fontSize={10} tickLine={false} axisLine={false} dy={3} />
                          <YAxis stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                          <RTooltip contentStyle={TT.contentStyle} />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Audit Events" dot={{ r: 3, fill: '#111827', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#3b82f6' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-auto pt-3 min-h-[36px] border-t border-white/[0.05]">
                    <span className="w-3 h-0.5 bg-[#3b82f6] rounded" />
                    <span className="text-[10px] text-[#6b7280]">Audit Events</span>
                  </div>
                </div>

                {/* By Category */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col transition-all duration-200 hover:border-white/[0.12]">
                  <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">Events by Category</h3>
                  {isLoadingNoData ? (
                    <div className="flex-1 min-h-[200px] flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#8b5cf6]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2 h-[150px]">

                        {/* Donut - Left */}
                        <div className="relative w-[44%] h-full flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data?.categories || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={58}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                              >
                                {(data?.categories || []).map((d, i) => (
                                  <Cell key={i} fill={d.color} />
                                ))}
                              </Pie>

                              <RTooltip
                                contentStyle={TT.contentStyle}
                                itemStyle={{ color: '#ffffff', fontSize: '9.5px' }}
                                formatter={(v, name) => [v.toLocaleString(), name]}
                              />
                            </PieChart>
                          </ResponsiveContainer>

                          <DonutCenterLabel total={data?.kpis.auditEvents.value || 0} />
                        </div>

                        {/* Legend - Right */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          {(data?.categories || []).map(d => (
                            <div key={d.name} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-sm flex-shrink-0"
                                  style={{ background: d.color }}
                                />
                                <span className="text-[9.5px] text-[#9ca3af] truncate">
                                  {d.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[9.5px] font-medium text-white">
                                  {d.value.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-[#6b7280]">
                                  ({((d.value / (data?.kpis.auditEvents.value || 1)) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>

                      <div className="mt-auto pt-3 min-h-[36px] border-t border-white/[0.05]">
                        <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">
                          View full distribution →
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* By Outcome */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col transition-all duration-200 hover:border-white/[0.12]">
                  <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">Events by Outcome</h3>
                  {isLoadingNoData ? (
                    <div className="flex-1 min-h-[200px] flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#22c55e]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2 h-[150px]">

                        {/* Donut - Left */}
                        <div className="relative w-[44%] h-full flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data?.outcomes || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={58}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                              >
                                {(data?.outcomes || []).map((d, i) => (
                                  <Cell key={i} fill={d.color} />
                                ))}
                              </Pie>

                              <RTooltip
                                contentStyle={TT.contentStyle}
                                itemStyle={{ color: '#ffffff', fontSize: '9.5px' }}
                                formatter={(v, name) => [v.toLocaleString(), name]}
                              />
                            </PieChart>
                          </ResponsiveContainer>

                          <DonutCenterLabel total={data?.kpis.auditEvents.value || 0} />
                        </div>

                        {/* Legend - Right */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          {(data?.outcomes || []).map(d => (
                            <div key={d.name} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-sm flex-shrink-0"
                                  style={{ background: d.color }}
                                />
                                <span className="text-[9.5px] text-[#9ca3af] truncate">
                                  {d.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[9.5px] font-medium text-white">
                                  {d.value.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-[#6b7280]">
                                  ({((d.value / (data?.kpis.auditEvents.value || 1)) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                      <div className="mt-auto pt-3 min-h-[36px] border-t border-white/[0.05]">
                        <span className="text-[9.5px] text-slate-400">View full distribution →</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Top Users & Top Resources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

                {/* Top Users */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col transition-all duration-200 hover:border-white/[0.12]">

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                        Top Users
                      </h3>

                      <p className="text-[9.5px] text-slate-400">
                        Most active users
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {(data?.topUsers || []).map((user, index) => {
                      const maxCount = data?.topUsers?.[0]?.count || 1
                      const percentage = (user.count / maxCount) * 100

                      return (
                        <div key={user.name} className="flex items-center gap-3">
                          <span className="w-4 text-[9.5px] text-slate-500 text-right">
                            {index + 1}
                          </span>

                          <div className="flex-1 min-w-0">

                            <span className="block text-[9.5px] text-slate-300 truncate mb-1">
                              {user.name}
                            </span>

                            <div className="flex items-center gap-3">
                              <div className="h-1 w-[92%] bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500/70 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>

                              <span className="text-[9.5px] font-semibold text-white whitespace-nowrap">
                                {user.count.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                </div>


                {/* Top Resources */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col transition-all duration-200 hover:border-white/[0.12]">

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                        Top Resources
                      </h3>

                      <p className="text-[9.5px] text-slate-400">
                        Most accessed resources
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {(data?.topResources || []).map((resource, index) => {
                      const maxCount = data?.topResources?.[0]?.count || 1
                      const percentage = (resource.count / maxCount) * 100

                      return (
                        <div key={resource.name} className="flex items-center gap-3">
                          <span className="w-4 text-[9.5px] text-slate-500 text-right">
                            {index + 1}
                          </span>

                          <div className="flex-1 min-w-0">

                            <span className="block text-[9.5px] text-slate-300 truncate mb-1">
                              {resource.name}
                            </span>

                            <div className="flex items-center gap-3">
                              <div className="h-1 w-[92%] bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500/70 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>

                              <span className="text-[9.5px] font-semibold text-white whitespace-nowrap">
                                {resource.count.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                </div>

              </div>


              {/* Recent Audit Events */}
              <div className="flex flex-col mt-3">

                <DetailTable
                  title="Recent Audit Events"
                  description=""
                  columns={eventCols}
                  data={filteredEvents}
                  searchable={false}
                />

                {filteredEvents.length === 0 && (
                  <div className="rounded-b-[10px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] px-5 py-6 text-center">
                    <p className="text-[9.5px] text-slate-400">
                      No audit events match the selected filters.
                    </p>

                    <button
                      onClick={resetFilters}
                      className="mt-2 text-[9.5px] font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Reset filters
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    // existing View All logic
                  }}
                  className="mt-2 self-end text-[9.5px] font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  View all audit events →
                </button>

              </div>

            </div>
          )}
        </div>

        {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
        {selectedEvent && <AuditDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </div>
    </PageShell>
  )
}
