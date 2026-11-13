import test from 'node:test'
import assert from 'node:assert/strict'
import {
    calculateOrderPricing,
    getMenuReadiness,
    getOrderReadiness,
    validateCanteenMenuItem,
    validateCanteenOrder,
} from '../../operations/canteenOperationsState.js'

const validMenuItem = {
    itemName: 'Vegetable poha',
    category: 'Breakfast',
    itemCode: 'BF-POH-007',
    price: '35',
    dietaryType: 'Vegetarian',
    allergenDeclaration: 'Contains peanuts',
    availability: 'Available',
    status: 'Active',
    isCombo: 'No',
}

test('menu validation requires identity, a positive price and food-safety context', () => {
    const errors = validateCanteenMenuItem({
        ...validMenuItem,
        itemName: '',
        category: '',
        itemCode: '',
        price: '0',
        dietaryType: '',
        allergenDeclaration: '',
    })

    assert.deepEqual(errors, {
        itemName: 'Enter the item name.',
        category: 'Select a category.',
        itemCode: 'Enter a unique item code.',
        price: 'Enter a price greater than zero.',
        dietaryType: 'Select a dietary classification.',
        allergenDeclaration: 'Declare allergens or enter “None declared”.',
    })
})

test('combo menu items require their included components', () => {
    const errors = validateCanteenMenuItem({ ...validMenuItem, isCombo: 'Yes', comboContents: '' })

    assert.equal(errors.comboContents, 'List the items included in this combo.')
    assert.equal(getMenuReadiness(validMenuItem), 'Ready')
    assert.equal(getMenuReadiness({ ...validMenuItem, price: '' }), 'Not assessed')
    assert.equal(getMenuReadiness({ ...validMenuItem, price: '-5' }), 'Blocked')
})

test('order pricing uses per-item quantities and returns a stable item count', () => {
    const pricing = calculateOrderPricing([
        { menuId: 'MENU001', quantity: 2 },
        { menuId: 'MENU003', quantity: 1 },
    ], [
        { id: 'MENU001', name: 'Veg Biryani', price: 60 },
        { id: 'MENU003', name: 'Fresh Fruit Juice', price: 30 },
    ])

    assert.deepEqual(pricing, {
        lineCount: 2,
        itemCount: 3,
        subtotal: 150,
        total: 150,
    })
})

test('order validation blocks unknown customers, empty carts and invalid quantities', () => {
    const errors = validateCanteenOrder({
        rfidCardNo: 'RFID-9999',
        customer: null,
        lines: [{ menuId: 'MENU001', quantity: 0 }],
        orderType: 'Counter',
        paymentMethod: 'Wallet',
        paymentStatus: 'Pending',
        orderStatus: 'Preparing',
        expectedReadyTime: '',
    })

    assert.deepEqual(errors, {
        rfidCardNo: 'Enter a recognised customer RFID card number.',
        lines: 'Every selected item needs a quantity of at least one.',
        expectedReadyTime: 'Select the expected ready time.',
    })
})

test('order readiness stays unassessed until customer, cart and ready time exist', () => {
    assert.equal(getOrderReadiness({ rfidCardNo: '', customer: null, lines: [], expectedReadyTime: '' }), 'Not assessed')
    assert.equal(getOrderReadiness({ rfidCardNo: 'RFID-1001', customer: null, lines: [{ menuId: 'MENU001', quantity: 1 }], expectedReadyTime: '12:30' }), 'Blocked')
    assert.equal(getOrderReadiness({ rfidCardNo: 'RFID-1001', customer: { name: 'Rahul Sharma' }, lines: [{ menuId: 'MENU001', quantity: 1 }], expectedReadyTime: '12:30' }), 'Ready')
})
