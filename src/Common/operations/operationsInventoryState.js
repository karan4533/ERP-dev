export const createEmptyOperationsInventoryItem = () => ({
    name: '',
    category: '',
    code: '',
    description: '',
    quantity: '',
    unit: '',
    reorderLevel: '',
    unitCost: '',
    supplierName: '',
    supplierContact: '',
    purchaseDate: '',
    invoiceNumber: '',
    attachments: [],
})

const parseNumber = (value) => {
    const normalized = String(value ?? '').replace(/[^0-9.-]/g, '')
    if (!normalized) return null
    const number = Number(normalized)
    return Number.isFinite(number) ? number : null
}

export const deriveInventoryStatus = ({ quantity, reorderLevel }) => {
    const stock = parseNumber(quantity)
    const threshold = parseNumber(reorderLevel)
    if (stock === null) return 'Not assessed'
    if (stock !== null && stock <= 0) return 'Out of Stock'
    if (stock !== null && threshold !== null && stock <= threshold) return 'Low Stock'
    return 'Available'
}

export const getInventoryHealth = ({ availableQuantity, reorderLevel }) => {
    const quantity = parseNumber(availableQuantity) ?? 0
    const threshold = parseNumber(reorderLevel) ?? 0
    return {
        quantity,
        reorderLevel: threshold,
        shortage: Math.max(0, threshold - quantity),
        status: deriveInventoryStatus({ quantity, reorderLevel: threshold }),
    }
}

export const validateOperationsInventoryItem = (item, { requireCode = false } = {}) => {
    const errors = {}

    if (!String(item?.name ?? '').trim()) errors.name = 'Enter an item name.'
    if (!String(item?.category ?? '').trim()) errors.category = 'Select a category.'
    if (requireCode && !String(item?.code ?? '').trim()) errors.code = 'Enter an item code.'

    const rawQuantity = String(item?.quantity ?? '').trim()
    const quantity = parseNumber(item?.quantity)
    if (!rawQuantity) errors.quantity = 'Enter the current quantity.'
    else if (quantity === null) errors.quantity = 'Enter a valid quantity.'
    else if (quantity < 0) errors.quantity = 'Quantity cannot be negative.'

    if (!String(item?.unit ?? '').trim()) errors.unit = 'Select a stock unit.'

    if (String(item?.reorderLevel ?? '').trim()) {
        const reorderLevel = parseNumber(item.reorderLevel)
        if (reorderLevel === null) errors.reorderLevel = 'Enter a valid reorder level.'
        else if (reorderLevel < 0) errors.reorderLevel = 'Reorder level cannot be negative.'
    }

    if (String(item?.unitCost ?? '').trim()) {
        const unitCost = parseNumber(item.unitCost)
        if (unitCost === null || unitCost <= 0) errors.unitCost = 'Unit cost must be greater than zero.'
    }

    return errors
}
