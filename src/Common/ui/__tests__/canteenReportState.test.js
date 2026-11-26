import assert from 'node:assert/strict'
import test from 'node:test'
import { filterCanteenReportRows, parseCanteenReportDate } from '../../operations/canteenReportState.js'

test('canteen report dates use stored day-month-year values', () => {
    assert.equal(parseCanteenReportDate('10-06-2026')?.toISOString(), '2026-06-10T00:00:00.000Z')
    assert.equal(parseCanteenReportDate('not-a-date'), null)
})

test('canteen report filters combine search and an inclusive date range', () => {
    const rows = [
        { id: '1', item: 'Basmati Rice', date: '09-06-2026' },
        { id: '2', item: 'Cooking Oil', date: '10-06-2026' },
        { id: '3', item: 'Fresh Vegetables', date: '11-06-2026' },
    ]
    const result = filterCanteenReportRows(rows, {
        query: 'oil',
        dateKey: 'date',
        fromDate: '2026-06-10',
        toDate: '2026-06-10',
    })
    assert.deepEqual(result.map((row) => row.id), ['2'])
    assert.equal(rows.length, 3)
})
