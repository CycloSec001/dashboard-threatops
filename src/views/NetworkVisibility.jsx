import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  MdRefresh, MdWarningAmber, MdSearch, MdFilterList, MdVisibility,
} from 'react-icons/md'
import { fetchNetworkVisibilityKPIs } from '../api/threatOpsApi'
import { networkVisibilityKpis } from '../data/threatOpsNetworkVisibilityKpis'
import { ActSection } from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import StandardChartCard from '../components/StandardChartCard'
import DetailTable from '../components/DetailTable'

// ── Shared tooltip style ──────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: '#0d1117',
    border: '1px solid #1f2937',
    borderRadius: 8,
    fontSize: 12,
    color: '#e5e7eb',
  },
  itemStyle: { color: '#e5e7eb' },
  cursor: { stroke: 'rgba(255,255,255,0.08)' },
}

// ── Risk / Severity badge ─────────────────────────────────────────────────────
function SeverityBadge({ val }) {
  const v = val?.toLowerCase()
  let cls = 'text-gray-400 bg-gray-500/20'
  if (v === 'critical')     cls = 'text-red-400 bg-red-500/20'
  else if (v === 'high')    cls = 'text-orange-400 bg-orange-500/20'
  else if (v === 'medium')  cls = 'text-yellow-400 bg-yellow-500/20'
  else if (v === 'low')     cls = 'text-blue-400 bg-blue-500/20'
  return <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${cls}`}>{val}</span>
}

function StatusBadge({ val }) {
  const v = val?.toLowerCase()
  let cls = 'text-gray-400 bg-gray-500/20'
  if (v === 'open')           cls = 'text-red-400 bg-red-500/20'
  else if (v === 'investigating') cls = 'text-yellow-400 bg-yellow-500/20'
  else if (v === 'resolved')  cls = 'text-green-400 bg-green-500/20'
  return <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${cls}`}>{val}</span>
}

