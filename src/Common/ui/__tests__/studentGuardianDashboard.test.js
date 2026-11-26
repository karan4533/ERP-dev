import test from 'node:test'
import assert from 'node:assert/strict'

import { getStudentGuardianDashboardData } from '../../Academic/studentGuardianDashboardData.js'

test('student and guardian dashboards cover today, due work, attendance, results and payments', () => {
    for (const prefix of ['/student', '/parent']) {
        const dashboard = getStudentGuardianDashboardData(prefix)
        assert.deepEqual(
            dashboard.priorities.map((item) => item.key),
            ['today', 'due-work', 'attendance', 'results', 'payments'],
        )
        assert.ok(dashboard.priorities.every((item) => item.to.startsWith(`${prefix}/`)))
    }
})

test('student and guardian dashboard rejects an unsupported portal prefix', () => {
    assert.equal(getStudentGuardianDashboardData('/teacher'), null)
})
