import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJson,
    saveCampusJson,
    setCampusMemory,
    usesCampusApiForKey,
} from '../../../services/campusJsonStore'
const DEFAULT_REQUESTS = [
    {
        requestId: 'REQ-IT-2026-001',
        requestType: 'Hardware',
        requestTypeFull: 'Hardware Purchase',
        title: 'Replacement laptops for IT lab',
        vendor: 'Dell Authorized Partner',
        vendorContact: '+91 98765 43210',
        amount: '₹3,42,000',
        estimatedCost: '₹3,42,000',
        submittedDate: '10-06-2026',
        approvalStatus: 'Pending',
        currentStage: 'Ops Assistant',
        description: 'Purchase 6 Dell Latitude laptops to replace aging units in Computer Lab 2. Current devices are 5+ years old and failing frequently.',
        budgetCategory: 'IT Hardware',
        requestedBy: 'Ravi Kumar',
        department: 'IT Support',
        sentTo: 'Ops Assistant',
        status: 'Pending',
        attachments: ['quotation-dell-laptops.pdf', 'lab-requirement-note.pdf'],
    },
    {
        requestId: 'REQ-IT-2026-002',
        requestType: 'Software',
        requestTypeFull: 'Software Purchase',
        title: 'Antivirus license renewal — campus-wide',
        vendor: 'SecureNet Solutions',
        vendorContact: '+91 91234 56789',
        amount: '₹1,85,000',
        estimatedCost: '₹1,85,000',
        submittedDate: '08-06-2026',
        approvalStatus: 'Approved',
        currentStage: 'Finance',
        description: 'Annual renewal of endpoint protection for 450 devices across admin, academic, and lab systems.',
        budgetCategory: 'Software Licenses',
        requestedBy: 'Ravi Kumar',
        department: 'IT Support',
        sentTo: 'Finance',
        status: 'Approved',
        attachments: ['securenet-proposal.pdf'],
    },
    {
        requestId: 'REQ-IT-2026-003',
        requestType: 'License',
        requestTypeFull: 'License Renewal',
        title: 'Microsoft Office 365 renewal',
        vendor: 'Microsoft Volume Licensing',
        vendorContact: 'licensing@microsoft.com',
        amount: '₹2,40,000',
        estimatedCost: '₹2,40,000',
        submittedDate: '05-06-2026',
        approvalStatus: 'Pending',
        currentStage: 'JD',
        description: 'Renew Office 365 E3 licenses for 120 staff accounts before expiry on 30 June 2026.',
        budgetCategory: 'Software Licenses',
        requestedBy: 'Ravi Kumar',
        department: 'IT Support',
        sentTo: 'JD',
        status: 'Pending',
        attachments: ['ms365-renewal-quote.pdf', 'user-count-sheet.xlsx'],
    },
    {
        requestId: 'REQ-IT-2026-004',
        requestType: 'Hardware',
        requestTypeFull: 'AMC Renewal',
        title: 'Server room UPS AMC renewal',
        vendor: 'PowerGuard Services',
        vendorContact: '+91 99887 76655',
        amount: '₹48,000',
        estimatedCost: '₹48,000',
        submittedDate: '03-06-2026',
        approvalStatus: 'Rejected',
        currentStage: 'JD',
        description: 'Annual maintenance contract for server room UPS units. Rejected pending revised vendor quote.',
        budgetCategory: 'Maintenance & AMC',
        requestedBy: 'Ravi Kumar',
        department: 'IT Support',
        sentTo: 'JD',
        status: 'Rejected',
        attachments: ['powerguard-amc.pdf'],
    },
    {
        requestId: 'REQ-IT-2026-005',
        requestType: 'Software',
        requestTypeFull: 'Vendor Service',
        title: 'Network cabling audit and repair',
        vendor: 'Cisco Partner Network',
        vendorContact: '+91 97654 32109',
        amount: '₹72,500',
        estimatedCost: '₹72,500',
        submittedDate: '01-06-2026',
        approvalStatus: 'Pending',
        currentStage: 'Ops Assistant',
        description: 'Vendor service for structured cabling audit in Admin Block and repair of faulty ports on Floor 2.',
        budgetCategory: 'Infrastructure',
        requestedBy: 'Ravi Kumar',
        department: 'IT Support',
        sentTo: 'Ops Assistant',
        status: 'Pending',
        attachments: ['cisco-service-proposal.pdf', 'site-survey.pdf'],
    },
]

