import test from 'node:test'
import assert from 'node:assert/strict'

const feedbackModule = await import('../feedback.js').catch(() => null)

const requireFeedback = () => {
    assert.ok(feedbackModule, 'the feedback-state module should be importable')
    return feedbackModule
}

test('feedback states use accessible roles and useful default recovery copy', () => {
    const { getFeedbackState } = requireFeedback()

    assert.deepEqual(getFeedbackState('loading'), {
        kind: 'loading',
        role: 'status',
        tone: 'info',
        title: 'Loading information',
        description: 'This may take a moment.',
    })
    assert.equal(getFeedbackState('error').role, 'alert')
    assert.match(getFeedbackState('error').description, /try again/i)
    assert.equal(getFeedbackState('permission').role, 'alert')
    assert.equal(getFeedbackState('unknown').kind, 'empty')
})

test('feedback copy can be overridden without changing semantic defaults', () => {
    const { getFeedbackState } = requireFeedback()
    const state = getFeedbackState('empty', {
        title: 'No fee receipts',
        description: 'Adjust the academic year or clear filters.',
    })

    assert.deepEqual(state, {
        kind: 'empty',
        role: 'status',
        tone: 'neutral',
        title: 'No fee receipts',
        description: 'Adjust the academic year or clear filters.',
    })
})

test('integration states distinguish demo data from connected services', () => {
    const { getIntegrationState } = requireFeedback()

    assert.deepEqual(getIntegrationState('demo'), {
        state: 'demo',
        tone: 'warning',
        title: 'Demo data',
        description: 'Changes are stored in this browser and are not connected to a production service.',
    })
    assert.equal(getIntegrationState('connected').tone, 'success')
    assert.equal(getIntegrationState('failed').tone, 'danger')
    assert.equal(getIntegrationState('unexpected').state, 'disconnected')
})
