import api from './client'

const ranges = { 'Last 24 Hours': '24h', 'Last 7 Days': '7d', 'Last 30 Days': '30d', 'Last 90 Days': '90d' }

export async function fetchThreatHuntingData(timeFilter) {
  const [events, indicators] = await Promise.all([
    api.getEvents({ timeRange: ranges[timeFilter] || '24h', limit: 50 }),
    api.getThreatIntel('indicators', { limit: 50 }),
  ])
  return {
    kpis: {},
    activityTrend: [],
    topIocs: indicators?.data || [],
    recentQueries: [],
    recentSuspicious: events?.data || [],
    unsupported: 'Hunting aggregate metrics and query history are not exposed by the backend API.',
    _lastUpdated: new Date().toISOString(),
  }
}
