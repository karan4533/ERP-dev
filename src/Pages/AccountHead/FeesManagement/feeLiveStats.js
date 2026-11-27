/**
 * Pure derivations for the Fees Management tabs. Every figure comes from live Finance records
 * (students, installments, receipts, concessions) — no demo registers or hardcoded totals.
 * Kept free of React / Vite imports so it can be tested with `node --test`.
 */

const DAY_MS = 86400000

const OPEN_INSTALLMENT_STATUSES = new Set(['OVERDUE', 'UNPAID', 'PARTIALLY_PAID'])

export const parseFinanceDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
    const text = String(value).trim()
    const dmy = text.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
    const iso = dmy ? `${dmy[3]}-${dmy[2]}-${dmy[1]}` : text.slice(0, 10)
    const parsed = new Date(`${iso}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

// Local calendar key; toISOString() would shift local midnight to the previous UTC day in IST.
const localDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const initialsOf = (name) =>
    String(name || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'ST'

const classLabel = (student) =>
    student ? [student.className, student.section].filter(Boolean).join('-') : ''

const sum = (rows, pick) => rows.reduce((total, row) => total + (Number(pick(row)) || 0), 0)

// ---------- Defaulters ----------

export const buildDefaulterRows = (students = [], installments = [], today = new Date()) => {
    const day = startOfDay(today)
    return students
        .map((student) => {
            const open = installments.filter(
                (row) =>
                    row.studentId === student.id
                    && OPEN_INSTALLMENT_STATUSES.has(row.status)
                    && Number(row.balanceAmount) > 0,
            )
            if (!open.length) return null
            const dueDates = open.map((row) => parseFinanceDate(row.dueDate)).filter(Boolean)
            const earliestDue = dueDates.length ? new Date(Math.min(...dueDates.map((d) => d.getTime()))) : null
            const daysOverdue = earliestDue && earliestDue < day ? Math.floor((day - earliestDue) / DAY_MS) : 0
            const overdue = daysOverdue > 0 || open.some((row) => row.status === 'OVERDUE')
            return {
                id: student.id,
                student: student.name,
                studentId: student.admissionNo || student.id,
                initials: student.initials || initialsOf(student.name),
                className: classLabel(student),
                grade: student.className || '',
                dueSince: earliestDue ? localDateKey(earliestDue) : '',
                daysOverdue,
                outstanding: sum(open, (row) => row.balanceAmount),
                feeType: [...new Set(open.map((row) => row.feeHead).filter(Boolean))].join(', '),
                severity: daysOverdue > 60 ? 'CRITICAL' : overdue ? 'HIGH' : 'MODERATE',
                status: open.some((row) => row.status === 'PARTIALLY_PAID') ? 'PARTIAL PAYMENT' : 'FOLLOW-UP PENDING',
            }
        })
        .filter(Boolean)
}

export const summarizeDefaulters = (rows = []) => ({
    count: rows.length,
    outstanding: sum(rows, (row) => row.outstanding),
    critical: rows.filter((row) => row.severity === 'CRITICAL').length,
    overdue: rows.filter((row) => row.daysOverdue > 0).length,
})

export const outstandingByGrade = (rows = []) => {
    const totals = new Map()
    rows.forEach((row) => {
        const grade = row.grade || 'Unassigned'
        totals.set(grade, (totals.get(grade) || 0) + row.outstanding)
    })
    return [...totals.entries()]
        .map(([grade, value]) => ({ grade, value }))
        .sort((a, b) => b.value - a.value)
}

export const AGING_BUCKETS = [
    { label: 'Not yet due', min: -Infinity, max: 0 },
    { label: '1–30 days', min: 1, max: 30 },
    { label: '31–60 days', min: 31, max: 60 },
    { label: '61–90 days', min: 61, max: 90 },
    { label: '90+ days', min: 91, max: Infinity },
]

export const overdueAging = (rows = []) =>
    AGING_BUCKETS.map((bucket) => ({
        label: bucket.label,
        value: rows.filter((row) => row.daysOverdue >= bucket.min && row.daysOverdue <= bucket.max).length,
    }))

// ---------- Receipts ----------

const RECEIPT_CHANNEL_LABELS = {
    desk_collection: 'Finance desk',
    online_gateway: 'Online payment',
}

export const receiptSourceLabel = (source) => {
    if (!source || typeof source !== 'object') return 'Earlier record'
    const channel = RECEIPT_CHANNEL_LABELS[source.channel] || 'Server'
    const by = source.recordedByEmail || source.recordedBy || ''
    return by ? `${channel} · ${by}` : channel
}

export const buildReceiptRows = (receipts = [], students = []) =>
    receipts.map((item) => {
        const student = students.find((row) => row.id === item.studentId)
        return {
            id: item.id,
            receiptNo: item.receiptNo || item.id,
            student: student?.name || item.studentName || 'Unknown student',
            studentId: student?.admissionNo || item.studentId || '',
            initials: student?.initials || initialsOf(student?.name || item.studentName),
            className: item.className || classLabel(student),
            feeHeads: (item.feeHeads || []).join(', '),
            amountPaid: Number(item.amountPaid) || 0,
            paymentMode: item.paymentMode || '',
            paymentDate: item.paymentDate || '',
            status: item.status === 'Issued' ? 'Generated' : item.status || '',
            source: receiptSourceLabel(item.receiptSource),
        }
    })

export const summarizeReceipts = (receipts = [], today = new Date()) => {
    const todayKey = localDateKey(today)
    const active = receipts.filter((row) => String(row.status || '').toLowerCase() !== 'cancelled')
    return {
        total: receipts.length,
        amount: sum(active, (row) => row.amountPaid),
        today: receipts.filter((row) => {
            const date = parseFinanceDate(row.paymentDate)
            return date && localDateKey(date) === todayKey
        }).length,
        cancelled: receipts.length - active.length,
        held: receipts.filter((row) => row.status === 'Held').length,
        reprinted: receipts.filter((row) => Number(row.reprintCount) > 0).length,
    }
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const receiptsByMonth = (receipts = [], today = new Date(), months = 6) => {
    const buckets = []
    for (let offset = months - 1; offset >= 0; offset -= 1) {
        const ref = new Date(today.getFullYear(), today.getMonth() - offset, 1)
        buckets.push({ key: `${ref.getFullYear()}-${ref.getMonth()}`, label: MONTH_LABELS[ref.getMonth()], count: 0 })
    }
    const index = new Map(buckets.map((bucket, i) => [bucket.key, i]))
    receipts.forEach((row) => {
        const date = parseFinanceDate(row.paymentDate)
        if (!date) return
        const at = index.get(`${date.getFullYear()}-${date.getMonth()}`)
        if (at !== undefined) buckets[at].count += 1
    })
    return { labels: buckets.map((b) => b.label), values: buckets.map((b) => b.count) }
}

export const paymentModeShares = (receipts = []) => {
    const counts = new Map()
    receipts.forEach((row) => {
        const mode = String(row.paymentMode || 'Unspecified').toUpperCase().replace(/_/g, ' ')
        counts.set(mode, (counts.get(mode) || 0) + 1)
    })
    const total = receipts.length || 1
    return [...counts.entries()]
        .map(([name, count]) => ({ name, count, percent: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
}

// ---------- Concessions ----------

export const summarizeConcessions = (concessions = []) => ({
    count: concessions.length,
    amount: sum(concessions, (row) => row.amount),
    approved: concessions.filter((row) => row.status === 'Approved').length,
    pending: concessions.filter((row) => row.status === 'Pending').length,
})

export const concessionsByType = (concessions = []) => {
    const totals = new Map()
    concessions.forEach((row) => {
        const type = row.type || 'Other'
        const current = totals.get(type) || { name: type, amount: 0, count: 0 }
        current.amount += Number(row.amount) || 0
        current.count += 1
        totals.set(type, current)
    })
    return [...totals.values()].sort((a, b) => b.amount - a.amount)
}

// ---------- Shared ----------

export const matchesSearch = (row, query, keys) => {
    const q = String(query || '').trim().toLowerCase()
    if (!q) return true
    return keys.some((key) => String(row[key] ?? '').toLowerCase().includes(q))
}
