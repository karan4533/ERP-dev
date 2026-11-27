import {
    MD_APPROVAL_STATUS,
    approveActivityViaApi,
    getActivities,
    hydrateActivitiesFromApi,
} from '../../../Common/Activities/activitiesData'
import { getActivityViewPath } from '../../../Common/Activities/activityConfigs'
import { getAccessToken, isApiAuthEnabled, isDemoLoginEnabled } from '../../../services/apiClient'
import { canUseActivitiesApi } from '../../../services/activitiesApi'

const STORAGE_KEY = 'schoolerp-super-admin-approvals'

export const ROUTE_BASE = '/super-admin/approvals'

export const REQUESTED_TO = 'Super Admin'

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected']

export const REQUEST_CATEGORIES = [
    'Activity Approval',
    'Finance Request',
    'Data Change Request',
    'HR Request',
    'Procurement Request',
    'Budget Request',
    'Policy Change Request',
]

const ACTIVITY_TYPE_LABEL = {
    cultural: 'Cultural',
    sports: 'Sports',
    competition: 'Competition',
}

export const PRIORITY_LEVELS = ['High', 'Normal', 'Low']

/**
 * ASA-04 (audit §13): Finance/HR/procurement/etc. rows in this module are demo seeds only.
 * Live Super Admin decisions are Activity Approvals via POST /activities/{id}/approval.
 * Demo seeds are shown only when API auth is off or explicit demo logins are enabled.
 */
export const DEMO_APPROVAL_SEEDS_NOTICE =
    'Demo sample — not a live workflow. Decisions here are not saved on the server. Live Super Admin approvals are Activity Approvals only.'

export const includeDemoApprovalSeeds = () => {
    // Never paint demo SA-APR rows when a real API session exists.
    if (isApiAuthEnabled() && getAccessToken()) return false
    return !isApiAuthEnabled() || isDemoLoginEnabled()
}

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const categoryBadgeColor = {
    'Activity Approval': 'bg-[#0C1E5B33] text-[#0C1E5B]',
    'Finance Request': 'bg-[#515DEF33] text-[#515DEF]',
    'Data Change Request': 'bg-[#2196F333] text-[#2196F3]',
    'HR Request': 'bg-[#9C27B033] text-[#9C27B0]',
    'Procurement Request': 'bg-[#FF980033] text-[#FF9800]',
    'Budget Request': 'bg-[#4CAF5033] text-[#4CAF50]',
    'Policy Change Request': 'bg-[#607D8B33] text-[#607D8B]',
}

export const priorityBadgeColor = {
    High: 'bg-[#FF000033] text-[#FF0000]',
    Normal: 'bg-[#2196F333] text-[#2196F3]',
    Low: 'bg-[#66708533] text-[#667085]',
}

