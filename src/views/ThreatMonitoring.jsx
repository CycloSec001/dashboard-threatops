import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { MdDragIndicator } from 'react-icons/md'
import { ChartCard } from '../components/Charts'
import KpiCard from '../components/KpiCard'
import Pagination, { usePagination } from '../components/Pagination'
import DetailsModal from '../components/DetailsModal'
import {
  getMonitoringKpis, getMonitoringTrendData, getThreatTypeData,
  getThreatSources, getRecentActivity, customTooltip,
} from '../utils/mockData'

// ── Severity badge colours ────────────────────────────────────────────────────
const SEV_STYLES = {
  Critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  Medium:   'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  Low:      'bg-blue-400/15 text-blue-400 border border-blue-400/30',
}

function SevBadge({ severity }) {
  return (
    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${SEV_STYLES[severity] || ''}`}>
      {severity}
    </span>
  )
}

// ── Threat Sources Table ──────────────────────────────────────────────────────
function ThreatSourcesTable({ sources }) {
  const pg = usePagination(sources)
  const [selectedRow, setSelectedRow] = useState(null)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] text-htb-muted">
        <thead>
          <tr className="border-b border-htb-border text-[11px] uppercase tracking-wider text-htb-dim">
            {['IP / Source', 'Location', 'Threat Type', 'Severity', 'Last Seen'].map(h => (
              <th key={h} className="text-left pb-2 pr-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-htb-border/30">
          {pg.paginated.map((row, i) => (
            <tr key={i} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedRow(row)}>
              <td className="py-2.5 pr-4 font-mono text-htb-text">{row.ip}</td>
              <td className="py-2.5 pr-4">{row.location}</td>
              <td className="py-2.5 pr-4">{row.type}</td>
              <td className="py-2.5 pr-4"><SevBadge severity={row.severity} /></td>
              <td className="py-2.5 text-htb-dim">{row.lastSeen}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination {...pg} />
      <DetailsModal isOpen={!!selectedRow} onClose={() => setSelectedRow(null)} data={selectedRow} />
    </div>
  )
}

// ── Recent Activity Feed ──────────────────────────────────────────────────────
function ActivityFeed({ items }) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-1 scrollbar-hide">
      {items.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3 p-3 rounded-[10px] bg-white/[0.03] border border-htb-border/30 hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex-shrink-0 mt-0.5">
            <SevBadge severity={item.severity} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-htb-text leading-snug">{item.message}</p>
            <span className="text-[10.5px] text-htb-dim mt-0.5 block">{item.time}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Section wrapper (card with title) ────────────────────────────────────────
function SectionCard({ title, children, className = '' }) {
  return (
    <div
      className={`bg-htb-card border border-htb-border rounded-[14px] p-5 flex flex-col gap-4 ${className}`}
      style={{ boxShadow: '0 0 10px rgba(57,255,106,.06)' }}
    >
      <h3 className="text-[14px] font-semibold text-htb-text">{title}</h3>
      {children}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ThreatMonitoring({ selectedTime = 'Last 24 Hours' }) {
  const kpis       = useMemo(() => getMonitoringKpis(selectedTime),      [selectedTime])
  const trendData  = useMemo(() => getMonitoringTrendData(selectedTime),  [selectedTime])
  const typeData   = useMemo(() => getThreatTypeData(selectedTime),       [selectedTime])
  const sources    = useMemo(() => getThreatSources(selectedTime),        [selectedTime])
  const activity   = useMemo(() => getRecentActivity(selectedTime),       [selectedTime])

  // KPI drag-and-drop
  const [draggedKpiIdx, setDraggedKpiIdx] = useState(null)
  const [kpiOrder, setKpiOrder]           = useState([0, 1, 2, 3])

  const handleKpiDrop = (targetIdx) => {
    if (draggedKpiIdx === null || draggedKpiIdx === targetIdx) return
    const newOrder = [...kpiOrder]
    const [item]   = newOrder.splice(draggedKpiIdx, 1)
    newOrder.splice(targetIdx, 0, item)
    setKpiOrder(newOrder)
    setDraggedKpiIdx(null)
  }

  // Chart drag-and-drop
  const CHART_IDS = ['trend', 'type']
  const [chartOrder, setChartOrder] = useState([0, 1])
  const [draggedChartIdx, setDraggedChartIdx] = useState(null)

  const handleChartDrop = (targetIdx) => {
    if (draggedChartIdx === null || draggedChartIdx === targetIdx) return
    const newOrder = [...chartOrder]
    const [item]   = newOrder.splice(draggedChartIdx, 1)
    newOrder.splice(targetIdx, 0, item)
    setChartOrder(newOrder)
    setDraggedChartIdx(null)
  }

  const chartsConfig = [
    {
      id: 'trend',
      title: 'Threat Trend Analysis',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" vertical={false} />
            <XAxis dataKey="time" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={customTooltip} />
            <Line type="monotone" dataKey="detected" name="Detected" stroke="#FF4D4F" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="blocked"  name="Blocked"  stroke="#39FF6A" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'type',
      title: 'Threat Type Breakdown',
      render: () => (
        <>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={typeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" vertical={false} />
              <XAxis dataKey="name" stroke="#7B8A96" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28}>
                {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 flex-wrap">
            {typeData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-[10.5px] text-htb-muted">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </>
      ),
    },
  ]

  const orderedCharts = chartOrder.map(i => chartsConfig[i])

  return (
    <div
      className="flex-1 flex flex-col overflow-y-auto"
      style={{
        background: 'linear-gradient(#141B21 1px, transparent 1px), linear-gradient(90deg, #141B21 1px, transparent 1px), #0B0F12',
        backgroundSize: '40px 40px',
      }}
    >
      <div className="flex flex-col gap-5 px-8 pb-8 pt-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-htb-text leading-tight">Threat Monitoring</h2>
            <p className="text-htb-muted text-[13px] mt-0.5">
              Real-time threat detection & analysis — <span className="text-htb-green">{selectedTime}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[12px] text-htb-green">
              <span className="w-1.5 h-1.5 rounded-full bg-htb-green animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiOrder.map((i, visualIdx) => {
            const card = kpis[i]
            if (!card) return null
            return (
              <KpiCard
                key={card.id}
                {...card}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  setDraggedKpiIdx(visualIdx)
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleKpiDrop(visualIdx) }}
              />
            )
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {orderedCharts.map((chart, idx) => (
            <ChartCard
              key={chart.id}
              title={chart.title}
              modalData={chart.id === 'trend' ? trendData : null}
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedChartIdx(idx) }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleChartDrop(idx) }}
            >
              {chart.render()}
            </ChartCard>
          ))}
        </div>

        {/* Bottom Row: Table + Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Top Threat Sources Table */}
          <SectionCard title="Top Threat Sources / IPs">
            <ThreatSourcesTable sources={sources} />
          </SectionCard>

          {/* Recent Threat Activity Feed */}
          <SectionCard title="Recent Threat Activity">
            <ActivityFeed items={activity} />
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
