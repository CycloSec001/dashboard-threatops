import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber, MdSearch, MdFilterList, MdCalendarToday, MdCloud, MdInsertDriveFile, MdSsidChart, MdSettings, MdCode, MdSecurity, MdNotificationsActive, MdArrowUpward, MdArrowDownward, MdArrowForward } from 'react-icons/md'
import { fetchCloudSaasKPIs } from '../api/threatOpsApi'
import { cloudSaasKpis } from '../data/threatOpsCloudSaasKpis'
import { ChartCard } from '../components/Charts'
import DetailTable from '../components/DetailTable'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { customTooltip } from '../utils/mockData'

// ── Shared UI Helpers ────────────────────────────────────────────────────────
const RiskBadge = ({ val }) => {
  const v = String(val).toLowerCase()
  let color = 'text-gray-400 bg-gray-500/10 border-gray-500/20'
  if (v === 'critical') color = 'text-red-400 bg-red-500/10 border-red-500/20'
  else if (v === 'high') color = 'text-orange-400 bg-orange-500/10 border-orange-500/20'
  else if (v === 'medium') color = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  else if (v === 'low') color = 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  else if (v === 'open' || v === 'investigating') color = 'text-green-400 bg-green-500/10 border-green-500/20'
  else if (v === 'allowed') color = 'text-green-400 bg-green-500/10 border-green-500/20'
  else if (v === 'blocked') color = 'text-red-400 bg-red-500/10 border-red-500/20'

  return (
    <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {val}
    </span>
  )
}

const KPI_ICONS = {
  cloudAssets: MdCloud,
  cloudEvents: MdInsertDriveFile,
  cloudAnomalies: MdSsidChart,
  riskyConfigurations: MdSettings,
  suspiciousApiActivity: MdCode,
  privilegedCloudActions: MdSecurity,
  cloudIncidents: MdNotificationsActive
}

