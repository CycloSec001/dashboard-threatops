import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdFilterList, MdSearch } from 'react-icons/md'
import KpiCard from '../components/KpiCard'
import { ChartCard } from '../components/Charts'
import { customTooltip } from '../utils/mockData'
import Pagination, { usePagination } from '../components/Pagination'
import DetailsModal from '../components/DetailsModal'
import {
  getAlertKpis, getAlertTrendData, getAlertSeverityData, getAlertsList
} from '../utils/alertsData'

// ── Severity/Status colour maps ───────────────────────────────────────────────
const SEV_BADGE = {
  Critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  Medium:   'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  Low:      'bg-sky-400/15 text-sky-400 border border-sky-400/30',
}
const STATUS_BADGE = {
  Active:        'bg-red-500/10 text-red-400',
  Investigating: 'bg-purple-500/10 text-purple-400',
  Resolved:      'bg-green-500/10 text-green-400',
}

function Badge({ text, map }) {
  return (
    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${map[text] || 'text-htb-muted'}`}>
      {text}
    </span>
  )
}

// ── Alerts Table ──────────────────────────────────────────────────────────────
function AlertsTable({ alerts, filterSev, search }) {
  const filtered = alerts.filter(a => {
    const matchSev    = filterSev === 'All' || a.severity === filterSev
    const matchSearch = search === '' || a.rule.toLowerCase().includes(search.toLowerCase()) || a.host.toLowerCase().includes(search.toLowerCase())
    return matchSev && matchSearch
  })

  const pg = usePagination(filtered)
  const [selectedRow, setSelectedRow] = useState(null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-htb-border text-[11px] uppercase tracking-wider text-htb-dim">
            {['Alert ID','Rule / Signature','Host','Source','Severity','Status','Time'].map(h => (
              <th key={h} className="text-left pb-3 pr-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-htb-border/20">
          {pg.paginated.map((row, i) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => setSelectedRow(row)}
            >
              <td className="py-3 pr-4 font-mono text-htb-dim text-[11px]">{row.id}</td>
              <td className="py-3 pr-4 text-htb-text font-medium max-w-[220px] truncate">{row.rule}</td>
              <td className="py-3 pr-4 font-mono text-htb-muted text-[11px]">{row.host}</td>
              <td className="py-3 pr-4 text-htb-muted">{row.source}</td>
              <td className="py-3 pr-4"><Badge text={row.severity} map={SEV_BADGE} /></td>
              <td className="py-3 pr-4"><Badge text={row.status} map={STATUS_BADGE} /></td>
              <td className="py-3 text-htb-dim">{row.time}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="text-center py-10 text-htb-dim text-[13px]">No alerts match your filters</div>
      )}
      <Pagination {...pg} />
      <DetailsModal isOpen={!!selectedRow} onClose={() => setSelectedRow(null)} data={selectedRow} />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Alerts({ selectedTime = 'Last 24 Hours' }) {
  const kpis       = useMemo(() => getAlertKpis(selectedTime),        [selectedTime])
  const trendData  = useMemo(() => getAlertTrendData(selectedTime),   [selectedTime])
  const sevData    = useMemo(() => getAlertSeverityData(selectedTime),[selectedTime])
  const alertsList = useMemo(() => getAlertsList(selectedTime),       [selectedTime])

  const [draggedKpiIdx, setDraggedKpiIdx] = useState(null)
  const [kpiOrder, setKpiOrder]           = useState([0, 1, 2, 3])
  const [filterSev, setFilterSev]         = useState('All')
  const [search, setSearch]               = useState('')

  const handleKpiDrop = (targetIdx) => {
    if (draggedKpiIdx === null || draggedKpiIdx === targetIdx) return
    const newOrder = [...kpiOrder]
    const [item]   = newOrder.splice(draggedKpiIdx, 1)
    newOrder.splice(targetIdx, 0, item)
    setKpiOrder(newOrder)
    setDraggedKpiIdx(null)
  }

  const SEV_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low']

  return (
    <div
      className="flex-1 flex flex-col overflow-y-auto bg-grid"
      style={{
        backgroundColor: '#070B11',
      }}
    >
      <div className="flex flex-col gap-6 px-8 pb-8 pt-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-htb-text">Alerts</h2>
            <p className="text-htb-muted text-[13px] mt-0.5">
              Security alerts across all systems — <span className="text-htb-green">{selectedTime}</span>
            </p>
          </div>
          <button className="flex items-center gap-2 text-[12px] text-htb-muted hover:text-htb-green transition-colors px-3 py-1.5 rounded-lg border border-htb-border hover:border-htb-green/40">
            <MdRefresh size={15} />
            Refresh
          </button>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
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

        {/* ── Charts Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Alert Trend Over Time */}
          <ChartCard title="Alert Trend Over Time">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" vertical={false} />
                <XAxis dataKey="time" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={customTooltip} />
                <Line type="monotone" dataKey="critical" name="Critical" stroke="#FF4D4F" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="high"     name="High"     stroke="#FF8C00" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="medium"   name="Medium"   stroke="#FFC107" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="low"      name="Low"      stroke="#00D9FF" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Alert Severity Distribution */}
          <ChartCard title="Alert Severity Distribution">
            <>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={sevData}
                    cx="50%" cy="50%"
                    outerRadius={85}
                    dataKey="value" stroke="#0B0F12" strokeWidth={2}
                  >
                    {sevData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 flex-wrap">
                {sevData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-htb-muted">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          </ChartCard>
        </div>

        {/* ── Alerts Table ────────────────────────────────────────────────── */}
        <div
          className="glass-panel rounded-[14px] p-5 flex flex-col gap-4"
        >
          {/* Table header + filters */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-[14px] font-semibold text-white">Alert Log</h3>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex items-center gap-2 glass-input rounded-[8px] px-3 py-1.5">
                <MdSearch className="text-slate-400 text-[15px]" />
                <input
                  type="text"
                  placeholder="Search rule or host…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-[12px] text-white placeholder-slate-500 outline-none w-44"
                />
              </div>

              {/* Severity filter pills */}
              <div className="flex items-center gap-1">
                <MdFilterList className="text-htb-muted text-[15px]" />
                {SEV_FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterSev(f)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                      filterSev === f
                        ? 'bg-htb-green text-black'
                        : 'text-htb-muted hover:text-htb-text hover:bg-white/5'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AlertsTable alerts={alertsList} filterSev={filterSev} search={search} />
        </div>

      </div>
    </div>
  )
}
