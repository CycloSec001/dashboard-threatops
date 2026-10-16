import { useState, useEffect, useCallback } from 'react'
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import PageShell from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import { MdSearch } from 'react-icons/md'
import { HiOutlineExternalLink, HiOutlineEye } from 'react-icons/hi'
import { FiFilter } from 'react-icons/fi'

import { fetchAlertsSignalsData } from '../api/alertsSignalsApi'
import { alertsSignalsKpis } from '../data/threatOpsAlertsSignalsKpis'

const TT = { backgroundColor: 'rgba(10, 15, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f3f4f6', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }

const ConfidenceBadge = ({ val }) => {
  const norm = String(val || '').toLowerCase()
  const c = norm === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
    : norm === 'high' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : norm === 'medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${c}`}>{val}</span>
}
const StatusBadge = ({ val }) => {
  const c = val === 'New' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' 
    : val === 'Suppressed' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    : 'text-slate-400 bg-black/10 border-white/[0.05]'
  return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${c}`}>{val}</span>
}

const FilterDropdown = ({ label, options, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9.5px] text-slate-400 uppercase tracking-wider pl-1">{label}</label>
    <div className="relative">
      <select 
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-200 rounded-[6px] px-2.5 py-1.5 outline-none appearance-none pr-7 w-full min-w-[110px] focus:border-cyan-500/40 transition-colors cursor-pointer"
      >
        {options.map(o => <option key={o} value={o} className="bg-[#0a0f19] text-white">{o}</option>)}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▾</div>
    </div>
  </div>
)

export default function AlertsSignals({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterSeverity, setFilterSeverity] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterSource, setFilterSource] = useState('All')
  const [filterCorrelation, setFilterCorrelation] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  
  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchAlertsSignalsData(selectedTime)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])
  useEffect(() => { load() }, [load])

  const filteredSignals = (data?.recentSignals || []).filter(row => {
    if (search) {
      const q = search.toLowerCase()
      const matches = (row.name || '').toLowerCase().includes(q) ||
                      (row.source || '').toLowerCase().includes(q) ||
                      (row.type || '').toLowerCase().includes(q) ||
                      (row.incident || '').toLowerCase().includes(q)
      if (!matches) return false
    }
    if (filterType !== 'All' && row.type !== filterType) return false
    if (filterSeverity !== 'All' && String(row.severity).toLowerCase() !== filterSeverity.toLowerCase()) return false
    if (filterStatus !== 'All' && row.status !== filterStatus) return false
    if (filterSource !== 'All' && !String(row.source).toLowerCase().includes(filterSource.toLowerCase())) return false
    if (filterCorrelation !== 'All') {
      if (filterCorrelation === 'Correlated' && row.correlated !== 'Yes') return false
      if (filterCorrelation === 'Standalone' && row.correlated === 'Yes') return false
    }
    return true
  })

  const totalFiltered = filteredSignals.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const paginatedSignals = filteredSignals.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleClearFilters = () => {
    setSearch('')
    setFilterType('All')
    setFilterSeverity('All')
    setFilterStatus('All')
    setFilterSource('All')
    setFilterCorrelation('All')
    setCurrentPage(1)
  }

  return (
    <PageShell section="Command Center" title="Alerts & Signals"
      subtitle="Monitor incoming signals, anomalies and correlation activity in real time."
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>

      <div className="flex flex-col gap-2.5">
        
        {/* Two Column Layout: Left (8 Cards) & Right (Wider New Signals Graph spanning 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
          
          {/* Left Column: 8 Cards (Span 8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-2">
            {alertsSignalsKpis.slice(0, 8).map(config => {
              const kpiData = data?.kpis?.[config.key]
              return (
                <div key={config.key} className="[&>div]:min-h-[72px] [&>div]:py-1.5 [&>div]:px-3">
                  <OverviewMetricCard
                    title={config.title}
                    value={kpiData?.value}
                    trend={kpiData?.trend}
                    label={kpiData?.label}
                    subtext={kpiData?.subtext}
                    sparklineData={kpiData?.sparkline}
                    type={config.visualization}
                    color={config.color}
                  />
                </div>
              )
            })}
          </div>

          {/* Right Column: New Signals Graph (Wider width, spanning 4 cols) */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-2 flex flex-col justify-between transition-all duration-200 hover:border-white/[0.12] lg:col-span-4">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[10px] font-semibold text-slate-200 uppercase tracking-wider">New Signals Trend</span>
              <span className="text-[8.5px] text-slate-400 bg-black/10 border border-white/[0.05] rounded px-1.5 py-0.5">{selectedTime}</span>
            </div>
            <div className="flex-1 w-full h-[155px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.newSignalsTrend || []} margin={{ left: -25, right: 0, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                  <XAxis dataKey="t" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}K` : val} />
                  <RTooltip contentStyle={TT} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] flex flex-col overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
          <div className="p-2.5 border-b border-white/[0.05] flex flex-wrap items-end gap-2 bg-black/10">
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-[9px] text-slate-400 uppercase tracking-wider pl-1">Search</label>
              <div className="relative">
                <MdSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                  placeholder="Search signals by name, source, type, incident..." 
                  className="w-full bg-black/10 border border-white/[0.05] text-[10px] text-slate-200 rounded-[6px] pl-7 pr-3 py-1 outline-none focus:border-cyan-500/40 transition-colors" 
                />
              </div>
            </div>
            <FilterDropdown label="Signal Type" options={['All', 'Authentication', 'Network', 'Process', 'User Activity']} value={filterType} onChange={v => { setFilterType(v); setCurrentPage(1) }} />
            <FilterDropdown label="Severity" options={['All', 'Critical', 'High', 'Medium', 'Low']} value={filterSeverity} onChange={v => { setFilterSeverity(v); setCurrentPage(1) }} />
            <FilterDropdown label="Status" options={['All', 'New', 'Investigating', 'Suppressed', 'Closed', 'Valid']} value={filterStatus} onChange={v => { setFilterStatus(v); setCurrentPage(1) }} />
            <FilterDropdown label="Source" options={['All', 'Windows', 'Firewall', 'DNS', 'Authentication', 'Network']} value={filterSource} onChange={v => { setFilterSource(v); setCurrentPage(1) }} />
            <FilterDropdown label="Correlation" options={['All', 'Correlated', 'Standalone']} value={filterCorrelation} onChange={v => { setFilterCorrelation(v); setCurrentPage(1) }} />
            <button 
              onClick={handleClearFilters}
              className="text-cyan-400 hover:text-cyan-300 text-[10px] font-medium ml-1 mb-1.5 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>

          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-white/[0.05] bg-black/10 text-slate-400">
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Time</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Signal Name</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Source</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Severity</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Risk Score</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Correlated</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Anomaly</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider">Incident</th>
                  <th className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-right pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] text-slate-300">
                {paginatedSignals.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-500 text-xs">
                      {data?.recentSignals?.length ? 'No signals matching the selected filters.' : 'No signals detected for the selected period.'}
                    </td>
                  </tr>
                ) : (
                  paginatedSignals.map((row, i) => (
                    <tr key={row.id || i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-2.5 py-1.5 font-mono text-slate-400 whitespace-nowrap text-[9px]">{row.time}</td>
                      <td className="px-2.5 py-1.5 text-white font-medium whitespace-nowrap">{row.name}</td>
                      <td className="px-2.5 py-1.5 text-slate-400 whitespace-nowrap">{row.source}</td>
                      <td className="px-2.5 py-1.5 text-slate-400 whitespace-nowrap">{row.type}</td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap"><ConfidenceBadge val={row.severity} /></td>
                      <td className={`px-2.5 py-1.5 font-bold whitespace-nowrap font-mono ${row.riskScore >= 90 ? 'text-rose-400' : row.riskScore >= 70 ? 'text-amber-400' : row.riskScore >= 50 ? 'text-yellow-400' : 'text-emerald-400'}`}>{row.riskScore}</td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap"><StatusBadge val={row.status} /></td>
                      <td className={`px-2.5 py-1.5 font-medium whitespace-nowrap ${row.correlated === 'Yes' ? 'text-emerald-400' : 'text-slate-500'}`}>{row.correlated}</td>
                      <td className={`px-2.5 py-1.5 font-medium whitespace-nowrap ${row.anomaly === 'Yes' ? 'text-emerald-400' : 'text-slate-500'}`}>{row.anomaly}</td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap">{row.incident !== '-' && row.incident !== 'N/A' ? <span className="text-cyan-400 hover:underline cursor-pointer font-mono">{row.incident}</span> : <span className="text-slate-600">-</span>}</td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap text-right pr-3">
                        <div className="flex items-center justify-end gap-1.5 text-slate-400 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button className="hover:text-cyan-400 transition-colors" title="View Details"><HiOutlineEye size={13} /></button>
                          <button className="hover:text-white transition-colors" title="Open in new tab"><HiOutlineExternalLink size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 border-t border-white/[0.05] flex justify-between items-center bg-black/10 text-[10px]">
            <span className="text-slate-400">
              Showing {totalFiltered > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered} signals
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2 py-0.5 bg-black/10 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors text-[10px]"
              >
                &lt;
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pageNum = idx + 1
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(totalPages - 4 + idx, currentPage - 2 + idx)
                }
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-0.5 border rounded font-medium text-[10px] transition-colors ${
                      currentPage === pageNum 
                        ? 'bg-blue-600/85 border-blue-500/60 text-white' 
                        : 'bg-black/10 border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && <span className="text-slate-500 px-1">...</span>}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2 py-0.5 bg-black/10 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors text-[10px]"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  )
}