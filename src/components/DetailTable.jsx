import React, { useState } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdMoreHoriz, MdSearch, MdFilterList } from 'react-icons/md'

import { CHART_SIZES } from '../utils/chartSizes'
import DetailsModal from './DetailsModal'

export default function DetailTable({ columns, data, title, description, searchable = true, searchPlaceholder = 'Search...' }) {
  // Normalise both {accessor, header} and {key, label} column shapes
  const cols = (columns || []).map(c => ({ accessor: c.accessor ?? c.key, header: c.header ?? c.label, render: c.render }))
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState(null)
  const [sortSeverity, setSortSeverity] = useState('none') // 'none', 'desc', 'asc'
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const severityWeight = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  }

  let processedData = data?.filter(row => {
    if (!search) return true
    return Object.values(row).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  }) || []

  if (sortSeverity !== 'none') {
    processedData.sort((a, b) => {
      const wA = severityWeight[String(a.severity || '').toLowerCase()] || 0
      const wB = severityWeight[String(b.severity || '').toLowerCase()] || 0
      return sortSeverity === 'desc' ? wB - wA : wA - wB
    })
  }

  const totalPages = Math.ceil(processedData.length / rowsPerPage)
  const paginatedData = processedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))
  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1))

  return (
    <div
      className="flex flex-col bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden mt-3 transition-all duration-200 hover:border-white/[0.12]"
      style={{ minHeight: CHART_SIZES.table.container }}
    >

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.05] bg-black/10">
        <div>
          <h3 className="text-[14px] font-bold text-white">{title}</h3>
          {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
        </div>

        <div className="flex items-center gap-3">
          {searchable && (
            <div className="flex items-center gap-2 bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[6px] px-2.5 py-1.5 focus-within:border-white/[0.12] transition-colors">
              <MdSearch size={14} className="text-slate-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                placeholder={searchPlaceholder}
                className="bg-transparent text-[11px] text-white placeholder:text-slate-500 outline-none w-[140px]"
              />
            </div>
          )}
          <button
            onClick={() => {
              setSortSeverity(prev => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')
              setCurrentPage(1)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] border text-[11px] font-medium transition-all ${sortSeverity !== 'none'
                ? 'bg-htb-green/20 border-htb-green/50 text-htb-green'
                : 'border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.08]'
              }`}
          >
            <MdFilterList size={13} />
            {sortSeverity === 'none' ? 'Filter' : sortSeverity === 'desc' ? 'Severity (Crit -> Low)' : 'Severity (Low -> Crit)'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse [&_td]:py-2 [&_th]:py-2.5 [&_td]:px-3 [&_th]:px-3">
          <thead>
            <tr className="bg-black/10 border-b border-white/[0.05]">
              {cols.map((col, i) => (
                <th key={i} className="text-[9.5px] font-semibold text-slate-200 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              <th className="px-5 py-3 w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={(cols.length || 1) + 1} className="px-5 py-8 text-center text-slate-400 text-[12px]">
                  No events found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => setSelectedRow(row)}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  {cols.map((col, j) => (
                    <td key={j} className="text-[10.5px] text-slate-200">
                      {col.render ? col.render(row[col.accessor], row) : (row[col.accessor] ?? '—')}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-right">
                    <button className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all p-1">
                      <MdMoreHoriz size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {processedData.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.05] bg-black/5">
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">
              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, processedData.length)} of {processedData.length} events
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-black/5 backdrop-blur-[1px] border border-white/[0.05] text-slate-200 text-[9.5px] px-1.5 py-1 rounded-[6px] focus:outline-none focus:border-white/[0.12]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev} disabled={currentPage === 1}
              className="p-1 rounded-[6px] text-slate-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <MdKeyboardArrowLeft size={16} />
            </button>
            <span className="text-[11px] text-slate-200 font-medium px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext} disabled={currentPage === totalPages}
              className="p-1 rounded-[6px] text-slate-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <MdKeyboardArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <DetailsModal
        isOpen={!!selectedRow}
        data={selectedRow}
        onClose={() => setSelectedRow(null)}
        title="Row Details (JSON)"
      />
    </div>
  )
}
