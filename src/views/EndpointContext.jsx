import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { MdRefresh, MdWarningAmber, MdSearch, MdFilterList, MdVisibility } from 'react-icons/md'
import { fetchEndpointContextKPIs } from '../api/threatOpsApi'
import { endpointContextKpis } from '../data/threatOpsEndpointContextKpis'
import { ActSection } from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import StandardChartCard from '../components/StandardChartCard'
import DetailTable from '../components/DetailTable'

// ── Shared styles ─────────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: '#0d1117',
    border: '1px solid #1f2937',
    borderRadius: 8,
    fontSize: 12,
    color: '#e5e7eb',
  },
  itemStyle: { color: '#e5e7eb' },
  cursor: { stroke: 'rgba(255,255,255,0.1)' }
}

const riskColors = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#3b82f6',
}

// ── Badges ───────────────────────────────────────────────────────────────────
function RiskBadge({ val }) {
  const v = val?.toLowerCase()
  let color = 'text-gray-400 bg-gray-500/20'
  if (v === 'critical') color = 'text-red-400 bg-red-500/20'
  else if (v === 'high') color = 'text-orange-400 bg-orange-500/20'
  else if (v === 'medium') color = 'text-yellow-400 bg-yellow-500/20'
  else if (v === 'low') color = 'text-blue-400 bg-blue-500/20'
  return <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${color}`}>{val}</span>
}

function StatusBadge({ val }) {
  const v = val?.toLowerCase()
  let color = 'text-gray-400 bg-gray-500/20'
  if (v === 'active') color = 'text-green-400 bg-green-500/20'
  else if (v === 'offline') color = 'text-gray-400 bg-gray-500/20'
  else if (v === 'isolated' || v === 'quarantined') color = 'text-purple-400 bg-purple-500/20'
  else if (v === 'cleaned') color = 'text-blue-400 bg-blue-500/20'
  return <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${color}`}>{val}</span>
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ cols, children }) {
  return (
    <div
      className="grid gap-4"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {children}
    </div>
  )
}

