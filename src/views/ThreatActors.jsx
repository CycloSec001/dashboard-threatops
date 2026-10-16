import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  MdRefresh, MdWarningAmber, MdSearch, MdFilterList,
  MdOutlineVisibility, MdOutlineGpsFixed, MdClose,
  MdPerson, MdSecurity, MdFlashOn, MdPeopleAlt, MdGpsFixed
} from 'react-icons/md'
import { fetchThreatActorsKPIs } from '../api/threatOpsApi'
import { threatActorsKpis } from '../data/threatOpsThreatActorsKpis'
import { ActSection } from '../components/PageShell'
import { KpiBigNumber } from '../components/KpiCards'
import DetailTable from '../components/DetailTable'

// ── Tooltip style ─────────────────────────────────────────────────────────────
const TT = {
  contentStyle: { background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12, color: '#e5e7eb' },
  itemStyle: { color: '#e5e7eb' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

// ── RiskBadge ─────────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const map = {
    Critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    High:     'bg-orange-500/10 text-orange-400 border-orange-500/30',
    Medium:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Low:      'bg-green-500/10 text-green-400 border-green-500/30',
    Unknown:  'bg-gray-500/10 text-gray-400 border-gray-500/30',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-[4px] border text-[10px] font-semibold ${map[level] || map.Unknown}`}>
      {level}
    </span>
  )
}

// ── ConfidenceBadge ───────────────────────────────────────────────────────────
function ConfidenceBadge({ level }) {
  const map = {
    High:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Medium: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    Low:    'bg-gray-500/10 text-gray-400 border-gray-500/30',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-[4px] border text-[10px] font-semibold ${map[level] || map.Low}`}>
      {level}
    </span>
  )
}

