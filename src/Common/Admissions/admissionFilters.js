export const parseAdmissionDate = (value) => {
    const match = String(value || '').match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (!match) return null
    const [, day, month, year] = match
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    return Number.isNaN(date.getTime()) ? null : date
}

const toBoundary = (value, endOfDay = false) => {
    if (!value) return null
    const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
    return Number.isNaN(date.getTime()) ? null : date
}

export const filterAdmissionRecords = (
    records,
    { search = '', status = '', fromDate = '', toDate = '' } = {},
) => {
    const query = search.trim().toLowerCase()
    const from = toBoundary(fromDate)
    const to = toBoundary(toDate, true)

    return records.filter((record) => {
        if (status && record.status !== status) return false
        const created = parseAdmissionDate(record.createdDate)
        if (from && created && created < from) return false
        if (to && created && created > to) return false
        if (!query) return true

        return [
            record.id,
            record.admissionNumber,
            record.rollNumber,
            record.firstName,
            record.middleName,
            record.lastName,
            record.className,
            record.mobileNumber,
            record.email,
            record.city,
        ].some((value) => String(value || '').toLowerCase().includes(query))
    })
}
