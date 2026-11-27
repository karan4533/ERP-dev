import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJson,
    saveCampusJson,
    setCampusMemory,
    usesCampusApiForKey,
    getCampusLoadState,
} from '../../../services/campusJsonStore'

const DEFAULT_REQUESTS = [
    {
        requestId: 'REQ-HK-2026-005',
        requestType: 'Stock Replenishment',
        title: 'Monthly cleaning supplies restock',
        amount: '₹18,600',
        vendor: 'CleanPro India',
        vendorContact: '+91 98765 11223',
        submittedDate: '10-06-2026',
        currentStage: 'JD Operations',
        status: 'Pending',
        priority: 'High',
        description: 'Restock floor cleaner, disinfectant spray, and garbage bags before exam week deep cleaning.',
        budgetCategory: 'Cleaning Supplies',
        estimatedAmount: '₹18,600',
        requestedBy: 'Rajesh Nair',
        department: 'Housekeeping',
        sentTo: 'JD Operations',
        lineItems: [
            { item: 'Floor Cleaner — Lemon (5L)', quantity: 20, estimatedCost: '₹6,400' },
            { item: 'Disinfectant Spray (500ml)', quantity: 50, estimatedCost: '₹4,750' },
            { item: 'Garbage Bags — Large (Roll of 50)', quantity: 30, estimatedCost: '₹5,400' },
        ],
        attachments: ['cleanpro-quotation-june.pdf'],
    },
    {
        requestId: 'REQ-HK-2026-004',
        requestType: 'Purchase',
        title: 'Replacement mop heads and handles',
        amount: '₹12,400',
        vendor: 'CleanPro India',
        vendorContact: '+91 98765 11223',
        submittedDate: '08-06-2026',
        currentStage: 'Finance Team',
        status: 'Pending',
        priority: 'Medium',
        description: 'Replace worn mop heads and broken handles across all campus zones.',
        budgetCategory: 'Tools & Equipment',
        estimatedAmount: '₹12,400',
        requestedBy: 'Rajesh Nair',
        department: 'Housekeeping',
        sentTo: 'Finance Team',
        lineItems: [
            { item: 'Mop Head — Cotton (Standard)', quantity: 40, estimatedCost: '₹5,800' },
            { item: 'Mop Handle — Metal', quantity: 20, estimatedCost: '₹6,600' },
        ],
        attachments: ['mop-replacement-quote.pdf'],
    },
    {
        requestId: 'REQ-HK-2026-003',
        requestType: 'Purchase',
        title: 'Safety gear — rubber gloves bulk order',
        amount: '₹8,800',
        vendor: 'SafeHands Traders',
        vendorContact: '+91 97654 32109',
        submittedDate: '05-06-2026',
        currentStage: 'Finance Team',
        status: 'Approved',
        priority: 'Medium',
        description: 'Bulk purchase of rubber cleaning gloves for all housekeeping staff.',
        budgetCategory: 'Safety Gear',
        estimatedAmount: '₹8,800',
        requestedBy: 'Rajesh Nair',
        department: 'Housekeeping',
        sentTo: 'Finance Team',
        lineItems: [
            { item: 'Rubber Gloves — Pair (Large)', quantity: 40, estimatedCost: '₹8,800' },
        ],
        attachments: ['safehands-invoice.pdf'],
    },
    {
        requestId: 'REQ-HK-2026-002',
        requestType: 'Stock Replenishment',
        title: 'Toilet bowl cleaner — all blocks',
        amount: '₹4,400',
        vendor: 'HygieneFirst',
        vendorContact: '+91 99887 55443',
        submittedDate: '03-06-2026',
        currentStage: 'JD Operations',
        status: 'Rejected',
        priority: 'Low',
        description: 'Restock toilet bowl cleaner for all restroom blocks — deferred to next quarter.',
        budgetCategory: 'Cleaning Supplies',
        estimatedAmount: '₹4,400',
        requestedBy: 'Rajesh Nair',
        department: 'Housekeeping',
        sentTo: 'JD Operations',
        lineItems: [
            { item: 'Toilet Bowl Cleaner (1L)', quantity: 40, estimatedCost: '₹4,400' },
        ],
        attachments: ['hygienefirst-quote.pdf'],
    },
]

export const REQUEST_TYPE_OPTIONS = ['Purchase', 'Stock Replenishment']

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

export const BUDGET_CATEGORIES = [
    'Cleaning Supplies',
    'Tools & Equipment',
    'Safety Gear',
    'Disposables',
    'Pest Control',
    'Other',
]

export const AUTO_FILLED = {
    requestedBy: 'Rajesh Nair',
    department: 'Housekeeping',
    sentTo: 'JD Operations',
    status: 'Pending',
}

