import { MENU_ITEMS } from '../MenuManagement/menuData'

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

export const MENU_OPTIONS = MENU_ITEMS.filter((item) => item.status === 'Active' && item.availability === 'Available').map((item) => ({
    id: item.menuId,
    name: item.itemName,
    price: Number.parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0,
}))

export const lookupCustomerByRfid = (rfidCardNo) =>
    RFID_CUSTOMERS.find((customer) => customer.rfidCardNo === rfidCardNo.trim()) ?? null

export const calculateTotalAmount = (selectedMenuIds, quantity) => {
    const qty = Math.max(Number(quantity) || 0, 0)
    if (!qty || selectedMenuIds.length === 0) return 0

    const itemTotal = selectedMenuIds.reduce((sum, menuId) => {
        const menuItem = MENU_OPTIONS.find((item) => item.id === menuId)
        return sum + (menuItem?.price ?? 0)
    }, 0)

    return itemTotal * qty
}

export const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`
