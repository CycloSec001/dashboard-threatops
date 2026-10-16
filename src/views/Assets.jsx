import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { MdRefresh, MdWarningAmber, MdSearch, MdFilterList, MdVisibility, MdCalendarToday } from 'react-icons/md'
import { fetchAssetsKPIs } from '../api/threatOpsApi'
import { assetsKpis } from '../data/threatOpsAssetsKpis'
import OverviewMetricCard from '../components/OverviewMetricCard'
import StandardChartCard from '../components/StandardChartCard'
import DetailTable from '../components/DetailTable'

// ── Shared tooltip style ───────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: '#0d1117',
    border: '1px solid #1f2937',
    borderRadius: 8,
    fontSize: 12,
    color: '#e5e7eb',
  },
  itemStyle: { color: '#e5e7eb' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ cols, children }) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`
      }}
    >
      {children}
    </div>
  )
}

export default function Assets({ selectedTime, setActive }) {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]   = useState(false)
  
  // Filters
  const [filterType, setFilterType] = useState('All Types')
  const [filterStatus, setFilterStatus] = useState('All Statuses')
  const [filterRisk, setFilterRisk] = useState('All Risks')
  const [filterSource, setFilterSource] = useState('All Sources')
  const [filterOwner, setFilterOwner] = useState('All Owners')
  const [quickFilter, setQuickFilter] = useState('none') // 'none', 'healthy', 'at-risk', 'critical', 'offline', 'unmanaged', 'newly-discovered'
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchAssetsKPIs(selectedTime)
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
    assetsKpis.some(k => data[k.key] === undefined)

  const lastUpdated = data?._lastUpdated
  const isStale = lastUpdated && (Date.now() - new Date(lastUpdated).getTime() > 15 * 60 * 1000)
  
  const handleKpiClick = (key) => {
    setFilterType('All Types')
    setFilterStatus('All Statuses')
    setFilterRisk('All Risks')
    setFilterSource('All Sources')
    setFilterOwner('All Owners')
    setSearchQuery('')
    
    if (key === 'healthyAssets') setQuickFilter('healthy')
    else if (key === 'atRiskAssets') setQuickFilter('at-risk')
    else if (key === 'criticalAssets') setQuickFilter('critical')
    else if (key === 'offlineAssets') setQuickFilter('offline')
    else if (key === 'unmanagedAssets') setQuickFilter('unmanaged')
    else setQuickFilter('none')
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

  const handleChartClick = (entry, type) => {
    setQuickFilter('none')
    if (type === 'risk') {
      setFilterRisk(entry.name)
    } else if (type === 'status') {
      setFilterStatus(entry.name)
    }
  }

  // Filter inventory
  const filteredInventory = (data?.inventory || []).filter(e => 
    (filterType === 'All Types' || e.assetType === filterType) &&
    (filterStatus === 'All Statuses' || e.status === filterStatus) &&
    (filterRisk === 'All Risks' || e.risk === filterRisk) &&
    (filterSource === 'All Sources' || e.source === filterSource) &&
    (filterOwner === 'All Owners' || e.owner === filterOwner) &&
    (
      quickFilter === 'none' || 
      (quickFilter === 'healthy' && e.risk === 'Healthy') ||
      (quickFilter === 'at-risk' && (e.risk === 'High' || e.risk === 'Medium' || e.risk === 'Critical')) ||
      (quickFilter === 'critical' && e.risk === 'Critical') ||
      (quickFilter === 'offline' && (e.status === 'Offline' || e.status === 'Stale')) ||
      (quickFilter === 'unmanaged' && e.status === 'Unmanaged') ||
      (quickFilter === 'newly-discovered' && data?.recentlyDiscovered?.some(rd => rd.id === e.id))
    ) &&
    (!searchQuery || e.assetName.toLowerCase().includes(searchQuery.toLowerCase()) || e.owner.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  const RiskBadge = ({ val }) => {
    const v = val?.toLowerCase()
    let color = 'text-gray-400 bg-gray-500/20'
    if (v === 'critical') color = 'text-red-400 bg-red-500/20'
    else if (v === 'high') color = 'text-orange-400 bg-orange-500/20'
    else if (v === 'medium') color = 'text-yellow-400 bg-yellow-500/20'
    else if (v === 'low') color = 'text-blue-400 bg-blue-500/20'
    else if (v === 'informational') color = 'text-purple-400 bg-purple-500/20'
    else if (v === 'healthy') color = 'text-green-400 bg-green-500/20'
    return <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${color}`}>{val}</span>
  }

  const StatusBadge = ({ val }) => {
    const v = val?.toLowerCase()
    let color = 'text-gray-400 bg-gray-500/20'
    if (v === 'online') color = 'text-green-400 bg-green-500/20'
    else if (v === 'offline') color = 'text-gray-400 bg-gray-500/20'
    else if (v === 'stale') color = 'text-yellow-400 bg-yellow-500/20'
    else if (v === 'unmanaged') color = 'text-purple-400 bg-purple-500/20'
    return <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${color}`}>{val}</span>
  }

  const inventoryCols = [
    { header: 'Asset', accessor: 'assetName' },
    { header: 'Type', accessor: 'assetType' },
    { header: 'Status', accessor: 'status', render: (val) => <StatusBadge val={val} /> },
    { header: 'Risk', accessor: 'risk', render: (val) => <RiskBadge val={val} /> },
    { header: 'Owner', accessor: 'owner' },
    { header: 'Last Seen', accessor: 'lastSeen' },
    { header: 'Source', accessor: 'source' },
    { header: 'Actions', accessor: 'actions', render: () => (
      <div className="flex gap-2">
        <button className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-gray-300 transition-colors" title="View Details">
          <MdVisibility size={14} />
        </button>
        <button className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-gray-300 transition-colors" title="Investigate">
          <span className="text-[10px] px-1 font-bold">...</span>
        </button>
      </div>
    ) }
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide bg-[#0B0F12]">
      <div className="flex flex-col gap-4 px-7 pt-6 pb-10">
        
        {/* ── Header & Toolbar ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Assets</h1>
              <p className="text-[#9ca3af] text-[13px] mt-1">Monitor, assess, and investigate assets across your environment.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" size={16} />
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-[#111827] border border-[#1f2937] rounded-[6px] text-[12px] text-white focus:outline-none focus:border-[#3b82f6] transition-colors w-64 placeholder-[#4b5563]"
                />
              </div>

              <div className="flex items-center gap-2 bg-[#111827] border border-[#1f2937] rounded-[6px] p-1">
                <button className="flex items-center gap-2 px-3 py-1 rounded-[4px] text-[12px] text-white hover:bg-[#1f2937] transition-colors">
                  <MdFilterList size={14} />
                  <span>Filters</span>
                </button>
                <div className="w-[1px] h-4 bg-[#1f2937]"></div>
                <select 
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="bg-transparent text-white text-[12px] px-2 py-1 outline-none cursor-pointer appearance-none"
                >
                  <option value="All Types">All Types</option>
                  <option value="Server">Server</option>
                  <option value="Workstation">Workstation</option>
                  <option value="Network Device">Network Device</option>
                  <option value="Database">Database</option>
                  <option value="IoT Device">IoT Device</option>
                </select>
                <div className="w-[1px] h-4 bg-[#1f2937]"></div>
                <select 
                  value={filterRisk}
                  onChange={e => setFilterRisk(e.target.value)}
                  className="bg-transparent text-white text-[12px] px-2 py-1 outline-none cursor-pointer appearance-none"
                >
                  <option value="All Risks">All Risks</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Informational">Informational</option>
                  <option value="Healthy">Healthy</option>
                </select>
                <div className="w-[1px] h-4 bg-[#1f2937]"></div>
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-transparent text-white text-[12px] px-2 py-1 outline-none cursor-pointer appearance-none"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Online">Online</option>
                  <option value="Stale">Stale</option>
                  <option value="Offline">Offline</option>
                  <option value="Unmanaged">Unmanaged</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#6b7280]">
                Filters applied: 
              </span>
              <div className="flex items-center gap-1.5">
                {[filterType, filterRisk, filterStatus, filterSource, filterOwner, quickFilter !== 'none' ? `Quick: ${quickFilter}` : null].filter(f => f && !f.startsWith('All') && f !== 'none').length > 0 ? (
                  [filterType, filterRisk, filterStatus, filterSource, filterOwner, quickFilter !== 'none' ? `Quick: ${quickFilter}` : null].filter(f => f && !f.startsWith('All') && f !== 'none').map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-[#1f2937] text-[#9ca3af] text-[10px] border border-[#374151]">
                      {f}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#4b5563]">None</span>
                )}
                
                {[filterType, filterRisk, filterStatus, filterSource, filterOwner, quickFilter !== 'none' ? `Quick: ${quickFilter}` : null].filter(f => f && !f.startsWith('All') && f !== 'none').length > 0 && (
                  <button 
                    onClick={() => {
                      setFilterType('All Types')
                      setFilterRisk('All Risks')
                      setFilterStatus('All Statuses')
                      setFilterSource('All Sources')
                      setFilterOwner('All Owners')
                      setQuickFilter('none')
                      setSearchQuery('')
                    }}
                    className="ml-2 text-[10px] text-blue-400 hover:text-blue-300"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                <span className={`w-1.5 h-1.5 rounded-full ${isStale ? 'bg-yellow-500' : 'bg-[#39FF6A]'}`}></span>
                Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Unknown'}
              </span>
              <button 
                onClick={loadData}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#9ca3af] hover:text-white transition-colors disabled:opacity-50"
              >
                <MdRefresh size={14} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── Stale Data Warning ─────────────────────────────────── */}
        <AnimatePresence>
          {isStale && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-[8px] p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <MdWarningAmber className="text-yellow-500" size={18} />
                <span className="text-[12px] text-yellow-500 font-medium">Asset data may be out of date. It was last refreshed more than 15 minutes ago.</span>
              </div>
              <button 
                onClick={loadData}
                className="text-[11px] font-bold text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1.5 rounded transition-colors"
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
            className="flex flex-col items-center justify-center gap-4 py-20"
          >
            <div className="text-red-400/60 text-5xl">⚠</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">Unable to load KPI data</p>
            <p className="text-[12px] text-[#4a5568]">The backend request failed.</p>
            <button
              onClick={loadData}
              className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ── KPI Grid ─────────────────────────────────────────── */}
        {!isError && (
          <div className="flex flex-col gap-6">
            {/* Row 1 — 6 metrics (Big Numbers) */}
            <Row cols={6}>
              {assetsKpis.map(card)}
            </Row>

            {/* Row 2 — Newly Discovered & Risk Distribution */}
            <div className="grid grid-cols-[2fr_1fr] gap-6">
              <StandardChartCard 
                title="Newly Discovered Assets" 
                isLoading={isLoading} 
                isEmpty={isEmpty} 
                isError={isError}
                onRetry={loadData}
                action={<span className="text-[11px] text-[#4b5563] cursor-pointer hover:text-[#9ca3af]" onClick={() => setQuickFilter('newly-discovered')}>View all</span>}
              >
                <div className="h-[240px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.newlyDiscoveredChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="t" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip {...tooltipStyle} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#39FF6A" 
                        strokeWidth={2} 
                        dot={{ fill: '#0B0F12', stroke: '#39FF6A', strokeWidth: 2, r: 4 }} 
                        activeDot={{ r: 6, fill: '#39FF6A', stroke: '#fff' }}
                        name="New Assets" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </StandardChartCard>

              <StandardChartCard 
                title="Asset Risk Distribution" 
                isLoading={isLoading} 
                isEmpty={isEmpty} 
                isError={isError}
                onRetry={loadData}
              >
                <div className="h-[240px] w-full pt-4 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.riskDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        onClick={(e) => handleChartClick(e, 'risk')}
                        className="cursor-pointer outline-none"
                      >
                        {(data?.riskDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={2} className="hover:opacity-80 transition-opacity" />
                        ))}
                      </Pie>
                      <RechartsTooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[20px] font-bold text-white leading-none">
                      {data?.totalAssets || 0}
                    </span>
                    <span className="text-[10px] text-[#6b7280] font-medium mt-1">Total Assets</span>
                  </div>
                  {/* Custom Legend */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none">
                    {(data?.riskDistribution || []).map(entry => (
                      <div key={entry.name} className="flex items-center gap-2 text-[10px]">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-[#9ca3af] w-20">{entry.name}</span>
                        <span className="text-white font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </StandardChartCard>
            </div>

            {/* Row 3 — Status Overview, Inventory, Recently Discovered */}
            <div className="grid grid-cols-[1fr_2.5fr_1.5fr] gap-6">
              
              <StandardChartCard 
                title="Asset Status Overview" 
                isLoading={isLoading} 
                isEmpty={isEmpty} 
                isError={isError}
                onRetry={loadData}
              >
                <div className="h-[400px] w-full pt-4 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.statusOverview || []}
                        cx="50%"
                        cy="40%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        onClick={(e) => handleChartClick(e, 'status')}
                        className="cursor-pointer outline-none"
                      >
                        {(data?.statusOverview || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={2} className="hover:opacity-80 transition-opacity" />
                        ))}
                      </Pie>
                      <RechartsTooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-x-0 top-[40%] -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[18px] font-bold text-white leading-none">
                      {data?.totalAssets || 0}
                    </span>
                    <span className="text-[10px] text-[#6b7280] font-medium mt-1">Total Assets</span>
                  </div>
                  {/* Legend below */}
                  <div className="absolute bottom-6 inset-x-0 flex flex-col gap-3 px-6 pointer-events-none">
                    {(data?.statusOverview || []).map(entry => (
                      <div key={entry.name} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-[#9ca3af]">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{entry.value}</span>
                          <span className="text-[#4b5563] text-[9px] w-8 text-right">
                            ({Math.round(entry.value / (data?.totalAssets ? (parseInt(String(data.totalAssets).replace(/,/g, ''), 10) || 1) : 1) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </StandardChartCard>

              <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] flex flex-col h-[482px]">
                {filteredInventory.length === 0 && !isLoading && !isError ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#1f2937] flex items-center justify-center mb-4">
                      <MdSearch className="text-[#4b5563]" size={28} />
                    </div>
                    <h3 className="text-white font-medium mb-1">No assets found</h3>
                    <p className="text-[#9ca3af] text-[12px] max-w-sm mb-4">Try adjusting your filters, search query, or date range to find what you're looking for.</p>
                    <button 
                      onClick={() => {
                        setFilterType('All Types')
                        setFilterRisk('All Risks')
                        setFilterStatus('All Statuses')
                        setFilterSource('All Sources')
                        setFilterOwner('All Owners')
                        setQuickFilter('none')
                        setSearchQuery('')
                      }}
                      className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-white text-[12px] rounded-[6px] transition-colors font-medium border border-[#374151]"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <DetailTable 
                    title="Asset Inventory"
                    data={filteredInventory}
                    columns={inventoryCols}
                    pageSize={6}
                    pageSizeOptions={[6, 10, 20, 50]}
                  />
                )}
              </div>

              <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] flex flex-col h-[482px]">
                <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
                  <h3 className="text-white font-semibold text-[13px]">Recently Discovered Assets</h3>
                  <button 
                    onClick={() => setQuickFilter('newly-discovered')}
                    className="text-blue-400 hover:text-blue-300 text-[11px] font-medium transition-colors"
                  >
                    View all
                  </button>
                </div>
                <div className="flex-1 overflow-auto scrollbar-hide p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-[#4b5563] text-[12px] animate-pulse">Loading...</span>
                    </div>
                  ) : isError ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-red-400 text-[12px]">Failed to load</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {(data?.recentlyDiscovered || []).map((asset) => (
                        <div key={asset.id} className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-[#0B0F12] border border-[#1f2937] hover:border-[#374151] transition-colors cursor-pointer group">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-white group-hover:text-blue-400 transition-colors">{asset.assetName}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1f2937] text-[#9ca3af]">{asset.assetType}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2">
                              <StatusBadge val={asset.status} />
                              <RiskBadge val={asset.risk} />
                            </div>
                            <span className="text-[10px] text-[#6b7280]">{asset.lastSeen}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── UI States Row (as requested) ─────────────────────────── */}
        <div className="mt-8 mb-4">
          <h2 className="text-[14px] font-bold text-white mb-4">UI States</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex items-center gap-3 bg-[#111827] border border-[#1f2937] rounded-[8px] px-4 py-3 flex-1 min-w-[200px]">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-white">Loading State</span>
                <span className="text-[10px] text-[#6b7280]">Loading asset data...</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-[#111827] border border-[#1f2937] rounded-[8px] px-4 py-3 flex-1 min-w-[200px]">
              <MdFilterList size={20} className="text-[#6b7280] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-white">Empty State</span>
                <span className="text-[10px] text-[#6b7280]">No assets found for filters.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#111827] border border-[#1f2937] rounded-[8px] px-4 py-3 flex-1 min-w-[200px]">
              <div className="w-8 h-8 rounded bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                <MdWarningAmber size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-white">Error State</span>
                <span className="text-[10px] text-[#6b7280]">Failed to load assets.</span>
                <button className="text-left flex items-center gap-1 text-[10px] text-white mt-1 w-fit bg-[#1f2937] px-2 py-0.5 rounded border border-[#374151]">
                  <MdRefresh /> Retry
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-[#111827] border border-[#1f2937] rounded-[8px] px-4 py-3 flex-1 min-w-[200px]">
              <div className="w-8 h-8 rounded bg-yellow-500/20 text-yellow-500 flex items-center justify-center shrink-0">
                <MdWarningAmber size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-white">Partial Data State</span>
                <span className="text-[10px] text-[#6b7280]">Some sources unavailable.</span>
                <span className="text-[10px] text-blue-400 mt-1 cursor-pointer">View details &gt;</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-[#111827] border border-[#1f2937] rounded-[8px] px-4 py-3 flex-1 min-w-[200px]">
              <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                <MdCalendarToday size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-white">Stale Data State</span>
                <span className="text-[10px] text-[#6b7280]">Data is older than 15 mins.</span>
                <span className="text-[10px] text-blue-400 mt-1 cursor-pointer">Refresh &gt;</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