const CustomKpiCard = ({ config, value, trend, isLoading, onClick }) => {
  const Icon = KPI_ICONS[config.key] || MdCloud;
  const isUp = trend?.direction === 'up';
  
  if (isLoading) {
    return (
      <div className="kpi-glass-card flex flex-col justify-between p-4 border border-white/[0.08] rounded-[12px] h-[140px] animate-pulse">
        <div className="w-10 h-10 bg-white/5 rounded-[8px]" />
      </div>
    )
  }

  return (
    <div 
      onClick={onClick} 
      className="kpi-glass-card flex flex-col justify-between p-4 border border-white/[0.08] rounded-[12px] cursor-pointer hover:border-white/[0.20] transition-all h-[140px] relative overflow-hidden"
    >
      <div className="flex items-start gap-4 relative z-10">
        {/* Icon Box */}
        <div className="flex items-center justify-center w-10 h-10 rounded-[8px] flex-shrink-0" style={{ backgroundColor: `${config.color}15`, border: `1px solid ${config.color}30` }}>
          <Icon size={20} style={{ color: config.color }} />
        </div>
        {/* Title and Value */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[12px] font-semibold text-slate-200 mb-1 leading-[1.25]" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{config.title}</span>
          <div className="flex items-end gap-2">
            <span className="text-[26px] font-bold text-white leading-none whitespace-nowrap">{value}</span>
            {trend && (
              <span className="flex items-center text-[11px] font-bold pb-0.5" style={{ color: config.color }}>
                {isUp ? <MdArrowUpward size={12} /> : <MdArrowDownward size={12} />}
                {trend.percentage}%
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5">{config.subtext}</span>
        </div>
      </div>
      
      {/* Bottom Link */}
      <div className="flex items-center gap-1 mt-auto pt-3 relative z-10">
        <span className="text-[12px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
          View {config.drillDownFilter || 'details'}
        </span>
        <MdArrowForward size={14} className="text-cyan-400" />
      </div>
    </div>
  )
}

// ── Chart Renderers ──────────────────────────────────────────────────────────
const EventsOverTimeChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
      <defs>
        <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#00D9FF" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" vertical={false} />
      <XAxis dataKey="t" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
      <YAxis stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
      <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#00D9FF' }} />
      <Area type="monotone" dataKey="events" stroke="#00D9FF" fillOpacity={1} fill="url(#colorEvents)" strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
)

const DonutChartBase = ({ data, totalLabel }) => {
  const total = useMemo(() => data?.reduce((acc, curr) => acc + curr.value, 0) || 0, [data])
  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" stroke="#0B0F12" strokeWidth={2}>
              {data?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-15%' }}>
          <span className="text-[20px] font-bold text-white leading-tight">{total.toLocaleString()}</span>
          <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">{totalLabel}</span>
        </div>
      </div>
      <div className="flex justify-center gap-x-4 gap-y-2 flex-wrap pb-2">
        {data?.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-htb-muted">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
            {d.name} <span className="font-semibold text-[#d1d5db] ml-0.5">{d.value.toLocaleString()}</span>
            <span className="text-[#6b7280] text-[10px]">({((d.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function CloudSaas({ selectedTime, setActive }) {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchCloudSaasKPIs(selectedTime)
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
    cloudSaasKpis.some(k => data[k.key] === undefined)
  const isStale = false // Backend mock sets lastUpdated, but for visual we can trigger stale logic if needed
  const lastUpdated = data?._lastUpdated

  const card = (kpi) => (
    <CustomKpiCard
      key={kpi.key}
      config={kpi}
      value={data?.[kpi.key]}
      trend={data?.[`${kpi.key}Trend`]}
      isLoading={isLoading}
      onClick={() => setActive(kpi.targetRoute)}
    />
  )

  // ── Table Column Definitions ───────────────────────────────────────────────
  const riskyConfigsCols = [
    { accessor: 'resource', header: 'Resource' },
    { accessor: 'provider', header: 'Provider' },
    { accessor: 'account', header: 'Account' },
    { accessor: 'riskLevel', header: 'Risk Level', render: (val) => <RiskBadge val={val} /> },
    { accessor: 'finding', header: 'Finding' },
    { accessor: 'lastDetected', header: 'Last Detected' },
    { accessor: 'status', header: 'Status' }
  ]

  const suspiciousApiCols = [
    { accessor: 'apiAction', header: 'API Action' },
    { accessor: 'provider', header: 'Provider' },
    { accessor: 'user', header: 'User/Principal' },
    { accessor: 'resource', header: 'Resource' },
    { accessor: 'count', header: 'Count' },
    { accessor: 'risk', header: 'Risk', render: (val) => <RiskBadge val={val} /> },
    { accessor: 'lastSeen', header: 'Last Seen' }
  ]

  const privilegedActionsCols = [
    { accessor: 'timestamp', header: 'Timestamp' },
    { accessor: 'user', header: 'User/Principal' },
    { accessor: 'action', header: 'Action' },
    { accessor: 'provider', header: 'Provider' },
    { accessor: 'resource', header: 'Resource' },
    { accessor: 'risk', header: 'Risk', render: (val) => <RiskBadge val={val} /> },
    { accessor: 'status', header: 'Status', render: (val) => <RiskBadge val={val} /> }
  ]

  const incidentCols = [
    { accessor: 'incidentId', header: 'Incident ID' },
    { accessor: 'provider', header: 'Provider' },
    { accessor: 'title', header: 'Title' },
    { accessor: 'severity', header: 'Severity', render: (val) => <RiskBadge val={val} /> },
    { accessor: 'status', header: 'Status', render: (val) => <RiskBadge val={val} /> },
    { accessor: 'updatedAt', header: 'Updated' }
  ]

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      style={{
        background: `
          linear-gradient(#141B21 1px, transparent 1px),
          linear-gradient(90deg, #141B21 1px, transparent 1px),
          #0B0F12
        `,
        backgroundSize: '40px 40px',
      }}
    >
      <div className="flex flex-col gap-6 px-7 pt-6 pb-12">
        
        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-white leading-tight">Cloud & SaaS</h1>
            <p className="text-[13px] text-[#6b7280] mt-1">
              Monitor cloud assets, events, configurations and risks across your cloud environments.
            </p>
          </div>
        </div>

        {/* ── Top Toolbar / Filters ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] border border-[#1f2937] p-3 rounded-[10px]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date/Time Filter Mock */}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#1a2332] border border-[#2d3748] text-[12px] font-medium text-white hover:border-[#4a5568] transition-colors">
              <MdCalendarToday size={14} className="text-[#9ca3af]" />
              <span>{selectedTime}</span>
            </button>
            {/* Advanced Filters Dropdown Mock */}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#1a2332] border border-[#2d3748] text-[12px] font-medium text-white hover:border-[#4a5568] transition-colors">
              <MdFilterList size={14} className="text-[#9ca3af]" />
              <span>Filters</span>
            </button>
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#1a2332] border border-[#2d3748] focus-within:border-[#4a5568] transition-colors">
              <MdSearch size={14} className="text-[#9ca3af]" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-[12px] text-white placeholder-[#6b7280] w-[150px]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdated && !isLoading && !isError && (
              <div className="flex items-center gap-2">
                {isStale && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-[4px]">
                    <MdWarningAmber size={12} /> STALE
                  </span>
                )}
                <span className="text-[11px] text-[#4a5568] hidden sm:block">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            )}
            <motion.button
              onClick={loadData}
              disabled={isLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-htb-green/10 border border-htb-green/30 text-[12px] font-medium text-htb-green hover:bg-htb-green/20 transition-all disabled:opacity-40"
            >
              <motion.div
                animate={{ rotate: isLoading ? 360 : 0 }}
                transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}
              >
                <MdRefresh size={14} />
              </motion.div>
              Refresh
            </motion.button>
          </div>
        </div>

        {/* ── Partial data / Error states ────────────────────────────── */}
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
                Some data is currently unavailable. Showing partial results.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20 bg-[#111827] rounded-[10px] border border-red-900/30"
          >
            <div className="text-red-400/60 text-5xl">⚠</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">Unable to load Cloud & SaaS data</p>
            <button
              onClick={loadData}
              className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ── Dashboard Content ──────────────────────────────────────── */}
        {!isError && (
          <div className="flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-4">
              {cloudSaasKpis.map(card)}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-[300px]">
              <div className="xl:col-span-1 h-full">
                <ChartCard title="Cloud Events Over Time" isLoading={isLoading} isEmpty={isEmpty}>
                  <EventsOverTimeChart data={data?.eventsOverTime} />
                </ChartCard>
              </div>
              <div className="xl:col-span-1 h-full">
                <ChartCard title="Events by Cloud Provider" isLoading={isLoading} isEmpty={isEmpty}>
                  <DonutChartBase data={data?.eventsByProvider} totalLabel="Total Events" />
                </ChartCard>
              </div>
              <div className="xl:col-span-1 h-full">
                <ChartCard title="Events by Category" isLoading={isLoading} isEmpty={isEmpty}>
                  <DonutChartBase data={data?.eventsByCategory} totalLabel="Total Events" />
                </ChartCard>
              </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 2xl:grid-cols-4 xl:grid-cols-2 gap-4">
              <div className="min-w-0">
                <DetailTable 
                  title="Top Risky Configurations" 
                  columns={riskyConfigsCols} 
                  data={data?.topRiskyConfigurationsData} 
                  searchable={false}
                />
              </div>
              <div className="min-w-0">
                <DetailTable 
                  title="Top Suspicious API Activity" 
                  columns={suspiciousApiCols} 
                  data={data?.topSuspiciousApiData} 
                  searchable={false}
                />
              </div>
              <div className="min-w-0">
                <DetailTable 
                  title="Recent Privileged Actions" 
                  columns={privilegedActionsCols} 
                  data={data?.topPrivilegedActionsData} 
                  searchable={false}
                />
              </div>
              <div className="min-w-0">
                <DetailTable 
                  title="Recent Cloud Incidents" 
                  columns={incidentCols} 
                  data={data?.recentCloudIncidentsData} 
                  searchable={false}
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

