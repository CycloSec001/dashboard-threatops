import api from '../api/client'

const ranges = { 'Last 24 Hours': '24h', 'Last 7 Days': '7d', 'Last 30 Days': '30d', 'Last 90 Days': '90d' }

export async function fetchActiveIncidentsData(timeFilter) {
  const response = await api.getIncidents({ timeRange: ranges[timeFilter] || '24h', limit: 50 })
  const records = response?.data || []
  const counts = records.reduce((summary, incident) => {
    const rawSev = incident.severity || incident.alert?.type || incident.alert?.severity
    const rawStatus = incident.status
    if (rawSev && summary.severity[String(rawSev).toUpperCase()] !== undefined) summary.severity[String(rawSev).toUpperCase()] += 1
    if (rawStatus && summary.status[String(rawStatus).toUpperCase()] !== undefined) summary.status[String(rawStatus).toUpperCase()] += 1
    if (!incident.assignee && !incident.owner) summary.unassigned += 1
    return summary
  }, {
    severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    status: { NEW: 0, INVESTIGATING: 0, CONTAINED: 0, ESCALATED: 0, CLOSED: 0 },
    unassigned: 0,
  })

  let slaAtRiskCount = 0

  const incidentsTable = records.map(incident => {
    const rawSev = String(incident.severity || incident.alert?.type || incident.alert?.severity || '').toLowerCase()
    const severity = rawSev === 'critical' ? 'Critical'
      : rawSev === 'high' ? 'High'
      : rawSev === 'medium' ? 'Medium'
      : rawSev === 'low' ? 'Low'
      : rawSev.charAt(0).toUpperCase() + rawSev.slice(1)

    const rawStatus = String(incident.status || '').toLowerCase()
    const status = rawStatus === 'new' ? 'New'
      : rawStatus === 'investigating' ? 'Investigating'
      : rawStatus === 'contained' ? 'Contained'
      : rawStatus === 'escalated' ? 'Escalated'
      : rawStatus === 'closed' ? 'Closed'
      : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)

    const title = incident.title || incident.attack_label || incident.description || null
    
    let asset = incident.asset_id || incident.affected_asset
    if (!asset && Array.isArray(incident.entities) && incident.entities.length > 0) {
      asset = incident.entities[0]?.value || incident.entities[0]
    }
    asset = asset || null

    const source = incident.source || incident.detection_source || incident.rule_id || incident.attack_category || null
    const assignee = incident.assignee || incident.owner || null

    const createdTime = incident.created_at || (typeof incident.timestamp === 'number' ? new Date(incident.timestamp).toISOString() : incident.timestamp)
    const ageHours = createdTime ? Math.max(0, Math.round((Date.now() - new Date(createdTime).getTime()) / 3600000)) : null
    const age = ageHours != null && !isNaN(ageHours) ? `${ageHours}h` : null

    const sla = incident.sla_status || null
    if (sla === 'Breached' || sla === 'At Risk') slaAtRiskCount += 1

    const lastActivity = incident.updated_at ? new Date(incident.updated_at).toLocaleString() : (createdTime ? new Date(createdTime).toLocaleString() : null)

    return {
      id: incident.incident_id || incident.id || 'N/A',
      severity,
      title,
      asset,
      source,
      assignee,
      status,
      age,
      sla,
      lastActivity,
      raw: incident,
    }
  })

  const severity = Object.entries(counts.severity).map(([name, value]) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    value,
    fill: name === 'CRITICAL' ? '#f43f5e' : name === 'HIGH' ? '#fb923c' : name === 'MEDIUM' ? '#facc15' : '#34d399',
  }))
  const status = Object.entries(counts.status).map(([name, value]) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    value,
    fill: '#38bdf8',
  }))

  return {
    kpis: {
      activeIncidents: { value: records.length },
      critical: { value: counts.severity.CRITICAL },
      high: { value: counts.severity.HIGH },
      unassigned: { value: counts.unassigned },
      slaAtRisk: { value: slaAtRiskCount },
      avgResponseTime: { value: null },
    },
    incidentSeverity: severity,
    incidentStatus: status,
    incidentAge: [],
    slaCompliance: [],
    incidentsTable,
    _lastUpdated: new Date().toISOString(),
  }
}
