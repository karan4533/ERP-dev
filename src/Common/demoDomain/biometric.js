import { ensureSeed, saveJson } from './storage'
import { logActivity } from './activityLog'

export const BIOMETRIC_KEY = 'schoolerp-biometric-attendance-v1'

const seed = [
    { id: 'BIO-0001', person: 'Aarav Sharma', role: 'Student', grade: '10', section: 'A', date: '2026-09-23', punchTime: '08:05', biometricStatus: 'Present', finalStatus: 'Present', changedBy: '', changedAt: '', reason: '', source: 'ESSL' },
    { id: 'BIO-0002', person: 'Diya Menon', role: 'Student', grade: '10', section: 'A', date: '2026-09-23', punchTime: '', biometricStatus: 'Absent', finalStatus: 'Absent', changedBy: '', changedAt: '', reason: '', source: 'ESSL' },
    { id: 'BIO-0003', person: 'Priya Nair', role: 'Teacher', grade: '', section: '', date: '2026-09-23', punchTime: '07:52', biometricStatus: 'Present', finalStatus: 'Present', changedBy: '', changedAt: '', reason: '', source: 'ESSL' },
]

export function getBiometricRows() {
    return ensureSeed(BIOMETRIC_KEY, seed)
}

export function syncBiometricDemo() {
    const rows = getBiometricRows().map((row) => (
        row.changedBy
            ? row
            : { ...row, source: 'ESSL', lastSync: new Date().toISOString(), biometricStatus: row.biometricStatus || 'Present' }
    ))
    const stamped = rows.map((row) => ({ ...row, lastSync: new Date().toISOString() }))
    saveJson(BIOMETRIC_KEY, stamped)
    logActivity({ action: 'UPDATE', module: 'ESSL Demo Sync', details: 'Deterministic biometric punches loaded' })
    return stamped
}

export function overrideAttendance(id, finalStatus, changedBy, reason) {
    const next = getBiometricRows().map((row) => (
        row.id === id
            ? { ...row, finalStatus, changedBy, changedAt: new Date().toISOString(), reason }
            : row
    ))
    saveJson(BIOMETRIC_KEY, next)
    logActivity({ actor: changedBy, action: 'UPDATE', module: 'Attendance Override', recordId: id, after: finalStatus, reason })
    return next
}
