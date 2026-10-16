import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { MdMinimize, MdCropSquare, MdClose, MdRefresh, MdFileDownload, MdHourglassEmpty } from 'react-icons/md'
import { RiDraggable } from 'react-icons/ri'
import {
  getTrendData, getSeverityData, getSourceData, getStatusData, customTooltip
} from '../utils/mockData'
import { CHART_SIZES } from '../utils/chartSizes'

// ── Shared ChartCard wrapper ──────────────────────────────────────────────────
export function ChartCard({ 
  title, 
  type = 'default',
  children, 
  dragHandleProps = null, 
  modalData = null,
  isLoading = false,
  isEmpty = false,
  lastUpdated = 'Just now',
  onRefresh = null,
  className = ''
}) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized]  = useState(false)
  const [activeTab, setActiveTab] = useState('chart')

  // Compute numeric field keys from modalData
  const numericFields = useMemo(() => {
    if (!modalData || !modalData.length) return []
    const sample = modalData[0]
    return Object.keys(sample).filter(k => k !== 'time' && typeof sample[k] === 'number')
  }, [modalData])

  // Statistics: peak / min / avg per field
  const stats = useMemo(() => {
    if (!modalData || !numericFields.length) return {}
    const result = {}
    numericFields.forEach(field => {
      const vals = modalData.map(d => d[field])
      result[field] = {
        peak: Math.max(...vals),
        min:  Math.min(...vals),
        avg:  Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      }
    })
    return result
  }, [modalData, numericFields])

  const TABS = modalData
    ? ['chart', 'table', 'json', 'statistics']
    : ['chart']

  const STAT_COLORS = {
    peak: { label: 'Peak',    color: '#FF4D4F', bg: 'rgba(255,77,79,0.1)'  },
    min:  { label: 'Min',     color: '#00D9FF', bg: 'rgba(0,217,255,0.1)'  },
    avg:  { label: 'Average', color: '#39FF6A', bg: 'rgba(57,255,106,0.1)' },
  }

  const handleExportJSON = () => {
    if (!modalData) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(modalData, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${title.replace(/\s+/g, '_').toLowerCase()}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const handleExportCSV = () => {
    if (!modalData || !modalData.length) return
    const keys = Object.keys(modalData[0])
    const csvStr = [
      keys.join(','),
      ...modalData.map(row => keys.map(k => `"${row[k]}"`).join(','))
    ].join('\n')
    
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvStr)
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${title.replace(/\s+/g, '_').toLowerCase()}.csv`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const header = (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        {/* Drag handle — only activator for DnD */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="dnd-drag-handle p-1 -ml-1 rounded"
            title="Drag to rearrange"
          >
            <RiDraggable size={18} />
          </div>
        )}
        <div className="flex flex-col">
          <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
  {title}
</h3>
          {!isMinimized && lastUpdated && (
            <span className="text-[9.5px] text-slate-400">Last updated: {lastUpdated}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-htb-muted">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            title="Refresh"
            disabled={isLoading}
          >
            <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: "linear" }}>
              <MdRefresh size={16} />
            </motion.div>
          </button>
        )}
        <button
          onClick={() => setIsMinimized(v => !v)}
          className="hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          title={isMinimized ? 'Expand' : 'Minimize'}
        >
          <MdMinimize size={16} />
        </button>
        <button
          onClick={() => { setIsMaximized(v => !v); setIsMinimized(false); setActiveTab('chart') }}
          className="hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <MdClose size={16} /> : <MdCropSquare size={16} />}
        </button>
      </div>
    </div>
  )

  const body = (
    <AnimatePresence>
      {!isMinimized && (
        <motion.div
          key="chart-body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '100%', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 w-full relative min-h-0"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-htb-muted bg-htb-card/50 backdrop-blur-sm z-10 rounded-[8px]">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <MdRefresh size={28} className="text-htb-green" />
              </motion.div>
              <span className="text-[12.5px] font-medium text-htb-text">Loading data...</span>
            </div>
          ) : isEmpty || (modalData && modalData.length === 0) ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-htb-muted">
              <MdHourglassEmpty size={32} className="text-htb-muted/50" />
              <span className="text-[12.5px] font-medium">No data available</span>
            </div>
          ) : (
            children
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── Maximized: full-screen modal overlay ─────────────────────────────────
  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md p-10 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full max-w-6xl max-h-[850px] glass-modal rounded-[18px] p-8 flex flex-col gap-4"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1)' }}
        >
          {/* Modal header */}
          {header}

          {/* Tabs and Actions — only show when modalData is present */}
          {TABS.length > 1 && (
            <div className="flex justify-between items-center w-full">
              <div className="flex gap-1 bg-white/[0.04] rounded-[10px] p-1 w-fit">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-[8px] text-[12.5px] font-medium capitalize transition-all duration-150 ${
                      activeTab === tab
                        ? 'bg-htb-green text-[#0B0F12]'
                        : 'text-htb-muted hover:text-htb-text'
                    }`}
                  >
                    {tab === 'json' ? 'JSON' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-htb-muted hover:text-htb-text rounded-[8px] text-[12px] font-medium transition-colors border border-htb-border/50"
                >
                  <MdFileDownload size={14} />
                  Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-htb-muted hover:text-htb-text rounded-[8px] text-[12px] font-medium transition-colors border border-htb-border/50"
                >
                  <MdFileDownload size={14} />
                  Export JSON
                </button>
              </div>
            </div>
          )}

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">

            {/* Chart tab */}
            {activeTab === 'chart' && (
              <motion.div
                key="modal-chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full"
              >
                {children}
              </motion.div>
            )}

            {/* Table tab */}
            {activeTab === 'table' && modalData && (
              <motion.div
                key="modal-table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full overflow-y-auto"
              >
                <table className="w-full text-[12.5px]">
                  <thead className="sticky top-0 bg-[#0d1117]">
                    <tr className="border-b border-htb-border">
                      {Object.keys(modalData[0]).map(col => (
                        <th
                          key={col}
                          className="text-left pb-3 pr-6 text-[11px] uppercase tracking-wider text-htb-dim font-semibold"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-htb-border/20">
                    {modalData.map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                        {Object.entries(row).map(([k, v]) => (
                          <td key={k} className={`py-2.5 pr-6 ${k === 'time' ? 'text-htb-muted font-mono' : 'text-htb-text font-medium'}`}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {/* JSON tab */}
            {activeTab === 'json' && modalData && (
              <motion.div
                key="modal-json"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full overflow-y-auto"
              >
                <pre
                  className="text-[12px] text-htb-green font-mono leading-relaxed p-4 bg-[#0a0f14] border border-htb-border/50 rounded-[10px] overflow-x-auto"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                >
                  {JSON.stringify(modalData, null, 2)}
                </pre>
              </motion.div>
            )}

            {/* Statistics tab */}
            {activeTab === 'statistics' && modalData && (
              <motion.div
                key="modal-stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full overflow-y-auto"
              >
                <div className="grid gap-6">
                  {numericFields.map(field => (
                    <div key={field} className="bg-white/[0.03] border border-htb-border/50 rounded-[12px] p-5">
                      <h4 className="text-[13px] font-semibold text-htb-text mb-4 capitalize">
                        {field.charAt(0).toUpperCase() + field.slice(1)} Statistics
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(STAT_COLORS).map(([key, meta]) => (
                          <div
                            key={key}
                            className="flex flex-col gap-1.5 rounded-[10px] p-4 border"
                            style={{ background: meta.bg, borderColor: meta.color + '30' }}
                          >
                            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: meta.color }}>
                              {meta.label}
                            </span>
                            <span className="text-[28px] font-bold text-htb-text leading-none">
                              {stats[field]?.[key]?.toLocaleString() ?? '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  const sizes = CHART_SIZES[type] || CHART_SIZES.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col transition-all ${isMinimized ? 'h-auto' : ''} ${className}`}
      style={{ height: isMinimized ? 'auto' : sizes.container }}
    >
      {header}
      {body}
    </motion.div>
  )
}

// ── Chart renderers (pure, no state) ─────────────────────────────────────────
function ThreatTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" vertical={false} />
        <XAxis dataKey="time" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#39FF6A' }} />
        <Line type="monotone" dataKey="threats" stroke="#39FF6A" strokeWidth={2}
          dot={{ r: 3, fill: '#11171C', stroke: '#39FF6A', strokeWidth: 2 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SeverityPieChart({ data }) {
  return (
    <>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="#0B0F12" strokeWidth={2}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#fff' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 flex-wrap">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-htb-muted">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            {d.name}
          </div>
        ))}
      </div>
    </>
  )
}

function SourceBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" horizontal={false} />
        <XAxis type="number" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis dataKey="country" type="category" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
        <RechartsTooltip contentStyle={customTooltip} cursor={{ fill: 'rgba(57,255,106,0.05)' }} />
        <Bar dataKey="attacks" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function StatusPieChart({ data }) {
  return (
    <>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="#0B0F12" strokeWidth={2}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#fff' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 flex-wrap">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-htb-muted">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            {d.name}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Chart registry — stable IDs, titles, and render components ───────────────
const CHART_REGISTRY = {
  trend:    { id: 'trend',    title: 'Threat Trend Analysis', type: 'line' },
  severity: { id: 'severity', title: 'Alert Severity Distribution', type: 'pie' },
  source:   { id: 'source',   title: 'Attack Sources by Region', type: 'bar' },
  status:   { id: 'status',   title: 'Incident Status', type: 'pie' },
}

// ── Dashboard Charts ──────────────────────────────────────────────────────────
/**
 * Charts component — renders chart cards.
 * `orderedIds` and `dragHandlePropsMap` are supplied by the parent Dashboard
 * so that @dnd-kit's SortableContext can own the drag state.
 */
export default function Charts({ selectedTime = 'Last 24 Hours', orderedIds, dragHandlePropsMap = {} }) {
  const trendData    = useMemo(() => getTrendData(selectedTime),    [selectedTime])
  const severityData = useMemo(() => getSeverityData(selectedTime), [selectedTime])
  const sourceData   = useMemo(() => getSourceData(selectedTime),   [selectedTime])
  const statusData   = useMemo(() => getStatusData(selectedTime),   [selectedTime])

  // Strip color from pie/bar data for modal table/JSON (not user-meaningful)
  const modalDataMap = useMemo(() => ({
    trend:    trendData,
    severity: severityData.map(({ name, value }) => ({ name, value })),
    source:   sourceData.map(({ country, attacks }) => ({ country, attacks })),
    status:   statusData.map(({ name, value }) => ({ name, value })),
  }), [trendData, severityData, sourceData, statusData])

  const renderChart = (id) => {
    switch (id) {
      case 'trend':    return <ThreatTrendChart data={trendData} />
      case 'severity': return <SeverityPieChart data={severityData} />
      case 'source':   return <SourceBarChart data={sourceData} />
      case 'status':   return <StatusPieChart data={statusData} />
      default:         return null
    }
  }

  const ids = orderedIds || Object.keys(CHART_REGISTRY)

  return (
    <>
      {ids.map((id) => {
        const meta = CHART_REGISTRY[id]
        if (!meta) return null
        return (
          <ChartCard
            key={id}
            title={meta.title}
            type={meta.type || 'default'}
            dragHandleProps={dragHandlePropsMap[id]}
            modalData={modalDataMap[id] ?? null}
          >
            {renderChart(id)}
          </ChartCard>
        )
      })}
    </>
  )
}

export { CHART_REGISTRY }