export const WORKFLOW_STAGES = [
    'Housekeeping Manager',
    'JD Operations',
    'Finance Team',
    'Approved / Rejected',
]

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const stageBadgeColor = {
    'JD Operations': 'bg-[#515DEF33] text-[#515DEF]',
    'Finance Team': 'bg-[#2196F333] text-[#2196F3]',
}

export const priorityBadgeColor = {
    Low: 'bg-[#66708533] text-[#667085]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Urgent: 'bg-[#FF000033] text-[#FF0000]',
}

export const EMPTY_REQUEST_FORM = {
    requestType: '',
    title: '',
    description: '',
    priority: '',
    estimatedAmount: '',
    budgetCategory: '',
    vendor: '',
    vendorContact: '',
    quotationName: '',
    supportingNames: [],
    lineItems: [
        { item: '', quantity: '', estimatedCost: '' },
        { item: '', quantity: '', estimatedCost: '' },
    ],
}

export const validateRequestForm = (form) => {
    if (!REQUEST_TYPE_OPTIONS.includes(form.requestType)) return 'Select a request type.'
    if (!form.title.trim()) return 'Enter a request title.'
    if (!form.description.trim()) return 'Enter a description.'
    if (!PRIORITY_OPTIONS.includes(form.priority)) return 'Select a priority.'
    return ''
}

const todayDmy = () => {
    const now = new Date()
    return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`
}

const nextRequestId = (rows) => {
    const prefix = `REQ-HK-${new Date().getFullYear()}-`
    const max = rows.reduce((acc, row) => {
        const id = String(row.requestId || row.id || '')
        const serial = id.startsWith(prefix) ? Number(id.slice(prefix.length)) : 0
        return Number.isFinite(serial) ? Math.max(acc, serial) : acc
    }, 0)
    return `${prefix}${String(max + 1).padStart(3, '0')}`
}

/** Load the latest list first so a new request never overwrites requests saved elsewhere. */
export async function addRequest(form, { requestedBy } = {}) {
    if (usesCampusApiForKey(REQUESTS_STORAGE_KEY)) {
        const loaded = await hydrateRequestsFromApi()
        if (!loaded) return { success: false, message: 'Could not load the current requests. Please try again.' }
    }
    const rows = getRequests()
    const amount = form.estimatedAmount.trim()
    const lineItems = (form.lineItems || [])
        .map((row) => ({
            item: String(row.item || '').trim(),
            quantity: String(row.quantity || '').trim(),
            estimatedCost: String(row.estimatedCost || '').trim(),
        }))
        .filter((row) => row.item || row.quantity || row.estimatedCost)
    const requestId = nextRequestId(rows)
    const record = {
        id: requestId,
        requestId,
        requestType: form.requestType,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        vendor: form.vendor.trim(),
        vendorContact: form.vendorContact.trim(),
        amount,
        estimatedAmount: amount,
        budgetCategory: form.budgetCategory,
        submittedDate: todayDmy(),
        approvalStatus: AUTO_FILLED.status,
        currentStage: AUTO_FILLED.sentTo,
        requestedBy: requestedBy || AUTO_FILLED.requestedBy,
        department: AUTO_FILLED.department,
        sentTo: AUTO_FILLED.sentTo,
        status: AUTO_FILLED.status,
        lineItems,
        attachments: [form.quotationName, ...(form.supportingNames || [])].filter(Boolean),
    }
    const saved = await persistCampusJson(REQUESTS_STORAGE_KEY, [record, ...rows])
    if (!saved.success) {
        if (saved.api) setCampusMemory(REQUESTS_STORAGE_KEY, rows, { push: false })
        return { success: false, message: saved.message || 'The request could not be saved.' }
    }
    return { success: true, record }
}

export const getRequestById = (id) =>
    getRequests().find((entry) => entry.requestId === id || entry.id === id)

export const REQUESTS_STORAGE_KEY = 'schoolerp-hk-requests-v1'
export function getRequests() {
    return ensureCampusSeed('schoolerp-hk-requests-v1', DEFAULT_REQUESTS)
}
export function saveRequests(rows) {
    return saveCampusJson('schoolerp-hk-requests-v1', rows)
}
export function hydrateRequestsFromApi() {
    if (!usesCampusApiForKey('schoolerp-hk-requests-v1')) return Promise.resolve(false)
    return hydrateCampusKey('schoolerp-hk-requests-v1', DEFAULT_REQUESTS)
}
export function getRequestsLoadState() {
    return getCampusLoadState(REQUESTS_STORAGE_KEY)
}
export const REQUESTS = DEFAULT_REQUESTS
