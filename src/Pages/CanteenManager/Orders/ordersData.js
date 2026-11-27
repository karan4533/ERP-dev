import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJson,
    usesCampusApiForKey,
} from '../../../services/campusJsonStore'
const DEFAULT_ORDERS = [
    {
        orderId: 'ORD-1042',
        customerName: 'Rahul Sharma',
        customerType: 'Student',
        customerId: 'STU-2024-1042',
        classOrDepartment: 'Class 10-A',
        itemsCount: 2,
        totalAmount: '₹85',
        paymentMethod: 'Wallet',
        paymentStatus: 'Paid',
        orderStatus: 'Preparing',
        orderDateTime: '10-06-2026 · 12:35 PM',
        items: ['Veg Biryani', 'Fresh Fruit Juice'],
    },
    {
        orderId: 'ORD-1041',
        customerName: 'Priya Nair',
        customerType: 'Student',
        customerId: 'STU-2024-0987',
        classOrDepartment: 'Class 9-B',
        itemsCount: 2,
        totalAmount: '₹120',
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        orderStatus: 'Completed',
        orderDateTime: '10-06-2026 · 11:20 AM',
        items: ['Chicken Sandwich', 'Milk'],
    },
    {
        orderId: 'ORD-1040',
        customerName: 'Anita Verma',
        customerType: 'Staff',
        customerId: 'TEA-1001',
        classOrDepartment: 'Mathematics',
        itemsCount: 1,
        totalAmount: '₹60',
        paymentMethod: 'Wallet',
        paymentStatus: 'Paid',
        orderStatus: 'Ready',
        orderDateTime: '10-06-2026 · 10:45 AM',
        items: ['Masala Dosa'],
    },
    {
        orderId: 'ORD-1039',
        customerName: 'Meena Devi',
        customerType: 'Student',
        customerId: 'STU-2024-0756',
        classOrDepartment: 'Class 7-C',
        itemsCount: 2,
        totalAmount: '₹55',
        paymentMethod: 'Wallet',
        paymentStatus: 'Failed',
        orderStatus: 'Cancelled',
        orderDateTime: '09-06-2026 · 02:10 PM',
        items: ['Fruit Salad', 'Water Bottle'],
    },
    {
        orderId: 'ORD-1038',
        customerName: 'John Milton',
        customerType: 'Staff',
        customerId: 'COO-1002',
        classOrDepartment: 'Academic Coordination',
        itemsCount: 3,
        totalAmount: '₹145',
        paymentMethod: 'Cash',
        paymentStatus: 'Pending',
        orderStatus: 'Preparing',
        orderDateTime: '09-06-2026 · 01:05 PM',
        items: ['Student Meal Combo', 'Cold Coffee', 'Sandwich'],
    },
]

export const paymentStatusBadgeColor = {
    Paid: 'bg-[#4CAF5033] text-[#4CAF50]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Failed: 'bg-[#FF000033] text-[#FF0000]',
}

export const orderStatusBadgeColor = {
    Preparing: 'bg-[#2196F333] text-[#2196F3]',
    Ready: 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Cancelled: 'bg-[#FF000033] text-[#FF0000]',
}

export const ORDERS_STORAGE_KEY = 'schoolerp-canteen-orders-v1'
export function getOrders() {
    return ensureCampusSeed('schoolerp-canteen-orders-v1', DEFAULT_ORDERS)
}
/**
 * Persist orders to ops API when enabled. Resolves true only after a confirmed write
 * (or offline localStorage write). Never treat a failed API replace as success.
 */
export async function saveOrders(rows) {
    const result = await persistCampusJson(ORDERS_STORAGE_KEY, rows)
    if (!result?.success) {
        const err = new Error(result?.message || 'Canteen order could not be saved to the server.')
        err.api = Boolean(result?.api)
        throw err
    }
    return true
}
export function hydrateOrdersFromApi() {
    if (!usesCampusApiForKey('schoolerp-canteen-orders-v1')) return Promise.resolve(false)
    return hydrateCampusKey('schoolerp-canteen-orders-v1', DEFAULT_ORDERS)
}
export const ORDERS = DEFAULT_ORDERS

