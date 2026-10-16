import { useCallback, useEffect, useState } from 'react'
import PageShell from '../components/PageShell'
import CapabilityState from '../components/CapabilityState'
import api from '../api/client'
import { normalizeIncidents } from '../adapters/incidentAdapter'
import { pageFromResponse, requestState } from '../adapters/responseAdapter'

function IncidentRow({ incident }) {
  return (
    <tr className="border-b border-white/[0.06] text-xs">
      <td className="px-3 py-3 font-mono text-cyan-300">{incident.id}</td>
      <td className="px-3 py-3 text-slate-200">{incident.attackLabel}</td>
      <td className="px-3 py-3 text-slate-400">{incident.attackCategory}</td>
      <td className="px-3 py-3 text-slate-300">{incident.severity}</td>
      <td className="px-3 py-3 text-slate-400">{incident.status || 'Not provided'}</td>
      <td className="px-3 py-3 text-slate-400">{incident.isPartial ? 'Partial incident data' : incident.description}</td>
    </tr>
  )
}

export default function Incidents({ selectedTime = 'Last 24 Hours' }) {
  const [state, setState] = useState('LOADING')
  const [incidents, setIncidents] = useState([])
  const [count, setCount] = useState(0)
  const load = useCallback(async () => {
    setState('LOADING')
    try {
      const response = await api.getIncidents({ timeRange: selectedTime === 'Last 7 Days' ? '7d' : '24h', limit: 100 })
      const page = pageFromResponse(response)
      setIncidents(normalizeIncidents({ data: page.items }))
      setCount(page.count)
      setState(page.items.length ? 'SUCCESS' : 'EMPTY')
    } catch (error) {
      setState(requestState(error))
    }
  }, [selectedTime])

  useEffect(() => { load() }, [load])

  return (
    <PageShell section="ThreatOps" title="Incidents" subtitle="Tenant-scoped incidents from the CycloSec backend." selectedTime={selectedTime} onRefresh={load}>
      {state === 'LOADING' && <div className="py-12 text-center text-xs text-slate-400">Loading incidents...</div>}
      {state !== 'LOADING' && state !== 'SUCCESS' && state !== 'EMPTY' && <CapabilityState state={state} onRetry={load} />}
      {state === 'EMPTY' && <CapabilityState state="EMPTY" />}
      {(state === 'SUCCESS' || state === 'EMPTY') && incidents.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
          <div className="border-b border-white/[0.08] px-3 py-2 text-xs text-slate-400">{count} incident records available</div>
          <table className="w-full text-left">
            <thead className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-slate-500">
              <tr>{['Incident', 'Attack label', 'Category', 'Severity', 'Status', 'Description'].map(label => <th key={label} className="px-3 py-2">{label}</th>)}</tr>
            </thead>
            <tbody>{incidents.map(incident => <IncidentRow key={incident.id} incident={incident} />)}</tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}
