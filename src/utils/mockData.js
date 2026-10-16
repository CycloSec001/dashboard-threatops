export const customTooltip = {
  backgroundColor: 'rgba(10, 16, 26, 0.92)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  color: '#e8f0ea',
  fontSize: '12px',
}

export const DEFAULT_KPIS = []

export function loadCustomKpis() {
  try { return JSON.parse(localStorage.getItem('custom_dashboard_kpis') || '[]') } catch { return [] }
}

export function saveCustomKpis(kpis) {
  try { localStorage.setItem('custom_dashboard_kpis', JSON.stringify(kpis)) } catch {}
}

export function loadDashboards() {
  try { return JSON.parse(localStorage.getItem('custom_dashboards') || '[]') } catch { return [] }
}

export function saveDashboards(dashboards) {
  try { localStorage.setItem('custom_dashboards', JSON.stringify(dashboards)) } catch {}
}

const empty = () => []
const emptyObject = () => ({})

export const getDashboardKpis = empty
export const getTrendData = empty
export const getSeverityData = empty
export const getSourceData = empty
export const getStatusData = empty
export const getMonitoringKpis = empty
export const getMonitoringTrendData = empty
export const getThreatTypeData = empty
export const getThreatSources = empty
export const getRecentActivity = empty
export const getVulnerabilityKpis = empty
export const getVulnerabilityTrendData = empty
export const getVulnerabilitySeverityData = empty
export const getVulnerableAssets = empty
export const getRecentVulnerabilities = empty
export const getAssetsKpis = empty
export const getAssetsTrendData = empty
export const getAssetsTypeData = empty
export const getAssetsList = empty
export const getRecentAssetActivity = empty
export const getComplianceKpis = empty
export const getComplianceTrendData = empty
export const getComplianceFrameworkData = empty
export const getComplianceIssues = empty
export const getRecentComplianceActivity = empty
export const getReportsKpis = empty
export const getReportsTrendData = empty
export const getReportsTypeData = empty
export const getRecentReports = empty
export const getScheduledReports = empty
export const getCloudKpis = empty
export const getCloudThreatTrend = empty
export const getCloudAlertSeverity = empty
export const getCloudProviderThreats = empty
export const getCloudIncidentStatus = empty
export const getCloudEventsTable = empty
export const getEndpointKpis = empty
export const getEndpointThreatTrend = empty
export const getEndpointMalwareDetection = empty
export const getEndpointHealthStatus = empty
export const getEndpointOsDistribution = empty
export const getEndpointEventsTable = empty
export const getNetworkKpis = empty
export const getNetworkTrafficTrend = empty
export const getNetworkSourceCountries = empty
export const getNetworkProtocolDistribution = empty
export const getNetworkEventStatus = empty
export const getNetworkEventsTable = empty
