import test from 'node:test'
import assert from 'node:assert/strict'

import {
    ADMISSION_STAGES,
    getAdmissionStageProgress,
    summarizePermissionChanges,
} from '../governance.js'

test('admission workflow exposes every documented information stage', () => {
    assert.deepEqual(
        ADMISSION_STAGES.map((stage) => stage.key),
        ['admission', 'student', 'transport', 'parents', 'account', 'fees'],
    )
})

test('admission progress reports completed and current stages from real fields', () => {
    const progress = getAdmissionStageProgress({
        admissionDate: '2026-10-27',
        className: 'Grade 5',
        firstName: 'Asha',
        mobileNumber: '9000000000',
    })

    assert.equal(progress.completed, 2)
    assert.equal(progress.total, 6)
    assert.equal(progress.currentStage, 'transport')
    assert.equal(progress.percent, 33)
})

test('permission change summary names granted and revoked access', () => {
    const modules = [
        { key: 'dashboard', label: 'Dashboard', alwaysOn: true },
        { key: 'admissions', label: 'Admissions' },
        { key: 'rbac', label: 'RBAC' },
    ]

    const summary = summarizePermissionChanges(
        { admissions: false, rbac: true },
        { admissions: true, rbac: false },
        modules,
    )

    assert.deepEqual(summary.granted, ['Admissions'])
    assert.deepEqual(summary.revoked, ['RBAC'])
    assert.equal(summary.changedCount, 2)
    assert.equal(summary.unchangedCount, 0)
})

test('always-on permissions are excluded from mutable consequences', () => {
    const summary = summarizePermissionChanges(
        { dashboard: false },
        { dashboard: true },
        [{ key: 'dashboard', label: 'Dashboard', alwaysOn: true }],
    )

    assert.equal(summary.changedCount, 0)
    assert.deepEqual(summary.granted, [])
    assert.deepEqual(summary.revoked, [])
})
