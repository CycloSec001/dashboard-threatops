import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  MdRefresh, MdWarningAmber, MdOutlineRemoveRedEye, MdOpenInNew,
} from 'react-icons/md'
import {
  BiServer, BiErrorAlt, BiError, BiGlobe, BiTargetLock,
  BiShieldQuarter, BiBug, BiHide,
} from 'react-icons/bi'
import PageShell, { ActSection } from '../components/PageShell'
import { fetchExposureKPIs } from '../api/threatOpsApi'
import DetailTable from '../components/DetailTable'
import { KpiBigNumber, KpiGauge } from '../components/KpiCards'

// ── Shared tooltip style ───────────────────────────────────────────────────────
const TT = {
  contentStyle: {
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '11px',
    padding: '6px 10px',
  },
}

// ── KPI definitions — backend-ready config ─────────────────────────────────────
// To swap in real API data, replace `dataKey` with the key your API returns.
const KPI_DEFINITIONS = [
  {
    id: 'row1',
    cards: [
      { key: 'totalAssets', title: 'Total Assets', subtitle: 'Assets in scope', icon: BiServer, iconColor: '#3b82f6', route: 'assets', col: 1 },
      { key: 'exposedAssets', title: 'Exposed Assets', subtitle: 'Assets with exposure findings', icon: BiError, iconColor: '#ef4444', route: 'assets', col: 1 },
      { key: 'criticalAssets', title: 'Critical Assets', subtitle: 'Critical assets', icon: BiErrorAlt, iconColor: '#ef4444', route: 'assets', col: 1 },
      { key: 'highRiskAssets', title: 'High-Risk Assets', subtitle: 'High-risk assets', icon: BiTargetLock, iconColor: '#f97316', route: 'assets', col: 1 },
    ]
  },
  {
    id: 'row2',
    cards: [
      { key: 'avgAssetRisk', title: 'Average Asset Risk', subtitle: 'Aggregate asset risk score', icon: BiShieldQuarter, iconColor: '#f59e0b', route: 'assets', col: 2, isGauge: true },
      { key: 'unmanagedAssets', title: 'Unmanaged Assets', subtitle: 'Assets lacking expected management', icon: BiHide, iconColor: '#8b5cf6', route: 'assets', col: 1 },
      { key: 'vulnerableAssets', title: 'Vulnerable Assets', subtitle: 'Assets with security weaknesses', icon: BiBug, iconColor: '#f59e0b', route: 'assets', col: 1 },
      { key: 'internetFacingAssets', title: 'Internet-Facing Assets', subtitle: 'Externally exposed assets', icon: BiGlobe, iconColor: '#10b981', route: 'assets', col: 1 },
    ]
  }
]

