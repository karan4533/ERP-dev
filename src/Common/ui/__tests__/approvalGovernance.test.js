import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
    appendApprovalDecision,
    getLatestApprovalDecision,
} from '../../approvals/approvalHistory.js'

test('approval decisions are appended without mutating prior history', () => {
    const original = [{ status: 'Submitted', actor: 'Teacher', decidedAt: '2026-10-27T08:00:00.000Z' }]
    const next = appendApprovalDecision(original, {
        status: 'Approved',
        actor: 'Director',
        remarks: 'Ready to publish',
        decidedAt: '2026-10-28T09:00:00.000Z',
    })

    assert.equal(original.length, 1)
    assert.equal(next.length, 2)
    assert.deepEqual(getLatestApprovalDecision(next), next[1])
    assert.equal(next[1].actor, 'Director')
})

test('rejection decisions require a rationale', () => {
    assert.throws(
        () => appendApprovalDecision([], { status: 'Rejected', actor: 'Director', remarks: '   ' }),
        /rationale/i,
    )
})

test('confirmation prerequisites disable only the confirm action', () => {
    const source = readFileSync(new URL('../ConfirmAction.jsx', import.meta.url), 'utf8')
    assert.match(source, /onClick=\{\(\) => onClose\?\.\('cancel'\)\}[\s\S]*?disabled=\{busy\}/)
    assert.match(source, /onClick=\{onConfirm\}[\s\S]*?disabled=\{busy \|\| confirmDisabled\}/)
})

test('Director approval workspaces expose governed actions and responsive records', () => {
    const list = readFileSync(new URL('../../../Pages/Director/MarkEntryApproval/MarkEntryApproval.jsx', import.meta.url), 'utf8')
    const review = readFileSync(new URL('../../../Pages/Director/MarkEntryApproval/MarkEntryReview.jsx', import.meta.url), 'utf8')
    const lessonDetail = readFileSync(new URL('../../LessonPlanApproval/Components/LessonPlanGroupDetail.jsx', import.meta.url), 'utf8')
    const lessonList = readFileSync(new URL('../../LessonPlanApproval/LessonPlanReviewWorkspace.jsx', import.meta.url), 'utf8')

    assert.match(list, /<DataTable/)
    assert.match(list, /<Pagination/)
    assert.doesNotMatch(list, /ExportModal/)
    assert.match(review, /ConfirmAction/)
    assert.match(review, /ApprovalHistoryTimeline/)
    assert.match(lessonDetail, /ApprovalHistoryTimeline/)
    assert.match(lessonDetail, /rejection rationale/i)
    assert.match(lessonList, /<DataTable/)
    assert.match(lessonList, /<Pagination/)
    assert.doesNotMatch(lessonList, /ExportModal/)
})
