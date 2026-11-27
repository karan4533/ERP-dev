import {
    createFrontOfficeItem,
    deleteFrontOfficeItem,
    frontOfficeApiOn,
    hydrateFrontOfficeCollection,
    peekFrontOfficeCollection,
    updateFrontOfficeItem,
} from '../frontOfficeStore'

const STORAGE_KEY = 'goods-received-pass-front-office'
const GR_COUNTER_KEY = 'goods-received-pass-gr-counter'

/**
 * Shared Goods Received Pass routes for Front Office + Stationery Store Manager.
 * Store has list + view routes only; add/edit are null until those routes are mounted.
 */
export const getGoodsReceivedPassPaths = () => {
    const path = typeof window !== 'undefined' ? String(window.location.pathname || '') : ''
    if (path.startsWith('/stationery-store-manager')) {
        return {
            list: '/stationery-store-manager/goods-received-pass',
            add: '/stationery-store-manager/goods-received-pass/add',
            view: (id) => `/stationery-store-manager/goods-received-pass/view/${id}`,
            edit: (id) => `/stationery-store-manager/goods-received-pass/edit/${id}`,
        }
    }
    return {
        list: '/front-office/goods-received-pass-list',
        add: '/front-office/add-goods-received-pass',
        view: (id) => `/front-office/goods-received-pass/view/${id}`,
        edit: (id) => `/front-office/goods-received-pass/edit/${id}`,
    }
}

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

const DEFAULT_GOODS_RECEIVED_PASSES = []

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

const FO_COLLECTION = 'goods-received-passes'

const hydrateRecord = (record) => ({
    ...record,
    signatories: normalizeSignatories(record.signatories),
    totalItems: calculateTotalItems(record.materials),
    status: record.status ?? deriveOverallStatus(record.signatories),
})

export const hydrateGoodsReceivedPassesFromApi = async () => {
    const rows = await hydrateFrontOfficeCollection(FO_COLLECTION)
    return rows.map(hydrateRecord)
}

const localGoodsReceivedPasses = () => {
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

export const getGoodsReceivedPasses = () =>
    frontOfficeApiOn()
        ? peekFrontOfficeCollection(FO_COLLECTION).map(hydrateRecord)
        : localGoodsReceivedPasses()

export const saveGoodsReceivedPasses = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getGoodsReceivedPassById = (id) =>
    getGoodsReceivedPasses().find((record) => record.id === id) ?? null

/** Cache first; in API mode fetch the collection when the record is not cached yet (direct links). */
export const loadGoodsReceivedPassById = async (id) => {
    const cached = getGoodsReceivedPassById(id)
    if (cached || !frontOfficeApiOn()) return cached
    const rows = await hydrateGoodsReceivedPassesFromApi()
    return rows.find((record) => record.id === id) ?? null
}

export const addGoodsReceivedPass = async (payload) => {
    const grNo = frontOfficeApiOn() ? undefined : generateGrNo()
    const draft = hydrateRecord({
        ...(grNo ? { id: `grp-${grNo}`, grNo } : {}),
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
    if (frontOfficeApiOn()) {
        return hydrateRecord(await createFrontOfficeItem(FO_COLLECTION, draft))
    }
    saveGoodsReceivedPasses([draft, ...localGoodsReceivedPasses()])
    return draft
}

export const updateGoodsReceivedPass = async (id, payload) => {
    const records = getGoodsReceivedPasses()
    const index = records.findIndex((record) => record.id === id)
    if (index === -1) return null
    const updated = hydrateRecord({
        ...records[index],
        ...payload,
        status: deriveOverallStatus(payload.signatories ?? records[index].signatories),
    })
    if (frontOfficeApiOn()) {
        return hydrateRecord(await updateFrontOfficeItem(FO_COLLECTION, id, updated))
    }
    records[index] = updated
    saveGoodsReceivedPasses(records)
    return updated
}

export const deleteGoodsReceivedPass = async (id) => {
    if (frontOfficeApiOn()) {
        await deleteFrontOfficeItem(FO_COLLECTION, id)
        return
    }
    saveGoodsReceivedPasses(localGoodsReceivedPasses().filter((record) => record.id !== id))
}

export const getNextGrPreview = () => {
    const records = getGoodsReceivedPasses()
    const current = syncGrCounter(records)
    return formatPassNumber(current + 1)
}
