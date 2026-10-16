import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber } from 'react-icons/md'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend
} from 'recharts'
import { fetchSecurityAnalyticsData } from '../api/threatOpsApi'
import { ChartCard } from '../components/Charts'
import PageShell, { ActSection } from '../components/PageShell'
import { customTooltip } from '../utils/mockData'

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ cols, children }) {
  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`
      }}
    >
      {children}
    </div>
  )
}

// ── Heatmap Component ──────────────────────────────────────────────────────────
function Heatmap({ data }) {
  if (!data || data.length === 0) return null

  // Function to determine color based on risk score (0-100)
  const getColor = (score) => {
    if (score >= 80) return '#EF4444' // Critical (Red)
    if (score >= 60) return '#F97316' // High (Orange)
    if (score >= 40) return '#F59E0B' // Medium (Amber)
    if (score >= 20) return '#10B981' // Low (Emerald)
    return '#3B82F6'                  // Info (Blue)
  }

  return (

    <div className="w-full h-full flex flex-col pt-2 pb-1">
      <div className="flex-1 grid grid-cols-5 gap-2 overflow-y-auto pr-1 custom-scrollbar">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center p-2 rounded-[6px] border border-white/5 transition-all hover:scale-105 cursor-default group relative"
            style={{ backgroundColor: getColor(item.riskScore) + '40', borderColor: getColor(item.riskScore) + '80' }}
          >
            <span className="text-[10px] font-semibold text-white/90 truncate w-full text-center group-hover:opacity-0 transition-opacity">
              {item.name}
            </span>
            <span className="text-[14px] font-bold text-white absolute opacity-0 group-hover:opacity-100 transition-opacity">
              {item.riskScore}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.05]">
        <div className="flex gap-2 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> <span className="text-[9.5px] text-slate-400">0-19</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> <span className="text-[9.5px] text-slate-400">20-39</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> <span className="text-[9.5px] text-slate-400">40-59</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]" /> <span className="text-[9.5px] text-slate-400">60-79</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> <span className="text-[9.5px] text-slate-400">80-100</span>
        </div>
      </div>
    </div>
  )
}

export default function SecurityAnalytics({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchSecurityAnalyticsData(selectedTime)
      setData(result)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTime])

  useEffect(() => { loadData() }, [loadData])

  const isEmpty = !isLoading && !isError && data && Object.keys(data).length === 0
  const isPartial = !isLoading && !isError && !isEmpty && data &&
    (!data.incidentVolume || !data.riskTrend || !data.detectionTrend || !data.attackTrend || !data.assetRisk || !data.userRisk || !data.responseTrend)

  const lastUpdated = data?._lastUpdated

  return (
    <PageShell section="Analytics" title="Security Analytics" subtitle="Comprehensive security posture and threat landscape analysis" selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={isPartial} lastUpdated={data?._lastUpdated} onRefresh={loadData}>

      <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-3 px-3 pt-3 pb-6">

          {/* ── Page Header ─────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
                Analytics
              </p>
              <h1 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Security Analytics</h1>
              <p className="text-[9.5px] text-slate-400 mt-1">
                Comprehensive security posture and threat landscape analysis — {selectedTime}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-1">
              {lastUpdated && !isLoading && !isError && (
                <span className="text-[9.5px] text-slate-400">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
              <motion.button
                onClick={loadData}
                disabled={isLoading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-40"
              >
                <motion.div
                  animate={{ rotate: isLoading ? 360 : 0 }}
                  transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}
                >
                  <MdRefresh size={13} />
                </motion.div>
                Refresh
              </motion.button>
            </div>
          </div>

          {/* ── Partial data banner ─────────────────────────────── */}
          <AnimatePresence>
            {isPartial && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-black/5 backdrop-blur-[1px] border border-yellow-500/20 rounded-[10px] px-3 py-2"
              >
                <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
                <span className="text-[9.5px] text-yellow-300/80">
                  Some data streams are currently unavailable. Showing partial results.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Full error state ─────────────────────────────────── */}
          {isError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-12"
            >
              <div className="text-red-400/60 text-5xl">⚠</div>
              <p className="text-[11px] font-semibold text-slate-200">Unable to load analytics data</p>
              <p className="text-[9.5px] text-slate-400">The backend request failed.</p>
              <button
                onClick={loadData}
                className="mt-1 px-3 py-1.5 rounded-[6px] bg-black/5 backdrop-blur-[1px] border border-red-500/20 text-red-400 hover:border-red-500/40 hover:text-red-300 transition-all text-[9.5px] font-semibold"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* ── Dashboard Grid ─────────────────────────────────────────── */}
          {!isError && (
            <div className="flex flex-col gap-3">
              <ActSection act="act1">
                {/* Row 1: Incident Volume (Line) & Risk Trend (Line) */}
                <Row cols={2}>
                  <ChartCard
                    title="Incident Volume"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.incidentVolume}
                    modalData={data?.incidentVolume}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.incidentVolume} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#00D9FF' }} />
                        <Line type="monotone" dataKey="value" stroke="#00D9FF" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard
                    title="Risk Trend"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.riskTrend}
                    modalData={data?.riskTrend}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.riskTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#EF4444' }} />
                        <Line type="monotone" dataKey="risk" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Row>

                {/* Row 2: Detection Trend (Area) & Attack Trend (Stacked Bar) */}
                <Row cols={2}>
                  <ChartCard
                    title="Detection Trend"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.detectionTrend}
                    modalData={data?.detectionTrend}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.detectionTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#39FF6A" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#39FF6A" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#39FF6A' }} />
                        <Area type="monotone" dataKey="detections" stroke="#39FF6A" fillOpacity={1} fill="url(#colorDetections)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard
                    title="Attack Trend (Tactics)"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.attackTrend}
                    modalData={data?.attackTrend}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.attackTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="25%"  >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          shared={false}
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null

                            const item = payload[0]

                            return (
                              <div className="rounded-[8px] border border-white/[0.05] bg-black/5 backdrop-blur-[1px] px-2.5 py-2 shadow-lg">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />

                                  <span
                                    className="text-[10px] font-medium"
                                    style={{ color: item.color }}
                                  >
                                    {item.name}
                                  </span>
                                </div>

                                <div className="text-[13px] font-semibold text-white mt-1">
                                  {item.value}
                                </div>
                              </div>
                            )
                          }}
                        />

                        <Legend
                          wrapperStyle={{
                            fontSize: '9.5px',
                            paddingTop: '6px',
                          }}
                          iconType="circle"
                        />

                        {/* Phishing */}
                        <Bar
                          dataKey="phishing" name="phishing" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={18} />

                        {/* Malware */}
                        <Bar dataKey="malware" name="malware" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={18} />

                        {/* Exploit */}
                        <Bar dataKey="exploit" name="exploit" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Row>

                {/* Row 3: Asset Risk (Heatmap approx), User Risk (Bar), Response Trend (Line) */}
                <Row cols={3}>
                  <ChartCard
                    title="Asset Risk Distribution"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.assetRisk}
                    modalData={data?.assetRisk}
                  >
                    <Heatmap data={data?.assetRisk} />
                  </ChartCard>

                  <ChartCard
                    title="User Risk"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.userRisk}
                    modalData={data?.userRisk}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.userRisk} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.05)' }} itemStyle={{ color: '#F97316' }} />
                        <Bar dataKey="riskScore" fill="#F97316" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard
                    title="Response Trend"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.responseTrend}
                    modalData={data?.responseTrend}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.responseTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#8B5CF6' }} />
                        <Line type="monotone" dataKey="responses" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Row>
              </ActSection>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