// ── FilterSelect ──────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-[#111827] border border-[#1f2937] text-[12px] text-white rounded-[6px] px-3 py-1.5 focus:outline-none focus:border-[#374151] appearance-none cursor-pointer"
        style={{ minWidth: 120 }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ── Actor Detail Modal ─────────────────────────────────────────────────────────
function ActorDetailModal({ actor, onClose }) {
  if (!actor) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0d1117] border border-[#1f2937] rounded-[14px] w-full max-w-[680px] max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-[#1f2937]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#1c1f2e] border border-[#1f2937] flex items-center justify-center">
                <MdPerson size={20} className="text-[#8B5CF6]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[18px] font-bold text-white">{actor.name}</h2>
                  <RiskBadge level={actor.riskLevel} />
                </div>
                <p className="text-[12px] text-[#6b7280]">{actor.alias} · {actor.actorType}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[#6b7280] hover:text-white p-1 rounded-[6px] hover:bg-white/10 transition-colors">
              <MdClose size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-5">
            {actor.description && (
              <div>
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Description</p>
                <p className="text-[13px] text-[#d1d5db] leading-relaxed">{actor.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111827] rounded-[10px] border border-[#1f2937] p-4">
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Activity Window</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#6b7280]">First Seen</span>
                    <span className="text-[11px] text-white">{actor.firstSeen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#6b7280]">Last Seen</span>
                    <span className="text-[11px] text-white">{actor.lastSeen}</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#111827] rounded-[10px] border border-[#1f2937] p-4">
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Activity Summary</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#6b7280]">Incidents</span>
                    <span className="text-[11px] font-bold text-[#ef4444]">{actor.relatedIncidents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#6b7280]">Campaigns</span>
                    <span className="text-[11px] font-bold text-[#8B5CF6]">{actor.campaigns}</span>
                  </div>
                </div>
              </div>
            </div>

            {actor.techniques?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Observed Techniques</p>
                <div className="flex flex-wrap gap-2">
                  {actor.techniques.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 rounded-[6px] text-[11px] font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {actor.sources?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Intelligence Sources</p>
                <div className="flex flex-wrap gap-2">
                  {actor.sources.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 rounded-[6px] text-[11px] font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Risk Distribution Donut ───────────────────────────────────────────────────
function RiskDistributionCard({ data, total, isLoading }) {
  return (
    <div className="flex flex-col bg-[#111827] border border-[#1f2937] rounded-[10px] p-5 h-full">
      <h3 className="text-[13px] font-bold text-white mb-4">Actor Risk Distribution</h3>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <MdRefresh size={20} className="text-[#8B5CF6]/40" />
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-4">
          <div className="relative" style={{ width: 140, height: 140, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={42} outerRadius={62} paddingAngle={2} dataKey="count" stroke="none">
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={TT.contentStyle} formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[18px] font-bold text-white">{total}</span>
              <span className="text-[9px] text-[#6b7280] uppercase">Total</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {data.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-[11px] text-[#9ca3af]">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-white">{d.count}</span>
                  <span className="text-[10px] text-[#6b7280]">({d.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-[#1f2937]">
        <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View full distribution →</span>
      </div>
    </div>
  )
}

export default function ThreatActors({ selectedTime, setActive }) {
  const [data, setData]             = useState(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [isError, setIsError]       = useState(false)
  const [selectedActor, setSelectedActor] = useState(null)

  // Filters
  const [actorTypeFilter, setActorTypeFilter]       = useState('All')
  const [riskFilter, setRiskFilter]                 = useState('All')
  const [activityFilter, setActivityFilter]         = useState('All')
  const [searchQuery, setSearchQuery]               = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchThreatActorsKPIs(selectedTime)
      setData(result)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTime])

  useEffect(() => { loadData() }, [loadData])

  const isEmpty   = !isLoading && !isError && data && Object.keys(data).length === 0
  const isPartial = !isLoading && !isError && !isEmpty && data &&
    threatActorsKpis.some(k => data[k.key] === undefined)
  const lastUpdated = data?._lastUpdated

  // Filtered actors table
  const filteredActors = useMemo(() => {
    if (!data?.actorsTable) return []
    return data.actorsTable.filter(a => {
      if (actorTypeFilter !== 'All' && a.actorType !== actorTypeFilter) return false
      if (riskFilter !== 'All' && a.riskLevel !== riskFilter) return false
      if (searchQuery && !`${a.name} ${a.alias} ${a.actorType}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [data, actorTypeFilter, riskFilter, searchQuery])

  // KPI dataState
  const kpiState = isLoading ? 'loading' : isError ? 'error' : isEmpty ? 'empty' : isPartial ? 'partial' : 'ready'

  // Table column definitions
  const actorCols = [
    { accessor: 'name', header: 'Actor Name', render: v => <span className="text-[#60a5fa] cursor-pointer hover:underline font-semibold">{v}</span> },
    { accessor: 'alias', header: 'Alias / Group', render: v => <span className="text-[#9ca3af]">{v}</span> },
    { accessor: 'riskLevel', header: 'Risk Level', render: v => <RiskBadge level={v} /> },
    { accessor: 'actorType', header: 'Actor Type' },
    { accessor: 'firstSeen', header: 'First Seen' },
    { accessor: 'lastSeen', header: 'Last Seen' },
    { accessor: 'relatedIncidents', header: 'Incidents', render: v => <span className="font-semibold text-[#ef4444]">{v}</span> },
    { accessor: 'campaigns', header: 'Campaigns', render: v => <span className="font-semibold text-[#8B5CF6]">{v}</span> },
    { accessor: '_actions', header: '', render: (_, row) => (
      <div className="flex items-center gap-2 text-[#6b7280]">
        <MdOutlineGpsFixed className="hover:text-white cursor-pointer transition-colors" size={14} title="Track" />
        <MdOutlineVisibility className="hover:text-white cursor-pointer transition-colors" size={14} title="View" onClick={e => { e.stopPropagation(); setSelectedActor(row) }} />
      </div>
    )}
  ]

  const matchCols = [
    { accessor: 'actor', header: 'Actor', render: v => <span className="text-[#60a5fa] cursor-pointer hover:underline">{v}</span> },
    { accessor: 'matchedOn', header: 'Matched On' },
    { accessor: 'source', header: 'Source' },
    { accessor: 'matchType', header: 'Match Type' },
    { accessor: 'confidence', header: 'Confidence', render: v => <ConfidenceBadge level={v} /> },
    { accessor: 'relatedAsset', header: 'Related Asset', render: v => <span className="text-[#d1d5db] font-mono text-[11px]">{v}</span> },
  ]

  const campaignCols = [
    { accessor: 'name', header: 'Campaign Name', render: v => <span className="text-[#60a5fa] cursor-pointer hover:underline">{v}</span> },
    { accessor: 'linkedActors', header: 'Linked Actors', render: v => <span className="font-semibold">{v}</span> },
    { accessor: 'relatedIncidents', header: 'Incidents', render: v => <span className="font-semibold text-[#ef4444]">{v}</span> },
    { accessor: 'risk', header: 'Risk', render: v => <RiskBadge level={v} /> },
    { accessor: 'lastActivity', header: 'Last Activity' },
  ]

  // Chart height scales with # techniques
  const techChartData = data?.techniquesChart || []
  const techChartHeight = Math.max(300, techChartData.length * 36 + 40)

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      style={{ background: 'linear-gradient(#141B21 1px,transparent 1px),linear-gradient(90deg,#141B21 1px,transparent 1px),#0B0F12', backgroundSize: '40px 40px' }}
    >
      <div className="flex flex-col gap-4 px-6 pt-6 pb-10">

        {/* ── Page Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[10px] font-semibold text-[#8B5CF6] uppercase tracking-[0.15em] mb-0.5">
              Threat Intelligence · Threat Actors
            </p>
            <h1 className="text-[26px] font-bold text-white leading-tight">Threat Actors</h1>
            <p className="text-[13px] text-[#6b7280] mt-1">
              View known threat actors, their activity, related campaigns, techniques and incidents.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1 flex-shrink-0">
            {lastUpdated && !isLoading && !isError && (
              <>
                <div className="flex items-center gap-2 bg-[#1f0f0f] border border-[#ef4444]/20 px-2.5 py-1.5 rounded-[7px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                  <span className="text-[11px] text-[#ef4444]">Stale Data</span>
                </div>
                <span className="text-[11px] text-[#4a5568]">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-[#111827] border border-[#1f2937] text-[12px] font-medium text-[#9ca3af] hover:text-white hover:border-[#374151] transition-all"
            >
              <MdFilterList size={14} /> Filters
            </motion.button>
            <motion.button
              onClick={loadData} disabled={isLoading}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-[#111827] border border-[#1f2937] text-[12px] font-medium text-[#9ca3af] hover:text-white hover:border-[#374151] transition-all disabled:opacity-40"
            >
              <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                <MdRefresh size={13} />
              </motion.div>
              Refresh
            </motion.button>
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between bg-[#0d1117]/80 border border-[#1f2937] rounded-[10px] p-4 gap-4">
          <div className="flex flex-wrap gap-4">
            <FilterSelect label="Actor Type" value={actorTypeFilter} onChange={setActorTypeFilter}
              options={['All', 'State-Sponsored', 'Ransomware', 'Financial', 'Cyber Crime']} />
            <FilterSelect label="Risk Level" value={riskFilter} onChange={setRiskFilter}
              options={['All', 'Critical', 'High', 'Medium', 'Low', 'Unknown']} />
            <FilterSelect label="Activity Status" value={activityFilter} onChange={setActivityFilter}
              options={['All', 'Active', 'Inactive', 'Suspected']} />
            <FilterSelect label="First Seen" value="All Time" onChange={() => {}}
              options={['All Time', 'Last 24h', 'Last 7 Days', 'Last 30 Days']} />
            <FilterSelect label="Last Seen" value="All Time" onChange={() => {}}
              options={['All Time', 'Last 24h', 'Last 7 Days', 'Last 30 Days']} />
          </div>
          <div className="flex items-center gap-2 bg-[#111827] border border-[#1f2937] rounded-[6px] px-3 py-1.5 focus-within:border-[#374151] transition-colors" style={{ minWidth: 220 }}>
            <MdSearch size={16} className="text-[#6b7280] flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search actors..."
              className="bg-transparent text-[12px] text-white placeholder:text-[#4a5568] outline-none w-full"
            />
          </div>
        </div>

        {/* ── Status Banners ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {isPartial && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-[#1c1a10] border border-yellow-700/40 rounded-[8px] px-4 py-2.5"
            >
              <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
              <span className="text-[12px] text-yellow-300/80">Some data is currently unavailable. Showing partial results.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error State ──────────────────────────────────────────────────────── */}
        {isError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20"
          >
            <div className="text-red-400/60 text-5xl">⚠</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">Unable to load threat actor data</p>
            <p className="text-[12px] text-[#4a5568]">The backend request failed. Check connection and retry.</p>
            <button onClick={loadData}
              className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {!isError && (
          <div className="flex flex-col gap-6">

            {/* ── ACT 1: KPIs + Techniques ─────────────────────────────────────── */}
            <ActSection act="act1">
              {/* 6 KPI Cards: 3 cols × 2 rows */}
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-2">
                <KpiBigNumber
                  title="Known Actors" subtitle="Actors in intelligence"
                  icon={MdPeopleAlt} iconColor="#00D9FF"
                  value={data?.knownActors} dataState={kpiState}
                  trend={!isLoading && data ? { value: '1.7%', label: 'vs yesterday', direction: 'up', color: 'green' } : null}
                  routeKey="threat_actors" setActive={setActive}
                />
                <KpiBigNumber
                  title="Active Actors" subtitle="Linked to active threats"
                  icon={MdFlashOn} iconColor="#F59E0B"
                  value={data?.activeActors} dataState={kpiState}
                  trend={!isLoading && data ? { value: '5.6%', label: 'vs yesterday', direction: 'up', color: 'green' } : null}
                  routeKey="threat_actors" setActive={setActive}
                />
                <KpiBigNumber
                  title="Related Incidents" subtitle="Actor-linked incidents"
                  icon={MdSecurity} iconColor="#EF4444"
                  value={data?.relatedIncidents} dataState={kpiState}
                  trend={!isLoading && data ? { value: '9.2%', label: 'vs yesterday', direction: 'up', color: 'red' } : null}
                  routeKey="active_incidents" setActive={setActive}
                />
                <KpiBigNumber
                  title="Actor Matches" subtitle="Observed actor matches"
                  icon={MdGpsFixed} iconColor="#F97316"
                  value={data?.actorMatches} dataState={kpiState}
                  trend={!isLoading && data ? { value: '7.3%', label: 'vs yesterday', direction: 'up', color: 'green' } : null}
                  routeKey="threat_actors" setActive={setActive}
                />
                <KpiBigNumber
                  title="High-Risk Actors" subtitle="High-risk actors"
                  icon={MdWarningAmber} iconColor="#EF4444"
                  value={data?.highRiskActors} dataState={kpiState}
                  trend={!isLoading && data ? { value: '3.7%', label: 'vs yesterday', direction: 'up', color: 'red' } : null}
                  routeKey="threat_actors" setActive={setActive}
                />
                <KpiBigNumber
                  title="Campaigns" subtitle="Associated campaigns"
                  icon={MdOutlineGpsFixed} iconColor="#8B5CF6"
                  value={data?.campaigns} dataState={kpiState}
                  trend={!isLoading && data ? { value: '6.8%', label: 'vs yesterday', direction: 'up', color: 'green' } : null}
                  routeKey="campaigns" setActive={setActive}
                />
              </div>
            </ActSection>

            {/* ── ACT 2: Actors Table + Techniques ─────────────────────────────── */}
            <ActSection act="act2">
              <div className="grid grid-cols-[1fr_420px] gap-4 items-start">
                {/* Actors Table */}
                <div>
                  <DetailTable
                    title="Top Threat Actors"
                    columns={actorCols}
                    data={filteredActors}
                    searchable={false}
                  />
                  {filteredActors.length === 0 && !isLoading && (
                    <div className="mt-[-1px] rounded-b-[10px] bg-[#0d1117] border border-t-0 border-[#1f2937] px-5 py-6 text-center">
                      <p className="text-[12px] text-[#6b7280]">No threat actors match the selected filters.</p>
                      <button onClick={() => { setActorTypeFilter('All'); setRiskFilter('All'); setSearchQuery('') }}
                        className="mt-2 text-[11px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                  <div className="mt-3">
                    <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View all actors →</span>
                  </div>
                </div>

                {/* Techniques Observed Chart */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-bold text-white">Techniques Observed (MITRE ATT&CK)</h3>
                  </div>
                  {isLoading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={20} className="text-[#8B5CF6]/40" />
                      </motion.div>
                    </div>
                  ) : techChartData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[12px] text-[#4a5568] min-h-[300px]">No technique data</div>
                  ) : (
                    <div style={{ height: techChartHeight }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={techChartData} layout="vertical" margin={{ top: 4, right: 30, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                          <XAxis type="number" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false}
                            label={{ value: 'Number of Actors', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} width={195} />
                          <Tooltip {...TT} />
                          <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-[#1f2937]">
                    <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View all techniques →</span>
                  </div>
                </div>
              </div>
            </ActSection>

            {/* ── ACT 3: Recent Matches + Campaigns + Risk Distribution ─────────── */}
            <ActSection act="act3">
              {/* Recent Actor Matches */}
              <div className="mb-4">
                <DetailTable
                  title="Recent Actor Matches"
                  columns={matchCols}
                  data={data?.recentMatches || []}
                  searchable={false}
                />
                <div className="mt-3">
                  <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View all matches →</span>
                </div>
              </div>

              {/* Campaigns + Risk Distribution side by side */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {/* Top Campaigns */}
                <DetailTable
                  title="Top Campaigns"
                  columns={campaignCols}
                  data={data?.topCampaigns || []}
                  searchable={false}
                />

                {/* Actor Risk Distribution */}
                <RiskDistributionCard
                  data={data?.riskDistribution || []}
                  total={data?.knownActors || 0}
                  isLoading={isLoading}
                />
              </div>

              <div className="mt-3 flex gap-6">
                <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View all campaigns →</span>
                <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View full distribution →</span>
              </div>
            </ActSection>

          </div>
        )}
      </div>

      {/* ── Actor Detail Modal ─────────────────────────────────────────────── */}
      {selectedActor && (
        <ActorDetailModal actor={selectedActor} onClose={() => setSelectedActor(null)} />
      )}
    </div>
  )
}
