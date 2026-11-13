import test from 'node:test'
import assert from 'node:assert/strict'

import {
    getAdmissionDraftKey,
    restoreAdmissionDraft,
    serializeAdmissionDraft,
} from '../../Admissions/admissionDraft.js'

test('admission drafts are isolated by portal and record', () => {
    assert.equal(
        getAdmissionDraftKey('/front-office/add-admission'),
        'schoolerp-admission-draft:front-office:new',
    )
    assert.equal(
        getAdmissionDraftKey('/admin/front-office/admission-list/edit/ADM-1', 'ADM-1'),
        'schoolerp-admission-draft:admin:ADM-1',
    )
})

test('admission drafts never persist account passwords', () => {
    const serialized = serializeAdmissionDraft({
        firstName: 'Asha',
        parentAccountPassword: 'secret-value',
        admissionDate: new Date('2026-10-27T00:00:00.000Z'),
    })

    assert.equal(serialized.includes('secret-value'), false)
    assert.equal(JSON.parse(serialized).form.parentAccountPassword, '')
})

test('restored admission drafts revive date fields', () => {
    const restored = restoreAdmissionDraft(JSON.stringify({
        savedAt: '2026-10-27T09:00:00.000Z',
        form: {
            admissionDate: '2026-10-27T00:00:00.000Z',
            dateOfBirth: '2015-05-04T00:00:00.000Z',
            batchStartYear: '2026-01-01T00:00:00.000Z',
            batchEndYear: null,
        },
    }))

    assert.equal(restored.form.admissionDate instanceof Date, true)
    assert.equal(restored.form.dateOfBirth instanceof Date, true)
    assert.equal(restored.form.batchStartYear instanceof Date, true)
    assert.equal(restored.form.batchEndYear, null)
})
