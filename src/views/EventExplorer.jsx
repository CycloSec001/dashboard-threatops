import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend
} from 'recharts'
import { MdRefresh, MdWarningAmber, MdSearch, MdFilterList, MdVisibility, MdCalendarToday } from 'react-icons/md'
import { fetchEventExplorerKPIs } from '../api/threatOpsApi'
import { eventExplorerKpis } from '../data/threatOpsEventExplorerKpis'
import OverviewMetricCard from '../components/OverviewMetricCard'
import StandardChartCard from '../components/StandardChartCard'
import DetailTable from '../components/DetailTable'

// ── Shared tooltip style ───────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: 'rgba(10, 15, 25, 0.9)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    fontSize: 11,
    color: '#f3f4f6',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  itemStyle: { color: '#f3f4f6' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ cols, children }) {
  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`
      }}
    >
      {children}
    </div>
  )
}

export default function EventExplorer({ selectedTime, setActive }) {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]   = useState(false)
  
  // Filters
  const [filterSource, setFilterSource] = useState('All Sources')
  const [filterType, setFilterType] = useState('All Types')
  const [filterSeverity, setFilterSeverity] = useState('All Severities')
  const [filterTenant, setFilterTenant] = useState('All Tenants')
  const [quickFilter, setQuickFilter] = useState('none') // 'none', 'parsed', 'anomalous'
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchEventExplorerKPIs(selectedTime)
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
    eventExplorerKpis.some(k => data[k.key] === undefined)

  const lastUpdated = data?._lastUpdated
  const isStale = lastUpdated && (Date.now() - new Date(lastUpdated).getTime() > 15 * 60 * 1000)
  const severityChart = data?.severityChart || []
  const tenantChart = data?.tenantChart || []
  
  const handleKpiClick = (key) => {
    setFilterSource('All Sources')
    setFilterType('All Types')
    setFilterSeverity('All Severities')
    setFilterTenant('All Tenants')
    setSearchQuery('')
    if (key === 'parsedEvents') {
      setQuickFilter('parsed')
    } else if (key === 'anomalies') {
      setQuickFilter('anomalous')
    } else {
      setQuickFilter('none')
    }
  }

  // Reusable card renderer
  const card = (kpi) => (
    <OverviewMetricCard
      key={kpi.key}
      config={kpi}
      value={data?.[kpi.key]}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onClick={() => handleKpiClick(kpi.key)}
    />
  )

  const severityColors = {
    'Critical': '#f43f5e',
    'High': '#fb923c',
    'Medium': '#facc15',
    'Low': '#38bdf8',
    'Informational': '#c084fc'
  }

  // Filter latest events
  const filteredEvents = data?.latestEvents?.filter(e => 
    (filterSource === 'All Sources' || e.source === filterSource) &&
    (filterType === 'All Types' || e.eventType === filterType) &&
    (filterSeverity === 'All Severities' || e.severity === filterSeverity) &&
    (filterTenant === 'All Tenants' || e.tenant === filterTenant) &&
    (quickFilter === 'none' || (quickFilter === 'parsed' && e.status === 'Parsed') || (quickFilter === 'anomalous' && e.outcome === 'Failure')) &&
    (!searchQuery || e.eventName.toLowerCase().includes(searchQuery.toLowerCase()) || e.source.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      style={{
        background: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px), #0B0F12`,
        backgroundSize: '40px 40px',
      }}
    >
      <div className="flex flex-col gap-3 px-6 pt-5 pb-8">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-1">
          <div>
          <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
  Investigation
