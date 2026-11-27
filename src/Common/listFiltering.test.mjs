import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
    filterListRows,
    filterIssueReturns,
    filterObservations,
    filterStudentGatePassesByRange,
    parseListDate,
} from './listFiltering.js'

describe('parseListDate', () => {
    it('parses DD-MM-YYYY and ISO dates', () => {
        const dmy = parseListDate('15-03-2026')
        assert.equal(dmy.getFullYear(), 2026)
        assert.equal(dmy.getMonth(), 2)
        assert.equal(dmy.getDate(), 15)

        const iso = parseListDate('2026-03-15')
        assert.equal(iso.getFullYear(), 2026)
        assert.equal(iso.getMonth(), 2)
        assert.equal(iso.getDate(), 15)
    })
})

describe('filterListRows', () => {
    const rows = [
        { id: 'A1', name: 'Alpha', status: 'Open', date: '01-01-2026' },
        { id: 'B2', name: 'Beta', status: 'Closed', date: '15-02-2026' },
        { id: 'C3', name: 'Gamma', status: 'Open', date: '20-03-2026' },
    ]

    it('filters by search keys and exact equals', () => {
        const found = filterListRows(rows, {
            search: 'bet',
            searchKeys: ['id', 'name'],
            equals: { status: 'Closed' },
        })
        assert.deepEqual(found.map((row) => row.id), ['B2'])
    })

    it('filters by date window on dateKeys', () => {
        const found = filterListRows(rows, {
            fromDate: parseListDate('2026-02-01'),
            toDate: parseListDate('2026-02-28'),
            dateKeys: ['date'],
        })
        assert.deepEqual(found.map((row) => row.id), ['B2'])
    })

    it('skips empty equals values', () => {
        const found = filterListRows(rows, { equals: { status: '' } })
        assert.equal(found.length, 3)
    })
})

describe('domain helpers', () => {
    it('filterObservations and filterIssueReturns shrink matching rows', () => {
        const observations = filterObservations(
            [
                { observationId: 'OBS-1', department: 'IT', category: 'Safety', priority: 'High', createdDate: '01-01-2026' },
                { observationId: 'OBS-2', department: 'HR', category: 'Process', priority: 'Low', createdDate: '02-01-2026' },
            ],
            { search: 'OBS-1', department: 'IT' },
        )
        assert.equal(observations.length, 1)

        const issues = filterIssueReturns(
            [
                { id: 'IR-1', itemName: 'Paper', activityType: 'Issue', status: 'Open', issueDate: '01-01-2026' },
                { id: 'IR-2', itemName: 'Pens', activityType: 'Return', status: 'Closed', returnDate: '02-01-2026' },
            ],
            { search: 'paper', activityType: 'Issue' },
        )
        assert.equal(issues.length, 1)
    })

    it('filterStudentGatePassesByRange uses status and search', () => {
        const found = filterStudentGatePassesByRange(
            [
                { gatePassId: 'GP-1', studentName: 'Ada', status: 'Approved', requestDate: '01-01-2026' },
                { gatePassId: 'GP-2', studentName: 'Bob', status: 'Pending', requestDate: '02-01-2026' },
            ],
            { search: 'ada', status: 'Approved' },
        )
        assert.equal(found.length, 1)
        assert.equal(found[0].gatePassId, 'GP-1')
    })
})