export const REQUEST_TYPE_OPTIONS = [
    'Hardware Purchase',
    'Software Purchase',
    'License Renewal',
    'AMC Renewal',
    'Vendor Service',
]

export const BUDGET_CATEGORIES = [
    'IT Hardware',
    'Software Licenses',
    'Maintenance & AMC',
    'Infrastructure',
    'Cloud Services',
    'Other',
]

export const AUTO_FILLED = {
    requestedBy: 'Ravi Kumar',
    department: 'IT Support',
    sentTo: 'Ops Assistant',
    status: 'Pending',
}

export const approvalStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const stageBadgeColor = {
    'Ops Assistant': 'bg-[#515DEF33] text-[#515DEF]',
    JD: 'bg-[#2196F333] text-[#2196F3]',
    Finance: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const getRequestById = (id) =>
    getRequests().find((entry) => entry.requestId === id)

// Short type shown in the list column and its filter, matching the existing records.
const SHORT_REQUEST_TYPE = {
    'Hardware Purchase': 'Hardware',
    'Software Purchase': 'Software',
    'License Renewal': 'License',
    'AMC Renewal': 'Hardware',
    'Vendor Service': 'Software',
}

export const EMPTY_REQUEST_FORM = {
    requestTypeFull: '',
    title: '',
    description: '',
    estimatedCost: '',
    budgetCategory: '',
    vendor: '',
    vendorContact: '',
    quotationName: '',
    supportingNames: [],
}

export const validateRequestForm = (form) => {
    if (!REQUEST_TYPE_OPTIONS.includes(form.requestTypeFull)) return 'Select a request type.'
    if (!form.title.trim()) return 'Enter a request title.'
    if (!form.description.trim()) return 'Enter a description.'
    return ''
}

const todayDmy = () => {
    const now = new Date()
    return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`
}

const nextRequestId = (rows) => {
    const prefix = `REQ-IT-${new Date().getFullYear()}-`
    const max = rows.reduce((acc, row) => {
        const id = String(row.requestId || '')
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
    const cost = form.estimatedCost.trim()
    const record = {
        requestId: nextRequestId(rows),
        requestType: SHORT_REQUEST_TYPE[form.requestTypeFull] || 'Hardware',
        requestTypeFull: form.requestTypeFull,
        title: form.title.trim(),
        description: form.description.trim(),
        vendor: form.vendor.trim(),
        vendorContact: form.vendorContact.trim(),
        amount: cost,
        estimatedCost: cost,
        budgetCategory: form.budgetCategory,
        submittedDate: todayDmy(),
        approvalStatus: AUTO_FILLED.status,
        currentStage: AUTO_FILLED.sentTo,
        requestedBy: requestedBy || AUTO_FILLED.requestedBy,
        department: AUTO_FILLED.department,
        sentTo: AUTO_FILLED.sentTo,
        status: AUTO_FILLED.status,
        attachments: [form.quotationName, ...form.supportingNames].filter(Boolean),
    }
    const saved = await persistCampusJson(REQUESTS_STORAGE_KEY, [record, ...rows])
    if (!saved.success) {
        if (saved.api) setCampusMemory(REQUESTS_STORAGE_KEY, rows, { push: false })
        return { success: false, message: saved.message || 'The request could not be saved.' }
    }
    return { success: true, record }
}

export const REQUESTS_STORAGE_KEY = 'schoolerp-it-requests-v1'
export function getRequests() {
    return ensureCampusSeed('schoolerp-it-requests-v1', DEFAULT_REQUESTS)
}
export function saveRequests(rows) {
    return saveCampusJson('schoolerp-it-requests-v1', rows)
}
export function hydrateRequestsFromApi() {
    if (!usesCampusApiForKey('schoolerp-it-requests-v1')) return Promise.resolve(false)
    return hydrateCampusKey('schoolerp-it-requests-v1', DEFAULT_REQUESTS)
}
export const REQUESTS = DEFAULT_REQUESTS

