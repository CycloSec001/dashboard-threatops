import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer
} from 'recharts'
import { MdOutlineRemoveRedEye, MdOpenInNew, MdSearch, MdCreate, MdInsertChartOutlined } from 'react-icons/md'
import { BiTimeFive, BiError, BiShieldQuarter, BiCog, BiGhost, BiBarChartAlt2, BiTerminal, BiBookContent, BiCheckShield } from 'react-icons/bi'
import { FiActivity, FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle, FiRefreshCw } from 'react-icons/fi'

import PageShell, { ActSection } from '../components/PageShell'
import { KpiBigNumber, KpiGauge, KpiSparkline } from '../components/KpiCards'

const TT = { backgroundColor: 'rgba(10, 15, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f3f4f6', fontSize: '11px', padding: '6px 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }

const StatusBadge = ({ val }) => {
  const c = {
    Success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Failed:  'text-rose-400 bg-rose-500/10 border-rose-500/20',
    Partial: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }
  return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${c[val] || 'text-slate-400 bg-black/10 border-white/[0.05]'}`}>{val}</span>
}

const Card = ({ children, className = '', title, action }) => (
  <div className={`bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3.5 flex flex-col transition-all duration-200 hover:border-white/[0.12] ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-2.5">
        {title && <h3 className="text-[11px] font-semibold text-white uppercase tracking-wider">{title}</h3>}
        {action && <div className="text-[10px] text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors font-medium">{action}</div>}
      </div>
    )}
    <div className="flex-1 flex flex-col">{children}</div>
  </div>
)

const execData = [
  { t: '00:00', success: 60, partial: 10, failed: 5 },
  { t: '04:00', success: 80, partial: 15, failed: 8 },
  { t: '08:00', success: 110, partial: 20, failed: 12 },
  { t: '12:00', success: 160, partial: 30, failed: 15 },
  { t: '16:00', success: 120, partial: 25, failed: 10 },
  { t: '20:00', success: 90, partial: 12, failed: 6 },
  { t: '24:00', success: 65, partial: 8, failed: 4 }
]

const timeTrend = [
  { d: 'May 09', val: 18 }, { d: 'May 10', val: 20 }, { d: 'May 11', val: 22 },
  { d: 'May 12', val: 17 }, { d: 'May 13', val: 16 }, { d: 'May 14', val: 15 }, { d: 'May 15', val: 14.5 }
]

const playbooks = [
  { name: 'Malware Containment', execs: 356, rate: 94, last: 'May 15, 2025 22:45' },
  { name: 'Phishing Response', execs: 278, rate: 92, last: 'May 15, 2025 22:30' },
  { name: 'Ransomware Isolation', execs: 192, rate: 90, last: 'May 15, 2025 21:58' },
  { name: 'User Account Compromise', execs: 156, rate: 88, last: 'May 15, 2025 21:32' },
  { name: 'Data Exfiltration Response', execs: 98, rate: 85, last: 'May 15, 2025 20:17' }
]

const statusData = [
  { name: 'Successful', value: 1482, color: '#10B981' },
  { name: 'Failed',     value: 82,   color: '#EF4444' },
  { name: 'Partial',    value: 58,   color: '#F97316' }
]

const recentActivity = [
  { playbook: 'Malware Containment', status: 'Success', asset: 'WS-1042', duration: '12m 45s', time: 'May 15, 2025 22:45' },
  { playbook: 'Phishing Response', status: 'Success', asset: 'MAIL-23', duration: '8m 22s', time: 'May 15, 2025 22:30' },
  { playbook: 'Ransomware Isolation', status: 'Failed', asset: 'SRV-09', duration: '15m 10s', time: 'May 15, 2025 22:18' },
  { playbook: 'User Account Compromise', status: 'Success', asset: 'AD-01', duration: '9m 41s', time: 'May 15, 2025 21:58' },
  { playbook: 'Data Exfiltration Response', status: 'Partial', asset: 'DB-07', duration: '18m 30s', time: 'May 15, 2025 21:32' },
]

