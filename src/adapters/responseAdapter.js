export function pageFromResponse(response) {
  return {
    items: Array.isArray(response?.data) ? response.data : [],
    count: response?.metadata?.total_records ?? response?.count ?? 0,
    nextCursor: response?.next_cursor ?? null,
    hasMore: response?.has_more === true,
    tenantId: response?.tenant_id ?? null,
  }
}

export function envelopeValue(response, key, fallback = null) {
  if (response && Object.prototype.hasOwnProperty.call(response, key)) return response[key]
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) return response.data
  return fallback
}

export function requestState(error) {
  if (!error) return 'SUCCESS'
  if (error.status === 0) return 'BACKEND_UNAVAILABLE'
  if (error.status === 401) return 'SESSION_EXPIRED'
  if (error.status === 403) return 'PERMISSION_DENIED'
  if (error.status === 404) return 'NOT_FOUND'
  if (error.status === 405) return 'METHOD_NOT_ALLOWED'
  if (error.status === 422) return 'VALIDATION_ERROR'
  if (error.status === 503) return 'SERVICE_UNAVAILABLE'
  return 'ERROR'
}