</p>
            <h1 className="text-[24px] font-bold text-white leading-tight">Event Explorer</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Explore, analyze and investigate security events across your environment.
            </p>
          </div>

          <div className="flex items-center gap-2.5 mt-1">
            {lastUpdated && !isLoading && !isError && (
              <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-300">
              {selectedTime}
              <MdCalendarToday size={12} className="text-cyan-400" />
            </div>

            <motion.button
              onClick={loadData}
              disabled={isLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-black/10 border border-white/[0.05] text-[10.5px] font-medium text-slate-300 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-40"
            >
              <motion.div
                animate={{ rotate: isLoading ? 360 : 0 }}
                transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}
              >
                <MdRefresh size={13} className="text-cyan-400" />
              </motion.div>
              Refresh
            </motion.button>
            
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-black/10 border border-white/[0.05] text-[10.5px] font-medium text-slate-300 hover:text-white hover:border-white/[0.12] transition-all">
              <MdFilterList size={13} className="text-cyan-400" />
              Filters
            </button>
          </div>
        </div>
        
        {/* ── Filters Bar ──────────────────────────────────────── */}
        <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-wrap items-end gap-2.5 transition-all duration-200 hover:border-white/[0.12]">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Search</label>
            <div className="flex items-center gap-2 bg-black/10 border border-white/[0.05] rounded-[6px] px-2.5 py-1.5 focus-within:border-cyan-500/40 transition-colors">
              <MdSearch size={14} className="text-slate-400 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="bg-transparent text-[10.5px] text-slate-200 placeholder:text-slate-500 outline-none w-full"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Time Range</label>
            <select disabled className="bg-black/10 border border-white/[0.05] text-slate-300 text-[10.5px] px-2.5 py-1.5 rounded-[6px] w-[120px] outline-none appearance-none">
              <option>{selectedTime}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Event Source</label>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="bg-black/10 border border-white/[0.05] text-slate-200 text-[10.5px] px-2.5 py-1.5 rounded-[6px] w-[120px] outline-none cursor-pointer focus:border-cyan-500/40">
              <option className="bg-[#0a0f19]">All Sources</option>
              {data?.topSources?.map(s => <option key={s.source} className="bg-[#0a0f19]">{s.source}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Event Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-black/10 border border-white/[0.05] text-slate-200 text-[10.5px] px-2.5 py-1.5 rounded-[6px] w-[120px] outline-none cursor-pointer focus:border-cyan-500/40">
              <option className="bg-[#0a0f19]">All Types</option>
              {data?.topTypes?.map(t => <option key={t.eventType} className="bg-[#0a0f19]">{t.eventType}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Severity</label>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="bg-black/10 border border-white/[0.05] text-slate-200 text-[10.5px] px-2.5 py-1.5 rounded-[6px] w-[120px] outline-none cursor-pointer focus:border-cyan-500/40">
              <option className="bg-[#0a0f19]">All Severities</option>
              <option className="bg-[#0a0f19]">Critical</option>
              <option className="bg-[#0a0f19]">High</option>
              <option className="bg-[#0a0f19]">Medium</option>
              <option className="bg-[#0a0f19]">Low</option>
              <option className="bg-[#0a0f19]">Informational</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Tenant</label>
            <select value={filterTenant} onChange={e => setFilterTenant(e.target.value)} className="bg-black/10 border border-white/[0.05] text-slate-200 text-[10.5px] px-2.5 py-1.5 rounded-[6px] w-[120px] outline-none cursor-pointer focus:border-cyan-500/40">
              <option className="bg-[#0a0f19]">All Tenants</option>
              {data?.tenantChart?.map(t => <option key={t.name} className="bg-[#0a0f19]">{t.name}</option>)}
            </select>
          </div>
          
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-black/10 border border-white/[0.05] text-[10.5px] font-medium text-slate-300 hover:text-white hover:border-white/[0.12] transition-all h-[31px]">
            <MdFilterList size={13} className="text-cyan-400" />
            Advanced
          </button>
        </div>

        {/* ── Partial data banner ─────────────────────────────── */}
        <AnimatePresence>
          {isPartial && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-black/10 border border-amber-500/30 rounded-[8px] px-3.5 py-2"
            >
              <MdWarningAmber className="text-amber-400 flex-shrink-0" size={14} />
              <span className="text-[11px] text-amber-200/90">
                Some data is currently unavailable. Showing partial results.
              </span>
            </motion.div>
          )}
          {isStale && !isLoading && !isError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-3 bg-black/10 border border-orange-500/30 rounded-[8px] px-3.5 py-2"
            >
              <div className="flex items-center gap-3">
                <MdWarningAmber className="text-orange-400 flex-shrink-0" size={14} />
                <span className="text-[11px] text-orange-200/90">
                  Data is older than 15 minutes.
                </span>
              </div>
              <button 
                onClick={loadData}
                className="text-[10px] text-orange-400 hover:text-orange-300 font-medium px-2 py-1 bg-orange-500/10 rounded hover:bg-orange-500/20 transition-colors"
              >
                Refresh to get latest data
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Full error state ─────────────────────────────────── */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-3 py-16 bg-black/5 border border-white/[0.05] rounded-[10px]"
          >
            <div className="text-rose-400 text-3xl">⚠</div>
            <p className="text-[13px] font-semibold text-slate-300">Unable to load KPI data</p>
            <p className="text-[11px] text-slate-500">The backend request failed.</p>
            <button
              onClick={loadData}
              className="px-3 py-1 rounded-[6px] bg-black/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-[11px] font-medium transition-all"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ── KPI Grid ─────────────────────────────────────────── */}
        {!isError && (
          <div className="flex flex-col gap-3">
            {/* Row 1 — 5 metrics */}
            <Row cols={5}>
              {eventExplorerKpis.map(card)}
            </Row>

            {/* Row 2 — 3 Columns Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              
              {/* Events by Severity (Donut Chart) */}
              <StandardChartCard
                title="Events by Severity"
                type="donut"
                isLoading={isLoading}
                isEmpty={isEmpty || severityChart.length === 0}
              >
                <div className="h-[185px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityChart}
                        innerRadius={48}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        onClick={(entry) => setFilterSeverity(entry.name)}
                        className="cursor-pointer outline-none"
                      >
                        {severityChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || severityColors[entry.name]} className="outline-none" />
                        ))}
                      </Pie>
                      <text x="50%" y="40%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="16" fontWeight="bold">
                        {data?.events || '0'}
                      </text>
                      <text x="50%" y="40%" dy={16} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="9.5">
                        Total Events
                      </text>
                      <RechartsTooltip {...tooltipStyle} />
                      <Legend
                        verticalAlign="bottom"
                        height={24}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 9.5, color: '#94a3b8', marginTop: '0px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </StandardChartCard>

              {/* Events by Tenant (Bar Chart) */}
              <StandardChartCard
                title="Events by Tenant"
                type="bar"
                isLoading={isLoading}
                isEmpty={isEmpty || tenantChart.length === 0}
              >
                <div className="h-[185px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tenantChart} margin={{ top: 12, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <RechartsTooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar
                        dataKey="value"
                        fill="#38bdf8"
                        radius={[4, 4, 0, 0]}
                        barSize={22}
                        onClick={(entry) => setFilterTenant(entry.name)}
                        className="cursor-pointer outline-none"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </StandardChartCard>

              {/* Anomaly Overview */}
              <StandardChartCard
                title="Anomaly Overview"
                type="donut"
                isLoading={isLoading}
                isEmpty={isEmpty || !data?.anomalyOverview?.length}
              >
                <div className="h-[185px] relative flex items-center justify-between px-2">
                  <div className="w-[45%] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.anomalyOverview}
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                          className="outline-none"
                        >
                          {data?.anomalyOverview?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />
                          ))}
                        </Pie>
                        <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="15" fontWeight="bold">
                          {data?.anomalies || '0'}
                        </text>
                        <text x="50%" y="42%" dy={15} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="9">
                          Total
                        </text>
                        <RechartsTooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-[52%] flex flex-col justify-center gap-1">
                    {data?.anomalyOverview?.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-[9.5px]">
                        <div className="flex items-center gap-1.5 truncate pr-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-300 truncate">{item.name}</span>
                        </div>
                        <span className="text-white font-medium shrink-0">{item.value}</span>
                      </div>
                    ))}
                    <button className="text-[9.5px] text-cyan-400 hover:underline font-medium mt-1 text-left">View all anomalies →</button>
                  </div>
                </div>
              </StandardChartCard>
            </div>

            {/* Row 3 — Top Event Sources & Top Event Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <StandardChartCard title="Top Event Sources" isLoading={isLoading} isEmpty={isEmpty || !data?.topSources?.length}>
                <div className="flex flex-col justify-between h-[160px]">
                  <div className="max-h-[125px] overflow-y-auto pr-2 custom-scrollbar">
                    <table className="w-full text-left text-[10.5px]">
                      <thead>
                        <tr className="border-b border-white/[0.05]">
                          <th className="text-[9.5px] text-slate-400 font-medium pb-1.5 uppercase tracking-wider">Source</th>
                          <th className="text-[9.5px] text-slate-400 font-medium pb-1.5 text-right uppercase tracking-wider">Events</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03] text-slate-300">
                        {data?.topSources?.map(s => (
                          <tr key={s.source} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setFilterSource(s.source)}>
                            <td className="py-2 text-slate-200 truncate max-w-[280px]">{s.source}</td>
                            <td className="py-2 text-white font-mono text-right">{s.events.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-2 text-left mt-auto">
                    <button className="text-[10px] text-cyan-400 hover:underline font-medium">View all sources →</button>
                  </div>
                </div>
              </StandardChartCard>

              <StandardChartCard title="Top Event Types" isLoading={isLoading} isEmpty={isEmpty || !data?.topTypes?.length}>
                <div className="flex flex-col justify-between h-[160px]">
                  <div className="max-h-[125px] overflow-y-auto pr-2 custom-scrollbar">
                    <table className="w-full text-left text-[10.5px]">
                      <thead>
                        <tr className="border-b border-white/[0.05]">
                          <th className="text-[9.5px] text-slate-400 font-medium pb-1.5 uppercase tracking-wider">Event Type</th>
                          <th className="text-[9.5px] text-slate-400 font-medium pb-1.5 text-right uppercase tracking-wider">Events</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03] text-slate-300">
                        {data?.topTypes?.map(t => (
                          <tr key={t.eventType} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setFilterType(t.eventType)}>
                            <td className="py-2 text-slate-200 truncate max-w-[280px]">{t.eventType}</td>
                            <td className="py-2 text-white font-mono text-right">{t.events.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-2 text-left mt-auto">
                    <button className="text-[10px] text-cyan-400 hover:underline font-medium">View all types →</button>
                  </div>
                </div>
              </StandardChartCard>
            </div>

            {/* Row 4 — Latest Events Table */}
            <div className="mt-1">
              {filteredEvents.length === 0 && !isLoading && !isError ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 bg-black/5 border border-white/[0.05] rounded-[10px]">
                  <div className="text-slate-500 mb-1"><MdFilterList size={28} /></div>
                  <h3 className="text-[12px] font-bold text-white">No events found</h3>
                  <p className="text-[10.5px] text-slate-400">No events match the selected filters. Try changing filters or time range.</p>
                  <button onClick={() => {
                    setFilterSource('All Sources')
                    setFilterType('All Types')
                    setFilterSeverity('All Severities')
                    setFilterTenant('All Tenants')
                    setQuickFilter('none')
                    setSearchQuery('')
                  }} className="mt-2 px-3 py-1 bg-black/10 border border-white/[0.08] text-slate-200 text-[10px] rounded hover:bg-white/[0.08] transition-colors">Clear Filters</button>
                </div>
              ) : (
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-1.5 [&_th]:py-2 [&_td]:px-3 [&_th]:px-3 text-[10.5px] transition-all duration-200 hover:border-white/[0.12]">
                  <DetailTable
                    title="Latest Events"
                    searchable={false}
                    data={filteredEvents}
                    columns={[
                      { key: 'time', label: 'Time', render: v => <span className="font-mono text-[10px] text-slate-400">{v}</span> },
                      { key: 'eventType', label: 'Event Type', render: v => <span className="text-slate-200">{v}</span> },
                      { key: 'eventName', label: 'Event Name', render: v => <span className="text-white font-medium">{v}</span> },
                      { key: 'source', label: 'Source', render: v => <span className="text-slate-300">{v}</span> },
                      { key: 'tenant', label: 'Tenant', render: v => <span className="text-slate-400">{v}</span> },
                      { 
                        key: 'severity', 
                        label: 'Severity',
                        render: (v) => {
                          const cls = v === 'High' || v === 'Critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : v === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                          return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${cls}`}>{v}</span>
                        }
                      },
                      { 
                        key: 'status', 
                        label: 'Status',
                        render: (v) => <span className="px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border-emerald-500/20">{v}</span>
                      },
                      { 
                        key: 'outcome', 
                        label: 'Outcome',
                        render: (v) => {
                          const cls = v === 'Success' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${cls}`}>{v}</span>
                        }
                      },
                      {
                        key: 'actions',
                        label: 'Actions',
                        render: (_, row) => (
                          <button className="text-slate-400 hover:text-cyan-400 transition-colors" title="View Details">
                            <MdVisibility size={14} />
                          </button>
                        )
                      }
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}