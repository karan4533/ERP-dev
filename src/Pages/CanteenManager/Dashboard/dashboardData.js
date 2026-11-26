export const SUMMARY_CARDS = [
    { label: 'Orders Today', value: '156', sub: '+12% from yesterday', trend: 'up' },
    { label: "Today's Sales", value: '₹18,450', sub: '126 completed orders', trend: 'up' },
    { label: 'Inventory Items', value: '245', sub: 'Across 8 categories', trend: 'neutral' },
    { label: 'Low Stock Alerts', value: '12', sub: 'Needs restock', trend: 'down' },
    { label: 'Pending Approvals', value: '5', sub: 'Awaiting review', trend: 'neutral' },
    { label: 'Active Announcements', value: '3 Active', sub: '2 scheduled', trend: 'neutral' },
]

export const SALES_CHART_7_DAYS = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    revenue: [14200, 15800, 13600, 17200, 18450, 12100, 9800],
    orders: [118, 132, 109, 145, 156, 98, 82],
}

export const SALES_CHART_30_DAYS = {
    labels: ['1 Jun', '5 Jun', '10 Jun', '15 Jun', '20 Jun', '25 Jun', '30 Jun'],
    revenue: [12000, 14500, 18450, 16200, 17800, 19100, 16800],
    orders: [95, 112, 156, 138, 148, 162, 140],
}

export const RECENT_ORDERS = [
    { orderId: 'ORD-1042', customer: 'Arjun Sharma', type: 'Student', amount: '₹120', status: 'Completed' },
    { orderId: 'ORD-1041', customer: 'Priya Nair', type: 'Staff', amount: '₹80', status: 'Preparing' },
    { orderId: 'ORD-1040', customer: 'Rahul Verma', type: 'Student', amount: '₹95', status: 'Completed' },
    { orderId: 'ORD-1039', customer: 'Anita Devi', type: 'Student', amount: '₹55', status: 'Ready' },
    { orderId: 'ORD-1038', customer: 'John Milton', type: 'Staff', amount: '₹145', status: 'Completed' },
    { orderId: 'ORD-1037', customer: 'Meena Kapoor', type: 'Student', amount: '₹70', status: 'Preparing' },
    { orderId: 'ORD-1036', customer: 'Sports Day', type: 'Event', amount: '₹2,400', status: 'Completed' },
]

export const TOP_SELLING_ITEMS = [
    { item: 'Veg Puff', quantity: 120 },
    { item: 'Coffee', quantity: 95 },
    { item: 'Sandwich', quantity: 78 },
    { item: 'Veg Biryani', quantity: 65 },
    { item: 'Fresh Juice', quantity: 52 },
]

export const LOW_STOCK_ALERTS = [
    { item: 'Rice', currentStock: '10 Kg', reorderLevel: '20 Kg' },
    { item: 'Milk', currentStock: '5 L', reorderLevel: '15 L' },
    { item: 'Cooking Oil', currentStock: '8 L', reorderLevel: '12 L' },
    { item: 'Bread Slices', currentStock: '2 Kg', reorderLevel: '5 Kg' },
    { item: 'Chicken (Fresh)', currentStock: '3 Kg', reorderLevel: '10 Kg' },
]

export const PENDING_REQUESTS = [
    { requestId: 'REQ-2026-001', type: 'Stock Purchase', amount: '₹15,000', status: 'Pending' },
    { requestId: 'REQ-2026-004', type: 'Equipment', amount: '₹25,000', status: 'Pending' },
    { requestId: 'REQ-2026-005', type: 'Vendor Bill', amount: '₹62,000', status: 'Pending' },
    { requestId: 'REQ-2026-006', type: 'Stock Purchase', amount: '₹8,500', status: 'Pending' },
]

export const INVENTORY_SUMMARY = [
    { label: 'Total Inventory Value', value: '₹1,25,000', color: 'text-[#515DEF]' },
    { label: 'Expiring Soon', value: '8 Items', color: 'text-[#FF9800]' },
    { label: 'Out of Stock', value: '3 Items', color: 'text-[#FF0000]' },
]

export const ORDER_DISTRIBUTION = [
    { name: 'Students', value: 75, color: '#515DEF' },
    { name: 'Staff', value: 20, color: '#4CAF50' },
    { name: 'Events', value: 5, color: '#FF9800' },
]

export const RECENT_ANNOUNCEMENTS = [
    { title: 'New Healthy Meal Combo Available', audience: 'Students', date: 'Today' },
    { title: 'Canteen Closed for Maintenance', audience: 'All', date: 'Yesterday' },
    { title: 'Grade 10-A — Special Lunch Menu', audience: 'Students', date: '2 days ago' },
]

export const QUICK_ACTIONS = [
    { label: 'New Order', to: '/canteen-manager/orders/add-order' },
    { label: 'Add Inventory', to: '/canteen-manager/inventory' },
    { label: 'Create Request', to: '/canteen-manager/requests-approvals/add-request' },
    { label: 'Send Announcement', to: '/canteen-manager/broadcast/add-broadcast' },
    { label: 'View Reports', to: '/canteen-manager/reports' },
]

export const orderStatusBadgeColor = {
    Preparing: 'bg-[#2196F333] text-[#2196F3]',
    Ready: 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Cancelled: 'bg-[#FF000033] text-[#FF0000]',
}

export const requestStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}
