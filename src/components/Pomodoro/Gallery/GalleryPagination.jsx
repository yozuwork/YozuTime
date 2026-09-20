import './Gallery.css'

function getPageList(current, total) {
  const keep = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...keep].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  const result = []
  let previous = 0
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push(`ellipsis-${page}`)
    result.push(page)
    previous = page
  }
  return result
}

function GalleryPagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = getPageList(currentPage, totalPages)

  return (
    <div className="gallery-pagination">
      <button type="button" disabled={currentPage === 1} onClick={() => onChange(currentPage - 1)} aria-label="上一頁">
        ‹
      </button>
      {pages.map((page) =>
        typeof page === 'number' ? (
          <button
            key={page}
            type="button"
            className={page === currentPage ? 'is-active' : ''}
            onClick={() => onChange(page)}
          >
            {page}
          </button>
        ) : (
          <span key={page} className="gallery-pagination-ellipsis">…</span>
        )
      )}
      <button type="button" disabled={currentPage === totalPages} onClick={() => onChange(currentPage + 1)} aria-label="下一頁">
        ›
      </button>
    </div>
  )
}

export default GalleryPagination
