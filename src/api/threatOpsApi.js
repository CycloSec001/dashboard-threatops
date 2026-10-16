import api from './client'

const TIME_RANGES = {
  'Last 24 Hours': '24h',
  'Last 7 Days': '7d',
  'Last 30 Days': '30d',
  'Last 90 Days': '90d',
}

const timeRange = value => TIME_RANGES[value] || '24h'
const emptyPage = () => ({ data: [], count: 0, next_cursor: null, has_more: false })

function metricIndex(response) {
  const records = Array.isArray(response?.data) ? response.data : []
  return records.reduce((index, metric) => {
    const identifiers = [metric.kpi_id, metric.name].filter(Boolean).map(value => String(value).toLowerCase())
    identifiers.forEach(identifier => { index[identifier] = metric })
    return index
  }, {})
}

const KEY_TO_KPI_CANDIDATES = {
  signal: ['incident_count_24h', 'anomaly_count_24h', 'high_anomaly_count_24h'],
  incident: ['incident_count_24h', 'critical_incident_count_24h', 'high_incident_count_24h'],
  critical: ['critical_incident_count_24h', 'critical_anomaly_count_24h'],
  high: ['high_incident_count_24h', 'high_anomaly_count_24h'],
  anomaly: ['anomaly_count_24h', 'avg_anomaly_score_24h', 'anomaly_hourly_trend_24h'],
  risk: ['overall_risk_score_24h', 'dashboard_health_score_24h', 'host_risk_heatmap_24h'],
  automation: ['response_coverage_rate_24h', 'automation_coverage_pct_24h', 'playbook_success_rate_24h'],
  response: ['mttr_minutes_24h', 'response_coverage_rate_24h', 'action_count_24h'],
  coverage: ['response_coverage_rate_24h', 'coverage_rate_24h'],
  latency: ['mean_detection_time_minutes_24h', 'automation_latency_minutes_24h'],
  action: ['action_count_24h', 'successful_action_rate_24h'],
  hunting: ['threat_intel_matches_24h', 'ioc_match_count_24h'],
  ioc: ['ioc_match_count_24h', 'active_ioc_count_24h'],
  threat: ['threat_incident_count_24h', 'active_threat_actor_count_24h'],
  actor: ['active_threat_actor_count_24h', 'threat_actor_count_24h'],
  campaign: ['active_campaign_count_24h', 'campaign_count_24h'],
  mitre: ['attack_technique_distribution_24h'],
  asset: ['monitored_asset_count_24h', 'critical_asset_incident_count_24h'],
  exposure: ['external_exposure_score_24h'],
  ueba: ['high_risk_user_count_24h', 'avg_anomaly_score_24h', 'anomaly_count_24h'],
  policy: ['policy_compliance_rate_24h'],
  compliance: ['policy_compliance_rate_24h', 'tenant_sla_compliance_rate_24h'],
  audit: ['audit_activity_count_24h'],
  evidence: ['verified_evidence_ratio_24h'],
  detection: ['anomaly_count_24h', 'incident_count_24h'],
  mttd: ['mean_detection_time_minutes_24h'],
  mttr: ['mttr_minutes_24h'],
}

function metricFor(index, key) {
  const normalized = key.toLowerCase()
  const exact = index[normalized]
  if (exact) return exact

  const candidates = KEY_TO_KPI_CANDIDATES[normalized] || []
  for (const candidate of candidates) {
    if (index[candidate.toLowerCase()]) {
      return index[candidate.toLowerCase()]
    }
  }

  const match = Object.entries(index).find(([identifier]) => identifier.includes(normalized) || normalized.includes(identifier))
  return match?.[1] || null
}

async function fetchPage(timeFilter, keys = [], extra = {}) {
  const response = await api.getKpiMetrics({ timeRange: timeRange(timeFilter) })
  const index = metricIndex(response)
  const kpis = Object.fromEntries(keys.map(key => {
    const metric = metricFor(index, key)
    return [key, metric ? {
      value: metric.value,
      trend: metric.trend,
      sparkline: Array.isArray(metric.chart) ? metric.chart : [],
      label: metric.unit,
      description: metric.description,
    } : null]
  }))
  return { ...extra, kpis, _lastUpdated: new Date().toISOString() }
}

