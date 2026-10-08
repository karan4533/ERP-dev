export const REPORT_TYPES = [
    'Ticket Resolution Report',
    'Asset Utilization Report',
    'Damaged Assets Report',
    'Renewed Licenses Report',
]

export const TICKET_RESOLUTION_REPORT = [
    { ticketId: 'TKT-2026-1042', issueType: 'Hardware', priority: 'High', assignedTo: 'Ravi Kumar', resolutionTime: '4h 20m', status: 'Closed' },
    { ticketId: 'TKT-2026-1041', issueType: 'Software', priority: 'Medium', assignedTo: 'Anita Desai', resolutionTime: '1d 2h', status: 'Closed' },
    { ticketId: 'TKT-2026-1038', issueType: 'Network', priority: 'Critical', assignedTo: 'Ravi Kumar', resolutionTime: '6h 45m', status: 'In Progress' },
    { ticketId: 'TKT-2026-1035', issueType: 'Hardware', priority: 'Low', assignedTo: 'Suresh Menon', resolutionTime: '2h 10m', status: 'Closed' },
    { ticketId: 'TKT-2026-1032', issueType: 'Software', priority: 'Medium', assignedTo: 'Anita Desai', resolutionTime: '—', status: 'Open' },
]

export const ASSET_UTILIZATION_REPORT = [
    { assetId: 'AST-2026-0142', assetName: 'Staff Laptop — Mathematics Dept', assignedTo: 'Priya Nair', usageStatus: 'In Use', department: 'Mathematics' },
    { assetId: 'AST-2026-0138', assetName: 'Admin Block Printer', assignedTo: 'Shared', usageStatus: 'In Use', department: 'Administration' },
    { assetId: 'AST-2026-0098', assetName: 'Core Switch — Server Room', assignedTo: 'IT Team', usageStatus: 'In Use', department: 'IT Support' },
    { assetId: 'AST-2026-0071', assetName: 'Library Desktop PC', assignedTo: 'Unassigned', usageStatus: 'Idle', department: 'Library' },
    { assetId: 'AST-2026-0044', assetName: 'Microsoft Office 365 License', assignedTo: 'All Staff', usageStatus: 'Active', department: 'All Departments' },
]

export const DAMAGED_ASSETS_REPORT = [
    { assetId: 'AST-2026-0071', assetName: 'Library Desktop PC', damageType: 'Screen cracked', reportedDate: '08-06-2026', status: 'Under Repair' },
    { assetId: 'AST-2026-0125', assetName: 'Science Lab Projector', damageType: 'Lamp failure', reportedDate: '05-06-2026', status: 'Under Repair' },
    { assetId: 'AST-2025-0298', assetName: 'Staff Laptop — Science', damageType: 'Keyboard malfunction', reportedDate: '01-06-2026', status: 'Reported' },
    { assetId: 'AST-2025-0241', assetName: 'Lab Desktop PC #8', damageType: 'Power supply failure', reportedDate: '28-05-2026', status: 'Retired' },
]

export const RENEWED_LICENSES_REPORT = [
    { licenseName: 'Microsoft Office 365 E3', vendor: 'Microsoft Volume Licensing', renewalDate: '01-04-2026', expiryDate: '31-03-2027', cost: '₹2,40,000' },
    { licenseName: 'Endpoint Antivirus — Campus', vendor: 'SecureNet Solutions', renewalDate: '15-03-2026', expiryDate: '14-03-2027', cost: '₹1,85,000' },
    { licenseName: 'Adobe Creative Cloud — Design Lab', vendor: 'Adobe India', renewalDate: '10-02-2026', expiryDate: '09-02-2027', cost: '₹96,000' },
    { licenseName: 'Windows Server CAL', vendor: 'Microsoft Volume Licensing', renewalDate: '01-01-2026', expiryDate: '31-12-2026', cost: '₹1,12,000' },
]

export const priorityBadgeColor = {
    Low: 'bg-[#2196F333] text-[#2196F3]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    High: 'bg-[#FF572233] text-[#FF5722]',
    Critical: 'bg-[#FF000033] text-[#FF0000]',
}

export const ticketStatusBadgeColor = {
    Open: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#2196F333] text-[#2196F3]',
    Closed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const usageStatusBadgeColor = {
    'In Use': 'bg-[#4CAF5033] text-[#4CAF50]',
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Idle: 'bg-[#FF980033] text-[#FF9800]',
}

export const damageStatusBadgeColor = {
    Reported: 'bg-[#FF980033] text-[#FF9800]',
    'Under Repair': 'bg-[#2196F333] text-[#2196F3]',
    Retired: 'bg-[#9E9E9E33] text-[#616161]',
}
