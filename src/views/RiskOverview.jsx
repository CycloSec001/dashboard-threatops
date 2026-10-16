import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Treemap, Cell
} from 'recharts'
import PageShell, { ActSection } from '../components/PageShell'
import { MdSecurity } from 'react-icons/md'
import { KpiGauge } from '../components/KpiCards'

const TT = {
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '11px',
}

async function fetchData(tf) {
  return { kpis: {}, assets: [], trends: [], unsupported: 'Risk overview analytics are not exposed by the backend API.', _lastUpdated: new Date().toISOString() }
  await new Promise(r => setTimeout(r, Math.random() * 500 + 300))
  const m = { 'Last 24 Hours': 1, 'Last 7 Days': 7, 'Last 30 Days': 28, 'Last 90 Days': 90 }[tf] || 1
  const labels = tf === 'Last 7 Days' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : tf === 'Last 30 Days' ? ['W1', 'W2', 'W3', 'W4']
      : tf === 'Last 90 Days' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
  const j = (b, r = 0.3) => Math.max(0, Math.round(b * (1 - r + Math.random() * r * 2)))

  // KPI
  const postureScore = j(72, 0.1)

  // Act 1
  const riskTrend = labels.map(t => ({
    t,
    index: j(65, 0.1) // Keep risk somewhat stable
  }))
  const riskByAsset = [
    { class: 'Databases', risk: j(85) },
    { class: 'Identity', risk: j(92) },
    { class: 'Endpoints', risk: j(45) },
    { class: 'Network', risk: j(55) },
    { class: 'Cloud Storage', risk: j(72) }
  ]

  // Act 2
  const riskByAttack = [
    { name: 'Ransomware', size: j(95) },
    { name: 'Data Exfiltration', size: j(80) },
    { name: 'Credential Theft', size: j(110) },
    { name: 'DDoS', size: j(40) },
    { name: 'Insider Threat', size: j(60) }
  ]
  const controlEffectiveness = [
    { control: 'EDR Coverage', current: 85, target: 95 },
    { control: 'MFA Enforcement', current: 92, target: 100 },
    { control: 'Network Segmentation', current: 45, target: 80 },
    { control: 'Patch Latency (SLA)', current: 65, target: 90 },
    { control: 'Data Encryption (At Rest)', current: 78, target: 100 }
  ]

  return {
    kpis: { postureScore },
    riskTrend, riskByAsset, riskByAttack, controlEffectiveness,
    _lastUpdated: new Date().toISOString()
  }
}

// Custom Treemap Content
const CustomizedTreemapContent = ({ x, y, width, height, index, name }) => {
  const colors = ['#EF4444', '#F97316', '#F59E0B', '#8B5CF6', '#00D9FF']
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={colors[index % colors.length]} rx={2} ry={2} stroke="rgba(255,255,255,0.08)" strokeWidth={2} fillOpacity={0.8} />
      {width > 60 && height > 30 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={11} dominantBaseline="central">{name}</text>
      )}
    </g>
  )
}

