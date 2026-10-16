import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdClose, MdBarChart, MdCode, MdTableChart, MdList } from 'react-icons/md'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
// ── Custom tooltip ─────────────────────────────────────────────────────────────
const customTooltip = {
  backgroundColor: '#0d1117',
  border: '1px solid #21262d',
  borderRadius: '8px',
  color: '#e8f0ea',
  fontSize: '12px',
}

// ── Tabs ───────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'chart', label: 'Chart',      icon: MdBarChart   },
  { id: 'json',  label: 'JSON View',  icon: MdCode       },
  { id: 'table', label: 'Table View', icon: MdTableChart },
  { id: 'list',  label: 'List View',  icon: MdList       },
]

// ── Chart Tab ─────────────────────────────────────────────────────────────────
function ChartTab({ data, color }) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Legend */}
      <div className="flex items-center gap-5 px-1">
        <div className="flex items-center gap-2 text-[12px] text-htb-muted">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: color, display: 'inline-block' }} />
          Detected
        </div>
        <div className="flex items-center gap-2 text-[12px] text-htb-muted">
          <span className="w-3 h-0.5 rounded bg-[#39FF6A]" style={{ display: 'inline-block' }} />
          Blocked
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDetected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#39FF6A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#39FF6A" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" vertical={false} />
            <XAxis dataKey="time" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#e8f0ea' }} />
            <Area
              type="monotone" dataKey="count" name="Detected"
              stroke={color} strokeWidth={2}
              fill="url(#colorDetected)"
              dot={{ r: 3, fill: '#11171C', stroke: color, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone" dataKey="blocked" name="Blocked"
              stroke="#39FF6A" strokeWidth={2}
              fill="url(#colorBlocked)"
              dot={{ r: 3, fill: '#11171C', stroke: '#39FF6A', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Peak',    value: Math.max(...data.map(d => d.count)),  color },
          { label: 'Min',     value: Math.min(...data.map(d => d.count)),  color: '#7B8A96' },
          { label: 'Avg',     value: Math.round(data.reduce((s, d) => s + d.count, 0) / data.length), color: '#00D9FF' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-center">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── JSON Tab ──────────────────────────────────────────────────────────────────
function JsonTab({ kpi, data }) {
  const payload = { kpi: { id: kpi.id, title: kpi.title, currentValue: kpi.value, trend: kpi.trend, subtext: kpi.subtext }, timeSeries: data }
  const json = JSON.stringify(payload, null, 2)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Simple syntax highlighter
  const highlighted = json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, match => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:#79c0ff">${match}</span>` // key
        return `<span style="color:#a5d6ff">${match}</span>`                         // string
      }
      if (/true|false/.test(match)) return `<span style="color:#ff8c00">${match}</span>`
      if (/null/.test(match)) return `<span style="color:#6e7681">${match}</span>`
      return `<span style="color:#39FF6A">${match}</span>` // number
    })

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy JSON'}
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-white/[0.08] bg-black/40">
        <pre
          className="p-5 text-[12.5px] leading-relaxed font-mono whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  )
}

// ── Table Tab ─────────────────────────────────────────────────────────────────
function TableTab({ data, color }) {
  const peak = Math.max(...data.map(d => d.count))
  return (
    <div className="overflow-auto rounded-xl border border-white/[0.08]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-white/[0.03] border-b border-white/[0.06]">
            {['Time Period', 'Detected', 'Blocked', 'Block Rate', 'Severity'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const rate = row.count > 0 ? Math.round((row.blocked / row.count) * 100) : 0
            const isPeak = row.count === peak
            const severity = row.count > peak * 0.8 ? 'Critical' : row.count > peak * 0.5 ? 'High' : 'Medium'
            const sevColor = { Critical: '#FF4D4F', High: '#FF8C00', Medium: '#FFC107' }[severity]
            return (
              <tr
                key={i}
                className={`border-b border-[#1a2128] transition-colors hover:bg-[#182128]/60 ${isPeak ? 'bg-[#1a1820]/60' : ''}`}
              >
                <td className="px-4 py-3 font-mono text-htb-muted">{row.time}</td>
                <td className="px-4 py-3 font-bold" style={{ color }}>
                  {row.count.toLocaleString()}
                  {isPeak && <span className="ml-2 text-[10px] text-htb-muted font-normal">▲ peak</span>}
                </td>
                <td className="px-4 py-3 text-[#39FF6A]">{row.blocked.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                      <div className="h-full rounded-full bg-[#39FF6A]" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="text-htb-muted text-[12px]">{rate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ backgroundColor: `${sevColor}22`, color: sevColor }}
                  >
                    {severity}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── List Tab ──────────────────────────────────────────────────────────────────
function ListTab({ data, color }) {
  const peak = Math.max(...data.map(d => d.count))
  return (
    <div className="flex flex-col gap-3 overflow-auto h-full pr-2 pb-4">
      {data.map((row, i) => {
        const rate = row.count > 0 ? Math.round((row.blocked / row.count) * 100) : 0
        const isPeak = row.count === peak
        const severity = row.count > peak * 0.8 ? 'Critical' : row.count > peak * 0.5 ? 'High' : 'Medium'
        const sevColor = { Critical: '#FF4D4F', High: '#FF8C00', Medium: '#FFC107' }[severity]
        
        return (
          <div 
            key={i} 
            className={`flex items-center justify-between p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04] transition-colors ${isPeak ? 'border-l-4' : ''}`}
            style={isPeak ? { borderLeftColor: color } : {}}
          >
            <div className="flex items-center gap-6">
              <div className="flex flex-col w-20">
                <span className="text-[10px] text-htb-muted uppercase tracking-wider mb-1">Time</span>
                <span className="text-[13px] font-mono text-[#c9d1d9]">{row.time}</span>
              </div>
              <div className="w-px h-8 bg-[#21262d]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-htb-muted uppercase tracking-wider mb-1">Detected</span>
                <span className="text-[15px] font-bold" style={{ color }}>{row.count.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-htb-muted uppercase tracking-wider mb-1">Blocked</span>
                <span className="text-[15px] font-bold text-[#39FF6A]">{row.blocked.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end min-w-[100px]">
                <span className="text-[10px] text-htb-muted uppercase tracking-wider mb-1">Block Rate</span>
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                    <div className="h-full rounded-full bg-[#39FF6A]" style={{ width: `${rate}%` }} />
                  </div>
                  <span className="text-[12px] text-htb-muted w-8 text-right">{rate}%</span>
                </div>
              </div>
              <div className="w-20 flex justify-end">
                <span
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                  style={{ backgroundColor: `${sevColor}15`, color: sevColor, border: `1px solid ${sevColor}30` }}
                >
                  {severity}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function KpiExpandModal({ kpi, timeRange, onClose }) {
  const [activeTab, setActiveTab] = useState('chart')
  const data = Array.isArray(kpi.chart) ? kpi.chart : []
  const cfg = { color: kpi.color || '#39FF6A' }

  const trendIsPositive = kpi.trend?.startsWith('+')
  const trendColor = trendIsPositive ? '#FF4D4F' : '#39FF6A'

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-5xl h-[85vh] rounded-[20px] glass-modal flex flex-col overflow-hidden"
        style={{ boxShadow: `0 0 60px ${cfg.color}22, 0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)` }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06] bg-white/[0.02] flex-shrink-0"
          style={{ borderTop: `3px solid ${cfg.color}` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] font-bold"
              style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}
            >
              {kpi.title[0]}
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-white">{kpi.title}</h2>
              <p className="text-[12px] text-slate-400">{kpi.subtext}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Current value */}
            <div className="text-right">
              <div className="text-[32px] font-bold text-white leading-none">{kpi.value}</div>
              <div className="text-[12px] mt-1 font-semibold" style={{ color: trendColor }}>
                {kpi.trend} {kpi.subtext}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <MdClose size={16} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 px-7 pt-4 pb-0 flex-shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-[13px] font-medium transition-all border-b-2 ${
                  isActive
                    ? 'text-white border-b-2'
                    : 'text-htb-muted hover:text-htb-text border-transparent'
                }`}
                style={isActive ? { borderColor: cfg.color, color: cfg.color } : {}}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
          <div className="flex-1 border-b border-[#21262d]" />
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 min-h-0 p-7 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'chart' && <ChartTab data={data} color={cfg.color} />}
              {activeTab === 'json'  && <JsonTab  kpi={kpi} data={data} />}
              {activeTab === 'table' && <TableTab data={data} color={cfg.color} />}
              {activeTab === 'list'  && <ListTab  data={data} color={cfg.color} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
