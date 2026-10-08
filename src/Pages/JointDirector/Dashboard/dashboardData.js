export const KPI_CARDS = [
    { label: 'Total Employees', value: '248', sub: 'Across all departments' },
    { label: 'Active Departments', value: '12', sub: 'Operational units' },
    { label: 'Pending Approvals', value: '14', sub: 'Awaiting review' },
    { label: 'Open Escalations', value: '5', sub: 'Requires attention' },
    { label: 'Pending Tasks', value: '32', sub: 'Assigned & in progress' },
    { label: 'Active Announcements', value: '8', sub: 'Live announcements' },
    { label: 'Critical Inventory Alerts', value: '11', sub: 'Low or out of stock' },
    { label: 'Critical IT Issues', value: '3', sub: 'High priority tickets' },
    { label: 'Vehicle Maintenance Due', value: '4', sub: 'Within 7 days' },
]

export const DEPARTMENT_SUMMARIES = [
    {
        department: 'Canteen',
        metrics: [
            { label: 'Orders Today', value: '186' },
            { label: 'Low Stock Items', value: '6' },
            { label: 'Pending Requests', value: '2' },
        ],
    },
    {
        department: 'Stationery Store',
        metrics: [
            { label: 'Inventory Value', value: '₹2,45,800' },
            { label: 'Low Stock Items', value: '14' },
            { label: 'Pending Requests', value: '4' },
        ],
    },
    {
        department: 'Housekeeping',
        metrics: [
            { label: 'Pending Tasks', value: '6' },
            { label: 'Completed Tasks', value: '12' },
        ],
    },
    {
        department: 'IT Support',
        metrics: [
            { label: 'Open Tickets', value: '18' },
            { label: 'Critical Tickets', value: '3' },
        ],
    },
    {
        department: 'Transport',
        metrics: [
            { label: 'Active Vehicles', value: '22' },
            { label: 'Maintenance Due', value: '4' },
        ],
    },
]

export const PENDING_APPROVALS = [
    { requestId: 'REQ-HK-2026-005', department: 'Housekeeping', type: 'Supply Purchase', amount: '₹18,600' },
    { requestId: 'REQ-SS-2026-008', department: 'Stationery Store', type: 'Stock Replenishment', amount: '₹15,400' },
    { requestId: 'REQ-CM-2026-012', department: 'Canteen', type: 'Vendor Payment', amount: '₹42,500' },
    { requestId: 'REQ-IT-2026-003', department: 'IT Support', type: 'Equipment Purchase', amount: '₹1,25,000' },
    { requestId: 'REQ-TR-2026-002', department: 'Transport', type: 'Maintenance', amount: '₹38,200' },
]

export const CRITICAL_ALERTS = [
    { department: 'Stationery Store', alert: 'A4 Paper Ream — out of stock (reorder level 20)' },
    { department: 'Housekeeping', alert: 'Mop Head — Cotton — out of stock' },
    { department: 'Canteen', alert: 'Cooking Oil — below reorder level (4 units left)' },
    { department: 'IT Support', alert: 'Network switch failure — Block C (critical)' },
    { department: 'Transport', alert: 'Bus TN-09-AB-4521 — brake inspection overdue' },
]

export const RECENT_ESCALATIONS = [
    { escalationId: 'ESC-2026-018', department: 'IT Support', priority: 'Critical' },
    { escalationId: 'ESC-2026-017', department: 'Housekeeping', priority: 'High' },
    { escalationId: 'ESC-2026-016', department: 'Transport', priority: 'High' },
    { escalationId: 'ESC-2026-015', department: 'Canteen', priority: 'Medium' },
    { escalationId: 'ESC-2026-014', department: 'Stationery Store', priority: 'Medium' },
]

export const priorityBadgeColor = {
    Critical: 'bg-[#FF000033] text-[#FF0000]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    Low: 'bg-[#66708533] text-[#667085]',
}

export const OPERATIONS_TREND = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    approvals: [8, 12, 10, 14, 11, 6, 4],
    escalations: [2, 3, 1, 4, 2, 1, 0],
    tasks: [28, 32, 30, 35, 32, 18, 12],
}

export const APPROVALS_BY_DEPARTMENT = [
    { department: 'IT Support', amount: 125000 },
    { department: 'Transport', amount: 38200 },
    { department: 'Canteen', amount: 42500 },
    { department: 'Housekeeping', amount: 18600 },
    { department: 'Stationery Store', amount: 15400 },
]

export const ESCALATIONS_BY_PRIORITY = [
    { name: 'Critical', value: 1 },
    { name: 'High', value: 2 },
    { name: 'Medium', value: 2 },
    { name: 'Low', value: 0 },
]

export const ALERTS_BY_DEPARTMENT = [
    { department: 'Stationery Store', count: 3 },
    { department: 'Housekeeping', count: 2 },
    { department: 'Canteen', count: 2 },
    { department: 'IT Support', count: 2 },
    { department: 'Transport', count: 2 },
]

export const DEPARTMENT_WORKLOAD = [
    { department: 'Canteen', pendingTasks: 4, openTickets: 0, lowStock: 6 },
    { department: 'Stationery Store', pendingTasks: 2, openTickets: 0, lowStock: 14 },
    { department: 'Housekeeping', pendingTasks: 6, openTickets: 0, lowStock: 9 },
    { department: 'IT Support', pendingTasks: 8, openTickets: 18, lowStock: 0 },
    { department: 'Transport', pendingTasks: 3, openTickets: 0, lowStock: 0 },
]

export const CHART_COLORS = {
    primary: '#515DEF',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#FF5722',
    info: '#2196F3',
    palette: ['#515DEF', '#4CAF50', '#FF9800', '#FF5722', '#2196F3', '#9C27B0'],
}
