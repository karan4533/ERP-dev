import test from 'node:test'
import assert from 'node:assert/strict'

import { getAcademicBriefing } from '../../Academic/academicDashboardData.js'

const roleScopes = {
    teacher: '/teacher/',
    coordinator: '/coordinator/',
    librarian: '/librarian/',
    principal: '/principal/',
    director: '/director/',
}

test('academic role briefings expose metrics, queues and common actions', () => {
    Object.keys(roleScopes).forEach((role) => {
        const briefing = getAcademicBriefing(role)
        assert.equal(briefing.metrics.length, 4)
        assert.ok(briefing.queues.length >= 3)
        assert.ok(briefing.quickActions.length >= 3)
    })
})

test('academic role briefing actions stay inside the authenticated role scope', () => {
    Object.entries(roleScopes).forEach(([role, prefix]) => {
        const briefing = getAcademicBriefing(role)
        const routes = [...briefing.queues, ...briefing.quickActions].map((item) => item.to)
        assert.ok(routes.every((route) => route.startsWith(prefix)))
    })
})

test('unknown academic roles fail closed instead of receiving another role dashboard', () => {
    assert.equal(getAcademicBriefing('unknown-role'), null)
})
