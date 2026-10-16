import { useState, useEffect, useCallback } from 'react'
import PageShell, { ActSection } from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import { MdWarningAmber, MdCalendarToday } from 'react-icons/md'

const SevBadge = ({ val }) => {
  const c = {
    Critical: 'text-red-400 bg-red-500/15 border-red-500/30',
    High: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
    Medium: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    Low: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
  }
  return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${c[val] || 'text-gray-400 bg-gray-500/15 border-gray-500/30'}`}>{val}</span>
}

const StatusBadge = ({ val }) => {
  const c = {
    Active: 'text-green-400 bg-green-500/15 border-green-500/30',
    Approved: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
    Pending: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    Review: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    Expired: 'text-red-400 bg-red-500/15 border-red-500/30',
  }
  return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${c[val] || 'text-gray-400 bg-gray-500/15 border-gray-500/30'}`}>{val}</span>
}

const Card = ({ children, className = '' }) => (
  <div
    className={`bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 transition-all duration-200 hover:border-white/[0.12] ${className}`}
  >
    {children}
  </div>
)

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-2">
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

const riskCounts = [
  { label: 'Critical', count: 5, color: '#EF4444', bg: 'bg-red-500/10 border-red-500/20' },
  { label: 'High', count: 15, color: '#F97316', bg: 'bg-orange-500/10 border-orange-500/20' },
  { label: 'Medium', count: 18, color: '#F59E0B', bg: 'bg-amber-500/10 border-amber-500/20' },
  { label: 'Low', count: 5, color: '#3B82F6', bg: 'bg-blue-500/10 border-blue-500/20' },
]

const exceptionsTable = [
  { id: 'EX-1042', policy: 'MFA Exemption', requester: 'DevOps', risk: 'High', expiry: 'Sep 18, 2026', approval: 'Approved', status: 'Active' },
  { id: 'EX-1098', policy: 'Firewall Restriction', requester: 'Network', risk: 'Critical', expiry: 'Sep 14, 2026', approval: 'Approved', status: 'Active' },
  { id: 'EX-1121', policy: 'Endpoint Isolation', requester: 'SOC', risk: 'Medium', expiry: 'Sep 25, 2026', approval: 'Pending', status: 'Review' },
  { id: 'EX-1184', policy: 'Cloud Access Policy', requester: 'CloudOps', risk: 'High', expiry: 'Sep 20, 2026', approval: 'Approved', status: 'Active' },
  { id: 'EX-1204', policy: 'Password Policy', requester: 'IT', risk: 'Medium', expiry: 'Sep 30, 2026', approval: 'Pending', status: 'Review' },
]

// Expiry timeline items
const expiryItems = [
  { id: 'EX-1098', policy: 'Firewall Restriction', risk: 'Critical', days: 3, window: '7d' },
  { id: 'EX-1042', policy: 'MFA Exemption', risk: 'High', days: 7, window: '7d' },
  { id: 'EX-1184', policy: 'Cloud Access Policy', risk: 'High', days: 9, window: '14d' },
  { id: 'EX-1121', policy: 'Endpoint Isolation', risk: 'Medium', days: 14, window: '14d' },
  { id: 'EX-1204', policy: 'Password Policy', risk: 'Medium', days: 19, window: '30d' },
]

const expiryColor = { Critical: '#EF4444', High: '#F97316', Medium: '#F59E0B', Low: '#3B82F6' }

