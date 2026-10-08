export const TRANSPORT_TABS = [
    { id: 'fleet-service', label: 'Fleet & Service' },
    { id: 'maintenance-damage', label: 'Maintenance & Damage' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'fuel-expense-claims', label: 'Fuel & Expense Claims' },
    { id: 'staff-salaries', label: 'Staff Salaries' },
]

export const TRANSPORT_ACADEMIC_YEARS = ['2025–26', '2024–25', '2023–24']

export const FLEET_SUMMARY = [
    { label: 'Total Vehicles', value: '18', sub: '14 buses · 4 vans', iconTone: 'info' },
    { label: 'Active on Routes', value: '16', sub: '88.9% fleet uptime', subTone: 'success', iconTone: 'success' },
    { label: 'Under Service', value: '2', sub: 'avg. 3 days down', subTone: 'danger', iconTone: 'danger' },
    { label: 'Service Due (30 days)', value: '5', sub: 'scheduled', iconTone: 'warning' },
]

export const FLEET_VEHICLES = [
    {
        id: 'V-001',
        regNo: 'TN58-AB-1023',
        type: 'Bus',
        route: 'Route 4 — Anna Nagar',
        driver: 'Murugan K.',
        driverInitials: 'MK',
        lastService: '02 May',
        nextServiceDue: '02 Aug',
        odometer: '1,84,200 km',
        status: 'Active',
    },
    {
        id: 'V-002',
        regNo: 'TN58-AB-1018',
        type: 'Bus',
        route: 'Route 2 — Velachery',
        driver: 'Selvam R.',
        driverInitials: 'SR',
        lastService: '28 Apr',
        nextServiceDue: '28 Jul',
        odometer: '2,01,500 km',
        status: 'Active',
    },
    {
        id: 'V-003',
        regNo: 'TN58-AC-0976',
        type: 'Bus',
        route: 'Route 7 — Tambaram',
        driver: 'Vasanth P.',
        driverInitials: 'VP',
        lastService: '10 Jun',
        nextServiceDue: '14 Jun',
        odometer: '1,62,900 km',
        status: 'In Service',
    },
    {
        id: 'V-004',
        regNo: 'TN58-AD-0512',
        type: 'Van',
        route: 'Route 11 — Adyar',
        driver: 'Raghu G.',
        driverInitials: 'RG',
        lastService: '22 May',
        nextServiceDue: '22 Aug',
        odometer: '98,400 km',
        status: 'Active',
    },
    {
        id: 'V-005',
        regNo: 'TN58-AB-0887',
        type: 'Bus',
        route: 'Unassigned',
        driver: '—',
        driverInitials: null,
        lastService: '15 Apr',
        nextServiceDue: '15 Jul',
        odometer: '2,34,100 km',
        status: 'Idle',
    },
]

export const MAINTENANCE_SUMMARY = [
    { label: 'Maintenance Spend (YTD)', value: '₹6.4L', sub: '↑ 8% vs last year', subTone: 'danger', iconTone: 'danger' },
    { label: 'Damage Cases Open', value: '3', sub: 'est. ₹42,000', iconTone: 'warning' },
    { label: 'Avg. Service Cost', value: '₹8,200', sub: 'per vehicle/service', iconTone: 'info' },
    { label: 'Scheduled This Month', value: '5', sub: 'services planned', iconTone: 'success' },
]

export const MAINTENANCE_SPEND = [
    { vehicle: 'TN58-AB-0887', amount: '₹98,400', value: 90, warn: true },
    { vehicle: 'TN58-AB-1018', amount: '₹71,200', value: 65 },
    { vehicle: 'TN58-AC-0976', amount: '₹64,800', value: 59 },
    { vehicle: 'TN58-AB-1023', amount: '₹48,500', value: 44 },
    { vehicle: 'TN58-AD-0512', amount: '₹29,000', value: 27 },
]

export const DAMAGE_BREAKDOWN = [
    { label: 'Accident / collision', amount: '₹22,000', cases: 2 },
    { label: 'Tyre / brake wear', amount: '₹14,500', cases: 4 },
    { label: 'Interior / seating', amount: '₹6,000', cases: 1 },
]

