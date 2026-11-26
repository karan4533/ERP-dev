const positiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) >= 1

export const createEmptyCanteenMenuItem = () => ({
    itemName: '',
    category: '',
    itemCode: '',
    price: '',
    dietaryType: '',
    allergenDeclaration: '',
    availability: 'Available',
    isCombo: 'No',
    comboContents: '',
    status: 'Active',
    description: '',
})

export const validateCanteenMenuItem = (item) => {
    const errors = {}

    if (!item.itemName?.trim()) errors.itemName = 'Enter the item name.'
    if (!item.category) errors.category = 'Select a category.'
    if (!item.itemCode?.trim()) errors.itemCode = 'Enter a unique item code.'
    if (!Number.isFinite(Number(item.price)) || Number(item.price) <= 0) {
        errors.price = 'Enter a price greater than zero.'
    }
    if (!item.dietaryType) errors.dietaryType = 'Select a dietary classification.'
    if (!item.allergenDeclaration?.trim()) {
        errors.allergenDeclaration = 'Declare allergens or enter “None declared”.'
    }
    if (item.isCombo === 'Yes' && !item.comboContents?.trim()) {
        errors.comboContents = 'List the items included in this combo.'
    }

    return errors
}

export const getMenuReadiness = (item) => {
    const requiredValues = [item.itemName, item.category, item.itemCode, item.price, item.dietaryType, item.allergenDeclaration]
    if (requiredValues.some((value) => String(value ?? '').trim() === '')) return 'Not assessed'
    return Object.keys(validateCanteenMenuItem(item)).length ? 'Blocked' : 'Ready'
}

export const createEmptyCanteenOrder = () => ({
    rfidCardNo: '',
    customer: null,
    lines: [],
    orderType: 'Counter',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    orderStatus: 'Preparing',
    expectedReadyTime: '',
    specialInstructions: '',
})

export const calculateOrderPricing = (lines = [], menuItems = []) => {
    const validLines = lines.filter((line) => positiveInteger(line.quantity))
    const itemCount = validLines.reduce((sum, line) => sum + Number(line.quantity), 0)
    const subtotal = validLines.reduce((sum, line) => {
        const item = menuItems.find((entry) => entry.id === line.menuId)
        return sum + (item?.price ?? 0) * Number(line.quantity)
    }, 0)

    return {
        lineCount: validLines.length,
        itemCount,
        subtotal,
        total: subtotal,
    }
}

export const validateCanteenOrder = (order) => {
    const errors = {}

    if (!order.rfidCardNo?.trim() || !order.customer) {
        errors.rfidCardNo = 'Enter a recognised customer RFID card number.'
    }
    if (!order.lines?.length) {
        errors.lines = 'Select at least one available menu item.'
    } else if (order.lines.some((line) => !positiveInteger(line.quantity))) {
        errors.lines = 'Every selected item needs a quantity of at least one.'
    }
    if (!order.expectedReadyTime) errors.expectedReadyTime = 'Select the expected ready time.'

    return errors
}

export const getOrderReadiness = (order) => {
    if (!order.rfidCardNo?.trim() || !order.lines?.length || !order.expectedReadyTime) return 'Not assessed'
    return Object.keys(validateCanteenOrder(order)).length ? 'Blocked' : 'Ready'
}
