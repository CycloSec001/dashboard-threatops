const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_API_BASE_URL || process.env?.NEXT_PUBLIC_API_URL)) ||
  ''
).replace(/\/$/, '')
const TOKEN_KEY = 'cyclosec_access_token'
const REFRESH_TOKEN_KEY = 'cyclosec_refresh_token'
const USER_KEY = 'cyclosec_user'

function getStoredItem(key) {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(key) } catch { return null }
}

function setStoredItem(key, value) {
  if (typeof window === 'undefined') return
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  } catch {
    // Storage is optional; the in-memory auth subscriber still receives changes.
  }
}

let authSubscribers = []

export function subscribeAuth(callback) {
  authSubscribers.push(callback)
  return () => { authSubscribers = authSubscribers.filter(item => item !== callback) }
}

function notifyAuth(user, token) {
  authSubscribers.forEach(callback => callback(user, token))
}

export function getAuthState() {
  const token = getStoredItem(TOKEN_KEY)
  let user = null
  try {
    const raw = getStoredItem(USER_KEY)
    if (raw) user = JSON.parse(raw)
  } catch {
    user = null
  }
  return { token, user }
}

export async function login(email, password, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password, ...(mfaCode ? { mfa_code: mfaCode } : {}) }),
  })
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {}
  if (!response.ok) {
    const error = new Error(payload.detail || payload.message || `Authentication failed (${response.status}).`)
    error.status = response.status
    error.data = payload
    throw error
  }
  setStoredItem(TOKEN_KEY, payload.access_token)
  setStoredItem(REFRESH_TOKEN_KEY, payload.refresh_token)
  setStoredItem(USER_KEY, payload.user)
  notifyAuth(payload.user, payload.access_token)
  return payload
}

