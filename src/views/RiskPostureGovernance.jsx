import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Treemap, Cell,
  AreaChart, Area
} from 'recharts'
import {
  MdRefresh, MdWarningAmber, MdSearch, MdFilterList,
  MdOutlineVisibility, MdClose, MdErrorOutline,
  MdCheckCircle, MdPending, MdCancel, MdSchedule,
  MdPolicy, MdSecurity, MdGavel, MdUploadFile
} from 'react-icons/md'
import { ActSection } from '../components/PageShell'
import DetailTable from '../components/DetailTable'

// ── Shared styles ──────────────────────────────────────────────────────────────
const TT = {
  contentStyle: { background: '#0d1117', border: '1px solid #21262d', borderRadius: '8px', color: '#e8f0ea', fontSize: '12px' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
}

// ── Badges ─────────────────────────────────────────────────────────────────────
function StatusBadge({ val }) {
  const map = {
    'Approved':      'bg-green-500/15 text-green-400 border-green-500/30',
    'Allow':         'bg-green-500/15 text-green-400 border-green-500/30',
    'Pending':       'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    'Under Review':  'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Review':        'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Block':         'bg-red-500/15 text-red-400 border-red-500/30',
    'Blocked':       'bg-red-500/15 text-red-400 border-red-500/30',
    'Exception':     'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Active':        'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Expired':       'bg-gray-500/15 text-gray-400 border-gray-500/30',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-[4px] border text-[10px] font-semibold ${map[val] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {val}
    </span>
  )
}

function DecisionBadge({ val }) {
  const map = {
    'Allow':     'bg-green-500/15 text-green-400 border-green-500/30',
    'Block':     'bg-red-500/15 text-red-400 border-red-500/30',
    'Review':    'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Exception': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-[4px] border text-[10px] font-semibold ${map[val] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {val}
    </span>
  )
}

// ── Filter select ──────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="bg-[#111827] border border-[#1f2937] text-[12px] text-white rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-[#374151] appearance-none cursor-pointer"
        style={{ minWidth: 110 }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ── Governance Detail Modal ────────────────────────────────────────────────────
function GovernanceDetailModal({ record, onClose }) {
  if (!record) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0d1117] border border-[#1f2937] rounded-[14px] w-full max-w-[660px] max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between p-6 pb-4 border-b border-[#1f2937]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#1c2631] border border-[#1f2937] flex items-center justify-center">
                <MdGavel size={20} className="text-[#8B5CF6]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-[16px] font-bold text-white">{record.policy}</h2>
                  <StatusBadge val={record.status} />
                </div>
                <p className="text-[12px] text-[#6b7280]">{record.entity}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[#6b7280] hover:text-white p-1 rounded-[6px] hover:bg-white/10 transition-colors">
              <MdClose size={18} />
            </button>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Policy / Rule', value: record.policy },
                { label: 'Entity', value: record.entity },
                { label: 'Decision', value: <DecisionBadge val={record.decision} /> },
                { label: 'Status', value: <StatusBadge val={record.status} /> },
                { label: 'Exception ID', value: record.exception || '—' },
                { label: 'Timestamp', value: record.timestamp },
                { label: 'Evidence', value: record.evidence || '—' },
                { label: 'Reviewer', value: record.reviewer },
              ].map(f => (
                <div key={f.label} className="bg-[#111827] rounded-[8px] border border-[#1f2937] p-3">
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">{f.label}</p>
                  <div className="text-[12px] text-white font-medium">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Bullet graph row ───────────────────────────────────────────────────────────
function BulletRow({ control, current, target, color = '#22c55e' }) {
  const pct = Math.min(100, Math.round(current))
  const tpct = Math.min(100, Math.round(target))
  const barColor = pct >= tpct ? '#22c55e' : pct >= tpct * 0.8 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center gap-3 group">
      <div className="w-[155px] flex-shrink-0 text-[11px] text-[#d1d5db] truncate" title={control}>{control}</div>
      <div className="flex-1 relative h-4 bg-[#1f2937] rounded-[3px] overflow-visible">
        {/* Background track */}
        <div className="absolute inset-0 bg-[#1f2937] rounded-[3px]" />
        {/* Current bar */}
        <div className="absolute top-0 left-0 h-full rounded-[3px] transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor }} />
        {/* Target marker */}
        <div className="absolute top-[-3px] h-[22px] w-[3px] bg-white rounded-full z-10 shadow-[0_0_6px_rgba(255,255,255,0.5)]"
          style={{ left: `calc(${tpct}% - 1.5px)` }}
          title={`Target: ${tpct}%`} />
      </div>
      <div className="w-[52px] text-right text-[12px] font-semibold" style={{ color: barColor }}>{pct}%</div>
      <div className="w-[52px] text-right text-[11px] text-[#6b7280]">{tpct}%</div>
    </div>
  )
}

// ── Treemap custom content ─────────────────────────────────────────────────────
const TREEMAP_COLORS = ['#ef4444','#f97316','#eab308','#8b5cf6','#3b82f6','#06b6d4','#10b981','#ec4899','#6366f1']

function CustomTreemapContent({ x, y, width, height, name, value, index }) {
  if (width < 30 || height < 24) return null
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2}
        fill={TREEMAP_COLORS[index % TREEMAP_COLORS.length]} rx={4} opacity={0.85} />
      {width > 60 && height > 40 && (
        <>
          <text x={x + 8} y={y + 18} fill="white" fontSize={11} fontWeight="600" style={{ pointerEvents: 'none' }}>
            {name}
          </text>
          {height > 52 && (
            <text x={x + 8} y={y + 32} fill="rgba(255,255,255,0.7)" fontSize={10} style={{ pointerEvents: 'none' }}>
              {value}%
            </text>
          )}
        </>
      )}
    </g>
  )
}

// ── Audit timeline event ───────────────────────────────────────────────────────
const EVENT_ICONS = {
  'Exception Created': { icon: MdPolicy, color: '#8b5cf6' },
  'Access Blocked':    { icon: MdCancel, color: '#ef4444' },
  'Control Updated':   { icon: MdSecurity, color: '#3b82f6' },
  'Policy Approved':   { icon: MdCheckCircle, color: '#22c55e' },
  'Evidence Uploaded': { icon: MdUploadFile, color: '#06b6d4' },
  'Access Allowed':    { icon: MdCheckCircle, color: '#22c55e' },
  'Review Decision':   { icon: MdSchedule, color: '#f59e0b' },
}

function AuditEvent({ event, onClick }) {
  const meta = EVENT_ICONS[event.type] || { icon: MdPolicy, color: '#6b7280' }
  const Icon = meta.icon
  const decisionMap = { 'Exception': 'bg-purple-500/15 text-purple-400 border-purple-500/30', 'Block': 'bg-red-500/15 text-red-400 border-red-500/30', 'Update': 'bg-blue-500/15 text-blue-400 border-blue-500/30', 'Approve': 'bg-green-500/15 text-green-400 border-green-500/30', 'Evidence': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', 'Allow': 'bg-green-500/15 text-green-400 border-green-500/30' }

  return (
    <div onClick={() => onClick && onClick(event)}
      className="flex items-start gap-3 py-3 border-b border-[#1f2937]/60 last:border-0 hover:bg-[#1f2937]/30 rounded-[6px] px-2 -mx-2 cursor-pointer transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border mt-0.5"
        style={{ background: `${meta.color}15`, borderColor: `${meta.color}30` }}>
        <Icon size={14} style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-white">{event.type}</span>
          {event.decision && (
            <span className={`text-[9px] font-bold border rounded-[3px] px-1.5 py-0.5 ${decisionMap[event.decision] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
              {event.decision}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#9ca3af] mt-0.5 truncate">{event.detail}</p>
        {event.reviewer && <p className="text-[10px] text-[#6b7280] mt-0.5">Reviewer: {event.reviewer}</p>}
      </div>
      <span className="text-[10px] text-[#4a5568] flex-shrink-0 mt-1 font-mono">{event.time}</span>
    </div>
  )
}

// ── Backend-ready data service ─────────────────────────────────────────────────
async function fetchGovernanceData(timeFilter) {
  return { kpis: {}, policies: [], entities: [], unsupported: 'Risk-posture governance analytics are not exposed by the backend API.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, Math.random() * 600 + 350))
  const m = { 'Last 24 Hours': 1, 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90 }[timeFilter] || 1
  const j = (b, r = 0.22) => Math.max(0, Math.round(b * (1 - r + Math.random() * r * 2)))

  const tLabels = timeFilter === 'Last 7 Days' ? ['May 20','May 21','May 22','May 23','May 24','May 25','May 26']
    : timeFilter === 'Last 30 Days' ? ['May 1','May 8','May 15','May 22','May 29']
    : timeFilter === 'Last 90 Days' ? ['Mar','Apr','May','Jun']
    : ['May 20','May 21','May 22','May 23','May 24','May 25','May 26']

  const riskTrend = tLabels.map((t, i) => ({
    t,
    riskIndex: j(60 + i * 3, 0.15),
  }))

  const riskByAsset = [
    { name: 'Servers',         risk: j(82) },
    { name: 'Endpoints',       risk: j(68) },
    { name: 'Cloud Resources', risk: j(57) },
    { name: 'Network Devices', risk: j(46) },
    { name: 'Applications',    risk: j(38) },
    { name: 'Databases',       risk: j(28) },
    { name: 'Containers',      risk: j(22) },
    { name: 'Users',           risk: j(18) },
    { name: 'SaaS Apps',       risk: j(14) },
    { name: 'IoT',             risk: j(9)  },
  ].sort((a, b) => b.risk - a.risk)

  const riskByAttack = [
    { name: 'Initial Access', value: 28 },
    { name: 'Execution', value: 18 },
    { name: 'Privilege Escalation', value: 14 },
    { name: 'Defense Evasion', value: 12 },
    { name: 'Lateral Movement', value: 6 },
    { name: 'Collection', value: 5 },
    { name: 'Impact', value: 4 },
    { name: 'Discovery', value: 3 },
  ]

  const controls = [
    { control: 'Access Control',         current: j(78, 0.05), target: 90 },
    { control: 'Data Protection',        current: j(65, 0.05), target: 85 },
    { control: 'Endpoint Security',      current: j(82, 0.05), target: 90 },
    { control: 'Vulnerability Mgmt',     current: j(60, 0.05), target: 85 },
    { control: 'Network Security',       current: j(75, 0.05), target: 88 },
    { control: 'Logging & Monitoring',   current: j(70, 0.05), target: 90 },
    { control: 'Incident Response',      current: j(80, 0.05), target: 95 },
    { control: 'Security Awareness',     current: j(55, 0.05), target: 80 },
  ]

  const exceptionTrend = tLabels.map((t, i) => ({
    t,
    exceptions: j(60 + i * 4, 0.25),
  }))

  const decisionDist = tLabels.map(t => ({
    t,
    Allow:     j(750 * m / tLabels.length),
    Block:     j(300 * m / tLabels.length),
    Review:    j(150 * m / tLabels.length),
    Exception: j(60 * m / tLabels.length),
  }))

  const auditEvents = [
    { id: 'AE-001', type: 'Exception Created', detail: 'Policy: USB Storage Access', decision: 'Exception', reviewer: 'j.doe@company.com', time: '23:45:12' },
    { id: 'AE-002', type: 'Access Blocked',    detail: 'Access blocked: USB Storage Access', decision: 'Block', reviewer: null, time: '23:31:07' },
    { id: 'AE-003', type: 'Control Updated',   detail: 'Control: Endpoint Protection', decision: 'Update', reviewer: null, time: '23:12:54' },
    { id: 'AE-004', type: 'Policy Approved',   detail: 'Policy: Remote Desktop Access', decision: 'Approve', reviewer: 'r.lee@company.com', time: '22:10:18' },
    { id: 'AE-005', type: 'Evidence Uploaded', detail: 'Policy: Encryption At Rest', decision: 'Evidence', reviewer: null, time: '22:04:39' },
    { id: 'AE-006', type: 'Access Allowed',    detail: 'User: m.smith@company.com', decision: 'Allow', reviewer: null, time: '21:55:02' },
  ]

  const governanceEvidence = [
    { id: 'GE-001', policy: 'Remote Desktop Access Policy', entity: 'User: j.doe@company.com', decision: 'Allow', exception: '—', timestamp: 'May 26, 2025 23:45:12', evidence: 'Log, Screenshot', reviewer: 'r.lee@company.com', status: 'Approved' },
    { id: 'GE-002', policy: 'USB Storage Access',           entity: 'Endpoint: LAPTOP-32F1',   decision: 'Block', exception: 'EX-2025-127', timestamp: 'May 26, 2025 23:31:07', evidence: 'Screenshot', reviewer: 'm.smith@company.com', status: 'Under Review' },
    { id: 'GE-003', policy: 'MFA Enforcement',              entity: 'User: admin@company.com', decision: 'Block', exception: 'EX-2025-129', timestamp: 'May 26, 2025 22:50:33', evidence: 'Audit Log', reviewer: 's.wilson@company.com', status: 'Approved' },
    { id: 'GE-004', policy: 'Data Retention Policy',        entity: 'Database: HR_DB',         decision: 'Review', exception: 'EX-2025-128', timestamp: 'May 26, 2025 22:15:21', evidence: 'Report', reviewer: 'r.lee@company.com', status: 'Approved' },
    { id: 'GE-005', policy: 'Privileged Access Policy',     entity: 'User: svc_backup',        decision: 'Block', exception: 'EX-2025-126', timestamp: 'May 26, 2025 21:40:18', evidence: 'Audit Log', reviewer: 'd.jones@company.com', status: 'Pending' },
    { id: 'GE-006', policy: 'Email Security Policy',        entity: 'Email: user@company.com', decision: 'Allow', exception: '—', timestamp: 'May 26, 2025 21:05:42', evidence: 'Log', reviewer: 'm.smith@company.com', status: 'Approved' },
    { id: 'GE-007', policy: 'Encryption At Rest Policy',    entity: 'S3 Bucket: finance-data', decision: 'Review', exception: 'EX-2025-125', timestamp: 'May 26, 2025 20:32:11', evidence: 'Screenshot', reviewer: 'r.lee@company.com', status: 'Under Review' },
    { id: 'GE-008', policy: 'Network Segmentation Policy',  entity: 'Server: WEB-01',          decision: 'Block', exception: '—', timestamp: 'May 26, 2025 18:55:09', evidence: 'Log', reviewer: 's.wilson@company.com', status: 'Approved' },
  ]

  return {
    riskTrend, riskByAsset, riskByAttack,
    controls, exceptionTrend, decisionDist,
    auditEvents, governanceEvidence,
    _lastUpdated: new Date().toISOString(),
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RiskPostureGovernance({ selectedTime, setActive }) {
  const [data, setData]           = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]     = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  // Filters
  const [riskFilter, setRiskFilter]         = useState('All')
  const [assetFilter, setAssetFilter]       = useState('All')
  const [decisionFilter, setDecisionFilter] = useState('All')
  const [statusFilter, setStatusFilter]     = useState('All')
  const [searchQuery, setSearchQuery]       = useState('')

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchGovernanceData(selectedTime)) }
    catch { setIsError(true) }
    finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { load() }, [load])

  const filteredEvidence = useMemo(() => {
    if (!data?.governanceEvidence) return []
    return data.governanceEvidence.filter(r => {
      if (decisionFilter !== 'All' && r.decision !== decisionFilter) return false
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (searchQuery && !`${r.policy} ${r.entity} ${r.reviewer}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [data, decisionFilter, statusFilter, searchQuery])

  // Table columns
  const evidenceCols = [
    { accessor: 'policy',    header: 'Rule / Policy',  render: v => <span className="text-[#60a5fa] cursor-pointer hover:underline text-[11px]">{v}</span> },
    { accessor: 'entity',    header: 'Entity',         render: v => <span className="text-[11px]">{v}</span> },
    { accessor: 'decision',  header: 'Decision',       render: v => <DecisionBadge val={v} /> },
    { accessor: 'exception', header: 'Exception',      render: v => v === '—' ? <span className="text-[#4a5568]">—</span> : <span className="text-[#a78bfa] font-mono text-[10px]">{v}</span> },
    { accessor: 'timestamp', header: 'Timestamp',      render: v => <span className="font-mono text-[10px]">{v}</span> },
    { accessor: 'evidence',  header: 'Evidence',       render: v => <span className="text-[#06b6d4] text-[11px]">{v}</span> },
    { accessor: 'reviewer',  header: 'Reviewer',       render: v => <span className="text-[11px]">{v}</span> },
    { accessor: 'status',    header: 'Status',         render: v => <StatusBadge val={v} /> },
    { accessor: '_view',     header: 'Actions',        render: (_, row) => (
      <button onClick={e => { e.stopPropagation(); setSelectedRecord(row) }} className="text-[#6b7280] hover:text-white transition-colors p-1">
        <MdOutlineVisibility size={14} />
      </button>
    )},
  ]

  const isLoadingNoData = isLoading && !data

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      style={{ background: 'linear-gradient(#141B21 1px,transparent 1px),linear-gradient(90deg,#141B21 1px,transparent 1px),#0B0F12', backgroundSize: '40px 40px' }}>
      <div className="flex flex-col gap-5 px-6 pt-6 pb-12">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[10px] font-semibold text-[#8B5CF6] uppercase tracking-[0.15em] mb-0.5">
              Governance · Risk, Posture &amp; Governance
            </p>
            <h1 className="text-[26px] font-bold text-white leading-tight">Risk, Posture, Governance &amp; Audit</h1>
            <p className="text-[13px] text-[#6b7280] mt-1">Security posture and governance views using trends, targets and evidence.</p>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-shrink-0">
            {data?._lastUpdated && !isLoading && !isError && (
              <>
                <div className="flex items-center gap-1.5 bg-[#1f0f0f] border border-[#ef4444]/20 px-2.5 py-1.5 rounded-[7px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                  <span className="text-[11px] text-[#ef4444]">Stale Data</span>
                </div>
                <span className="text-[11px] text-[#4a5568]">Last updated: {new Date(data._lastUpdated).toLocaleTimeString()}</span>
              </>
            )}
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-[#111827] border border-[#1f2937] text-[12px] font-medium text-[#9ca3af] hover:text-white hover:border-[#374151] transition-all">
              <MdFilterList size={14} /> Filters
            </motion.button>
            <motion.button onClick={load} disabled={isLoading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-[#111827] border border-[#1f2937] text-[12px] font-medium text-[#9ca3af] hover:text-white hover:border-[#374151] transition-all disabled:opacity-40">
              <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                <MdRefresh size={13} />
              </motion.div>
              Refresh
            </motion.button>
          </div>
        </div>

        {/* ── Filters bar ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between bg-[#0d1117]/80 border border-[#1f2937] rounded-[10px] p-4 gap-4">
          <div className="flex flex-wrap gap-4">
            <FilterSelect label="Risk Level" value={riskFilter} onChange={setRiskFilter}
              options={['All','Critical','High','Medium','Low']} />
            <FilterSelect label="Asset Class" value={assetFilter} onChange={setAssetFilter}
              options={['All','Servers','Endpoints','Cloud Resources','Network Devices','Applications','Databases','Users']} />
            <FilterSelect label="Decision" value={decisionFilter} onChange={setDecisionFilter}
              options={['All','Allow','Block','Review','Exception']} />
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
              options={['All','Approved','Pending','Under Review','Expired']} />
          </div>
          <div className="flex items-center gap-2 bg-[#111827] border border-[#1f2937] rounded-[6px] px-3 py-1.5 focus-within:border-[#374151] transition-colors" style={{ minWidth: 200 }}>
            <MdSearch size={15} className="text-[#6b7280] flex-shrink-0" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search policies, entities..." className="bg-transparent text-[12px] text-white placeholder:text-[#4a5568] outline-none w-full" />
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────────── */}
        {isError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20">
            <MdErrorOutline className="text-red-400/60" size={48} />
            <p className="text-[15px] font-semibold text-[#9ca3af]">Unable to load governance data</p>
            <button onClick={load} className="px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 transition-all text-[13px] font-medium">Retry</button>
          </motion.div>
        )}

        {!isError && (
          <div className="flex flex-col gap-6">

            {/* ── ACT 1 — Row 1: Risk Trend + Risk by Asset Class + Risk by Attack + Control Effectiveness ── */}
            <ActSection act="act1">
              <div className="grid grid-cols-4 gap-4">

                {/* 1. Risk Trend */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-white">Risk Trend</h3>
                    <span className="text-[10px] text-[#4a5568]">Risk Index ▾</span>
                  </div>
                  {isLoadingNoData ? (
                    <div className="flex-1 min-h-[180px] flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#3b82f6]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-[180px]">
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={data?.riskTrend || []} margin={{ left: -15, right: 10, top: 4, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                          <XAxis dataKey="t" stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#374151" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <RTooltip contentStyle={TT.contentStyle} formatter={v => [v, 'Risk Index']} />
                          <Line type="monotone" dataKey="riskIndex" stroke="#3b82f6" strokeWidth={2} dot={false} name="Risk Index" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#1f2937]">
                    <span className="w-3 h-0.5 bg-[#3b82f6] rounded" />
                    <span className="text-[10px] text-[#6b7280]">Risk Index</span>
                  </div>
                </div>

                {/* 2. Risk by Asset Class */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-white">Risk by Asset Class</h3>
                    <span className="text-[10px] text-[#4a5568]">Top 10 ▾</span>
                  </div>
                  {isLoadingNoData ? (
                    <div className="flex-1 min-h-[180px] flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#f59e0b]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div style={{ height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.riskByAsset || []} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                          <XAxis type="number" stroke="#4a5568" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} width={88} />
                          <RTooltip contentStyle={TT.contentStyle} formatter={v => [`${v}`, 'Risk']} />
                          <Bar dataKey="risk" radius={[0, 3, 3, 0]} barSize={12}>
                            {(data?.riskByAsset || []).map((d, i) => (
                              <Cell key={i} fill={d.risk >= 70 ? '#ef4444' : d.risk >= 45 ? '#f97316' : d.risk >= 25 ? '#eab308' : '#22c55e'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-[#1f2937]">
                    <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View asset details →</span>
                  </div>
                </div>

                {/* 3. Risk by Attack (Treemap) */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-white">Risk by Attack</h3>
                  </div>
                  {isLoadingNoData ? (
                    <div className="flex-1 min-h-[180px] flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#ef4444]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div style={{ height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                          data={data?.riskByAttack || []}
                          dataKey="value"
                          content={<CustomTreemapContent />}
                        >
                          <RTooltip contentStyle={TT.contentStyle} formatter={(v, n) => [`${v}%`, n]} />
                        </Treemap>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-[#1f2937]">
                    <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View attack details →</span>
                  </div>
                </div>

                {/* 4. Control Effectiveness (Bullet Graph) */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-white">Control Effectiveness</h3>
                    <span className="text-[10px] text-[#4a5568]">All Domains ▾</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-[#6b7280] mb-3 pl-[158px]">
                    <span className="flex-1">Current vs Target</span>
                    <span className="w-[52px] text-right">Now</span>
                    <span className="w-[52px] text-right">Target</span>
                  </div>
                  {isLoadingNoData ? (
                    <div className="flex-1 flex items-center justify-center min-h-[160px]">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#22c55e]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {(data?.controls || []).map(c => (
                        <BulletRow key={c.control} control={c.control} current={c.current} target={c.target} />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1f2937] text-[10px] text-[#6b7280]">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-white rounded" />Target marker</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-2 bg-[#22c55e]/70 rounded-sm" />At target</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-2 bg-[#ef4444]/70 rounded-sm" />Below target</div>
                  </div>
                  <div className="mt-2">
                    <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View all controls →</span>
                  </div>
                </div>

              </div>
            </ActSection>

            {/* ── ACT 2 — Row 2: Policy Exception Trend + Decision Distribution + Audit + Evidence ── */}
            <ActSection act="act2">
              <div className="grid grid-cols-4 gap-4">

                {/* 5. Policy Exception Trend */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-white">Policy Exception Trend</h3>
                    <span className="text-[10px] text-[#4a5568]">Exceptions ▾</span>
                  </div>
                  {isLoadingNoData ? (
                    <div className="flex-1 min-h-[160px] flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#8b5cf6]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div style={{ height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.exceptionTrend || []} margin={{ left: -15, right: 8, top: 4, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gExc" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                          <XAxis dataKey="t" stroke="#374151" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#374151" fontSize={9} tickLine={false} axisLine={false} />
                          <RTooltip contentStyle={TT.contentStyle} formatter={v => [v, 'Exceptions']} />
                          <Area type="monotone" dataKey="exceptions" stroke="#8b5cf6" fill="url(#gExc)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#1f2937]">
                    <span className="w-3 h-0.5 bg-[#8b5cf6] rounded" />
                    <span className="text-[10px] text-[#6b7280]">Exceptions</span>
                  </div>
                </div>

                {/* 6. Decision Distribution */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-white">Decision Distribution</h3>
                    <span className="text-[10px] text-[#4a5568]">Daily ▾</span>
                  </div>
                  {isLoadingNoData ? (
                    <div className="flex-1 min-h-[160px] flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#06b6d4]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div style={{ height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.decisionDist || []} margin={{ left: -15, right: 4, top: 4, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                          <XAxis dataKey="t" stroke="#374151" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#374151" fontSize={9} tickLine={false} axisLine={false} />
                          <RTooltip contentStyle={TT.contentStyle} />
                          <Bar dataKey="Allow"     stackId="a" fill="#22c55e" />
                          <Bar dataKey="Block"     stackId="a" fill="#ef4444" />
                          <Bar dataKey="Review"    stackId="a" fill="#f59e0b" />
                          <Bar dataKey="Exception" stackId="a" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="flex items-center flex-wrap gap-3 mt-3 pt-3 border-t border-[#1f2937] text-[10px] text-[#6b7280]">
                    {[{ c: '#22c55e', l: 'Allow' }, { c: '#ef4444', l: 'Block' }, { c: '#f59e0b', l: 'Review' }, { c: '#8b5cf6', l: 'Exception' }].map(x => (
                      <div key={x.l} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: x.c }} />{x.l}</div>
                    ))}
                  </div>
                </div>

                {/* 7. Audit Activity */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-bold text-white">Audit Activity</h3>
                    <span className="text-[10px] text-[#4a5568]">All Events ▾</span>
                  </div>
                  {!isLoadingNoData && data?._lastUpdated && (
                    <p className="text-[10px] text-[#4a5568] mb-2">{new Date(data._lastUpdated).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  )}
                  {isLoadingNoData ? (
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#06b6d4]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto" style={{ maxHeight: 260 }}>
                      {(data?.auditEvents || []).map(e => (
                        <AuditEvent key={e.id} event={e} onClick={ev => {}} />
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-[#1f2937]">
                    <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View full timeline →</span>
                  </div>
                </div>

                {/* 8. Governance Evidence compact */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-white">Governance Evidence</h3>
                    <span className="text-[10px] text-[#4a5568]">All Types ▾</span>
                  </div>
                  {isLoadingNoData ? (
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <MdRefresh size={18} className="text-[#8b5cf6]/40" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0 overflow-y-auto" style={{ maxHeight: 260 }}>
                      {(data?.governanceEvidence || []).slice(0, 6).map((r, i) => (
                        <div key={r.id} onClick={() => setSelectedRecord(r)}
                          className="flex items-center justify-between py-2.5 border-b border-[#1f2937]/60 last:border-0 hover:bg-[#1f2937]/30 rounded-[4px] px-1 -mx-1 cursor-pointer transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#d1d5db] truncate">{r.policy}</p>
                            <p className="text-[10px] text-[#6b7280] truncate">{r.entity}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            <DecisionBadge val={r.decision} />
                            <StatusBadge val={r.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-[#1f2937]">
                    <span className="text-[11px] text-[#3b82f6] cursor-pointer hover:text-[#60a5fa] transition-colors">View all evidence →</span>
                  </div>
                </div>

              </div>
            </ActSection>

            {/* ── ACT 3 — Governance & Audit Records table ─────────────────────── */}
            <ActSection act="act3">
              <DetailTable
                title="Governance &amp; Audit Records"
                description="All governance decisions, policy exceptions and supporting evidence."
                columns={evidenceCols}
                data={filteredEvidence}
                searchable={false}
              />
              {filteredEvidence.length === 0 && !isLoading && (
                <div className="rounded-b-[10px] bg-[#0d1117] border border-t-0 border-[#1f2937] px-5 py-6 text-center -mt-1">
                  <p className="text-[12px] text-[#6b7280]">No governance records match the selected filters.</p>
                  <button onClick={() => { setDecisionFilter('All'); setStatusFilter('All'); setSearchQuery('') }}
                    className="mt-2 text-[11px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors">Reset filters</button>
                </div>
              )}
            </ActSection>

          </div>
        )}
      </div>

      {/* ── Governance record detail modal ────────────────────────────────────── */}
      {selectedRecord && <GovernanceDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </div>
  )
}