export default function ResponseReadiness({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      setData({ _lastUpdated: new Date().toISOString() })
      setIsLoading(false)
    }, 600)
  }, [selectedTime])

  return (
    <PageShell section="Command Center" title="Response Readiness"
      subtitle="Monitor your organization's automated response readiness and effectiveness."
      selectedTime={selectedTime} isLoading={false} isError={false}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={() => {}}>
      
      <div className="flex flex-col gap-3.5">
        
        {/* KPIs Row 1 */}
        <div className="grid grid-cols-5 gap-3">
          <KpiGauge title="Automation Readiness" value={82} label="Ready" iconColor="#10b981" colorMode="success" action="View details →" />
          <KpiGauge title="Automation Coverage" value={76} label="Good" iconColor="#10b981" colorMode="success" action="View details →" />
          <KpiBigNumber title="Approved Playbooks" value="128" icon={BiBookContent} iconColor="#a855f7" trend={{ value: '14%', direction: 'up', color: 'green' }} action="View playbooks →" />
          <KpiBigNumber title="Pending Approvals" value="23" icon={BiTimeFive} iconColor="#eab308" trend={{ value: '9%', direction: 'up', color: 'orange' }} action="View pending →" />
          <KpiGauge title="Response Success Rate" value={91} label="Successful" iconColor="#10b981" colorMode="success" action="View details →" />
        </div>

        {/* KPIs Row 2 */}
        <div className="grid grid-cols-5 gap-3">
          <KpiGauge title="Response Failure Rate" value={6} label="Low" iconColor="#ef4444" colorMode="risk" action="View details →" />
          <KpiGauge title="Rollback Success Rate" value={88} label="Successful" iconColor="#10b981" colorMode="success" action="View details →" />
          <KpiBigNumber title="Protected Assets" value="2,451" icon={BiCheckShield} iconColor="#3b82f6" trend={{ value: '12%', direction: 'up', color: 'green' }} action="View assets →" />
          <KpiBigNumber title="Unsafe Actions Blocked" value="312" icon={BiError} iconColor="#ef4444" trend={{ value: '8%', direction: 'up', color: 'green' }} action="View actions →" />
          <KpiBigNumber title="Average Response Time" value="14m 32s" icon={FiClock} iconColor="#8b5cf6" trend={{ value: '7%', direction: 'down', color: 'green' }} action="View trends →" />
        </div>

        {/* Second Row: Executions Over Time, Response Time Trend, & Executions by Status (3rd position) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_240px] gap-3">
          <Card title="Response Executions Over Time" action={<span className="bg-black/10 border border-white/[0.05] px-2 py-0.5 rounded text-white flex items-center gap-1">Last 24 Hours <span className="text-[9px]">▾</span></span>}>
            <div className="flex items-center gap-2 mb-1 pl-1">
              <span className="text-[9.5px] text-slate-300 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Success</span>
              <span className="text-[9.5px] text-slate-300 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /> Failed</span>
              <span className="text-[9.5px] text-slate-300 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" /> Partial</span>
            </div>
            <div style={{ height: 165 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={execData} margin={{ left: -25, bottom: 0, top: 5 }}>
                  <defs>
                    <linearGradient id="gSuc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gPrt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                  <XAxis dataKey="t" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={TT} />
                  <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" strokeWidth={2} fill="url(#gSuc)" />
                  <Area type="monotone" dataKey="partial" stackId="1" stroke="#f97316" strokeWidth={2} fill="url(#gPrt)" />
                  <Area type="monotone" dataKey="failed" stackId="1" stroke="#ef4444" strokeWidth={2} fill="url(#gFail)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Response Time Trend" action={<span className="bg-black/10 border border-white/[0.05] px-2 py-0.5 rounded text-white flex items-center gap-1">Last 7 Days <span className="text-[9px]">▾</span></span>}>
            <div style={{ height: 165 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeTrend} margin={{ left: -25, bottom: 0, top: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                  <XAxis dataKey="d" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `${v}m`} />
                  <RTooltip contentStyle={TT} />
                  <Line type="monotone" dataKey="val" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 3, strokeWidth: 2, stroke: '#0a0f19' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Executions by Status" action={<span className="text-[10px] text-slate-400">Total: 1,622</span>}>
            <div className="flex flex-col items-center justify-between h-[165px] pt-1">
              <div className="w-[110px] h-[75px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Pie data={statusData} innerRadius={26} outerRadius={38} paddingAngle={2} dataKey="value" stroke="none">
                      {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <RTooltip contentStyle={TT} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span className="text-[12px] font-bold text-white leading-none">1,622</span>
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 pb-1">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-[9.5px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-300 truncate">{d.name}</span>
                    </div>
                    <div className="flex gap-1 font-mono">
                      <span className="font-semibold text-white">{d.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Third Section: Top Playbooks by Usage & Recent Response Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Top Playbooks by Usage" action="View all playbooks →" className="p-0 overflow-hidden">
            <div className="overflow-x-auto p-1">
              <table className="w-full text-[10.5px]">
                <thead className="bg-black/10">
                  <tr className="border-b border-white/[0.05]">
                    {['PLAYBOOK', 'EXECUTIONS', 'SUCCESS RATE', 'LAST EXECUTED'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {playbooks.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-2.5 text-slate-200 font-medium">{row.name}</td>
                      <td className="px-3 py-2.5 text-white font-mono">{row.execs}</td>
                      <td className="px-3 py-2.5 text-emerald-400 font-mono">{row.rate}%</td>
                      <td className="px-3 py-2.5 text-slate-400 font-mono text-[10px]">{row.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Recent Response Activity" action="View all activity →" className="p-0 overflow-hidden">
            <div className="overflow-x-auto p-1">
              <table className="w-full text-[10.5px]">
                <thead className="bg-black/10">
                  <tr className="border-b border-white/[0.05]">
                    {['PLAYBOOK', 'STATUS', 'ASSET', 'DURATION', 'TIME'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {recentActivity.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-2.5 text-slate-200 font-medium">{row.playbook}</td>
                      <td className="px-3 py-2.5"><StatusBadge val={row.status} /></td>
                      <td className="px-3 py-2.5 text-slate-300 font-mono text-[10px]">{row.asset}</td>
                      <td className="px-3 py-2.5 text-slate-200 font-mono text-[10px]">{row.duration}</td>
                      <td className="px-3 py-2.5 text-slate-400 font-mono text-[10px]">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* State Indicators Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-1">
          <Card className="items-center justify-center opacity-80 text-center flex-row gap-3 border-emerald-500/20 py-2.5">
            <FiCheckCircle size={20} className="text-emerald-400" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-white block">Data is up to date</span>
              <span className="text-[9.5px] text-slate-400">2 mins ago</span>
            </div>
          </Card>
          <Card className="items-center justify-center opacity-70 flex-row gap-3 py-2.5">
            <div className="w-4 h-4 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin"></div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-white block">Loading State</span>
              <span className="text-[9.5px] text-slate-400">Loading data...</span>
            </div>
          </Card>
          <Card className="items-center justify-center opacity-70 text-center py-2.5">
            <FiAlertCircle size={18} className="text-slate-400 mb-0.5" />
            <span className="text-[10.5px] font-bold text-white">No data found</span>
            <span className="text-[9px] text-slate-400">Try adjusting filters.</span>
          </Card>
          <Card className="items-center justify-center opacity-70 text-center py-2.5">
            <FiXCircle size={18} className="text-rose-400 mb-0.5" />
            <span className="text-[10.5px] font-bold text-white">Failed to load</span>
            <button className="mt-1 px-2.5 py-0.5 bg-black/10 hover:bg-white/[0.08] border border-white/[0.08] rounded text-[9px] text-slate-200 transition-colors">↻ Retry</button>
          </Card>
          <Card className="items-center justify-center opacity-70 text-center py-2.5">
            <FiAlertTriangle size={18} className="text-amber-400 mb-0.5" />
            <span className="text-[10.5px] font-bold text-white">Partial data</span>
            <span className="text-[9px] text-cyan-400 cursor-pointer hover:underline">View details</span>
          </Card>
          <Card className="items-center justify-center opacity-70 text-center py-2.5">
            <FiClock size={18} className="text-cyan-400 mb-0.5" />
            <span className="text-[10.5px] font-bold text-white">15 mins old</span>
            <button className="mt-1 px-2.5 py-0.5 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40 border border-cyan-800/40 rounded text-[9px] transition-colors">↻ Refresh</button>
          </Card>
        </div>

      </div>
    </PageShell>
  )
}