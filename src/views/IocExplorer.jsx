import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import { 
  MdRefresh, MdWarningAmber, MdSearch, MdFilterList, 
  MdOutlineVisibility, MdOutlineGpsFixed,
  MdHub, MdShield, MdAdsClick, MdLanguage, MdLink,
  MdOutlineHourglassEmpty, MdOutlineErrorOutline,
  MdOutlineInfo, MdOutlineCheckCircle, MdOutlineTimer
} from 'react-icons/md'
import { fetchIocExplorerKPIs } from '../api/threatOpsApi'
import DetailTable from '../components/DetailTable'
import PageShell from '../components/PageShell'

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
}

const emptyData = {
  ipDonut: [], domainDonut: [], hashDonut: [], urlDonut: [],
  typeDistribution: [], topSources: [], recentMatches: [], topByRisk: [],
}

// ── Simple KPI Card ────────────────────────────────────────────────────────
function SimpleKpiCard({ title, value, trend, Icon, iconColor }) {
  return (
    <div className="flex flex-col bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3.5 justify-between h-[75px] relative overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="flex items-center justify-center rounded-[6px] p-1" style={{ backgroundColor: `${iconColor}15` }}>
          <Icon size={13} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="relative z-10 flex items-baseline justify-between">
        <span className="text-[16px] font-bold text-white font-mono tracking-tight leading-none">{value === null || value === undefined ? '—' : value.toLocaleString()}</span>
        {trend && (
          <span className="text-[9.5px] font-bold text-emerald-400">↑ {trend}%</span>
        )}
      </div>
    </div>
  )
}

