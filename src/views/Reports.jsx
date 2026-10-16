import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { ChartCard } from '../components/Charts'
import KpiCard from '../components/KpiCard'
import Pagination, { usePagination } from '../components/Pagination'
import DetailsModal from '../components/DetailsModal'
import {
  getReportsKpis,
  getReportsTrendData,
  getReportsTypeData,
  getRecentReports,
  getScheduledReports,
  customTooltip,
} from '../utils/mockData'

// ── Status/Format badge colours ─────────────────────────────────────────────
const BADGE_STYLES = {
  Ready:      'bg-green-500/15 text-green-400 border border-green-500/30',
  Processing: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  Failed:     'bg-red-500/15 text-red-400 border border-red-500/30',
  PDF:        'bg-red-400/10 text-red-400 border border-red-400/20',
  CSV:        'bg-green-400/10 text-green-400 border border-green-400/20',
  XLSX:       'bg-green-500/10 text-green-500 border border-green-500/20',
  PPTX:       'bg-orange-400/10 text-orange-400 border border-orange-400/20',
}

function StatusBadge({ text }) {
  return (
    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[text] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
      {text}
    </span>
  )
}

// ── Recent Reports Table ──────────────────────────────────────────────────
function RecentReportsTable({ reports }) {
  const pg = usePagination(reports)
  const [selectedRow, setSelectedRow] = useState(null)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] text-htb-muted">
        <thead>
          <tr className="border-b border-htb-border text-[11px] uppercase tracking-wider text-htb-dim">
            {['ID / Type', 'Report Name', 'Format', 'Status', 'Generated At'].map(h => (
              <th key={h} className="text-left pb-2 pr-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-htb-border/30">
          {pg.paginated.map((row, i) => (
            <tr key={i} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedRow(row)}>
              <td className="py-2.5 pr-4">
                <span className="font-medium text-htb-text block">{row.id}</span>
                <span className="font-mono text-[10.5px] text-htb-dim">{row.type}</span>
              </td>
              <td className="py-2.5 pr-4 text-htb-text">{row.name}</td>
              <td className="py-2.5 pr-4"><StatusBadge text={row.format} /></td>
              <td className="py-2.5 pr-4"><StatusBadge text={row.status} /></td>
              <td className="py-2.5 text-htb-dim">{row.generatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination {...pg} />
      <DetailsModal isOpen={!!selectedRow} onClose={() => setSelectedRow(null)} data={selectedRow} />
    </div>
  )
}

// ── Scheduled Reports Feed ──────────────────────────────────────────────
function ScheduledReportsFeed({ items }) {
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
            <StatusBadge text={item.format} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[12px] font-bold text-htb-text">{item.name}</span>
              <span className="text-[10.5px] font-mono text-htb-dim">{item.frequency}</span>
            </div>
            <p className="text-[11.5px] text-htb-muted leading-snug">Next Run: <span className="text-htb-text">{item.nextRun}</span></p>
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
export default function Reports({ selectedTime = 'Last 24 Hours' }) {
  const kpis          = useMemo(() => getReportsKpis(selectedTime),      [selectedTime])
  const trendData     = useMemo(() => getReportsTrendData(selectedTime),  [selectedTime])
  const typeData      = useMemo(() => getReportsTypeData(selectedTime), [selectedTime])
  const reportsList   = useMemo(() => getRecentReports(selectedTime),        [selectedTime])
  const scheduled     = useMemo(() => getScheduledReports(),       [])

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
  const CHART_IDS = ['trend', 'types']
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
      title: 'Report Generation Trend',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" vertical={false} />
            <XAxis dataKey="time" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={customTooltip} />
            <Line type="monotone" dataKey="generated" name="Generated" stroke="#00D9FF" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="failed" name="Failed" stroke="#FF4D4F" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'types',
      title: 'Reports Generated by Type',
      render: () => (
        <>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={typeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" vertical={false} />
              <XAxis dataKey="name" stroke="#7B8A96" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" name="Reports" radius={[4, 4, 0, 0]} barSize={32}>
                {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 flex-wrap">
            {typeData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-[10.5px] text-htb-muted">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                {d.name}: {d.value}
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
            <h2 className="text-[20px] font-bold text-htb-text leading-tight">Reporting Hub</h2>
            <p className="text-htb-muted text-[13px] mt-0.5">
              Analytics, Summaries & Automated Exports — <span className="text-htb-green">{selectedTime}</span>
            </p>
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

          {/* Top Reports Table */}
          <SectionCard title="Recently Generated Reports">
            <RecentReportsTable reports={reportsList} />
          </SectionCard>

          {/* Scheduled Reports Feed */}
          <SectionCard title="Scheduled Reports">
            <ScheduledReportsFeed items={scheduled} />
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
