import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { MdRefresh, MdWarningAmber } from 'react-icons/md'
import { fetchMitreAttackKPIs } from '../api/threatOpsApi'
import { mitreAttackKpis } from '../data/threatOpsMitreAttackKpis'
import { ActSection } from '../components/PageShell'
import OverviewMetricCard from '../components/OverviewMetricCard'
import StandardChartCard from '../components/StandardChartCard'

// ── Shared tooltip style ───────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: '#0d1117',
    border: '1px solid #1f2937',
    borderRadius: 8,
    fontSize: 12,
    color: '#e5e7eb',
  },
  itemStyle: { color: '#e5e7eb' },
  cursor: { fill: 'rgba(255,255,255,0.04)' }
}


// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ cols, children }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`
      }}
    >
      {children}
    </div>
  )
}

export default function MitreAttack({ selectedTime, setActive }) {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]   = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchMitreAttackKPIs(selectedTime)
      setData(result)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTime])

  useEffect(() => { loadData() }, [loadData])

  const isEmpty   = !isLoading && !isError && data && Object.keys(data).length === 0
  const isPartial = !isLoading && !isError && !isEmpty && data &&
    mitreAttackKpis.some(k => data[k.key] === undefined)

  const lastUpdated  = data?._lastUpdated
  const tacticsChart = data?.tacticsChart || []

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
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      style={{
        background: `
          linear-gradient(#141B21 1px, transparent 1px),
          linear-gradient(90deg, #141B21 1px, transparent 1px),
          #0B0F12
        `,
        backgroundSize: '40px 40px',
      }}
    >
      <div className="flex flex-col gap-4 px-7 pt-6 pb-10">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
              Intelligence
            </p>
            <h1 className="text-[26px] font-bold text-white leading-tight">MITRE ATT&CK</h1>
            <p className="text-[13px] text-[#6b7280] mt-1">
              Observed tactics, mapped incident techniques, and framework coverage — {selectedTime}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1">
            {lastUpdated && !isLoading && !isError && (
              <span className="text-[11px] text-[#4a5568]">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <motion.button
              onClick={loadData}
              disabled={isLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-[#111827] border border-[#1f2937] text-[12px] font-medium text-[#9ca3af] hover:text-white hover:border-[#374151] transition-all disabled:opacity-40"
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
              className="flex items-center gap-3 bg-[#1c1a10] border border-yellow-700/40 rounded-[8px] px-4 py-2.5"
            >
              <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
              <span className="text-[12px] text-yellow-300/80">
                Some data is currently unavailable. Showing partial results.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Full error state ─────────────────────────────────── */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20"
          >
            <div className="text-red-400/60 text-5xl">⚠</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">Unable to load KPI data</p>
            <p className="text-[12px] text-[#4a5568]">The backend request failed.</p>
            <button
              onClick={loadData}
              className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ── KPI Grid ─────────────────────────────────────────── */}
        {!isError && (
          <div className="flex flex-col gap-8">
            <ActSection act="act1">
            {/* Row 1 — 3 metrics */}
            <Row cols={3}>
              {mitreAttackKpis.slice(0, 3).map(card)}
            </Row>

            {/* Row 2 — 3 metrics */}
            <Row cols={3}>
              {mitreAttackKpis.slice(3, 6).map(card)}
            </Row>

            {/* Row 3 — Tactics Observed Bar Chart */}
            <Row cols={1} minH="auto">
              <StandardChartCard title="Tactics Observed" type="bar" isLoading={isLoading} isEmpty={isEmpty || tacticsChart.length === 0}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tacticsChart} margin={{ top: 10, right: 20, left: -10, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis type="number" stroke="#4a5568" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={150} />
                    <Tooltip {...tooltipStyle} cursor={tooltipStyle.cursor} />
                    <Bar dataKey="count" fill="#00D9FF" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </StandardChartCard>
            </Row>
            </ActSection>
          </div>
        )}
      </div>
    </div>
  )
}

