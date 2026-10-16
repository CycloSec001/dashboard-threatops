function first(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '')
}

export function normalizeEvent(record = {}) {
  const transport = record.transport || {}
  const event = record.event || {}
  const pipeline = record.pipeline || {}
  const enrichment = record.enrichment || {}
  const validation = record.validation || {}
  return {
    id: first(event.id, transport.id, record.event_id, record.id, 'unknown-event'),
    time: first(event.time, transport.timestamp, record.timestamp, record.created_at),
    name: first(event.name, event.type, record.event_type, record.name, 'Unnamed event'),
    source: first(event.source, event.provider, transport.source, record.source, 'Unknown source'),
    riskScore: first(enrichment.risk_score, event.risk_score, event.risk?.score, record.risk_score),
    severity: first(enrichment.severity, event.severity, event.risk?.severity, record.severity, 'Unknown'),
    transport, event, pipeline, enrichment, validation,
  }
}

export function normalizeEvents(response) {
  return (Array.isArray(response?.data) ? response.data : []).map(normalizeEvent)
}
