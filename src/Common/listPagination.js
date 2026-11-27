/**
 * Shared client-side pagination helpers for list pages.
 * Pure functions — safe for Node unit tests without React.
 */

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

const toPositiveInt = (value, fallback) => {
    const n = Math.floor(Number(value))
    return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * Slice `rows` to one page. `page` is 1-based and clamped to [1, totalPages],
 * so a stale page number after filtering never yields an empty page.
 */
export const paginateRows = (rows, page = 1, pageSize = 10) => {
    const list = Array.isArray(rows) ? rows : []
    const size = toPositiveInt(pageSize, 10)
    const total = list.length
    const totalPages = Math.max(1, Math.ceil(total / size))
    const current = Math.min(toPositiveInt(page, 1), totalPages)
    const startIndex = (current - 1) * size
    const pageRows = list.slice(startIndex, startIndex + size)
    return {
        rows: pageRows,
        page: current,
        pageSize: size,
        total,
        totalPages,
        from: total ? startIndex + 1 : 0,
        to: startIndex + pageRows.length,
        hasPrev: current > 1,
        hasNext: current < totalPages,
    }
}

/** Up to `size` consecutive page numbers centred on `page`. */
export const pageWindow = (page, totalPages, size = 5) => {
    const total = toPositiveInt(totalPages, 1)
    const width = Math.min(toPositiveInt(size, 5), total)
    const current = Math.min(toPositiveInt(page, 1), total)
    let start = Math.max(1, current - Math.floor(width / 2))
    if (start + width - 1 > total) start = total - width + 1
    return Array.from({ length: width }, (_, i) => start + i)
}

export const describePageRange = ({ from = 0, to = 0, total = 0 } = {}) =>
    total ? `Showing ${from} to ${to} of ${total} entries` : 'Showing 0 entries'

/** Empty-state copy: distinguishes "nothing loaded" from "filters hid everything". */
export const emptyListMessage = (sourceCount) =>
    Number(sourceCount) > 0 ? 'No records match the filters.' : 'No records yet.'
