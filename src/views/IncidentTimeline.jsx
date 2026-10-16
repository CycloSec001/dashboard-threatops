import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdSearch, MdArrowForwardIos, MdTrackChanges, MdAccessTime,
  MdFlashOn, MdPeopleOutline, MdHub, MdOutlineBugReport,
  MdOutlineSecurity, MdCallSplit, MdAccountTree, MdPersonOutline,
  MdCheckCircleOutline, MdVerifiedUser, MdKeyboardArrowDown,
  MdClose, MdOutlineAutoFixHigh
} from 'react-icons/md'
import { FiActivity, FiFilter } from 'react-icons/fi'
import { BiError, BiTargetLock, BiTimeFive } from 'react-icons/bi'

import PageShell, { ActSection } from '../components/PageShell'
import { KpiBigNumber } from '../components/KpiCards'

const FilterDropdown = ({ label, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9.5px] text-slate-400 uppercase tracking-wider pl-1">{label}</label>
    <select className="bg-black/10 border border-white/[0.05] text-[11px] text-slate-200 rounded-[6px] px-2.5 py-1.5 outline-none appearance-none pr-8 relative min-w-[120px] focus:border-cyan-500/50 transition-colors">
      {options.map(o => <option key={o} value={o} className="bg-[#0a0f19] text-white">{o}</option>)}
    </select>
  </div>
)

const Badge = ({ children, colorClass }) => (
  <span className={`px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${colorClass}`}>{children}</span>
)

