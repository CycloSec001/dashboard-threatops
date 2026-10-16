import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { 
  MdOutlineHub, MdOutlineBolt, MdOutlineCheckCircle, 
  MdOutlineGroupWork, MdOutlineLink, MdClose
} from 'react-icons/md'

import PageShell, { ActSection } from '../components/PageShell'
import { KpiBigNumber } from '../components/KpiCards'
import DetailTable from '../components/DetailTable'
import EntityGraph from '../components/EntityGraph'
import { fetchCorrelationData } from '../api/correlationApi'

const TT = { backgroundColor: '#0d1117', border: '1px solid #21262d', borderRadius: '8px', color: '#e8f0ea', fontSize: '12px' }

export default function CorrelationView({ selectedTime, setActive }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try { setData(await fetchCorrelationData(selectedTime)) }
    catch { setIsError(true) }
    finally { setIsLoading(false) }
  }, [selectedTime])

  useEffect(() => { load() }, [load])

  const isEmpty = !isLoading && !isError && !data
  const lastUpdated = data?._lastUpdated

  const kpis = [
    { key: 'correlatedEvents', title: 'Correlated Events', icon: MdOutlineHub, color: '#3b82f6' },
    { key: 'activeCorrelations', title: 'Active Correlations', icon: MdOutlineBolt, color: '#f59e0b' },
    { key: 'highConfidence', title: 'High Confidence', icon: MdOutlineCheckCircle, color: '#10b981' },
    { key: 'relatedEntities', title: 'Related Entities', icon: MdOutlineGroupWork, color: '#8b5cf6' },
    { key: 'attackChains', title: 'Attack Chains', icon: MdOutlineLink, color: '#10b981' },
  ]

  const ruleCols = [
    { header: 'Rule Name', accessor: 'name' },
    { header: 'Confidence', accessor: 'confidence', render: v => <span className="text-green-400 font-medium">{v}</span> },
    { header: 'Hits', accessor: 'hits' },
    { header: 'Status', accessor: 'status', render: v => (
      <span className={`px-2 py-0.5 rounded text-[10px] border ${v === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-orange-500/20 text-orange-400 border-orange-500/50'}`}>{v}</span>
    )},
  ]

  return (
    <PageShell
      section="DETECT"
      title="Correlation View"
      subtitle="Entity relationship mapping and multi-stage attack correlation"
      selectedTime={selectedTime}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      lastUpdated={lastUpdated}
      onRefresh={load}
    >
      <ActSection act="act1">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-5 gap-4">
          {kpis.map(kpi => (
            <KpiBigNumber
              key={kpi.key}
              title={kpi.title}
              value={data?.kpis?.[kpi.key]?.value}
              trend={data?.kpis?.[kpi.key]?.trend}
              icon={kpi.icon}
              iconColor={kpi.color}
            />
          ))}
        </div>
      </ActSection>
    </PageShell>
  )
}