export const MAINTENANCE_RECORDS = [
    {
        id: 'MR-001',
        vehicle: 'TN58-AC-0976',
        date: '10 Jun',
        description: 'Brake pad replacement + alignment',
        type: 'Routine',
        vendor: 'Sri Balaji Motors',
        cost: '₹6,200',
        status: 'In Progress',
    },
    {
        id: 'MR-002',
        vehicle: 'TN58-AB-0887',
        date: '02 Jun',
        description: 'Rear bumper collision damage',
        type: 'Damage',
        vendor: 'Anand Auto Works',
        cost: '₹22,000',
        status: 'Pending Approval',
    },
    {
        id: 'MR-003',
        vehicle: 'TN58-AB-1018',
        date: '28 May',
        description: 'Engine oil change, filter service',
        type: 'Routine',
        vendor: 'Authorized Service Ctr',
        cost: '₹3,800',
        status: 'Completed',
    },
    {
        id: 'MR-004',
        vehicle: 'TN58-AD-0512',
        date: '22 May',
        description: 'Seat upholstery repair',
        type: 'Interior',
        vendor: 'Sri Balaji Motors',
        cost: '₹6,000',
        status: 'Completed',
    },
    {
        id: 'MR-005',
        vehicle: 'TN58-AB-1023',
        date: '02 May',
        description: 'Tyre replacement (2 nos.)',
        type: 'Routine',
        vendor: 'Authorized Service Ctr',
        cost: '₹9,600',
        status: 'Completed',
    },
]

export const COMPLIANCE_SUMMARY = [
    { label: 'Documents Tracked', value: '72', sub: 'across 18 vehicles', iconTone: 'info' },
    { label: 'Expiring in 30 Days', value: '6', sub: 'action needed', subTone: 'danger', iconTone: 'danger' },
    { label: 'Expired', value: '1', sub: 'non-compliant', subTone: 'danger', iconTone: 'danger' },
    { label: 'Compliance Score', value: '94%', sub: 'fleet-wide', subTone: 'success', iconTone: 'success' },
]

export const COMPLIANCE_DOCS = [
    {
        id: 'CD-001',
        entity: 'TN58-AB-0887',
        docType: 'Fitness Certificate',
        issuedOn: '14 Jul 2025',
        validTill: '13 Jul 2026',
        daysLeft: '16 days',
        status: 'Expiring Soon',
    },
    {
        id: 'CD-002',
        entity: 'TN58-AB-1018',
        docType: 'Insurance',
        issuedOn: '01 May 2025',
        validTill: '30 Apr 2026',
        daysLeft: 'Expired',
        status: 'Expired',
    },
    {
        id: 'CD-003',
        entity: 'Selvam R. (Driver)',
        docType: 'Driving License',
        issuedOn: '—',
        validTill: '22 Jul 2026',
        daysLeft: '25 days',
        status: 'Expiring Soon',
    },
    {
        id: 'CD-004',
        entity: 'TN58-AC-0976',
        docType: 'Pollution Certificate',
        issuedOn: '10 Jan 2026',
        validTill: '10 Jul 2026',
        daysLeft: '13 days',
        status: 'Expiring Soon',
    },
    {
        id: 'CD-005',
        entity: 'TN58-AB-1023',
        docType: 'Route Permit',
        issuedOn: '01 Apr 2025',
        validTill: '31 Mar 2027',
        daysLeft: '9 months',
        status: 'Valid',
    },
]

export const FUEL_SUMMARY = [
    { label: 'Fuel Spend (This Month)', value: '₹3.8L', sub: '↑ 4% vs last month', subTone: 'danger', iconTone: 'danger' },
    { label: 'Pending Claims', value: '9', sub: '₹86,400 awaiting approval', iconTone: 'warning' },
    { label: 'Approved This Month', value: '31', sub: '₹2.9L disbursed', subTone: 'success', iconTone: 'success' },
    { label: 'Avg. Mileage', value: '7.2 km/l', sub: 'fleet average', iconTone: 'info' },
]

