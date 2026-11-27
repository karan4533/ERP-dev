/**
 * Node unit tests for src/Common/listFiltering.js (no React).
 * Run: node --test backend/scripts/_test_list_filtering.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    filterIssueReturns,
    filterListRows,
    filterObservations,
    parseListDate,
} from '../../src/Common/listFiltering.js'

describe('parseListDate', () => {
    it('parses DD-MM-YYYY', () => {
        const d = parseListDate('10-06-2026')
        assert.equal(d.getFullYear(), 2026)
        assert.equal(d.getMonth(), 5)
        assert.equal(d.getDate(), 10)
    })
})

describe('filterObservations', () => {
    const rows = [
        {
            observationId: 'OBS-QA-2026-011',
            auditReference: 'AUD-QA-2026-038',
            department: 'Transport',
            category: 'Transport',
            title: 'Fire extinguisher expired',
            priority: 'Critical',
            status: 'Assigned',
            createdDate: '06-06-2026',
            dueDate: '08-06-2026',
        },
        {
            observationId: 'OBS-QA-2026-014',
            auditReference: 'AUD-QA-2026-043',
            department: 'Canteen',
            category: 'Safety & Hygiene',
            title: 'Food storage temperature log missing',
            priority: 'Critical',
            status: 'Open',
            createdDate: '10-06-2026',
            dueDate: '12-06-2026',
        },
    ]

    it('filters by search text', () => {
        const got = filterObservations(rows, { search: 'extinguisher' })
        assert.deepEqual(got.map((r) => r.observationId), ['OBS-QA-2026-011'])
    })

    it('filters by department and priority', () => {
        const got = filterObservations(rows, { department: 'Canteen', priority: 'Critical' })
        assert.equal(got.length, 1)
        assert.equal(got[0].observationId, 'OBS-QA-2026-014')
    })

    it('filters by date window on createdDate', () => {
        const got = filterObservations(rows, {
            fromDate: new Date(2026, 5, 9),
            toDate: new Date(2026, 5, 11),
        })
        assert.deepEqual(got.map((r) => r.observationId), ['OBS-QA-2026-014'])
    })
})

describe('filterIssueReturns', () => {
    const rows = [
        { id: 'IR-1', activityType: 'Issue', status: 'Issued', itemName: 'Pen', issueDate: '10-06-2026', requestedBy: 'A' },
        { id: 'IR-2', activityType: 'Return', status: 'Returned', itemName: 'Paper', issueDate: '01-05-2026', returnDate: '09-06-2026', requestedBy: 'B' },
    ]

    it('filters activity type Issue', () => {
        const got = filterIssueReturns(rows, { activityType: 'Issue' })
        assert.deepEqual(got.map((r) => r.id), ['IR-1'])
    })
})

describe('filterListRows equals', () => {
    it('skips empty equals values', () => {
        const rows = [{ status: 'Pending' }, { status: 'Approved' }]
        const got = filterListRows(rows, { equals: { status: '' } })
        assert.equal(got.length, 2)
    })
})
