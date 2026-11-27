/**
 * Shared list filtering helpers for Search / Filters / Export pipelines.
 * Pure functions — safe for Node unit tests without React.
 */

const pad = (value) => String(value).padStart(2, '0')

/** Parse common ERP date strings (DD-MM-YYYY, DD/MM/YYYY, ISO) into a local Date at midnight. */
export const parseListDate = (value) => {
    if (!value) return null
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate())
    }
    const text = String(value).trim()
    if (!text) return null

    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) {
        return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    }

    const dmy = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/)
    if (dmy) {
        return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    }

    const parsed = new Date(text)
    if (Number.isNaN(parsed.getTime())) return null
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

export const startOfDay = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export const endOfDay = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export const formatListDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`
}

/**
 * Filter rows by search text, exact field matches, and optional date window.
 *
 * @param {Array<object>} rows
 * @param {object} options
 * @param {string} [options.search]
 * @param {string[]} [options.searchKeys] field names searched as a haystack
 * @param {Record<string, string>} [options.equals] field → required exact value (empty = skip)
 * @param {Date|null} [options.fromDate]
 * @param {Date|null} [options.toDate]
 * @param {string|string[]} [options.dateKeys] field(s) used for date comparison
 */
export const filterListRows = (rows, options = {}) => {
    const list = Array.isArray(rows) ? rows : []
    const search = String(options.search || '').trim().toLowerCase()
    const searchKeys = Array.isArray(options.searchKeys) ? options.searchKeys : []
    const equals = options.equals && typeof options.equals === 'object' ? options.equals : {}
    const from = startOfDay(options.fromDate)
    const to = endOfDay(options.toDate)
    const dateKeys = Array.isArray(options.dateKeys)
        ? options.dateKeys
        : options.dateKeys
            ? [options.dateKeys]
            : []

    return list.filter((row) => {
        if (!row || typeof row !== 'object') return false

        for (const [key, want] of Object.entries(equals)) {
            if (!want) continue
            if (String(row[key] ?? '') !== String(want)) return false
        }

        if (from || to) {
            const candidates = dateKeys.length
                ? dateKeys.map((key) => parseListDate(row[key]))
                : [null]
            const itemDate = candidates.find((d) => d) || null
            if (from && itemDate && itemDate < from) return false
            if (to && itemDate && itemDate > to) return false
            // If a date filter is set but the row has no parseable date, keep the row
            // only when no dateKeys were requested; otherwise exclude.
            if ((from || to) && dateKeys.length && !itemDate) return false
        }

        if (!search) return true
        if (!searchKeys.length) {
            const haystack = Object.values(row).map((v) => String(v ?? '')).join(' ').toLowerCase()
            return haystack.includes(search)
        }
        const haystack = searchKeys.map((key) => String(row[key] ?? '')).join(' ').toLowerCase()
        return haystack.includes(search)
    })
}

export const filterObservations = (rows, filters = {}) =>
    filterListRows(rows, {
        search: filters.search,
        searchKeys: [
            'observationId',
            'id',
            'referenceNumber',
            'auditReference',
            'title',
            'department',
            'category',
            'priority',
            'status',
        ],
        equals: {
            department: filters.department || '',
            category: filters.category || '',
            priority: filters.priority || '',
        },
        fromDate: filters.fromDate ?? null,
        toDate: filters.toDate ?? null,
        dateKeys: ['createdDate', 'dueDate', 'auditDate'],
    })

export const filterIssueReturns = (rows, filters = {}) =>
    filterListRows(rows, {
        search: filters.search,
        searchKeys: ['id', 'requestedBy', 'department', 'itemName', 'activityType', 'status'],
        equals: {
            activityType: filters.activityType || '',
            status: filters.status || '',
        },
        fromDate: filters.fromDate ?? null,
        toDate: filters.toDate ?? null,
        dateKeys: ['issueDate', 'returnDate', 'createdDate'],
    })

export const filterStudentGatePassesByRange = (rows, filters = {}) =>
    filterListRows(rows, {
        search: filters.search,
        searchKeys: [
            'id',
            'gatePassId',
            'studentName',
            'className',
            'section',
            'reason',
            'status',
            'requestedBy',
        ],
        equals: {
            status: filters.status || '',
        },
        fromDate: filters.fromDate ?? null,
        toDate: filters.toDate ?? null,
        dateKeys: ['requestDate', 'fromDate', 'toDate', 'createdDate', 'date'],
    })
