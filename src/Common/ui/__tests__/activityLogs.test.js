import test from 'node:test'
import assert from 'node:assert/strict'

import {
    filterActivityLogs,
    parseActivityTimestamp,
} from '../../../Pages/SuperAdmin/ActivityLogs/activityLogsData.js'

const records = [
    { id: 'log-1', timestamp: '07-08-2026 11:22 PM', user: 'Asha', status: 'Blocked' },
    { id: 'log-2', timestamp: '08-08-2026 06:42 AM', user: 'Bilal', status: 'Failed' },
]

test('activity timestamps are parsed from stored day-month-year values', () => {
    assert.equal(parseActivityTimestamp(records[0].timestamp)?.toISOString(), '2026-08-07T23:22:00.000Z')
    assert.equal(parseActivityTimestamp('not-a-timestamp'), null)
})

test('activity filters combine search, status and inclusive dates', () => {
    assert.deepEqual(
        filterActivityLogs(records, {
            search: 'bilal',
            status: 'Failed',
            fromDate: '2026-08-08',
            toDate: '2026-08-08',
        }).map((record) => record.id),
        ['log-2'],
    )
})

test('activity filtering does not mutate source records', () => {
    const copy = structuredClone(records)
    filterActivityLogs(records, { fromDate: '2026-08-08' })
    assert.deepEqual(records, copy)
})
