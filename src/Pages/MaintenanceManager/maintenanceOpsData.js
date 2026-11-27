/**
 * Maintenance-only ops seeds and storage keys.
 * Never reuse Housekeeping (schoolerp-housekeeping-* / hk-*) keys.
 */

export const MAINT_DUTY_KEY = 'schoolerp-maintenance-duty-v1'
export const MAINT_SCHEDULE_KEY = 'schoolerp-maintenance-schedules-v1'
export const MAINT_CHECKLIST_KEY = 'schoolerp-maintenance-checklists-v1'

export const MAINT_DUTY_SEED = [
    {
        id: 'MDUTY-2026-0001',
        staff: 'Pradeep',
        area: 'Block B Electrical Panel',
        shift: 'Morning',
        dutyType: 'Corrective Repair',
        assignedBy: 'Maintenance Manager',
        date: '2026-09-23',
        startTime: '09:00',
        endTime: '12:00',
        priority: 'High',
        instructions: 'Replace faulty MCB and test corridor lighting circuit.',
        remarks: '',
        status: 'Assigned',
    },
]

export const MAINT_INVENTORY_KEY = 'schoolerp-maintenance-inventory-v1'
export const MAINT_REQUIREMENT_KEY = 'schoolerp-maintenance-inventory-requirements-v1'
export const MAINT_PROCUREMENT_KEY = 'schoolerp-maintenance-procurement-v1'
export const MAINT_REQUEST_KEY = 'schoolerp-maintenance-requests-v1'

export const MAINT_INVENTORY_SEED = [
    {
        id: 'MINV-2026-0001',
        item: 'MCB 32A',
        category: 'Electrical spares',
        unit: 'pcs',
        quantity: 12,
        minStock: 5,
        location: 'Maint store locker',
        returnable: 'Yes',
        status: 'Available',
        remarks: 'Department-held spare; master stock remains with Store Officer',
    },
]

export const MAINT_REQUIREMENT_SEED = [
    {
        id: 'MIR-2026-0001',
        item: 'Pipe wrench set',
        quantity: 2,
        requiredDate: '2026-09-30',
        requestedBy: 'Maintenance Manager',
        department: 'Maintenance',
        status: 'Pending',
        remarks: 'Plumbing preventive week',
    },
]

export const MAINT_PROCUREMENT_SEED = [
    {
        id: 'MPC-2026-0001',
        title: 'Emergency lighting battery pack',
        amount: 8500,
        minorPurchase: true,
        status: 'QUOTATION_PENDING',
        requestedBy: 'Maintenance Manager',
        department: 'Maintenance',
        primaryApprover: 'Joint Director Operations',
    },
]

export const MAINT_REQUEST_SEED = [
    {
        id: 'MRQ-2026-0001',
        requestType: 'Store Issue',
        item: 'PVC pipe 1 inch',
        quantity: 10,
        status: 'Pending',
        requestedBy: 'Maintenance Manager',
        department: 'Maintenance',
        approver: 'Store Officer',
        remarks: 'Block A leak repair',
    },
]

export const MAINT_SCHEDULE_SEED = [
    {
        id: 'MSCH-2026-0001',
        name: 'Electrical panel inspection',
        frequency: 'MONTHLY',
        area: 'All blocks',
        staff: 'Pradeep',
        checklistFocus: 'Fire-safety / electrical panels',
        status: 'Active',
        dayOfMonth: 1,
    },
    {
        id: 'MSCH-2026-0002',
        name: 'Plumbing preventive check',
        frequency: 'WEEKLY',
        area: 'Academic Block A',
        staff: 'Kausik',
        checklistFocus: 'Leaks, taps, tanks',
        status: 'Active',
        weekday: 1,
    },
]

/**
 * Checklist completion register (PDF §4.7).
 * Ambiguity: PDF does not define a nested item schema — store items as text lines
 * and completion status on the register row (same pattern as other SimpleRegister screens).
 */
export const MAINT_CHECKLIST_SEED = [
    {
        id: 'MCL-2026-0001',
        title: 'Monthly electrical panel checklist',
        frequency: 'MONTHLY',
        area: 'Block B Panel Room',
        staff: 'Pradeep',
        dueDate: '2026-09-30',
        completedDate: '',
        checklistItems: 'Panel doors locked\nNo burnt smell\nBreakers labelled\nEmergency light tested',
        pendingItems: 'Emergency light tested',
        verifiedBy: '',
        status: 'Pending',
        remarks: '',
    },
]
