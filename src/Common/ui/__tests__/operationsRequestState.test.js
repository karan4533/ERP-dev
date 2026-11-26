import test from 'node:test'
import assert from 'node:assert/strict'
import { validateOperationsRequest } from '../../operations/operationsRequestState.js'

test('operations request validation requires workflow-critical fields', () => {
    const errors = validateOperationsRequest({
        requestType: '',
        title: ' ',
        description: '',
        priority: '',
        estimatedAmount: '',
        requiredByDate: '',
        lineItems: [],
    }, { requireLineItems: false })

    assert.deepEqual(errors, {
        requestType: 'Select a request type.',
        title: 'Enter a request title.',
        description: 'Describe why this request is needed.',
        priority: 'Select a priority.',
    })
})

test('operations request validation checks positive money and complete line items', () => {
    const errors = validateOperationsRequest({
        requestType: 'Purchase',
        title: 'Cleaning supplies',
        description: 'Replenish supplies for the next service cycle.',
        priority: 'High',
        estimatedAmount: '-20',
        lineItems: [
            { item: 'Floor cleaner', quantity: '0', estimatedCost: '₹400' },
            { item: '', quantity: '2', estimatedCost: '100' },
        ],
    }, { requireLineItems: true })

    assert.equal(errors.estimatedAmount, 'Enter an amount greater than zero.')
    assert.equal(errors['lineItems.0.quantity'], 'Enter a quantity greater than zero.')
    assert.equal(errors['lineItems.1.item'], 'Enter an item name.')
})

test('a complete operations request passes client validation', () => {
    const errors = validateOperationsRequest({
        requestType: 'Purchase',
        title: 'Cleaning supplies',
        description: 'Replenish supplies for the next service cycle.',
        priority: 'High',
        estimatedAmount: '18,600',
        requiredByDate: '2026-11-15',
        lineItems: [{ item: 'Floor cleaner', quantity: '20', estimatedCost: '6,400' }],
    }, { requireLineItems: true })

    assert.deepEqual(errors, {})
})
