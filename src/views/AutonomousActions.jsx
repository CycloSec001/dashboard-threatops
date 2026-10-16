import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdRefresh, MdWarningAmber, MdSearch, MdFilterList,
  MdOutlineVisibility, MdClose, MdCheckCircle, MdCancel,
  MdPending, MdErrorOutline, MdFlashOn, MdSecurity,
  MdHistory, MdSchedule, MdPlayArrow, MdSettingsSuggest
} from 'react-icons/md'
import PageShell, { ActSection } from '../components/PageShell'
import { KpiBigNumber } from '../components/KpiCards'
import DetailTable from '../components/DetailTable'

const TT = {
  contentStyle: { background: 'rgba(10, 15, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f3f4f6', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
}

function StatusBadge({ val }) {
  const map = {
    'Successful': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Failed': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Blocked': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Approval Required': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Pending': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Rolled Back': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Rejected': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Expired': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${map[val] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{val}</span>
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-200 rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/40 appearance-none cursor-pointer w-full pr-8 transition-colors">
          {options.map(o => <option key={o} value={o} className="bg-[#0a0f19] text-white">{o}</option>)}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▾</div>
      </div>
    </div>
  )
}

function ActionDetailModal({ action, onClose }) {
  if (!action) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-black/90 backdrop-blur-md border border-white/[0.1] rounded-[12px] w-full max-w-[680px] max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between p-4 pb-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-black/20 border border-white/[0.06] flex items-center justify-center shadow-sm">
                <MdFlashOn size={18} className="text-[#00D9FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-[14px] font-bold text-white">{action.id}</h2>
                  <StatusBadge val={action.status} />
                </div>
                <p className="text-[11px] text-slate-400">{action.actionType} · {action.target}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-[6px] hover:bg-white/10 transition-colors">
              <MdClose size={16} />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Action Type', value: action.actionType },
                { label: 'Target', value: action.target, mono: true },
                { label: 'Source', value: action.source },
                { label: 'Initiated By', value: action.initiatedBy },
                { label: 'Started At', value: action.startedAt },
                { label: 'Response Time', value: action.responseTime },
                { label: 'Playbook', value: action.playbook || '—' },
                { label: 'Related Incident', value: action.incident || '—' },
              ].map(f => (
                <div key={f.label} className="bg-black/10 rounded-[8px] border border-white/[0.05] p-2.5">
                  <p className="text-[9.5px] text-slate-400 uppercase tracking-wider mb-0.5">{f.label}</p>
                  <p className={`text-[11px] text-white font-medium ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
                </div>
              ))}
            </div>
            {(action.failureReason || action.blockReason) && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-[8px] p-2.5">
                <p className="text-[9.5px] text-rose-400 uppercase tracking-wider mb-0.5">
                  {action.failureReason ? 'Failure Reason' : 'Block Reason'}
                </p>
                <p className="text-[11px] text-slate-200">{action.failureReason || action.blockReason}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

async function fetchData(timeFilter) {
  return { kpis: {}, execTrend: [], statusDist: [], actionsByType: [], recentActions: [], perfSummary: [], unsupported: 'Use backend action execution records; autonomous-action aggregates are not exposed.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, 400))
  const m = { 'Last 24 Hours': 1, 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90 }[timeFilter] || 1
  const j = (b, r = 0.25) => Math.max(0, Math.round(b * m * (1 - r + Math.random() * r * 2)))

  const kpis = {
    actionsExecuted: { value: j(1287 / m), trend: { value: '12.4%', label: 'vs yesterday', direction: 'up', color: 'green' } },
    successfulActions: { value: j(1102 / m), trend: { value: '10.7%', label: 'vs yesterday', direction: 'up', color: 'green' } },
    failedActions: { value: j(102 / m), trend: { value: '8.6%', label: 'vs yesterday', direction: 'down', color: 'red' } },
    blockedActions: { value: j(41 / m), trend: { value: '3.2%', label: 'vs yesterday', direction: 'down', color: 'green' } },
    approvalRequired: { value: j(53 / m), trend: { value: '5.3%', label: 'vs yesterday', direction: 'up', color: 'orange' } },
    avgResponseTime: { value: '3m 42s', trend: { value: '9.5%', label: 'vs yesterday', direction: 'down', color: 'green' } },
  }

  const labels = timeFilter === 'Last 7 Days' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : timeFilter === 'Last 30 Days' ? ['W1', 'W2', 'W3', 'W4']
    : timeFilter === 'Last 90 Days' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']

  const execTrend = labels.map(t => ({
    t,
    executed: j(180 / m / labels.length),
    failed: j(15 / m / labels.length),
    blocked: j(6 / m / labels.length),
  }))

  const statusDist = [
    { name: 'Successful', value: kpis.successfulActions.value, color: '#10b981' },
    { name: 'Failed', value: kpis.failedActions.value, color: '#ef4444' },
    { name: 'Blocked', value: kpis.blockedActions.value, color: '#f97316' },
    { name: 'Approval Required', value: kpis.approvalRequired.value, color: '#eab308' },
  ]

  const actionsByType = [
    { name: 'Isolate Host', count: j(312 / m) },
    { name: 'Block IP', count: j(201 / m) },
    { name: 'Quarantine File', count: j(176 / m) },
    { name: 'Disable User', count: j(131 / m) },
    { name: 'Revoke Token', count: j(109 / m) },
    { name: 'Block Domain', count: j(95 / m) },
    { name: 'Kill Process', count: j(74 / m) },
    { name: 'Reset Password', count: j(48 / m) },
  ].sort((a, b) => b.count - a.count)

  const actionTypes = ['Isolate Host', 'Block IP', 'Quarantine File', 'Disable User', 'Revoke Token', 'Block Domain', 'Kill Process', 'Reset Password']
  const targets = ['WIN-10-22-45', '203.0.113.45', 'invoice.exe', 'jdoe@company.com', 'bad-domain.com', 'malware.exe', 'SRV-FS-02']
  const statuses = ['Successful', 'Successful', 'Successful', 'Failed', 'Blocked', 'Approval Required', 'Rolled Back']
  const sources = ['EDR', 'Firewall', 'EDR', 'Proxy', 'EDR', 'IAM', 'EDR', 'SIEM']
  const playbooks = ['Playbook: Host Isolation', 'Playbook: Block IP', 'Playbook: Malware Response', 'Playbook: Suspicious Login', 'Policy: Domain Block']
  const responseTimes = ['1m 12s', '32s', '45s', '28s', '—', '2m 05s', '18s', '1m 08s']

  const recentActions = Array.from({ length: 10 }, (_, i) => ({
    id: `ACT-2026-${String(1290 - i).padStart(4, '0')}`,
    actionType: actionTypes[i % actionTypes.length],
    target: targets[i % targets.length],
    source: sources[i % sources.length],
    status: statuses[i % statuses.length],
    initiatedBy: ['Playbook Engine', 'Manual', 'System', 'Analyst'][i % 4],
    startedAt: `Today 23:${51 - i}:${10 + i * 2 < 60 ? 10 + i * 2 : i}`,
    responseTime: responseTimes[i % responseTimes.length],
    playbook: playbooks[i % playbooks.length],
    incident: `INC-2026-${100 + i}`,
    failureReason: statuses[i % statuses.length] === 'Failed' ? 'Agent not reachable — host offline' : null,
    blockReason: statuses[i % statuses.length] === 'Blocked' ? 'Policy: Domain Block requires Tier-2 approval' : null,
  }))

  const perfSummary = {
    successRate: Math.round((kpis.successfulActions.value / Math.max(1, kpis.actionsExecuted.value)) * 100),
    failureRate: Math.round((kpis.failedActions.value / Math.max(1, kpis.actionsExecuted.value)) * 100),
    blockRate: Math.round((kpis.blockedActions.value / Math.max(1, kpis.actionsExecuted.value)) * 100),
    avgTime: '3m 42s',
  }

  return { kpis, execTrend, statusDist, actionsByType, recentActions, perfSummary, _lastUpdated: new Date().toISOString() }
}

export default function AutonomousActions({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [selectedAction, setSelectedAction] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchData(selectedTime)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { load() }, [load])

  const filteredActions = useMemo(() => {
    if (!data?.recentActions) return []
    return data.recentActions.filter(a => {
      if (statusFilter !== 'All' && a.status !== statusFilter) return false
      if (sourceFilter !== 'All' && a.source !== sourceFilter) return false
      if (searchQuery && !`${a.id} ${a.actionType} ${a.target}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [data, statusFilter, sourceFilter, searchQuery])

  const totalActions = useMemo(() => (data?.statusDist || []).reduce((s, d) => s + d.value, 0), [data])

  const actionCols = [
    { accessor: 'id', header: 'Action ID', render: v => <span className="text-cyan-400 cursor-pointer font-mono text-[10.5px] font-medium">{v}</span> },
    { accessor: 'actionType', header: 'Action Type' },
    { accessor: 'target', header: 'Target', render: v => <span className="font-mono text-[10.5px] text-slate-300">{v}</span> },
    { accessor: 'source', header: 'Source' },
    { accessor: 'status', header: 'Status', render: v => <StatusBadge val={v} /> },
    { accessor: 'initiatedBy', header: 'Initiated By' },
    { accessor: 'startedAt', header: 'Started At' },
    { accessor: 'responseTime', header: 'Response Time' },
    { accessor: '_view', header: '', render: (_, row) => (
      <button onClick={e => { e.stopPropagation(); setSelectedAction(row) }} className="text-slate-400 hover:text-cyan-400 transition-colors p-1">
        <MdOutlineVisibility size={14} />
      </button>
    )},
  ]

  return (
    <PageShell section="Command Center" title="Autonomous Actions"
      subtitle="Monitor, analyze and take action on automated security operations and responses."
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      lastUpdated={data?._lastUpdated} onRefresh={load}>

      <div className="flex flex-col gap-3.5 w-full">

        <ActSection act="act1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3">
            {[
              { id: 'actionsExecuted', title: 'Actions Executed', icon: MdPlayArrow, color: '#00D9FF' },
              { id: 'successfulActions', title: 'Successful', icon: MdCheckCircle, color: '#10b981' },
              { id: 'failedActions', title: 'Failed', icon: MdCancel, color: '#ef4444' },
              { id: 'blockedActions', title: 'Blocked', icon: MdSecurity, color: '#f97316' },
              { id: 'approvalRequired', title: 'Pending Approval', icon: MdPending, color: '#eab308' },
              { id: 'avgResponseTime', title: 'Avg Response Time', icon: MdSchedule, color: '#8b5cf6' },
            ].map(def => {
              const kpiData = data?.kpis?.[def.id] || {}
              return <KpiBigNumber key={def.id} title={def.title} icon={def.icon} iconColor={def.color} value={kpiData.value} trend={kpiData.trend} />
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px_320px] gap-3">
            {/* Actions Over Time */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[200px] transition-all duration-200 hover:border-white/[0.12]">
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">Actions Executed Over Time</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.execTrend || []} margin={{ left: -25, right: 10, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gExec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                    <XAxis dataKey="t" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={TT.contentStyle} cursor={TT.cursor} />
                    <Area type="monotone" dataKey="executed" stroke="#00D9FF" fill="url(#gExec)" strokeWidth={2} name="Executed" dot={false} />
                    <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="none" strokeWidth={1.5} name="Failed" dot={false} strokeDasharray="4 2" />
                    <Area type="monotone" dataKey="blocked" stroke="#f97316" fill="none" strokeWidth={1.5} name="Blocked" dot={false} strokeDasharray="2 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
                {[{ color: '#00D9FF', label: 'Executed' }, { color: '#ef4444', label: 'Failed' }, { color: '#f97316', label: 'Blocked' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 rounded" style={{ background: l.color }} />
                    <span className="text-[9.5px] text-slate-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Donut (Fixed overflow with compact radius and height) */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[200px] transition-all duration-200 hover:border-white/[0.12]">
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Actions by Status</h3>
              <div className="relative h-[95px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.statusDist || []} cx="50%" cy="50%" innerRadius={34} outerRadius={46} paddingAngle={2} dataKey="value" stroke="none">
                      {(data?.statusDist || []).map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <RTooltip contentStyle={TT.contentStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span className="text-[13px] font-bold text-white">{totalActions.toLocaleString()}</span>
                  <span className="text-[7.5px] text-slate-400 uppercase tracking-wider">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 border-t border-white/[0.05] mt-auto">
                {(data?.statusDist || []).map(d => (
                  <div key={d.name} className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-slate-300 truncate">{d.name}</span>
                    </div>
                    <span className="font-semibold text-white">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Type bar */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col h-[200px] transition-all duration-200 hover:border-white/[0.12]">
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">Action Type Distribution</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.actionsByType || []} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} width={85} />
                    <RTooltip contentStyle={TT.contentStyle} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </ActSection>

        <ActSection act="act3">
          {/* Filter bar */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 mb-3 flex flex-wrap items-end gap-3 transition-all duration-200 hover:border-white/[0.12]">
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
              options={['All', 'Successful', 'Failed', 'Blocked', 'Approval Required', 'Rolled Back']} />
            <FilterSelect label="Source" value={sourceFilter} onChange={setSourceFilter}
              options={['All', 'EDR', 'Firewall', 'Proxy', 'SIEM', 'IAM']} />
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Search</label>
              <div className="flex items-center gap-2 bg-black/10 border border-white/[0.05] rounded-[6px] px-2.5 py-1.5 focus-within:border-cyan-500/40 transition-colors">
                <MdSearch size={14} className="text-slate-400 flex-shrink-0" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search actions..." className="bg-transparent text-[10.5px] text-slate-200 placeholder:text-slate-500 outline-none w-full" />
              </div>
            </div>
          </div>

          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-2 [&_th]:py-2.5 [&_td]:px-3 [&_th]:px-3 text-[10.5px] transition-all duration-200 hover:border-white/[0.12]">
            <DetailTable title="Recent Autonomous Actions" columns={actionCols} data={filteredActions} searchable={false} />
          </div>
        </ActSection>

        <ActSection act="act4">
          {/* Performance Summary */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3.5 mb-3 transition-all duration-200 hover:border-white/[0.12]">
            <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-3">Action Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data?.perfSummary && [
                { label: 'Success Rate', value: `${data.perfSummary.successRate}%`, color: '#10b981', bar: data.perfSummary.successRate },
                { label: 'Failure Rate', value: `${data.perfSummary.failureRate}%`, color: '#ef4444', bar: data.perfSummary.failureRate },
                { label: 'Block Rate', value: `${data.perfSummary.blockRate}%`, color: '#f97316', bar: data.perfSummary.blockRate },
                { label: 'Avg Exec Time', value: data.perfSummary.avgTime, color: '#00D9FF', bar: null },
              ].map(m => (
                <div key={m.label} className="flex flex-col bg-black/10 border border-white/[0.05] rounded-[8px] p-3 gap-1.5">
                  <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">{m.label}</span>
                  <span className="text-[18px] font-bold" style={{ color: m.color }}>{m.value}</span>
                  {m.bar !== null && (
                    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, m.bar)}%`, background: m.color }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3.5 flex items-center justify-between gap-4 transition-all duration-200 hover:border-white/[0.12]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <MdSettingsSuggest className="text-amber-400" size={18} />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-white mb-0.5">Governance Controls</p>
                <p className="text-[10.5px] text-slate-400">Intervene on the autonomous engine or audit recent actions.</p>
              </div>
            </div>
            <div className="flex gap-2.5 flex-shrink-0">
              <button className="text-[11px] font-medium bg-black/10 text-white border border-white/[0.08] px-3 py-1.5 rounded-[6px] hover:bg-white/[0.08] transition-all">
                Audit Logs
              </button>
              <button className="text-[11px] font-medium bg-black/10 text-white border border-white/[0.08] px-3 py-1.5 rounded-[6px] hover:bg-white/[0.08] transition-all">
                Override Approvals
              </button>
              <button className="text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-[6px] hover:bg-rose-500/20 transition-all">
                Halt Engine
              </button>
            </div>
          </div>
        </ActSection>

      </div>

      {selectedAction && <ActionDetailModal action={selectedAction} onClose={() => setSelectedAction(null)} />}
    </PageShell>
  )
}