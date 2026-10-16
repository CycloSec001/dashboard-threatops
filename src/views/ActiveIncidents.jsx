import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  MdWarningAmber, MdOutlineRemoveRedEye, MdOpenInNew,
  MdArrowUpward, MdOutlineErrorOutline, MdHourglassEmpty
} from 'react-icons/md'
import {
  BiShieldQuarter, BiXCircle, BiCheckCircle,
  BiPlusCircle, BiSearchAlt, BiCheckShield, BiTime
} from 'react-icons/bi'

import { fetchActiveIncidentsData } from '../data/incidentsData'
import PageShell, { ActSection } from '../components/PageShell'
import { KpiBigNumber } from '../components/KpiCards'
import DetailTable from '../components/DetailTable'

const TT = {
  contentStyle: { background: 'rgba(10, 15, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
  itemStyle: { color: '#f3f4f6' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
}

export default function ActiveIncidents({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchActiveIncidentsData(selectedTime)) } 
    catch { setIsError(true) } 
    finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { loadData() }, [loadData])

  const kpis = [
    { id: 'activeIncidents', title: 'Active Incidents', icon: BiShieldQuarter, color: '#3b82f6' },
    { id: 'critical', title: 'Critical', icon: BiXCircle, color: '#ef4444' },
    { id: 'high', title: 'High', icon: MdWarningAmber, color: '#f97316' },
    { id: 'unassigned', title: 'Unassigned', icon: BiSearchAlt, color: '#f59e0b' },
    { id: 'slaAtRisk', title: 'SLA At Risk', icon: MdHourglassEmpty, color: '#ef4444' },
    { id: 'avgResponseTime', title: 'Avg Response Time', icon: BiTime, color: '#10b981' },
  ]

  const cols = [
    { header: 'Incident ID', accessor: 'id' },
    { header: 'Severity', accessor: 'severity', render: v => <span className={`px-1.5 py-0.5 rounded-[4px] text-[9.5px] font-bold uppercase tracking-wider border ${v === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : v === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : v === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{v}</span> },
    { header: 'Title', accessor: 'title' },
    { header: 'Affected Asset', accessor: 'asset' },
    { header: 'Detection Source', accessor: 'source' },
    { header: 'Assignee', accessor: 'assignee' },
    { header: 'Status', accessor: 'status', render: v => <span className={`px-1.5 py-0.5 rounded-[4px] text-[9.5px] font-bold uppercase tracking-wider border ${v === 'New' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : v === 'Investigating' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : v === 'Escalated' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{v}</span> },
    { header: 'Age', accessor: 'age' },
    { header: 'SLA', accessor: 'sla', render: v => <span className={`font-medium ${v === 'Breached' ? 'text-rose-400' : v === 'At Risk' ? 'text-amber-400' : 'text-emerald-400'}`}>{v}</span> },
    { header: 'Last Activity', accessor: 'lastActivity' },
    { header: 'Actions', accessor: 'id', render: () => (
      <div className="flex gap-2 text-slate-400">
        <MdOutlineRemoveRedEye size={13} className="cursor-pointer hover:text-cyan-400 transition-colors" title="View Details" />
        <MdOpenInNew size={12} className="cursor-pointer hover:text-white transition-colors" title="Open in Workspace" />
      </div>
    )}
  ]

  return (
    <PageShell section="Command Center" title="Active Incidents"
      subtitle="Real-time view of all active incidents in your environment."
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      lastUpdated={data?._lastUpdated} onRefresh={loadData}>

      <div className="flex flex-col gap-3.5 w-full">

        <ActSection act="act1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {kpis.map(def => {
              const kpiData = data?.kpis?.[def.id] || {}
              return (
                <KpiBigNumber 
                  key={def.id} title={def.title} icon={def.icon} iconColor={def.color}
                  value={kpiData.value} trend={kpiData.trend}
                />
              )
            })}
          </div>
        </ActSection>

        <ActSection act="act2">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            
            {/* Incident Severity Donut */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-2.5 flex flex-col h-[200px] transition-all duration-200 hover:border-white/[0.12]">
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Incident Severity</h3>
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.incidentSeverity || []} dataKey="value" innerRadius="50%" outerRadius="70%" stroke="none" paddingAngle={2}>
                      {(data?.incidentSeverity || []).map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TT.contentStyle} itemStyle={TT.itemStyle} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2.5 text-[9px]">
                  {(data?.incidentSeverity || []).map(entry => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-slate-300">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Incident Status Donut */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-2.5 flex flex-col h-[200px] transition-all duration-200 hover:border-white/[0.12]">
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Incident Status</h3>
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.incidentStatus || []} dataKey="value" innerRadius="50%" outerRadius="70%" stroke="none" paddingAngle={2}>
                      {(data?.incidentStatus || []).map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TT.contentStyle} itemStyle={TT.itemStyle} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2.5 text-[9px]">
                  {(data?.incidentStatus || []).map(entry => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-slate-300">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Incident Age Bar Chart */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-2.5 flex flex-col h-[200px] transition-all duration-200 hover:border-white/[0.12]">
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Incident Age</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.incidentAge || []} margin={{ left: -25, right: 5, bottom: 0, top: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                    <XAxis dataKey="category" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT.contentStyle} cursor={TT.cursor} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SLA Compliance Donut */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-2.5 flex flex-col h-[200px] transition-all duration-200 hover:border-white/[0.12]">
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">SLA Compliance</h3>
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.slaCompliance || []} dataKey="value" innerRadius="50%" outerRadius="70%" stroke="none" paddingAngle={2}>
                      {(data?.slaCompliance || []).map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TT.contentStyle} itemStyle={TT.itemStyle} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2.5 text-[9px]">
                  {(data?.slaCompliance || []).map(entry => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-slate-300">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </ActSection>

        <ActSection act="act4">
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-2 [&_th]:py-2.5 [&_td]:px-3 [&_th]:px-3 text-[10.5px] transition-all duration-200 hover:border-white/[0.12]">
            <DetailTable 
              title="Incident Queue" 
              columns={cols} 
              data={data?.incidentsTable || []} 
            />
          </div>
        </ActSection>

      </div>
    </PageShell>
  )
}