async function fetchData(tf) {
  return { kpis: {}, timelineEvents: [], unsupported: 'Incident timeline aggregation is not exposed by the backend API.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, 400))
  
  const m = { 'Last 24 Hours': 1, 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90 }[tf] || 1
  const j = (b) => Math.max(0, Math.round(b * (0.8 + Math.random() * 0.4)))

  const kpis = {
    totalEvents: { value: j(1248 * m), trend: { value: '14%', direction: 'up', color: 'blue' } },
    activeIncidents: { value: j(24 * m), trend: { value: '12%', direction: 'up', color: 'blue' } },
    criticalEvents: { value: j(112 * m), trend: { value: '5%', direction: 'up', color: 'red' } },
    eventsLast24h: { value: j(315), trend: { value: '8%', direction: 'down', color: 'green' } },
    avgEventsIncident: { value: j(156, 0), trend: { value: '2%', direction: 'up', color: 'orange' } },
  }

  const timelineEvents = [
    {
      id: 1,
      time: "21:45:12", date: "Today",
      title: "Initial Access Detected", severity: "Critical",
      desc: "Suspicious RDP login attempt from 203.0.113.45",
      tags: [{ label: "Source", value: "Firewall" }, { label: "IP Address", value: "203.0.113.45" }],
      category: "Detection", color: "text-rose-400 border-rose-500/20 bg-rose-500/10", icon: MdOutlineBugReport
    },
    {
      id: 2,
      time: "21:47:58", date: "Today",
      title: "Automated Investigation Triggered", severity: "Info",
      desc: "ThreatOps AI gathered contextual evidence for RDP login",
      tags: [{ label: "Action", value: "UEBA Enrichment" }],
      category: "Investigation", color: "text-purple-400 border-purple-500/20 bg-purple-500/10", icon: MdOutlineAutoFixHigh
    },
    {
      id: 3,
      time: "21:50:23", date: "Today",
      title: "Incident Created", severity: "High",
      desc: "Incident INC-2026-0515-3421 was automatically created",
      tags: [{ label: "Rule", value: "Ransomware Detection Rule" }],
      category: "Detection", color: "text-amber-400 border-amber-500/20 bg-amber-500/10", icon: MdCallSplit
    },
    {
      id: 4,
      time: "22:18:09", date: "Today",
      title: "User Containment", severity: "Medium",
      desc: "User account admin was temporarily disabled automatically",
      tags: [{ label: "Action", value: "User Disabled" }],
      category: "Containment", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10", icon: MdPersonOutline
    },
    {
      id: 5,
      time: "22:31:45", date: "Today",
      title: "Host Isolation", severity: "Medium",
      desc: "Analyst isolated workstation WS-1042 from network",
      tags: [{ label: "Analyst", value: "John Doe" }],
      category: "Containment", color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10", icon: MdCheckCircleOutline
    },
    {
      id: 6,
      time: "23:27:30", date: "Today",
      title: "Remediation Script Executed", severity: "Info",
      desc: "Removed malicious persistence registry keys",
      tags: [{ label: "Status", value: "Successful" }],
      category: "Remediation", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", icon: MdCheckCircleOutline
    },
    {
      id: 7,
      time: "23:45:00", date: "Today",
      title: "Incident Closed", severity: "Info",
      desc: "Incident resolved as True Positive - Handled",
      tags: [{ label: "Analyst", value: "John Doe" }],
      category: "Closure", color: "text-slate-400 border-slate-500/20 bg-slate-500/10", icon: MdVerifiedUser
    }
  ]

  return { kpis, timelineEvents, _lastUpdated: new Date().toISOString() }
}

export default function IncidentTimeline({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  
  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchData(selectedTime)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])
  
  useEffect(() => { load() }, [load])

  const kpis = [
    { id: 'totalEvents', title: 'Total Events', icon: FiActivity, color: '#3b82f6' },
    { id: 'activeIncidents', title: 'Active Incidents', icon: BiTargetLock, color: '#f59e0b' },
    { id: 'criticalEvents', title: 'Critical Events', icon: BiError, color: '#ef4444' },
    { id: 'eventsLast24h', title: 'Events Last 24h', icon: BiTimeFive, color: '#8b5cf6' },
    { id: 'avgEventsIncident', title: 'Avg Events/Incident', icon: MdHub, color: '#10b981' },
  ]

  return (
    <PageShell section="Command Center" title="Incident Timeline"
      subtitle="Chronological view of events and activities for the selected incident."
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      lastUpdated={data?._lastUpdated} onRefresh={load}>

      <div className="flex flex-col gap-3.5 w-full">

        <ActSection act="act1">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
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
          {/* Header Card */}
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3.5 flex justify-between items-center mb-3 transition-all duration-200 hover:border-white/[0.12]">
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <Badge colorClass="text-rose-400 bg-rose-500/10 border-rose-500/20">Critical</Badge>
                <h2 className="text-[13px] font-semibold text-white">INC-2026-0515-3421 – Ransomware detected on workstation</h2>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                <span>Started: <strong className="text-white font-medium">Today 21:45:12</strong></span>
                <span className="w-px h-2.5 bg-white/10"></span>
                <span>Owner: <strong className="text-white font-medium">John Doe</strong></span>
                <span className="w-px h-2.5 bg-white/10"></span>
                <span className="flex items-center gap-1.5">Status: <Badge colorClass="text-purple-400 bg-purple-500/10 border-purple-500/20">Investigating</Badge></span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-[11px] font-medium bg-black/10 text-white border border-white/[0.08] px-3 py-1.5 rounded-[6px] hover:bg-white/[0.08] transition-colors flex items-center gap-1.5">
                View Evidence <MdArrowForwardIos size={9}/>
              </button>
            </div>
          </div>

          <div className="flex gap-3.5">
            
            {/* Timeline Column */}
            <div className={`${selectedEvent ? 'w-2/3' : 'w-full'} transition-all duration-300 flex flex-col gap-3`}>
              
              {/* Filters */}
              <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-wrap items-end gap-3 transition-all duration-200 hover:border-white/[0.12]">
                <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                  <div className="relative">
                    <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder="Search timeline..." className="w-full bg-black/10 border border-white/[0.05] text-[11px] text-slate-200 rounded-[6px] pl-8 pr-3 py-1.5 outline-none focus:border-cyan-500/50 transition-colors" />
                  </div>
                </div>
                <FilterDropdown label="Phase" options={['All', 'Detection', 'Investigation', 'Containment', 'Remediation', 'Closure']} />
                <button className="flex items-center gap-1 bg-transparent hover:text-cyan-300 text-cyan-400 text-[11px] font-medium py-1.5 px-2 rounded-[6px] transition-colors mb-[1px]">
                  <FiFilter size={11} /> Clear
                </button>
              </div>

              {/* Timeline View */}
              <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] flex flex-col transition-all duration-200 hover:border-white/[0.12]">
                <div className="p-3 border-b border-white/[0.05] flex justify-between items-center bg-black/10">
                  <h3 className="text-[11px] font-semibold text-white uppercase tracking-wider">Chronological Timeline</h3>
                </div>
                
                <div className="p-5 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-[122px] top-5 bottom-5 w-px bg-white/[0.06] z-0"></div>

                  <div className="flex flex-col gap-6 relative z-10">
                    {(data?.timelineEvents || []).map((ev, i) => (
                      <motion.div 
                        key={ev.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex group cursor-pointer"
                        onClick={() => setSelectedEvent(ev)}
                      >
                        {/* Time */}
                        <div className="w-[95px] flex flex-col items-end pt-1 pr-5 flex-shrink-0">
                          <span className="text-[11px] font-bold text-white leading-none font-mono">{ev.time}</span>
                          <span className="text-[9.5px] text-slate-400 mt-1">{ev.date}</span>
                        </div>
                        
                        {/* Icon */}
                        <div className="relative flex-shrink-0 w-[42px]">
                          <div className={`w-7 h-7 rounded-full border flex items-center justify-center absolute left-1/2 top-0 -translate-x-1/2 bg-[#0a0f19] shadow-sm ${ev.color} group-hover:scale-110 transition-transform`}>
                            <ev.icon size={13} />
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className={`flex-1 bg-black/10 border border-white/[0.05] rounded-[8px] p-2.5 ml-1.5 group-hover:border-white/[0.12] transition-colors ${selectedEvent?.id === ev.id ? 'border-cyan-500/40 bg-cyan-500/[0.03]' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-[11.5px] font-bold text-white">{ev.title}</h4>
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${ev.color}`}>{ev.category}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mb-2">{ev.desc}</p>
                          
                          {/* Tags */}
                          {ev.tags && ev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {ev.tags.map((t, idx) => (
                                <div key={idx} className="flex items-center text-[9.5px] bg-black/15 border border-white/[0.05] rounded overflow-hidden">
                                  <span className="bg-white/[0.04] text-slate-400 px-1.5 py-0.5">{t.label}</span>
                                  <span className="text-slate-200 px-1.5 py-0.5 font-medium">{t.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Context Drawer (Inline) */}
            <AnimatePresence>
              {selectedEvent && (
                <motion.div
                  initial={{ opacity: 0, width: 0, x: 20 }}
                  animate={{ opacity: 1, width: '33.333333%', x: 0 }}
                  exit={{ opacity: 0, width: 0, x: 20 }}
                  className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] flex flex-col overflow-hidden"
                >
                  <div className="p-3 border-b border-white/[0.05] flex justify-between items-center bg-black/10">
                    <h3 className="text-[11px] font-semibold text-white uppercase tracking-wider">Event Context</h3>
                    <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/[0.05] transition-colors">
                      <MdClose size={14} />
                    </button>
                  </div>
                  <div className="p-3.5 flex-1 overflow-y-auto flex flex-col gap-3">
                    
                    <div>
                      <div className="text-[9.5px] text-slate-400 uppercase tracking-wider mb-0.5">Timestamp</div>
                      <div className="text-[11.5px] text-white font-medium">{selectedEvent.date} at {selectedEvent.time}</div>
                    </div>
                    
                    <div>
                      <div className="text-[9.5px] text-slate-400 uppercase tracking-wider mb-0.5">Event Type</div>
                      <div className="text-[11.5px] text-white font-medium">{selectedEvent.category} - {selectedEvent.title}</div>
                    </div>

                    <div>
                      <div className="text-[9.5px] text-slate-400 uppercase tracking-wider mb-1">Raw JSON Data</div>
                      <div className="bg-black/20 border border-white/[0.05] rounded-[6px] p-2.5 overflow-x-auto">
                        <pre className="text-[9.5px] text-[#39FF6A] font-mono leading-relaxed">
{`{
  "eventId": "EVT-${selectedEvent.id}93821",
  "timestamp": "2025-05-15T${selectedEvent.time}Z",
  "category": "${selectedEvent.category}",
  "severity": "${selectedEvent.severity}",
  "message": "${selectedEvent.desc}",
  "source": {
    "type": "${selectedEvent.tags?.[0]?.value || 'System'}",
    "ip": "10.0.4.15"
  },
  "action": "logged"
}`}
                        </pre>
                      </div>
                    </div>

                    <button className="w-full mt-2 bg-black/10 border border-white/[0.08] text-white text-[11px] font-medium py-1.5 rounded-[6px] hover:bg-white/[0.08] transition-colors">
                      Pivot to Search
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </ActSection>

      </div>
    </PageShell>
  )
}