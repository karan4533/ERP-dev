import test from 'node:test'
import assert from 'node:assert/strict'

import {
    buildWorkflowEvents,
    getWorkflowDueDate,
    getWorkflowState,
    parseWorkflowDate,
} from '../workflow.js'

test('maps the documented workflow states to stable labels, tones and terminal rules', () => {
    const cases = [
        ['Draft', 'draft', 'Draft', 'neutral', false],
        ['Submitted', 'submitted', 'Submitted', 'info', false],
        ['Pending', 'pending', 'Pending', 'warning', false],
        ['Approved', 'approved', 'Approved', 'success', true],
        ['Rejected', 'rejected', 'Rejected', 'danger', true],
        ['Closed', 'closed', 'Closed', 'neutral', true],
    ]

    cases.forEach(([input, key, label, tone, terminal]) => {
        assert.deepEqual(getWorkflowState(input), {
            key,
            label,
            tone,
            terminal,
            overdue: false,
            sourceStatus: input,
        })
    })
})

test('promotes an active item to overdue after its due time without changing its source status', () => {
    assert.deepEqual(
        getWorkflowState('In Review', {
            dueAt: '2026-10-26T09:00:00.000Z',
            now: '2026-10-27T09:00:00.000Z',
        }),
        {
            key: 'overdue',
            label: 'Overdue',
            tone: 'danger',
            terminal: false,
            overdue: true,
            sourceStatus: 'In Review',
        },
    )
})

test('does not mark terminal work overdue even when its due time is in the past', () => {
    const state = getWorkflowState('Approved', {
        dueAt: '2026-10-01T09:00:00.000Z',
        now: '2026-10-27T09:00:00.000Z',
    })

    assert.equal(state.key, 'approved')
    assert.equal(state.overdue, false)
})

test('parses stored day-month-year dates without relying on browser locale parsing', () => {
    assert.equal(parseWorkflowDate('07-11-2026')?.toISOString(), '2026-11-07T00:00:00.000Z')
    assert.equal(parseWorkflowDate('not-a-date'), null)
})

test('treats a date-only workflow deadline as the end of that local business day', () => {
    assert.equal(getWorkflowDueDate('07-11-2026')?.toISOString(), '2026-11-07T23:59:59.999Z')
    assert.equal(getWorkflowDueDate('2026-11-07')?.toISOString(), '2026-11-07T23:59:59.999Z')
})

test('builds a truthful timeline and leaves unknown timestamps empty', () => {
    assert.deepEqual(
        buildWorkflowEvents({
            status: 'Approved',
            submittedLabel: 'Leave request submitted',
            submittedBy: 'Anita Rao',
            submittedAt: '07-11-2026',
            owner: 'Principal',
            remarks: 'Coverage confirmed.',
        }),
        [
            {
                id: 'submitted',
                label: 'Leave request submitted',
                actor: 'Anita Rao',
                timestamp: '2026-11-07T00:00:00.000Z',
                description: '',
                tone: 'info',
                current: false,
            },
            {
                id: 'approved',
                label: 'Approved',
                actor: 'Principal',
                timestamp: null,
                description: 'Coverage confirmed.',
                tone: 'success',
                current: true,
            },
        ],
    )
})

test('represents a submitted item waiting on its owner as a pending current step', () => {
    const events = buildWorkflowEvents({
        status: 'Pending',
        submittedBy: 'Arjun Sharma',
        submittedAt: '2026-10-27T08:30:00.000Z',
        owner: 'Class teacher',
    })

    assert.equal(events.length, 2)
    assert.equal(events[1].id, 'pending')
    assert.equal(events[1].actor, 'Class teacher')
    assert.equal(events[1].timestamp, null)
    assert.equal(events[1].current, true)
})
