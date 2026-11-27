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
        requestId: 'REQ-2026-001',
        requestType: 'Stock',
        title: 'Monthly rice and dal procurement',
        requestedAmount: '₹45,000',
        priority: 'High',
        submittedDate: '08-06-2026',
        sentTo: 'Operations Head',
        status: 'Pending',
        approvalDate: '—',
        description: 'Restock basmati rice and toor dal for June lunch service. Current stock below reorder level.',
        requiredByDate: '15-06-2026',
        budgetCategory: 'Food Supplies',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
    {
        requestId: 'REQ-2026-002',
        requestType: 'Equipment',
        title: 'Commercial mixer grinder replacement',
        requestedAmount: '₹28,500',
        priority: 'Urgent',
        submittedDate: '05-06-2026',
        sentTo: 'Operations Head',
        status: 'Approved',
        approvalDate: '07-06-2026',
        description: 'Existing mixer failed during morning prep. Need replacement for chapati and batter preparation.',
        requiredByDate: '10-06-2026',
        budgetCategory: 'Kitchen Equipment',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
    {
        requestId: 'REQ-2026-003',
        requestType: 'Vendor Bill',
        title: 'Fresh vegetables vendor invoice — May 2026',
        requestedAmount: '₹62,000',
        priority: 'Medium',
        submittedDate: '02-06-2026',
        sentTo: 'Operations Head',
        status: 'Approved',
        approvalDate: '04-06-2026',
        description: 'Payment approval for Green Farm Supplies monthly vegetable delivery invoice.',
        requiredByDate: '08-06-2026',
        budgetCategory: 'Vendor Payments',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
    {
        requestId: 'REQ-2026-004',
        requestType: 'Maintenance',
        title: 'Walk-in refrigerator gas refill',
        requestedAmount: '₹8,500',
        priority: 'High',
        submittedDate: '01-06-2026',
        sentTo: 'Operations Head',
        status: 'Rejected',
        approvalDate: '03-06-2026',
        description: 'Main storage refrigerator not cooling adequately. Technician quoted gas refill and seal check.',
        requiredByDate: '05-06-2026',
        budgetCategory: 'Maintenance',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
    {
        requestId: 'REQ-2026-005',
        requestType: 'Stock',
        title: 'Disposable plates and cups restock',
        requestedAmount: '₹12,000',
        priority: 'Low',
        submittedDate: '10-06-2026',
        sentTo: 'Operations Head',
        status: 'Pending',
        approvalDate: '—',
        description: 'Eco-friendly disposable serveware for event day orders and overflow counter service.',
        requiredByDate: '18-06-2026',
        budgetCategory: 'Consumables',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
]

export const REQUEST_TYPE_OPTIONS = [
    { value: 'Stock Purchase', label: 'Stock Purchase', listLabel: 'Stock' },
    { value: 'Kitchen Equipment', label: 'Kitchen Equipment', listLabel: 'Equipment' },
    { value: 'Vendor Bill', label: 'Vendor Bill', listLabel: 'Vendor Bill' },
    { value: 'Maintenance', label: 'Maintenance', listLabel: 'Maintenance' },
    { value: 'Other', label: 'Other', listLabel: 'Other' },
]

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

export const BUDGET_CATEGORIES = [
    'Food Supplies',
    'Kitchen Equipment',
    'Vendor Payments',
    'Maintenance',
    'Consumables',
    'Other',
]

export const AUTO_FILLED = {
    requestedBy: 'Rajesh Kumar',
    department: 'Canteen',
    sentTo: 'Operations Head',
    status: 'Pending',
}

export const priorityBadgeColor = {
    Low: 'bg-[#66708533] text-[#667085]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Urgent: 'bg-[#FF000033] text-[#FF0000]',
}

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const EMPTY_REQUEST_FORM = {
    requestTypeFull: '',
    title: '',
    description: '',
    priority: '',
    estimatedAmount: '',
    budgetCategory: '',
    requiredByDate: null,
}

export const validateRequestForm = (form) => {
    if (!REQUEST_TYPE_OPTIONS.some((option) => option.value === form.requestTypeFull)) {
        return 'Select a request type.'
    }
    if (!form.title.trim()) return 'Enter a request title.'
    if (!form.description.trim()) return 'Enter a description.'
    if (!PRIORITY_OPTIONS.includes(form.priority)) return 'Select a priority.'
    return ''
}

const todayDmy = () => {
    const now = new Date()
    return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`
}

const toDmy = (value) => {
    if (!value) return '—'
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
}

const nextRequestId = (rows) => {
    const year = new Date().getFullYear()
    const prefix = `REQ-CN-${year}-`
    const legacyPrefix = `REQ-${year}-`
    const max = rows.reduce((acc, row) => {
        const id = String(row.requestId || row.id || '')
        let serial = 0
        if (id.startsWith(prefix)) serial = Number(id.slice(prefix.length))
        else if (id.startsWith(legacyPrefix)) serial = Number(id.slice(legacyPrefix.length))
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
    const typeOption = REQUEST_TYPE_OPTIONS.find((option) => option.value === form.requestTypeFull)
    const requestId = nextRequestId(rows)
    const record = {
        id: requestId,
        requestId,
        requestType: typeOption?.listLabel || form.requestTypeFull,
        requestTypeFull: form.requestTypeFull,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        requestedAmount: amount,
        amount,
        budgetCategory: form.budgetCategory,
        requiredByDate: toDmy(form.requiredByDate),
        submittedDate: todayDmy(),
        approvalDate: '—',
        approvalStatus: AUTO_FILLED.status,
        currentStage: AUTO_FILLED.sentTo,
        requestedBy: requestedBy || AUTO_FILLED.requestedBy,
        department: AUTO_FILLED.department,
        sentTo: AUTO_FILLED.sentTo,
        status: AUTO_FILLED.status,
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

export const REQUESTS_STORAGE_KEY = 'schoolerp-canteen-requests-v1'
export function getRequests() {
    return ensureCampusSeed('schoolerp-canteen-requests-v1', DEFAULT_REQUESTS)
}
export function saveRequests(rows) {
    return saveCampusJson('schoolerp-canteen-requests-v1', rows)
}
export function hydrateRequestsFromApi() {
    if (!usesCampusApiForKey('schoolerp-canteen-requests-v1')) return Promise.resolve(false)
    return hydrateCampusKey('schoolerp-canteen-requests-v1', DEFAULT_REQUESTS)
}
export function getRequestsLoadState() {
    return getCampusLoadState(REQUESTS_STORAGE_KEY)
}
export const REQUESTS = DEFAULT_REQUESTS
