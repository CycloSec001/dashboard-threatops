import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber } from 'react-icons/md'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'
import { fetchEnginesConfidenceData } from '../api/threatOpsApi'
import { enginesConfidenceKpis } from '../data/threatOpsEnginesConfidenceKpis'
import PageShell, { ActSection } from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import { ChartCard } from '../components/Charts'
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

export default function EnginesConfidence({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchEnginesConfidenceData(selectedTime)
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
    enginesConfidenceKpis.some(k => data[k.key] === undefined)

  const lastUpdated = data?._lastUpdated

  const card = (kpi) => {
    // For RAG indicators, inject the color from the data dynamically if it exists
    const config = { ...kpi }
    if (kpi.visualization === 'rag-indicator') {
      config.color = data?.[`${kpi.key}Color`] || kpi.color
    }

    return (
      <OverviewMetricCard
        key={kpi.key}
        config={config}
        value={data?.[kpi.key]}
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onClick={() => setActive(kpi.targetRoute)}
      />
    )
  }

  return (
    <PageShell section="AI Operations" title="Engines & Confidence" subtitle="Monitor AI processing engine health, operational status, and confidence levels" selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={isPartial} lastUpdated={data?._lastUpdated} onRefresh={loadData}>

      <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-3 px-3 pt-3 pb-6">

          {/* ── Page Header ─────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">
                AI
              </p>
              <h1 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                Engines & Confidence
              </h1>

              <p className="text-[9.5px] text-slate-400 mt-0.5">
                Monitor AI processing engine health, operational status, and confidence levels — {selectedTime}
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
              <p className="text-[11px] font-semibold text-slate-200">Unable to load Engine data</p>
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
                {/* ── Row 1: Top 5 KPIs ─────────────────────────────── */}
                <Row cols={5}>
                  {enginesConfidenceKpis.slice(0, 5).map(card)}
                </Row>

                {/* ── Row 2: Chart ───────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-2">

                  <div className="w-full min-w-0">
                    <ChartCard
                      className="w-full"
                      title="Data Throughput"
                      isLoading={isLoading}
                      isEmpty={isEmpty || !data?.dataThroughput}
                      modalData={data?.dataThroughput}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={data?.dataThroughput}
                          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis dataKey="time" stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
                          <YAxis stroke="#6b7280" fontSize={9.5} tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#00D9FF' }} />
                          <Line type="monotone" dataKey="throughput" stroke="#00D9FF" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>
                </div>
              </ActSection>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