const SEED_REQUESTS = [
    {
        id: 'SA-APR-001',
        requestId: 'SA-APR-001',
        category: 'Finance Request',
        requestDate: '08-08-2026',
        requestedBy: 'Account Head',
        role: 'Account Head',
        department: 'Finance',
        title: 'Q3 Transport fuel budget top-up',
        amount: '₹3,50,000',
        priority: 'High',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Additional fuel budget required for exam-week extended route operations and contingency fleet coverage.',
        financeDetails: {
            expenseType: 'Operational Budget',
            fiscalPeriod: 'Q3 2026',
            paymentMode: 'Bank Transfer',
            supportingDoc: 'fuel_forecast_q3.xlsx',
        },
        superAdminRemarks: '',
        source: 'demo',
        isDemo: true,
    },
    {
        id: 'SA-APR-002',
        requestId: 'SA-APR-002',
        category: 'Data Change Request',
        requestDate: '08-08-2026',
        requestedBy: 'School Admin',
        role: 'Administrator',
        department: 'Administration',
        title: 'Bulk update — Class 10 A fee structure',
        amount: null,
        priority: 'High',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Request to revise tuition and transport fee components for Class 10 A effective from August 2026.',
        dataChangeDetails: {
            module: 'Fees Management',
            recordId: 'FEE-CL-10A',
            recordName: 'Class 10 A Fee Structure',
            fieldChanged: 'Tuition Fee + Transport Fee',
            oldValue: '₹47,500 + ₹4,200',
            newValue: '₹49,000 + ₹4,500',
            changeReason: 'Board-mandated fee revision and route cost adjustment.',
        },
        superAdminRemarks: '',
        source: 'demo',
        isDemo: true,
    },
    {
        id: 'SA-APR-003',
        requestId: 'SA-APR-003',
        category: 'Finance Request',
        requestDate: '07-08-2026',
        requestedBy: 'HR Manager',
        role: 'HR',
        department: 'Human Resources',
        title: 'Staff bonus disbursement — Mid-year',
        amount: '₹8,75,000',
        priority: 'Normal',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Mid-year performance bonus pool for non-teaching staff as approved in HR committee meeting.',
        financeDetails: {
            expenseType: 'Payroll Disbursement',
            fiscalPeriod: 'H1 2026',
            paymentMode: 'Payroll',
            supportingDoc: 'hr_bonus_schedule.pdf',
        },
        superAdminRemarks: '',
        source: 'demo',
        isDemo: true,
    },
    {
        id: 'SA-APR-004',
        requestId: 'SA-APR-004',
        category: 'Data Change Request',
        requestDate: '07-08-2026',
        requestedBy: 'Principal',
        role: 'Principal',
        department: 'Academics',
        title: 'Student record correction — admission number merge',
        amount: null,
        priority: 'Normal',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Correct duplicate admission entries for student transferred from sister branch.',
        dataChangeDetails: {
            module: 'Student Database',
            recordId: 'STD-NO1902',
            recordName: 'Meera Lakshmi',
            fieldChanged: 'Admission Number',
            oldValue: 'STD-NO1902 / STD-NO1902B',
            newValue: 'STD-NO1902 (merged)',
            changeReason: 'Duplicate record created during branch transfer import.',
        },
        superAdminRemarks: '',
        source: 'demo',
        isDemo: true,
    },
    {
        id: 'SA-APR-005',
        requestId: 'SA-APR-005',
        category: 'Procurement Request',
        requestDate: '06-08-2026',
        requestedBy: 'IT Support Manager',
        role: 'IT Support Manager',
        department: 'IT Support',
        title: 'Block C lab network switch replacement',
        amount: '₹95,000',
        priority: 'High',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Emergency procurement for managed switches after repeated lab connectivity failures during assessments.',
        procurementDetails: {
            vendor: 'Chennai Network Solutions',
            items: '4 × Managed network switches, cabling kit',
            deliveryDate: '15-08-2026',
            quoteRef: 'QT-IT-2026-044',
        },
        superAdminRemarks: '',
        source: 'demo',
        isDemo: true,
    },
    {
        id: 'SA-APR-006',
        requestId: 'SA-APR-006',
        category: 'Budget Request',
        requestDate: '06-08-2026',
        requestedBy: 'Director',
        role: 'Director',
        department: 'Director Office',
        title: 'Science lab equipment budget — Q3',
        amount: '₹4,20,000',
        priority: 'Normal',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Capital budget for microscopes, lab glassware, and safety equipment across Block A and Block B labs.',
        budgetDetails: {
            budgetHead: 'Capital Expenditure — Labs',
            fiscalYear: '2026–27',
            previousAllocation: '₹3,50,000',
            requestedIncrease: '₹70,000',
        },
        superAdminRemarks: '',
        source: 'demo',
        isDemo: true,
    },
    {
        id: 'SA-APR-007',
        requestId: 'SA-APR-007',
        category: 'Policy Change Request',
        requestDate: '05-08-2026',
        requestedBy: 'School Admin',
        role: 'Administrator',
        department: 'Administration',
        title: 'Revised leave approval hierarchy',
        amount: null,
        priority: 'Normal',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Update system policy so department heads route leave above 5 days to Super Admin instead of Principal.',
        policyDetails: {
            policyArea: 'Leave Management',
            currentRule: 'Leave > 5 days → Principal approval',
            proposedRule: 'Leave > 5 days → Super Admin approval',
            effectiveFrom: '01-09-2026',
        },
        superAdminRemarks: '',
        source: 'demo',
        isDemo: true,
    },
    {
        id: 'SA-APR-008',
        requestId: 'SA-APR-008',
        category: 'HR Request',
        requestDate: '05-08-2026',
        requestedBy: 'HR Manager',
        role: 'HR',
        department: 'Human Resources',
        title: 'New designation — Deputy Transport Manager',
        amount: null,
        priority: 'Low',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Create new employee designation and approval workflow for Deputy Transport Manager role.',
        hrDetails: {
            requestType: 'Designation Creation',
            affectedDepartment: 'Transport',
            headcount: '1',
            justification: 'Fleet expansion requires secondary approver for route and maintenance requests.',
        },
        superAdminRemarks: '',
        source: 'demo',
        isDemo: true,
    },
]

const loadRequests = () => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((row) => ({ ...row, source: row.source || 'demo', isDemo: true }))
            }
        }
    } catch {
        /* ignore */
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REQUESTS))
    return SEED_REQUESTS.map((row) => ({ ...row }))
}

const saveRequests = (requests) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

/** Map a pending (or decided) activity into the Super Admin Approvals row shape. */
export const activityToApprovalRequest = (activity) => {
    const typeLabel = ACTIVITY_TYPE_LABEL[activity.type] || 'Activity'
    return {
        id: activity.id,
        requestId: activity.id,
        category: 'Activity Approval',
        requestDate: activity.submittedDate || activity.eventDate || '—',
        requestedBy: activity.submittedBy || 'Admin',
        role: 'Administrator',
        department: typeLabel,
        title: activity.eventName || `${typeLabel} activity`,
        amount: null,
        priority: 'High',
        status: activity.mdApprovalStatus || MD_APPROVAL_STATUS.PENDING,
        requestedTo: REQUESTED_TO,
        description: activity.description || '',
        source: 'activity',
        isDemo: false,
        activityType: activity.type,
        viewPath: getActivityViewPath(activity.type, 'superadmin', activity.id),
        superAdminRemarks: '',
    }
}