// ── Single donut card ────────────────────────────────────────────────────────
function DonutCard({ title, data: chartData, isLoading, isEmpty }) {
  const total = chartData?.reduce((s, d) => s + d.value, 0) || 0
  
  return (
    <div className="flex flex-col bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3.5 h-full transition-all duration-200 hover:border-white/[0.12]">
      <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">
        {title}
      </span>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[110px]">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <MdRefresh size={18} className="text-cyan-400/60" />
          </motion.div>
        </div>
      ) : isEmpty || !chartData || !chartData.length || total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[11px] text-slate-500 min-h-[110px] gap-1">
          <span>No data available</span>
        </div>
      ) : (
        <div className="flex flex-row items-center justify-between">
          <div className="relative" style={{ width: 100, height: 100, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={32}
                  outerRadius={48}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[12px] font-bold text-white font-mono">
                {total.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 ml-3 flex-1 overflow-x-hidden">
            {chartData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 truncate pr-1">
                  <span className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-300 truncate">{d.name}</span>
                </div>
                <div className="text-slate-200 font-mono shrink-0">
                  {d.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-2 pt-2 border-t border-white/[0.05] text-[10px] font-medium text-cyan-400 hover:underline cursor-pointer">
        View {title} →
      </div>
    </div>
  )
}

// ── Table-style Distribution Card ──────────────────────────────────────────
function DistributionCard({ data }) {
  return (
    <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden flex flex-col justify-between text-[10.5px] transition-all duration-200 hover:border-white/[0.12] p-3">
      <div>
        <div className="px-1 py-1 font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2">
          IOC Type Distribution
        </div>
        {!data || data.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-[11px] text-slate-500">No distribution data</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/10 border-b border-white/[0.05]">
                <th className="text-[9.5px] text-slate-400 font-medium py-2 px-3 uppercase tracking-wider">IOC Type</th>
                <th className="text-[9.5px] text-slate-400 font-medium py-2 px-3 uppercase tracking-wider">Total IOCs</th>
                <th className="text-[9.5px] text-slate-400 font-medium py-2 px-3 uppercase tracking-wider">Percentage</th>
                <th className="text-[9.5px] text-slate-400 font-medium py-2 px-3 uppercase tracking-wider">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-3 text-white font-medium">{item.type}</td>
                  <td className="py-2 px-3 text-slate-200 font-mono">{item.count.toLocaleString()}</td>
                  <td className="py-2 px-3 text-slate-400 font-mono">{item.percentage}%</td>
                  <td className="py-2 px-3">
                    <div className="w-[120px] h-1.5 bg-black/20 rounded-full overflow-hidden border border-white/[0.03]">
                      <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-3 pt-2 border-t border-white/[0.05] text-left px-1">
        <span className="text-[10px] text-cyan-400 hover:underline font-medium cursor-pointer">View full distribution →</span>
      </div>
    </div>
  )
}

function RiskBadge({ level }) {
  const colors = {
    Critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    High: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  }
  const colorClass = colors[level] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  return (
    <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${colorClass}`}>
      {level}
    </span>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-200 rounded-[6px] px-2.5 py-1.5 outline-none cursor-pointer focus:border-cyan-500/40 w-[130px]"
      >
        {options.map(opt => <option key={opt} value={opt} className="bg-[#0a0f19]">{opt}</option>)}
      </select>
    </div>
  )
}

export default function IocExplorer({ selectedTime, setActive }) {
  const [data, setData]          = useState(emptyData)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]    = useState(false)

  // Filters
  const [iocTypeFilter, setIocTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [riskFilter, setRiskFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchIocExplorerKPIs(selectedTime)
      setData(result || emptyData)
    } catch (err) {
      console.error(err)
      setData(emptyData)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTime])

  useEffect(() => { loadData() }, [loadData])

  const isEmpty = !isLoading && !isError && data && Object.keys(data).length === 0
  const lastUpdated = data?._lastUpdated

  // Derived filtered data
  const currentMatches = data?.recentMatches || []
  const filteredMatches = useMemo(() => {
    return currentMatches.filter(match => {
      if (iocTypeFilter !== 'All' && match.iocType !== iocTypeFilter) return false
      if (statusFilter !== 'All' && match.status !== statusFilter) return false
      if (riskFilter !== 'All' && match.riskLevel !== riskFilter) return false
      if (sourceFilter !== 'All' && match.source !== sourceFilter) return false
      if (searchQuery && !Object.values(match).join(' ').toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [currentMatches, iocTypeFilter, statusFilter, riskFilter, sourceFilter, searchQuery])

  const currentTopRisk = data?.topByRisk || []
  const filteredTopRisk = useMemo(() => {
    return currentTopRisk.filter(match => {
      if (iocTypeFilter !== 'All' && match.iocType !== iocTypeFilter) return false
      if (statusFilter !== 'All' && match.status !== statusFilter) return false
      if (riskFilter !== 'All' && match.riskLevel !== riskFilter) return false
      if (sourceFilter !== 'All' && match.source !== sourceFilter) return false
      return true
    })
  }, [currentTopRisk, iocTypeFilter, statusFilter, riskFilter, sourceFilter])

  // Table Columns
  const recentMatchesCols = [
    { accessor: 'iocValue', header: 'IOC Value', render: (v) => <span className="text-cyan-400 font-mono text-[10px] cursor-pointer hover:underline">{v}</span> },
    { accessor: 'iocType', header: 'IOC Type', render: (v) => <span className="text-slate-300">{v}</span> },
    { accessor: 'riskLevel', header: 'Risk Level', render: (v) => <RiskBadge level={v} /> },
    { accessor: 'source', header: 'Source', render: (v) => <span className="text-slate-300">{v}</span> },
    { accessor: 'matchedOn', header: 'Matched On', render: (v) => <span className="text-slate-400 font-mono text-[10px]">{v}</span> },
    { accessor: 'matchedIn', header: 'Matched In', render: (v) => <span className="text-slate-400">{v}</span> },
    { accessor: 'actions', header: 'Actions', render: () => (
      <div className="flex items-center gap-2 text-slate-400">
        <MdOutlineGpsFixed className="hover:text-cyan-400 cursor-pointer" size={13} />
        <MdOutlineVisibility className="hover:text-cyan-400 cursor-pointer" size={13} />
      </div>
    )}
  ]

  const topSourcesCols = [
    { accessor: 'source', header: 'Source', render: (v) => <span className="text-white font-medium">{v}</span> },
    { accessor: 'iocs', header: 'IOCs', render: (v) => <span className="text-slate-200 font-mono">{v.toLocaleString()}</span> },
    { accessor: 'matches', header: 'Matches', render: (v) => <span className="text-slate-200 font-mono">{v.toLocaleString()}</span> },
    { accessor: 'activity', header: 'Activity', render: (v) => (
      <div className="w-[100px] h-1.5 bg-black/20 rounded-full overflow-hidden border border-white/[0.03]">
        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${v}%` }} />
      </div>
    ) }
  ]

  const topRiskCols = [
    { accessor: 'iocValue', header: 'IOC Value', render: (v) => <span className="text-cyan-400 font-mono text-[10px] cursor-pointer hover:underline">{v}</span> },
    { accessor: 'iocType', header: 'IOC Type', render: (v) => <span className="text-slate-300">{v}</span> },
    { accessor: 'riskLevel', header: 'Risk Level', render: (v) => <RiskBadge level={v} /> },
    { accessor: 'occurrences', header: 'Occurrences', render: (v) => <span className="text-slate-200 font-mono">{v}</span> },
    { accessor: 'firstSeen', header: 'First Seen', render: (v) => <span className="text-slate-400 font-mono text-[10px]">{v}</span> },
    { accessor: 'lastSeen', header: 'Last Seen', render: (v) => <span className="text-slate-400 font-mono text-[10px]">{v}</span> }
  ]

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-y-auto"
      style={{
        backgroundColor: '#0a0f19',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <PageShell
        section="Investigation"
        title="IOC Explorer"
        subtitle="Explore and analyze Indicators of Compromise across all sources and types."
        selectedTime={selectedTime}
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        lastUpdated={lastUpdated}
        onRefresh={loadData}
      >
        <div className="flex flex-col gap-3 max-w-[1600px] mx-auto w-full">

          {/* ── Filters Bar ──────────────────────────────────────── */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-wrap items-end gap-2.5 transition-all duration-200 hover:border-white/[0.12]">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Search</label>
              <div className="flex items-center gap-2 bg-black/10 border border-white/[0.05] rounded-[6px] px-2.5 py-1.5 focus-within:border-cyan-500/40 transition-colors">
                <MdSearch size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search IOCs..."
                  className="bg-transparent text-[10.5px] text-slate-200 placeholder:text-slate-500 outline-none w-full"
                />
              </div>
            </div>
            <FilterSelect label="IOC Type" value={iocTypeFilter} onChange={setIocTypeFilter} options={['All', 'IP', 'Domain', 'Hash', 'URL']} />
            <FilterSelect label="IOC Status" value={statusFilter} onChange={setStatusFilter} options={['All', 'Active', 'Inactive']} />
            <FilterSelect label="Risk Level" value={riskFilter} onChange={setRiskFilter} options={['All', 'Critical', 'High', 'Medium', 'Low']} />
            <FilterSelect label="Source" value={sourceFilter} onChange={setSourceFilter} options={['All', 'AlienVault OTX', 'Recorded Future', 'VirusTotal', 'ThreatStream', 'AbuseIPDB']} />
            <FilterSelect label="First Seen" value={'All Time'} onChange={() => {}} options={['All Time', 'Last 24h', 'Last 7 Days', 'Last 30 Days']} />
            <FilterSelect label="Last Seen" value={'All Time'} onChange={() => {}} options={['All Time', 'Last 24h', 'Last 7 Days', 'Last 30 Days']} />
          </div>

          {!isError && (
            <div className="flex flex-col gap-3">
              
              {/* Top 8 KPIs Grid */}
              <div className="grid grid-cols-8 gap-2.5">
                <SimpleKpiCard title="Total IOCs" value={data?.kpis?.ioc?.value} trend={data?.kpis?.ioc?.trend} Icon={MdHub} iconColor="#3b82f6" />
                <SimpleKpiCard title="Active IOCs" value={89432} trend={4.3} Icon={MdShield} iconColor="#22c55e" />
                <SimpleKpiCard title="Matched IOCs" value={34982} trend={7.8} Icon={MdAdsClick} iconColor="#a855f7" />
                <SimpleKpiCard title="Critical IOCs" value={7843} trend={3.1} Icon={MdWarningAmber} iconColor="#ef4444" />
                <SimpleKpiCard title="IP IOCs" value={data?.kpis?.ip?.value} trend={data?.kpis?.ip?.trend} Icon={MdLanguage} iconColor="#f97316" />
                <SimpleKpiCard title="Domain IOCs" value={data?.kpis?.domain?.value} trend={data?.kpis?.domain?.trend} Icon={MdLanguage} iconColor="#eab308" />
                <SimpleKpiCard title="Hash IOCs" value={data?.kpis?.hash?.value} trend={data?.kpis?.hash?.trend} Icon={MdLanguage} iconColor="#3b82f6" />
                <SimpleKpiCard title="URL IOCs" value={data?.kpis?.url?.value} trend={data?.kpis?.url?.trend} Icon={MdLink} iconColor="#14b8a6" />
              </div>

              {/* 4 Donut Charts */}
              <div className="grid grid-cols-4 gap-2.5">
                <DonutCard title="IP IOCs" data={data?.ipDonut} isLoading={isLoading} isEmpty={isEmpty} />
                <DonutCard title="Domain IOCs" data={data?.domainDonut} isLoading={isLoading} isEmpty={isEmpty} />
                <DonutCard title="Hash IOCs" data={data?.hashDonut} isLoading={isLoading} isEmpty={isEmpty} />
                <DonutCard title="URL IOCs" data={data?.urlDonut} isLoading={isLoading} isEmpty={isEmpty} />
              </div>

              {/* Tables & Distribution */}
              <div className="flex flex-col gap-3 mt-1">
                {filteredMatches.length === 0 && !isLoading && !isError ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 bg-black/5 border border-white/[0.05] rounded-[10px]">
                    <span className="text-[11px] text-slate-400">No matching IOC records found</span>
                  </div>
                ) : (
                  <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-1.5 [&_th]:py-2 [&_td]:px-3 [&_th]:px-3 text-[10.5px]">
                    <DetailTable
                      title="Recent IOC Matches"
                      columns={recentMatchesCols}
                      data={filteredMatches}
                      searchable={false}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-1.5 [&_th]:py-2 [&_td]:px-3 [&_th]:px-3 text-[10.5px]">
                    <DetailTable
                      title="Top IOC Sources"
                      columns={topSourcesCols}
                      data={data?.topSources || []}
                      searchable={false}
                    />
                  </div>
                  <DistributionCard data={data?.typeDistribution || []} />
                </div>

                {filteredTopRisk.length === 0 && !isLoading && !isError ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 bg-black/5 border border-white/[0.05] rounded-[10px]">
                    <span className="text-[11px] text-slate-400">No risk IOC records found</span>
                  </div>
                ) : (
                  <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-1.5 [&_th]:py-2 [&_td]:px-3 [&_th]:px-3 text-[10.5px]">
                    <DetailTable
                      title="Top IOCs by Risk"
                      columns={topRiskCols}
                      data={filteredTopRisk}
                      searchable={false}
                    />
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </PageShell>
    </div>
  )
}