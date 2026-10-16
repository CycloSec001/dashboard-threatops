import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell
} from 'recharts'
import PageShell, { ActSection } from '../components/PageShell'
import DetailTable from '../components/DetailTable'
import { MdOutlinePolicy } from 'react-icons/md'

const TT = { backgroundColor: '#0d1117', border: '1px solid #21262d', borderRadius: '8px', color: '#e8f0ea', fontSize: '12px' }

const StatusBadge = ({ val }) => {
  const styles = {
    Approved: 'text-green-400 bg-green-500/20',
    Denied: 'text-red-400 bg-red-500/20',
    Revoked: 'text-orange-400 bg-orange-500/20',
    Pending: 'text-yellow-400 bg-yellow-500/20',
    Active: 'text-blue-400 bg-blue-500/20'
  }
  return <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${styles[val] || 'text-gray-400 bg-gray-500/20'}`}>{val}</span>
}

async function fetchData(tf) {
  return { rules: [], kpis: {}, unsupported: 'Audit rule analytics are not exposed by the backend API.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, Math.random() * 500 + 300))
  const m = { 'Last 24 Hours': 1, 'Last 7 Days': 7, 'Last 30 Days': 28, 'Last 90 Days': 90 }[tf] || 1
  const labels = tf === 'Last 7 Days' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    : tf === 'Last 30 Days' ? ['W1','W2','W3','W4']
    : tf === 'Last 90 Days' ? ['Jan','Feb','Mar','Apr','May','Jun']
    : ['00:00','04:00','08:00','12:00','16:00','20:00','24:00']
  const j = (b, r = 0.3) => Math.max(0, Math.round(b * (1 - r + Math.random() * r * 2)))

  // Act 1
  const exceptionTrend = labels.map(t => ({
    t,
    count: j(15 * m / labels.length)
  }))
  const decisionDist = labels.map(t => ({
    t,
    Approved: j(12 * m / labels.length),
    Denied: j(5 * m / labels.length),
    Pending: j(3 * m / labels.length)
  }))

  // Act 2 (Audit Activity timeline)
  const auditTimeline = [
    { time: '09:15', event: 'Policy Decision', details: 'J. Doe approved MFA exception for SVC_BACKUP', status: 'Approved' },
    { time: '10:30', event: 'Audit Review', details: 'Quarterly compliance scan initiated', status: 'Active' },
    { time: '11:45', event: 'Exception Expired', details: 'Firewall rule ANY-ANY expired on FW-DMZ-01', status: 'Revoked' },
    { time: '14:20', event: 'Policy Decision', details: 'A. Smith denied USB storage request for DEV-GROUP', status: 'Denied' },
    { time: '16:00', event: 'Audit Alert', details: 'Unapproved local admin creation on PRD-DB-01', status: 'Pending' }
  ]

  // Act 3
  const governanceTable = Array.from({ length: 12 }, (_, i) => ({
    policy: ['MFA Enforcement', 'USB Mass Storage', 'Local Admin Privileges', 'Any-Any Firewall', 'Data Export Limits'][i % 5],
    entity: ['SVC_BACKUP', 'DEV-GROUP', 'PRD-DB-01', 'FW-DMZ-01', 'jdoe'][i % 5],
    decision: ['Approved', 'Denied', 'Pending', 'Revoked', 'Approved'][i % 5],
    exception: ['Service Account Exemption', 'N/A', 'Temporary DBA Access', 'Legacy App Exemption', 'Client Data Transfer'][i % 5],
    timestamp: `${j(8, 0.8)}h ago`,
    evidence: ['Ticket REQ-1044', 'Policy violation', 'Ticket REQ-1050', 'Audit ID 992', 'Contract 81A'][i % 5],
    reviewer: ['J. Doe', 'A. Smith', 'System', 'Audit Engine', 'K. Lee'][i % 5],
    status: ['Active', 'Denied', 'Pending', 'Revoked', 'Active'][i % 5]
  }))

  return {
    exceptionTrend, decisionDist, auditTimeline, governanceTable,
    _lastUpdated: new Date().toISOString()
  }
}

export default function AuditRules({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  
  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchData(selectedTime)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])
  useEffect(() => { load() }, [load])

  const cols = [
    { header: 'Rule/Policy', accessor: 'policy' },
    { header: 'Entity', accessor: 'entity' },
    { header: 'Decision', accessor: 'decision', render: v => <StatusBadge val={v} /> },
    { header: 'Exception Type', accessor: 'exception' },
    { header: 'Timestamp', accessor: 'timestamp' },
    { header: 'Evidence/Ticket', accessor: 'evidence' },
    { header: 'Reviewer', accessor: 'reviewer' },
    { header: 'Status', accessor: 'status', render: v => <StatusBadge val={v} /> }
  ]

  return (
    <PageShell section="Governance & Trust" title="Audit & Rules"
      subtitle="Governance evidence tracking policy exceptions and audit decision distribution"
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>

      {/* ACT 1 — What is happening? */}
      <ActSection act="act1">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-4 flex flex-col">
            <p className="text-[12px] font-semibold text-white mb-1">Policy Exception Trend</p>
            <p className="text-[11px] text-[#4a5568] mb-3">Volume of requested exceptions over time</p>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.exceptionTrend || []} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                  <XAxis dataKey="t" stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={TT} />
                  <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }} name="Exceptions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-4 flex flex-col">
            <p className="text-[12px] font-semibold text-white mb-1">Decision Distribution</p>
            <p className="text-[11px] text-[#4a5568] mb-3">Policy decision states over time</p>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.decisionDist || []} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                  <XAxis dataKey="t" stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={TT} />
                  <Bar dataKey="Approved" stackId="a" fill="#39FF6A" />
                  <Bar dataKey="Pending" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="Denied" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </ActSection>

      {/* ACT 2 — Why does it matter? */}
      <ActSection act="act2">
        <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-4 flex flex-col">
          <p className="text-[12px] font-semibold text-white mb-1">Audit Activity Timeline</p>
          <p className="text-[11px] text-[#4a5568] mb-4">Chronological sequence of major governance and audit events</p>
          <div className="flex flex-col gap-0 relative flex-1">
            <div className="absolute left-[13px] top-2 bottom-2 w-px bg-[#1f2937] z-0"></div>
            {(data?.auditTimeline || []).map((ev, i) => (
              <div key={i} className="flex gap-4 relative z-10 mb-5 last:mb-0">
                <div className="mt-1 w-[26px] h-[26px] rounded-full bg-[#111827] border-[3px] border-[#1c2631] flex items-center justify-center shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${ev.status === 'Approved' ? 'bg-[#39FF6A]' : ev.status === 'Denied' ? 'bg-[#EF4444]' : ev.status === 'Revoked' ? 'bg-[#F97316]' : 'bg-[#F59E0B]'}`}></div>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-semibold text-white">{ev.event}</span>
                    <StatusBadge val={ev.status} />
                  </div>
                  <span className="text-[11px] text-[#9ca3af]">{ev.details}</span>
                  <span className="text-[10px] text-[#4a5568] mt-0.5">{ev.time} — Active Window</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ActSection>

      {/* ACT 3 — What evidence supports it? */}
      <ActSection act="act3">
        {data?.governanceTable && (
          <DetailTable
            title="Governance Evidence"
            description="Immutable log of policy decisions, exceptions, and associated evidence artifacts."
            columns={cols}
            data={data.governanceTable}
          />
        )}
      </ActSection>

      {/* ACT 4 — What can safely happen next? */}
      <ActSection act="act4">
        <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <MdOutlinePolicy className="text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white mb-1">Audit Operations</p>
              <p className="text-[12px] text-[#6b7280]">Revoke active exceptions or export compliance reports.</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="text-[12px] font-semibold bg-[#1f2937] text-white border border-[#374151] px-4 py-2 rounded-[6px] hover:bg-[#374151] transition-all">Export Compliance Report</button>
            <button className="text-[12px] font-semibold bg-[#1f2937] text-white border border-[#374151] px-4 py-2 rounded-[6px] hover:bg-[#374151] transition-all">Audit Approvals</button>
            <button className="text-[12px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-2 rounded-[6px] hover:bg-orange-500/20 transition-all">Revoke Policy Exception</button>
          </div>
        </div>
      </ActSection>
    </PageShell>
  )
}
