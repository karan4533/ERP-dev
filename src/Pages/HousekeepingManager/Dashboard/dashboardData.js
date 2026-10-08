export const SUMMARY_CARDS = [
    { label: 'Active Tasks Today', value: '18', sub: 'Across all zones' },
    { label: 'Tasks Completed', value: '12', sub: 'Today so far' },
    { label: 'Pending Tasks', value: '6', sub: 'Due today' },
    { label: 'Low Stock Items', value: '9', sub: 'Cleaning supplies' },
    { label: 'Staff On Duty', value: '14', sub: 'Morning shift' },
    { label: 'Pending Requests', value: '4', sub: 'Awaiting approval' },
    { label: 'Zones Inspected', value: '22', sub: 'Of 28 total zones' },
]

export const RECENT_TASKS = [
    { taskId: 'HK-T-042', title: 'Classroom Block A — Deep Clean', assignedTo: 'Ramesh Kumar', status: 'In Progress' },
    { taskId: 'HK-T-041', title: 'Restroom Sanitization — Floor 2', assignedTo: 'Sunita Devi', status: 'Completed' },
    { taskId: 'HK-T-040', title: 'Corridor Mopping — Admin Block', assignedTo: 'Vijay Singh', status: 'In Progress' },
    { taskId: 'HK-T-039', title: 'Playground Litter Pickup', assignedTo: 'Anita Sharma', status: 'Pending' },
]

export const LOW_STOCK_ITEMS = [
    { item: 'Floor Cleaner (5L)', availableQty: '6', reorderLevel: '15' },
    { item: 'Garbage Bags (Large)', availableQty: '8', reorderLevel: '20' },
    { item: 'Disinfectant Spray', availableQty: '4', reorderLevel: '12' },
    { item: 'Mop Heads', availableQty: '3', reorderLevel: '10' },
]

export const PENDING_REQUESTS = [
    { requestId: 'REQ-HK-2026-005', type: 'Supply Purchase', status: 'Pending' },
    { requestId: 'REQ-HK-2026-004', type: 'Equipment', status: 'Pending' },
    { requestId: 'REQ-HK-2026-003', type: 'Vendor Bill', status: 'Pending' },
]

export const RECENT_ANNOUNCEMENTS = [
    { title: 'Deep cleaning schedule — exam week', date: '10-06-2026' },
    { title: 'New disinfectant protocol for restrooms', date: '08-06-2026' },
    { title: 'Staff shift change effective Monday', date: '05-06-2026' },
]

export const taskStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#2196F333] text-[#2196F3]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const requestStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}
