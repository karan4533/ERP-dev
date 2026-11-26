export const createEmptyOperationsCustodyRecord = () => ({
    activityType: 'Issue',
    employeeName: '',
    employeeId: '',
    department: '',
    itemName: '',
    quantity: '',
    remarks: '',
    issueDate: '',
    purpose: '',
    originalIssueRef: '',
    returnDate: '',
    condition: '',
})

const positiveNumber = (value) => {
    const number = Number(value)
    return Number.isFinite(number) && number > 0 ? number : null
}

export const getIssueStockPreview = ({ availableStock, quantity }) => {
    const stock = Math.max(0, Number(availableStock) || 0)
    const requested = Math.max(0, Number(quantity) || 0)
    return {
        availableStock: stock,
        requestedQuantity: requested,
        remainingStock: Math.max(0, stock - requested),
    }
}

export const getIssueReadiness = ({ availableStock, quantity }) => {
    if (availableStock === null || availableStock === undefined) return 'Not assessed'
    const requested = positiveNumber(quantity)
    if (requested === null) return 'Not assessed'
    return requested > Number(availableStock) ? 'Blocked' : 'Ready'
}

export const validateOperationsCustodyRecord = (record, { availableStock = null } = {}) => {
    const errors = {}
    if (!String(record?.employeeName ?? '').trim()) errors.employeeName = 'Enter the employee name.'
    if (!String(record?.employeeId ?? '').trim()) errors.employeeId = 'Enter the employee ID.'
    if (!String(record?.department ?? '').trim()) errors.department = 'Select the department.'
    if (!String(record?.itemName ?? '').trim()) errors.itemName = 'Select an item.'

    const quantity = positiveNumber(record?.quantity)
    if (quantity === null) errors.quantity = 'Enter a quantity greater than zero.'

    if (record?.activityType === 'Return') {
        if (!String(record.originalIssueRef ?? '').trim()) errors.originalIssueRef = 'Enter the original issue reference.'
        if (!String(record.returnDate ?? '').trim()) errors.returnDate = 'Select the return date.'
        if (!String(record.condition ?? '').trim()) errors.condition = 'Select the returned item condition.'
    } else {
        if (!String(record?.issueDate ?? '').trim()) errors.issueDate = 'Select the issue date.'
        const stock = Number(availableStock)
        if (quantity !== null && Number.isFinite(stock) && quantity > stock) {
            errors.quantity = `Quantity exceeds the available stock of ${stock}.`
        }
    }

    return errors
}