// Custom CSS Bullet Graph (No number cards allowed)
function BulletGraph({ data }) {
  if (!data) return null
  return (
    <div className="flex flex-col gap-3 pt-1">
      {data.map((row, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex justify-between items-end">
            <span className="text-[9.5px] font-semibold text-slate-200 uppercase tracking-wider">{row.control}</span>
            {/* Minimal axis labels instead of large number cards */}
            <span className="text-[9.5px]  text-slate-400">Target: {row.target}%</span>
          </div>
          <div className="relative w-full h-4 bg-white/5 rounded-[4px] overflow-hidden border border-white/[0.05]">
            {/* Background qualitative ranges (Poor, Satisfactory, Good) */}
            <div className="absolute top-0 bottom-0 left-0 w-[50%] bg-[#EF4444]/10 border-r border-white/[0.05]" />

            <div className="absolute top-0 bottom-0 left-[50%] w-[30%] bg-[#F59E0B]/10 border-r border-white/[0.05]" />
            <div className="absolute top-0 bottom-0 left-[80%] w-[20%] bg-[#39FF6A]/10" />

            {/* Current Performance Bar */}
            <div
              className="absolute top-[20%] bottom-[20%] left-0 bg-[#00D9FF] rounded-r-[4px] z-10 transition-all duration-500"
              style={{ width: `${row.current}%` }}
            />

            {/* Target Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-md"
              style={{ left: `calc(${row.target}% - 2px)` }}
              title={`Target: ${row.target}%`}
            />
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center text-[9.5px] text-slate-400 mt-2 px-1 border-t border-white/[0.05] pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><div className="w-3 h-1 bg-[#00D9FF]"></div> Current</span>
          <span className="flex items-center gap-1.5"><div className="w-1 h-3 bg-white"></div> Target</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#EF4444]/20"></div> Critical</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#F59E0B]/20"></div> Warning</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#39FF6A]/20"></div> Healthy</span>
        </div>
      </div>
    </div>
  )
}

export default function RiskOverview({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchData(selectedTime)) } catch { setIsError(true) } finally { setIsLoading(false) }
  }, [selectedTime])
  useEffect(() => { load() }, [load])

  return (
    <PageShell section="Risk & Posture" title="Risk Overview"
      subtitle="Security posture mapped through aggregate risk indices and control effectiveness"
      selectedTime={selectedTime} isLoading={isLoading} isError={isError}
      isPartial={false} lastUpdated={data?._lastUpdated} onRefresh={load}>

      {/* ACT 1 — Current Security Posture and Risk Overview */}
      <ActSection act="act1">
        <div className="grid grid-cols-2 gap-3 items-stretch">

          {/* Primary security posture metric — top-left panel */}
          <div className="col-start-1 row-start-1">
            <KpiGauge
              title="Security Posture Score"
              subtitle="Aggregate control effectiveness and risk exposure index"
              value={data?.kpis?.postureScore || 0}
              label="/ 100"
            />
          </div>

          {/* Risk trend visualization — bottom-left panel */}
          <div className="col-start-1 row-start-2 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col hover:border-white/[0.12] transition-colors">
            <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Risk Trend</p>
            <p className="text-[9.5px] text-slate-400 mb-2">Aggregate enterprise risk index over time</p>

            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.riskTrend || []} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" vertical={false} />
                  <XAxis dataKey="t" stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
                  <YAxis domain={[0, 100]} stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={TT} />
                  <Line
                    type="monotone"
                    dataKey="index"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#EF4444', strokeWidth: 0 }}
                    name="Risk Index"
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Asset-class risk visualization — right panel spanning both Act 1 rows */}
          <div className="col-start-2 row-start-1 row-span-2 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col hover:border-white/[0.12] transition-colors">
            <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Risk by Asset Class</p>
            <p className="text-[9.5px] text-slate-400 mb-2">Concentration of vulnerability across domains</p>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.riskByAsset || []} layout="vertical" margin={{ top: 0, bottom: 0, left: 0, right: 0 }} >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2631" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#374151" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
                  <YAxis type="category" dataKey="class" stroke="#9ca3af" fontSize={9.5} tickLine={false} axisLine={false} width={75} />
                  <RTooltip contentStyle={TT} cursor={false} />
                  <Bar dataKey="risk" fill="#F59E0B" radius={[0, 6, 6, 0]} name="Risk Score" barSize={21.5} isAnimationActive={false}>
                    {(data?.riskByAsset || []).map((e, i) => (
                      <Cell key={i} fill={e.risk > 80 ? '#EF4444' : '#F59E0B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </ActSection>

      {/* ACT 2 — Risk Drivers and Control Effectiveness */}
      <ActSection act="act2">
        <div className="grid grid-cols-2 gap-3 items-stretch">
          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col hover:border-white/[0.12] transition-colors">
            <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Risk by Attack Vector</p>
            <p className="text-[9.5px] text-slate-400 mb-2">Theoretical attack paths driving the highest risk</p>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={data?.riskByAttack || []}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  isAnimationActive={true}
                  stroke="rgba(255,255,255,0.08)"
                  content={<CustomizedTreemapContent />}
                >
                  <RTooltip contentStyle={TT}
                    labelStyle={{ color: '#fff', fontSize: '11px' }}
                    itemStyle={{ color: '#fff', fontSize: '11px' }}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col hover:border-white/[0.12] transition-colors">
            <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Control Effectiveness (vs Target)</p>
            <p className="text-[9.5px] text-slate-400 mb-2">Current control coverage mapped against policy targets</p>
            <div className="flex-1 min-h-[220px]">
              <BulletGraph data={data?.controlEffectiveness} />
            </div>
          </div>
        </div>
      </ActSection>

      {/* ACT 4 — What can safely happen next? */}
      <ActSection act="act4">
        <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <MdSecurity className="text-red-400" size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Posture Operations</p>
              <p className="text-[9.5px] text-slate-400">Recalculate risk scoring or mandate control deployments.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="text-[9.5px] font-bold uppercase tracking-wider bg-black/5 text-slate-200 border border-white/[0.05] px-3 py-1.5 rounded-[4px] hover:border-white/[0.12] hover:bg-white/[0.02] transition-colors">Recalculate Risk Index</button>
            <button className="text-[9.5px] font-bold uppercase tracking-wider bg-black/5 text-slate-200 border border-white/[0.05] px-3 py-1.5 rounded-[4px] hover:border-white/[0.12] hover:bg-white/[0.02] transition-colors">Audit Control Gaps</button>
            <button className="text-[9.5px] font-bold uppercase tracking-wider bg-black/5 text-slate-200 border border-white/[0.05] px-3 py-1.5 rounded-[4px] hover:border-white/[0.12] hover:bg-white/[0.02] transition-colors">Deploy Additional Controls</button>
          </div>
        </div>
      </ActSection>
    </PageShell>
  )
}
