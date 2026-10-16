import { useState, useEffect, useCallback } from 'react'
import PageShell from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import {
  MdSearch, MdArrowForwardIos, MdTrackChanges, MdAccessTime,
  MdFlashOn, MdPeopleOutline, MdHub, MdOutlineBugReport,
  MdOutlineSecurity, MdCallSplit, MdAccountTree, MdPersonOutline,
  MdCheckCircleOutline, MdVerifiedUser, MdKeyboardArrowDown,
  MdComputer, MdLocationOn, MdInsertDriveFile, MdOutlineLink,
  MdTerminal, MdOutlineKeyboardArrowRight, MdOutlineKeyboardArrowLeft,
  MdOutlineShield, MdOutlineVpnKey, MdOutlineCloudQueue, MdOutlineWarningAmber,
  MdOutlineGpsFixed, MdOutlineMotionPhotosOn, MdFilterAlt
} from 'react-icons/md'
import { FiActivity, FiFilter, FiLink } from 'react-icons/fi'
import { HiOutlineEye, HiOutlineExternalLink } from 'react-icons/hi'

import { fetchAttackChainsData } from '../api/attackChainsApi'
import { attackChainsKpis } from '../data/threatOpsAttackChainsKpis'

const FilterDropdown = ({ label, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] text-slate-400 uppercase tracking-wider pl-1 font-medium">{label}</label>
    <div className="relative">
      <select className="bg-black/15 border border-white/[0.08] text-[11px] text-slate-200 rounded-[6px] px-2.5 py-1.5 outline-none appearance-none pr-7 w-full min-w-[110px] focus:border-cyan-500/50 transition-colors cursor-pointer">
        {options.map(o => <option key={o} value={o} className="bg-[#0a0f19] text-white">{o}</option>)}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▾</div>
    </div>
  </div>
)

const Badge = ({ children, colorClass }) => (
  <span className={`px-2.5 py-0.5 rounded-[6px] border text-[9.5px] font-bold uppercase tracking-wider ${colorClass}`}>{children}</span>
)

const TacticIcon = ({ color }) => {
  const colorMap = {
    blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', orange: '#f97316', purple: '#a855f7', gray: '#64748b'
  }
  const hex = colorMap[color] || '#64748b'
  return (
    <div className="w-5 h-5 rounded-full border flex items-center justify-center bg-black/20" style={{ borderColor: `${hex}80` }}>
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hex }}></div>
    </div>
  )
}

