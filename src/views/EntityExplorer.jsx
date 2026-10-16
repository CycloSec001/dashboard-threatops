import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer
} from 'recharts'
import PageShell from '../components/PageShell'
import DetailTable from '../components/DetailTable'
import OverviewMetricCard from '../components/OverviewMetricCard'
import { KpiBigNumber } from '../components/KpiCards'
import { MdSearch, MdFilterList, MdOutlineRemoveRedEye, MdOpenInNew, MdCalendarToday } from 'react-icons/md'
import { BiTargetLock, BiNetworkChart, BiGhost, BiBug, BiShieldQuarter } from 'react-icons/bi'

const TT = { backgroundColor: 'rgba(10, 15, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f3f4f6', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }

async function fetchData(tf, entity) {
  return { kpis: {}, entities: [], riskTrend: [], unsupported: 'Entity explorer aggregation is not exposed by the backend API.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, Math.random() * 500 + 300))
  
  if (!entity) return {}

  const labels = ['00:00','04:00','08:00','12:00','16:00','20:00','23:59']
  const j = (b, r = 0.3) => Math.max(0, Math.round(b * (1 - r + Math.random() * r * 2)))

  const kpis = {
    entityRisk: { value: 78, label: 'Risk Score (0-100)' },
    relatedIncidents: { value: 12, trend: { value: '', label: 'Linked incidents' } },
    relatedEvents: { value: '1,248', trend: { value: '', label: 'Linked events' } },
    threatMatches: { value: 37, trend: { value: '', label: 'Threat-intelligence matches' } },
    behavioralDeviations: { value: 9, trend: { value: '', label: 'Behaviour anomalies' } },
    firstSeen: { value: 'May 23, 2025 14:32:10', label: 'First observation' },
    lastSeen: { value: 'May 28, 2025 22:47:18', label: 'Latest observation' }
  }

  const riskTrend = labels.map((t, i) => ({ t, score: 30 + Math.random() * 60 }))

  const summary = {
    entityValue: entity || '192.168.56.10',
    entityType: 'IP Address',
    category: 'Internal IP',
    asset: 'FileServer-01',
    owner: 'Infrastructure Team',
    location: 'Data Center 1',
    os: 'Windows Server 2019',
    firstSeen: 'May 23, 2025 14:32:10',
    lastSeen: 'May 26, 2025 22:47:18',
    tags: ['Critical', 'File Server', 'Prod'],
    source: 'EDR, Firewall, DNS, Proxy',
    riskFactors: ['Malware Contact', 'Brute Force', 'Lateral Movement']
  }

  const timeline = [
    { id: '1', title: 'Suspicious PowerShell Execution', severity: 'High', time: 'May 26, 2025 22:40:11', detail: 'Process: powershell.exe' },
    { id: '2', title: 'Outbound Connection to Malicious IP', severity: 'Medium', time: 'May 26, 2025 22:32:44', detail: 'IP: 185.220.101.1' },
    { id: '3', title: 'Multiple Failed Login Attempts', severity: 'Medium', time: 'May 26, 2025 22:15:02', detail: 'Protocol: SMB' },
    { id: '4', title: 'New Service Installed', severity: 'Low', time: 'May 26, 2025 21:45:17', detail: 'Service: BackupAgent' }
  ]

  const relatedIncidents = [
    { id: 'INC-2025-00521', title: 'Brute Force Attack Detected', severity: 'High', status: 'Investigating', linkedAt: 'May 26, 2025 22:10' },
    { id: 'INC-2025-00488', title: 'Lateral Movement Attempt', severity: 'High', status: 'Open', linkedAt: 'May 26, 2025 19:32' },
    { id: 'INC-2025-00412', title: 'Malware Communication', severity: 'Medium', status: 'Contained', linkedAt: 'May 25, 2025 16:45' },
    { id: 'INC-2025-00390', title: 'Suspicious Service Installation', severity: 'Medium', status: 'Resolved', linkedAt: 'May 24, 2025 11:20' },
    { id: 'INC-2025-00321', title: 'Unusual SMB Activity', severity: 'Low', status: 'Closed', linkedAt: 'May 23, 2025 15:02' }
  ]

  const threatMatches = [
    { name: 'Cobalt Strike', type: 'Malware', confidence: 'High', source: 'AlienVault OTX', severity: 'High' },
    { name: 'Emotet', type: 'Malware', confidence: 'High', source: 'VirusTotal', severity: 'High' },
    { name: 'Mimikatz', type: 'Tool', confidence: 'Medium', source: 'MITRE ATT&CK', severity: 'Medium' },
    { name: 'PowerShell Empire', type: 'Tool', confidence: 'Medium', source: 'AlienVault OTX', severity: 'Medium' },
    { name: 'RDP Brute Force', type: 'Attack Pattern', confidence: 'Medium', source: 'MITRE ATT&CK', severity: 'Medium' }
  ]

  const relatedEvents = [
    { time: 'May 26, 2025 22:40:11', type: 'Process Execution', source: 'EDR', severity: 'High' },
    { time: 'May 26, 2025 22:32:44', type: 'Network Connection', source: 'Firewall', severity: 'Medium' },
    { time: 'May 26, 2025 22:15:02', type: 'Authentication Failure', source: 'Domain Controller', severity: 'Medium' },
    { time: 'May 26, 2025 21:45:17', type: 'Service Installation', source: 'EDR', severity: 'Low' },
    { time: 'May 25, 2025 21:30:05', type: 'File Modification', source: 'EDR', severity: 'Low' }
  ]

  return {
    kpis, riskTrend, summary, timeline, relatedIncidents, threatMatches, relatedEvents,
    _lastUpdated: new Date().toISOString()
  }
}

export default function EntityExplorer({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [entityType, setEntityType] = useState('IP Address')
  const [entityValue, setEntityValue] = useState('192.168.56.10')

  const load = useCallback(async (entity) => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchData(selectedTime, entity)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { load(entityValue) }, [load])

  const severityRender = v => {
    const cls = v === 'High' || v === 'Critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : v === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    return <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${cls}`}>{v}</span>
  }

  const incCols = [
    { header: 'ID', accessor: 'id', render: v => <span className="text-cyan-400 font-mono text-[10px]">{v}</span> },
    { header: 'Title', accessor: 'title', render: v => <span className="text-white font-medium">{v}</span> },
    { header: 'Severity', accessor: 'severity', render: severityRender },
    { header: 'Status', accessor: 'status', render: v => <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${v === 'Investigating' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'}`}>{v}</span> },
    { header: 'Linked At', accessor: 'linkedAt', render: v => <span className="text-slate-400 font-mono text-[10px]">{v}</span> },
    { header: 'Actions', accessor: 'id', render: () => <div className="flex gap-2 text-slate-400"><MdOutlineRemoveRedEye size={13} className="cursor-pointer hover:text-cyan-400" /></div> }
  ]

  const threatCols = [
    { header: 'Threat Name', accessor: 'name', render: v => <span className="text-white font-medium">{v}</span> },
    { header: 'Type', accessor: 'type', render: v => <span className="text-slate-300">{v}</span> },
    { header: 'Confidence', accessor: 'confidence', render: severityRender },
    { header: 'Source', accessor: 'source', render: v => <span className="text-slate-400">{v}</span> },
    { header: 'Actions', accessor: 'name', render: () => <div className="flex gap-2 text-slate-400"><MdOutlineRemoveRedEye size={13} className="cursor-pointer hover:text-cyan-400" /></div> }
  ]

  const evtCols = [
    { header: 'Time', accessor: 'time', render: v => <span className="text-slate-400 font-mono text-[10px]">{v}</span> },
    { header: 'Event Type', accessor: 'type', render: v => <span className="text-white">{v}</span> },
    { header: 'Source', accessor: 'source', render: v => <span className="text-slate-300">{v}</span> },
    { header: 'Severity', accessor: 'severity', render: severityRender },
    { header: 'Actions', accessor: 'time', render: () => <div className="flex gap-2 text-slate-400"><MdOutlineRemoveRedEye size={13} className="cursor-pointer hover:text-cyan-400" /></div> }
  ]

  const isEmpty = !isLoading && (!data || !data.kpis)

  const TimestampCard = ({ title, value, label }) => (
    <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-2.5 flex flex-col justify-between h-[66px] overflow-y-auto custom-scrollbar transition-all duration-200 hover:border-white/[0.12]">
      <div className="flex justify-between items-center">
        <span className="text-[9.5px] font-semibold text-slate-300 uppercase tracking-wider">{title}</span>
        <MdCalendarToday size={11} className="text-cyan-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-white font-mono truncate">{value}</span>
        {label && <span className="text-[8.5px] text-slate-400">{label}</span>}
      </div>
    </div>
  )

  return (
    <PageShell section="Detect & Investigate" title="Entity Explorer"
      subtitle="Explore entities, understand risks, view related activity and investigate threats."
      selectedTime={selectedTime} isLoading={false} isError={false}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={() => load(entityValue)}>

      {/* TOP FILTER / SEARCH AREA */}
      <div className="flex flex-col gap-2.5 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] p-3 rounded-[10px] mb-3 transition-all duration-200 hover:border-white/[0.12]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] text-slate-400 uppercase tracking-wider pl-1 font-medium">Entity Type</span>
            <select className="bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-200 rounded-[6px] px-2.5 py-1.5 outline-none cursor-pointer focus:border-cyan-500/40" value={entityType} onChange={e => setEntityType(e.target.value)}>
              <option className="bg-[#0a0f19]">IP Address</option><option className="bg-[#0a0f19]">Host</option><option className="bg-[#0a0f19]">User</option><option className="bg-[#0a0f19]">Domain</option><option className="bg-[#0a0f19]">Hash</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 lg:col-span-2">
            <span className="text-[9.5px] text-slate-400 uppercase tracking-wider pl-1 font-medium">Entity Value</span>
            <div className="flex gap-2">
              <input value={entityValue} onChange={e => setEntityValue(e.target.value)} className="flex-1 bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-200 font-mono px-3 py-1.5 rounded-[6px] outline-none focus:border-cyan-500/40" placeholder="e.g. 192.168.1.1" />
              <button onClick={() => load(entityValue)} className="text-[10.5px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3.5 py-1.5 rounded-[6px] hover:bg-cyan-500/20 transition-all">Search</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] text-slate-400 uppercase tracking-wider pl-1 font-medium">Source</span>
            <select className="bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-200 rounded-[6px] px-2.5 py-1.5 outline-none cursor-pointer focus:border-cyan-500/40"><option className="bg-[#0a0f19]">All Sources</option></select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] text-slate-400 uppercase tracking-wider pl-1 font-medium">Risk Level</span>
            <select className="bg-black/10 border border-white/[0.05] text-[10.5px] text-slate-200 rounded-[6px] px-2.5 py-1.5 outline-none cursor-pointer focus:border-cyan-500/40"><option className="bg-[#0a0f19]">All</option><option className="bg-[#0a0f19]">High</option><option className="bg-[#0a0f19]">Medium</option><option className="bg-[#0a0f19]">Low</option></select>
          </div>
        </div>
      </div>

      {isLoading && <div className="h-[150px] flex items-center justify-center text-slate-400 text-[11px]">Loading entity data...</div>}
      {isError && <div className="h-[150px] flex items-center justify-center text-rose-400 text-[11px]">Failed to load entity data.</div>}
      {isEmpty && !isLoading && !isError && <div className="h-[150px] flex flex-col items-center justify-center text-slate-400 text-[11px] bg-black/5 border border-white/[0.05] rounded-[10px]"><BiTargetLock size={28} className="mb-1.5 text-slate-500"/><span>No data found. Please search for an entity.</span></div>}

      {!isLoading && !isError && !isEmpty && data && (
        <>
          {/* MAIN KPI AREA - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-3 [&>div]:h-[66px] [&>div]:overflow-y-auto custom-scrollbar">
            <OverviewMetricCard title="Entity Risk" value={data?.kpis?.entityRisk?.value ?? 0} label="Risk Score" type="gauge" color="#ef4444" thresholds={[{ value: 70, color: '#ef4444' }]} />
            <OverviewMetricCard title="Related Incidents" value={data?.kpis?.relatedIncidents?.value ?? 0} label="Linked" type="mini-bar" color="#3b82f6" sparklineData={[4, 6, 8, 10, 12]} />
            <OverviewMetricCard title="Related Events" value={data?.kpis?.relatedEvents?.value ?? 0} label="Linked" type="mini-area" color="#8b5cf6" sparklineData={[800, 950, 1100, 1200, 1248]} />
            <OverviewMetricCard title="Threat Matches" value={data?.kpis?.threatMatches?.value ?? 0} label="Matches" type="mini-bar" color="#ef4444" sparklineData={[20, 25, 30, 35, 37]} />
            <OverviewMetricCard title="Behavioral Deviations" value={data?.kpis?.behavioralDeviations?.value ?? 0} label="Anomalies" type="mini-line" color="#f59e0b" sparklineData={[3, 5, 6, 8, 9]} />
            <TimestampCard title="First Seen" value={data?.kpis?.firstSeen?.value ?? 'Not provided'} label={data?.kpis?.firstSeen?.label} />
            <TimestampCard title="Last Seen" value={data?.kpis?.lastSeen?.value ?? 'Not provided'} label={data?.kpis?.lastSeen?.label} />
          </div>

          {/* Row 3 - Compact panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3 items-stretch">
            {/* ENTITY SUMMARY SECTION (2-column layout) */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3.5 flex flex-col transition-all duration-200 hover:border-white/[0.12]">
              <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2.5">Entity Summary</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                {Object.entries(data.summary || {}).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-slate-400 capitalize text-[9px]">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-slate-200 truncate font-medium">
                      {Array.isArray(v) ? (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {v.map((tag, i) => <span key={i} className={`px-1.5 py-0.5 rounded-[3px] text-[8.5px] font-bold uppercase tracking-wider ${tag === 'Critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-slate-300 bg-black/10 border-white/[0.05]'}`}>{tag}</span>)}
                        </div>
                      ) : (
                        k === 'asset' || k === 'owner' ? <span className="text-cyan-400 cursor-pointer hover:underline" onClick={() => setActive('assets')}>{v}</span> : v
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RISK SCORE OVER TIME */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3.5 flex flex-col transition-all duration-200 hover:border-white/[0.12]">
              <div className="flex justify-between items-center mb-1">
                 <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Risk Score Over Time</p>
                 <select className="bg-black/10 border border-white/[0.05] text-slate-300 text-[10px] rounded-[6px] px-2 py-0.5 outline-none"><option className="bg-[#0a0f19]">All Sources</option></select>
              </div>
              <div className="flex-1 w-full h-[125px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.riskTrend || []} margin={{ left: -25, right: 4, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                    <XAxis dataKey="t" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RTooltip contentStyle={TT} />
                    <Area type="monotone" dataKey="score" stroke="#ef4444" fill="url(#gRisk)" strokeWidth={2} name="Risk Score" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RECENT ACTIVITY TIMELINE */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3.5 flex flex-col justify-between transition-all duration-200 hover:border-white/[0.12]">
              <div className="flex justify-between items-center mb-1">
                 <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Recent Activity Timeline</p>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar pr-1 relative max-h-[125px]">
                <div className="absolute left-2.5 top-1 bottom-1 w-px bg-white/[0.06] z-0" />
                <div className="flex flex-col gap-3 relative z-10">
                  {(data?.timeline || []).map((item, i) => (
                    <div key={i} className="flex gap-2.5 items-start text-[10px]">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border border-black mt-0.5 ${item.severity === 'High' ? 'bg-rose-500' : item.severity === 'Medium' ? 'bg-amber-500' : 'bg-cyan-500'}`}>
                          <MdOutlineRemoveRedEye size={9} className="text-white cursor-pointer" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                           <span className="font-medium text-white leading-tight">{item.title}</span>
                           <span className={`px-1.5 py-0.5 rounded-[4px] border text-[8.5px] font-bold uppercase tracking-wider ${item.severity === 'High' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : item.severity === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'}`}>{item.severity}</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 mt-0.5">{item.detail}</span>
                        <span className="text-[8.5px] text-slate-500 font-mono mt-0.5">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-white/[0.05] text-right">
                <span className="text-[10px] text-cyan-400 hover:underline cursor-pointer font-medium" onClick={() => setActive('event_explorer')}>View full timeline</span>
              </div>
            </div>
          </div>

          {/* Row 4 - Tables with flush margin and zero bottom spacing loss */}
          <div className="grid grid-cols-1 gap-3 mb-3 [&_.mb-4]:mb-0 [&_.pb-4]:pb-2 [&_.pt-4]:pt-2 [&_.p-4]:p-2.5">
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden flex flex-col [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-1.5 [&_th]:py-2 [&_td]:px-3 [&_th]:px-3 text-[10px] transition-all duration-200 hover:border-white/[0.12]">
              <DetailTable title="Recent Related Incidents" description="" columns={incCols} data={data?.relatedIncidents || []} searchable={false} />
            </div>
            
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden flex flex-col [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-1.5 [&_th]:py-2 [&_td]:px-3 [&_th]:px-3 text-[10px] transition-all duration-200 hover:border-white/[0.12]">
              <DetailTable title="Top Threat Matches" description="" columns={threatCols} data={data?.threatMatches || []} searchable={false} />
            </div>

            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden flex flex-col [&_table]:w-full [&_th]:bg-black/10 [&_th]:border-b [&_th]:border-white/[0.05] [&_td]:border-b [&_td]:border-white/[0.03] [&_tr:hover]:bg-white/[0.02] [&_td]:py-1.5 [&_th]:py-2 [&_td]:px-3 [&_th]:px-3 text-[10px] transition-all duration-200 hover:border-white/[0.12]">
              <DetailTable title="Recent Related Events" description="" columns={evtCols} data={data?.relatedEvents || []} searchable={false} />
            </div>
          </div>
        </>
      )}
    </PageShell>
  )
}