export const SUMMARY_CARDS = [
    { label: 'Active Work Orders', value: '8', sub: 'Electrical, plumbing, civil' },
    { label: 'Preventive Schedules Due', value: '4', sub: 'Substation, DG, pumps' },
    { label: 'DG GenSet Fuel Level', value: '85%', sub: '340 L available' },
    { label: 'Open Helpdesk Tickets', value: '5', sub: 'Campus maintenance' },
    { label: 'Technicians On Duty', value: '6', sub: 'Morning shift' },
    { label: 'Pending Approvals', value: '3', sub: 'AMC & spares purchase' },
    { label: 'Equipment Inspected', value: '18', sub: 'Of 22 critical assets' },
]

export const RECENT_WORK_ORDERS = [
    { orderId: 'WO-2026-0819', serviceType: 'Electrical (EB)', block: 'Block A — 2nd Floor', technician: 'K. Murugan', status: 'In Progress' },
    { orderId: 'WO-2026-0814', serviceType: 'Civil & Plumbing', block: 'Dining Hall', technician: 'S. Ramanathan', status: 'Completed' },
    { orderId: 'WO-2026-0802', serviceType: 'DG GenSet & Backup', block: 'Substation Yard', technician: 'Cummins AMC Engineer', status: 'Completed' },
    { orderId: 'WO-2026-0798', serviceType: 'Air Conditioning AMC', block: 'Server Room', technician: 'Blue Star AMC', status: 'Completed' },
]

export const LOW_STOCK_SPARES = [
    { item: 'MCB 32A Triple Pole (Schneider)', availableQty: '3', reorderLevel: '10' },
    { item: '40W LED Panel Light 2x2', availableQty: '5', reorderLevel: '15' },
    { item: 'Float Valve 1" Brass', availableQty: '2', reorderLevel: '8' },
    { item: 'Engine Oil 15W40 (20L Can)', availableQty: '1', reorderLevel: '4' },
]

export const PENDING_REQUESTS = [
    { requestId: 'REQ-MNT-2026-003', type: 'DG Major Service AMC', status: 'Pending' },
    { requestId: 'REQ-MNT-2026-002', type: 'Submersible Pump Spares', status: 'Pending' },
    { requestId: 'REQ-MNT-2026-001', type: 'HT Transformer BDV Oil Test', status: 'Approved' },
]

export const RECENT_ANNOUNCEMENTS = [
    { title: 'Scheduled TANGEDCO Substation Maintenance & DG Power Backup', date: '21-10-2026' },
    { title: 'Quarterly Fire Hydrant Booster Pump Testing Completed', date: '15-10-2026' },
    { title: 'Pre-Monsoon Roof Drainage & Stormwater Line Clearing', date: '10-10-2026' },
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