export async function fetchOverviewKPIs(timeFilter = 'Last 24 Hours') {
  const ids = ['incident_count_24h', 'critical_incident_count_24h', 'anomaly_count_24h', 'automation_coverage_pct_24h']
  const metrics = await Promise.all(ids.map(id => api.getKpiMetric(id, timeRange(timeFilter))))
  const values = Object.fromEntries(metrics.map((response, index) => [ids[index], response?.data?.value ?? null]))
  return {
    incidentCount: values.incident_count_24h,
    criticalIncidentCount: values.critical_incident_count_24h,
    anomalyCount: values.anomaly_count_24h,
    automationCoverage: values.automation_coverage_pct_24h,
    _lastUpdated: new Date().toISOString(),
  }
}

export async function fetchExposureKPIs(timeFilter) {
  return fetchPage(timeFilter, ['asset', 'exposure', 'risk'], { riskTrend: [], exposureChange: [], topExposedAssets: [] })
}

export async function fetchResponseReadinessKPIs(timeFilter) {
  return fetchPage(timeFilter, ['response', 'action', 'coverage', 'latency'], { responseTrend: [], executionTrend: [], actionTypes: [] })
}

export async function fetchActiveIncidentsKPIs(timeFilter) {
  const incidents = await api.getIncidents({ timeRange: timeRange(timeFilter), limit: 50 })
  return fetchPage(timeFilter, ['incident', 'critical', 'high'], { incidents: incidents?.data || [], totalCount: incidents?.metadata?.total_records ?? incidents?.count ?? 0 })
}

export async function fetchIncidentTimelineKPIs(timeFilter) {
  const incidents = await api.getIncidents({ timeRange: timeRange(timeFilter), limit: 50 })
  return fetchPage(timeFilter, ['incident', 'timeline'], { timeline: incidents?.data || [], incidents: incidents?.data || [] })
}

export async function fetchAttackChainsKPIs(timeFilter) {
  return fetchPage(timeFilter, ['attack', 'chain', 'mitre'], { chains: [], chainsTable: [], nodes: [] })
}

export async function fetchAlertsSignalsKPIs(timeFilter) {
  const events = await api.getEvents({ timeRange: timeRange(timeFilter), limit: 50 })
  return fetchPage(timeFilter, ['signal', 'anomaly', 'event'], { events: events?.data || [], recentSignals: events?.data || [], newSignalsTrend: [] })
}

export async function fetchDetectionAnalyticsKPIs(timeFilter) {
  const events = await api.getEvents({ timeRange: timeRange(timeFilter), limit: 50 })
  return fetchPage(timeFilter, ['detection', 'event', 'anomaly'], { detections: events?.data || [], trends: [], categories: [] })
}

export async function fetchInvestigationWorkspaceKPIs(timeFilter) {
  const investigations = await api.getInvestigations({ limit: 50 })
  return fetchPage(timeFilter, ['investigation', 'finding'], { investigations: investigations?.data || [] })
}

export async function fetchThreatHuntingKPIs(timeFilter) {
  return fetchPage(timeFilter, ['hunting', 'ioc', 'finding'], { activityTrend: [], topIocs: [], recentQueries: [], recentSuspicious: [] })
}

export async function fetchEntityExplorerKPIs(timeFilter) { return fetchPage(timeFilter, ['entity', 'behavior'], { entities: [] }) }
export async function fetchEventExplorerKPIs(timeFilter) { return fetchPage(timeFilter, ['event', 'anomaly'], { events: [] }) }
export async function fetchEvidenceKPIs(timeFilter) {
  const evidence = await api.getEvidence({ limit: 50 })
  return fetchPage(timeFilter, ['evidence', 'integrity'], { evidence: evidence?.data || [], records: evidence?.data || [] })
}
export async function fetchAssetsKPIs(timeFilter) {
  return fetchPage(timeFilter, ['asset', 'risk'], {
    assets: [],
    inventory: [],
    recentlyDiscovered: [],
    riskDistribution: [],
    statusOverview: [],
    totalAssets: 0,
  })
}
export async function fetchUsersIdentityKPIs(timeFilter) {
  return fetchPage(timeFilter, ['user', 'identity', 'risk'], {
    users: [],
    riskyUsersData: [],
    suspiciousLoginsData: [],
    privilegeChangeActivityData: [],
    unusualLocations: [],
    privilegeChangesChart: [],
  })
}
export async function fetchEndpointContextKPIs(timeFilter) {
  return fetchPage(timeFilter, ['endpoint', 'asset'], {
    endpoints: [],
    endpointsData: [],
    suspiciousProcessesData: [],
    endpointRiskTrend: [],
    osDistribution: [],
  })
}
export async function fetchNetworkVisibilityKPIs(timeFilter) {
  return fetchPage(timeFilter, ['network', 'event'], {
    connections: [],
    suspiciousConnections: [],
    beaconingHosts: [],
    anomalousDns: [],
    eventsOverTime: [],
    topProtocols: [],
    trafficDirection: [],
  })
}
export async function fetchCloudSaasKPIs(timeFilter) {
  return fetchPage(timeFilter, ['cloud', 'saas', 'asset'], {
    resources: [],
    eventsOverTime: [],
    eventsByProvider: [],
    eventsByCategory: [],
    topRiskyConfigurationsData: [],
    topSuspiciousApiData: [],
    topPrivilegedActionsData: [],
    recentCloudIncidentsData: [],
  })
}
export async function fetchAssetRiskKPIs(timeFilter) { return fetchPage(timeFilter, ['asset', 'risk', 'exposure'], { assets: [] }) }

