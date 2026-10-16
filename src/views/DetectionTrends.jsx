import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber } from 'react-icons/md'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { fetchDetectionTrendsData } from '../api/threatOpsApi'
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

export default function DetectionTrends({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchDetectionTrendsData(selectedTime)
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
    (!data.detectionGrowth || !data.anomalyGrowth || !data.incidentGrowth || !data.criticalDetectionGrowth || !data.suppressionTrend)

  const lastUpdated = data?._lastUpdated

  return (
    <PageShell section="Analytics" title="Detection Trends" subtitle="Analyze the growth and changes in   detections, anomalies, and incidents" selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={isPartial} lastUpdated={data?._lastUpdated} onRefresh={loadData}>

      <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-3 px-3 pt-3 pb-6">

          {/* ── Page Header ─────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
                Analytics
              </p>
              <h1 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Detection Trends</h1>
              <p className="text-[9.5px] text-slate-400 mt-1">
                Analyze the growth and changes in detections, anomalies, and incidents — {selectedTime}
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
              <div className="flex items-center gap-3 bg-black/5 backdrop-blur-[1px] border border-yellow-500/20 rounded-[10px] px-3 py-2">
                <MdWarningAmber className="text-yellow-400 text-lg" />
                <span className="text-[9.5px] text-yellow-300/80">
                  Some data is unavailable. The dashboard may be incomplete.
                </span>
              </div>
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
                className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* ── Dashboard Grid ─────────────────────────────────────────── */}
          {!isError && (
            <div className="flex flex-col gap-3">
              <ActSection act="act1">
                {/* Row 1: Detection Growth (Line) & Anomaly Growth (Line) */}
                <Row cols={2}>
                  <ChartCard
                    title="Detection Growth"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.detectionGrowth}
                    modalData={data?.detectionGrowth}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.detectionGrowth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#00D9FF' }} />
                        <Line type="monotone" dataKey="detections" stroke="#00D9FF" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard
                    title="Anomaly Growth"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.anomalyGrowth}
                    modalData={data?.anomalyGrowth}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.anomalyGrowth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#F59E0B' }} />
                        <Line type="monotone" dataKey="anomalies" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Row>

                {/* Row 2: Incident Growth (Line) & Critical Detection Growth (Area) */}
                <Row cols={2}>
                  <ChartCard
                    title="Incident Growth"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.incidentGrowth}
                    modalData={data?.incidentGrowth}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.incidentGrowth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#F97316' }} />
                        <Line type="monotone" dataKey="incidents" stroke="#F97316" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard
                    title="Critical Detection Growth"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.criticalDetectionGrowth}
                    modalData={data?.criticalDetectionGrowth}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.criticalDetectionGrowth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#EF4444' }} />
                        <Area type="monotone" dataKey="critical" stroke="#EF4444" fillOpacity={1} fill="url(#colorCritical)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Row>

                {/* Row 3: Suppression Trend (Line) */}
                <Row cols={1}>
                  <ChartCard
                    title="Suppression Trend"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.suppressionTrend}
                    modalData={data?.suppressionTrend}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.suppressionTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#8B5CF6' }} />
                        <Line type="monotone" dataKey="suppression" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
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

