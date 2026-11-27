/**
 * Node unit tests for src/Pages/AccountHead/FeesManagement/feeLiveStats.js.
 * Run: node --test backend/scripts/_test_fee_live_stats.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    buildDefaulterRows,
    buildReceiptRows,
    concessionsByType,
    outstandingByGrade,
    overdueAging,
    paymentModeShares,
    receiptSourceLabel,
    receiptsByMonth,
    summarizeConcessions,
    summarizeDefaulters,
    summarizeReceipts,
} from '../../src/Pages/AccountHead/FeesManagement/feeLiveStats.js'

const TODAY = new Date('2026-11-13T10:00:00')
const students = [
    { id: 'S1', name: 'Aarav Demo', admissionNo: 'ADM-1', className: 'Grade 1', section: 'A' },
    { id: 'S2', name: 'Diya Demo', admissionNo: 'ADM-2', className: 'Grade 2', section: 'A' },
    { id: 'S3', name: 'Paid Up', admissionNo: 'ADM-3', className: 'Grade 1', section: 'A' },
]

describe('empty finance data', () => {
    it('produces no rows and zero totals (no demo fallback)', () => {
        assert.deepEqual(buildDefaulterRows([], []), [])
        assert.deepEqual(summarizeDefaulters([]), { count: 0, outstanding: 0, critical: 0, overdue: 0 })
        assert.deepEqual(buildReceiptRows([], []), [])
        assert.equal(summarizeReceipts([], TODAY).total, 0)
        assert.deepEqual(paymentModeShares([]), [])
        assert.deepEqual(summarizeConcessions([]), { count: 0, amount: 0, approved: 0, pending: 0 })
        assert.deepEqual(concessionsByType([]), [])
    })
})

describe('receipt source', () => {
    it('names the server channel and who recorded it; older receipts are marked as earlier records', () => {
        assert.equal(receiptSourceLabel({ channel: 'desk_collection', recordedByEmail: 'accounthead@qmis.edu' }), 'Finance desk · accounthead@qmis.edu')
        assert.equal(receiptSourceLabel({ channel: 'online_gateway', recordedBy: 'razorpay-webhook' }), 'Online payment · razorpay-webhook')
        assert.equal(receiptSourceLabel(undefined), 'Earlier record')
        const [row] = buildReceiptRows([{ id: 'R1', receiptNo: 'REC-1', studentId: 'S1', amountPaid: 10, receiptSource: { channel: 'desk_collection' } }], students)
        assert.equal(row.source, 'Finance desk')
    })
})

describe('defaulters', () => {
    const installments = [
        { studentId: 'S1', status: 'OVERDUE', balanceAmount: 5000, dueDate: '2026-08-01', feeHead: 'Tuition' },
        { studentId: 'S1', status: 'UNPAID', balanceAmount: 1000, dueDate: '2026-12-01', feeHead: 'Transport' },
        { studentId: 'S2', status: 'PARTIALLY_PAID', balanceAmount: 2000, dueDate: '2026-11-01', feeHead: 'Tuition' },
        { studentId: 'S3', status: 'PAID', balanceAmount: 0, dueDate: '2026-07-01', feeHead: 'Tuition' },
    ]
    const rows = buildDefaulterRows(students, installments, TODAY)

    it('only lists students with open balances', () => {
        assert.deepEqual(rows.map((r) => r.id), ['S1', 'S2'])
    })

    it('sums outstanding and ages from the earliest due date', () => {
        const s1 = rows.find((r) => r.id === 'S1')
        assert.equal(s1.outstanding, 6000)
        assert.equal(s1.daysOverdue, 104)
        assert.equal(s1.dueSince, '2026-08-01')
        assert.equal(s1.severity, 'CRITICAL')
        const s2 = rows.find((r) => r.id === 'S2')
        assert.equal(s2.status, 'PARTIAL PAYMENT')
        assert.equal(s2.severity, 'HIGH')
    })

    it('summarises, groups by grade and buckets aging from the same rows', () => {
        assert.deepEqual(summarizeDefaulters(rows), { count: 2, outstanding: 8000, critical: 1, overdue: 2 })
        assert.deepEqual(outstandingByGrade(rows), [
            { grade: 'Grade 1', value: 6000 },
            { grade: 'Grade 2', value: 2000 },
        ])
        const aging = Object.fromEntries(overdueAging(rows).map((b) => [b.label, b.value]))
        assert.equal(aging['1–30 days'], 1)
        assert.equal(aging['90+ days'], 1)
    })
})

describe('receipts', () => {
    const receipts = [
        { id: 'R1', receiptNo: 'REC-1', studentId: 'S1', amountPaid: 1000, paymentMode: 'CASH', paymentDate: '2026-11-13', status: 'Issued' },
        { id: 'R2', receiptNo: 'REC-2', studentId: 'S2', amountPaid: 500, paymentMode: 'UPI', paymentDate: '2026-10-02', status: 'Held' },
        { id: 'R3', receiptNo: 'REC-3', studentId: 'S2', amountPaid: 700, paymentMode: 'UPI', paymentDate: '2026-10-05', status: 'Cancelled' },
    ]

    it('maps live receipts to rows with the student name', () => {
        const rows = buildReceiptRows(receipts, students)
        assert.equal(rows[0].student, 'Aarav Demo')
        assert.equal(rows[0].status, 'Generated')
    })

    it('counts today, held and cancelled; excludes cancelled from amount', () => {
        assert.deepEqual(summarizeReceipts(receipts, TODAY), {
            total: 3, amount: 1500, today: 1, cancelled: 1, held: 1, reprinted: 0,
        })
    })

    it('buckets receipts by month and payment mode', () => {
        const months = receiptsByMonth(receipts, TODAY, 6)
        assert.deepEqual(months.labels, ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'])
        assert.deepEqual(months.values, [0, 0, 0, 0, 2, 1])
        assert.deepEqual(paymentModeShares(receipts).map((m) => [m.name, m.count]), [['UPI', 2], ['CASH', 1]])
    })
})

describe('concessions', () => {
    it('summarises and groups by type', () => {
        const rows = [
            { type: 'Sibling Discount', amount: 2000, status: 'Approved' },
            { type: 'Sibling Discount', amount: 1000, status: 'Pending' },
            { type: 'Merit Scholarship', amount: 5000, status: 'Approved' },
        ]
        assert.deepEqual(summarizeConcessions(rows), { count: 3, amount: 8000, approved: 2, pending: 1 })
        assert.deepEqual(concessionsByType(rows).map((r) => [r.name, r.amount, r.count]), [
            ['Merit Scholarship', 5000, 1],
            ['Sibling Discount', 3000, 2],
        ])
    })
})
