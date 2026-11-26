const STORAGE_KEY = 'goods-received-pass-front-office'
const GR_COUNTER_KEY = 'goods-received-pass-gr-counter'

export const PAYMENT_TYPES = ['CASH', 'CREDIT']

export const SIGNATORY_ROLES = [
    { key: 'storeKeeper', label: 'Store Keeper', useRoleSelect: true },
    { key: 'checkedBy', label: 'Checked By', useRoleSelect: false },
    { key: 'authorizedSignatory', label: 'Authorised Signatory', useRoleSelect: true },
]

export const SIGNATORY_ROLE_PERSONS = [
    { role: 'Store Keeper', name: 'Selvam R.' },
    { role: 'Assistant Store Keeper', name: 'Kumar V.' },
    { role: 'Accounts Officer', name: 'Lakshmi Devi' },
    { role: 'Purchase Officer', name: 'Anand Kumar' },
    { role: 'Authorised Signatory', name: 'Admin Office' },
    { role: 'Principal', name: 'Dr. Priya Nair' },
    { role: 'Director', name: 'Dr. Meena Krishnan' },
]

export const getPersonNameByRole = (role) =>
    SIGNATORY_ROLE_PERSONS.find((item) => item.role === role)?.name ?? ''

export const STATUS_OPTIONS = ['Pending', 'Approved', 'Partially Approved']

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    'Partially Approved': 'bg-[#2196F333] text-[#2196F3]',
}

export const createEmptyGoodsRow = () => ({
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: '',
    quantity: 1,
    remarks: '',
    lpNo: '',
})

export const createDefaultSignatories = () =>
    SIGNATORY_ROLES.reduce((acc, role) => {
        acc[role.key] = role.useRoleSelect ? { role: '', name: '' } : { name: '' }
        return acc
    }, {})

const normalizeSignatoryEntry = (key, signatory = {}) => {
    const roleConfig = SIGNATORY_ROLES.find((role) => role.key === key)
    if (!roleConfig) return signatory

    if (roleConfig.useRoleSelect) {
        const role = signatory.role ?? ''
        return {
            role,
            name: signatory.name || getPersonNameByRole(role) || '',
        }
    }

    return { name: signatory.name ?? '' }
}

export const normalizeSignatories = (signatories = {}) =>
    SIGNATORY_ROLES.reduce((acc, { key }) => {
        acc[key] = normalizeSignatoryEntry(key, signatories[key])
        return acc
    }, {})

const DEFAULT_GOODS_RECEIVED_PASSES = [
    {
        id: 'grp-0001',
        grNo: '0001',
        supplierName: 'Apex Educational Supplies Pvt Ltd',
        date: '2026-11-02',
        time: '10:30',
        timePeriod: 'AM',
        poNo: 'PO-2026-001',
        poDate: '2026-10-25',
        invoiceNo: 'INV-APX-8821',
        invoiceDate: '2026-11-01',
        dcNo: 'DC-9921',
        dcDate: '2026-11-01',
        vehicleNo: 'TN-09-CB-1245',
        paymentType: 'CREDIT',
        remarks: 'Bulk textbook & notebook shipment for Term 2. Received in good condition.',
        materials: [
            { id: 'mat-1', description: 'Grade 10 Mathematics Workbooks', quantity: 250, remarks: 'Verified intact', lpNo: 'LP-01' },
            { id: 'mat-2', description: 'A4 Ruled Notebooks (200 pgs)', quantity: 500, remarks: 'Box sealed', lpNo: 'LP-02' }
        ],
        signatories: {
            storeKeeper: { role: 'Store Keeper', name: 'Selvam R.' },
            checkedBy: { name: 'Muthu K.' },
            authorizedSignatory: { role: 'Authorised Signatory', name: 'Admin Office' }
        },
        status: 'Approved',
        createdAt: '02/11/2026 10:45 AM'
    },
    {
        id: 'grp-0002',
        grNo: '0002',
        supplierName: 'TechMatrix Digital Solutions',
        date: '2026-11-05',
        time: '02:15',
        timePeriod: 'PM',
        poNo: 'PO-2026-004',
        poDate: '2026-10-28',
        invoiceNo: 'INV-TM-4410',
        invoiceDate: '2026-11-04',
        dcNo: 'DC-8812',
        dcDate: '2026-11-04',
        vehicleNo: 'KA-01-MJ-5510',
        paymentType: 'CREDIT',
        remarks: 'New projector lamps and HDMI cables for Senior Wing audio-visual setup.',
        materials: [
            { id: 'mat-3', description: 'Dell 4K Projector Replacement Lamp', quantity: 4, remarks: 'Serial checked', lpNo: 'LP-03' },
            { id: 'mat-4', description: 'High-Speed HDMI 2.1 Braided Cables (10m)', quantity: 15, remarks: 'Tested okay', lpNo: 'LP-04' }
        ],
        signatories: {
            storeKeeper: { role: 'Store Keeper', name: 'Selvam R.' },
            checkedBy: { name: 'Sanjay V.' },
            authorizedSignatory: { role: '', name: '' }
        },
        status: 'Partially Approved',
        createdAt: '05/11/2026 02:30 PM'
    },
    {
        id: 'grp-0003',
        grNo: '0003',
        supplierName: 'GreenClean Hygiene & Chemicals',
        date: '2026-11-09',
        time: '09:00',
        timePeriod: 'AM',
        poNo: 'PO-2026-007',
        poDate: '2026-11-02',
        invoiceNo: 'INV-GC-1190',
        invoiceDate: '2026-11-08',
        dcNo: 'DC-3301',
        dcDate: '2026-11-08',
        vehicleNo: 'TN-22-AX-9912',
        paymentType: 'CASH',
        remarks: 'Monthly deep-cleaning sanitizers, floor disinfectant drums, and microfiber mops.',
        materials: [
            { id: 'mat-5', description: 'Hospital-Grade Floor Cleaner (20L Drum)', quantity: 10, remarks: 'Batch certified', lpNo: 'LP-05' },
            { id: 'mat-6', description: 'Hand Sanitizer Dispensers (500ml)', quantity: 50, remarks: 'Intact', lpNo: 'LP-06' }
        ],
        signatories: {
            storeKeeper: { role: '', name: '' },
            checkedBy: { name: '' },
            authorizedSignatory: { role: '', name: '' }
        },
        status: 'Pending',
        createdAt: '09/11/2026 09:15 AM'
    }
]

