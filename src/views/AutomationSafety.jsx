import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber, MdCheckCircle, MdBlock, MdHistory } from 'react-icons/md'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend
} from 'recharts'
import PageShell, { ActSection } from '../components/PageShell'
import { fetchAutomationSafetyData } from '../api/threatOpsApi'
import { automationSafetyKpis } from '../data/threatOpsAutomationSafetyKpis'
import OverviewMetricCard from '../components/OverviewMetricCard'

const TT = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '11px',
  padding: '6px 10px',
}

const Card = ({ children, className = '' }) => (
  <div className={`bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 transition-all hover:border-white/[0.12] ${className}`}>
    {children}
  </div>
)

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-3">
    <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
      {title}
    </h2>
    {subtitle && (
      <p className="text-[9.5px] text-slate-400 mt-0.5">
        {subtitle}
      </p>
    )}
  </div>
)

const StatusBadge = ({ val }) => {
  const c = {
    Successful: 'text-green-400 bg-green-500/15 border-green-500/30',
    Approved: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
    Pending: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    Blocked: 'text-red-400 bg-red-500/15 border-red-500/30',
    Failed: 'text-red-400 bg-red-500/15 border-red-500/30',
  }
  return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${c[val] || 'text-gray-400 bg-gray-500/15 border-gray-500/30'}`}>{val}</span>
}

const TypeBadge = ({ val }) => {
  const c = {
    Autonomous: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    Approval: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  }
  return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${c[val] || 'text-gray-400 bg-gray-500/15 border-gray-500/30'}`}>{val}</span>
}

const RiskBadge = ({ val }) => {
  const c = { Critical: 'text-red-400', High: 'text-orange-400', Medium: 'text-amber-400', Low: 'text-blue-400' }
  return <span className={`text-[9.5px] font-bold uppercase tracking-wider ${c[val] || 'text-gray-400'}`}>{val}</span>
}

function KpiGrid({ cols, children }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: 'minmax(100px, auto)' }}>
      {children}
    </div>
  )
}

const safetyMetrics = [
  { icon: MdCheckCircle, name: 'Safe Actions', value: '845', desc: '98.1% of eligible actions', color: '#39FF6A', pct: 98.1 },
  { icon: MdWarningAmber, name: 'Approval Required', value: '112', desc: 'Human review required', color: '#00D9FF', pct: 15 },
  { icon: MdBlock, name: 'Blocked Actions', value: '34', desc: 'Policy prevented execution', color: '#EF4444', pct: 5 },
  { icon: MdHistory, name: 'Rollback Capable', value: '620', desc: '73.4% of automated actions', color: '#8B5CF6', pct: 73.4 },
]

const activityData = [
  { t: '00:00', safe: 12, approval: 2, blocked: 0 },
  { t: '04:00', safe: 18, approval: 4, blocked: 1 },
  { t: '08:00', safe: 31, approval: 9, blocked: 2 },
  { t: '12:00', safe: 46, approval: 14, blocked: 4 },
  { t: '16:00', safe: 39, approval: 11, blocked: 3 },
  { t: '20:00', safe: 27, approval: 6, blocked: 1 },
  { t: '24:00', safe: 22, approval: 3, blocked: 0 },
]

const actionsTable = [
  { time: '17:32', action: 'Isolate Endpoint', target: 'FIN-WS-042', risk: 'High', confidence: '98%', type: 'Autonomous', status: 'Successful' },
  { time: '17:28', action: 'Block IP', target: '185.22.41.9', risk: 'High', confidence: '96%', type: 'Autonomous', status: 'Successful' },
  { time: '17:21', action: 'Disable Account', target: 'user-1042', risk: 'Critical', confidence: '91%', type: 'Approval', status: 'Approved' },
  { time: '17:15', action: 'Quarantine File', target: 'invoice.exe', risk: 'High', confidence: '97%', type: 'Autonomous', status: 'Successful' },
  { time: '17:04', action: 'Reset Session', target: 'Admin-22', risk: 'Medium', confidence: '88%', type: 'Approval', status: 'Pending' },
]

