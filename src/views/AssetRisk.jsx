import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber, MdSearch, MdFilterList, MdCalendarToday, MdArrowForward } from 'react-icons/md'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell
} from 'recharts'
import { fetchAssetRiskKPIs } from '../api/threatOpsApi'
import { assetRiskKpis } from '../data/threatOpsAssetRiskKpis'
import OverviewMetricCard from '../components/OverviewMetricCard'
import StandardChartCard from '../components/StandardChartCard'
import DetailTable from '../components/DetailTable'

// ── Shared UI Helpers ────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: '#0d1117',
    border: '1px solid #1f2937',
    borderRadius: 8,
    fontSize: 12,
    color: '#e5e7eb',
  },
  itemStyle: { color: '#e5e7eb' },
}

function Row({ cols, children, className = '' }) {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {children}
    </div>
  )
}

const RiskBadge = ({ val }) => {
  const v = String(val).toLowerCase()
  let color = 'text-gray-400 bg-gray-500/10 border-gray-500/20'
  if (v === 'critical') color = 'text-red-400 bg-red-500/10 border-red-500/20'
  else if (v === 'high') color = 'text-orange-400 bg-orange-500/10 border-orange-500/20'
  else if (v === 'medium') color = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  else if (v === 'low') color = 'text-blue-400 bg-blue-500/10 border-blue-500/20'

  return (
    <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {val}
    </span>
  )
}

