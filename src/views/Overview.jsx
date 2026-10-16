import { useCallback, useEffect, useState } from 'react'
import PageShell from '../components/PageShell'
import CapabilityState from '../components/CapabilityState'
import api from '../api/client'
import { normalizeDashboard } from '../adapters/kpiAdapter'
import { requestState } from '../adapters/responseAdapter'

const WIDGETS = [
  ['incident_count', 'Incident count'],
  ['critical_incidents', 'Critical incidents'],
  ['anomaly_trend', 'Anomaly trend'],
  ['severity_mix', 'Severity mix'],
  ['risk_heatmap', 'Risk heatmap'],
  ['response_coverage', 'Response coverage'],
  ['dashboard_health', 'Dashboard health'],
]

export default function Overview({ selectedTime }) {
  const [state, setState] = useState('LOADING')
  const [widgets, setWidgets] = useState([])
  const load = useCallback(async () => {
    setState('LOADING')
    try {
      const response = await api.getKpiDashboard('threatops_main', selectedTime === 'Last 7 Days' ? '7d' : '24h')
      setWidgets(normalizeDashboard(response))
      setState(response?.data?.widgets?.length ? 'SUCCESS' : 'EMPTY')
    } catch (error) {
      setState(requestState(error))
    }
  }, [selectedTime])

  useEffect(() => { load() }, [load])
  const byId = Object.fromEntries(widgets.map(widget => [widget.id, widget]))

  return (
    <PageShell section="Command Center" title="Overview" subtitle="Backend-provided ThreatOps widgets only." selectedTime={selectedTime} onRefresh={load}>
      {state === 'LOADING' && <div className="py-12 text-center text-xs text-slate-400">Loading dashboard...</div>}
      {state !== 'LOADING' && state !== 'SUCCESS' && state !== 'EMPTY' && <CapabilityState state={state} onRetry={load} />}
      {state === 'EMPTY' && <CapabilityState state="EMPTY" />}
      {state === 'SUCCESS' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WIDGETS.map(([id, label]) => {
            const widget = byId[id]
            return (
              <section key={id} className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{widget?.value ?? 'Not provided'}</p>
                {!widget && <p className="mt-1 text-[11px] text-amber-300">Partial dashboard data</p>}
              </section>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
