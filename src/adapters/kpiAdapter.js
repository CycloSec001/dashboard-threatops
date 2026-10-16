export const KPI_IDS = Object.freeze({
  incidentCount: 'incident_count_24h',
  criticalIncidentCount: 'critical_incident_count_24h',
  incidentMttd: 'INC_MTTD',
  incidentMttr: 'INC_MTTR',
  anomalyCount: 'anomaly_count_24h',
  averageAnomalyScore: 'avg_anomaly_score_24h',
  highAnomalyCount: 'high_anomaly_count_24h',
  automationCoverage: 'automation_coverage_pct_24h',
  playbookSuccessRate: 'playbook_success_rate_24h',
  attackTechniqueDistribution: 'attack_technique_distribution_24h',
  mitreCoverage: 'ATK_COVERAGE_MITRE',
})

export function normalizeKpi(response) {
  const value = response?.data ?? null
  return {
    id: value?.kpi_id || value?.id || null,
    value: value?.value ?? null,
    unit: value?.unit ?? null,
    trend: value?.trend ?? null,
    chart: Array.isArray(value?.chart) ? value.chart : [],
    raw: value,
  }
}

export function normalizeDashboard(response) {
  return (response?.data?.widgets || []).map(widget => ({
    id: widget.widget_id,
    value: widget.kpi?.value ?? null,
    chart: Array.isArray(widget.kpi?.chart) ? widget.kpi.chart : [],
    raw: widget,
  }))
}
