import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber } from 'react-icons/md'
import {
  BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts'
import { fetchAiDecisionsData } from '../api/threatOpsApi'
import { aiDecisionsKpis } from '../data/threatOpsAiDecisionsKpis'
import PageShell, { ActSection } from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import { ChartCard } from '../components/Charts'
import { customTooltip } from '../utils/mockData'

// ── Row helpers ───────────────────────────────────────────────────────────────
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
    <div className="grid gap-3" style={{
      gridTemplateColumns: `repeat(${cols}, 1fr)`
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ label, color = '#4a5568' }) {
  return (
    <div className="flex items-center gap-3 mt-1">
      <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: color + '30' }} />
    </div>
  )
}

// ── Custom Donut label ────────────────────────────────────────────────────────
function DonutLegend({ data }) {
  const total = data.reduce((a, b) => a + b.value, 0)
  return (
    <div className="flex flex-col gap-1.5 justify-center pl-4">
      {data.map((d, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[10px] text-[#9ca3af]">{d.name}</span>
          </div>
          <span className="text-[10px] font-semibold text-white">{d.value}</span>
        </div>
      ))}
      <div className="border-t border-[#1f2937] pt-1.5 mt-0.5 flex items-center justify-between">
        <span className="text-[9px] text-[#6b7280]">Total</span>
        <span className="text-[10px] font-bold text-white">{total.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function AiDecisions({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchAiDecisionsData(selectedTime)
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
    aiDecisionsKpis.some(k => data[k.key] === undefined)

  const lastUpdated = data?._lastUpdated

  const card = (kpi) => (
    <OverviewMetricCard
      key={kpi.key}
      config={kpi}
      value={data?.[kpi.key]}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onClick={() => setActive(kpi.targetRoute)}
    />
  )

  return (
    <PageShell section="AI Operations" title="AI Decisions" subtitle="Monitor AI engine decision volume, confidence distribution and recommended actions" selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={isPartial} lastUpdated={data?._lastUpdated} onRefresh={loadData}>

      <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-3 px-3 pt-3 pb-6">

          {/* ── Page Header ─────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
                AI
              </p>
              <h1 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">AI Decisions</h1>
              <p className="text-[9.5px] text-slate-400 mt-0.5">
                AI engine decision volume, confidence distribution and recommended action breakdown — {selectedTime}
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
                className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-40"
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
              <p className="text-[11px] font-semibold text-slate-200">Unable to load AI Decisions data</p>
              <p className="text-[9.5px] text-slate-400">The backend request failed.</p>
              <button
                onClick={loadData}
                className="mt-1 px-3 py-1.5 rounded-[6px] bg-black/5 backdrop-blur-[1px] border border-red-500/20 text-red-400 hover:border-red-500/40 hover:text-red-300 transition-all text-[9.5px] font-semibold"
              >
                Retry
              </button>
            </motion.div>
          )}

          {!isError && (
            <div className="flex flex-col gap-3">
              <ActSection act="act1">
                {/* ── Row 1: KPI Cards (4-col) ─────────────────────── */}
                <SectionLabel label="Decision Metrics" color="#00D9FF" />
                <CardRow cols={4} minH={130}>
                  {aiDecisionsKpis.map(card)}
                </CardRow>

                {/* ── Row 2: Charts (2-col) ────────────────────────── */}
                <SectionLabel label="Decision Breakdown" color="#8B5CF6" />
                <ChartRow cols={2}>
                  {/* Donut: Decisions by Severity */}
                  <ChartCard
                    title="Decisions by Severity"
                    className="!bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] hover:!bg-black/20 hover:border-white/[0.12] transition-colors"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.decisionsBySeverity}
                    modalData={data?.decisionsBySeverity?.map(({ name, value }) => ({ name, value }))}
                  >
                    <div className="flex flex-col sm:flex-row items-center h-full gap-2">
                      <div className="w-full sm:w-[60%] h-[200px] sm:h-full flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data?.decisionsBySeverity}
                              cx="50%" cy="50%"
                              innerRadius="50%" outerRadius="80%"
                              dataKey="value" stroke="none"
                            >
                              {data?.decisionsBySeverity?.map((e, i) => (
                                <Cell key={i} fill={e.color} />
                              ))}
                            </Pie>

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
                                        style={{
                                          backgroundColor: item.payload?.color || item.color
                                        }}
                                      />

                                      <span className="text-[9.5px] font-semibold text-slate-200">
                                        {item.name}
                                      </span>
                                    </div>

                                    <div className="text-[13px] font-bold text-white mt-1">
                                      {Number(item.value).toLocaleString()}
                                    </div>
                                  </div>
                                )
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {data?.decisionsBySeverity && (
                        <div className="w-full sm:w-[40%] min-w-0">
                          <DonutLegend data={data.decisionsBySeverity} />
                        </div>
                      )}
                    </div>
                  </ChartCard>

                  {/* Bar: Recommended Actions */}
                  <ChartCard
                    title="Recommended Actions"
                    className="!bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] hover:!bg-black/20 hover:border-white/[0.12] transition-colors"
                    isLoading={isLoading}
                    isEmpty={isEmpty || !data?.recommendedActions}
                    modalData={data?.recommendedActions?.map(({ name, value }) => ({ name, value }))}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data?.recommendedActions}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                        <XAxis type="number" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
                        <YAxis
                          dataKey="name" type="category"
                          stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false}
                          width={80}
                        />
                        <RechartsTooltip
                          shared={false}
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null

                            const item = payload[0]

                            return (
                              <div className="rounded-[8px] border border-white/[0.05] bg-black/5 backdrop-blur-[1px] px-2.5 py-2 shadow-lg">
                                <div className="text-[9.5px] font-semibold text-slate-200">
                                  {item.name}
                                </div>

                                <div className="text-[13px] font-bold text-white mt-1">
                                  {Number(item.value).toLocaleString()}
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                          {data?.recommendedActions?.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Bar>
                      </BarChart>
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

