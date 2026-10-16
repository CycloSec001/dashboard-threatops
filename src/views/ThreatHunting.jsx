import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer
} from 'recharts'
import PageShell, { ActSection } from '../components/PageShell'
import DetailTable from '../components/DetailTable'
import OverviewMetricCard from '../components/OverviewMetricCard'
import { MdSearch, MdFilterList, MdOutlineRemoveRedEye, MdOpenInNew } from 'react-icons/md'

import { fetchThreatHuntingData } from '../api/threatHuntingApi'
import { threatHuntingKpis } from '../data/threatOpsThreatHuntingKpis'
import api from '../api/client'
import CapabilityState from '../components/CapabilityState'

const TT = { backgroundColor: 'rgba(10, 15, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f3f4f6', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }

export default function ThreatHunting({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All Sources')
  const [queryState, setQueryState] = useState('IDLE')
  const [queryResults, setQueryResults] = useState(null)
  const [queryError, setQueryError] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchThreatHuntingData(selectedTime)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])
  
  useEffect(() => { load() }, [load])

  const runHunt = async () => {
    if (!query.trim()) return
    setQueryState('LOADING')
    setQueryError(null)
    try {
      const response = await api.runQuery(query.trim())
      setQueryResults(response)
      setQueryState('SUCCESS')
    } catch (error) {
      setQueryState(error.status === 503 ? 'SERVICE_UNAVAILABLE' : 'ERROR')
      setQueryError(error)
    }
  }

  const severityRender = v => {
    const cls = v === 'High' || v === 'Critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : v === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${cls}`}>{v}</span>
  }
  
  const statusRender = v => {
    const cls = v === 'Completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : v === 'Running' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${cls}`}>{v}</span>
  }

  const queryCols = [
    { header: 'Query', accessor: 'text', render: v => <span className="font-mono text-[10px] text-slate-200">{v}</span> },
    { header: 'Status', accessor: 'status', render: statusRender },
    { header: 'Timestamp', accessor: 'timestamp', render: v => <span className="font-mono text-[10px] text-slate-400">{v}</span> },
    { header: 'Source', accessor: 'source' },
    { header: 'Results', accessor: 'results', render: v => <span className="font-mono">{v}</span> },
    { header: 'Suspicious', accessor: 'suspicious', render: v => v !== '-' && v > 0 ? <span className="text-rose-400 font-mono font-bold">{v}</span> : <span className="font-mono">{v}</span> },
    { header: 'Actions', accessor: 'id', render: () => (
      <div className="flex gap-2 text-slate-400">
        <MdOutlineRemoveRedEye size={13} className="cursor-pointer hover:text-cyan-400 transition-colors" title="View Results" />
      </div>
    )}
  ]

  const suspCols = [
    { header: 'Timestamp', accessor: 'timestamp', render: v => <span className="font-mono text-[10px] text-slate-400">{v}</span> },
    { header: 'Entity', accessor: 'entity', render: v => <span className="font-mono text-[10px] text-slate-200">{v}</span> },
    { header: 'Type', accessor: 'entityType' },
    { header: 'Severity', accessor: 'severity', render: severityRender },
    { header: 'Source', accessor: 'source' },
    { header: 'Query', accessor: 'query', render: v => <span className="font-mono text-[10px] text-slate-400">{v}</span> },
    { header: 'Incident', accessor: 'incident', render: v => v !== '-' ? <span className="text-cyan-400 cursor-pointer hover:underline font-mono">{v}</span> : '-' },
    { header: 'Actions', accessor: 'id', render: () => (
      <div className="flex gap-2 text-slate-400">
        <MdOutlineRemoveRedEye size={13} className="cursor-pointer hover:text-cyan-400 transition-colors" />
      </div>
    )}
  ]

  return (
    <PageShell section="ThreatOps" title="Threat Hunting"
      subtitle="Search for threats, anomalies and suspicious activities across your environment."
      selectedTime={selectedTime} isLoading={false} isError={false}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>

      <div className="flex flex-col gap-3.5">
        {/* TOP TOOLBAR */}
        <div className="flex flex-col gap-2.5 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] p-3 rounded-[10px] transition-all duration-200 hover:border-white/[0.12]">
          <div className="flex items-center gap-2.5">
            <MdSearch className="text-slate-400 shrink-0" size={16} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[11.5px] text-white font-mono outline-none placeholder:text-slate-500"
              placeholder='e.g. process.name:"powershell.exe" AND rare:true'
            />
            <button onClick={runHunt} disabled={queryState === 'LOADING' || !query.trim()} className="text-[10.5px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-[6px] hover:bg-cyan-500/20 transition-all shrink-0 disabled:opacity-50">
              {queryState === 'LOADING' ? 'Running...' : 'Run Hunt'}
            </button>
          </div>

          {queryState === 'SERVICE_UNAVAILABLE' && <CapabilityState state="SERVICE_UNAVAILABLE" />}
          {queryState === 'ERROR' && <CapabilityState state={queryError?.status === 400 || queryError?.status === 422 ? 'VALIDATION_ERROR' : 'BACKEND_UNAVAILABLE'} />}
          {queryState === 'SUCCESS' && (
            <div className="rounded-lg border border-white/[0.08] p-4 text-xs text-slate-300">
              {Array.isArray(queryResults?.data) && queryResults.data.length > 0
                ? `${queryResults.data.length} result${queryResults.data.length === 1 ? '' : 's'} returned.`
                : 'Query completed successfully with no results.'}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
            <div className="flex flex-wrap items-center gap-2.5">
              <MdFilterList className="text-slate-400 shrink-0" size={14} />
              <span className="text-[9.5px] text-slate-400 shrink-0 uppercase tracking-wider">Filters:</span>
              {['All Sources', 'Severity: High', 'Entity Type: IP', 'Query Status: Completed'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`text-[9.5px] font-medium px-2.5 py-1 rounded-[6px] transition-all border
                    ${activeFilter === f
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      : 'bg-black/10 text-slate-400 border-white/[0.05] hover:border-white/[0.12] hover:text-slate-200'
                    }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {isLoading && !data ? (
             <div className="col-span-full h-[120px] flex items-center justify-center text-slate-400 text-[11px]">Loading Hunting Data...</div>
          ) : isError && !data ? (
             <div className="col-span-full h-[120px] flex items-center justify-center text-rose-400 text-[11px]">Failed to load hunting data.</div>
          ) : (
            threatHuntingKpis.map(config => {
              const kpiData = data?.kpis?.[config.key]
              return (
                <OverviewMetricCard
                  key={config.key}
                  title={config.title}
                  value={kpiData?.value}
                  trend={kpiData?.trend}
                  label={kpiData?.label}
                  sparklineData={kpiData?.sparkline}
                  type={config.visualization}
                  color={config.color}
                />
              )
            })
          )}
        </div>

        {/* THIRD ROW: ACTIVITY OVER TIME & TOP IOCs (Reduced Height & Glassmorphism) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
          {/* HUNTING ACTIVITY OVER TIME */}
          <div className="lg:col-span-2 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[220px] transition-all duration-200 hover:border-white/[0.12]">
            <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">Hunting Activity Over Time</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.activityTrend || []} margin={{ left: -25, right: 10, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSusp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                  <XAxis dataKey="t" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={TT} />
                  <Area type="monotone" dataKey="queries" stroke="#8b5cf6" fill="url(#gQueries)" strokeWidth={2} name="Queries Executed" dot={false} />
                  <Area type="monotone" dataKey="suspicious" stroke="#f59e0b" fill="url(#gSusp)" strokeWidth={2} name="Suspicious Results" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05] mt-1">
              {[{ color: '#8b5cf6', label: 'Queries Executed' }, { color: '#f59e0b', label: 'Suspicious Results' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 rounded" style={{ background: l.color }} />
                  <span className="text-[9.5px] text-slate-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TOP IOCs FOUND */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[220px] transition-all duration-200 hover:border-white/[0.12]">
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Top IOCs Found</h3>
               <span className="text-[10px] text-cyan-400 cursor-pointer hover:underline font-medium" onClick={() => setActive('ioc_explorer')}>View all</span>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-[10.5px] text-left">
                <thead className="text-slate-400 border-b border-white/[0.05]">
                  <tr>
                    <th className="pb-1.5 font-semibold text-[9.5px] uppercase tracking-wider">IOC</th>
                    <th className="pb-1.5 font-semibold text-[9.5px] uppercase tracking-wider">Type</th>
                    <th className="pb-1.5 font-semibold text-[9.5px] uppercase tracking-wider text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] text-slate-300">
                  {(data?.topIocs || []).map((ioc, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-1.5 font-mono text-slate-200 truncate max-w-[120px]" title={ioc.ioc}>{ioc.ioc}</td>
                      <td className="py-1.5 text-slate-400">{ioc.type}</td>
                      <td className="py-1.5 text-right font-mono font-medium text-white">{ioc.incidents ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TABLES CONTAINER WITH REDUCED PADDING/ROW HEIGHT THEME */}
        <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-2 [&_th]:py-2.5 [&_td]:px-3 [&_th]:px-3 text-[10.5px] transition-all duration-200 hover:border-white/[0.12]">
          {data?.recentQueries && (
            <DetailTable title="Recent Hunting Queries" description="" columns={queryCols} data={data.recentQueries} searchable={false} />
          )}
        </div>

        <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-2 [&_th]:py-2.5 [&_td]:px-3 [&_th]:px-3 text-[10.5px] transition-all duration-200 hover:border-white/[0.12]">
          {data?.recentSuspicious && (
            <DetailTable title="Recent Suspicious Results" description="" columns={suspCols} data={data.recentSuspicious} searchable={false} />
          )}
        </div>
      </div>
    </PageShell>
  )
}