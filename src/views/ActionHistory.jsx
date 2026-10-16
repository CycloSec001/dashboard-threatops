import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber } from 'react-icons/md'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer
} from 'recharts'
import { fetchActionHistoryKPIs } from '../api/threatOpsApi'
import { actionHistoryKpis } from '../data/threatOpsActionHistoryKpis'
import PageShell, { ActSection } from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'

const TT = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '11px',
  padding: '6px 10px'
}

function Row({ cols, children }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  )
}

const Card = ({ children, className = '' }) => (
  <div className={`bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 ${className}`}>
    {children}
  </div>
)

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-2">
    <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
      {title}
    </h2>
    {subtitle && (
      <p className="text-[9.5px] text-slate-400 mt-0.5">{subtitle}</p>
    )}
  </div>
)

const StatusBadge = ({ val }) => {
  const c = {
    Success: 'text-green-400 bg-green-500/15 border-green-500/30',
    Successful: 'text-green-400 bg-green-500/15 border-green-500/30',
    Failed: 'text-red-400 bg-red-500/15 border-red-500/30',
    Blocked: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    Pending: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  }
  return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${c[val] || 'text-slate-400 bg-black/5 border-white/[0.05]'}`}>{val}</span>
}

export default function ActionHistory({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchActionHistoryKPIs(selectedTime)) }
    catch (err) { console.error(err); setIsError(true) }
    finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { loadData() }, [loadData])

  const isEmpty = !isLoading && !isError && data && Object.keys(data).length === 0
  const isPartial = !isLoading && !isError && !isEmpty && data && actionHistoryKpis.some(k => data[k.key] === undefined)
  const lastUpdated = data?._lastUpdated
  const executions = data?.executions || data?.actions || []
  const recentActions = useMemo(() => executions.map((item) => ({
    time: item.executed_at || item.created_at || item.timestamp,
    action: item.action_name || item.action_type || item.action_id,
    target: item.target || item.target_id || item.incident_id,
    initiator: item.initiator || item.actor || item.requested_by,
    type: item.execution_type || item.type,
    status: item.status || item.execution_status,
    duration: item.duration_ms ? `${Math.round(item.duration_ms / 1000)}s` : null,
  })), [executions])
  const autonomous = executions.filter((item) => ['autonomous', 'automatic', 'automated'].includes(String(item.execution_type || item.type || '').toLowerCase())).length
  const manual = executions.length - autonomous
  const total = executions.length
  const autoPct = total ? Math.round((autonomous / total) * 100) : 0
  const manualPct = total ? 100 - autoPct : 0
  const volumeChart = useMemo(() => {
    const buckets = new Map()
    executions.forEach((item) => {
      const timestamp = item.executed_at || item.created_at || item.timestamp
      if (!timestamp) return
      const date = new Date(timestamp)
      const key = `${String(date.getHours()).padStart(2, '0')}:00`
      buckets.set(key, (buckets.get(key) || 0) + 1)
    })
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([t, actions]) => ({ t, actions }))
  }, [executions])

  const card = (kpi) => (
    <OverviewMetricCard key={kpi.key} config={kpi} value={data?.[kpi.key]}
      isLoading={isLoading} isError={isError} isEmpty={isEmpty}
      onClick={() => setActive(kpi.targetRoute)} />
  )

  return (
    <PageShell section="Command Center" title="Overview"
      subtitle="Real-time summary of your security operations."
      selectedTime={selectedTime} isLoading={false} isError={false}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={loadData}>
      <div
        className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
        // style={{
        //   background: `linear-gradient(#141B21 1px, transparent 1px), linear-gradient(90deg, #141B21 1px, transparent 1px), #0B0F12`,
        //   backgroundSize: '40px 40px',
        // }}
      >
        <div className="flex flex-col gap-3 px-3 pt-3 pb-6">

          {/* Page Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-0.5">Response</p>
              <h1 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Action History</h1>
              <p className="text-[9.5px] text-slate-400 mt-1">Historical record of all manual and automated actions — {selectedTime}</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {lastUpdated && !isLoading && !isError && (
                <span className="text-[9.5px] text-slate-400">Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
              )}
              <motion.button onClick={loadData} disabled={isLoading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-40">
                <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                  <MdRefresh size={13} />
                </motion.div>
                Refresh
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {isPartial && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-black/5 backdrop-blur-[1px] border border-yellow-500/20 rounded-[10px] px-3 py-2">
                <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
                <span className="text-[9.5px] text-yellow-300/80">Some data is currently unavailable. Showing partial results.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {isError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="text-red-400/60 text-5xl">⚠</div>
              <p className="text-[11px] font-semibold text-slate-200">Unable to load KPI data</p>
              <button onClick={loadData} className="mt-1 px-3 py-1.5 rounded-[6px] bg-black/5 backdrop-blur-[1px] border border-red-500/20 text-red-400 hover:border-red-500/40 hover:text-red-300 transition-all text-[9.5px] font-semibold">Retry</button>
            </motion.div>
          )}

          {!isError && (
            <div className="flex flex-col gap-3">
              {/* KPI Rows */}
              <div className="flex flex-col gap-3">
                <ActSection act="act1">
                  <Row cols={4}>{actionHistoryKpis.slice(0, 4).map(card)}</Row>
                  <Row cols={3}>{actionHistoryKpis.slice(4, 7).map(card)}</Row>
                </ActSection>
              </div>

              {/* ── Action Activity Chart ────────────────────────────────── */}
              <div>
                <SectionHeading title="Action Activity" subtitle="24-hour action volume across automated and manual operations" />
                <Card>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={volumeChart} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                        <defs>
                          <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                        <XAxis dataKey="t" stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} />
                        <YAxis stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RTooltip contentStyle={TT} />
                        <Area type="monotone" dataKey="actions" stroke="#8B5CF6" strokeWidth={2} fill="url(#actGrad)" name="Actions" dot={false} activeDot={{ r: 4, fill: '#8B5CF6' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* ── Recent Action History Table ──────────────────────────── */}
              <div>
                <SectionHeading title="Recent Action History" subtitle="Timestamped log of the most recent security actions with full context" />
                <Card className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9.5px] [&_td]:py-2 [&_th]:py-2.5 [&_td]:px-3 [&_th]:px-3">
                      <thead>
                        <tr className="border-b border-white/[0.05] bg-black/10">
                          {['Timestamp', 'Action', 'Target', 'Initiated By', 'Type', 'Status', 'Duration'].map(h => (
                            <th key={h} className="text-left text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentActions.map((row, i) => (
                          <tr key={i} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="font-mono text-slate-400 text-[9.5px] whitespace-nowrap">{row.time}</td>
                            <td className="text-white font-medium whitespace-nowrap">{row.action}</td>
                            <td className="font-mono text-slate-400 text-[9.5px] whitespace-nowrap">{row.target}</td>
                            <td className="whitespace-nowrap">
                              <span className={`text-[9.5px] font-medium ${row.type === 'Autonomous' ? 'text-purple-400' : 'text-[#9ca3af]'}`}>
                                {row.initiator}
                              </span>
                            </td>
                            <td className="whitespace-nowrap">
                              <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border ${row.type === 'Autonomous' ? 'text-purple-400 bg-purple-500/15 border-purple-500/30' : 'text-slate-400 bg-black/5 border-white/[0.05]'}`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="whitespace-nowrap"><StatusBadge val={row.status} /></td>
                            <td className="font-mono text-slate-400 text-[9.5px] whitespace-nowrap">{row.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* ── Manual vs Autonomous ─────────────────────────────────── */}
              <div>
                <SectionHeading title="Manual vs Autonomous Actions" subtitle="Breakdown of human-initiated vs AI-automated response actions" />
                <Card>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9.5px] text-slate-400">⚡ Autonomous</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white whitespace-nowrap">{autonomous}</span>
                            <span className="text-[9.5px] text-slate-400">({autoPct}%)</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${autoPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9.5px] text-slate-400">👤 Manual</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white whitespace-nowrap">{manual}</span>
                            <span className="text-[9.5px] text-slate-400">({manualPct}%)</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#00D9FF] transition-all" style={{ width: `${manualPct}%` }} />
                        </div>
                      </div>
                    </div>
                    {/* Combined bar */}
                    <div className="flex flex-col justify-center gap-2">
                      <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Combined Action Split</p>
                      <div className="h-2.5 rounded-full overflow-hidden flex">
                        <div className="h-full bg-purple-500/80 transition-all" style={{ width: `${autoPct}%` }} title={`Autonomous: ${autoPct}%`} />
                        <div className="h-full bg-[#00D9FF]/70 transition-all" style={{ width: `${manualPct}%` }} title={`Manual: ${manualPct}%`} />
                      </div>
                      <div className="flex justify-between text-[9.5px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Autonomous ({autoPct}%)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00D9FF] inline-block" /> Manual ({manualPct}%)</span>
                      </div>
                      <p className="text-[9.5px] text-slate-400 mt-2">Total: <span className="text-white font-bold">{total} actions</span></p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