export async function fetchThreatIntelligenceKPIs(timeFilter) {
  const indicators = await api.getThreatIntel('indicators', { limit: 50 })
  const records = indicators?.data || []
  const count = (predicate) => records.filter(predicate).length
  const page = await fetchPage(timeFilter, ['threat', 'intelligence', 'indicator', 'confidence'], { indicators: records })
  return {
    ...page,
    activeMatches: { value: indicators?.metadata?.total_records ?? indicators?.count ?? records.length },
    iocMatches: { value: count((record) => ['ip', 'domain', 'url', 'hash', 'file'].some(type => String(record.indicator_type || '').toLowerCase().includes(type))) },
    highConfidenceMatches: { value: count((record) => Number(record.confidence || 0) >= 0.8) },
    threatActors: { value: count(record => Boolean(record.threat_actor)) },
    campaigns: { value: count(record => Boolean(record.campaign_id || record.campaign)) },
    intelligenceSources: { value: new Set(records.map(record => record.source).filter(Boolean)).size },
    enrichedIncidents: { value: count(record => Boolean(record.incident_id)) },
  }
}
export async function fetchIocExplorerKPIs(timeFilter) {
  const indicators = await api.getThreatIntel('indicators', { limit: 50 })
  const records = indicators?.data || []
  const byType = type => records.filter(record => String(record.indicator_type || '').toLowerCase().includes(type))
  const page = await fetchPage(timeFilter, ['ioc', 'indicator'], { iocs: records, indicators: records })
  return {
    ...page,
    kpis: {
      ...page.kpis,
      ioc: { value: indicators?.metadata?.total_records ?? indicators?.count ?? records.length },
      ip: { value: byType('ip').length },
      domain: { value: byType('domain').length },
      hash: { value: byType('hash').length },
      url: { value: byType('url').length },
    },
    recentMatches: records.map(record => ({
      iocValue: record.value,
      iocType: record.indicator_type,
      riskLevel: record.risk_level,
      source: record.source,
      matchedOn: record.last_seen,
      status: record.status,
    })),
    topByRisk: records.filter(record => record.risk_level).sort((a, b) => String(b.risk_level).localeCompare(String(a.risk_level))),
  }
}
export async function fetchThreatActorsKPIs(timeFilter) {
  const actors = await api.getThreatIntel('actors', { limit: 50 })
  return fetchPage(timeFilter, ['actor', 'threat'], { actors: actors?.data || [] })
}
export async function fetchCampaignsKPIs(timeFilter) {
  const campaigns = await api.getThreatIntel('campaigns', { limit: 50 })
  return fetchPage(timeFilter, ['campaign', 'threat'], { campaigns: campaigns?.data || [] })
}
export async function fetchMitreAttackKPIs(timeFilter) { return fetchPage(timeFilter, ['mitre', 'technique', 'tactic'], { techniques: [], tactics: [] }) }

