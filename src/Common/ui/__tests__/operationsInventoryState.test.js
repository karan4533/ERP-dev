import test from 'node:test'
import assert from 'node:assert/strict'
import {
    deriveInventoryStatus,
    getInventoryHealth,
    validateOperationsInventoryItem,
} from '../../operations/operationsInventoryState.js'

test('inventory validation requires identity and stock fields', () => {
    const errors = validateOperationsInventoryItem({
        name: ' ',
        category: '',
        code: '',
        quantity: '',
        unit: '',
    }, { requireCode: true })

    assert.deepEqual(errors, {
        name: 'Enter an item name.',
        category: 'Select a category.',
        code: 'Enter an item code.',
        quantity: 'Enter the current quantity.',
        unit: 'Select a stock unit.',
    })
})

test('inventory validation accepts zero stock but rejects negative values', () => {
    const valid = validateOperationsInventoryItem({
        name: 'Floor cleaner',
        category: 'Cleaning Chemical',
        quantity: '0',
        unit: 'Bottle',
        reorderLevel: '12',
        unitCost: '250',
    })
    const invalid = validateOperationsInventoryItem({
        name: 'Floor cleaner',
        category: 'Cleaning Chemical',
        quantity: '-1',
        unit: 'Bottle',
        reorderLevel: '-2',
        unitCost: '0',
    })

    assert.deepEqual(valid, {})
    assert.equal(invalid.quantity, 'Quantity cannot be negative.')
    assert.equal(invalid.reorderLevel, 'Reorder level cannot be negative.')
    assert.equal(invalid.unitCost, 'Unit cost must be greater than zero.')
})

test('inventory status follows quantity and reorder threshold', () => {
    assert.equal(deriveInventoryStatus({ quantity: '', reorderLevel: '' }), 'Not assessed')
    assert.equal(deriveInventoryStatus({ quantity: 0, reorderLevel: 10 }), 'Out of Stock')
    assert.equal(deriveInventoryStatus({ quantity: 8, reorderLevel: 10 }), 'Low Stock')
    assert.equal(deriveInventoryStatus({ quantity: 11, reorderLevel: 10 }), 'Available')
    assert.equal(deriveInventoryStatus({ quantity: 2, reorderLevel: '' }), 'Available')
})

test('inventory health reports the quantity needed to recover the reorder threshold', () => {
    assert.deepEqual(getInventoryHealth({ availableQuantity: 8, reorderLevel: 20 }), {
        quantity: 8,
        reorderLevel: 20,
        shortage: 12,
        status: 'Low Stock',
    })
    assert.deepEqual(getInventoryHealth({ availableQuantity: 24, reorderLevel: 15 }), {
        quantity: 24,
        reorderLevel: 15,
        shortage: 0,
        status: 'Available',
    })
})