export function logout() {
  setStoredItem(TOKEN_KEY, null)
  setStoredItem(REFRESH_TOKEN_KEY, null)
  setStoredItem(USER_KEY, null)
  notifyAuth(null, null)
}

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/healthz`, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    const payload = await response.json().catch(() => ({}))
    return { online: response.ok && payload.status === 'ok', service: payload.service || 'api_gateway', status: response.status }
  } catch (error) {
    return { online: false, status: 0, error: error.message }
  }
}

export async function apiClient(endpoint, options = {}) {
  const { token } = getAuthState()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeout || 15000)
  const correlationId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cyclosec-${Date.now()}`
  const headers = { Accept: 'application/json', 'X-Correlation-ID': correlationId, ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  let body = options.body
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }
  let response
  try {
    response = await fetch(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`, {
      ...options, headers, body, signal: options.signal || controller.signal,
    })
  } catch (error) {
    const requestError = new Error(error.name === 'AbortError' ? 'The backend request timed out.' : 'The backend is unavailable.')
    requestError.status = 0
    requestError.code = error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'
    requestError.correlationId = correlationId
    throw requestError
  } finally {
    clearTimeout(timeout)
  }
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '')
  if (response.status === 401 && typeof window !== 'undefined') logout()
  if (!response.ok) {
    const messages = {
      401: 'Your session has expired. Sign in again.',
      403: 'You are not authorized to access this resource.',
      404: 'The requested resource was not found.',
      405: 'This operation is not supported by the backend.',
      422: 'The request parameters or context were rejected.',
      503: 'The backend service is unavailable.',
    }
    const error = new Error(payload?.detail || payload?.message || messages[response.status] || `API request failed (${response.status}).`)
    error.status = response.status
    error.data = payload
    error.correlationId = response.headers.get('X-Correlation-ID') || correlationId
    throw error
  }
  if (!contentType.includes('application/json')) {
    const error = new Error('Received an invalid response from the backend.')
    error.status = response.status
    error.data = payload
    throw error
  }
  return payload
}

function queryString(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  const value = query.toString()
  return value ? `?${value}` : ''
}

export const api = {
  checkHealth: checkBackendHealth,
  getIncidents: params => apiClient(`/api/v1/incidents${queryString({ time_range: params?.timeRange, severity: params?.severity, status: params?.status, attack_category: params?.attackCategory, limit: params?.limit, cursor: params?.cursor })}`),
  getIncidentById: id => apiClient(`/api/v1/incidents/${encodeURIComponent(id)}`),
  getEvents: params => apiClient(`/api/v1/events${queryString({ time_range: params?.timeRange, event_domain: params?.eventDomain, event_type: params?.eventType, severity: params?.severity, limit: params?.limit, cursor: params?.cursor })}`),
  getThreatIntel: (resource = 'indicators', params = {}) => apiClient(`/api/v1/threat-intelligence/${resource}${queryString({ indicator_type: params.type, severity: params.severity, limit: params.limit })}`),
  getInvestigation: id => apiClient(`/api/v1/investigations/${encodeURIComponent(id)}`),
  getIncidentInvestigations: id => apiClient(`/api/v1/incidents/${encodeURIComponent(id)}/investigation`),
  getInvestigations: params => apiClient(`/api/v1/investigations${queryString({ limit: params?.limit, cursor: params?.cursor })}`),
  getInvestigationSection: (id, section) => {
    const allowed = ['summary', 'evidence', 'attack-paths', 'blast-radius', 'recommendations', 'reasoning', 'timeline']
    if (!allowed.includes(section)) throw new Error(`Unsupported investigation section: ${section}`)
    return apiClient(`/api/v1/incidents/${encodeURIComponent(id)}/${section}`)
  },
  getDecisions: params => apiClient(`/api/v1/decisions${queryString({ limit: params?.limit, cursor: params?.cursor })}`),
  getPolicies: () => apiClient('/api/v1/policies'),
  getActionExecutions: params => apiClient(`/api/v1/actions/executions${queryString({ limit: params?.limit, cursor: params?.cursor })}`),
  getActionExecution: id => apiClient(`/api/v1/actions/executions/${encodeURIComponent(id)}`),
  getActionAudit: id => apiClient(`/api/v1/actions/executions/${encodeURIComponent(id)}/audit`),
  executeAction: payload => apiClient('/api/v1/actions/execute', { method: 'POST', body: payload }),
  getPlaybooks: () => apiClient('/api/v1/soar/playbooks'),
  runQuery: (query, parameters = {}, limit = 100) => apiClient('/api/query', { method: 'POST', body: { query, parameters, limit } }),
  getEvidence: params => apiClient(`/api/v1/evidence${queryString({ incident_id: params?.incidentId, limit: params?.limit, cursor: params?.cursor })}`),
  getEvidenceById: (id, incidentId) => apiClient(`/api/v1/evidence/${encodeURIComponent(id)}${queryString({ incident_id: incidentId })}`),
  getEvidenceDownload: (id, incidentId) => {
    if (!incidentId) {
      const error = new Error('An incident ID is required to download evidence.')
      error.status = 422
      throw error
    }
    return apiClient(`/api/v1/evidence/${encodeURIComponent(id)}/download?incident_id=${encodeURIComponent(incidentId)}`)
  },
  getAuditLogs: params => apiClient(`/api/v1/audit${queryString({ limit: params?.limit, cursor: params?.cursor })}`),
  getAuditLog: id => apiClient(`/api/v1/audit/${encodeURIComponent(id)}`),
  getCorrelationRules: () => apiClient('/api/v1/correlation/rules'),
  getCorrelationChains: params => apiClient(`/api/v1/correlation/chains${queryString({ limit: params?.limit, cursor: params?.cursor })}`),
  getKpiMetrics: params => apiClient(`/api/v1/kpis/metrics${queryString({ time_range: params?.timeRange })}`),
  getKpiMetric: (id, timeRange = '24h') => apiClient(`/api/v1/kpis/metrics/${encodeURIComponent(id)}?time_range=${encodeURIComponent(timeRange)}`),
  getKpiDefinitions: params => apiClient(`/api/v1/kpis/definitions${queryString({ category: params?.category })}`),
  getKpiDashboard: (id = 'threatops_main', timeRange = '24h') => apiClient(`/api/v1/kpis/dashboards/${encodeURIComponent(id)}?time_range=${encodeURIComponent(timeRange)}`),
  getDomainRecords: (domain, params = {}) => apiClient(`/api/v1/${domain}${queryString({ limit: params.limit })}`),
  getSecurityPosture: () => apiClient('/api/v1/security-posture'),
  createDomainRecord: (domain, payload) => apiClient(`/api/v1/${domain}`, { method: 'POST', body: payload }),
  search: (query, params = {}) => apiClient(`/api/v1/search${queryString({ q: query, entity_type: params.entityType, limit: params.limit, cursor: params.cursor })}`),
}

export default api