// ── Custom Donut center label ─────────────────────────────────────────────────
function DonutCenter({ total, label }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-[18px] font-bold text-white leading-none">{total}</span>
      <span className="text-[10px] text-[#6b7280] mt-0.5">{label}</span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NetworkVisibility({ selectedTime }) {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]   = useState(false)

  // Filters
  const [filterSource,    setFilterSource]    = useState('All Sources')
  const [filterDest,      setFilterDest]      = useState('All Destinations')
  const [filterProtocol,  setFilterProtocol]  = useState('All Protocols')
  const [filterSeverity,  setFilterSeverity]  = useState('All Severities')
  const [filterDirection, setFilterDirection] = useState('All Directions')
  const [searchQuery,     setSearchQuery]     = useState('')
  const [quickFilter,     setQuickFilter]     = useState('none')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchNetworkVisibilityKPIs(selectedTime)
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
    networkVisibilityKpis.some(k => data[k.key] === undefined)

  const lastUpdated = data?._lastUpdated
  const isStale = lastUpdated && (Date.now() - new Date(lastUpdated).getTime() > 15 * 60 * 1000)

  const handleKpiClick = (kpi) => {
    setSearchQuery('')
    setFilterSeverity('All Severities')
    setFilterProtocol('All Protocols')
    setQuickFilter(kpi.drillDownFilter || 'none')
  }

  // ── Filtered table data ───────────────────────────────────────────────
  const filteredConnections = (data?.suspiciousConnectionsData || []).filter(r =>
    (filterProtocol === 'All Protocols' || r.protocol === filterProtocol) &&
    (filterSeverity === 'All Severities' || r.severity === filterSeverity) &&
    (!searchQuery || r.srcIp.includes(searchQuery) || r.dstIp.includes(searchQuery)) &&
    (quickFilter === 'none' || quickFilter === 'all_events' || quickFilter === 'suspicious' || quickFilter === 'high_risk')
  )

  const filteredBeaconing = (data?.beaconingHostsData || []).filter(r =>
    (!searchQuery || r.hostName.toLowerCase().includes(searchQuery.toLowerCase()) || r.host.includes(searchQuery)) &&
    (quickFilter === 'none' || quickFilter === 'beaconing' || quickFilter === 'all_events')
  )

  const filteredAnomalies = (data?.networkAnomaliesData || []).filter(r =>
    (filterSeverity === 'All Severities' || r.severity === filterSeverity) &&
    (!searchQuery || r.anomalyType.toLowerCase().includes(searchQuery.toLowerCase()) || r.source.includes(searchQuery)) &&
    (quickFilter === 'none' || quickFilter === 'anomalies' || quickFilter === 'all_events' || quickFilter === 'lateral')
  )

  // ── Total for donut centres ───────────────────────────────────────────
  const totalProtocol = (data?.topProtocols || []).reduce((s, d) => s + d.value, 0)
  const totalDirection = (data?.trafficDirection || []).reduce((s, d) => s + d.value, 0)

  // ── Reusable card renderer ────────────────────────────────────────────
  const card = (kpi) => (
    <OverviewMetricCard
      key={kpi.key}
      config={kpi}
      value={data?.[kpi.key]}
      trend={data?.[`${kpi.key}Trend`]}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onClick={() => handleKpiClick(kpi)}
    />
  )

  // ── Column definitions ────────────────────────────────────────────────
  const connCols = [
    { header: 'Source IP',   accessor: 'srcIp',      render: v => <span className="font-mono text-[11px] text-[#00D9FF]">{v}</span> },
    { header: 'Destination', accessor: 'dstIp',      render: v => <span className="font-mono text-[11px] text-[#e5e7eb]">{v}</span> },
    { header: 'Port',        accessor: 'dstPort',    render: v => <span className="font-mono text-[11px]">{v}</span> },
    { header: 'Protocol',    accessor: 'protocol' },
    { header: 'Risk Score',  accessor: 'riskScore',  render: v => <span className="font-mono font-bold">{v}</span> },
    { header: 'Severity',    accessor: 'severity',   render: v => <SeverityBadge val={v} /> },
    { header: 'Events',      accessor: 'eventCount', render: v => <span className="font-mono">{v}</span> },
    { header: 'First Seen',  accessor: 'firstSeen' },
    { header: 'Last Seen',   accessor: 'lastSeen' },
    { header: 'Actions',     accessor: 'actions',    render: () => (
      <button className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-gray-300 transition-colors" title="View Details">
        <MdVisibility size={14} />
      </button>
    )},
  ]

  const beaconCols = [
    { header: 'Host/IP',      accessor: 'host',        render: v => <span className="font-mono text-[11px] text-[#00D9FF]">{v}</span> },
    { header: 'Host Name',    accessor: 'hostName',    render: v => <span className="font-semibold text-white">{v}</span> },
    { header: 'Destination',  accessor: 'destination', render: v => <span className="font-mono text-[11px] text-[#e5e7eb]">{v}</span> },
    { header: 'Beacon Count', accessor: 'beaconCount', render: v => <span className="font-mono font-bold">{v}</span> },
    { header: 'First Seen',   accessor: 'firstSeen' },
    { header: 'Last Seen',    accessor: 'lastSeen' },
    { header: 'Risk',         accessor: 'risk',        render: v => <SeverityBadge val={v} /> },
    { header: 'Actions',      accessor: 'actions',     render: () => (
      <button className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-gray-300 transition-colors" title="View Details">
        <MdVisibility size={14} />
      </button>
    )},
  ]

  const anomalyCols = [
    { header: 'Timestamp',    accessor: 'timestamp' },
    { header: 'Anomaly Type', accessor: 'anomalyType', render: v => <span className="font-semibold text-white">{v}</span> },
    { header: 'Source',       accessor: 'source',      render: v => <span className="font-mono text-[11px] text-[#00D9FF]">{v}</span> },
    { header: 'Destination',  accessor: 'destination', render: v => <span className="font-mono text-[11px] text-[#e5e7eb]">{v}</span> },
    { header: 'Severity',     accessor: 'severity',    render: v => <SeverityBadge val={v} /> },
    { header: 'Risk Score',   accessor: 'riskScore',   render: v => <span className="font-mono font-bold">{v}</span> },
    { header: 'Status',       accessor: 'status',      render: v => <StatusBadge val={v} /> },
    { header: 'Actions',      accessor: 'actions',     render: () => (
      <button className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-gray-300 transition-colors" title="View Details">
        <MdVisibility size={14} />
      </button>
    )},
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide bg-[#0B0F12]">
      <div className="flex flex-col gap-4 px-7 pt-6 pb-12">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
                Environment
              </p>
              <h1 className="text-[26px] font-bold text-white leading-tight">Network Visibility</h1>
              <p className="text-[#9ca3af] text-[13px] mt-1">
                Monitor network activity, detect suspicious behavior and investigate network threats.
              </p>
            </div>

            <div className="flex flex-col items-end gap-3 mt-1">
              {lastUpdated && !isLoading && !isError && (
                <div className="flex items-center gap-2">
                  {isStale && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-[4px]">
                      <MdWarningAmber size={12} /> STALE
                    </span>
                  )}
                  <span className="text-[11px] text-[#4a5568]">
                    Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <motion.button
                onClick={loadData}
                disabled={isLoading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-[#111827] border border-[#1f2937] text-[12px] font-medium text-[#9ca3af] hover:text-white hover:border-[#374151] transition-all disabled:opacity-40"
              >
                <motion.div
                  animate={{ rotate: isLoading ? 360 : 0 }}
                  transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}
                >
                  <MdRefresh size={13} />
                </motion.div>
                Refresh
              </motion.button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center justify-between bg-[#0d1117] border border-[#1f2937] rounded-[8px] p-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" size={16} />
                <input
                  type="text"
                  placeholder="Search IPs, hosts, anomalies..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-[#111827] border border-[#1f2937] rounded-[6px] text-[12px] text-white focus:outline-none focus:border-[#3b82f6] transition-colors w-64 placeholder-[#4b5563]"
                />
              </div>

              <div className="w-[1px] h-5 bg-[#1f2937] mx-1" />

              {[
                { label: 'Source',    val: filterSource,    set: setFilterSource,    opts: ['All Sources','Internal','External'] },
                { label: 'Protocol',  val: filterProtocol,  set: setFilterProtocol,  opts: ['All Protocols','TCP','UDP','DNS','HTTPS','ICMP'] },
                { label: 'Severity',  val: filterSeverity,  set: setFilterSeverity,  opts: ['All Severities','Critical','High','Medium','Low'] },
                { label: 'Direction', val: filterDirection, set: setFilterDirection, opts: ['All Directions','Int → Int','Int → Ext','Ext → Int','Ext → Ext'] },
              ].map(({ label, val, set, opts }) => (
                <select
                  key={label}
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="bg-[#111827] border border-[#1f2937] text-white text-[12px] px-3 py-1.5 rounded-[6px] outline-none cursor-pointer hover:border-[#374151] transition-colors"
                >
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}

              {quickFilter !== 'none' && (
                <button
                  onClick={() => setQuickFilter('none')}
                  className="flex items-center gap-1.5 bg-htb-green/10 border border-htb-green/30 text-htb-green text-[11px] font-medium px-2.5 py-1 rounded-[4px] hover:bg-htb-green/20 ml-2 whitespace-nowrap"
                >
                  Clear KPI Filter
                </button>
              )}
            </div>

            <button className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] text-[#9ca3af] hover:text-white transition-colors whitespace-nowrap ml-2">
              <MdFilterList size={14} />
              Advanced
            </button>
          </div>
        </div>

        {/* ── Partial data banner ────────────────────────────── */}
        <AnimatePresence>
          {isPartial && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-[#1c1a10] border border-yellow-700/40 rounded-[8px] px-4 py-2.5"
            >
              <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
              <span className="text-[12px] text-yellow-300/80">
                Some network data sources are currently unavailable. Showing partial results.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error state ────────────────────────────────────── */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20"
          >
            <div className="text-red-400/60 text-5xl">⚠</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">Failed to load network visibility data.</p>
            <p className="text-[12px] text-[#4a5568]">The network telemetry service may be temporarily unavailable.</p>
            <button
              onClick={loadData}
              className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ── Dashboard ──────────────────────────────────────── */}
        {!isError && (
          <div className="flex flex-col gap-6 mt-2">

            {/* KPI Row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {networkVisibilityKpis.slice(0, 4).map(card)}
            </div>

            {/* KPI Row 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {networkVisibilityKpis.slice(4, 7).map(card)}
            </div>

            {/* Act 1 — Area chart + two donuts */}
            <ActSection act="act1">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Network Events Over Time — takes 2/3 width */}
                <div className="xl:col-span-2">
                  <StandardChartCard
                    title="Network Events Over Time"
                    type="default"
                    isLoading={isLoading}
                    isEmpty={isEmpty || (data?.eventsOverTime?.length === 0)}
                  >
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart
                        data={data?.eventsOverTime || []}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="gradEvents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#00D9FF" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#00D9FF" stopOpacity={0}    />
                          </linearGradient>
                          <linearGradient id="gradSusp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="t" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                        <RechartsTooltip {...tooltipStyle} />
                        <Area type="monotone" dataKey="events"     name="Events"     stroke="#00D9FF" strokeWidth={2} fill="url(#gradEvents)" />
                        <Area type="monotone" dataKey="suspicious" name="Suspicious" stroke="#EF4444" strokeWidth={1.5} fill="url(#gradSusp)"   />
                      </AreaChart>
                    </ResponsiveContainer>
                  </StandardChartCard>
                </div>

                {/* Top Protocols + Traffic Direction stacked in 1/3 */}
                <div className="flex flex-col gap-4">
                  <StandardChartCard
                    title="Top Protocols"
                    type="default"
                    isLoading={isLoading}
                    isEmpty={isEmpty}
                  >
                    <div className="relative">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={data?.topProtocols || []}
                            cx="40%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={72}
                            paddingAngle={2}
                            dataKey="value"
                            onClick={entry => setFilterProtocol(entry.name)}
                            className="cursor-pointer"
                          >
                            {(data?.topProtocols || []).map((e, i) => (
                              <Cell key={i} fill={e.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip {...tooltipStyle} />
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-[50%] left-[40%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                        <span className="text-[15px] font-bold text-white leading-none">
                          {totalProtocol > 1000000
                            ? `${(totalProtocol / 1000000).toFixed(1)}M`
                            : `${(totalProtocol / 1000).toFixed(0)}K`}
                        </span>
                        <span className="text-[9px] text-[#6b7280]">Total</span>
                      </div>
                    </div>
                  </StandardChartCard>

                  <StandardChartCard
                    title="Traffic Direction"
                    type="default"
                    isLoading={isLoading}
                    isEmpty={isEmpty}
                  >
                    <div className="relative">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={data?.trafficDirection || []}
                            cx="40%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={72}
                            paddingAngle={2}
                            dataKey="value"
                            onClick={entry => setFilterDirection(entry.name)}
                            className="cursor-pointer"
                          >
                            {(data?.trafficDirection || []).map((e, i) => (
                              <Cell key={i} fill={e.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip {...tooltipStyle} />
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-[50%] left-[40%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                        <span className="text-[15px] font-bold text-white leading-none">{totalDirection.toLocaleString()}</span>
                        <span className="text-[9px] text-[#6b7280]">Flows</span>
                      </div>
                    </div>
                  </StandardChartCard>
                </div>
              </div>
            </ActSection>

            {/* Act 2 — Suspicious Connections table */}
            <ActSection act="act2">
              <DetailTable
                title="Top Suspicious Connections"
                description="Network connections with the highest risk scores and anomalous patterns."
                columns={connCols}
                data={filteredConnections}
                searchable={false}
              />
            </ActSection>

            {/* Act 3 — Beaconing Hosts table */}
            <ActSection act="act3">
              <DetailTable
                title="Top Beaconing Hosts"
                description="Endpoints exhibiting periodic beaconing activity to external destinations."
                columns={beaconCols}
                data={filteredBeaconing}
                searchable={false}
              />
            </ActSection>

            {/* Act 4 — Network Anomalies table */}
            <ActSection act="act4">
              <DetailTable
                title="Recent Network Anomalies"
                description="Detected behavioral anomalies across network telemetry."
                columns={anomalyCols}
                data={filteredAnomalies}
                searchable={false}
              />
            </ActSection>

          </div>
        )}
      </div>
    </div>
  )
}