async function fetchData(tf) {
  return { kpis: {}, exceptions: [], unsupported: 'Policy exceptions are not exposed by the backend API.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, Math.random() * 700 + 400))
  const j = (b, r = 0.3) => Math.round(b * (1 - r + Math.random() * r * 2))
  return {
    activeExceptions: j(43, 0.1),
    highRiskExceptions: j(15, 0.2),
    pendingApprovals: j(6, 0.3),
    expiredExceptions: j(10, 0.2),
    policyCoverage: `${j(85, 0.05)}%`,
    _lastUpdated: new Date().toISOString(),
  }
}

const kpis = [
  { key: 'activeExceptions', title: 'Active Exceptions', visualization: 'mini-bar', color: '#00D9FF' },
  { key: 'highRiskExceptions', title: 'High-Risk Exceptions', visualization: 'mini-area', color: '#EF4444' },
  { key: 'pendingApprovals', title: 'Pending Approvals', visualization: 'mini-bar', color: '#F59E0B' },
  { key: 'expiredExceptions', title: 'Expired Exceptions', visualization: 'mini-line', color: '#F97316' },
  { key: 'policyCoverage', title: 'Policy Coverage', visualization: 'gauge', color: '#39FF6A' },
]

export default function PolicyExceptions({ selectedTime }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchData(selectedTime)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])
  useEffect(() => { load() }, [load])

  const card = kpi => (
    <OverviewMetricCard key={kpi.key} config={kpi} value={data?.[kpi.key]}
      isLoading={isLoading} isError={isError} isEmpty={false} onClick={() => { }} />
  )

  return (
    <PageShell section="Governance & Trust" title="Policy Exceptions"
      subtitle="Tracking and governance of approved security policy bypasses and accepted risks"
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>

      <ActSection act="act1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {kpis.map(card)}
        </div>
      </ActSection>

      <div className="flex flex-col gap-3">
        {/* ── Risk Distribution Cards ────────────────────────────────── */}
        <div>
          <SectionHeading title="Exception Risk Distribution" subtitle="Active exceptions grouped by risk severity level" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {riskCounts.map(r => (
              <div
                key={r.label}
                className="flex flex-col items-center justify-center py-3 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] transition-all duration-200 hover:border-white/[0.12]"
              >
                <span className="text-[20px] font-bold leading-none" style={{ color: r.color }}>{r.count}</span>
                <span className="text-[9.5px] font-bold uppercase tracking-wider mt-1.5" style={{ color: r.color }}>{r.label}</span>
                <span className="text-[9.5px] text-slate-400 mt-0.5">Exceptions</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Exceptions Table ────────────────────────────────── */}
        <div>
          <SectionHeading title="Active Policy Exceptions" subtitle="Currently active approved policy bypasses and their approval status" />
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] [&_td]:py-2 [&_th]:py-2.5 [&_td]:px-3 [&_th]:px-3">
                <thead>
                  <tr className="bg-black/10 border-b border-white/[0.05]">
                    {['Exception ID', 'Policy', 'Requester', 'Risk', 'Expiry', 'Approval', 'Status'].map(h => (
                      <th
                        key={h}
                        className="text-left text-[9.5px] font-semibold text-slate-200 uppercase tracking-wider whitespace-nowrap"
                      >{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exceptionsTable.map(row => (
                    <tr
                      key={row.id}
                      className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="font-mono text-[#00D9FF] whitespace-nowrap">{row.id}</td>
                      <td className="text-white font-medium whitespace-nowrap">{row.policy}</td>
                      <td className="text-slate-400 whitespace-nowrap">{row.requester}</td>
                      <td className="whitespace-nowrap"><SevBadge val={row.risk} /></td>
                      <td className="text-slate-300 whitespace-nowrap font-mono text-[9.5px]">{row.expiry}</td>
                      <td>
                        <span className={`text-[10px] font-bold ${row.approval === 'Approved' ? 'text-green-400' : 'text-amber-400'}`}>
                          {row.approval}
                        </span>
                      </td>
                      <td className="whitespace-nowrap"><StatusBadge val={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Expiry Timeline ────────────────────────────────────────── */}
        <div>
          <SectionHeading title="Exception Expiry Timeline" subtitle="Upcoming exception expirations — high-risk exceptions require immediate review" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['7d', '14d', '30d'].map(window => {
              const items = expiryItems.filter(e => e.window === window)
              const label = window === '7d' ? 'Next 7 Days' : window === '14d' ? 'Next 14 Days' : 'Next 30 Days'
              return (
                <Card key={window}>
                  <div className="flex items-center gap-2 mb-2">
                    <MdCalendarToday size={14} className="text-[#6b7280]" />
                    <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                      {label}
                    </p>
                    <span className="ml-auto text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border border-white/[0.05] bg-black/5 text-slate-400">
                      {items.length}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-[9.5px] text-slate-400 text-center py-3">No expirations</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-[6px] border" style={{ borderColor: `${expiryColor[item.risk]}30`, backgroundColor: `${expiryColor[item.risk]}08` }}>
                          <div>
                            <p className="text-[9.5px] font-semibold text-slate-200">
                              {item.id}
                            </p>
                            <p className="text-[9.5px] text-slate-400">
                              {item.policy}
                            </p>
                          </div>
                          <div className="text-right">
                            {(item.risk === 'Critical' || item.risk === 'High') && (
                              <MdWarningAmber size={12} style={{ color: expiryColor[item.risk] }} className="ml-auto mb-1" />
                            )}
                            <span
                              className="text-[9.5px] font-bold font-mono whitespace-nowrap"
                              style={{ color: expiryColor[item.risk] }}
                            >
                              {item.days}d left
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