export const getPendingActivityApprovals = () =>
    getActivities()
        .filter((item) => item.mdApprovalStatus === MD_APPROVAL_STATUS.PENDING)
        .map(activityToApprovalRequest)

/** All live activity rows as approval records (pending + decided) for Super Admin oversight. */
export const getLiveActivityApprovals = () =>
    getActivities().map(activityToApprovalRequest)

/** Live activity approvals; demo seeds only when includeDemoApprovalSeeds(). */
export const getAllApprovalRequests = () => {
    const live = getLiveActivityApprovals()
    if (!includeDemoApprovalSeeds()) return live
    const seeded = loadRequests()
    const liveIds = new Set(live.map((row) => row.id))
    return [...live, ...seeded.filter((row) => !liveIds.has(row.id))]
}

/** Pull activities from API when signed in, then rebuild the merged list. */
export const hydrateApprovalsFromApi = async () => {
    if (canUseActivitiesApi()) {
        await Promise.all([
            hydrateActivitiesFromApi('cultural'),
            hydrateActivitiesFromApi('sports'),
            hydrateActivitiesFromApi('competition'),
        ])
    }
    return getAllApprovalRequests()
}

export const getApprovalRequestById = (id) => {
    const activity = getActivities().find((item) => item.id === id)
    if (activity) return activityToApprovalRequest(activity)
    if (!includeDemoApprovalSeeds()) return null
    return loadRequests().find((request) => request.id === id) ?? null
}

export const getPendingApprovalCount = () =>
    getAllApprovalRequests().filter((request) => request.status === 'Pending').length

/** Local-only mutation for demo seeds — never use for live Activity Approvals. */
export const updateApprovalRequestStatus = (id, status, superAdminRemarks = '') => {
    const requests = loadRequests()
    const index = requests.findIndex((request) => request.id === id)
    if (index === -1) return null

    requests[index] = {
        ...requests[index],
        status,
        superAdminRemarks: superAdminRemarks || requests[index].superAdminRemarks,
        source: 'demo',
        isDemo: true,
    }
    saveRequests(requests)
    return requests[index]
}

/**
 * Decide an approval. Activity rows → POST /activities/{id}/approval (success only after API).
 * Demo seeds → refused under API auth; local-only when demo seeds are explicitly allowed.
 */
export const decideApprovalRequestViaApi = async (request, status, superAdminRemarks = '') => {
    const isActivity =
        request?.source === 'activity'
        || request?.category === 'Activity Approval'
        || Boolean(request?.activityType)

    if (isActivity) {
        if (!canUseActivitiesApi()) {
            return {
                success: false,
                message: 'Activities API is not available. Cannot decide this approval on the server.',
            }
        }
        if (status !== MD_APPROVAL_STATUS.APPROVED && status !== MD_APPROVAL_STATUS.REJECTED) {
            return { success: false, message: 'Status must be Approved or Rejected.' }
        }
        try {
            const mapped = await approveActivityViaApi(request.id, status)
            const next = activityToApprovalRequest(mapped)
            if (superAdminRemarks) next.superAdminRemarks = superAdminRemarks
            return { success: true, request: next, persistedOnServer: true }
        } catch (error) {
            return {
                success: false,
                message: error?.message || 'Could not save the activity decision on the server.',
            }
        }
    }

    if (isApiAuthEnabled() && !isDemoLoginEnabled()) {
        return {
            success: false,
            message: DEMO_APPROVAL_SEEDS_NOTICE,
        }
    }

    const updated = updateApprovalRequestStatus(request.id, status, superAdminRemarks)
    if (!updated) return { success: false, message: 'Demo approval request not found.' }
    return { success: true, request: updated, persistedOnServer: false }
}

export const filterApprovalRequests = (
    records,
    { search = '', category = '', status = '' } = {},
) => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
        if (category && record.category !== category) return false
        if (status && record.status !== status) return false
        if (!query) return true

        return [
            record.requestId,
            record.category,
            record.title,
            record.requestedBy,
            record.department,
            record.status,
        ]
            .join(' ')
            .toLowerCase()
            .includes(query)
    })
}

export const getApprovalSummary = (records = getAllApprovalRequests()) => ({
    total: records.length,
    pending: records.filter((r) => r.status === 'Pending').length,
    approved: records.filter((r) => r.status === 'Approved').length,
    rejected: records.filter((r) => r.status === 'Rejected').length,
    highPriority: records.filter((r) => r.priority === 'High' && r.status === 'Pending').length,
})

export const formatAmount = (amount) => amount ?? '—'

export const liveApprovalCategories = () =>
    includeDemoApprovalSeeds() ? REQUEST_CATEGORIES : ['Activity Approval']
