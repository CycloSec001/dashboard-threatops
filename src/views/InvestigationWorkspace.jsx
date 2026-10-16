import { useState, useEffect, useCallback } from 'react'
import PageShell from '../components/PageShell'
import { KpiBigNumber } from '../components/KpiCards'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts'
import {
  MdSearch, MdArrowForwardIos, MdAccessTime, MdOutlineFactCheck,
  MdOutlineWarningAmber, MdOutlineGpsFixed, MdKeyboardArrowDown,
  MdComputer, MdOutlineSecurity, MdPersonOutline, MdFilterAltOff,
  MdOutlineAssignment, MdCheckCircleOutline, MdOutlineInventory2,
  MdOutlineGroupWork, MdOutlineLink, MdOutlineFilePresent,
  MdNotes, MdAddTask, MdOutlineEscalator, MdTimeline,
  MdOutlineKeyboardArrowDown, MdOutlineFolderOpen
} from 'react-icons/md'
import { FiActivity, FiFilter } from 'react-icons/fi'
import { HiOutlineEye, HiOutlineExternalLink } from 'react-icons/hi'
import { BsThreeDots } from 'react-icons/bs'
import api from '../api/client'

// ── Shared helpers ──────────────────────────────────────────────────────────

const FilterDropdown = ({ label, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9.5px] text-slate-400 uppercase tracking-wider pl-1 font-medium">{label}</label>
    <div className="relative">
      <select className="bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-200 rounded-[6px] px-2.5 py-1.5 outline-none appearance-none pr-7 w-full min-w-[110px] focus:border-cyan-500/40 transition-colors cursor-pointer">
        {options.map(o => <option key={o} value={o} className="bg-[#0a0f19] text-white">{o}</option>)}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▾</div>
    </div>
  </div>
)