// ── Custom Gauge Component ────────────────────────────────────────────────────
function Gauge({ value, title, subtext, min = 0, max = 100, colorMap, formatValue, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="w-32 h-16 bg-[#1f2937] rounded-t-full animate-pulse mb-2"></div>
        <div className="w-16 h-4 bg-[#1f2937] rounded animate-pulse"></div>
      </div>
    )
  }

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  // Determine color based on ranges
  let activeColor = '#3b82f6'
  for (const range of colorMap) {
    if (value >= range.min && value <= range.max) {
      activeColor = range.color
      break
    }
  }

  const radius = 60
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <div className="relative w-32 h-16 mb-2 overflow-hidden">
        {/* Background Arc */}
        <svg className="absolute top-0 left-0 w-full h-[200%]" viewBox="0 0 140 140">
          <path
            d={`M 10 70 A 60 60 0 0 1 130 70`}
            fill="none"
            stroke="#1f2937"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Foreground Arc */}
          <path
            d={`M 10 70 A 60 60 0 0 1 130 70`}
            fill="none"
            stroke={activeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      </div>
      <div className="flex flex-col items-center z-10">
        <span className="text-3xl font-bold text-white leading-none">{value}</span>
        <span className="text-[11px] font-semibold mt-1 px-2 py-0.5 rounded" style={{ color: activeColor, backgroundColor: `${activeColor}20` }}>
          {formatValue ? formatValue(value) : value}
        </span>
        <span className="text-[10px] text-[#6b7280] mt-1">{subtext}</span>
      </div>
    </div>
  )
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function EndpointContext({ selectedTime, setActive }) {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]   = useState(false)
  
  // Filters
  const [filterType, setFilterType] = useState('All Types')
  const [filterStatus, setFilterStatus] = useState('All Statuses')
  const [filterRisk, setFilterRisk] = useState('All Risks')
  const [filterOS, setFilterOS] = useState('All OS')
  const [filterGroup, setFilterGroup] = useState('All Groups')
  const [filterSource, setFilterSource] = useState('All Sources')
  const [searchQuery, setSearchQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState('none')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchEndpointContextKPIs(selectedTime)
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
    endpointContextKpis.some(k => data[k.key] === undefined)

  const lastUpdated = data?._lastUpdated
  const isStale = lastUpdated && (Date.now() - new Date(lastUpdated).getTime() > 15 * 60 * 1000)
  
  const handleKpiClick = (kpi) => {
    setSearchQuery('')
    setQuickFilter(kpi.drillDownFilter || 'none')
  }

  // Filter Table Data
  const filteredEndpoints = data?.topRiskEndpointsData?.filter(e => 
    (!searchQuery || e.endpoint.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterStatus === 'All Statuses' || e.status === filterStatus) &&
    (filterRisk === 'All Risks' || e.riskLevel === filterRisk) &&
    (quickFilter === 'none' || quickFilter === 'risk' || (quickFilter === 'active' && e.status === 'Active') || (quickFilter === 'offline' && e.status === 'Offline'))
  ) || []

  const filteredProcesses = data?.topSuspiciousProcessesData?.filter(p => 
    (!searchQuery || p.processName.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterRisk === 'All Risks' || p.riskLevel === filterRisk) &&
    (quickFilter === 'none' || quickFilter === 'processes')
  ) || []

  const filteredMalware = data?.recentMalwareDetectionsData?.filter(m => 
    (!searchQuery || m.malwareName.toLowerCase().includes(searchQuery.toLowerCase()) || m.endpoint.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterSource === 'All Sources' || m.source === filterSource) &&
    (quickFilter === 'none' || quickFilter === 'malware')
  ) || []

  // Reusable card renderer
  const card = (kpi) => {
    if (kpi.visualization === 'gauge') {
      const isRisk = kpi.key === 'endpointRisk'
      const colorMap = isRisk ? [
        { min: 0, max: 30, color: '#39FF6A', label: 'Low Risk' },
        { min: 31, max: 70, color: '#F59E0B', label: 'Medium Risk' },
        { min: 71, max: 100, color: '#EF4444', label: 'High Risk' }
      ] : [
        { min: 0, max: 49, color: '#EF4444', label: 'Poor' },
        { min: 50, max: 79, color: '#F59E0B', label: 'Medium' },
        { min: 80, max: 100, color: '#39FF6A', label: 'Good' }
      ]

      return (
        <div key={kpi.key} onClick={() => handleKpiClick(kpi)} className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden flex flex-col relative group cursor-pointer hover:border-[#374151] transition-all h-full min-h-[140px]">
           <div className="px-4 pt-4 pb-2 flex justify-between items-center z-10">
             <span className="text-[13px] font-semibold text-[#e5e7eb]">{kpi.title}</span>
           </div>
           <div className="flex-1 flex justify-center items-end relative overflow-visible">
              <Gauge 
                value={data?.[kpi.key] || 0} 
                title={kpi.title} 
                subtext={kpi.key === 'endpointRisk' ? 'Risk Score (0-100)' : 'Trust Score (0-100)'} 
                colorMap={colorMap}
                formatValue={(v) => {
                  const range = colorMap.find(r => v >= r.min && v <= r.max)
                  return range ? range.label : v
                }}
                isLoading={isLoading}
              />
           </div>
        </div>
      )
    }

    return (
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
  }

  const endpointCols = [
    { header: 'Endpoint', accessor: 'endpoint', render: (val) => <span className="font-semibold text-white">{val}</span> },
    { header: 'Risk Score', accessor: 'riskScore', render: (val) => <span className="font-mono text-[13px]">{val}</span> },
    { header: 'Risk Level', accessor: 'riskLevel', render: (val) => <RiskBadge val={val} /> },
    { header: 'Last Seen', accessor: 'lastSeen' },
    { header: 'Status', accessor: 'status', render: (val) => <StatusBadge val={val} /> },
    { header: 'Actions', accessor: 'actions', render: () => (
      <div className="flex gap-2">
        <button className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-gray-300 transition-colors" title="View Details">
          <MdVisibility size={14} />
        </button>
      </div>
    ) }
  ]

  const processCols = [
    { header: 'Process Name', accessor: 'processName', render: (val) => <span className="font-medium text-[#e5e7eb]">{val}</span> },
    { header: 'Affected Endpoints', accessor: 'affectedEndpoints' },
    { header: 'Risk Level', accessor: 'riskLevel', render: (val) => <RiskBadge val={val} /> },
    { header: 'Detections', accessor: 'detectionCount', render: (val) => <span className="font-mono">{val}</span> },
  ]

  const malwareCols = [
    { header: 'Malware Name', accessor: 'malwareName', render: (val) => <span className="font-medium text-[#e5e7eb]">{val}</span> },
    { header: 'Severity', accessor: 'severity', render: (val) => <RiskBadge val={val} /> },
    { header: 'Endpoint', accessor: 'endpoint', render: (val) => <span className="text-[#9ca3af]">{val}</span> },
    { header: 'Detected At', accessor: 'detectedAt' },
    { header: 'Source', accessor: 'source' },
    { header: 'Status', accessor: 'status', render: (val) => <StatusBadge val={val} /> },
    { header: 'Actions', accessor: 'actions', render: () => (
      <div className="flex gap-2">
        <button className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-gray-300 transition-colors" title="View Details">
          <MdVisibility size={14} />
        </button>
      </div>
    ) }
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide bg-[#0B0F12]">
      <div className="flex flex-col gap-4 px-7 pt-6 pb-12">
        
        {/* ── Header & Toolbar ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
                Environment
              </p>
              <h1 className="text-[26px] font-bold text-white leading-tight">Endpoint Context</h1>
              <p className="text-[#9ca3af] text-[13px] mt-1">Monitor endpoint health, risk, anomalies and security posture across your environment.</p>
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
          
          {/* Advanced Filter Bar */}
          <div className="flex items-center justify-between bg-[#0d1117] border border-[#1f2937] rounded-[8px] p-2 mt-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <div className="relative group">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" size={16} />
                <input 
                  type="text" 
                  placeholder="Search endpoints..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-[#111827] border border-[#1f2937] rounded-[6px] text-[12px] text-white focus:outline-none focus:border-[#3b82f6] transition-colors w-56 placeholder-[#4b5563]"
                />
              </div>

              <div className="w-[1px] h-5 bg-[#1f2937] mx-1"></div>
              
              <select 
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-[#111827] border border-[#1f2937] text-white text-[12px] px-3 py-1.5 rounded-[6px] outline-none cursor-pointer hover:border-[#374151] transition-colors"
              >
                <option value="All Types">Endpoint Type</option>
                <option value="Workstation">Workstation</option>
                <option value="Server">Server</option>
                <option value="Mobile">Mobile</option>
              </select>

              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-[#111827] border border-[#1f2937] text-white text-[12px] px-3 py-1.5 rounded-[6px] outline-none cursor-pointer hover:border-[#374151] transition-colors"
              >
                <option value="All Statuses">Status</option>
                <option value="Active">Active</option>
                <option value="Offline">Offline</option>
                <option value="Isolated">Isolated</option>
              </select>

              <select 
                value={filterRisk}
                onChange={e => setFilterRisk(e.target.value)}
                className="bg-[#111827] border border-[#1f2937] text-white text-[12px] px-3 py-1.5 rounded-[6px] outline-none cursor-pointer hover:border-[#374151] transition-colors"
              >
                <option value="All Risks">Risk Level</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              
              <select 
                value={filterOS}
                onChange={e => setFilterOS(e.target.value)}
                className="bg-[#111827] border border-[#1f2937] text-white text-[12px] px-3 py-1.5 rounded-[6px] outline-none cursor-pointer hover:border-[#374151] transition-colors"
              >
                <option value="All OS">OS</option>
                <option value="Windows">Windows</option>
                <option value="Linux">Linux</option>
                <option value="macOS">macOS</option>
              </select>
              
              {quickFilter !== 'none' && (
                <button 
                  onClick={() => setQuickFilter('none')}
                  className="flex items-center gap-1.5 bg-htb-green/10 border border-htb-green/30 text-htb-green text-[11px] font-medium px-2.5 py-1 rounded-[4px] hover:bg-htb-green/20 ml-2"
                >
                  Clear KPI Filter
                </button>
              )}
            </div>
            
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] text-[#9ca3af] hover:text-white transition-colors whitespace-nowrap">
              <MdFilterList size={14} />
              Advanced
            </button>
          </div>
        </div>

        {/* ── Partial data banner ─────────────────────────────── */}
        <AnimatePresence>
          {isPartial && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-[#1c1a10] border border-yellow-700/40 rounded-[8px] px-4 py-2.5 mb-2"
            >
              <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
              <span className="text-[12px] text-yellow-300/80">
                Some endpoint data is currently unavailable. Showing partial results.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Full error state ─────────────────────────────────── */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20"
          >
            <div className="text-red-400/60 text-5xl">⚠</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">Failed to load endpoint context data.</p>
            <p className="text-[12px] text-[#4a5568]">The backend might be temporarily unavailable.</p>
            <button
              onClick={loadData}
              className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ── Dashboard Content ────────────────────────────────── */}
        {!isError && (
          <div className="flex flex-col gap-6 mt-2">
            
            {/* KPI Grid */}
            <Row cols={4}>
               {endpointContextKpis.slice(0, 4).map(card)}
               {endpointContextKpis.slice(4, 8).map(card)}
            </Row>

            <ActSection act="act1">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <StandardChartCard
                  title="Endpoint Risk Over Time"
                  type="default"
                  isLoading={isLoading}
                  isEmpty={isEmpty || (data?.riskTrendChart?.length === 0)}
                  headerRight={
                    <select className="bg-transparent text-[#9ca3af] text-[11px] outline-none cursor-pointer">
                      <option>All Endpoints</option>
                      <option>High Risk Only</option>
                    </select>
                  }
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart
                      data={data?.riskTrendChart || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      onClick={(data) => {
                         if(data) setQuickFilter('risk')
                      }}
                    >
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="t" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RechartsTooltip {...tooltipStyle} />
                      <Area type="monotone" dataKey="riskScore" name="Risk Score" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </StandardChartCard>
                
                <div className="grid grid-cols-2 gap-4">
                  <StandardChartCard
                    title="Risk Distribution"
                    type="default"
                    isLoading={isLoading}
                    isEmpty={isEmpty}
                  >
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data?.riskDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          onClick={(entry) => setFilterRisk(entry.name)}
                          className="cursor-pointer"
                        >
                          {(data?.riskDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip {...tooltipStyle} />
                        <Legend verticalAlign="middle" layout="vertical" align="right" wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-[58%] left-[45%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                      <span className="text-xl font-bold text-white leading-none">{data?.activeEndpoints || 0}</span>
                      <span className="text-[10px] text-[#6b7280]">Total Endpoints</span>
                    </div>
                  </StandardChartCard>
                  
                  <StandardChartCard
                    title="Endpoint Status"
                    type="default"
                    isLoading={isLoading}
                    isEmpty={isEmpty}
                  >
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data?.statusDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          onClick={(entry) => setFilterStatus(entry.name)}
                          className="cursor-pointer"
                        >
                          {(data?.statusDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip {...tooltipStyle} />
                        <Legend verticalAlign="middle" layout="vertical" align="right" wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-[58%] left-[45%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                       <span className="text-xl font-bold text-white leading-none">{data?.activeEndpoints || 0}</span>
                       <span className="text-[10px] text-[#6b7280]">Total Endpoints</span>
                    </div>
                  </StandardChartCard>
                </div>
              </div>
            </ActSection>

          </div>
        )}
      </div>
    </div>
  )
}