const bottomControls = [
  { title: 'HUMAN APPROVAL', subtitle: 'Critical actions', value: 'Required', icon: MdWarningAmber, color: '#F59E0B', bg: 'bg-amber-500/10 border-amber-500/20' },
  { title: 'ROLLBACK', subtitle: '620 actions', value: 'Available', icon: MdHistory, color: '#39FF6A', bg: 'bg-green-500/10 border-green-500/20' },
  { title: 'POLICY BLOCKING', subtitle: '34 actions', value: 'Blocked', icon: MdBlock, color: '#EF4444', bg: 'bg-red-500/10 border-red-500/20' },
  { title: 'SAFETY VIOLATIONS', subtitle: '18', value: 'Needs Review', icon: MdWarningAmber, color: '#F97316', bg: 'bg-orange-500/10 border-orange-500/20' },
]

export default function AutomationSafety({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchAutomationSafetyData(selectedTime)) }
    catch (err) { console.error(err); setIsError(true) }
    finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { loadData() }, [loadData])

  const isEmpty = !isLoading && !isError && data && Object.keys(data).length === 0
  const isPartial = !isLoading && !isError && !isEmpty && data && automationSafetyKpis.some(k => data[k.key] === undefined)
  const lastUpdated = data?._lastUpdated

  const card = (kpi) => (
    <OverviewMetricCard key={kpi.key} config={kpi} value={data?.[kpi.key]}
      isLoading={isLoading} isError={isError} isEmpty={isEmpty}
      onClick={() => setActive(kpi.targetRoute)} />
  )

  return (
    <PageShell section="AI Operations" title="Automation Safety" subtitle="Analyze safety metrics for automated actions and policies" selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={isPartial} lastUpdated={data?._lastUpdated} onRefresh={loadData}>
      <div
        className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      // style={{
      //   background: `linear-gradient(#141B21 1px, transparent 1px), linear-gradient(90deg, #141B21 1px, transparent 1px), #0B0F12`,
      //   backgroundSize: '40px 40px',
      // }}
      >
        <div className="flex flex-col gap-3 px-3 sm:px-4 lg:px-5 pt-4 pb-6 max-w-7xl">

          {/* Page Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Response</p>
              <h1 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Automation Safety</h1>
              <p className="text-[9.5px] text-slate-400">Analyze safety metrics for automated actions and policies — {selectedTime}</p>
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
                className="flex items-center gap-3 bg-black/5 backdrop-blur-[1px] border border-amber-500/20 rounded-[10px] px-3 py-2">
                <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
                <span className="text-[9.5px] text-amber-200/90">Some metrics are currently unavailable. Showing partial results.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {isError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-3 py-8 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px]">
              <div className="text-red-400/60 text-5xl">⚠</div>
              <p className="text-[11px] font-semibold text-slate-200">Unable to load Automation Safety data</p>
              <button onClick={loadData} className="mt-1 px-5 py-2 rounded-[8px] bg-black/5 backdrop-blur-[1px] border border-red-700/40 text-red-400 hover:border-red-600/60 transition-all text-[9.5px] font-semibold">Retry</button>
            </motion.div>
          )}

          {!isError && (
            <div className="flex flex-col gap-4">
              {/* KPI cards (Unchanged) */}
              <KpiGrid cols={6}>{automationSafetyKpis.map(card)}</KpiGrid>

              {/* ── Safety Score & Controls ───────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="flex flex-col min-h-[260px]">
                  <SectionHeading title="Automation Safety Score" subtitle="Overall safety level of automated response actions" />
                  <div className="flex-1 flex flex-col items-center justify-center pt-2">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#39FF6A" strokeWidth="8" strokeDasharray="263.89" strokeDashoffset={263.89 * (1 - 0.94)} strokeLinecap="round" />
                      </svg>
                      <div className="flex flex-col items-center justify-center z-10">
                        <span className="text-[22px] font-bold text-white leading-none">94%</span>
                        <span className="text-[9.5px] font-bold text-[#39FF6A] mt-1.5 tracking-[0.2em]">SAFE</span>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-green-400 mt-2 font-medium">+2.4% vs previous 24h</p>
                  </div>
                </Card>

                <Card className="flex flex-col min-h-[260px]">
                  <SectionHeading title="Safety Controls" subtitle="Status of core automation safety mechanisms" />
                  <div className="flex-1 flex flex-col justify-between py-1 gap-3">
                    {safetyMetrics.map(m => {
                      const Icon = m.icon
                      return (
                        <div key={m.name} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon size={16} style={{ color: m.color }} />
                              <span className="text-[9.5px] font-semibold text-slate-200">{m.name}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-[13px] font-bold text-white">{m.value}</span>
                              <span className="text-[9.5px] text-slate-400 w-32 text-right">{m.desc}</span>
                            </div>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden ml-6">
                            <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>

              {/* ── Automation Activity Chart ────────────────────────────── */}
              <div>
                <SectionHeading title="Automation Activity" subtitle="Automated response activity over the last 24 hours" />
                <Card>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="safeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#39FF6A" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#39FF6A" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="approvalGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="t" stroke="#4a5568" fontSize={9.5} tickLine={false} axisLine={false} />
                        <YAxis stroke="#4a5568" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RTooltip contentStyle={TT} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '9.5px', color: '#9ca3af', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="safe" name="Safe" stroke="#39FF6A" strokeWidth={2} fill="url(#safeGrad)" activeDot={{ r: 4 }} />
                        <Area type="monotone" dataKey="approval" name="Approval Required" stroke="#00D9FF" strokeWidth={2} fill="url(#approvalGrad)" activeDot={{ r: 4 }} />
                        <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#EF4444" strokeWidth={2} fill="url(#blockedGrad)" activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* ── Recent Automated Actions Table ──────────────────────── */}
              <div>
                <SectionHeading title="Recent Automated Actions" subtitle="Most recent response tasks processed by the automation engine" />
                <Card className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9.5px]">
                      <thead>
                        <tr className="border-b border-white/[0.05] bg-black/10">
                          {['TIME', 'ACTION', 'TARGET', 'RISK', 'CONFIDENCE', 'TYPE', 'STATUS'].map(h => (
                            <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-semibold text-slate-200 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {actionsTable.map((row, i) => (
                          <tr key={i} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="px-3 py-2 font-mono text-[#9ca3af] text-[9.5px] whitespace-nowrap">{row.time}</td>
                            <td className="px-3 py-2 text-white font-medium whitespace-nowrap">{row.action}</td>
                            <td className="px-3 py-2 font-mono text-[#d1d5db] text-[9.5px] whitespace-nowrap">{row.target}</td>
                            <td className="px-3 py-2 whitespace-nowrap"><RiskBadge val={row.risk} /></td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-mono text-[#00D9FF] text-[9.5px]">{row.confidence}</span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap"><TypeBadge val={row.type} /></td>
                            <td className="px-3 py-2 whitespace-nowrap"><StatusBadge val={row.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* ── Automation Safety Controls Cards ────────────────────── */}
              <div className="grid grid-cols-4 gap-3">
                {bottomControls.map(ctrl => {
                  const Icon = ctrl.icon
                  return (
                    <div
                      key={ctrl.title}
                      className="flex flex-col gap-2 p-3 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] transition-all hover:border-white/[0.12]"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} style={{ color: ctrl.color }} />
                        <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">{ctrl.title}</span>
                      </div>
                      <div className="mt-1">
                        <p className="text-[9.5px] text-slate-400">{ctrl.subtitle}</p>
                        <p className="text-[11px] font-bold text-white mt-0.5">{ctrl.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
