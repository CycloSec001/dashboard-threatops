import { useState, useEffect, useCallback } from 'react'
import PageShell from '../components/PageShell'
import { KpiBigNumber, KpiGauge } from '../components/KpiCards'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer
} from 'recharts'
import {
  MdSearch, MdArrowForwardIos, MdTrackChanges, MdAccessTime,
  MdOutlineGpsFixed, MdKeyboardArrowDown, MdComputer, MdOutlineSecurity,
  MdOutlineWarningAmber, MdOutlineSsidChart, MdOutlineVpnKey, MdOutlineCloudQueue,
  MdOutlineFactCheck, MdOutlineFilterAltOff
} from 'react-icons/md'
import { FiActivity, FiFilter, FiLink } from 'react-icons/fi'
import { HiOutlineEye, HiOutlineExternalLink } from 'react-icons/hi'

const FilterDropdown = ({ label, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider pl-1">{label}</label>
    <select className="bg-[#0d1117] border border-[#1f2937] text-[12px] text-white rounded-[6px] px-3 py-1.5 outline-none appearance-none pr-8 relative min-w-[120px] focus:border-blue-500/50">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
)

const Badge = ({ children, colorClass }) => (
  <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${colorClass}`}>{children}</span>
)

async function fetchData(tf) {
  return { kpis: {}, detectionRateChart: [], detectionTrendChart: [], detectionsTable: [], totalCount: 0, unsupported: 'Detection analytics are not exposed as an aggregate backend resource.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, Math.random() * 500 + 300))
  
  const kpis = {
    detectionCount: { value: "12,845", trend: { value: "18%", label: "vs yesterday", direction: "up", color: "green" } },
    highConfidence: { value: "9,231", trend: { value: "16%", label: "vs yesterday", direction: "up", color: "green" } },
    criticalDetections: { value: "342", trend: { value: "12%", label: "vs yesterday", direction: "up", color: "green" } },
    detectionAccuracy: { value: 92, label: "High Accuracy" },
    suppressedDetections: { value: "2,145", trend: { value: "22%", label: "vs yesterday", direction: "up", color: "green" } },
  }

  const detectionRateChart = [
    { t: '00:00', rate: 25 }, { t: '01:00', rate: 50 }, { t: '02:00', rate: 45 }, { t: '03:00', rate: 55 },
    { t: '04:00', rate: 65 }, { t: '05:00', rate: 60 }, { t: '06:00', rate: 70 }, { t: '07:00', rate: 85 },
    { t: '08:00', rate: 80 }, { t: '09:00', rate: 55 }, { t: '10:00', rate: 45 }, { t: '11:00', rate: 40 },
    { t: '12:00', rate: 50 }, { t: '13:00', rate: 65 }, { t: '14:00', rate: 70 }, { t: '15:00', rate: 65 },
    { t: '16:00', rate: 55 }, { t: '17:00', rate: 60 }, { t: '18:00', rate: 75 }, { t: '19:00', rate: 90 },
    { t: '20:00', rate: 70 }, { t: '21:00', rate: 60 }
  ]

  const detectionTrendChart = [
    { t: 'May 09', val: 10000 }, { t: 'May 10', val: 8000 }, { t: 'May 11', val: 11000 },
    { t: 'May 12', val: 14000 }, { t: 'May 13', val: 19000 }, { t: 'May 14', val: 12000 },
    { t: 'May 15', val: 13500 }
  ]

  const detectionsTable = [
    { time: 'May 15, 2025 23:45:12', name: 'Suspicious PowerShell Execution', source: 'Endpoint', severity: 'Critical', confidence: 'High', status: 'New', tactic: 'Execution', technique: 'T1059.001', asset: 'WS-1042' },
    { time: 'May 15, 2025 23:43:09', name: 'Multiple Failed Logins', source: 'Identity', severity: 'High', confidence: 'High', status: 'New', tactic: 'Credential Access', technique: 'T1110', asset: 'SRV-09' },
    { time: 'May 15, 2025 23:40:51', name: 'Malicious File Detected', source: 'EDR', severity: 'High', confidence: 'Medium', status: 'Investigating', tactic: 'Initial Access', technique: 'T1566', asset: 'WS-1042' },
    { time: 'May 15, 2025 23:38:22', name: 'Data Exfiltration Attempt', source: 'Network', severity: 'Critical', confidence: 'High', status: 'New', tactic: 'Exfiltration', technique: 'T1041', asset: 'DC-01' },
    { time: 'May 15, 2025 23:35:18', name: 'Remote Service Anomaly', source: 'Network', severity: 'Medium', confidence: 'Medium', status: 'Investigating', tactic: 'Lateral Movement', technique: 'T1021', asset: 'WS-1029' },
    { time: 'May 15, 2025 23:33:07', name: 'Brute Force Attack', source: 'SIEM', severity: 'High', confidence: 'High', status: 'New', tactic: 'Credential Access', technique: 'T1110', asset: 'FW-01' },
    { time: 'May 15, 2025 23:30:44', name: 'Suspicious DNS Activity', source: 'Network', severity: 'Low', confidence: 'Low', status: 'Closed', tactic: 'Command & Control', technique: 'T1071', asset: 'SRV-12' }
  ]

  return { kpis, detectionRateChart, detectionTrendChart, detectionsTable, totalCount: 12845, _lastUpdated: new Date().toISOString() }
}

const TT = {
  contentStyle: { background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12, color: '#e5e7eb' },
  itemStyle: { color: '#e5e7eb' },
  cursor: { stroke: 'rgba(255,255,255,0.08)' }
}

export default function DetectionAnalytics({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  
  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchData(selectedTime)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])
  useEffect(() => { load() }, [load])

  return (
    <PageShell section="Detection" title="Detection Analytics"
      subtitle="Monitor detection performance, quality and trends across your environment."
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>

      <div className="flex flex-col gap-4">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-4 h-[120px]">
          <KpiBigNumber title="Detection Count" icon={MdOutlineSsidChart} value={data?.kpis?.detectionCount?.value || 0} trend={data?.kpis?.detectionCount?.trend} iconColor="#3b82f6" footerRight={<>View detections <MdArrowForwardIos size={10} /></>} routeKey="detections" setActive={setActive} />
          <KpiBigNumber title="High-Confidence Detections" icon={MdOutlineFactCheck} value={data?.kpis?.highConfidence?.value || 0} trend={data?.kpis?.highConfidence?.trend} iconColor="#a855f7" footerRight={<>View high confidence <MdArrowForwardIos size={10} /></>} routeKey="high_conf" setActive={setActive} />
          <KpiBigNumber title="Critical Detections" icon={MdOutlineWarningAmber} value={data?.kpis?.criticalDetections?.value || 0} trend={data?.kpis?.criticalDetections?.trend} iconColor="#ef4444" footerRight={<>View critical <MdArrowForwardIos size={10} /></>} routeKey="critical" setActive={setActive} />
          <KpiGauge title="Detection Accuracy" icon={MdOutlineGpsFixed} value={data?.kpis?.detectionAccuracy?.value || 0} label={data?.kpis?.detectionAccuracy?.label} colorMode="performance" footerRight={<>View details <MdArrowForwardIos size={10} /></>} routeKey="accuracy" setActive={setActive} />
          <KpiBigNumber title="Suppressed Detections" icon={MdOutlineFilterAltOff} value={data?.kpis?.suppressedDetections?.value || 0} trend={data?.kpis?.suppressedDetections?.trend} iconColor="#9ca3af" footerRight={<>View suppressed <MdArrowForwardIos size={10} /></>} routeKey="suppressed" setActive={setActive} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4 h-[280px]">
          <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-4 flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-center mb-4 z-10 relative">
                <div className="flex items-center gap-2">
                   <h3 className="text-[13px] font-semibold text-white">Detection Rate Over Time</h3>
                   <MdOutlineWarningAmber size={14} className="text-[#6b7280]" />
                </div>
                <div className="flex items-center bg-[#0d1117] border border-[#1f2937] rounded-[6px] overflow-hidden text-[11px] text-[#9ca3af] px-2 py-1 gap-1">
                   Last 24 Hours <MdKeyboardArrowDown size={12}/>
                </div>
             </div>
             <div className="flex items-center gap-2 mb-2 z-10 relative">
                <div className="w-3 h-1 bg-[#3b82f6] rounded-full"></div>
                <span className="text-[11px] text-[#9ca3af]">Detections / min</span>
             </div>
             <div className="flex-1 w-full h-full min-h-0 relative z-0">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={data?.detectionRateChart || []} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                         <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="t" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                      <RTooltip {...TT} />
                      <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" activeDot={{ r: 4, fill: '#3b82f6', stroke: '#111827', strokeWidth: 2 }} dot={{ r: 3, fill: '#3b82f6', stroke: '#3b82f6' }} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-4 flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-center mb-4 z-10 relative">
                <div className="flex items-center gap-2">
                   <h3 className="text-[13px] font-semibold text-white">Detection Trend (Volume)</h3>
                   <MdOutlineWarningAmber size={14} className="text-[#6b7280]" />
                </div>
                <div className="flex items-center bg-[#0d1117] border border-[#1f2937] rounded-[6px] overflow-hidden text-[11px] text-[#9ca3af] px-2 py-1 gap-1">
                   Last 7 Days <MdKeyboardArrowDown size={12}/>
                </div>
             </div>
             <div className="flex items-center gap-2 mb-2 z-10 relative">
                <div className="w-3 h-1 bg-[#a855f7] rounded-full"></div>
                <span className="text-[11px] text-[#9ca3af]">Detections</span>
             </div>
             <div className="flex-1 w-full h-full min-h-0 relative z-0">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={data?.detectionTrendChart || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                         <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="t" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v/1000}K` : v} />
                      <RTooltip {...TT} />
                      <Area type="monotone" dataKey="val" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" activeDot={{ r: 4, fill: '#a855f7', stroke: '#111827', strokeWidth: 2 }} dot={{ r: 3, fill: '#a855f7', stroke: '#a855f7' }} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" size={16} />
              <input type="text" placeholder="Search detections..." className="w-full bg-[#0d1117] border border-[#1f2937] text-[12px] text-white rounded-[6px] pl-9 pr-3 py-1.5 outline-none focus:border-blue-500/50" />
            </div>
          </div>
          <FilterDropdown label="Severity" options={['All', 'Critical', 'High', 'Medium', 'Low']} />
          <FilterDropdown label="Confidence" options={['All', 'High', 'Medium', 'Low']} />
          <FilterDropdown label="Status" options={['All', 'New', 'Investigating', 'Closed']} />
          <FilterDropdown label="Source" options={['All', 'Endpoint', 'Identity', 'Network', 'SIEM']} />
          <FilterDropdown label="Tactic" options={['All', 'Execution', 'Credential Access', 'Exfiltration']} />
          <FilterDropdown label="Technique" options={['All', 'T1059.001', 'T1110', 'T1566']} />
          <div className="flex items-center gap-2 bg-[#0d1117] border border-[#1f2937] px-3 py-1.5 rounded-[6px] text-[12px] text-white cursor-pointer hover:border-[#374151]">
             <MdAccessTime size={14} className="text-[#9ca3af]"/> All Time <MdKeyboardArrowDown size={14} className="text-[#9ca3af]"/>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-4 gap-4 items-start">
          
          <div className="col-span-3 flex flex-col gap-4">
            {/* Table */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#1f2937] flex items-center">
                <h3 className="text-[13px] font-semibold text-white">Detections ({data?.totalCount.toLocaleString()})</h3>
              </div>
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1f2937] bg-[#0d1117]/50">
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Detection Name</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Source</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Severity</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Confidence</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Tactic</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Technique</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Asset</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.detectionsTable?.map((row, i) => (
                      <tr key={i} className="border-b border-[#1f2937]/50 hover:bg-[#1f2937]/30 transition-colors cursor-pointer group">
                        <td className="px-4 py-3 text-[11px] text-[#9ca3af] whitespace-nowrap border-l-2 border-transparent group-hover:border-blue-500">
                          {row.time}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-white font-medium whitespace-nowrap">{row.name}</td>
                        <td className="px-4 py-3 text-[11px] text-[#9ca3af] whitespace-nowrap">{row.source}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge colorClass={row.severity === 'Critical' ? 'text-red-400 bg-red-500/20' : row.severity === 'High' ? 'text-orange-400 bg-orange-500/20' : row.severity === 'Medium' ? 'text-yellow-400 bg-yellow-500/20' : 'text-green-400 bg-green-500/20'}>{row.severity}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                           <span className={`text-[10px] font-bold ${row.confidence === 'High' ? 'text-green-400 border-green-500/30' : row.confidence === 'Medium' ? 'text-yellow-400 border-yellow-500/30' : 'text-green-600 border-green-700/30'} px-2 py-0.5 rounded border`}>{row.confidence}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                           <span className={`text-[10px] font-bold ${row.status === 'New' ? 'text-blue-400 bg-blue-500/10 border border-blue-500/30' : row.status === 'Investigating' ? 'text-purple-400 bg-purple-500/10 border border-purple-500/30' : 'text-gray-400 bg-gray-500/10 border border-gray-500/30'} px-2 py-0.5 rounded`}>{row.status}</span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-blue-400 whitespace-nowrap hover:underline cursor-pointer">{row.tactic}</td>
                        <td className="px-4 py-3 text-[11px] text-[#9ca3af] whitespace-nowrap">{row.technique}</td>
                        <td className="px-4 py-3 text-[11px] text-[#9ca3af] whitespace-nowrap">{row.asset}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right pr-6">
                          <div className="flex items-center justify-end gap-3 text-[#6b7280] opacity-30 group-hover:opacity-100 transition-opacity">
                            <button className="hover:text-white" title="View Details"><HiOutlineEye size={16} /></button>
                            <button className="hover:text-white" title="Open in new tab"><HiOutlineExternalLink size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="p-3 border-t border-[#1f2937] flex justify-between items-center bg-[#0d1117]/30">
                <span className="text-[11px] text-[#6b7280]">Showing 1 to 7 of {data?.totalCount?.toLocaleString()} detections</span>
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 flex items-center justify-center text-[#6b7280] hover:text-white hover:bg-[#1f2937] rounded transition-colors text-[11px]">&lt;</button>
                  <button className="w-7 h-7 flex items-center justify-center text-white bg-blue-600 rounded text-[11px] font-medium">1</button>
                  <button className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#1f2937] rounded transition-colors text-[11px]">2</button>
                  <button className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#1f2937] rounded transition-colors text-[11px]">3</button>
                  <button className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#1f2937] rounded transition-colors text-[11px]">4</button>
                  <button className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#1f2937] rounded transition-colors text-[11px]">5</button>
                  <button className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#1f2937] rounded transition-colors text-[11px]">...</button>
                  <button className="w-9 h-7 flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#1f2937] rounded transition-colors text-[11px]">1835</button>
                  <button className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#1f2937] rounded transition-colors text-[11px]">&gt;</button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 flex flex-col gap-4">
            <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5">
              
              <h3 className="text-[13px] font-semibold text-white mb-4">Detection Summary</h3>
              <div className="flex flex-col gap-3 text-[12px]">
                <div className="flex justify-between items-center"><span className="text-[#9ca3af]">Detection Count</span><span className="text-white font-medium">12,845</span></div>
                <div className="flex justify-between items-center"><span className="text-[#9ca3af]">High-Confidence</span><span className="text-white font-medium">9,231</span></div>
                <div className="flex justify-between items-center"><span className="text-[#9ca3af]">Critical Detections</span><span className="text-white font-medium">342</span></div>
                <div className="flex justify-between items-center"><span className="text-[#9ca3af]">Suppressed</span><span className="text-white font-medium">2,145</span></div>
                <div className="flex justify-between items-center"><span className="text-[#9ca3af]">Detection Accuracy</span><span className="text-white font-medium">92%</span></div>
              </div>

              <div className="my-5 h-px w-full bg-[#1f2937]"></div>

              <h3 className="text-[13px] font-semibold text-white mb-4">Top Detection Sources</h3>
              <div className="flex flex-col gap-3.5">
                {[
                  { name: 'Endpoint', val: 5231, pct: 40.7 },
                  { name: 'Network', val: 3452, pct: 26.9 },
                  { name: 'Identity', val: 2145, pct: 16.7 },
                  { name: 'Email', val: 1256, pct: 9.8 },
                  { name: 'Cloud', val: 781, pct: 5.9 }
                ].map(src => (
                  <div key={src.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#9ca3af]">{src.name}</span>
                      <span className="text-white">{src.val.toLocaleString()} <span className="text-[#6b7280]">({src.pct}%)</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full" style={{ width: `${src.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-5 h-px w-full bg-[#1f2937]"></div>

              <h3 className="text-[13px] font-semibold text-white mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                 <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] rounded-[6px] text-[11px] text-white font-medium transition-colors">
                    <MdOutlineSecurity size={14} /> View Detections
                 </button>
                 <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] rounded-[6px] text-[11px] text-white font-medium transition-colors">
                    <MdTrackChanges size={14} /> Detection Rules
                 </button>
                 <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] rounded-[6px] text-[11px] text-white font-medium transition-colors">
                    <MdOutlineFilterAltOff size={14} /> Tuning & Suppression
                 </button>
                 <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] rounded-[6px] text-[11px] text-white font-medium transition-colors">
                    <MdOutlineGpsFixed size={14} /> Detection Coverage
                 </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