const DonutChartBase = ({ data, totalLabel }) => {
  const total = useMemo(() => data?.reduce((acc, curr) => acc + curr.value, 0) || 0, [data])
  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" stroke="#0B0F12" strokeWidth={2}>
              {data?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle.contentStyle} itemStyle={{ color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-15%' }}>
          <span className="text-[20px] font-bold text-white leading-tight">{total.toLocaleString()}</span>
          <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">{totalLabel}</span>
        </div>
      </div>
      <div className="flex justify-center gap-x-4 gap-y-2 flex-wrap pb-2">
        {data?.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
            {d.name} <span className="font-semibold text-[#d1d5db] ml-0.5">{d.value.toLocaleString()}</span>
            <span className="text-[#6b7280] text-[10px]">({((d.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AssetRisk({ selectedTime, setActive }) {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await fetchAssetRiskKPIs(selectedTime)
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
    assetRiskKpis.some(k => data[k.key] === undefined)

  const isStale = false // Backend mock sets lastUpdated, but for visual we can trigger stale logic if needed
  const lastUpdated = data?._lastUpdated
  const riskChangeChart = data?.riskChangeChart || []

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

  // ── Table Definitions ──────────────────────────────────────────────────────
  const topAssetsCols = [
    { accessor: 'assetName', header: 'Asset Name' },
    { accessor: 'assetType', header: 'Asset Type' },
    { accessor: 'assetGroup', header: 'Asset Group' },
    { accessor: 'riskScore', header: 'Risk Score' },
    { accessor: 'riskLevel', header: 'Risk Level', render: (val) => <RiskBadge val={val} /> },
    { accessor: 'activeIncidents', header: 'Active Incidents' },
    { accessor: 'lastSeen', header: 'Last Seen' }
  ]

  const activeIncidentsCols = [
    { accessor: 'assetName', header: 'Asset Name' },
    { accessor: 'assetType', header: 'Asset Type' },
    { accessor: 'riskScore', header: 'Risk Score' },
    { accessor: 'riskLevel', header: 'Risk Level', render: (val) => <RiskBadge val={val} /> },
    { accessor: 'latestIncident', header: 'Latest Incident' },
    { accessor: 'severity', header: 'Severity', render: (val) => <RiskBadge val={val} /> },
    { accessor: 'lastSeen', header: 'Last Seen' }
  ]

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
      <div className="flex flex-col gap-6 px-7 pt-6 pb-12">
        
        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-white leading-tight">Asset Risk</h1>
            <p className="text-[13px] text-[#6b7280] mt-1">
              Monitor asset risk posture and identify your highest-risk assets.
            </p>
          </div>
        </div>

        {/* ── Top Toolbar / Filters ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] border border-[#1f2937] p-3 rounded-[10px]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date/Time Filter Mock */}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#1a2332] border border-[#2d3748] text-[12px] font-medium text-white hover:border-[#4a5568] transition-colors">
              <MdCalendarToday size={14} className="text-[#9ca3af]" />
              <span>{selectedTime}</span>
            </button>
            {/* Advanced Filters Dropdown Mock */}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#1a2332] border border-[#2d3748] text-[12px] font-medium text-white hover:border-[#4a5568] transition-colors">
              <MdFilterList size={14} className="text-[#9ca3af]" />
              <span>Filters</span>
            </button>
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#1a2332] border border-[#2d3748] focus-within:border-[#4a5568] transition-colors">
              <MdSearch size={14} className="text-[#9ca3af]" />
              <input 
                type="text" 
                placeholder="Search Assets..." 
                className="bg-transparent border-none outline-none text-[12px] text-white placeholder-[#6b7280] w-[180px]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdated && !isLoading && !isError && (
              <div className="flex items-center gap-2">
                {isStale && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-[4px]">
                    <MdWarningAmber size={12} /> STALE
                  </span>
                )}
                <span className="text-[11px] text-[#4a5568] hidden sm:block">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            )}
            <motion.button
              onClick={loadData}
              disabled={isLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-htb-green/10 border border-htb-green/30 text-[12px] font-medium text-htb-green hover:bg-htb-green/20 transition-all disabled:opacity-40"
            >
              <motion.div
                animate={{ rotate: isLoading ? 360 : 0 }}
                transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}
              >
                <MdRefresh size={14} />
              </motion.div>
              Refresh
            </motion.button>
          </div>
        </div>

        {/* ── Partial data / Error states ────────────────────────────── */}
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

        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20 bg-[#111827] rounded-[10px] border border-red-900/30"
          >
            <div className="text-red-400/60 text-5xl">⚠</div>
            <p className="text-[15px] font-semibold text-[#9ca3af]">Unable to load Asset Risk data</p>
            <button
              onClick={loadData}
              className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ── Dashboard Content ──────────────────────────────────────── */}
        {!isError && (
          <div className="flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="flex flex-col gap-4">
              {/* Row 1 — 3 Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {assetRiskKpis.slice(0, 3).map(card)}
              </div>
              
              {/* Row 2 — 2 Big Numbers (left) + Risk Change Line chart (right) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[240px]">
                {/* Left: 2 stacked Big Number cards */}
                <div className="flex flex-col gap-4 xl:col-span-1 h-full">
                  {assetRiskKpis.slice(3, 5).map(kpi => (
                    <div key={kpi.key} className="flex-1">
                      {card(kpi)}
                    </div>
                  ))}
                </div>

                {/* Right: Risk Change line chart */}
                <div className="xl:col-span-2 h-[260px] xl:h-auto">
                  <StandardChartCard
                    title="Risk Change"
                    type="line"
                    isLoading={isLoading}
                    isEmpty={isEmpty || riskChangeChart.length === 0}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={riskChangeChart} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="t" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis domain={[40, 90]} stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip {...tooltipStyle} />
                        <ReferenceLine y={70} stroke="#EF444440" strokeDasharray="4 4" label={{ value: 'High', fill: '#EF4444', fontSize: 10, position: 'right' }} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#F97316"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#111827', stroke: '#F97316', strokeWidth: 2 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </StandardChartCard>
                </div>
              </div>
            </div>

            {/* Tables Row 1: High Risk Assets & Risk Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 min-w-0">
                <DetailTable 
                  title="Highest-Risk Assets" 
                  columns={topAssetsCols} 
                  data={data?.topHighestRiskAssetsData} 
                  searchable={false}
                />
              </div>
              <div className="xl:col-span-1 min-w-0 flex flex-col">
                <div className="flex flex-col flex-1 bg-[#111827] border border-[#1f2937] rounded-[10px] overflow-hidden min-h-[350px]">
                  <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
                    <h3 className="text-[13px] font-semibold text-[#d1d5db]">Asset Risk Distribution</h3>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full animate-pulse">
                        <div className="w-32 h-32 bg-white/5 rounded-full" />
                      </div>
                    ) : (
                      <DonutChartBase data={data?.riskDistributionData} totalLabel="Assets" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tables Row 2: Assets with Active Incidents */}
            <div className="grid grid-cols-1 gap-4">
              <div className="min-w-0">
                <DetailTable 
                  title="Assets With Active Incidents" 
                  columns={activeIncidentsCols} 
                  data={data?.assetsWithActiveIncidentsData} 
                  searchable={false}
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

