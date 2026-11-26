export const REPORT_TYPES = [
    'Work Order Resolution Report',
    'Preventive Maintenance Compliance',
    'DG GenSet & Power Logging',
    'Critical Spares Reorder Report',
]

export const WORK_ORDER_REPORT = [
    { orderId: 'WO-2026-0819', serviceType: 'Electrical (EB)', location: 'Academic Block A', technician: 'K. Murugan', status: 'In Progress', reportedDate: '2026-10-21', cost: '₹1,850' },
    { orderId: 'WO-2026-0814', serviceType: 'Civil & Plumbing', location: 'Cafeteria & Dining Hall', technician: 'S. Ramanathan', status: 'Completed', reportedDate: '2026-10-18', cost: '₹650' },
    { orderId: 'WO-2026-0802', serviceType: 'DG GenSet & Backup', location: 'Power Substation', technician: 'Cummins AMC Engineer', status: 'Completed', reportedDate: '2026-10-12', cost: '₹14,200' },
    { orderId: 'WO-2026-0798', serviceType: 'Air Conditioning AMC', location: 'Server Room', technician: 'Blue Star Partner', status: 'Completed', reportedDate: '2026-10-09', cost: '₹3,400' },
    { orderId: 'WO-2026-0791', serviceType: 'Carpentry & Fixtures', location: 'Library 1st Floor', technician: 'M. Selvam', status: 'Completed', reportedDate: '2026-10-04', cost: '₹920' },
]

export const PREVENTIVE_MAINTENANCE_REPORT = [
    { asset: 'Cummins 250kVA DG Set', frequency: 'Daily', lastCheck: '2026-10-22', nextDue: '2026-10-23', compliance: 'Compliant', technician: 'K. Murugan' },
    { asset: 'Voltamp 500kVA HT Transformer', frequency: 'Quarterly', lastCheck: '2026-10-15', nextDue: '2027-01-15', compliance: 'Compliant', technician: 'Gopalakrishnan R' },
    { asset: 'Johnson 8-Passenger Lifts (x3)', frequency: 'Weekly', lastCheck: '2026-10-19', nextDue: '2026-10-26', compliance: 'Compliant', technician: 'Johnson Lifts AMC' },
    { asset: 'Basement Stormwater Pumps', frequency: 'Daily', lastCheck: '2026-10-22', nextDue: '2026-10-23', compliance: 'Compliant', technician: 'S. Ramanathan' },
    { asset: 'Central Server PAC Units', frequency: 'Weekly', lastCheck: '2026-10-20', nextDue: '2026-10-27', compliance: 'Compliant', technician: 'P. Veluchamy' },
]

export const DG_LOGGING_REPORT = [
    { date: '2026-10-20', runningHours: '2.5 hrs', fuelAdded: '35 L', fuelBalance: '340 L', gridOutageReason: 'TANGEDCO Substation Maintenance', operator: 'K. Murugan' },
    { date: '2026-10-14', runningHours: '1.2 hrs', fuelAdded: '15 L', fuelBalance: '305 L', gridOutageReason: 'Local Transformer Line Tripping', operator: 'K. Murugan' },
    { date: '2026-10-08', runningHours: '3.0 hrs', fuelAdded: '50 L', fuelBalance: '320 L', gridOutageReason: 'Feeder Cable Fault Outside Campus', operator: 'K. Murugan' },
    { date: '2026-09-29', runningHours: '1.8 hrs', fuelAdded: '0 L', fuelBalance: '270 L', gridOutageReason: 'Scheduled Grid Line Clearing', operator: 'K. Murugan' },
]

export const CRITICAL_SPARES_REPORT = [
    { item: 'MCB 32A Triple Pole (Schneider)', category: 'Electrical', currentQty: 3, reorderLevel: 10, deficit: 7, urgency: 'High' },
    { item: '40W LED Panel Light 2x2', category: 'Lighting', currentQty: 5, reorderLevel: 15, deficit: 10, urgency: 'High' },
    { item: 'Float Valve 1" Brass (Zoloto)', category: 'Plumbing', currentQty: 2, reorderLevel: 8, deficit: 6, urgency: 'Medium' },
    { item: 'Engine Oil 15W40 (20L Can)', category: 'DG Spares', currentQty: 1, reorderLevel: 4, deficit: 3, urgency: 'High' },
]

