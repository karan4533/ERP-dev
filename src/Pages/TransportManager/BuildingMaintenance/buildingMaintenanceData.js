import { getTransportRows, hydrateTransportRows, saveTransportRows, nextPrefixedId } from '../transportCampus'

export const BUILDING_MAINTENANCE_STORAGE_KEY = 'schoolerp-transport-building-maintenance-v1'

export const BUILDING_MAINTENANCE_CATEGORIES = ['Wire', 'Light', 'Other']
export const BUILDING_MAINTENANCE_STATUSES = ['Pending', 'Completed']

/** Offline first-run only. API mode hydrates to [] via transportCampus. */
const OFFLINE_SEED = [
    {
        id: 'BM-0001',
        date: '2026-09-10',
        category: 'Light',
        location: 'Block B corridor',
        cost: 2400,
        remarks: 'Replaced fittings',
        status: 'Completed',
    },
]

export function getBuildingMaintenanceRows() {
    return getTransportRows(BUILDING_MAINTENANCE_STORAGE_KEY, OFFLINE_SEED)
}

export function saveBuildingMaintenanceRows(rows) {
    return saveTransportRows(BUILDING_MAINTENANCE_STORAGE_KEY, rows)
}

export function hydrateBuildingMaintenanceFromApi() {
    return hydrateTransportRows(BUILDING_MAINTENANCE_STORAGE_KEY)
}

export function getBuildingMaintenanceById(id) {
    return getBuildingMaintenanceRows().find((row) => row.id === id) ?? null
}

export async function upsertBuildingMaintenance(record) {
    const rows = getBuildingMaintenanceRows()
    const nextId = record.id || nextPrefixedId(rows, 'BM-', 1)
    const nextRecord = {
        date: '',
        category: '',
        location: '',
        remarks: '',
        status: 'Pending',
        ...record,
        id: nextId,
        cost: record.cost === '' || record.cost == null ? '' : Number(record.cost) || 0,
        updatedAt: new Date().toISOString(),
        createdAt: record.createdAt || new Date().toISOString(),
    }
    const idx = rows.findIndex((row) => row.id === nextId)
    const next = idx >= 0 ? rows.map((row, i) => (i === idx ? { ...row, ...nextRecord } : row)) : [nextRecord, ...rows]
    const result = await saveBuildingMaintenanceRows(next)
    return { ...result, record: nextRecord }
}

export async function deleteBuildingMaintenance(id) {
    const rows = getBuildingMaintenanceRows()
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) {
        return { success: false, message: 'Record not found.' }
    }
    return saveBuildingMaintenanceRows(next)
}
