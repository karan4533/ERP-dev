import test from 'node:test'
import assert from 'node:assert/strict'

import { filterAdmissionRecords, parseAdmissionDate } from '../../Admissions/admissionFilters.js'

const records = [
    { id: 'ADM-1', firstName: 'Asha', className: 'Grade 5', status: 'Active', createdDate: '02-10-2026' },
    { id: 'ADM-2', firstName: 'Bilal', className: 'Grade 6', status: 'Enrolled', createdDate: '20-10-2026' },
]

test('admission dates are parsed from stored day-month-year values', () => {
    assert.equal(parseAdmissionDate('20-10-2026').toISOString(), '2026-10-20T00:00:00.000Z')
    assert.equal(parseAdmissionDate('not-a-date'), null)
})

test('admission filters combine search, status and an inclusive date range', () => {
    assert.deepEqual(
        filterAdmissionRecords(records, {
            search: 'bilal',
            status: 'Enrolled',
            fromDate: '2026-10-20',
            toDate: '2026-10-20',
        }).map((record) => record.id),
        ['ADM-2'],
    )
})

test('admission filtering does not mutate source records', () => {
    const copy = structuredClone(records)
    filterAdmissionRecords(records, { search: 'grade' })
    assert.deepEqual(records, copy)
})
