export const SUMMARY_CARDS = [
    { label: 'Total Inventory Items', value: '186', sub: 'Across 12 categories' },
    { label: 'Low Stock Items', value: '14', sub: 'Below reorder level' },
    { label: 'Out of Stock Items', value: '3', sub: 'Needs immediate restock' },
    { label: 'Pending Requests', value: '6', sub: 'Awaiting approval' },
    { label: 'Items Issued This Month', value: '428', sub: 'June 2026' },
    { label: 'Items Returned This Month', value: '52', sub: 'June 2026' },
    { label: 'Total Inventory Value', value: '₹2,45,800', sub: 'Current stock value' },
]

export const RECENT_ISSUES = [
    { issueId: 'ISS-2026-042', requestedBy: 'Priya Nair', department: 'Mathematics', date: '10-06-2026' },
    { issueId: 'ISS-2026-041', requestedBy: 'John Milton', department: 'Administration', date: '10-06-2026' },
    { issueId: 'ISS-2026-040', requestedBy: 'Anita Verma', department: 'Science', date: '09-06-2026' },
    { issueId: 'ISS-2026-039', requestedBy: 'Rahul Sharma', department: 'Class 10-A', date: '09-06-2026' },
]

export const LOW_STOCK_ITEMS = [
    { item: 'A4 Paper Ream', availableQty: '8', reorderLevel: '20' },
    { item: 'Blue Ballpoint Pens', availableQty: '45', reorderLevel: '100' },
    { item: 'Stapler Pins (Box)', availableQty: '5', reorderLevel: '15' },
    { item: 'Whiteboard Markers', availableQty: '12', reorderLevel: '30' },
]

export const PENDING_REQUESTS = [
    { requestId: 'REQ-SS-2026-008', type: 'Stock Purchase', status: 'Pending' },
    { requestId: 'REQ-SS-2026-007', type: 'Bulk Order', status: 'Pending' },
    { requestId: 'REQ-SS-2026-006', type: 'Vendor Bill', status: 'Pending' },
]

export const RECENT_NOTICES = [
    { title: 'New stationery issue timings for exam week', date: '10-06-2026' },
    { title: 'Bulk order delivery scheduled — 12 June', date: '08-06-2026' },
    { title: 'Return policy reminder for unused items', date: '05-06-2026' },
]

export const requestStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}
