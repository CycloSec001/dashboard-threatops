import { useState, useMemo } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// ── usePagination hook ───────────────────────────────────────────────────────
export function usePagination(data, defaultPageSize = 10) {
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const safeData = data || []
  const totalItems = safeData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // clamp page if data shrinks (e.g. filter change)
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(
    () => safeData.slice((safePage - 1) * pageSize, safePage * pageSize),
    [safeData, safePage, pageSize]
  )

  const goTo     = (p) => setPage(Math.max(1, Math.min(p, totalPages)))
  const prev     = () => goTo(safePage - 1)
  const next     = () => goTo(safePage + 1)

  const changePageSize = (size) => {
    setPageSize(size)
    setPage(1)
  }

  return {
    paginated,
    page: safePage,
    pageSize,
    totalPages,
    totalItems,
    prev,
    next,
    goTo,
    changePageSize,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}

// ── Pagination UI component ──────────────────────────────────────────────────
export default function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  hasPrev,
  hasNext,
  prev,
  next,
  goTo,
  changePageSize,
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end   = Math.min(page * pageSize, totalItems)

  // Build page number buttons (max 5 visible)
  const pageNums = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const delta = 2
    const left  = Math.max(1, page - delta)
    const right = Math.min(totalPages, page + delta)
    const pages = []
    for (let i = left; i <= right; i++) pages.push(i)
    if (pages[0] > 1) { pages.unshift('...'); pages.unshift(1) }
    if (pages[pages.length - 1] < totalPages) { pages.push('...'); pages.push(totalPages) }
    return pages
  }, [page, totalPages])

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-white/[0.06] mt-1">
      {/* Left: Rows per page + showing info */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-slate-400">Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => changePageSize(Number(e.target.value))}
          className="bg-black/40 border border-white/[0.08] text-slate-200 text-[11px] rounded-[6px] px-2 py-1 outline-none cursor-pointer hover:border-white/20 transition-colors"
        >
          {PAGE_SIZE_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-[11px] text-slate-400">
          Showing <span className="text-white font-semibold">{start}–{end}</span> of{' '}
          <span className="text-white font-semibold">{totalItems}</span>
        </span>
      </div>

      {/* Right: Prev / Page nums / Next */}
      <div className="flex items-center gap-1">
        <button
          onClick={prev}
          disabled={!hasPrev}
          className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-medium text-slate-300 bg-white/[0.04] border border-white/[0.08] transition-all hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <MdKeyboardArrowLeft size={15} />
          Prev
        </button>

        {pageNums.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="text-slate-500 text-[11px] px-1">…</span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              className={`min-w-[28px] h-[28px] rounded-[6px] text-[11px] font-semibold transition-all ${
                p === page
                  ? 'bg-htb-green text-black shadow-[0_0_10px_rgba(57,255,106,0.35)] font-bold'
                  : 'text-slate-300 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={next}
          disabled={!hasNext}
          className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-medium text-slate-300 bg-white/[0.04] border border-white/[0.08] transition-all hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <MdKeyboardArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