export const EXPENSE_CLAIMS = [
    {
        id: 'EC-001',
        claimant: 'Murugan K.',
        initials: 'MK',
        vehicle: 'TN58-AB-1023',
        type: 'Fuel',
        date: '26 Jun',
        amount: '₹4,200',
        status: 'Pending',
    },
    {
        id: 'EC-002',
        claimant: 'Transport Mgr.',
        initials: 'TM',
        vehicle: 'Fleet-wide',
        type: 'Service',
        date: '24 Jun',
        amount: '₹12,800',
        status: 'Pending',
    },
    {
        id: 'EC-003',
        claimant: 'Selvam R.',
        initials: 'SR',
        vehicle: 'TN58-AB-1018',
        type: 'Fuel',
        date: '22 Jun',
        amount: '₹3,900',
        status: 'Approved',
    },
    {
        id: 'EC-004',
        claimant: 'Vasanth P.',
        initials: 'VP',
        vehicle: 'TN58-AC-0976',
        type: 'Toll',
        date: '20 Jun',
        amount: '₹650',
        status: 'Rejected',
    },
]

export const SALARY_SUMMARY = [
    { label: 'Total Transport Payroll', value: '₹4.2L', sub: '21 staff · monthly', iconTone: 'info' },
    { label: 'Disbursed (This Month)', value: '₹4.2L', sub: '100% on time', subTone: 'success', iconTone: 'success' },
    { label: 'Drivers', value: '18', sub: '₹3.6L total', iconTone: 'info' },
    { label: 'Transport Managers', value: '3', sub: '₹60,000 total', iconTone: 'warning' },
]

export const PAYROLL_STAFF = [
    {
        id: 'PS-001',
        name: 'Murugan K.',
        initials: 'MK',
        role: 'Driver',
        baseSalary: '₹18,000',
        allowance: '₹2,000',
        deductions: '₹600',
        netPay: '₹19,400',
        status: 'Paid',
    },
    {
        id: 'PS-002',
        name: 'Selvam R.',
        initials: 'SR',
        role: 'Driver',
        baseSalary: '₹18,000',
        allowance: '₹2,000',
        deductions: '₹600',
        netPay: '₹19,400',
        status: 'Paid',
    },
    {
        id: 'PS-003',
        name: 'Vasanth P.',
        initials: 'VP',
        role: 'Driver',
        baseSalary: '₹17,500',
        allowance: '₹2,000',
        deductions: '₹550',
        netPay: '₹18,950',
        status: 'Pending',
    },
    {
        id: 'PS-004',
        name: 'R. Balakrishnan',
        initials: 'RB',
        role: 'Transport Manager',
        baseSalary: '₹26,000',
        allowance: '₹3,500',
        deductions: '₹900',
        netPay: '₹28,600',
        status: 'Paid',
    },
]

export const fleetStatusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In Service': 'bg-[#FF980033] text-[#FF9800]',
    Idle: 'bg-[#66708533] text-[#667085]',
}

export const maintenanceTypeBadgeColor = {
    Routine: 'bg-[#515DEF33] text-[#515DEF]',
    Damage: 'bg-[#FF572233] text-[#FF5722]',
    Interior: 'bg-[#66708533] text-[#667085]',
    Repair: 'bg-[#2196F333] text-[#2196F3]',
}

export const maintenanceStatusBadgeColor = {
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    'Pending Approval': 'bg-[#FF572233] text-[#FF5722]',
}

export const complianceStatusBadgeColor = {
    Valid: 'bg-[#4CAF5033] text-[#4CAF50]',
    'Expiring Soon': 'bg-[#FF980033] text-[#FF9800]',
    Expired: 'bg-[#FF572233] text-[#FF5722]',
}

export const claimTypeBadgeColor = {
    Fuel: 'bg-[#515DEF33] text-[#515DEF]',
    Service: 'bg-[#66708533] text-[#667085]',
    Toll: 'bg-[#FF980033] text-[#FF9800]',
    'Toll / Parking': 'bg-[#FF980033] text-[#FF9800]',
    Misc: 'bg-[#2196F333] text-[#2196F3]',
}

export const claimStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF572233] text-[#FF5722]',
}

export const payrollStatusBadgeColor = {
    Paid: 'bg-[#4CAF5033] text-[#4CAF50]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
}