const ChainNode = ({ node, isLast }) => {
  const IconMap = {
    FiLink, MdTerminal, MdOutlineKeyboardArrowRight, MdAccountTree, MdOutlineShield, MdOutlineVpnKey, MdOutlineSecurity, MdOutlineCloudQueue, MdOutlineWarningAmber
  }
  const Icon = IconMap[node.icon] || MdTrackChanges;
  
  const colorMap = {
    blue: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    green: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
    yellow: { bg: 'rgba(234,179,8,0.12)', text: '#facc15', border: 'rgba(234,179,8,0.3)' },
    orange: { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' },
    purple: { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
    gray: { bg: 'rgba(75,85,99,0.12)', text: '#9ca3af', border: 'rgba(75,85,99,0.3)' }
  }
  const c = colorMap[node.color] || colorMap.gray;
  
  const isProgress = node.status === 'in-progress';
  const isPending = node.status === 'pending';

  return (
    <div className="flex items-center shrink-0">
      <div className={`w-[145px] rounded-[10px] border flex flex-col pt-4 pb-3 px-3 relative transition-all duration-300
        ${isProgress ? 'border-purple-500/60 bg-black/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : isPending ? 'border-white/[0.05] bg-black/10 opacity-70' : 'border-white/[0.08] bg-black/20 hover:border-white/[0.2]'}`}>
        
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex justify-center items-center mx-auto mb-3 border shadow-sm" style={{ backgroundColor: c.bg, borderColor: c.border }}>
          <Icon className="text-[20px]" style={{ color: c.text }} />
        </div>

        {/* Tactic & Technique */}
        <div className="text-center mb-3">
          <p className="text-[11.5px] font-bold text-white leading-tight mb-1">{node.tactic}</p>
          <p className="text-[9.5px] font-bold font-mono" style={{ color: c.text }}>{node.tacticId}</p>
        </div>
        
        <div className="text-center mb-3 min-h-[32px] flex flex-col justify-center">
          <p className="text-[10.5px] text-slate-300 leading-tight mb-0.5">{node.technique}</p>
          <p className="text-[9px] text-slate-400 font-mono">{node.techId}</p>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-1 mb-2 text-[10.5px]">
          <div className="flex justify-between items-center"><span className="text-slate-400">Events</span><span className="text-slate-200 font-medium">{node.events}</span></div>
          <div className="flex justify-between items-center"><span className="text-slate-400">Risk</span><span className={`font-semibold ${node.risk === 'High' ? 'text-amber-400' : node.risk === 'Medium' ? 'text-yellow-400' : 'text-slate-200'}`}>{node.risk}</span></div>
          <div className="flex justify-between items-center"><span className="text-slate-400">Time</span><span className="text-slate-200">{node.time}</span></div>
        </div>

        {/* Status */}
        <div className="mt-auto pt-2 border-t border-white/[0.06] flex justify-center items-center gap-1.5 h-6">
          {node.status === 'completed' && <><MdCheckCircleOutline className="text-emerald-400" size={13} /><span className="text-[10px] text-emerald-400 font-semibold">Completed</span></>}
          {node.status === 'in-progress' && <><MdOutlineMotionPhotosOn className="text-purple-400" size={13} /><span className="text-[10px] text-purple-400 font-semibold">In Progress</span></>}
          {node.status === 'pending' && <span className="text-[10px] text-slate-400 font-medium">{'{'}Pending{'}'}</span>}
        </div>
      </div>

      {!isLast && (
        <div className="flex items-center px-2 shrink-0">
           <div className={`w-5 h-px border-t border-dashed ${isPending ? 'border-white/10' : 'border-slate-500'}`}></div>
           <MdOutlineKeyboardArrowRight size={16} className={isPending ? 'text-slate-600' : 'text-slate-400'} />
        </div>
      )}
    </div>
  )
}

export default function AttackChains({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  
  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchAttackChainsData(selectedTime)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])
  useEffect(() => { load() }, [load])

  const sortedKpis = data?.kpis ? [...attackChainsKpis].sort((a, b) => {
    if (a.visualization === 'gauge') return 1;
    if (b.visualization === 'gauge') return -1;
    return 0;
  }) : attackChainsKpis;

  return (
    <PageShell section="Command Center" title="Attack Chains"
      subtitle="Visualize and analyze multi-stage attack chains and their impact."
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>

      <div className="flex flex-col gap-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {sortedKpis.map(config => {
            const kpiData = data?.kpis?.[config.key]
            return (
              <OverviewMetricCard
                key={config.key}
                title={config.title}
                value={kpiData?.value}
                trend={kpiData?.trend}
                label={kpiData?.label}
                subtext={kpiData?.subtext}
                sparklineData={kpiData?.sparkline}
                type={config.visualization}
                color={config.color}
                thresholds={config.thresholds}
              />
            )
          })}
        </div>

        {/* Filters (Height & Padding Optimized) */}
        <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] px-3 py-2 flex flex-wrap items-center gap-2 transition-all duration-200 hover:border-white/[0.12]">
          <div className="flex flex-col gap-0.5 flex-1 min-w-[180px]">
            <label className="text-[9px] text-slate-400 uppercase tracking-wider pl-1 font-medium">Search</label>
            <div className="relative">
              <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search attack chains..." className="w-full bg-black/15 border border-white/[0.08] text-[11px] text-slate-200 rounded-[6px] pl-8 pr-3 py-1.5 outline-none focus:border-cyan-500/50 transition-colors" />
            </div>
          </div>
          <FilterDropdown label="Severity" options={['All', 'Critical', 'High', 'Medium', 'Low']} />
          <FilterDropdown label="Risk Level" options={['All', 'Critical', 'High', 'Medium', 'Low']} />
          <FilterDropdown label="Status" options={['All', 'In Progress', 'Completed']} />
          <FilterDropdown label="MITRE Tactic" options={['All', 'Initial Access', 'Execution', 'Persistence']} />
          <FilterDropdown label="MITRE Technique" options={['All']} />
          <FilterDropdown label="Asset" options={['All']} />
          <FilterDropdown label="User" options={['All']} />
          <FilterDropdown label="Date/Time Range" options={['Last 24 Hours', 'Last 7 Days', 'Last 30 Days']} />
          <button className="flex items-center justify-center p-2 bg-black/15 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors rounded-[6px] border border-white/[0.08] self-end mb-0.5">
             <FiFilter size={14} />
          </button>
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* Visualization */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[12px] p-0 flex flex-col overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
              <div className="p-4 border-b border-white/[0.05] flex justify-between items-center bg-black/10">
                <div className="flex items-center gap-3">
                  <h3 className="text-[13px] font-semibold text-white">Attack Chain: AC-2025-0515-3421 <span className="font-normal text-slate-400">(Ransomware Campaign)</span></h3>
                  <Badge colorClass="text-rose-400 bg-rose-500/10 border-rose-500/20">Critical</Badge>
                </div>
                <div className="flex items-center gap-2.5">
                  <button className="text-[11px] font-medium bg-black/15 text-white border border-white/[0.08] px-3 py-1.5 rounded-[6px] hover:bg-white/[0.08] transition-all flex items-center gap-1.5">
                    <MdTrackChanges size={14}/> View Full Timeline
                  </button>
                  <button className="text-[11px] font-medium bg-black/15 text-white border border-white/[0.08] px-3 py-1.5 rounded-[6px] hover:bg-white/[0.08] transition-all flex items-center gap-1.5">
                    Actions <MdKeyboardArrowDown size={14}/>
                  </button>
                </div>
              </div>
              
              <div className="p-5 bg-black/20 overflow-x-auto">
                <div className="flex pb-2 w-max">
                  {data?.nodes?.map((node, i) => (
                    <ChainNode key={node.id} node={node} isLast={i === data.nodes.length - 1} />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-5 text-[11px] text-slate-400 font-medium px-1">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Completed</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border-2 border-purple-400"></div> In Progress</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-slate-500"></div> Pending</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Failed</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Skipped</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[12px] flex flex-col overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
              <div className="p-4 border-b border-white/[0.05] flex items-center bg-black/10">
                <h3 className="text-[12px] font-semibold text-white uppercase tracking-wider">Attack Chains</h3>
              </div>
              <div className="overflow-x-auto min-w-full">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-white/[0.05] bg-black/10 text-slate-400">
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Chain ID</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Chain Name</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Risk</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Severity</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">MITRE Tactics</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">MITRE Techniques</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Stages</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Affected Assets</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Affected Users</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Started</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Last Activity</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right pr-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-slate-300">
                    {(!data?.chainsTable || data.chainsTable.length === 0) ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-slate-500 text-xs">
                          No active attack chains detected.
                        </td>
                      </tr>
                    ) : (
                      data.chainsTable.map((row, i) => {
                        const [doneStages, totalStages] = typeof row.stages === 'string' && row.stages.includes('/')
                          ? row.stages.split('/').map(n => parseInt(n, 10))
                          : [0, 1]
                        const stagePct = totalStages > 0 ? Math.min(100, Math.max(0, (doneStages / totalStages) * 100)) : 0

                        return (
                          <tr key={i} className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${i === 0 ? 'bg-white/[0.02]' : ''}`}>
                            <td className="px-4 py-3 text-cyan-400 font-mono whitespace-nowrap">{row.id}</td>
                            <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{row.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`font-bold font-mono text-[10px] ${row.risk >= 70 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : row.risk >= 40 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'} px-2 py-0.5 rounded border`}>{row.risk}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge colorClass={row.severity === 'Critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : row.severity === 'High' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : row.severity === 'Medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}>{row.severity}</Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap flex gap-1.5 pt-4">
                              {(row.tactics || []).map((t, idx) => <TacticIcon key={idx} color={t} />)}
                            </td>
                            <td className="px-4 py-3 text-slate-200 whitespace-nowrap font-mono">{row.techniques}</td>
                            <td className="px-4 py-3 text-slate-200 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                 <span>{row.stages || '—'}</span>
                                 <div className="w-10 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stagePct}%` }}></div>
                                 </div>
                              </div>
                            </td>
                        <td className="px-4 py-3 text-slate-200 whitespace-nowrap">{row.assets}</td>
                        <td className="px-4 py-3 text-slate-200 whitespace-nowrap">{row.users}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                           <span className={`text-[10px] font-bold uppercase tracking-wider ${row.status === 'In Progress' ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'} px-2 py-0.5 rounded`}>{row.status}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap text-[10.5px]">{row.started}</td>
                        <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap text-[10.5px]">{row.lastActivity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right pr-5">
                          <div className="flex items-center justify-end gap-2.5 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity">
                            <button className="hover:text-cyan-400 transition-colors" title="View Details"><HiOutlineEye size={16} /></button>
                            <button className="hover:text-white transition-colors" title="Open in new tab"><HiOutlineExternalLink size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="p-3.5 border-t border-white/[0.05] flex justify-between items-center bg-black/10 text-[11px]">
                <span className="text-slate-400">Showing 1 to 5 of {data?.totalCount} attack chains</span>
                <div className="flex items-center gap-1.5">
                  <button className="px-2.5 py-1 bg-black/15 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded transition-colors">&lt;</button>
                  <button className="px-3 py-1 bg-blue-600/85 border border-blue-500/60 text-white rounded font-medium">1</button>
                  <button className="px-2.5 py-1 bg-black/15 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded transition-colors">2</button>
                  <button className="px-2.5 py-1 bg-black/15 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded transition-colors">3</button>
                  <button className="px-2.5 py-1 bg-black/15 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded transition-colors">4</button>
                  <button className="px-2.5 py-1 bg-black/15 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded transition-colors">5</button>
                  <button className="px-2.5 py-1 bg-black/15 border border-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded transition-colors">&gt;</button>
                  <span className="text-slate-400 ml-3">10 / page <MdKeyboardArrowDown className="inline text-slate-400" size={13}/></span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[12px] p-5 transition-all duration-200 hover:border-white/[0.12]">
              <h3 className="text-[12px] font-semibold text-white uppercase tracking-wider mb-4">Attack Chain Details</h3>
              <div className="flex flex-col gap-3 text-[11px]">
                <div className="flex justify-between items-center"><span className="text-slate-400">Chain ID</span><span className="text-cyan-400 font-mono hover:underline cursor-pointer">AC-2025-0515-3421</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Chain Name</span><span className="text-white font-medium">Ransomware Campaign</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Risk Score</span><span className="text-white font-mono">72 / 100</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Severity</span><Badge colorClass="text-rose-400 bg-rose-500/10 border-rose-500/20">Critical</Badge></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Status</span><span className="text-purple-400 font-semibold">In Progress</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Start Time</span><span className="text-slate-200 font-mono text-[10px]">May 15, 2025 21:45:12</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Last Activity</span><span className="text-slate-200 font-mono text-[10px]">May 15, 2025 21:57:42</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Duration</span><span className="text-slate-200 font-mono">24m 30s</span></div>
              </div>

              <div className="my-5 h-px w-full bg-white/[0.05]"></div>

              <div className="flex justify-between items-center mb-2.5">
                 <h3 className="text-[12px] font-semibold text-white uppercase tracking-wider">MITRE Mapping</h3>
              </div>
              <div className="flex flex-col gap-3">
                 <div>
                    <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider">Tactics (6)</p>
                    <div className="flex flex-wrap gap-2">
                       <div className="w-6 h-6 rounded-full border border-blue-500/40 flex items-center justify-center bg-blue-500/10"><div className="w-2 h-2 rounded-full bg-blue-400"></div></div>
                       <div className="w-6 h-6 rounded-full border border-emerald-500/40 flex items-center justify-center bg-emerald-500/10"><div className="w-2 h-2 rounded-full bg-emerald-400"></div></div>
                       <div className="w-6 h-6 rounded-full border border-yellow-500/40 flex items-center justify-center bg-yellow-500/10"><div className="w-2 h-2 rounded-full bg-yellow-400"></div></div>
                       <div className="w-6 h-6 rounded-full border border-amber-500/40 flex items-center justify-center bg-amber-500/10"><div className="w-2 h-2 rounded-full bg-amber-400"></div></div>
                       <div className="w-6 h-6 rounded-full border border-purple-500/40 flex items-center justify-center bg-purple-500/10"><div className="w-2 h-2 rounded-full bg-purple-400"></div></div>
                       <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center bg-black/20"><div className="w-2 h-2 rounded-full bg-slate-400"></div></div>
                    </div>
                 </div>
                 <div>
                    <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider">Techniques (12)</p>
                    <div className="flex flex-wrap gap-1.5">
                       <span className="px-2 py-0.5 border border-white/[0.05] rounded text-[9.5px] text-slate-300 font-mono bg-black/15">T1566</span>
                       <span className="px-2 py-0.5 border border-white/[0.05] rounded text-[9.5px] text-slate-300 font-mono bg-black/15">T1059.001</span>
                       <span className="px-2 py-0.5 border border-white/[0.05] rounded text-[9.5px] text-slate-300 font-mono bg-black/15">T1547.001</span>
                       <span className="px-2 py-0.5 border border-white/[0.05] rounded text-[9.5px] text-slate-300 font-mono bg-black/15">T1068</span>
                       <span className="px-2 py-0.5 border border-white/[0.05] rounded text-[9.5px] text-slate-300 font-mono bg-black/15">T1562.001</span>
                       <span className="px-2 py-0.5 border border-white/[0.05] rounded text-[9.5px] text-slate-400 font-mono bg-black/15">+7 more</span>
                    </div>
                 </div>
              </div>

              <div className="my-5 h-px w-full bg-white/[0.05]"></div>

              <h3 className="text-[12px] font-semibold text-white uppercase tracking-wider mb-3">Affected Entities</h3>
              <div className="flex flex-col gap-2.5 text-[11px]">
                <div className="flex justify-between items-center hover:bg-white/[0.02] p-1.5 rounded cursor-pointer transition-colors group">
                   <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-white"><MdOutlineCloudQueue size={16} /> Assets</div>
                   <span className="text-white font-medium font-mono">12</span>
                </div>
                <div className="flex justify-between items-center hover:bg-white/[0.02] p-1.5 rounded cursor-pointer transition-colors group">
                   <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-white"><MdPersonOutline size={16} /> Users</div>
                   <span className="text-white font-medium font-mono">3</span>
                </div>
                <div className="flex justify-between items-center hover:bg-white/[0.02] p-1.5 rounded cursor-pointer transition-colors group">
                   <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-white"><MdLocationOn size={16} /> IP Addresses</div>
                   <span className="text-white font-medium font-mono">4</span>
                </div>
                <div className="flex justify-between items-center hover:bg-white/[0.02] p-1.5 rounded cursor-pointer transition-colors group">
                   <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-white"><MdAccountTree size={16} /> Processes</div>
                   <span className="text-white font-medium font-mono">27</span>
                </div>
              </div>

              <div className="my-5 h-px w-full bg-white/[0.05]"></div>

              <h3 className="text-[12px] font-semibold text-white uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                 <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-black/15 hover:bg-white/[0.08] border border-white/[0.08] rounded-[8px] text-[11px] text-white font-medium transition-colors">
                    <MdOutlineSecurity size={14} /> View Incident
                 </button>
                 <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-black/15 hover:bg-white/[0.08] border border-white/[0.08] rounded-[8px] text-[11px] text-white font-medium transition-colors">
                    <FiActivity size={14} /> Related Signals
                 </button>
                 <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-black/15 hover:bg-white/[0.08] border border-white/[0.08] rounded-[8px] text-[11px] text-white font-medium transition-colors">
                    <MdTrackChanges size={14} /> View Timeline
                 </button>
                 <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-black/15 hover:bg-white/[0.08] border border-white/[0.08] rounded-[8px] text-[11px] text-white font-medium transition-colors">
                    <MdComputer size={14} /> View Assets
                 </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}