const REQUIRED_MESSAGES = {
    requestType: 'Select a request type.',
    title: 'Enter a request title.',
    description: 'Describe why this request is needed.',
    priority: 'Select a priority.',
}

export const emptyOperationsLineItem = () => ({ item: '', quantity: '', estimatedCost: '' })

export const createEmptyOperationsRequest = ({ lineItems = false } = {}) => ({
    requestType: '',
    title: '',
    description: '',
    priority: '',
    requiredByDate: '',
    estimatedAmount: '',
    budgetCategory: '',
    vendorName: '',
    vendorContact: '',
    attachments: [],
    lineItems: lineItems ? [emptyOperationsLineItem()] : [],
})

const parsePositiveNumber = (value) => {
    const normalized = String(value ?? '').replace(/[^0-9.-]/g, '')
    if (!normalized) return null
    const amount = Number(normalized)
    return Number.isFinite(amount) ? amount : null
}

export const validateOperationsRequest = (request, { requireLineItems = false } = {}) => {
    const errors = {}

    for (const [field, message] of Object.entries(REQUIRED_MESSAGES)) {
        if (!String(request?.[field] ?? '').trim()) errors[field] = message
    }

    if (String(request?.estimatedAmount ?? '').trim()) {
        const amount = parsePositiveNumber(request.estimatedAmount)
        if (amount === null || amount <= 0) errors.estimatedAmount = 'Enter an amount greater than zero.'
    }

    if (requireLineItems) {
        const lineItems = Array.isArray(request?.lineItems) ? request.lineItems : []
        if (!lineItems.length) errors.lineItems = 'Add at least one line item.'
        lineItems.forEach((lineItem, index) => {
            if (!String(lineItem?.item ?? '').trim()) errors[`lineItems.${index}.item`] = 'Enter an item name.'
            const quantity = parsePositiveNumber(lineItem?.quantity)
            if (quantity === null || quantity <= 0) errors[`lineItems.${index}.quantity`] = 'Enter a quantity greater than zero.'
            if (String(lineItem?.estimatedCost ?? '').trim()) {
                const cost = parsePositiveNumber(lineItem.estimatedCost)
                if (cost === null || cost <= 0) errors[`lineItems.${index}.estimatedCost`] = 'Enter a cost greater than zero.'
            }
        })
    }

    return errors
}

export const getOperationsRequestErrorCount = (errors) => Object.keys(errors || {}).length
