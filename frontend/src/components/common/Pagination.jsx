import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/**
 * Generates an array of page numbers with ellipsis markers ('...')
 * for clean pagination displays regardless of total page count.
 */
function getPageNumbers(currentPage, totalPages, siblingCount = 1) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages)

  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < totalPages - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + 2 * siblingCount
    const leftRange = Array.from({ length: leftCount }, (_, i) => i + 1)
    return [...leftRange, '...', totalPages]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + 2 * siblingCount
    const rightRange = Array.from(
      { length: rightCount },
      (_, i) => totalPages - rightCount + i + 1
    )
    return [1, '...', ...rightRange]
  }

  if (showLeftEllipsis && showRightEllipsis) {
    const middleRange = Array.from(
      { length: rightSibling - leftSibling + 1 },
      (_, i) => leftSibling + i
    )
    return [1, '...', ...middleRange, '...', totalPages]
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1)
}

export default function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  siblingCount = 1,
  showInfo = true,
  className = '',
}) {
  if (totalPages <= 1 && totalItems <= pageSize) {
    if (totalItems === 0) return null
    if (!showInfo) return null
    return (
      <div className={`py-4 flex items-center justify-between text-xs text-slate-500 font-medium ${className}`}>
        <span>
          Showing <strong className="text-slate-800">{totalItems}</strong> of{' '}
          <strong className="text-slate-800">{totalItems}</strong> items
        </span>
      </div>
    )
  }

  const currentPage = Math.max(1, Math.min(page, totalPages || 1))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const pageNumbers = getPageNumbers(currentPage, totalPages, siblingCount)

  function handlePageClick(targetPage) {
    if (targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
      onPageChange?.(targetPage)
    }
  }

  return (
    <div
      className={`pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 text-xs ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Information text */}
      {showInfo && (
        <div className="text-slate-500 font-medium text-center sm:text-left">
          Showing{' '}
          <span className="font-bold text-slate-900">
            {startItem} – {endItem}
          </span>{' '}
          of <span className="font-bold text-slate-900">{totalItems}</span> results
        </div>
      )}

      {/* Page controls */}
      <nav className="inline-flex items-center gap-1 flex-wrap justify-center" aria-label="Pagination">
        {/* First page button (if more than 5 pages) */}
        {totalPages > 5 && (
          <button
            type="button"
            onClick={() => handlePageClick(1)}
            disabled={currentPage <= 1}
            className="size-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center cursor-pointer shadow-2xs"
            aria-label="Go to first page"
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>
        )}

        {/* Previous page button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 font-semibold cursor-pointer shadow-2xs"
          aria-label="Go to previous page"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numbered page buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((num, idx) => {
            if (num === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="size-8 flex items-center justify-center text-slate-400 font-mono select-none"
                >
                  &hellip;
                </span>
              )
            }

            const isCurrent = num === currentPage
            return (
              <button
                key={`page-${num}`}
                type="button"
                onClick={() => handlePageClick(num)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`size-8 rounded-lg font-bold transition flex items-center justify-center text-xs cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0a2e8c] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 shadow-2xs'
                }`}
              >
                {num}
              </button>
            )
          })}
        </div>

        {/* Next page button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 font-semibold cursor-pointer shadow-2xs"
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>

        {/* Last page button (if more than 5 pages) */}
        {totalPages > 5 && (
          <button
            type="button"
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage >= totalPages}
            className="size-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center cursor-pointer shadow-2xs"
            aria-label="Go to last page"
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        )}
      </nav>
    </div>
  )
}
