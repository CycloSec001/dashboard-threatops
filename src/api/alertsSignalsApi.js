import api from './client'

const ranges = { 'Last 24 Hours': '24h', 'Last 7 Days': '7d', 'Last 30 Days': '30d', 'Last 90 Days': '90d' }

export function normalizeEvent(event) {
  if (!event || typeof event !== 'object') return null

  const id = event.event?.id || event.event_id || event.id || 'N/A'

  const rawTime = event.event?.occurred_at || event.timestamp || event.occurred_at || event.time
  let time = 'N/A'
  if (rawTime) {
    const dt = new Date(typeof rawTime === 'number' && rawTime < 1e12 ? rawTime * 1000 : rawTime)
    time = isNaN(dt.getTime()) ? String(rawTime) : dt.toLocaleString()
  }

  const name = event.event?.type || event.event_type || event.name || event.action || 'N/A'
  const source = event.transport?.source?.name || event.source || event.transport?.source?.component || event.event?.domain || 'N/A'
  const type = event.event?.category || event.event_category || event.category || event.event?.domain || 'N/A'

  const rawSev = String(event.event?.severity || event.severity || 'Medium').toLowerCase()
  const severity = rawSev === 'critical' ? 'Critical'
    : rawSev === 'high' ? 'High'
    : rawSev === 'medium' ? 'Medium'
    : rawSev === 'low' ? 'Low'
    : rawSev.charAt(0).toUpperCase() + rawSev.slice(1)

  const riskScore = event.enrichment?.risk?.score ?? event.risk_score ?? event.riskScore ?? 'N/A'
  const status = event.status || (event.validation?.is_valid ? 'Valid' : (event.validation ? 'Invalid' : 'New'))

  let correlated = 'N/A'
  if (event.correlated != null) {
    correlated = event.correlated ? 'Yes' : 'No'
  } else if (event.enrichment?.correlation) {
    correlated = (event.enrichment.correlation.is_correlated || event.enrichment.correlation.incident_id) ? 'Yes' : 'No'
  } else {
    correlated = 'No'
  }

  let anomaly = 'N/A'
  if (event.anomaly != null) {
    anomaly = event.anomaly ? 'Yes' : 'No'
  } else if (event.enrichment?.anomaly) {
    anomaly = (event.enrichment.anomaly.is_anomaly || (event.enrichment.anomaly.score != null && event.enrichment.anomaly.score > 0.7)) ? 'Yes' : 'No'
  } else {
    anomaly = 'No'
  }

  const incident = event.incident_id || event.enrichment?.correlation?.incident_id || 'N/A'

  return {
    id,
    time,
    name,
    source,
    type,
    severity,
    riskScore,
    status,
    correlated,
    anomaly,
    incident,
    raw: event,
  }
}

export async function fetchAlertsSignalsData(timeFilter) {
  const [events, metrics] = await Promise.all([
    api.getEvents({ timeRange: ranges[timeFilter] || '24h', limit: 50 }),
    api.getKpiMetrics({ timeRange: ranges[timeFilter] || '24h', category: 'detection' }),
  ])
  const metricRecords = Array.isArray(metrics?.data) ? metrics.data : []
  const findMetric = key => metricRecords.find(metric => String(metric.kpi_id || '').includes(key) || String(metric.name || '').toLowerCase().includes(key))
  const metric = key => {
    const value = findMetric(key)
    return value ? { value: value.value, trend: value.trend, sparkline: value.chart || [], label: value.unit } : null
  }
  return {
    kpis: {
      totalSignals: metric('signal') || metric('incident') || metric('anomaly'),
      criticalSignals: metric('critical'),
      anomalies: metric('anomal'),
      suppressedSignals: metric('suppress'),
      correlatedSignals: metric('correlat'),
      signalToIncidentRatio: metric('incident'),
      suppressionRate: metric('suppress'),
      averageSignalRisk: metric('risk'),
    },
    newSignalsTrend: [],
    recentSignals: (events?.data || []).map(normalizeEvent).filter(Boolean),
    totalCount: events?.metadata?.total_records ?? events?.count ?? 0,
    _lastUpdated: new Date().toISOString(),
  }
}