const Badge = ({ children, colorClass }) => (
  <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider whitespace-nowrap ${colorClass}`}>{children}</span>
)

const TT = {
  contentStyle: { background: 'rgba(10, 15, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
  itemStyle: { color: '#f3f4f6' },
  cursor: { stroke: 'rgba(255,255,255,0.08)' }
}

// ── Severity / Status colour maps ────────────────────────────────------------
const SEV_COLOR = {
  Critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  High:     'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Low:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}
const STATUS_COLOR = {
  'In Progress':       'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Waiting Evidence':  'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Review':            'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'On Hold':           'text-slate-400 bg-black/10 border-white/[0.05]',
  'Escalated':         'text-rose-400 bg-rose-500/10 border-rose-500/20',
  'Closed':            'text-slate-500 bg-slate-600/10 border-slate-600/20',
}

// ── Mock data fetch ────────────────────────────────────────────────────────
async function fetchData() {
  const response = await api.getInvestigations({ limit: 50 })
  const investigations = response?.data || []
  return {
    kpis: {
      openInvestigations: { value: investigations.length },
      criticalInvestigations: { value: 'N/A' },
      avgInvestigationAge: { value: 'N/A' },
      evidenceItems: { value: 'N/A' },
      entitiesInvestigated: { value: 'N/A' },
      investigationsCompleted: { value: 'N/A' },
    },
    overTimeChart: [],
    bySeverity: [],
    byStatus: [],
    investigations,
    totalCount: response?.metadata?.total_records ?? response?.count ?? investigations.length,
    _lastUpdated: new Date().toISOString(),
  }
/* Legacy fixture implementation retained below only as unreachable source during migration. */
/*
  await new Promise(r => setTimeout(r, Math.random() * 500 + 300))

  const kpis = {
    openInvestigations:       { value: '48',    trend: { value: '12%', label: 'vs yesterday', direction: 'up',   color: 'green' } },
    criticalInvestigations:   { value: '8',     trend: { value: '33%', label: 'vs yesterday', direction: 'up',   color: 'red'   } },
    avgInvestigationAge:      { value: '2h 47m',trend: { value: '18%', label: 'vs yesterday', direction: 'up',   color: 'yellow'} },
    evidenceItems:            { value: '1,124', trend: { value: '9%',  label: 'vs yesterday', direction: 'up',   color: 'green' } },
    entitiesInvestigated:     { value: '356',   trend: { value: '14%', label: 'vs yesterday', direction: 'up',   color: 'green' } },
    investigationsCompleted:  { value: '27',    trend: { value: '8%',  label: 'vs yesterday', direction: 'up',   color: 'green' } },
  }

  const overTimeChart = [
    { t: 'May 08', opened: 52, closed: 38, stillOpen: 46 },
    { t: 'May 09', opened: 60, closed: 45, stillOpen: 52 },
    { t: 'May 10', opened: 58, closed: 55, stillOpen: 60 },
    { t: 'May 11', opened: 65, closed: 50, stillOpen: 58 },
    { t: 'May 12', opened: 70, closed: 62, stillOpen: 70 },
    { t: 'May 13', opened: 55, closed: 58, stillOpen: 65 },
    { t: 'May 14', opened: 68, closed: 48, stillOpen: 72 },
    { t: 'May 15', opened: 72, closed: 55, stillOpen: 80 },
  ]

  const bySeverity = [
    { name: 'Critical', value: 8,  fill: '#f43f5e' },
    { name: 'High',     value: 14, fill: '#fb923c' },
    { name: 'Medium',   value: 18, fill: '#facc15' },
    { name: 'Low',      value: 8,  fill: '#34d399' },
  ]

  const byStatus = [
    { name: 'In Progress',       value: 24, fill: '#38bdf8' },
    { name: 'On Hold',           value: 8,  fill: '#94a3b8' },
    { name: 'Waiting Evidence', value: 6,  fill: '#facc15' },
    { name: 'Review',            value: 6,  fill: '#c084fc' },
    { name: 'Escalated',         value: 4,  fill: '#f43f5e' },
  ]

  const investigations = [
    { id: 'INV-2025-0515-0048', title: 'Ransomware activity on WS-1042', severity: 'Critical', status: 'In Progress',     owner: 'John Doe',     source: 'EDR',             createdAt: 'May 15, 2025 21:45:12', age: '2h 15m', evidence: 28, tasks: '5/8' },
    { id: 'INV-2025-0515-0047', title: 'Suspicious PowerShell execution',  severity: 'High',    status: 'Waiting Evidence', owner: 'Sarah Lee',    source: 'SIEM',            createdAt: 'May 15, 2025 21:12:33', age: '2h 48m', evidence: 16, tasks: '3/6' },
    { id: 'INV-2025-0515-0046', title: 'Credential dumping attempt',      severity: 'High',    status: 'In Progress',     owner: 'Mike Ross',    source: 'EDR',             createdAt: 'May 15, 2025 20:51:07', age: '3h 9m',  evidence: 32, tasks: '4/7' },
    { id: 'INV-2025-0515-0045', title: 'Multiple failed login brute force',severity: 'Medium',   status: 'Review',          owner: 'Alice Johnson', source: 'IAM',            createdAt: 'May 15, 2025 20:41:22', age: '3h 19m', evidence: 10, tasks: '2/4' },
    { id: 'INV-2025-0515-0044', title: 'Lateral movement detection',      severity: 'Critical', status: 'Escalated',        owner: 'David Brown',   source: 'NDR',             createdAt: 'May 15, 2025 20:32:18', age: '3h 28m', evidence: 41, tasks: '6/8' },
    { id: 'INV-2025-0515-0043', title: 'Malicious document execution',    severity: 'Medium',   status: 'On Hold',           owner: 'Emily Clark',   source: 'Email Security', createdAt: 'May 15, 2025 19:55:43', age: '4h 4m',  evidence: 12, tasks: '2/5' },
    { id: 'INV-2025-0515-0042', title: 'Data exfiltration attempt',       severity: 'High',    status: 'In Progress',     owner: 'Robert Wilson', source: 'Proxy',           createdAt: 'May 15, 2025 19:40:11', age: '4h 19m', evidence: 22, tasks: '4/6' },
    { id: 'INV-2025-0515-0041', title: 'Suspicious DNS tunneling',        severity: 'Low',     status: 'Review',          owner: 'Priya Sharma',  source: 'DNS',             createdAt: 'May 15, 2025 19:15:09', age: '4h 44m', evidence: 8,  tasks: '1/3' },
  ]

  return { kpis, overTimeChart, bySeverity, byStatus, investigations, totalCount: 48, _lastUpdated: new Date().toISOString() }
*/
}

// ── Custom donut label ───────────────────────────────────────────────────────
const DonutCenter = ({ cx, cy, total, label }) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
    <tspan x={cx} dy="-6" fontSize="18" fontWeight="700" fill="#fff">{total}</tspan>
    <tspan x={cx} dy="18" fontSize="9" fill="#94a3b8">{label}</tspan>
  </text>
)

// ── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ inv, onClose }) {
  if (!inv) return (
    <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-6 flex flex-col items-center justify-center gap-3 min-h-[300px]">
      <MdOutlineFolderOpen size={36} className="text-slate-600" />
      <p className="text-[11.5px] text-slate-400">Select an investigation to view details</p>
    </div>
  )

  const activities = [
    { time: '23:18', text: 'Process quarantined on WS-1042' },
    { time: '23:18', text: 'Malicious file detected' },
    { time: '22:10', text: 'Network connection blocked' },
    { time: '22:10', text: 'Suspicious process started' },
    { time: '21:45', text: 'Investigation created' },
  ]

  return (
    <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-4 flex flex-col gap-3.5 overflow-y-auto max-h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono text-cyan-400 mb-1 hover:underline cursor-pointer">{inv.id}</p>
          <h3 className="text-[12px] font-semibold text-white leading-snug">{inv.title}</h3>
        </div>
        <Badge colorClass={SEV_COLOR[inv.severity] || ''}>{inv.severity}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10.5px]">
        {[
          ['Status', <Badge key="s" colorClass={STATUS_COLOR[inv.status] || ''}>{inv.status}</Badge>],
          ['Owner', inv.owner],
          ['Created At', inv.createdAt],
          ['Last Updated', 'May 15, 2025 23:30:45'],
          ['Age', inv.age],
          ['Source', inv.source],
          ['Priority', 'P1'],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <span className="text-slate-400">{k}</span>
            <span className="text-white font-medium">{v}</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-white/[0.05]" />

      <div>
        <p className="text-[10.5px] font-semibold text-white mb-1">Description</p>
        <p className="text-[10.5px] text-slate-300 leading-relaxed">
          Multiple indicators of ransomware activity detected on workstation WS-1042.
          Process encryption and suspicious file modifications observed.
        </p>
      </div>

      <div className="h-px bg-white/[0.05]" />

      <div>
        <p className="text-[10.5px] font-semibold text-white mb-2.5">Evidence Summary</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: MdOutlineFilePresent,  label: 'Files',     val: inv.evidence, color: '#38bdf8' },
            { icon: MdComputer,            label: 'Endpoints', val: 8,             color: '#34d399' },
            { icon: MdPersonOutline,       label: 'Users',     val: 2,             color: '#c084fc' },
            { icon: MdOutlineGpsFixed,     label: 'IPs',       val: 5,             color: '#fb923c' },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} className="bg-black/10 border border-white/[0.05] rounded-[8px] p-2 flex flex-col items-center gap-1">
              <Icon size={16} style={{ color }} />
              <span className="text-[12px] font-bold text-white">{val}</span>
              <span className="text-[9px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/[0.05]" />

      <div>
        <p className="text-[10.5px] font-semibold text-white mb-2">Recent Activities</p>
        <div className="flex flex-col gap-1.5">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-[10.5px]">
              <span className="text-slate-400 shrink-0 font-mono">{a.time}</span>
              <span className="text-slate-300">{a.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/[0.05]" />

      <div>
        <p className="text-[10.5px] font-semibold text-white mb-2.5">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Add Evidence', icon: MdOutlineInventory2 },
            { label: 'Add Note',     icon: MdNotes              },
            { label: 'Create Task',  icon: MdAddTask            },
            { label: 'Escalate',     icon: MdOutlineEscalator   },
          ].map(({ label, icon: Icon }) => (
            <button key={label}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-black/10 hover:bg-white/[0.08] border border-white/[0.08] rounded-[6px] text-[10px] text-white font-medium transition-colors">
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
        <button className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-[6px] text-[11px] text-cyan-400 font-semibold transition-colors">
          <MdTimeline size={13} /> View Full Timeline
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InvestigationWorkspace({ selectedTime, setActive }) {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]     = useState(false)
  const [selectedInv, setSelectedInv] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchData()) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])
  useEffect(() => { load() }, [load])

  const sevTotal  = data?.bySeverity?.reduce((s, x) => s + x.value, 0) ?? 0
  const statTotal = data?.byStatus?.reduce((s, x) => s + x.value, 0) ?? 0

  return (
    <PageShell
      section="Investigation"
      title="Investigation Workspace"
      subtitle="Manage, analyze and respond to security investigations in progress."
      selectedTime={selectedTime}
      isLoading={isLoading}
      isError={isError}
      isPartial={false}
      lastUpdated={data?._lastUpdated}
      onRefresh={load}
    >
      <div className="flex flex-col gap-3.5">

        {/* ── KPI Row (Increased height via py & min-h styling inside cards or container) ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 [&>div]:min-h-[85px] [&>div]:py-2.5">
          <KpiBigNumber title="Open Investigations"       icon={MdOutlineFolderOpen}   value={data?.kpis.openInvestigations.value       ?? 0} trend={data?.kpis.openInvestigations.trend}       iconColor="#38bdf8" footerRight={<>View all <MdArrowForwardIos size={10}/></>}      routeKey="open"       setActive={setActive} />
          <KpiBigNumber title="Critical Investigations"   icon={MdOutlineWarningAmber} value={data?.kpis.criticalInvestigations.value   ?? 0} trend={data?.kpis.criticalInvestigations.trend}   iconColor="#f43f5e" footerRight={<>View critical <MdArrowForwardIos size={10}/></>}  routeKey="critical"   setActive={setActive} />
          <KpiBigNumber title="Average Investigation Age" icon={MdAccessTime}          value={data?.kpis.avgInvestigationAge.value       ?? 0} trend={data?.kpis.avgInvestigationAge.trend}       iconColor="#fb923c" footerRight={<>View details <MdArrowForwardIos size={10}/></>}   routeKey="age"        setActive={setActive} />
          <KpiBigNumber title="Evidence Items"            icon={MdOutlineInventory2}   value={data?.kpis.evidenceItems.value               ?? 0} trend={data?.kpis.evidenceItems.trend}             iconColor="#34d399" footerRight={<>View evidence <MdArrowForwardIos size={10}/></>}  routeKey="evidence"   setActive={setActive} />
          <KpiBigNumber title="Entities Investigated"     icon={MdOutlineGroupWork}    value={data?.kpis.entitiesInvestigated.value     ?? 0} trend={data?.kpis.entitiesInvestigated.trend}     iconColor="#c084fc" footerRight={<>View entities <MdArrowForwardIos size={10}/></>}  routeKey="entities"   setActive={setActive} />
          <KpiBigNumber title="Investigations Completed" icon={MdCheckCircleOutline}  value={data?.kpis.investigationsCompleted.value  ?? 0} trend={data?.kpis.investigationsCompleted.trend}  iconColor="#10b981" footerRight={<>View completed <MdArrowForwardIos size={10}/></>} routeKey="completed" setActive={setActive} />
        </div>

        {/* ── Charts Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" style={{ height: 190 }}>

          {/* Investigations Over Time */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Investigations Over Time</h3>
              <div className="flex items-center text-[10px] text-slate-300 bg-black/10 border border-white/[0.05] rounded-[6px] px-2 py-0.5 gap-1 cursor-pointer">
                Last 7 Days <MdKeyboardArrowDown size={11}/>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-1 text-[9.5px] text-slate-400 pl-1">
              <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span> Opened</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-400 inline-block"></span> Closed</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-purple-400 inline-block" style={{ borderStyle: 'dashed', borderTop: '2px dashed #c084fc', height: 0 }}></span> Still Open</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.overTimeChart || []} margin={{ top: 2, right: 4, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                  <XAxis dataKey="t" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <RTooltip {...TT} />
                  <Line type="monotone" dataKey="opened"   stroke="#38bdf8" strokeWidth={2} dot={false} name="Opened" />
                  <Line type="monotone" dataKey="closed"   stroke="#34d399" strokeWidth={2} dot={false} name="Closed" />
                  <Line type="monotone" dataKey="stillOpen" stroke="#c084fc" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Still Open" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Investigations by Severity */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
            <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Investigations by Severity</h3>
            <div className="flex-1 min-h-0 flex items-center gap-2">
              <div className="flex-1 h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.bySeverity || []} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" paddingAngle={2}>
                      {(data?.bySeverity || []).map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="transparent" />
                      ))}
                    </Pie>
                    {sevTotal > 0 && <DonutCenter cx="50%" cy="50%" total={sevTotal} label="Total" />}
                    <Tooltip contentStyle={TT.contentStyle} itemStyle={TT.itemStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 pr-1">
                {(data?.bySeverity || []).map(({ name, value, fill }) => (
                  <div key={name} className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: fill }}></div>
                    <span className="text-slate-300">{name}</span>
                    <span className="text-white font-medium ml-auto pl-2">{value} ({sevTotal ? Math.round(value/sevTotal*100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Investigations by Status */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
            <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Investigations by Status</h3>
            <div className="flex-1 min-h-0 flex items-center gap-2">
              <div className="flex-1 h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.byStatus || []} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" paddingAngle={2}>
                      {(data?.byStatus || []).map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="transparent" />
                      ))}
                    </Pie>
                    {statTotal > 0 && <DonutCenter cx="50%" cy="50%" total={statTotal} label="Total" />}
                    <Tooltip contentStyle={TT.contentStyle} itemStyle={TT.itemStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-1 shrink-0 pr-1">
                {(data?.byStatus || []).map(({ name, value, fill }) => (
                  <div key={name} className="flex items-center gap-1.5 text-[9.5px]">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: fill }}></div>
                    <span className="text-slate-300 truncate max-w-[85px]">{name}</span>
                    <span className="text-white font-medium ml-auto pl-1">{value} ({statTotal ? Math.round(value/statTotal*100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────────── */}
        <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-wrap items-end gap-2.5 transition-all duration-200 hover:border-white/[0.12]">
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Search</label>
            <div className="relative">
              <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search investigations..." className="w-full bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-200 rounded-[6px] pl-8 pr-3 py-1.5 outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
          </div>
          <FilterDropdown label="Severity"   options={['All', 'Critical', 'High', 'Medium', 'Low']} />
          <FilterDropdown label="Status"     options={['All', 'In Progress', 'Waiting Evidence', 'Review', 'On Hold', 'Escalated']} />
          <FilterDropdown label="Owner"      options={['All', 'John Doe', 'Sarah Lee', 'Mike Ross']} />
          <FilterDropdown label="Source"     options={['All', 'EDR', 'SIEM', 'IAM', 'NDR', 'Proxy', 'DNS']} />
          <FilterDropdown label="Created By" options={['All']} />
          <div className="flex items-center gap-1.5 bg-black/10 border border-white/[0.05] px-2.5 py-1.5 rounded-[6px] text-[10.5px] text-slate-200 cursor-pointer hover:border-white/[0.12]">
            <MdAccessTime size={13} className="text-slate-400"/> All Time <MdKeyboardArrowDown size={12} className="text-slate-400 ml-0.5"/>
          </div>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[10.5px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent transition-colors">
            <MdFilterAltOff size={14}/> Clear Filters
          </button>
        </div>

        {/* ── Table + Detail panel ──────────────────────────────────────────── */}
        <div className="grid gap-3 items-start" style={{ gridTemplateColumns: selectedInv ? '1fr 340px' : '1fr' }}>

          {/* Table */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] flex flex-col overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
            <div className="p-3 border-b border-white/[0.05] bg-black/10">
              <h3 className="text-[11px] font-semibold text-white uppercase tracking-wider">Investigations ({data?.totalCount ?? 0})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px] text-[10.5px]">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-black/10 text-slate-400">
                    {['ID','Title','Severity','Status','Owner','Source','Created At','Age','Evidence','Tasks','Actions'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-[9.5px] font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] text-slate-300">
                  {(!data?.investigations || data.investigations.length === 0) ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-slate-500 text-xs">
                        No investigations found.
                      </td>
                    </tr>
                  ) : (
                    data.investigations.map((row, i) => {
                      const [doneTasks, totalTasks] = typeof row.tasks === 'string' && row.tasks.includes('/')
                        ? row.tasks.split('/').map(n => parseInt(n, 10))
                        : [0, 1]
                      const progressPct = totalTasks > 0 ? Math.min(100, Math.max(0, (doneTasks / totalTasks) * 100)) : 0

                      return (
                        <tr
                          key={i}
                          onClick={() => setSelectedInv(prev => prev?.id === row.id ? null : row)}
                          className={`hover:bg-white/[0.02] transition-colors cursor-pointer group
                            ${selectedInv?.id === row.id ? 'bg-cyan-500/[0.04] border-l-2 border-l-cyan-400' : 'border-l-2 border-l-transparent'}`}
                        >
                          <td className="px-3 py-2 text-cyan-400 font-mono whitespace-nowrap hover:underline">{row.id}</td>
                          <td className="px-3 py-2 text-white font-medium whitespace-nowrap max-w-[180px] truncate">{row.title}</td>
                          <td className="px-3 py-2 whitespace-nowrap"><Badge colorClass={SEV_COLOR[row.severity] || ''}>{row.severity}</Badge></td>
                          <td className="px-3 py-2 whitespace-nowrap"><Badge colorClass={STATUS_COLOR[row.status]  || ''}>{row.status}</Badge></td>
                          <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.owner}</td>
                          <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.source}</td>
                          <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap text-[10px]">{row.createdAt}</td>
                          <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap text-[10px]">{row.age}</td>
                          <td className="px-3 py-2 text-white font-mono">{row.evidence}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono">{row.tasks || '—'}</span>
                              <div className="w-8 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${progressPct}%` }}></div>
                              </div>
                            </div>
                          </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 text-slate-400 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button className="hover:text-cyan-400 transition-colors" title="View"><HiOutlineEye size={14}/></button>
                          <button className="hover:text-white transition-colors" title="Open"><HiOutlineExternalLink size={14}/></button>
                          <button className="hover:text-white transition-colors" title="More"><BsThreeDots size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-2.5 border-t border-white/[0.05] flex justify-between items-center bg-black/10 text-[10px]">
              <span className="text-slate-400">Showing 1 to 8 of {data?.totalCount ?? 0} investigations</span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-0.5 bg-black/10 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded transition-colors">&lt;</button>
                {[1,2,3,4,5].map(p => (
                  <button key={p} className={`px-2 py-0.5 rounded transition-colors ${p === 1 ? 'bg-blue-600/85 border border-blue-500/60 text-white font-medium' : 'bg-black/10 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08]'}`}>{p}</button>
                ))}
                <span className="text-slate-500 px-1">...</span>
                <span className="text-slate-400 ml-2">10 / page</span>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedInv && <DetailPanel inv={selectedInv} onClose={() => setSelectedInv(null)} />}
        </div>

      </div>
    </PageShell>
  )
}