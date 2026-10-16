function first(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '')
}

export function normalizeIncident(record = {}) {
  const alert = record.alert || {}
  const events = Array.isArray(record.events) ? record.events : []
  const entities = Array.isArray(record.entities) ? record.entities : []
  return {
    id: first(record.incident_id, record.id, 'unknown-incident'),
    tenantId: record.tenant_id || null,
    attackLabel: first(record.attack_label, alert.type, 'Unclassified incident'),
    attackCategory: first(record.attack_category, 'Unclassified'),
    confidence: alert.confidence ?? null,
    description: first(alert.description, record.description, 'No description provided'),
    severity: first(alert.type, record.severity, 'Unknown'),
    events, entities,
    timestamp: record.timestamp || null,
    status: record.status || null,
    isPartial: !record.incident_id || !record.tenant_id || !record.alert,
    raw: record,
  }
}

export function normalizeIncidents(response) {
  return (Array.isArray(response?.data) ? response.data : []).map(normalizeIncident)
}
