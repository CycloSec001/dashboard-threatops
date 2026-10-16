import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber } from 'react-icons/md'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts'
import { fetchKpisPageData } from '../api/threatOpsApi'
import { kpisPageSmallCards } from '../data/threatOpsKpisPageConfig'
import PageShell, { ActSection } from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import { ChartCard } from '../components/Charts'
import { customTooltip } from '../utils/mockData'

// ── Grid helpers ────────────────────────────────────────────────────────────────
function CardRow({ cols, children, minH = 130 }) {
  return (
    <div className="grid gap-3" style={{
      gridTemplateColumns: `repeat(${cols}, 1fr)`
    }}>
      {children}
    </div>
  )
}

function ChartRow({ cols, children, minH = 280 }) {
  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        minHeight: `${minH}px`,
      }}
    >
      {children}
    </div>
  )
}

// ── Section label ────────────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  )
}

export default function Kpis({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchKpisPageData(selectedTime)
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
    kpisPageSmallCards.some(k => data[k.key] === undefined)

  const lastUpdated = data?._lastUpdated

  const card = (kpi) => (
    <OverviewMetricCard
      key={kpi.key}
      config={kpi}
      value={data?.[kpi.key]}
      sparklineData={data?.[`${kpi.key}Sparkline`] || []}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onClick={() => setActive(kpi.targetRoute)}
    />
  )

  return (
    <PageShell section="Analytics" title="KPIs" subtitle="Complete security performance overview across detection, response & risk" selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={isPartial} lastUpdated={lastUpdated} onRefresh={loadData}>
      <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-3 px-3 pt-3 pb-6">

          {/* ── Page Header ─────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
                Analytics
              </p>
              <h1 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                KPIs</h1>
              <p className="text-[9.5px] text-slate-400 mt-1">
                Complete security performance overview across detection, response & risk — {selectedTime}
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
                  Some metrics are currently unavailable. Showing partial results.
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
              <p className="text-[11px] font-semibold text-slate-200">Unable to load KPI data</p>
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
                {/* ── Row 1: Big Number Cards ── */}
                <SectionLabel label="Key Metrics" />
                <CardRow cols={5} minH={130}>
                  {kpisPageSmallCards.slice(0, 5).map(card)}
                </CardRow>

                {/* ── Row 2: Gauge Cards ── */}
                <SectionLabel label="Risk & Performance" />
                <CardRow cols={5} minH={130}>
                  {kpisPageSmallCards.slice(5, 10).map(card)}
                </CardRow>

                {/* ── Row 3: Charts ── */}
                <SectionLabel label="Trend Analysis" />
                <ChartRow cols={3}>
                  {/* Detection Trend — Line */}
                  <ChartCard
                    title="Detection Trend"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.detectionTrend}
                    modalData={data?.detectionTrend}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.detectionTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#00D9FF' }} />
                        <Line type="monotone" dataKey="detections" stroke="#00D9FF" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  {/* Workload — Bar */}
                  <ChartCard
                    title="Investigation Workload"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.workloadTrend}
                    modalData={data?.workloadTrend}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.workloadTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} itemStyle={{ color: '#8B5CF6' }} />
                        <Bar dataKey="investigations" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  {/* Exposure Trend — Area */}
                  <ChartCard
                    title="Exposure Trend"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.exposureTrend}
                    modalData={data?.exposureTrend}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.exposureTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorExposure" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={6} />
                        <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#F97316' }} />
                        <Area type="monotone" dataKey="exposure" stroke="#F97316" fillOpacity={1} fill="url(#colorExposure)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </ChartRow>
              </ActSection>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

