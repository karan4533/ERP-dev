import { getTransportRows, hydrateTransportRows, nextPrefixedId, saveTransportRows } from '../transportCampus'

export const DEFAULT_SERVICE_CENTERS = [
    'Chennai Automotive Service — Velachery',
    'TN Transport Works — Guindy',
    'Royal Motors Service — Adyar',
    'City Fleet Care — Tambaram',
    'Metro Vehicle Solutions — Porur',
]

export const SERVICE_CENTER_STATUSES = ['Active', 'Inactive']

export const SERVICE_CENTERS_STORAGE_KEY = 'schoolerp-transport-service-centers-v1'

const toCenterRows = (names) =>
    (names || [])
        .map((name) => String(name || '').trim())
        .filter(Boolean)
        .map((name, index) => ({
            id: `SC-${1001 + index}`,
            name,
            location: '',
            contactPerson: '',
            phone: '',
            status: 'Active',
        }))

function normalizeRow(row, index = 0) {
    if (typeof row === 'string') {
        return {
            id: `SC-${1001 + index}`,
            name: row.trim(),
            location: '',
            contactPerson: '',
            phone: '',
            status: 'Active',
        }
    }
    return {
        id: row.id || `SC-${1001 + index}`,
        name: String(row.name || row.label || '').trim(),
        location: String(row.location || '').trim(),
        contactPerson: String(row.contactPerson || '').trim(),
        phone: String(row.phone || '').trim(),
        status: SERVICE_CENTER_STATUSES.includes(row.status) ? row.status : 'Active',
    }
}

export function getServiceCenterRows() {
    const rows = getTransportRows(SERVICE_CENTERS_STORAGE_KEY, toCenterRows(DEFAULT_SERVICE_CENTERS))
    if (!Array.isArray(rows) || rows.length === 0) return toCenterRows(DEFAULT_SERVICE_CENTERS)
    return rows.map((row, index) => normalizeRow(row, index)).filter((row) => row.name)
}

export function getServiceCenterById(id) {
    return getServiceCenterRows().find((row) => String(row.id) === String(id)) ?? null
}

/** Active names for dropdowns */
export function getServiceCenters() {
    const names = getServiceCenterRows()
        .filter((row) => String(row.status || 'Active') === 'Active')
        .map((row) => row.name)
    return names.length ? names : [...DEFAULT_SERVICE_CENTERS]
}

export function hydrateServiceCentersFromApi() {
    return hydrateTransportRows(SERVICE_CENTERS_STORAGE_KEY)
}

export async function saveServiceCenterRows(rows) {
    return saveTransportRows(SERVICE_CENTERS_STORAGE_KEY, rows)
}

/** @deprecated Prefer upsertServiceCenter */
export async function saveServiceCenters(names) {
    const unique = [...new Set((names || []).map((name) => String(name || '').trim()).filter(Boolean))]
    return saveServiceCenterRows(toCenterRows(unique))
}

export async function addServiceCenter(name) {
    const label = String(name || '').trim()
    if (!label) return { success: false, message: 'Service center name is required.' }
    const rows = getServiceCenterRows()
    const existing = rows.find((item) => item.name.toLowerCase() === label.toLowerCase())
    if (existing) {
        return { success: true, name: existing.name, record: existing, existed: true }
    }
    const record = {
        id: nextPrefixedId(rows, 'SC-', 1001),
        name: label,
        location: '',
        contactPerson: '',
        phone: '',
        status: 'Active',
    }
    const result = await saveServiceCenterRows([record, ...rows])
    return { ...result, success: result?.success !== false, name: label, record, existed: false }
}

export async function upsertServiceCenter(payload) {
    const name = String(payload?.name || '').trim()
    if (!name) return { success: false, message: 'Service center name is required.' }

    const rows = getServiceCenterRows()
    const nextId = payload?.id || nextPrefixedId(rows, 'SC-', 1001)
    const duplicate = rows.find(
        (row) => row.id !== nextId && row.name.toLowerCase() === name.toLowerCase()
    )
    if (duplicate) {
        return { success: false, message: 'A service center with this name already exists.' }
    }

    const record = {
        id: nextId,
        name,
        location: String(payload?.location || '').trim(),
        contactPerson: String(payload?.contactPerson || '').trim(),
        phone: String(payload?.phone || '').trim(),
        status: SERVICE_CENTER_STATUSES.includes(payload?.status) ? payload.status : 'Active',
    }

    const idx = rows.findIndex((row) => row.id === nextId)
    const next = idx >= 0
        ? rows.map((row, i) => (i === idx ? record : row))
        : [record, ...rows]

    const result = await saveServiceCenterRows(next)
    return { ...result, success: result?.success !== false, record }
}

export async function deleteServiceCenter(id) {
    const rows = getServiceCenterRows()
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) {
        return { success: false, message: 'Service center not found.' }
    }
    return saveServiceCenterRows(next)
}
