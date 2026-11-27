import { ensureSeed, saveJson } from './storage'
import { hydrateCampusKey, persistCampusJson, usesCampusApiForKey } from '../../services/campusJsonStore'
import { logActivity } from './activityLog'

export const BIOMETRIC_KEY = 'schoolerp-biometric-attendance-v1'

/** Dual half-day punches: morning (FN) + afternoon (AN). Missing one half → Half Day. */
const seed = [
    {
        id: 'BIO-0001',
        person: 'Aarav Sharma',
        role: 'Student',
        grade: '10',
        section: 'A',
        date: '2026-09-23',
        morningCheckIn: '08:05',
        morningCheckOut: '12:05',
        afternoonCheckIn: '12:45',
        afternoonCheckOut: '16:10',
        morningStatus: 'Checked In',
        afternoonStatus: 'Checked Out',
        biometricStatus: 'Present',
        finalStatus: 'Present',
        dayStatus: 'Present',
        changedBy: '',
        changedAt: '',
        reason: '',
        source: 'ESSL',
    },
    {
        id: 'BIO-0002',
        person: 'Diya Menon',
        role: 'Student',
        grade: '10',
        section: 'A',
        date: '2026-09-23',
        morningCheckIn: '08:12',
        morningCheckOut: '12:02',
        afternoonCheckIn: '',
        afternoonCheckOut: '',
        morningStatus: 'Checked Out',
        afternoonStatus: 'Absent',
        biometricStatus: 'Half Day',
        finalStatus: 'Half Day',
        dayStatus: 'Half Day',
        changedBy: '',
        changedAt: '',
        reason: '',
        source: 'ESSL',
    },
    {
        id: 'BIO-0003',
        person: 'Priya Nair',
        role: 'Teacher',
        grade: '',
        section: '',
        date: '2026-09-23',
        morningCheckIn: '07:52',
        morningCheckOut: '12:10',
        afternoonCheckIn: '12:40',
        afternoonCheckOut: '16:05',
        morningStatus: 'Checked Out',
        afternoonStatus: 'Checked Out',
        biometricStatus: 'Present',
        finalStatus: 'Present',
        dayStatus: 'Present',
        changedBy: '',
        changedAt: '',
        reason: '',
        source: 'ESSL',
    },
]

function deriveHalfStatus(checkIn, checkOut) {
    if (checkIn && checkOut) return 'Checked Out'
    if (checkIn) return 'Checked In'
    return 'Absent'
}

function deriveDayStatus(morningStatus, afternoonStatus) {
    const morningPresent = morningStatus === 'Checked In' || morningStatus === 'Checked Out'
    const afternoonPresent = afternoonStatus === 'Checked In' || afternoonStatus === 'Checked Out'
    if (morningPresent && afternoonPresent) return 'Present'
    if (!morningPresent && !afternoonPresent) return 'Absent'
    return 'Half Day'
}

function normalizeRow(row) {
    const morningCheckIn = row.morningCheckIn || row.punchTime || ''
    const morningCheckOut = row.morningCheckOut || ''
    const afternoonCheckIn = row.afternoonCheckIn || ''
    const afternoonCheckOut = row.afternoonCheckOut || ''
    const morningStatus = row.morningStatus || deriveHalfStatus(morningCheckIn, morningCheckOut)
    const afternoonStatus = row.afternoonStatus || deriveHalfStatus(afternoonCheckIn, afternoonCheckOut)
    const dayStatus = row.dayStatus || deriveDayStatus(morningStatus, afternoonStatus)
    return {
        ...row,
        morningCheckIn,
        morningCheckOut,
        afternoonCheckIn,
        afternoonCheckOut,
        morningStatus,
        afternoonStatus,
        dayStatus,
        biometricStatus: row.biometricStatus || dayStatus,
        finalStatus: row.finalStatus || dayStatus,
        // legacy single punch column kept for older rows
        punchTime: morningCheckIn || row.punchTime || '',
    }
}

export function getBiometricRows() {
    return ensureSeed(BIOMETRIC_KEY, seed).map(normalizeRow)
}

export async function hydrateBiometricFromApi() {
    if (!usesCampusApiForKey(BIOMETRIC_KEY)) return false
    return hydrateCampusKey(BIOMETRIC_KEY, seed)
}

async function persistRows(rows) {
    if (usesCampusApiForKey(BIOMETRIC_KEY)) {
        const ok = await hydrateBiometricFromApi()
        if (!ok) return { rows: getBiometricRows(), loaded: false }
    }
    return { rows: getBiometricRows(), loaded: true }
}

async function saveRows(rows) {
    if (usesCampusApiForKey(BIOMETRIC_KEY)) return persistCampusJson(BIOMETRIC_KEY, rows)
    return { success: Boolean(saveJson(BIOMETRIC_KEY, rows)), api: false }
}

export async function syncBiometricDemo() {
    const { rows, loaded } = await persistRows()
    if (!loaded) return { success: false, rows, message: 'Could not load biometric records from the server.' }
    if (!rows.length) {
        return { success: false, rows, message: 'No biometric punches to sync yet. The attendance device import is not connected.' }
    }
    const now = new Date().toISOString()
    const next = rows.map((row) => {
        const normalized = normalizeRow(row)
        return {
            ...normalized,
            source: 'ESSL',
            lastSync: now,
            biometricStatus: normalized.dayStatus || normalized.biometricStatus || 'Present',
            finalStatus: normalized.finalStatus || normalized.dayStatus || 'Present',
        }
    })
    const saved = await saveRows(next)
    if (!saved.success) return { success: false, rows, message: saved.message || 'Could not save the biometric sync.' }
    logActivity({ action: 'UPDATE', module: 'ESSL Demo Sync', details: 'Dual-session biometric punches loaded' })
    return { success: true, rows: next }
}

export async function overrideAttendance(id, status, actor, reason) {
    const { rows, loaded } = await persistRows()
    if (!loaded) return { success: false, rows, message: 'Could not load biometric records from the server.' }
    const next = rows.map((row) => (
        row.id === id
            ? {
                ...normalizeRow(row),
                finalStatus: status,
                dayStatus: status,
                biometricStatus: status,
                changedBy: actor,
                changedAt: new Date().toISOString(),
                reason,
            }
            : normalizeRow(row)
    ))
    const saved = await saveRows(next)
    if (!saved.success) return { success: false, rows, message: saved.message || 'Could not save override.' }
    return { success: true, rows: next }
}
