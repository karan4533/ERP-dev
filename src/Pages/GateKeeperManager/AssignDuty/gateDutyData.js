/**
 * Gate duty SoT — Gate Keeper Manager assigns; Gate Keeper My Duty reads the same collection.
 * API: /api/v1/ops/gate-duty-assignments
 */
import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJson,
    usesCampusApiForKey,
} from '../../../services/campusJsonStore'

export const GATE_DUTY_ASSIGNMENTS_KEY = 'schoolerp-security-duty-assignments-v1'

const DEMO_DUTIES = [
    {
        id: 'DUT001',
        dutyId: 'DUT001',
        gateKeeperName: 'Ravi Kumar',
        employeeId: 'GK-1001',
        gateLocation: 'Main Gate',
        shift: 'Morning',
        dutyDate: '05-08-2025',
        startTime: '07:00',
        endTime: '13:00',
        assignedBy: 'Gate Keeper Manager',
        status: 'Assigned',
    },
]

const seedFor = (demo) => (usesCampusApiForKey(GATE_DUTY_ASSIGNMENTS_KEY) ? [] : demo)

export function getGateDutyAssignments() {
    return ensureCampusSeed(GATE_DUTY_ASSIGNMENTS_KEY, seedFor(DEMO_DUTIES))
}

export function saveGateDutyAssignments(rows) {
    return persistCampusJson(GATE_DUTY_ASSIGNMENTS_KEY, rows)
}

export function hydrateGateDutyAssignmentsFromApi() {
    if (!usesCampusApiForKey(GATE_DUTY_ASSIGNMENTS_KEY)) return Promise.resolve(false)
    return hydrateCampusKey(GATE_DUTY_ASSIGNMENTS_KEY, [])
}

export async function upsertGateDutyAssignment(payload) {
    const rows = getGateDutyAssignments()
    const id = String(payload.id || payload.dutyId || `DUT-${Date.now()}`).trim()
    const assigneeEmail = String(payload.assigneeEmail || payload.email || '').trim().toLowerCase()
    const record = {
        ...payload,
        id,
        dutyId: payload.dutyId || id,
        assigneeEmail,
        email: assigneeEmail,
        status: payload.status || 'Assigned',
        assignedBy: payload.assignedBy || 'Gate Keeper Manager',
    }
    const idx = rows.findIndex((row) => String(row.id) === id || String(row.dutyId) === id)
    const next = idx >= 0
        ? rows.map((row, i) => (i === idx ? { ...row, ...record } : row))
        : [record, ...rows]
    const result = await saveGateDutyAssignments(next)
    return { ...result, record }
}

/** Duties visible to a signed-in gate keeper (prefer email; name is fallback for offline demo). */
export function getMyGateDuties({ gateKeeperName = '', employeeId = '', email = '' } = {}) {
    const rows = getGateDutyAssignments()
    const name = String(gateKeeperName || '').trim().toLowerCase()
    const emp = String(employeeId || email || '').trim().toLowerCase()
    const mail = String(email || employeeId || '').trim().toLowerCase()
    if (!name && !emp && !mail) return []
    return rows.filter((row) => {
        const rowName = String(row.gateKeeperName || '').trim().toLowerCase()
        const rowEmp = String(row.employeeId || '').trim().toLowerCase()
        const rowMail = String(row.assigneeEmail || row.email || '').trim().toLowerCase()
        return (mail && (rowMail === mail || rowEmp === mail))
            || (emp && (rowEmp === emp || rowMail === emp))
            || (name && rowName === name)
    })
}
