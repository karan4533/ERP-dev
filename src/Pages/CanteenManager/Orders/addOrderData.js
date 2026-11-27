export const RFID_CUSTOMERS = [
    {
        rfidCardNo: 'RFID-1001',
        name: 'Rahul Sharma',
        customerId: 'STU-2024-1042',
        customerType: 'Student',
        classOrDepartment: 'Class 10-A',
    },
    {
        rfidCardNo: 'RFID-2001',
        name: 'Anita Verma',
        customerId: 'TEA-1001',
        customerType: 'Staff',
        classOrDepartment: 'Mathematics',
    },
    {
        rfidCardNo: 'RFID-1002',
        name: 'Priya Nair',
        customerId: 'STU-2024-0987',
        customerType: 'Student',
        classOrDepartment: 'Class 9-B',
    },
]

export const menuOptionsFromItems = (items) =>
    (Array.isArray(items) ? items : [])
        .filter((item) => item.status === 'Active' && item.availability === 'Available')
        .map((item) => ({
            id: item.menuId || item.id,
            name: item.itemName || item.name || item.item || '',
            price: Number.parseInt(String(item.price ?? '').replace(/[^\d]/g, ''), 10) || 0,
        }))
        .filter((item) => item.id && item.name)

export const lookupCustomerByRfid = (rfidCardNo) =>
    RFID_CUSTOMERS.find((customer) => customer.rfidCardNo === String(rfidCardNo || '').trim()) ?? null

export const calculateTotalAmount = (selectedMenuIds, quantity, menuOptions = []) => {
    const qty = Math.max(Number(quantity) || 0, 0)
    if (!qty || !selectedMenuIds?.length) return 0

    const itemTotal = selectedMenuIds.reduce((sum, menuId) => {
        const menuItem = menuOptions.find((item) => item.id === menuId)
        return sum + (menuItem?.price ?? 0)
    }, 0)

    return itemTotal * qty
}

export const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

export const EMPTY_ORDER_DRAFT = {
    rfidCardNo: '',
    customer: null,
    selectedMenuIds: [],
    quantity: 1,
    specialInstructions: '',
    orderType: 'Counter',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    orderStatus: 'Preparing',
    expectedReadyTime: null,
    totalAmount: 0,
}

export const buildOrderRecord = (draft, menuOptions = []) => {
    const qty = Math.max(Number(draft.quantity) || 0, 0)
    const items = (draft.selectedMenuIds || [])
        .map((id) => menuOptions.find((item) => item.id === id)?.name)
        .filter(Boolean)
    const total = calculateTotalAmount(draft.selectedMenuIds, qty, menuOptions)
    const when = new Date()
    const orderId = `ORD-${when.getTime().toString().slice(-8)}`
    return {
        id: orderId,
        orderId,
        customerName: draft.customer?.name || '',
        customerType: draft.customer?.customerType || '',
        customerId: draft.customer?.customerId || '',
        classOrDepartment: draft.customer?.classOrDepartment || '',
        rfidCardNo: String(draft.rfidCardNo || '').trim(),
        itemsCount: items.length * Math.max(qty, 1),
        totalAmount: formatCurrency(total),
        paymentMethod: draft.paymentMethod || 'Cash',
        paymentStatus: draft.paymentStatus || 'Pending',
        orderStatus: draft.orderStatus || 'Preparing',
        orderType: draft.orderType || 'Counter',
        specialInstructions: draft.specialInstructions || '',
        orderDateTime: when.toLocaleString('en-IN'),
        items,
        quantity: qty,
    }
}
