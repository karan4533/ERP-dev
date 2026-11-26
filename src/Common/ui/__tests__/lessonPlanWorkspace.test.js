import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { getLessonPlanWorkspaceConfig } from '../../LessonPlanApproval/lessonPlanWorkspaceConfig.js'

test('lesson-plan workspace resolves each academic author to role-scoped routes', () => {
    const teacher = getLessonPlanWorkspaceConfig('teacher')
    const coordinator = getLessonPlanWorkspaceConfig('coordinator')

    assert.equal(teacher.submitterName, 'Mr. Anil Kumar')
    assert.equal(coordinator.submitterName, 'Ms. Priya Nair')
    assert.ok(teacher.createRoute.startsWith('/teacher/'))
    assert.ok(coordinator.createRoute.startsWith('/coordinator/'))
})

test('lesson-plan workspace fails closed for an unknown role', () => {
    assert.equal(getLessonPlanWorkspaceConfig('principal'), null)
})

test('coordinator routes load coordinator lesson-plan wrappers', () => {
    const source = readFileSync(new URL('../../../Routes/CoordinatorRoutes.jsx', import.meta.url), 'utf8')
    assert.match(source, /Pages\/Coordinator\/LessonPlanApproval\/SubmitLessonPlan/)
    assert.match(source, /Pages\/Coordinator\/LessonPlanApproval\/MyLessonPlan/)
    assert.doesNotMatch(source, /Pages\/Teacher\/LessonPlanApproval/)
})
