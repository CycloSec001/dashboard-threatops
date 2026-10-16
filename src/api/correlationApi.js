import api from './client'

export async function fetchCorrelationData(timeFilter) {
  const [rulesResponse, chainsResponse] = await Promise.all([
    api.getCorrelationRules(),
    api.getCorrelationChains({ limit: 50 }),
  ])
  return {
    kpis: {
      activeCorrelations: { value: chainsResponse?.count ?? chainsResponse?.data?.length ?? 0 },
      attackChains: { value: chainsResponse?.count ?? chainsResponse?.data?.length ?? 0 },
    },
    graph: { nodes: [], links: [] },
    timeline: [],
    rules: rulesResponse?.data || [],
    confidenceDist: [],
    results: chainsResponse?.data || [],
    _lastUpdated: new Date().toISOString(),
  }
}
