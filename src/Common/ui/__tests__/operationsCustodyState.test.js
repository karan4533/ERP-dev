import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getIssueReadiness,
    getIssueStockPreview,
    validateOperationsCustodyRecord,
} from '../../operations/operationsCustodyState.js'

const commonRecord = {
    employeeName: 'Priya Nair',
    employeeId: 'EMP-1042',
    department: 'Mathematics',
    itemName: 'Blue Ballpoint Pen',
    quantity: '20',
}

test('issue validation requires an issue date and blocks quantities above available stock', () => {
    const missingDate = validateOperationsCustodyRecord({
        ...commonRecord,
        activityType: 'Issue',
        issueDate: '',
    }, { availableStock: 450 })
    const excess = validateOperationsCustodyRecord({
        ...commonRecord,
        activityType: 'Issue',
        issueDate: '2026-11-01',
        quantity: '451',
    }, { availableStock: 450 })

    assert.equal(missingDate.issueDate, 'Select the issue date.')
    assert.equal(excess.quantity, 'Quantity exceeds the available stock of 450.')
})

test('return validation requires the original issue, return date and condition', () => {
    const errors = validateOperationsCustodyRecord({
        ...commonRecord,
        activityType: 'Return',
        originalIssueRef: '',
        returnDate: '',
        condition: '',
    })

    assert.deepEqual(errors, {
        originalIssueRef: 'Enter the original issue reference.',
        returnDate: 'Select the return date.',
        condition: 'Select the returned item condition.',
    })
})

test('issue stock preview reports the post-issue balance without going below zero', () => {
    assert.deepEqual(getIssueStockPreview({ availableStock: 24, quantity: 6 }), {
        availableStock: 24,
        requestedQuantity: 6,
        remainingStock: 18,
    })
    assert.deepEqual(getIssueStockPreview({ availableStock: 5, quantity: 8 }), {
        availableStock: 5,
        requestedQuantity: 8,
        remainingStock: 0,
    })
})

test('issue readiness stays unassessed until item and quantity exist', () => {
    assert.equal(getIssueReadiness({ availableStock: null, quantity: '' }), 'Not assessed')
    assert.equal(getIssueReadiness({ availableStock: 5, quantity: '' }), 'Not assessed')
    assert.equal(getIssueReadiness({ availableStock: 5, quantity: 8 }), 'Blocked')
    assert.equal(getIssueReadiness({ availableStock: 5, quantity: 1 }), 'Ready')
})
