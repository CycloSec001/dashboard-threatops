import api from './client'

const ranges = { 'Last 24 Hours': '24h', 'Last 7 Days': '7d', 'Last 30 Days': '30d', 'Last 90 Days': '90d' }

export async function fetchAttackChainsData(timeFilter) {
  const response = await api.getCorrelationChains({ limit: 50 })
  return {
    kpis: {
      attackChains: { value: response?.count ?? response?.data?.length ?? 0 },
    },
    nodes: [],
    chainsTable: response?.data || [],
    events: [],
    totalCount: response?.metadata?.total_records ?? response?.count ?? 0,
    _lastUpdated: new Date().toISOString(),
  }
}
