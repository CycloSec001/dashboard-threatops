'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const DOMAIN_CONFIG = {
  vulnerabilities: { title: 'Vulnerabilities', description: 'Authoritative vulnerability findings from configured scanners.' },
  'cloud/resources': { title: 'Cloud Dashboard', description: 'Cloud resources normalized from configured cloud connectors.' },
  'endpoint/assets': { title: 'Endpoint Dashboard', description: 'Endpoint assets normalized from endpoint telemetry.' },
  'network/observations': { title: 'Network Dashboard', description: 'Network observations normalized from network telemetry.' },
  'dark-web/observations': { title: 'Dark Web Intelligence', description: 'Provider-backed dark-web observations. No observations are shown until a source is configured.' },
  'controls/assessments': { title: 'Control Effectiveness', description: 'Tenant control assessments and evidence-backed results.' },
  'compliance/assessments': { title: 'Compliance', description: 'Framework and control assessments supplied by the configured compliance catalog.' },
  'dashboards/custom': { title: 'Custom Dashboards', description: 'Tenant dashboard definitions backed by the KPI registry.' },
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function DomainDashboard({ domain, selectedTime }) {
  const config = DOMAIN_CONFIG[domain] || { title: domain, description: 'Backend domain records.' }
  const [records, setRecords] = useState([])
  const [posture, setPosture] = useState(null)
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setState('loading')
    setError('')
    try {
      if (domain === 'security-posture') {
        const response = await api.getSecurityPosture()
        setPosture(response?.data || null)
        setRecords([])
      } else {
        const response = await api.getDomainRecords(domain, { limit: 100 })
        setRecords(Array.isArray(response?.data) ? response.data : [])
        setPosture(null)
      }
      setState('ready')
    } catch (requestError) {
      setState(requestError.status === 503 ? 'unavailable' : 'error')
      setError(requestError.message)
    }
  }, [domain, selectedTime])

  useEffect(() => { load() }, [load])

  const columns = useMemo(() => {
    const keys = new Set()
    records.forEach(record => Object.keys(record || {}).forEach(key => keys.add(key)))
    return [...keys].filter(key => !['tenant_id', 'updated_at'].includes(key)).slice(0, 8)
  }, [records])

  return (
    <section className="flex-1 min-w-0 overflow-auto p-6 text-htb-text">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="mt-1 text-sm text-htb-muted">{config.description}</p>
        </div>
        <button type="button" onClick={load} className="rounded border border-htb-border px-3 py-2 text-xs hover:bg-white/5">
          Refresh
        </button>
      </div>

      {state === 'loading' && <div className="rounded border border-htb-border bg-htb-card p-6 text-sm text-htb-muted">Loading backend data…</div>}
      {state === 'unavailable' && <div className="rounded border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200">Backend storage is unavailable. Retry when the domain service is online.</div>}
      {state === 'error' && <div className="rounded border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">{error || 'The backend rejected this request.'}</div>}

      {state === 'ready' && domain === 'security-posture' && (
        <pre className="overflow-auto rounded border border-htb-border bg-htb-card p-5 text-xs text-htb-muted">{JSON.stringify(posture, null, 2)}</pre>
      )}

      {state === 'ready' && domain !== 'security-posture' && records.length === 0 && (
        <div className="rounded border border-htb-border bg-htb-card p-6 text-sm text-htb-muted">No backend records are available for this tenant.</div>
      )}

      {state === 'ready' && records.length > 0 && (
        <div className="overflow-x-auto rounded border border-htb-border bg-htb-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-htb-border text-htb-dim">
              <tr>{columns.map(column => <th key={column} className="px-4 py-3 font-semibold uppercase tracking-wide">{column.replaceAll('_', ' ')}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-htb-border/40">
              {records.map((record, index) => (
                <tr key={record.finding_id || record.resource_id || record.endpoint_id || record.observation_id || record.assessment_id || record.dashboard_id || index}>
                  {columns.map(column => <td key={column} className="max-w-[280px] px-4 py-3 text-htb-muted">{formatValue(record[column])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
