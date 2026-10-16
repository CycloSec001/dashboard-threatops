import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber } from 'react-icons/md'
import { fetchPlaybooksKPIs } from '../api/threatOpsApi'
import { playbooksKpis } from '../data/threatOpsPlaybooksKpis'
import OverviewMetricCard from '../components/OverviewMetricCard'
import DetailTable from '../components/DetailTable'

// ── Grid Layout Helper ────────────────────────────────────────────────────────
function KpiGrid({ cols, minH = 140, children }) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridAutoRows: `minmax(${minH}px, auto)`,
      }}
    >
      {children}
    </div>
  )
}

// ── Status pill helper used in the drill-down table ───────────────────────────
function StatusPill({ value }) {
  const map = {
    'Succeeded':         'bg-htb-green/20 text-[#39FF6A]',
    'Failed':            'bg-red-500/20 text-red-400',
    'Approval Required': 'bg-orange-500/20 text-orange-400',
    'Rolled Back':       'bg-purple-500/20 text-purple-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold ${map[value] || 'bg-white/10 text-white'}`}>
      {value}
    </span>
  )
}

export default function Playbooks({ selectedTime, setActive }) {
  const [data, setData]           = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]     = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchPlaybooksKPIs(selectedTime)
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
    playbooksKpis.some(k => data[k.key] === undefined)

  const lastUpdated = data?._lastUpdated
  const isStale     = lastUpdated && (new Date() - new Date(lastUpdated)) > 5 * 60 * 1000

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
              Response
            </p>
            <h1 className="text-[26px] font-bold text-white leading-tight">Playbooks</h1>
            <p className="text-[13px] text-[#6b7280] mt-1">
              Playbook execution rates, success, approval, and rollback metrics — {selectedTime}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1">
            {lastUpdated && !isLoading && !isError && (
              <div className="flex items-center gap-2">
                {isStale && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-[4px]">
                    <MdWarningAmber size={13} /> STALE
                  </span>
                )}
                <span className="text-[11px] text-[#4a5568]">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              </div>
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
            className="flex flex-col items-center justify-center gap-4 py-20"
          >
            <div className="text-red-400/60 text-5xl">⚠</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">Unable to load Playbooks data</p>
            <p className="text-[12px] text-[#4a5568]">The backend request failed. Please try again.</p>
            <button
              onClick={loadData}
              className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ── Empty state ───────────────────────────────────────── */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20"
          >
            <div className="text-htb-green/30 text-6xl">📋</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">No Playbook Data</p>
            <p className="text-[12px] text-[#4a5568]">No playbook executions recorded for the selected time period.</p>
          </motion.div>
        )}

        {/* ── KPI Grid ─────────────────────────────────────────── */}
        {!isError && !isEmpty && (
          <>
            {/* Row 1 — Active Playbooks & Executions (Big Numbers) */}
            <KpiGrid cols={2} minH={130}>
              {playbooksKpis.slice(0, 2).map(card)}
            </KpiGrid>

            {/* Row 2 — Four Gauges */}
            <KpiGrid cols={4} minH={190}>
              {playbooksKpis.slice(2, 6).map(card)}
            </KpiGrid>

            {/* ── Execution Drill-Down Table ─────────────────────── */}
            {!isLoading && data?.drillDownData && (
              <div className="mt-2">
                <DetailTable
                  data={data.drillDownData}
                  columns={[
                    { header: 'Execution ID', accessor: 'id' },
                    { header: 'Playbook Name', accessor: 'name' },
                    {
                      header: 'Status',
                      accessor: 'status',
                      render: (val) => <StatusPill value={val} />,
                    },
                    { header: 'Trigger',   accessor: 'trigger' },
                    { header: 'Duration',  accessor: 'duration' },
                    { header: 'Last Run',  accessor: 'lastRun' },
                  ]}
                  title="Recent Playbook Executions"
                  searchPlaceholder="Search by playbook name or status..."
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
