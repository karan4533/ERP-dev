export const parseOperationsReportDate = (value) => {
    if (!value || typeof value !== 'string') return null
    const parts = value.split('-').map(Number)
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null
    const [first, second, third] = parts
    const [year, month, day] = first > 999 ? [first, second, third] : [third, second, first]
    const date = new Date(Date.UTC(year, month - 1, day))
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
    return date
}

export const filterOperationsReportRows = (rows, { query = '', dateKey, fromDate = '', toDate = '' } = {}) => {
    const normalizedQuery = query.trim().toLowerCase()
    const from = parseOperationsReportDate(fromDate)?.getTime() ?? null
    const to = parseOperationsReportDate(toDate)?.getTime() ?? null
    return rows.filter((row) => {
        const searchable = Object.values(row).filter((value) => value != null).join(' ').toLowerCase()
        const rowTime = dateKey ? (parseOperationsReportDate(row[dateKey])?.getTime() ?? null) : null
        return (!normalizedQuery || searchable.includes(normalizedQuery))
            && (!dateKey || from == null || (rowTime != null && rowTime >= from))
            && (!dateKey || to == null || (rowTime != null && rowTime <= to))
    })
}
