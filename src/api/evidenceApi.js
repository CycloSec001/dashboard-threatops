import api from './client'

const mapEvidence = (ev, index = 0) => ({
  id: ev.evidence_id || ev.id || `evidence-${index}`,
  name: ev.name || ev.filename || 'N/A',
  source: ev.source || 'N/A',
  type: ev.type || ev.content_type || 'N/A',
  linkedIncident: ev.incident_id || null,
  severity: ev.severity || 'N/A',
  collectedAt: ev.created_at ? new Date(ev.created_at).toLocaleString() : 'N/A',
  hash: ev.hash || 'N/A',
  size: ev.size ? `${Math.round(ev.size / 1024)} KB` : 'N/A',
  collectedBy: ev.collected_by || 'N/A',
  status: ev.status || 'N/A',
})

export async function fetchEvidenceSummary() {
  return { status: 'unavailable', data: null, error: 'Evidence summary aggregation is not exposed by the backend.' }
}

export async function fetchEvidenceTrends() {
  return { status: 'unavailable', data: [], error: 'Evidence trends are not exposed by the backend.' }
}

export async function fetchEvidenceSources() {
  return { status: 'unavailable', data: [], error: 'Evidence source aggregation is not exposed by the backend.' }
}

export async function fetchEvidenceRecords(filters = {}) {
  try {
    const response = await api.getEvidence({ incidentId: filters.incidentId, limit: filters.limit })
    let records = (response?.data || []).map(mapEvidence)
    if (filters.source && filters.source !== 'All Sources') records = records.filter(record => record.source.toLowerCase().includes(filters.source.toLowerCase()))
    if (filters.severity && filters.severity !== 'All Severity') records = records.filter(record => record.severity === filters.severity)
    if (filters.evidenceType && filters.evidenceType !== 'All Types') records = records.filter(record => record.type === filters.evidenceType)
    return { status: 'success', data: records, error: null, total: response?.metadata?.total_records ?? records.length }
  } catch (error) {
    return { status: 'error', data: null, error: error.message || 'Unable to load evidence.', httpStatus: error.status || 0 }
  }
}

export async function fetchEvidenceById(id, incidentId) {
  try {
    const response = await api.getEvidenceById(id, incidentId)
    return { status: 'success', data: response?.data ? mapEvidence(response.data) : null, error: null }
  } catch (error) {
    return { status: 'error', data: null, error: error.message || `Evidence record ${id} not found.`, httpStatus: error.status || 0 }
  }
}