export const calculateTotalItems = (materials = []) =>
    materials.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

export const deriveOverallStatus = (signatories = {}) => {
    const normalized = normalizeSignatories(signatories)
    const filledCount = SIGNATORY_ROLES.filter(({ key }) => normalized[key]?.name?.trim()).length
    if (filledCount === SIGNATORY_ROLES.length) return 'Approved'
    if (filledCount > 0) return 'Partially Approved'
    return 'Pending'
}

export const formatDisplayTime = (time, timePeriod) => {
    if (!time) return '—'
    return timePeriod ? `${time} ${timePeriod}` : time
}

const parsePassNumber = (value) => {
    const numeric = Number(String(value ?? '').replace(/\D/g, ''))
    return Number.isNaN(numeric) ? 0 : numeric
}

const formatPassNumber = (num) => String(num).padStart(4, '0')

const syncGrCounter = (records = []) => {
    const maxInRecords = records.reduce(
        (max, record) => Math.max(max, parsePassNumber(record.grNo)),
        0,
    )
    const stored = localStorage.getItem(GR_COUNTER_KEY)
    const counter = stored !== null ? Number(stored) || 0 : maxInRecords
    const nextCounter = Math.max(counter, maxInRecords)
    localStorage.setItem(GR_COUNTER_KEY, String(nextCounter))
    return nextCounter
}

export const generateGrNo = () => {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    syncGrCounter(Array.isArray(records) ? records : [])
    const current = Number(localStorage.getItem(GR_COUNTER_KEY) || 0)
    const next = current + 1
    localStorage.setItem(GR_COUNTER_KEY, String(next))
    return formatPassNumber(next)
}

const hydrateRecord = (record) => ({
    ...record,
    signatories: normalizeSignatories(record.signatories),
    totalItems: calculateTotalItems(record.materials),
    status: record.status ?? deriveOverallStatus(record.signatories),
})

export const getGoodsReceivedPasses = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
        const records = JSON.parse(stored).map(hydrateRecord)
        syncGrCounter(records)
        return records
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GOODS_RECEIVED_PASSES))
    localStorage.setItem(GR_COUNTER_KEY, '0')
    return DEFAULT_GOODS_RECEIVED_PASSES.map(hydrateRecord)
}

export const saveGoodsReceivedPasses = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getGoodsReceivedPassById = (id) =>
    getGoodsReceivedPasses().find((record) => record.id === id) ?? null

export const addGoodsReceivedPass = (payload) => {
    const records = getGoodsReceivedPasses()
    const grNo = generateGrNo()
    const record = hydrateRecord({
        id: `grp-${grNo}`,
        grNo,
        ...payload,
        status: deriveOverallStatus(payload.signatories),
        createdAt: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).replace(',', ''),
    })
    saveGoodsReceivedPasses([record, ...records])
    return record
}

export const updateGoodsReceivedPass = (id, payload) => {
    const records = getGoodsReceivedPasses()
    const index = records.findIndex((record) => record.id === id)
    if (index === -1) return null
    const updated = hydrateRecord({
        ...records[index],
        ...payload,
        status: deriveOverallStatus(payload.signatories ?? records[index].signatories),
    })
    records[index] = updated
    saveGoodsReceivedPasses(records)
    return updated
}

export const deleteGoodsReceivedPass = (id) => {
    const records = getGoodsReceivedPasses().filter((record) => record.id !== id)
    saveGoodsReceivedPasses(records)
}

export const getNextGrPreview = () => {
    const records = getGoodsReceivedPasses()
    const current = syncGrCounter(records)
    return formatPassNumber(current + 1)
}
