import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts'
import PageShell, { ActSection } from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import DetailTable from '../components/DetailTable'

const TT = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '11px',
  padding: '6px 10px',
}
const SevBadge = ({ val }) => {
  const c = {
    High: 'text-red-400 bg-red-500/15 border-red-500/30',
    Medium: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
    Low: 'text-green-400 bg-green-500/15 border-green-500/30'
  }
  return (
    <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${c[val] || 'text-gray-400 bg-gray-500/15 border-gray-500/30'}`}>
      {val}
    </span>
  )
}

async function fetchData(tf) {
  return { kpis: {}, auditTrail: [], unsupported: 'Incident audit aggregation is not exposed; use the backend audit endpoint.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, Math.random() * 700 + 400))
  const m = { 'Last 24 Hours': 1, 'Last 7 Days': 7, 'Last 30 Days': 28, 'Last 90 Days': 90 }[tf] || 1
  const labels = tf === 'Last 7 Days' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : tf === 'Last 30 Days' ? ['W1', 'W2', 'W3', 'W4']
      : tf === 'Last 90 Days' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
  const j = (b, r = 0.3) => Math.round(b * (1 - r + Math.random() * r * 2))

  const auditTrend = labels.map(t => ({ t, records: j(420 * m / labels.length), anomalies: j(18 * m / labels.length) }))

  const actorScatter = Array.from({ length: 30 }, () => ({
    x: j(100, 0.8), // Activity frequency
    y: j(100, 0.8), // Risk score
    z: j(1000, 0.9), // Record count
    type: Math.random() > 0.8 ? 'System' : 'Analyst'
  }))

  const auditTable = Array.from({ length: 8 }, (_, i) => ({
    id: `AUD-${80000 + i * 112}`,
    timestamp: `${j(12, 0.8)}h ago`,
    actor: ['admin_jane', 'sys_automation', 'analyst_bob', 'svc_provisioner'][i % 4],
    action: ['Rule Modified', 'Incident Escalated', 'Playbook Triggered', 'Exception Approved'][i % 4],
    target: ['Rule: Suspicious Logon', 'INC-4022', 'Isolate Endpoint', 'EXC-5011'][i % 4],
    risk: ['Low', 'Medium', 'Low', 'High'][i % 4],
  }))

  return {
    auditRecords: j(42500 * m, 0.2),
    anomalousActions: j(142 * m, 0.3),
    activeActors: j(84, 0.1),
    systemChanges: j(512 * m, 0.2),
    dataIntegrity: `${j(99.9, 0.01)}%`,
    auditTrend, actorScatter, auditTable,
    _lastUpdated: new Date().toISOString(),
  }
}

const kpis = [
  { key: 'auditRecords', title: 'Audit Records', visualization: 'mini-bar', color: '#00D9FF' },
  { key: 'anomalousActions', title: 'Anomalous Actions', visualization: 'mini-area', color: '#EF4444' },
  { key: 'systemChanges', title: 'System Changes', visualization: 'mini-bar', color: '#F97316' },
  { key: 'activeActors', title: 'Active Actors', visualization: 'mini-line', color: '#8B5CF6' },
  { key: 'dataIntegrity', title: 'Data Integrity', visualization: 'gauge', color: '#39FF6A' },
]

export default function IncidentAudit({ selectedTime, setActive }) {
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

  const cols = [
    { header: 'ID', accessor: 'id' },
    { header: 'Timestamp', accessor: 'timestamp' },
    { header: 'Actor', accessor: 'actor' },
    { header: 'Action', accessor: 'action' },
    { header: 'Target Object', accessor: 'target' },
    { header: 'Action Risk', accessor: 'risk', render: v => <SevBadge val={v} /> },
  ]

  return (
    <PageShell section="Decision Logs" title="Incident Audit"
      subtitle="Immutable ledger of analyst actions, system changes, and response decisions"
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>

      <ActSection act="act1">
        <div className="grid grid-cols-5 gap-3">{kpis.map(card)}</div>
      </ActSection>
    </PageShell>
  )
}
