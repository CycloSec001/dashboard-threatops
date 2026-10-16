import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

import KpiCard from '../components/KpiCard'
import DraggableCard from '../components/DraggableCard'
import SystemMonitoring from '../components/SystemMonitoring'
import { ChartCard, CHART_REGISTRY } from '../components/Charts'
import { getDashboardKpis, getTrendData, getSeverityData, getSourceData, getStatusData, customTooltip } from '../utils/mockData'

// ── localStorage helpers ────────────────────────────────────────────────────
function loadOrder(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length === fallback.length) return parsed
    }
  } catch (_) { /* ignore */ }
  return fallback
}

function saveOrder(key, order) {
  try { localStorage.setItem(key, JSON.stringify(order)) } catch (_) { /* ignore */ }
}

// ── Ghost cards for DragOverlay ─────────────────────────────────────────────
function KpiGhostCard({ card }) {
  return (
    <div
      className="dnd-overlay-card kpi-glass-card flex flex-col justify-center rounded-[12px] border border-white/[0.12] px-4 py-3 relative overflow-hidden"
      style={{ boxShadow: '0 12px 36px rgba(0,0,0,0.5)' }}
    >
      <div className="absolute top-0 left-0 w-full h-0.5 z-10" style={{ backgroundColor: card.color, opacity: 0.8 }} />
      <span className="text-[12px] font-semibold text-slate-200 uppercase tracking-wider mb-2 relative z-10 leading-[1.25]">{card.title}</span>
      <span className="text-3xl font-bold text-white leading-none whitespace-nowrap relative z-10">{card.value}</span>
      <div className="flex items-center gap-2 mt-2 text-[12px] relative z-10">
        <span className="font-semibold" style={{ color: card.color }}>{card.trend}</span>
        <span className="text-slate-400">{card.subtext}</span>
      </div>
    </div>
  )
}

function ChartGhostCard({ title }) {
  return (
    <div
      className="dnd-overlay-card glass-panel rounded-[14px] p-5 h-[280px] flex flex-col"
    >
      <span className="text-[14px] font-semibold text-white">{title}</span>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-white/20 border-dashed opacity-40" />
      </div>
    </div>
  )
}

