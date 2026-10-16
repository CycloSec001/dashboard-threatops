import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdRefresh, MdSearch, MdFilterList,
  MdOutlineVisibility, MdClose, MdErrorOutline,
  MdRule, MdBlock, MdGavel, MdWarningAmber, MdSettings,
  MdCheckCircle, MdCancel, MdSchedule, MdInfo
} from 'react-icons/md'
import PageShell, { ActSection } from '../components/PageShell'
import { KpiBigNumber } from '../components/KpiCards'
import DetailTable from '../components/DetailTable'

// ── Shared styles ──────────────────────────────────────────────────────────────
const TT = {
  contentStyle: {
    background: 'rgba(0, 0, 0, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '11px',
  },
}

// ── Badges ─────────────────────────────────────────────────────────────────────
function StatusBadge({ val }) {
  const map = {
    'Active': 'bg-green-500/15 text-green-400 border-green-500/30',
    'Enabled': 'bg-green-500/15 text-green-400 border-green-500/30',
    'Approved': 'bg-green-500/15 text-green-400 border-green-500/30',
    'Success': 'bg-green-500/15 text-green-400 border-green-500/30',
    'Disabled': 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    'Draft': 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    'Expired': 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    'Pending Approval': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Pending': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Warning': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Deprecated': 'bg-red-500/15 text-red-400 border-red-500/30',
    'Rejected': 'bg-red-500/15 text-red-400 border-red-500/30',
    'Blocked': 'bg-red-500/15 text-red-400 border-red-500/30',
    'Failure': 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`inline-flex text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border ${map[val] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {val}
    </span>
  )
}

function SeverityBadge({ val }) {
  const map = {
    'Critical': 'bg-red-500/20 text-red-400 border-red-500/40',
    'High': 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    'Medium': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    'Low': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    'Info': 'bg-gray-500/20 text-gray-400 border-gray-500/40',
  }
  return (
    <span className={`inline-flex text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border ${map[val] || 'bg-gray-500/20 text-gray-400 border-gray-500/40'}`}>
      {val}
    </span>
  )
}

// ── Filter select ──────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] text-white rounded-[10px] px-2.5 py-1.5 focus:outline-none focus:border-white/[0.12] appearance-none cursor-pointer hover:border-white/[0.12] transition-colors"
        style={{ minWidth: 110 }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ── Timeline Component ─────────────────────────────────────────────────────────
const TIMELINE_ICONS = {
  'Created': { icon: MdSettings, color: '#3b82f6' },
  'Updated': { icon: MdSettings, color: '#3b82f6' },
  'Modified': { icon: MdSettings, color: '#3b82f6' },
  'Enabled': { icon: MdCheckCircle, color: '#22c55e' },
  'Disabled': { icon: MdCancel, color: '#6b7280' },
  'Approved': { icon: MdCheckCircle, color: '#22c55e' },
  'Rejected': { icon: MdCancel, color: '#ef4444' },
  'Exception added': { icon: MdGavel, color: '#f59e0b' },
  'Exception removed': { icon: MdGavel, color: '#3b82f6' },
}

function PolicyChangesTimeline({ events, onSelectEvent }) {
  return (
    <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
      <div className="flex items-center min-w-max px-2 py-3">

        {events.map((ev, i) => {
          const meta =
            TIMELINE_ICONS[ev.changeType] || {
              icon: MdInfo,
              color: '#8b5cf6'
            }

          const Icon = meta.icon

          return (
            <React.Fragment key={ev.id}>

              {/* Timeline Card */}
              <div
                className="relative w-[280px] min-w-[280px] h-[170px] flex-shrink-0 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 group cursor-pointer hover:border-white/[0.12] transition-all"
                onClick={() => onSelectEvent(ev)}
              >
                {/* Top */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${meta.color}15`,
                        border: `1px solid ${meta.color}40`
                      }}
                    >
                      <Icon size={16} style={{ color: meta.color }} />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">
                        {ev.policyName}
                      </div>

                      <span
                        className="inline-flex mt-1 text-[9px] font-semibold border rounded-[4px] px-1.5 py-0.5"
                        style={{
                          color: meta.color,
                          borderColor: `${meta.color}40`,
                          backgroundColor: `${meta.color}15`
                        }}
                      >
                        {ev.changeType}
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap ml-2">
                    {ev.timestamp.split(' ').slice(0, 3).join(' ')}
                  </span>
                </div>

                {/* Reason */}
                <p className="text-[9.5px] text-slate-300 mb-3 line-clamp-2">
                  {ev.reason}
                </p>

                {/* Metadata */}
                <div className="flex flex-col gap-1.5 text-[9.5px] text-slate-400">
                  {ev.changedBy && (
                    <span>
                      By:{' '}
                      <span className="text-slate-300">
                        {ev.changedBy}
                      </span>
                    </span>
                  )}

                  {ev.previousStatus && ev.newStatus && (
                    <span>
                      Status:{' '}
                      <span className="line-through opacity-60">
                        {ev.previousStatus}
                      </span>
                      {' → '}
                      <span className="text-white">
                        {ev.newStatus}
                      </span>
                    </span>
                  )}

                  {ev.reviewer && (
                    <span>
                      Reviewer:{' '}
                      <span className="text-slate-300">
                        {ev.reviewer}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Connector Arrow */}
              {i < events.length - 1 && (
                <div className="w-[55px] min-w-[55px] flex items-center justify-center">
                  <div className="w-full flex items-center">
                    <div className="flex-1 border-t border-dashed border-white/[0.15]" />

                    <span className="text-slate-500 text-[18px] px-1">
                      →
                    </span>
                  </div>
                </div>
              )}

            </React.Fragment>
          )
        })}

      </div>
    </div>
  )
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
function RecordDetailModal({ record, type, onClose }) {
  if (!record) return null

  const iconMap = {
    'rule': MdRule,
    'trigger': MdWarningAmber,
    'block': MdBlock,
    'exception': MdGavel,
    'timeline': MdInfo,
  }
  const Icon = iconMap[type] || MdInfo

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] w-full max-w-[700px] max-h-[85vh] flex flex-col">

          <div className="flex items-start justify-between p-3 pb-3 border-b border-white/[0.05] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-black/5 border border-white/[0.05] flex items-center justify-center">
                <Icon size={20} className="text-[#3b82f6]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                    {record.name || record.rule || record.policy || record.policyName}
                  </h2>
                  {record.status && <StatusBadge val={record.status} />}
                  {record.severity && <SeverityBadge val={record.severity} />}
                </div>
                <p className="text-[9.5px] text-slate-400">{type.toUpperCase()} RECORD</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[#6b7280] hover:text-white p-1 rounded-[6px] hover:bg-white/10 transition-colors">
              <MdClose size={18} />
            </button>
          </div>

          <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(record).map(([k, v]) => {
                if (['id', 'name', 'rule', 'policy', 'policyName', 'status', 'severity', 'description', 'reason'].includes(k)) return null
                if (v === null || v === undefined || v === '') return null
                return (
                  <div key={k} className="bg-black/5 backdrop-blur-[1px] rounded-[10px] border border-white/[0.05] p-3">
                    <p className="text-[9.5px] text-slate-400 uppercase tracking-wider mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <div
                      className="text-[10px] text-white font-semibold whitespace-nowrap truncate"
                      title={v}
                    >{v}</div>
                  </div>
                )
              })}
            </div>

            {(record.description || record.reason) && (
              <div className="bg-black/5 backdrop-blur-[1px] rounded-[10px] border border-white/[0.05] p-3">
                <p className="text-[9.5px] text-slate-400 uppercase tracking-wider mb-2">Description / Reason</p>
                <div className="text-[9.5px] text-slate-300 whitespace-pre-wrap leading-relaxed">{record.description || record.reason}</div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Backend-ready data service ─────────────────────────────────────────────────
async function fetchRulesPoliciesData(timeFilter) {
  return { kpis: {}, rules: [], policies: [], unsupported: 'Rules and policy analytics are not exposed by the backend API.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, Math.random() * 600 + 400))
  const m = { 'Last 24 Hours': 1, 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90 }[timeFilter] || 1
  const j = (b, r = 0.1) => Math.max(0, Math.round(b * (1 - r + Math.random() * r * 2)))

  const kpis = {
    activeRules: { value: 342, trend: { value: '12', direction: 'up', color: 'green' } },
    disabledRules: { value: 18, trend: { value: '2', direction: 'down', color: 'gray' } },
    triggeredRules: { value: j(145 * m), trend: { value: '5.2%', direction: 'up', color: 'orange' } },
    policyBlocks: { value: j(2840 * m), trend: { value: '12.5%', direction: 'up', color: 'green' } },
    exceptions: { value: 42, trend: { value: '4', direction: 'down', color: 'green' } },
  }

  const timelineEvents = [
    { id: 'TL-001', timestamp: 'May 26, 2025 14:32:00', policyName: 'USB Storage Access Policy', changeType: 'Exception added', changedBy: 'r.lee@company.com', previousStatus: 'Active', newStatus: 'Exception', reason: 'Business requirement for marketing team offsite.', reviewer: 'admin@company.com', approvalStatus: 'Approved' },
    { id: 'TL-002', timestamp: 'May 25, 2025 09:15:22', policyName: 'Brute Force Login Detection', changeType: 'Updated', changedBy: 's.wilson@company.com', previousStatus: 'Active', newStatus: 'Active', reason: 'Lowered threshold from 10 to 5 failed attempts.', reviewer: 'admin@company.com', approvalStatus: 'Approved' },
    { id: 'TL-003', timestamp: 'May 24, 2025 11:05:10', policyName: 'Legacy API Access', changeType: 'Disabled', changedBy: 'admin@company.com', previousStatus: 'Active', newStatus: 'Disabled', reason: 'API deprecated, moving to v2.', reviewer: null, approvalStatus: 'N/A' },
    { id: 'TL-004', timestamp: 'May 22, 2025 16:45:00', policyName: 'Remote Desktop Enforcement', changeType: 'Enabled', changedBy: 'm.smith@company.com', previousStatus: 'Draft', newStatus: 'Active', reason: 'Testing completed successfully.', reviewer: 'admin@company.com', approvalStatus: 'Approved' },
    { id: 'TL-005', timestamp: 'May 20, 2025 10:20:00', policyName: 'Data Exfiltration (Large Uploads)', changeType: 'Created', changedBy: 'j.doe@company.com', previousStatus: null, newStatus: 'Draft', reason: 'New rule required for Q2 compliance.', reviewer: null, approvalStatus: 'Pending' },
  ]

  const rules = [
    { id: 'R-101', name: 'Brute Force Login Detection', type: 'Detection', status: 'Active', severity: 'High', action: 'Alert', triggers: j(142 * m), blocks: 0, exceptions: 0, lastTriggered: 'May 26, 2025 22:41:07', lastUpdated: 'May 25, 2025', owner: 'SOC Team' },
    { id: 'R-102', name: 'USB Storage Access Policy', type: 'Enforcement', status: 'Active', severity: 'Medium', action: 'Block', triggers: j(45 * m), blocks: j(42 * m), exceptions: 3, lastTriggered: 'May 26, 2025 14:10:00', lastUpdated: 'May 26, 2025', owner: 'IT Security' },
    { id: 'R-103', name: 'Remote Desktop Enforcement', type: 'Enforcement', status: 'Active', severity: 'High', action: 'Block', triggers: j(89 * m), blocks: j(89 * m), exceptions: 1, lastTriggered: 'May 26, 2025 11:05:22', lastUpdated: 'May 22, 2025', owner: 'Network Team' },
    { id: 'R-104', name: 'Data Exfiltration (Large Uploads)', type: 'Detection', status: 'Draft', action: 'Block', severity: 'Critical', triggers: 0, blocks: 0, exceptions: 0, lastTriggered: '—', lastUpdated: 'May 20, 2025', owner: 'SOC Team' },
    { id: 'R-105', name: 'Legacy API Access', type: 'Detection', status: 'Disabled', severity: 'Low', action: 'Block', triggers: 0, blocks: 0, exceptions: 0, lastTriggered: 'May 24, 2025', lastUpdated: 'May 24, 2025', owner: 'Engineering' },
    { id: 'R-106', name: 'Suspicious PowerShell Execution', type: 'Detection', status: 'Active', severity: 'Critical', action: 'Block', triggers: j(12 * m), blocks: 0, exceptions: 0, lastTriggered: 'May 26, 2025 08:15:33', lastUpdated: 'Apr 12, 2025', owner: 'Threat Hunting' },
    { id: 'R-107', name: 'Malicious IP Communication', type: 'Enforcement', status: 'Active', severity: 'Critical', action: 'Block', triggers: j(1250 * m), blocks: j(1250 * m), exceptions: 0, lastTriggered: 'May 26, 2025 23:55:10', lastUpdated: 'Jan 05, 2025', owner: 'Network Team' },
  ]

  const recentTriggers = [
    { id: 'T-001', timestamp: 'May 26, 2025 23:55:10', rule: 'Malicious IP Communication', entity: '10.0.5.22', triggerType: 'Network', severity: 'Critical', action: 'Block', outcome: 'Success', incident: 'INC-9042' },
    { id: 'T-002', timestamp: 'May 26, 2025 22:41:07', rule: 'Brute Force Login Detection', entity: 'j.doe@company.com', triggerType: 'Auth', severity: 'High', action: 'Alert', outcome: 'Success', incident: 'INC-9041' },
    { id: 'T-003', timestamp: 'May 26, 2025 14:10:00', rule: 'USB Storage Access Policy', entity: 'LAPTOP-32F1', triggerType: 'Endpoint', severity: 'Medium', action: 'Block', outcome: 'Success', incident: '—' },
    { id: 'T-004', timestamp: 'May 26, 2025 08:15:33', rule: 'Suspicious PowerShell Execution', entity: 'SERVER-DB-01', triggerType: 'Process', severity: 'Critical', action: 'Alert', outcome: 'Success', incident: 'INC-9038' },
  ]

  const recentBlocks = [
    { id: 'B-001', timestamp: 'May 26, 2025 23:55:10', policy: 'Malicious IP Communication', entity: '10.0.5.22', reason: 'Outbound connection to known C2', severity: 'Critical', action: 'Connection Dropped', event: 'EVT-7721', status: 'Success' },
    { id: 'B-002', timestamp: 'May 26, 2025 14:10:00', policy: 'USB Storage Access Policy', entity: 'LAPTOP-32F1', reason: 'Unauthorized mass storage device', severity: 'Medium', action: 'Device Disabled', event: 'EVT-7643', status: 'Success' },
    { id: 'B-003', timestamp: 'May 26, 2025 11:05:22', policy: 'Remote Desktop Enforcement', entity: '192.168.1.105', reason: 'RDP attempted outside VPN', severity: 'High', action: 'Connection Dropped', event: 'EVT-7599', status: 'Success' },
  ]

  const exceptions = [
    { id: 'EX-2025-042', policy: 'USB Storage Access Policy', entity: 'Marketing Dept', reason: 'Offsite event requires portable storage', created: 'May 26, 2025', expires: 'Jun 02, 2025', requestedBy: 'm.johnson', reviewer: 'admin', status: 'Active' },
    { id: 'EX-2025-041', policy: 'Remote Desktop Enforcement', entity: 'SERVER-QA-05', reason: 'Legacy app requires direct RDP for testing', created: 'May 10, 2025', expires: 'Aug 10, 2025', requestedBy: 'd.smith', reviewer: 'admin', status: 'Active' },
    { id: 'EX-2025-040', policy: 'MFA Enforcement', entity: 'svc_legacy_sync', reason: 'Service account cannot perform MFA', created: 'Jan 15, 2025', expires: 'Never', requestedBy: 's.wilson', reviewer: 'admin', status: 'Active' },
    { id: 'EX-2025-039', policy: 'USB Storage Access Policy', entity: 'j.doe@company.com', reason: 'Data transfer for compliance audit', created: 'Apr 01, 2025', expires: 'Apr 15, 2025', requestedBy: 'j.doe', reviewer: 'admin', status: 'Expired' },
  ]

  return {
    kpis, timelineEvents, rules, recentTriggers, recentBlocks, exceptions,
    _lastUpdated: new Date().toISOString()
  }
}

// ── Skeleton Components ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col min-h-[120px] animate-pulse">
      <div className="h-3 w-24 bg-white/5 rounded mb-3" />
      <div className="h-8 w-20 bg-white/5 rounded mb-2" />
      <div className="h-2 w-16 bg-white/5 rounded" />
    </div>
  )
}

function SkeletonTimeline() {
  return (
    <div className="border-l border-white/[0.05] ml-4 py-2 animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="pl-6 relative">
          <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-white/10" />
          <div className="h-4 w-48 bg-white/5 rounded mb-2" />
          <div className="h-3 w-64 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RulesPolicies({ selectedTime, setSelectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [recordType, setRecordType] = useState(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showFilters, setShowFilters] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchRulesPoliciesData(selectedTime)) }
    catch { setIsError(true) }
    finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { load() }, [load])

  const filteredRules = useMemo(() => {
    if (!data?.rules) return []
    return data.rules.filter(r => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (typeFilter !== 'All' && r.type !== typeFilter) return false
      if (severityFilter !== 'All' && r.severity !== severityFilter) return false
      if (actionFilter !== 'All' && r.action !== actionFilter) return false
      if (searchQuery && !`${r.name} ${r.owner}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [data, statusFilter, typeFilter, severityFilter, actionFilter, searchQuery])

  // Table columns
  const rulesCols = [
    { accessor: 'name', header: 'Rule / Policy Name', render: v => <span className="font-bold text-[12px] text-white">{v}</span> },
    { accessor: 'type', header: 'Type', render: v => <span className="text-[11px] text-[#9ca3af]">{v}</span> },
    { accessor: 'status', header: 'Status', render: v => <StatusBadge val={v} /> },
    { accessor: 'severity', header: 'Severity', render: v => <SeverityBadge val={v} /> },
    { accessor: 'triggers', header: 'Triggers', render: v => <span className="font-mono text-[11px] text-[#e5e7eb]">{v.toLocaleString()}</span> },
    { accessor: 'blocks', header: 'Blocks', render: v => <span className="font-mono text-[11px] text-[#ef4444]">{v.toLocaleString()}</span> },
    { accessor: 'exceptions', header: 'Exceptions', render: v => <span className="font-mono text-[11px] text-[#f59e0b]">{v}</span> },
    { accessor: 'lastTriggered', header: 'Last Triggered', render: v => <span className="text-[10px] text-[#9ca3af]">{v}</span> },
    { accessor: 'owner', header: 'Owner', render: v => <span className="text-[11px] text-[#d1d5db]">{v}</span> },
    {
      accessor: '_view', header: 'Actions', render: (_, row) => (
        <button onClick={e => { e.stopPropagation(); setRecordType('rule'); setSelectedRecord(row) }} className="text-[#6b7280] hover:text-white transition-colors p-1">
          <MdOutlineVisibility size={14} />
        </button>
      )
    },
  ]

  const triggerCols = [
    { accessor: 'timestamp', header: 'Time', render: v => <span className="font-mono text-[10px] text-[#9ca3af]">{v}</span> },
    { accessor: 'rule', header: 'Rule', render: v => <span className="font-medium text-[11px] text-white">{v}</span> },
    { accessor: 'entity', header: 'Entity', render: v => <span className="text-[11px] text-[#d1d5db]">{v}</span> },
    { accessor: 'severity', header: 'Severity', render: v => <SeverityBadge val={v} /> },
    { accessor: 'action', header: 'Action', render: v => <span className="text-[11px] text-[#9ca3af]">{v}</span> },
    { accessor: 'outcome', header: 'Outcome', render: v => <StatusBadge val={v} /> },
    {
      accessor: 'incident',
      header: 'Incident',
      render: (v, row) =>
        v === '—'
          ? <span className="text-slate-600">—</span>
          : (
            <button
              onClick={() => {
                setRecordType('trigger')
                setSelectedRecord(row)
              }}
              className="text-blue-400 hover:text-blue-300 hover:underline text-[9.5px] transition-colors"
            >
              {v}
            </button>
          )
    },
    {
      accessor: '_view', header: 'Actions', render: (_, row) => (
        <button onClick={e => { e.stopPropagation(); setRecordType('trigger'); setSelectedRecord(row) }} className="text-[#6b7280] hover:text-white transition-colors p-1">
          <MdOutlineVisibility size={14} />
        </button>
      )
    },
  ]

  const blockCols = [
    { accessor: 'timestamp', header: 'Time', render: v => <span className="font-mono text-[10px] text-[#9ca3af]">{v}</span> },
    { accessor: 'policy', header: 'Policy', render: v => <span className="font-medium text-[11px] text-white">{v}</span> },
    { accessor: 'entity', header: 'Entity', render: v => <span className="text-[11px] text-[#d1d5db]">{v}</span> },
    { accessor: 'reason', header: 'Reason', render: v => <span className="text-[11px] text-[#9ca3af]">{v}</span> },
    { accessor: 'action', header: 'Action', render: v => <span className="text-[11px] text-[#ef4444] font-medium">{v}</span> },
    { accessor: 'status', header: 'Status', render: v => <StatusBadge val={v} /> },
    {
      accessor: '_view', header: 'Actions', render: (_, row) => (
        <button onClick={e => { e.stopPropagation(); setRecordType('block'); setSelectedRecord(row) }} className="text-[#6b7280] hover:text-white transition-colors p-1">
          <MdOutlineVisibility size={14} />
        </button>
      )
    },
  ]

  const exceptionCols = [
    { accessor: 'policy', header: 'Policy', render: v => <span className="font-medium text-[11px] text-white">{v}</span> },
    { accessor: 'entity', header: 'Entity', render: v => <span className="text-[11px] text-[#d1d5db]">{v}</span> },
    { accessor: 'reason', header: 'Reason', render: v => <span className="text-[11px] text-[#9ca3af]">{v}</span> },
    { accessor: 'expires', header: 'Expires', render: v => <span className="text-[11px] text-[#e5e7eb]">{v}</span> },
    { accessor: 'requestedBy', header: 'Requested By', render: v => <span className="text-[11px] text-[#d1d5db]">{v}</span> },
    { accessor: 'status', header: 'Status', render: v => <StatusBadge val={v} /> },
    {
      accessor: '_view', header: 'Actions', render: (_, row) => (
        <button onClick={e => { e.stopPropagation(); setRecordType('exception'); setSelectedRecord(row) }} className="text-[#6b7280] hover:text-white transition-colors p-1">
          <MdOutlineVisibility size={14} />
        </button>
      )
    },
  ]

  const kpiState = isLoading ? 'loading' : isError ? 'error' : 'ready'
  const isLoadingNoData = isLoading && !data

  return (
    <PageShell section="Governance & Audit" title="Rules & Policies" subtitle="Manage and monitor security rules, policies, triggers, blocks and policy exceptions." selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>
      <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
        style={{ background: 'linear-gradient(#141B21 1px,transparent 1px),linear-gradient(90deg,#141B21 1px,transparent 1px),#0B0F12', backgroundSize: '40px 40px' }}>
        <div className="flex flex-col gap-3 px-3 pt-3 pb-8">

          {/* ── Header ─────────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-0">
            <div>
              <p className="text-[9.5px] font-semibold text-purple-400 uppercase tracking-wider mb-0.5">
                Governance &amp; Audit · Rules &amp; Policies
              </p>
              <h1 className="text-[18px] font-bold text-white leading-tight">Rules &amp; Policies</h1>
              <p className="text-[9.5px] text-slate-400 mt-1">Manage and monitor security rules, policies, triggers, blocks and policy exceptions.</p>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-shrink-0">
              {data?._lastUpdated && !isLoading && !isError && (
                <>
                  <div className="flex items-center gap-1.5 bg-black/5 backdrop-blur-[1px] border border-red-500/20 px-2.5 py-1.5 rounded-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                    <span className="text-[9.5px] text-red-400">Stale Data</span>
                  </div>
                  <span className="text-[9.5px] text-slate-500">Last updated: {new Date(data._lastUpdated).toLocaleTimeString()}</span>
                </>
              )}
              <motion.button
                onClick={() => setShowFilters(v => !v)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold transition-all ${showFilters
                  ? 'text-white border-white/[0.12]'
                  : 'text-slate-400 hover:text-white hover:border-white/[0.12]'
                  }`}
              >
                <MdFilterList size={14} /> Filters
              </motion.button>
              <motion.button onClick={load} disabled={isLoading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-40">
                <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                  <MdRefresh size={13} />
                </motion.div>
                Refresh
              </motion.button>
            </div>
          </div>
          {/* ── Filters bar ────────────────────────────────────────────────────── */}
          {showFilters && (
            <div className="flex flex-wrap items-end justify-between bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 gap-3">
              <div className="flex flex-wrap gap-3">
                <FilterSelect
                  label="Time Range"
                  value={selectedTime}
                  onChange={setSelectedTime}
                  options={['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days']}
                />
                <FilterSelect label="Rule Status" value={statusFilter} onChange={setStatusFilter}
                  options={['All', 'Active', 'Disabled', 'Draft']} />
                <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter}
                  options={['All', 'Detection', 'Enforcement']} />
                <FilterSelect
                  label="Severity"
                  value={severityFilter}
                  onChange={setSeverityFilter}
                  options={['All', 'Critical', 'High', 'Medium', 'Low']}
                />

                <FilterSelect
                  label="Action"
                  value={actionFilter}
                  onChange={setActionFilter}
                  options={['All', 'Alert', 'Block', 'Log']}
                />
              </div>
              <div className="flex items-center">
                <div className="flex items-center gap-2 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] px-3 py-1.5 focus-within:border-white/[0.12] transition-colors" style={{ minWidth: 220 }}>
                  <MdSearch size={15} className="text-[#6b7280] flex-shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search rules, policies..."
                    className="bg-transparent text-[9.5px] text-white placeholder:text-slate-500 outline-none w-full"
                  />
                </div>
                <button
                  onClick={() => setShowAdvanced(v => !v)}
                  className={`flex items-center gap-1.5 text-[9.5px] font-semibold transition-colors ${showAdvanced ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <MdFilterList size={14} /> Advanced {showAdvanced ? '▴' : '▾'}
                </button>
              </div>
            </div>
          )}

          {/* ── Error ──────────────────────────────────────────────────────────── */}
          {isError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-10"
            >
              <MdErrorOutline className="text-red-400/60" size={32} />
              <p className="text-[11px] font-semibold text-slate-400">Unable to load Rules &amp; Policies data</p>
              <button
                onClick={load}
                className="px-3 py-1.5 rounded-[10px] bg-black/5 backdrop-blur-[1px] border border-red-500/30 text-[9.5px] font-semibold text-red-400 hover:border-red-500/50 transition-all"
              >
                Retry
              </button>
            </motion.div>
          )}

          {!isError && (
            <div className="flex flex-col gap-3">


              {/* ── KPI Row ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-5 gap-3">
                {isLoadingNoData ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                ) : (
                  <>
                    <KpiBigNumber
                      title="Active Rules"
                      subtitle="currently enabled"
                      icon={MdRule}
                      iconColor="#22c55e"
                      value={data?.kpis?.activeRules?.value}
                      trend={data?.kpis?.activeRules?.trend}
                      dataState={kpiState}
                    />

                    <KpiBigNumber
                      title="Disabled Rules"
                      subtitle="currently disabled"
                      icon={MdCancel}
                      iconColor="#6b7280"
                      value={data?.kpis?.disabledRules?.value}
                      trend={data?.kpis?.disabledRules?.trend}
                      dataState={kpiState}
                    />

                    <KpiBigNumber
                      title="Triggered Rules"
                      subtitle="in time range"
                      icon={MdWarningAmber}
                      iconColor="#f59e0b"
                      value={data?.kpis?.triggeredRules?.value}
                      trend={data?.kpis?.triggeredRules?.trend}
                      dataState={kpiState}
                    />

                    <KpiBigNumber
                      title="Policy Blocks"
                      subtitle="in time range"
                      icon={MdBlock}
                      iconColor="#ef4444"
                      value={data?.kpis?.policyBlocks?.value}
                      trend={data?.kpis?.policyBlocks?.trend}
                      dataState={kpiState}
                    />

                    <KpiBigNumber
                      title="Exceptions"
                      subtitle="active policy exceptions"
                      icon={MdGavel}
                      iconColor="#3b82f6"
                      value={data?.kpis?.exceptions?.value}
                      trend={data?.kpis?.exceptions?.trend}
                      dataState={kpiState}
                    />
                  </>
                )}
              </div>

              {/* ── Policy Changes Timeline ────────────────────────────── */}
              {/* ── Policy Changes Timeline ────────────────────────────── */}
              <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col max-h-[300px]">

                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                    Policy Changes Timeline
                  </h3>

                  <span className="text-[9.5px] text-slate-400">
                    Recent Activity ▾
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {isLoadingNoData ? (
                    <SkeletonTimeline />
                  ) : (
                    <PolicyChangesTimeline
                      events={data?.timelineEvents || []}
                      onSelectEvent={ev => {
                        setRecordType('timeline')
                        setSelectedRecord(ev)
                      }}
                    />
                  )}
                </div>

                {!isLoadingNoData && (
                  <div className="mt-3 pt-3 border-t border-white/[0.05] flex-shrink-0">
                    <button
                      onClick={() => {
                        setRecordType('timeline')
                        setSelectedRecord(data?.timelineEvents?.[0] || null)
                      }}
                      className="text-[9.5px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View full history →
                    </button>
                  </div>
                )}

              </div>

              {/* ── Main Rules Table ───────────────────────────────────────────── */}
              <div>
                <DetailTable
                  title="Rules & Policies"
                  description="List of all configured rules and enforcement policies."
                  columns={rulesCols}
                  data={filteredRules}
                  searchable={false}
                />
                {filteredRules.length === 0 && !isLoading && (
                  <div className="rounded-b-[10px] bg-black/5 backdrop-blur-[1px] border border-t-0 border-white/[0.05] px-3 py-4 text-center -mt-1">
                    <p className="text-[9.5px] text-slate-400">No rules or policies match the selected filters.</p>
                    <button onClick={() => {
                      setSelectedTime('Last 24 Hours')
                      setStatusFilter('All')
                      setTypeFilter('All')
                      setSeverityFilter('All')
                      setActionFilter('All')
                      setSearchQuery('')
                    }}
                      className="text-[9.5px] font-semibold text-blue-400 hover:text-blue-300">Reset filters</button>
                  </div>
                )}
              </div>

              {/* ── Triggers & Blocks Row ──────────────────────────────────────── */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-stretch">
                <div className="h-full">
                  <DetailTable
                    title="Recent Rule Triggers"
                    description="Detection and alert triggers within the time range."
                    columns={triggerCols}
                    data={data?.recentTriggers || []}
                    searchable={false}
                  />
                </div>

                <div className="h-full">
                  <DetailTable
                    title="Recent Policy Blocks"
                    description="Enforcement blocks and connection drops."
                    columns={blockCols}
                    data={data?.recentBlocks || []}
                    searchable={false}
                  />
                </div>
              </div>
              {/* ── Exceptions Table ───────────────────────────────────────────── */}
              <div>
                <DetailTable
                  title="Policy Exceptions"
                  description="Active and pending exceptions to security policies."
                  columns={exceptionCols}
                  data={data?.exceptions || []}
                  searchable={false}
                />
              </div>

            </div>
          )}
        </div>

        {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
        {selectedRecord && <RecordDetailModal record={selectedRecord} type={recordType} onClose={() => setSelectedRecord(null)} />}
      </div>
    </PageShell>
  )
}
