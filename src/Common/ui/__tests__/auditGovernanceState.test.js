import test from 'node:test'
import assert from 'node:assert/strict'
import {
    canAuditActorTransition,
    filterGovernanceFindings,
    getAuditSubmissionGaps,
    getAuditSubmissionReadiness,
    getExecutiveFindingSummary,
    getFindingLifecycle,
    summarizeAuditSubmissionGaps,
} from '../../AuditGovernance/auditGovernanceState.js'

const sections = [{
    id: 'safety',
    title: 'Safety',
    parameters: [
        { id: 'fire-exit', label: 'Fire exit clear' },
        { id: 'first-aid', label: 'First aid kit stocked' },
    ],
}]

const compliantResponse = { response: 'Yes', comments: '', evidence: { photo: '', file: '', video: '', url: '' } }
const failedResponse = { response: 'No', comments: 'Exit blocked by stored furniture.', evidence: { photo: 'exit.jpg', file: '', video: '', url: '' } }
const completeObservation = {
    parameterId: 'fire-exit',
    title: 'Remove furniture from fire exit',
    description: 'Stored furniture obstructs the signed emergency route.',
    assignTo: 'Facilities Manager',
    dueDate: '2026-11-04',
    submitted: true,
}

test('submission gaps identify missing template version and unanswered questions', () => {
    const gaps = getAuditSubmissionGaps({
        header: { templateName: 'Safety audit', templateVersion: '' },
        sections,
        responses: { 'fire-exit': compliantResponse },
        observations: [],
    })

    assert.deepEqual(gaps.map((gap) => gap.code), ['template-version', 'unanswered'])
    assert.equal(gaps[1].parameterId, 'first-aid')
})

test('failed checks require a comment, evidence and a submitted owned finding with due date', () => {
    const gaps = getAuditSubmissionGaps({
        header: { templateName: 'Safety audit', templateVersion: '2.1' },
        sections: [{ id: 'safety', title: 'Safety', parameters: [{ id: 'fire-exit', label: 'Fire exit clear' }] }],
        responses: { 'fire-exit': { response: 'No', comments: '', evidence: {} } },
        observations: [{ parameterId: 'fire-exit', title: '', description: '', assignTo: '', dueDate: '', submitted: false }],
    })

    assert.deepEqual(gaps.map((gap) => gap.code), [
        'finding-comment',
        'finding-evidence',
        'finding-title',
        'finding-description',
        'finding-owner',
        'finding-due-date',
        'finding-not-submitted',
    ])
})

test('submission readiness is ready only when the governed audit is complete', () => {
    const audit = {
        header: { templateName: 'Safety audit', templateVersion: '2.1' },
        sections,
        responses: {
            'fire-exit': failedResponse,
            'first-aid': compliantResponse,
        },
        observations: [completeObservation],
    }

    assert.equal(getAuditSubmissionReadiness(audit), 'Ready')
    assert.deepEqual(summarizeAuditSubmissionGaps(getAuditSubmissionGaps(audit)), {
        total: 0,
        unanswered: 0,
        evidence: 0,
        findings: 0,
        configuration: 0,
    })
    assert.equal(getAuditSubmissionReadiness({ ...audit, observations: [] }), 'Blocked')
})

test('auditors can submit but only independent reviewers can verify or close audits', () => {
    assert.equal(canAuditActorTransition({ from: 'In Progress', to: 'Submitted', actor: 'auditor' }), true)
    assert.equal(canAuditActorTransition({ from: 'Submitted', to: 'Verified', actor: 'auditor' }), false)
    assert.equal(canAuditActorTransition({ from: 'Submitted', to: 'Verified', actor: 'reviewer' }), true)
    assert.equal(canAuditActorTransition({ from: 'Verified', to: 'Closed', actor: 'reviewer' }), true)
    assert.equal(canAuditActorTransition({ from: 'Submitted', to: 'Closed', actor: 'reviewer' }), false)
})

const governedFindings = [
    {
        id: 'F-001', title: 'Critical transport gap', department: 'Transport', severity: 'Critical',
        owner: 'Transport Manager', dueDate: '2026-10-01', rcaStatus: 'Pending', capaStatus: 'Not started',
        verificationStatus: 'Pending', closureStatus: 'Open',
    },
    {
        id: 'F-002', title: 'Closed academic gap', department: 'Academic', severity: 'Medium',
        owner: 'Academic Coordinator', dueDate: '2026-09-01', rcaStatus: 'Approved', capaStatus: 'Completed',
        verificationStatus: 'Verified', closureStatus: 'Closed',
    },
]

test('finding filters search ownership and governance stages', () => {
    assert.deepEqual(
        filterGovernanceFindings(governedFindings, { query: 'transport manager', severity: 'Critical', closureStatus: 'Open' }).map((item) => item.id),
        ['F-001'],
    )
    assert.deepEqual(filterGovernanceFindings(governedFindings, { verificationStatus: 'Verified' }).map((item) => item.id), ['F-002'])
})

test('finding lifecycle and executive summary preserve RCA, CAPA, verification and closure separation', () => {
    assert.deepEqual(getFindingLifecycle(governedFindings[0]).map((item) => [item.stage, item.status]), [
        ['Finding', 'Recorded'],
        ['RCA', 'Pending'],
        ['CAPA', 'Not started'],
        ['Verification', 'Pending'],
        ['Closure', 'Open'],
    ])
    assert.deepEqual(getExecutiveFindingSummary(governedFindings), {
        total: 2,
        criticalOpen: 1,
        overdue: 1,
        rcaPending: 1,
        verificationPending: 1,
        closed: 1,
        closureRate: 50,
    })
})