// ── Inline chart card — renders chart content per ID ───────────────────────
function ChartCardWithData({ id, title, selectedTime, dragHandleProps = null }) {
  const trendData    = useMemo(() => getTrendData(selectedTime),    [selectedTime])
  const severityData = useMemo(() => getSeverityData(selectedTime), [selectedTime])
  const sourceData   = useMemo(() => getSourceData(selectedTime),   [selectedTime])
  const statusData   = useMemo(() => getStatusData(selectedTime),   [selectedTime])

  const renderContent = () => {
    switch (id) {
      case 'trend':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" vertical={false} />
              <XAxis dataKey="time" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#39FF6A' }} />
              <Line
                type="monotone" dataKey="threats" stroke="#39FF6A" strokeWidth={2}
                dot={{ r: 3, fill: '#11171C', stroke: '#39FF6A', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'severity':
        return (
          <>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="#0B0F12" strokeWidth={2}>
                  {severityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 flex-wrap">
              {severityData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-htb-muted">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </>
        )

      case 'source':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1A232C" horizontal={false} />
              <XAxis type="number" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey="country" type="category" stroke="#7B8A96" fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={customTooltip} cursor={{ fill: 'rgba(57,255,106,0.05)' }} />
              <Bar dataKey="attacks" radius={[0, 4, 4, 0]} barSize={16}>
                {sourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      case 'status':
        return (
          <>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="#0B0F12" strokeWidth={2}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={customTooltip} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 flex-wrap">
              {statusData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-htb-muted">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </>
        )

      default:
        return null
    }
  }

  const typeMap = { trend: 'line', severity: 'pie', source: 'bar', status: 'pie' }

  return (
    <ChartCard title={title} type={typeMap[id] || 'default'} dragHandleProps={dragHandleProps}>
      {renderContent()}
    </ChartCard>
  )
}

// ── Dashboard (default export) ──────────────────────────────────────────────
export default function Dashboard({ selectedTime = 'Last 24 Hours', isEditable = false, dashboardConfig = null }) {
  const allKpis = useMemo(() => {
    const raw = getDashboardKpis(selectedTime)
    return Array.isArray(raw) ? raw : Object.values(raw || {})
  }, [selectedTime])
  
  const kpis = useMemo(() => {
    if (dashboardConfig && dashboardConfig.selectedKpis) {
      return allKpis.filter(k => dashboardConfig.selectedKpis.includes(k?.id))
    }
    return allKpis
  }, [allKpis, dashboardConfig])

  // Stable ID arrays
  const kpiIds   = useMemo(() => (Array.isArray(kpis) ? kpis : []).map(k => k?.id).filter(Boolean), [kpis])
  const chartIds = useMemo(() => Object.keys(CHART_REGISTRY), [])

  // Scoped Keys
  const LS_KPI_KEY   = dashboardConfig ? `dash_${dashboardConfig.id}_kpi_order`   : 'dashboard_kpi_order'
  const LS_CHART_KEY = dashboardConfig ? `dash_${dashboardConfig.id}_chart_order` : 'dashboard_chart_order'
  const LS_KPI_SIZES = dashboardConfig ? `dash_${dashboardConfig.id}_kpi_sizes`   : 'dashboard_kpi_sizes'

  // Ordered lists and sizes (persisted in localStorage)
  const [kpiOrder,   setKpiOrder]   = useState(() => loadOrder(LS_KPI_KEY,   kpiIds))
  const [chartOrder, setChartOrder] = useState(() => loadOrder(LS_CHART_KEY, chartIds))
  const [kpiSizes,   setKpiSizes]   = useState(() => loadOrder(LS_KPI_SIZES, {}))

  // Active drag ID drives the DragOverlay ghost card
  const [activeId, setActiveId] = useState(null)

  // Sensors — pointer (desktop/touch) + keyboard (a11y)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // 6px to prevent click vs. drag ambiguity
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Guard: keep kpiOrder valid if KPI list changes (e.g. time filter or custom dashboard update)
  const safeKpiOrder = useMemo(() => {
    const valid = kpiOrder.filter(id => kpiIds.includes(id))
    const added = kpiIds.filter(id => !kpiOrder.includes(id))
    return [...valid, ...added]
  }, [kpiOrder, kpiIds])

  // Quick lookup maps
  const kpiMap = useMemo(() => Object.fromEntries((Array.isArray(kpis) ? kpis : []).filter(k => k && k.id).map(k => [k.id, k])), [kpis])

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    if (kpiIds.includes(active.id)) {
      setKpiOrder(prev => {
        const next = arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id))
        saveOrder(LS_KPI_KEY, next)
        return next
      })
    } else if (chartIds.includes(active.id)) {
      setChartOrder(prev => {
        const next = arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id))
        saveOrder(LS_CHART_KEY, next)
        return next
      })
    }
  }, [kpiIds, chartIds, LS_KPI_KEY, LS_CHART_KEY])

  const handleDragCancel = useCallback(() => setActiveId(null), [])

  const handleKpiResize = useCallback((id) => {
    setKpiSizes(prev => {
      const current = prev[id] || 1
      const next = current === 1 ? 2 : current === 2 ? 4 : 1
      const updated = { ...prev, [id]: next }
      saveOrder(LS_KPI_SIZES, updated)
      return updated
    })
  }, [LS_KPI_SIZES])

  // Active card data for overlay
  const activeKpi   = activeId && kpiMap[activeId]        ? kpiMap[activeId]        : null
  const activeChart = activeId && CHART_REGISTRY[activeId] ? CHART_REGISTRY[activeId] : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto bg-grid"
      style={{
        backgroundColor: '#070B11',
      }}
    >
      <div className="flex flex-col gap-5 px-8 pb-8 pt-4">

        <SystemMonitoring />

        {isEditable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {/* 2. KPI Cards row */}
            <SortableContext items={safeKpiOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {safeKpiOrder.map((id) => {
                  const card = kpiMap[id]
                  if (!card) return null
                  const spanClass = `col-span-${kpiSizes[id] || 1}`
                  return (
                    <DraggableCard key={id} id={id} className={spanClass}>
                      {({ handleProps }) => (
                        <KpiCard 
                          {...card} 
                          dragHandleProps={handleProps} 
                          selectedTime={selectedTime} 
                          onResize={() => handleKpiResize(id)} 
                        />
                      )}
                    </DraggableCard>
                  )
                })}
              </div>
            </SortableContext>

            {/* 3. Chart Cards grid (2 columns) */}
            <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                {chartOrder.map((id) => {
                  const meta = CHART_REGISTRY[id]
                  if (!meta) return null
                  return (
                    <DraggableCard key={id} id={id}>
                      {({ handleProps }) => (
                        <ChartCardWithData
                          id={id}
                          title={meta.title}
                          selectedTime={selectedTime}
                          dragHandleProps={handleProps}
                        />
                      )}
                    </DraggableCard>
                  )
                })}
              </div>
            </SortableContext>

            {/* Ghost card shown while dragging */}
            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activeKpi   && <KpiGhostCard   card={activeKpi} />}
              {activeChart && <ChartGhostCard title={activeChart.title} />}
            </DragOverlay>
          </DndContext>
        ) : (
          <>
            {/* 2. KPI Cards row (Fixed) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {kpiIds.map((id) => {
                const card = kpiMap[id]
                if (!card) return null
                const spanClass = `col-span-${kpiSizes[id] || 1}`
                return (
                  <div key={id} className={spanClass}>
                    <KpiCard {...card} selectedTime={selectedTime} />
                  </div>
                )
              })}
            </div>

            {/* 3. Chart Cards grid (Fixed) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
              {chartIds.map((id) => {
                const meta = CHART_REGISTRY[id]
                if (!meta) return null
                return (
                  <ChartCardWithData
                    key={id}
                    id={id}
                    title={meta.title}
                    selectedTime={selectedTime}
                  />
                )
              })}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
