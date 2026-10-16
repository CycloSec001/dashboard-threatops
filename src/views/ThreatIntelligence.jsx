import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRefresh, MdWarningAmber, MdCalendarToday, MdOutlineFilterList } from 'react-icons/md'
import { FiTarget, FiShare2, FiShield, FiUserX, FiFlag, FiRadio, FiFileText, FiArrowUpRight, FiArrowDownRight, FiHelpCircle } from 'react-icons/fi'
import { fetchThreatIntelligenceKPIs } from '../api/threatOpsApi'

// ── Components ─────────────────────────────────────────────────────────────

const StatCard = ({ title, subtitle, value, trend, icon: Icon, colorClass, linkText }) => {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] p-5 flex flex-col hover:border-[#374151] transition-colors h-[170px]">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div className="flex items-start gap-2">
          <div className="text-right">
            <h3 className="text-[14px] font-semibold text-[#e5e7eb] leading-tight">{title}</h3>
            <span className="text-[12px] text-[#6b7280]">{subtitle}</span>
          </div>
          <FiHelpCircle className="text-[#4a5568] mt-0.5" size={14} />
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-auto mb-4">
        <div className="text-[32px] font-bold text-white leading-none tracking-tight">{value}</div>
      </div>
      
      <div className="flex items-center justify-between border-t border-[#1f2937] pt-3 mt-auto">
        <button className="text-[12px] font-medium text-[#9ca3af] hover:text-white transition-colors flex items-center gap-1 group">
          {linkText}
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
        {trend && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={`flex items-center font-semibold ${trend > 0 ? 'text-htb-green' : 'text-red-400'}`}>
              {trend > 0 ? <FiArrowUpRight size={12} className="mr-0.5"/> : <FiArrowDownRight size={12} className="mr-0.5"/>}
              {Math.abs(trend)}%
            </span>
            <span className="text-[#6b7280]">previous period</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function ThreatIntelligence() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true); setIsError(false)
    try {
      const result = await fetchThreatIntelligenceKPIs('Last 7 Days')
      setData(result)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const lastUpdated = data?._lastUpdated

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide"
      style={{ background: '#0B0F12' }}
    >
      <div className="flex flex-col px-8 pt-8 pb-12 w-full max-w-[1600px] mx-auto">
        
        {/* ── Header Area ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-bold text-white leading-tight mb-1">KPI / Metric Visualization</h1>
            <p className="text-[13px] text-[#9ca3af]">
              Overview of key threat intelligence metrics. All values are backend-driven.
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            {lastUpdated && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#9ca3af]">
                  Data as of: {new Date(lastUpdated).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-[4px]">
                  STALE <FiHelpCircle size={10} />
                </span>
              </div>
            )}
            <div className="w-[1px] h-[16px] bg-[#2d3748]" />
            <div className="flex items-center gap-2 text-[12px] text-[#9ca3af]">
              Auto refresh:
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`font-semibold ${autoRefresh ? 'text-htb-green' : 'text-[#6b7280]'}`}
              >
                {autoRefresh ? 'On' : 'Off'}
              </button>
              <MdRefresh size={14} className={autoRefresh ? 'text-htb-green cursor-pointer' : 'text-[#6b7280] cursor-pointer'} />
            </div>
          </div>
        </div>

        {/* ── Filter Bar ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] text-[#e5e7eb] hover:bg-[#1f2937] transition-colors">
              <MdCalendarToday size={14} className="text-[#9ca3af]" />
              <span>Last 7 Days</span>
              <span className="text-[#6b7280] ml-1">⌄</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] text-[#e5e7eb] hover:bg-[#1f2937] transition-colors">
              <span>All Threat Actors</span>
              <span className="text-[#6b7280] ml-1">⌄</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] text-[#e5e7eb] hover:bg-[#1f2937] transition-colors">
              <span>All Campaigns</span>
              <span className="text-[#6b7280] ml-1">⌄</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] text-[#e5e7eb] hover:bg-[#1f2937] transition-colors">
              <span>All Sources</span>
              <span className="text-[#6b7280] ml-1">⌄</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] text-[#e5e7eb] hover:bg-[#1f2937] transition-colors">
              <span>All Confidence Levels</span>
              <span className="text-[#6b7280] ml-1">⌄</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] text-[#e5e7eb] hover:bg-[#1f2937] transition-colors ml-2">
              <span>More Filters</span>
              <MdOutlineFilterList size={14} className="text-[#9ca3af]" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-[12px] text-blue-400 font-medium hover:text-blue-300 transition-colors">
            Clear All <MdRefresh size={14} />
          </button>
        </div>

        {/* ── Main KPI Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          <StatCard
            title="Active Intelligence"
            subtitle="Matches"
            value={data?.activeMatches?.value ?? '—'}
            trend={data?.activeMatches?.trend}
            icon={FiTarget}
            colorClass="bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/30"
            linkText="View Matches"
          />
          <StatCard
            title="IOC Matches"
            subtitle="IOC matches"
            value={data?.iocMatches?.value ?? '—'}
            trend={data?.iocMatches?.trend}
            icon={FiShare2}
            colorClass="bg-blue-500/20 text-blue-400 border border-blue-500/30"
            linkText="View IOC Matches"
          />
          <StatCard
            title="High-Confidence"
            subtitle="Matches"
            value={data?.highConfidenceMatches?.value ?? '—'}
            trend={data?.highConfidenceMatches?.trend}
            icon={FiShield}
            colorClass="bg-green-500/20 text-green-400 border border-green-500/30"
            linkText="View High-Confidence Matches"
          />
          <StatCard
            title="Threat Actors"
            subtitle="Actors linked to threats"
            value={data?.threatActors?.value ?? '—'}
            trend={data?.threatActors?.trend}
            icon={FiUserX}
            colorClass="bg-red-500/20 text-red-400 border border-red-500/30"
            linkText="View Threat Actors"
          />
          <StatCard
            title="Campaigns"
            subtitle="Linked campaigns"
            value={data?.campaigns?.value ?? '—'}
            trend={data?.campaigns?.trend}
            icon={FiFlag}
            colorClass="bg-orange-500/20 text-orange-400 border border-orange-500/30"
            linkText="View Campaigns"
          />
          <StatCard
            title="Intelligence Sources"
            subtitle="Sources"
            value={data?.intelligenceSources?.value ?? '—'}
            trend={data?.intelligenceSources?.trend}
            icon={FiRadio}
            colorClass="bg-teal-500/20 text-teal-400 border border-teal-500/30"
            linkText="View Sources"
          />
          <StatCard
            title="Enriched Incidents"
            subtitle="Intelligence-enriched incidents"
            value={data?.enrichedIncidents?.value ?? '—'}
            trend={data?.enrichedIncidents?.trend}
            icon={FiFileText}
            colorClass="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
            linkText="View Enriched Incidents"
          />
        </div>

        {/* ── Data States Examples ──────────────────────────────────────────── */}
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-[#e5e7eb] mb-4">Data States (examples)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            
            {/* Loading State */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-5 h-[220px] flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-[14px] font-semibold text-white">Loading State</h3>
                <div className="w-4 h-4 rounded-full border-2 border-[#374151] border-t-blue-500 animate-spin" />
              </div>
              <div className="flex flex-col gap-3 mb-auto">
                <div className="w-[80%] h-4 bg-[#1f2937] rounded animate-pulse" />
                <div className="w-[60%] h-4 bg-[#1f2937] rounded animate-pulse" />
                <div className="w-[90%] h-4 bg-[#1f2937] rounded animate-pulse" />
              </div>
              <p className="text-[11px] text-[#6b7280]">Fetching latest intelligence...</p>
            </div>

            {/* Empty State */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-5 h-[220px] flex flex-col items-center justify-center text-center">
              <h3 className="text-[14px] font-semibold text-white absolute top-5 left-5">Empty State</h3>
              <div className="text-[#374151] mb-2 mt-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <h4 className="text-[14px] font-semibold text-white mb-1">No data found</h4>
              <p className="text-[11px] text-[#9ca3af] mb-4 max-w-[140px]">Try adjusting your filters or date range.</p>
              <button className="text-[12px] font-medium text-blue-400 border border-blue-500/30 rounded-[4px] px-4 py-1.5 hover:bg-blue-500/10 transition-colors">
                Clear Filters
              </button>
            </div>

            {/* Error State */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-5 h-[220px] flex flex-col items-center justify-center text-center">
              <h3 className="text-[14px] font-semibold text-white absolute top-5 left-5">Error State</h3>
              <div className="text-red-400 mb-2 mt-4">
                <MdWarningAmber size={32} />
              </div>
              <h4 className="text-[14px] font-semibold text-white mb-1">Unable to load data</h4>
              <p className="text-[11px] text-[#9ca3af] mb-4 max-w-[160px]">There was a problem retrieving the data. Please try again.</p>
              <button className="text-[12px] font-medium text-blue-400 border border-[#374151] rounded-[4px] px-6 py-1.5 hover:bg-[#1f2937] transition-colors">
                Retry
              </button>
            </div>

            {/* Partial Data State */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-5 h-[220px] flex flex-col relative">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[14px] font-semibold text-white">Partial Data State</h3>
                <MdWarningAmber className="text-yellow-400" size={16} />
              </div>
              
              <div className="mb-4">
                <div className="text-[10px] text-[#9ca3af] mb-1">Active Intelligence Matches</div>
                <div className="flex items-center justify-between border-b border-[#1f2937] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-[#4a5568]">—</span>
                  </div>
                  <MdWarningAmber className="text-yellow-400" size={12} />
                </div>
              </div>
              
              <div className="mb-auto">
                <div className="text-[10px] text-[#9ca3af] mb-1">IOC Matches</div>
                <div className="flex items-center justify-between">
                  <span className="text-[18px] font-bold text-[#4a5568]">---</span>
                  <span className="text-[10px] text-[#6b7280]">Data unavailable</span>
                </div>
              </div>
              
              <div className="mt-auto">
                <p className="text-[10px] text-[#9ca3af] mb-2 text-center">Some metrics are unavailable.</p>
                <button className="w-full text-[12px] font-medium text-blue-400 flex items-center justify-center gap-1 hover:text-blue-300">
                  View available data <span>→</span>
                </button>
              </div>
            </div>

            {/* Stale Data State */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-5 h-[220px] flex flex-col text-center relative">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[14px] font-semibold text-white">Stale Data State</h3>
                <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1 rounded">STALE</span>
              </div>
              
              <div className="bg-[#0B0F12] border border-[#1f2937] rounded-[6px] p-2 mb-4">
                <p className="text-[10px] text-[#9ca3af]">Data timestamp unavailable</p>
              </div>
              
              <div className="flex justify-center text-orange-400 mb-auto mt-2">
                <MdRefresh size={32} />
              </div>
              
              <div className="mt-auto">
                <p className="text-[11px] text-[#9ca3af] mb-3">The data is older than expected.</p>
                <button className="text-[12px] font-medium text-blue-400 flex items-center justify-center gap-1 w-full hover:text-blue-300">
                  Refresh Now <MdRefresh size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-4 text-[11px] text-[#6b7280] border-t border-[#1f2937] pt-4">
          <FiHelpCircle size={12} />
          <p>All metrics are backend-driven and update based on applied filters. Click on any card to drill down to the relevant record or detail view.</p>
        </div>

      </div>
    </div>
  )
}
