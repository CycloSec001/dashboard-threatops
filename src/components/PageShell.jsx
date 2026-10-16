import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdRefresh, MdWarningAmber, MdErrorOutline,
  MdSearch, MdVisibility, MdSecurity, MdAutoFixHigh
} from 'react-icons/md'
import { RiShieldFlashLine } from 'react-icons/ri'

// ── Act metadata ──────────────────────────────────────────────────────────────
const ACTS = {
  act1: {
    number: '01',
    title: 'Situation Overview',
    hint: 'Current situation at a glance',
    icon: MdSearch,
    color: '#00D9FF',        // cyan — situational awareness
    borderColor: 'border-cyan-500/30',
    labelBg: 'bg-cyan-500/10',
    labelText: 'text-cyan-400',
  },
  act2: {
    number: '02',
    title: 'Impact & Risk',
    hint: 'Impact, risk, and severity context',
    icon: MdVisibility,
    color: '#F59E0B',        // amber — importance signal
    borderColor: 'border-amber-500/30',
    labelBg: 'bg-amber-500/10',
    labelText: 'text-amber-400',
  },
  act3: {
    number: '03',
    title: 'Evidence & Logs',
    hint: 'Signals, logs, and correlated data',
    icon: MdSecurity,
    color: '#8B5CF6',        // purple — analytical depth
    borderColor: 'border-purple-500/30',
    labelBg: 'bg-purple-500/10',
    labelText: 'text-purple-400',
  },
  act4: {
    number: '04',
    title: 'Next Steps',
    hint: 'Recommended actions and response readiness',
    icon: MdAutoFixHigh,
    color: '#39FF6A',        // green — safe forward motion
    borderColor: 'border-green-500/30',
    labelBg: 'bg-green-500/10',
    labelText: 'text-green-400',
  },
}

// ── ActSection ────────────────────────────────────────────────────────────────
export function ActSection({ act, children, className = '' }) {
  const meta = ACTS[act]
  if (!meta) return <div className={className}>{children}</div>
  const Icon = meta.icon

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col gap-4 ${className}`}
      aria-label={meta.title}
    >
      {/* Section label */}
      <div className={`flex items-center gap-3 border-l-2 pl-3`} style={{ borderColor: meta.color }}>
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-[6px] ${meta.labelBg}`}>
          <Icon size={13} style={{ color: meta.color }} />
          <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${meta.labelText}`}>
            Act {meta.number}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-white">{meta.title}</span>
          <span className="text-[11px] text-[#4a5568]">{meta.hint}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </motion.section>
  )
}

// ── PageShell ─────────────────────────────────────────────────────────────────
export default function PageShell({
  // Header
  section,          // e.g. "Command Center"
  title,            // e.g. "Active Incidents"
  subtitle,         // e.g. "Current security incidents and their investigation status"
  selectedTime,

  // State
  isLoading = false,
  isError = false,
  isEmpty = false,
  isPartial = false,
  isStale = false,
  lastUpdated = null,
  onRefresh,

  // Content
  children,
}) {
  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide bg-grid"
      style={{
        backgroundColor: '#070B11',
      }}
    >
      <div className="flex flex-col gap-5 px-7 pt-6 pb-12">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[10px] font-semibold text-htb-green uppercase tracking-[0.15em] mb-0.5">
              {section}
            </p>
            <h1 className="text-[26px] font-bold text-white leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-[13px] text-[#9ca3af] mt-1">
                {subtitle}{selectedTime ? ` — ${selectedTime}` : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            {lastUpdated && !isLoading && !isError && (
              <div className="flex items-center gap-2">
                {isStale && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-[4px]">
                    <MdWarningAmber size={12} /> STALE
                  </span>
                )}
                <span className="text-[11px] text-slate-400">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            )}
            {onRefresh && (
              <motion.button
                onClick={onRefresh}
                disabled={isLoading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-white/[0.04] border border-white/[0.08] text-[12px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all disabled:opacity-40"
              >
                <motion.div
                  animate={{ rotate: isLoading ? 360 : 0 }}
                  transition={{ repeat: isLoading ? Infinity : 0, duration: 1, ease: 'linear' }}
                >
                  <MdRefresh size={13} />
                </motion.div>
                Refresh
              </motion.button>
            )}
          </div>
        </div>

        {/* ── Partial data banner ───────────────────────────────────────────── */}
        <AnimatePresence>
          {isPartial && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-[#1c1a10] border border-yellow-700/40 rounded-[8px] px-4 py-2.5"
            >
              <MdWarningAmber className="text-yellow-400 flex-shrink-0" size={16} />
              <span className="text-[12px] text-yellow-300/80">
                Some data is currently unavailable. Showing partial results.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Full error state ──────────────────────────────────────────────── */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20"
          >
            <MdErrorOutline className="text-red-400/60" size={48} />
            <p className="text-[15px] font-semibold text-[#9ca3af]">Unable to load page data</p>
            <p className="text-[12px] text-[#4a5568]">The backend request failed.</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-1 px-5 py-2 rounded-[8px] bg-[#111827] border border-red-700/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all text-[13px] font-medium"
              >
                Retry
              </button>
            )}
          </motion.div>
        )}

        {/* ── Page content (four acts) ──────────────────────────────────────── */}
        {!isError && (
          <div className="flex flex-col gap-8">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