export async function fetchAutonomousActionsKPIs(timeFilter) { return fetchPage(timeFilter, ['action', 'execution'], { actions: [] }) }
export async function fetchApprovalsKPIs(timeFilter) { return fetchPage(timeFilter, ['approval', 'decision'], { approvals: [] }) }
export async function fetchActionHistoryKPIs(timeFilter) {
  const actions = await api.getActionExecutions({ limit: 50 })
  return fetchPage(timeFilter, ['action', 'execution'], { actions: actions?.data || [], executions: actions?.data || [] })
}
export async function fetchRollbacksKPIs(timeFilter) { return fetchPage(timeFilter, ['rollback', 'action'], { rollbacks: [] }) }
export async function fetchSecurityAnalyticsData(timeFilter) { return fetchPage(timeFilter, ['security', 'incident', 'event'], { trends: [], categories: [] }) }
export async function fetchDetectionTrendsData(timeFilter) { return fetchPage(timeFilter, ['detection', 'event', 'anomaly'], { trends: [] }) }
export async function fetchResponseAnalyticsKPIs(timeFilter) { return fetchPage(timeFilter, ['response', 'action', 'mttr'], { trends: [] }) }
export async function fetchKpisPageData(timeFilter) {
  const response = await api.getKpiMetrics({ timeRange: timeRange(timeFilter) })
  return { metrics: response?.data || [], definitions: [], _lastUpdated: new Date().toISOString() }
}
export async function fetchCustomDashboardWidgetData(widgetKey, timeFilter) {
  const response = await api.getKpiMetrics({ timeRange: timeRange(timeFilter) })
  const metric = metricFor(metricIndex(response), widgetKey)
  return metric ? { status: 'ok', data: metric, _lastUpdated: new Date().toISOString() } : { status: 'empty', data: null, _lastUpdated: new Date().toISOString() }
}
export async function fetchAiDecisionsData(timeFilter) { return fetchPage(timeFilter, ['decision', 'ai', 'recommendation'], { decisions: [] }) }
export async function fetchEnginesConfidenceData(timeFilter) { return fetchPage(timeFilter, ['confidence', 'engine'], { engines: [] }) }
export async function fetchAutomationSafetyData(timeFilter) { return fetchPage(timeFilter, ['automation', 'safety', 'action'], { actions: [] }) }
export async function fetchDataFreshnessData(timeFilter) { return fetchPage(timeFilter, ['freshness', 'data'], { sources: [] }) }
export async function fetchRulesPoliciesData(timeFilter) {
  const policies = await api.getPolicies()
  return fetchPage(timeFilter, ['policy', 'rule', 'compliance'], { policies: policies?.data || policies?.policies || [] })
}
export async function fetchAuditLogsData(timeFilter) {
  const audit = await api.getAuditLogs({ limit: 50 })
  return fetchPage(timeFilter, ['audit'], { logs: audit?.data || [], records: audit?.data || [] })
}
export async function fetchPlaybooksKPIs(timeFilter) {
  const playbooks = await api.getPlaybooks()
  return fetchPage(timeFilter, ['playbook', 'action'], { playbooks: playbooks?.data || playbooks?.playbooks || [] })
}
export async function fetchUebaKPIs(timeFilter) { return fetchPage(timeFilter, ['ueba', 'behavior', 'anomaly'], { users: [], anomalies: [] }) }

export default {
  fetchOverviewKPIs,
  fetchExposureKPIs,
  fetchResponseReadinessKPIs,
  fetchActiveIncidentsKPIs,
  fetchIncidentTimelineKPIs,
  fetchAttackChainsKPIs,
  fetchAlertsSignalsKPIs,
  fetchDetectionAnalyticsKPIs,
  fetchInvestigationWorkspaceKPIs,
  fetchThreatHuntingKPIs,
  fetchEntityExplorerKPIs,
  fetchEventExplorerKPIs,
  fetchEvidenceKPIs,
  fetchAssetsKPIs,
  fetchUsersIdentityKPIs,
  fetchEndpointContextKPIs,
  fetchNetworkVisibilityKPIs,
  fetchCloudSaasKPIs,
  fetchAssetRiskKPIs,
  fetchThreatIntelligenceKPIs,
  fetchIocExplorerKPIs,
  fetchThreatActorsKPIs,
  fetchCampaignsKPIs,
  fetchMitreAttackKPIs,
  fetchAutonomousActionsKPIs,
  fetchApprovalsKPIs,
  fetchActionHistoryKPIs,
  fetchRollbacksKPIs,
  fetchSecurityAnalyticsData,
  fetchDetectionTrendsData,
  fetchResponseAnalyticsKPIs,
  fetchKpisPageData,
  fetchCustomDashboardWidgetData,
  fetchAiDecisionsData,
  fetchEnginesConfidenceData,
  fetchAutomationSafetyData,
  fetchDataFreshnessData,
  fetchRulesPoliciesData,
  fetchAuditLogsData,
  fetchPlaybooksKPIs,
  fetchUebaKPIs,
}