// ── Risk Score Badge ───────────────────────────────────────────────────────────
const RiskBadge = ({ score }) => {
  const color = score >= 85 ? 'bg-red-500/20 text-red-400 border-red-500/40'
    : score >= 70 ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-[4px] border text-[9.5px] font-bold uppercase tracking-wider ${color}`}>
      {score}
    </span>
  )
}

export default function Exposure({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchExposureKPIs(selectedTime)
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
    KPI_DEFINITIONS.flatMap(r => r.cards).some(k => data[k.key] === undefined)

  const riskTrend = data?.riskTrend || []
  const exposureChange = data?.exposureChange || []

  // ── Table columns config ─────────────────────────────────────────────────────
  const tableCols = [
    { header: 'Asset Name', accessor: 'name' },
    { header: 'Asset Type', accessor: 'type' },
    { header: 'Risk Score', accessor: 'riskScore', render: v => <RiskBadge score={v} /> },
    { header: 'Exposure Count', accessor: 'exposureCount' },
    {
      header: 'Critical Findings', accessor: 'criticalFindings', render: v => (
        <span className={v > 0 ? 'text-red-400 font-semibold' : 'text-slate-400'}>{v}</span>
      )
    },
    { header: 'Last Seen', accessor: 'lastSeen' },
    {
      header: 'Actions', accessor: 'name', render: () => (
        <div className="flex gap-3 text-slate-500">
          <MdOutlineRemoveRedEye
            size={14}
            className="cursor-pointer hover:text-white transition-colors"
            title="View asset"
          />
          <MdOpenInNew
            size={14}
            className="cursor-pointer hover:text-white transition-colors"
            title="Open asset"
          />
        </div>
      )
    },
  ]

  return (
    <PageShell section="Command Center" title="Exposure" subtitle="Monitor your digital attack surface and manage exposure risk." selectedTime={selectedTime} isLoading={isLoading} isError={isError} isPartial={isPartial} lastUpdated={data?._lastUpdated} onRefresh={loadData}>
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
        <div className="flex flex-col gap-3 px-4 pt-4 pb-6">

          {/* ── Page Header ────────────────────────────────────────── */}
          <div className="flex items-start justify-between">
            <div>

              <h1 className="text-[22px] font-bold text-white leading-tight">Exposure</h1>
              <p className="text-[9.5px] text-slate-400 mt-0.5">Monitor your digital attack surface and manage exposure risk — {selectedTime}</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {data?._lastUpdated && !isLoading && !isError && (
                <span className="text-[9.5px] text-slate-500">
                  Last updated: {new Date(data._lastUpdated).toLocaleTimeString()}
                </span>
              )}
              <motion.button
                onClick={loadData}
                disabled={isLoading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-[9.5px] font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-40"
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

          {/* ── Partial data banner ─────────────────────────────────── */}
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
                  Some data is currently unavailable. Showing partial results.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Full error state ─────────────────────────────────────── */}
          {isError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-4 py-20"
            >
              <div className="text-red-400/60 text-3xl">⚠</div>
              <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Unable to load Exposure data</p>
              <p className="text-[9.5px] text-slate-400">The backend request failed.</p>
              <button
                onClick={loadData}
                className="mt-1 px-3 py-1.5 rounded-[6px] bg-black/5 backdrop-blur-[1px] border border-red-500/20 text-red-400 hover:border-red-500/40 hover:text-red-300 transition-all text-[9.5px] font-semibold"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* ── KPI Grid ─────────────────────────────────────────────── */}
          {!isError && (
            <>
              {/* Row 1: 4 equal big-number cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {KPI_DEFINITIONS[0].cards.map(kpi => (
                  <div key={kpi.key} className="col-span-1">
                    <KpiBigNumber
                      title={kpi.title}
                      subtitle={kpi.subtitle}
                      icon={kpi.icon}
                      iconColor={kpi.iconColor}
                      value={isLoading ? '—' : (data?.[kpi.key] ?? 0)}
                      routeKey={kpi.route}
                      setActive={setActive}
                      dataState={
                        isLoading
                          ? 'loading'
                          : isError
                            ? 'error'
                            : isEmpty
                              ? 'empty'
                              : 'ready'
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Row 2: Average Risk gauge + 3 equal big-number cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {KPI_DEFINITIONS[1].cards.map(kpi =>
                  kpi.isGauge ? (
                    <div key={kpi.key} className="col-span-1">
                      <KpiGauge
                        title={kpi.title}
                        subtitle={kpi.subtitle}
                        icon={kpi.icon}
                        iconColor={kpi.iconColor}
                        value={isLoading ? 0 : (data?.[kpi.key] ?? 0)}
                        label={
                          data?.[kpi.key] >= 80
                            ? 'High Risk'
                            : data?.[kpi.key] >= 60
                              ? 'Medium Risk'
                              : 'Low Risk'
                        }
                        routeKey={kpi.route}
                        setActive={setActive}
                        dataState={
                          isLoading
                            ? 'loading'
                            : isError
                              ? 'error'
                              : isEmpty
                                ? 'empty'
                                : 'ready'
                        }
                      />
                    </div>
                  ) : (
                    <div key={kpi.key} className="col-span-1">
                      <KpiBigNumber
                        title={kpi.title}
                        subtitle={kpi.subtitle}
                        icon={kpi.icon}
                        iconColor={kpi.iconColor}
                        value={isLoading ? '—' : (data?.[kpi.key] ?? 0)}
                        routeKey={kpi.route}
                        setActive={setActive}
                        dataState={
                          isLoading
                            ? 'loading'
                            : isError
                              ? 'error'
                              : isEmpty
                                ? 'empty'
                                : 'ready'
                        }
                      />
                    </div>
                  )
                )}
              </div>

              {/* ── Chart Row ──────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

                {/* Risk Trend — Line Chart */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col min-h-[300px] hover:border-white/[0.12] transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Risk Trend</p>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">Risk score over time</p>
                    </div>
                    <span className="text-[9.5px] text-slate-400 bg-black/5 border border-white/[0.05] px-2 py-0.5 rounded-[4px]">
                      {selectedTime}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 mb-2">Risk Score</div>
                  <div className="flex-1 min-h-[230px]">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={riskTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="t" stroke="#64748b" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
                          <YAxis stroke="#64748b" fontSize={9.5} tickLine={false} axisLine={false} domain={[50, 90]} />
                          <Tooltip {...TT} />
                          <Line
                            type="monotone"
                            dataKey="risk"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#111827', stroke: '#3b82f6', strokeWidth: 2 }}
                            activeDot={{ r: 5, fill: '#3b82f6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Exposure Change — Dual Area Chart */}
                <div className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-3 flex flex-col min-h-[300px] hover:border-white/[0.12] transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Exposure Change</p>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">New vs resolved exposures</p>
                      <span className="text-[9.5px] text-slate-400 bg-black/5 border border-white/[0.05] px-2 py-0.5 rounded-[4px]">
                        {selectedTime}
                      </span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-px rounded-full bg-red-500" />
                      <span className="text-[9.5px] text-slate-400">New Exposures</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-px rounded-full bg-emerald-500" />
                      <span className="text-[9.5px] text-slate-400">Resolved Exposures</span>
                    </div>
                  </div>
                  <div className="text-[9.5px] text-slate-400 mb-1.5">Assets</div>
                  <div className="flex-1 min-h-[210px]">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={exposureChange} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.05} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.5} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="t" stroke="#64748b" fontSize={9.5} tickLine={false} axisLine={false} dy={3} />
                          <YAxis stroke="#64748b" fontSize={9.5} tickLine={false} axisLine={false} tickFormatter={v => v < 0 ? `${(v / 1000).toFixed(1)}K` : `${(v / 1000).toFixed(1)}K`} />
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                          <Tooltip {...TT} formatter={(v, n) => [Math.abs(v).toLocaleString(), n === 'newExposures' ? 'New Exposures' : 'Resolved']} />
                          <Area
                            type="monotone"
                            dataKey="newExposures"
                            stroke="#ef4444"
                            strokeWidth={1.5}
                            fill="url(#gradNew)"
                            dot={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="resolvedExposures"
                            stroke="#10b981"
                            strokeWidth={1.5}
                            fill="url(#gradResolved)"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Top Exposed Assets Table ──────────────────────────── */}
              {data?.topExposedAssets && (
                <DetailTable
                  title="Top Exposed Assets"
                  description={`Showing 1 to ${Math.min(5, data.topExposedAssets.length)} of ${data.topExposedAssets.length} assets`}
                  columns={tableCols}
                  data={data.topExposedAssets}
                  searchPlaceholder="Search assets..."
                />
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  )
}
