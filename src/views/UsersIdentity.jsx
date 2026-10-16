import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { MdRefresh, MdWarningAmber, MdSearch, MdFilterList, MdVisibility, MdAdd, MdRemove } from 'react-icons/md'
import { fetchUsersIdentityKPIs } from '../api/threatOpsApi'
import { usersIdentityKpis } from '../data/threatOpsUsersIdentityKpis'
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
  cursor: { fill: 'rgba(255,255,255,0.04)' }
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

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ cols, children }) {
  return (
    <div
      className="grid gap-4"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`
      }}
    >
      {children}
    </div>
  )
}

// ── World Map Component ───────────────────────────────────────────────────────
function WorldMap({ locations, isLoading, isEmpty, onLocationClick }) {
  const [zoom, setZoom] = useState(1)
  
  // A simple equirectangular projection approximation for our SVG
  // Map dimensions
  const width = 800
  const height = 400
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1))

  return (
    <StandardChartCard 
      title="Unusual Locations" 
      type="default" 
      isLoading={isLoading} 
      isEmpty={isEmpty}
      headerRight={
        <select className="bg-transparent text-[#9ca3af] text-[11px] outline-none cursor-pointer">
          <option>All Locations</option>
          <option>High Risk Only</option>
        </select>
      }
    >
      <div className="relative w-full h-full flex flex-col bg-[#0d1117] rounded-md border border-[#1f2937] overflow-hidden">
        {/* Zoom controls */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          <button onClick={handleZoomIn} className="p-1.5 bg-[#111827] border border-[#374151] rounded text-[#9ca3af] hover:text-white hover:border-[#4b5563] transition-colors">
            <MdAdd size={14} />
          </button>
          <button onClick={handleZoomOut} className="p-1.5 bg-[#111827] border border-[#374151] rounded text-[#9ca3af] hover:text-white hover:border-[#4b5563] transition-colors">
            <MdRemove size={14} />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 bg-[#111827]/80 backdrop-blur-sm border border-[#1f2937] p-2 rounded-md">
          <span className="text-[10px] font-medium text-[#9ca3af] mb-1">Authentication Count</span>
          {[
            { label: '500+', color: '#EF4444' },
            { label: '101 - 500', color: '#F97316' },
            { label: '21 - 100', color: '#F59E0B' },
            { label: '6 - 20', color: '#3b82f6' },
            { label: '1 - 5', color: '#9ca3af' },
          ].map((item, i) => (
             <div key={i} className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
               <span className="text-[10px] text-[#d1d5db]">{item.label}</span>
             </div>
          ))}
        </div>

        <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center">
          <motion.div 
            animate={{ scale: zoom }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full relative"
          >
            {/* World Map SVG Paths - simplified representation */}
            <svg viewBox="0 0 1000 500" className="w-full h-full text-[#1f2937] fill-current">
              <path d="M150,150 Q180,140 200,160 T250,180 T280,120 T200,80 Z" />
              <path d="M300,300 Q320,280 340,320 T360,350 T310,380 Z" />
              <path d="M450,100 Q480,80 500,120 T550,140 T580,90 T520,50 Z" />
              <path d="M600,150 Q630,140 650,180 T700,200 T720,120 T680,100 Z" />
              <path d="M750,250 Q780,240 800,280 T850,300 T880,220 T820,200 Z" />
              <path d="M500,250 Q520,240 540,280 T560,320 T510,350 Z" />
              <path d="M400,150 Q420,140 440,160 T450,200 T410,220 Z" />
            </svg>

            {/* Plot locations */}
            {locations.map((loc, i) => {
              // Convert lat/lng to roughly fit our 1000x500 svg viewbox
              const x = (loc.lng + 180) * (1000 / 360)
              const y = (90 - loc.lat) * (500 / 180)
              const size = Math.max(6, Math.min(24, loc.authCount / 2))
              const color = riskColors[loc.risk] || '#9ca3af'

              return (
                <div
                  key={i}
                  onClick={() => onLocationClick(loc)}
                  className="absolute group cursor-pointer"
                  style={{ 
                    left: `${(x / 1000) * 100}%`, 
                    top: `${(y / 500) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                    className="rounded-full relative"
                    style={{ 
                      width: size, 
                      height: size, 
                      backgroundColor: `${color}80`,
                      boxShadow: `0 0 ${size}px ${color}`
                    }}
                  >
                    <div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ width: size/2, height: size/2, backgroundColor: color }}
                    ></div>
                  </motion.div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                    <div className="bg-[#111827] border border-[#374151] rounded-md px-3 py-2 shadow-xl flex flex-col whitespace-nowrap">
                      <span className="text-[12px] font-bold text-white mb-1">{loc.city}, {loc.country}</span>
                      <div className="flex justify-between gap-4">
                        <span className="text-[11px] text-[#9ca3af]">Auth Events:</span>
                        <span className="text-[11px] text-white font-mono">{loc.authCount}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[11px] text-[#9ca3af]">Users:</span>
                        <span className="text-[11px] text-white font-mono">{loc.userCount}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                         <span className="text-[10px] uppercase font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: color }}>
                           {loc.risk} Risk
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </StandardChartCard>
  )
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function UsersIdentity({ selectedTime, setActive }) {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]   = useState(false)
  
  // Filters
  const [filterUserType, setFilterUserType] = useState('All Types')
  const [filterPrivilege, setFilterPrivilege] = useState('All Privileges')
  const [filterAuthSource, setFilterAuthSource] = useState('All Sources')
  const [filterLocation, setFilterLocation] = useState('All Locations')
  const [searchQuery, setSearchQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState('none') 

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchUsersIdentityKPIs(selectedTime)
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
    usersIdentityKpis.some(k => data[k.key] === undefined)

  const lastUpdated = data?._lastUpdated
  const isStale = lastUpdated && (Date.now() - new Date(lastUpdated).getTime() > 15 * 60 * 1000)
  
  const handleKpiClick = (kpi) => {
    // Reset standard filters
    setFilterUserType('All Types')
    setFilterPrivilege('All Privileges')
    setFilterAuthSource('All Sources')
    setFilterLocation('All Locations')
    setSearchQuery('')
    
    // Set quick filter based on KPI drillDownFilter
    setQuickFilter(kpi.drillDownFilter || 'none')
  }

  // Filter Table Data
  const filteredRiskyUsers = data?.riskyUsersData?.filter(u => 
    (!searchQuery || u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || u.user.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (quickFilter === 'none' || quickFilter === 'risky' || quickFilter === 'all_users')
  ) || []

  const filteredSuspiciousLogins = data?.suspiciousLoginsData?.filter(l => 
    (!searchQuery || l.user.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterLocation === 'All Locations' || l.location.includes(filterLocation)) &&
    (quickFilter === 'none' || quickFilter === 'suspicious_logins')
  ) || []

  const filteredPrivilegeChanges = data?.privilegeChangeActivityData?.filter(p => 
    (!searchQuery || p.user.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (quickFilter === 'none' || quickFilter === 'privileged')
  ) || []

  // Reusable card renderer
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

  const riskyUserCols = [
    { header: 'User', accessor: 'user', render: (val, row) => (
      <div className="flex items-center gap-3">
        <img src={row.avatar} alt={val} className="w-8 h-8 rounded-full bg-[#1f2937]" />
        <div className="flex flex-col">
          <span className="font-semibold text-white">{row.displayName}</span>
          <span className="text-[#9ca3af] text-[10px]">{val}</span>
        </div>
      </div>
    ) },
    { header: 'Risk Score', accessor: 'riskScore', render: (val) => (
      <span className="font-mono text-[13px]">{val}</span>
    )},
    { header: 'Risk Level', accessor: 'riskLevel', render: (val) => <RiskBadge val={val} /> },
    { header: 'Last Risk Activity', accessor: 'lastRiskActivity' },
    { header: 'Reason', accessor: 'reason' }
  ]

  const suspiciousLoginCols = [
    { header: 'Timestamp', accessor: 'timestamp' },
    { header: 'User', accessor: 'user', render: (val) => <span className="font-medium text-[#e5e7eb]">{val}</span> },
    { header: 'Location', accessor: 'location' },
    { header: 'IP Address', accessor: 'ipAddress', render: (val) => <span className="font-mono text-[11px] text-[#9ca3af]">{val}</span> },
    { header: 'Auth Method', accessor: 'authMethod' },
    { header: 'Risk Level', accessor: 'riskLevel', render: (val) => <RiskBadge val={val} /> },
    { header: 'Reason', accessor: 'reason' }
  ]

  const privilegeCols = [
    { header: 'Timestamp', accessor: 'timestamp' },
    { header: 'User', accessor: 'user', render: (val) => <span className="font-medium text-[#e5e7eb]">{val}</span> },
    { header: 'Previous Privilege', accessor: 'previousPrivilege', render: (val) => <span className="text-[#9ca3af]">{val}</span> },
    { header: 'New Privilege', accessor: 'newPrivilege', render: (val) => <span className="text-white font-medium">{val}</span> },
    { header: 'Changed By', accessor: 'changedBy' },
    { header: 'Source', accessor: 'source' },
    { header: 'Risk', accessor: 'risk', render: (val) => <RiskBadge val={val} /> }
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide bg-[#0B0F12]">
      <div className="flex flex-col gap-4 px-7 pt-6 pb-12">
        
        {/* ── Header & Toolbar ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
                Context & Intelligence
              </p>
              <h1 className="text-[26px] font-bold text-white leading-tight">Users & Identity</h1>
              <p className="text-[#9ca3af] text-[13px] mt-1">Monitor user accounts, authentication activity and identity risks across your environment.</p>
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
                  placeholder="Search users..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-[#111827] border border-[#1f2937] rounded-[6px] text-[12px] text-white focus:outline-none focus:border-[#3b82f6] transition-colors w-56 placeholder-[#4b5563]"
                />
              </div>

              <div className="w-[1px] h-5 bg-[#1f2937] mx-1"></div>
              
              <select 
                value={filterUserType}
                onChange={e => setFilterUserType(e.target.value)}
                className="bg-[#111827] border border-[#1f2937] text-white text-[12px] px-3 py-1.5 rounded-[6px] outline-none cursor-pointer hover:border-[#374151] transition-colors"
              >
                <option value="All Types">User Type</option>
                <option value="Employee">Employee</option>
                <option value="Contractor">Contractor</option>
                <option value="Service Account">Service Account</option>
                <option value="Guest">Guest</option>
              </select>

              <select 
                value={filterPrivilege}
                onChange={e => setFilterPrivilege(e.target.value)}
                className="bg-[#111827] border border-[#1f2937] text-white text-[12px] px-3 py-1.5 rounded-[6px] outline-none cursor-pointer hover:border-[#374151] transition-colors"
              >
                <option value="All Privileges">Privilege Level</option>
                <option value="Global Admin">Global Admin</option>
                <option value="Billing Admin">Billing Admin</option>
                <option value="User">Standard User</option>
              </select>

              <select 
                value={filterAuthSource}
                onChange={e => setFilterAuthSource(e.target.value)}
                className="bg-[#111827] border border-[#1f2937] text-white text-[12px] px-3 py-1.5 rounded-[6px] outline-none cursor-pointer hover:border-[#374151] transition-colors"
              >
                <option value="All Sources">Auth Source</option>
                <option value="Azure AD">Azure AD</option>
                <option value="Okta">Okta</option>
                <option value="Local">Local AD</option>
                <option value="AWS IAM">AWS IAM</option>
              </select>
              
              <select 
                value={filterLocation}
                onChange={e => setFilterLocation(e.target.value)}
                className="bg-[#111827] border border-[#1f2937] text-white text-[12px] px-3 py-1.5 rounded-[6px] outline-none cursor-pointer hover:border-[#374151] transition-colors"
              >
                <option value="All Locations">Location</option>
                <option value="Russia">Russia</option>
                <option value="China">China</option>
                <option value="Brazil">Brazil</option>
                <option value="Nigeria">Nigeria</option>
                <option value="USA">USA</option>
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
                Some identity data is currently unavailable. Showing partial results.
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
            <p className="text-[15px] font-semibold text-[#9ca3af]">Failed to load user and identity data.</p>
            <p className="text-[12px] text-[#4a5568]">The identity service might be temporarily unavailable.</p>
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
            
            {/* Row 1: KPI Cards */}
            <Row cols={5}>
              {usersIdentityKpis.map(card)}
            </Row>

            <ActSection act="act1">
              <Row cols={2}>
                <WorldMap 
                  locations={data?.unusualLocations || []} 
                  isLoading={isLoading} 
                  isEmpty={isEmpty} 
                  onLocationClick={(loc) => {
                    setFilterLocation(loc.country)
                    setQuickFilter('suspicious_logins')
                  }}
                />
                
                <StandardChartCard
                  title="Privilege Changes Over Time"
                  type="default"
                  isLoading={isLoading}
                  isEmpty={isEmpty || (data?.privilegeChangesChart?.length === 0)}
                  headerRight={
                    <select className="bg-transparent text-[#9ca3af] text-[11px] outline-none cursor-pointer">
                      <option>Daily</option>
                      <option>Weekly</option>
                    </select>
                  }
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.privilegeChangesChart || []}
                      margin={{ top: 20, right: 12, left: -14, bottom: 0 }}
                      onClick={(data) => {
                        if (data) setQuickFilter('privileged')
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="t" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: '10px' }} />
                      <Bar dataKey="elevation" name="Privilege Granted" fill="#8B5CF6" stackId="a" radius={[0, 0, 0, 0]} barSize={16} />
                      <Bar dataKey="adminElevation" name="Admin Elevation" fill="#F59E0B" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="roleChange" name="Role Changed" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="revocation" name="Privilege Removed" fill="#EF4444" stackId="a" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </StandardChartCard>
              </Row>
            </ActSection>

          </div>
        )}
      </div>
    </div>
  )
}
