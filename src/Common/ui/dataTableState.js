const clampInteger = (value, fallback, min, max) => {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
}

export const serializeTableState = ({
    query = '',
    page = 1,
    pageSize = 10,
    sortBy = '',
    sortDirection = 'asc',
    filters = {},
} = {}) => {
    const params = new URLSearchParams()
    const normalizedQuery = String(query).trim()
    if (normalizedQuery) params.set('q', normalizedQuery)
    if (Number(page) > 1) params.set('page', String(page))
    if (Number(pageSize) !== 10) params.set('pageSize', String(pageSize))
    if (sortBy) {
        params.set('sort', sortBy)
        params.set('direction', sortDirection === 'desc' ? 'desc' : 'asc')
    }
    Object.entries(filters)
        .filter(([, value]) => value !== '' && value !== null && value !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .forEach(([key, value]) => params.set(`filter.${key}`, String(value)))
    return params.toString()
}

export const parseTableState = (search = '') => {
    const params = new URLSearchParams(String(search).replace(/^\?/, ''))
    const filters = {}
    params.forEach((value, key) => {
        if (key.startsWith('filter.')) filters[key.slice(7)] = value
    })

    return {
        query: params.get('q') || '',
        page: clampInteger(params.get('page'), 1, 1, Number.MAX_SAFE_INTEGER),
        pageSize: clampInteger(params.get('pageSize'), 10, 1, 100),
        sortBy: params.get('sort') || '',
        sortDirection: params.get('direction') === 'desc' ? 'desc' : 'asc',
        filters,
    }
}

export const paginateRows = (rows = [], { page = 1, pageSize = 10 } = {}) => {
    const safePageSize = clampInteger(pageSize, 10, 1, 100)
    const total = rows.length
    const pageCount = Math.max(1, Math.ceil(total / safePageSize))
    const safePage = clampInteger(page, 1, 1, pageCount)
    const start = (safePage - 1) * safePageSize
    const pageRows = rows.slice(start, start + safePageSize)

    return {
        rows: pageRows,
        page: safePage,
        pageSize: safePageSize,
        pageCount,
        total,
        from: total ? start + 1 : 0,
        to: total ? start + pageRows.length : 0,
    }
}

export const toggleVisibleColumn = (visibleKeys = [], key, columns = []) => {
    const column = columns.find((item) => item.key === key)
    if (!column || column.required) return [...visibleKeys]
    const next = visibleKeys.includes(key)
        ? visibleKeys.filter((item) => item !== key)
        : [...visibleKeys, key]
    return columns.filter((item) => item.required || next.includes(item.key)).map((item) => item.key)
}

export const toggleRowSelection = (selectedKeys = [], key) => (
    selectedKeys.includes(key)
        ? selectedKeys.filter((item) => item !== key)
        : [...selectedKeys, key]
)

export const togglePageSelection = (selectedKeys = [], pageKeys = []) => {
    const pageSet = new Set(pageKeys)
    const allSelected = pageKeys.length > 0 && pageKeys.every((key) => selectedKeys.includes(key))
    if (allSelected) return selectedKeys.filter((key) => !pageSet.has(key))
    return [...selectedKeys, ...pageKeys.filter((key) => !selectedKeys.includes(key))]
}
