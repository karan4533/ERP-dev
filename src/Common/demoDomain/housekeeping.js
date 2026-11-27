import { ensureSeed, nextSerial, saveJson } from './storage'
import { addRequirement } from './inventory'

export const DUTY_KEY = 'schoolerp-housekeeping-duty-v1'
export const SCHEDULE_KEY = 'schoolerp-housekeeping-schedules-v1'
export const SOM_KEY = 'schoolerp-housekeeping-som-v1'
export const RO_KEY = 'schoolerp-housekeeping-ro-testing-v1'
export const LOST_KEY = 'schoolerp-housekeeping-lost-found-v1'

export const DUTY_SEED = [
    { id: 'DUTY-2026-0001', staff: 'Lakshmi P.', area: 'Academic Block A', dutyType: 'Daily Cleaning', assignedBy: 'Housekeeping Manager', date: '2026-09-23', startTime: '07:00', endTime: '11:00', priority: 'Normal', instructions: 'Classrooms and corridors', remarks: '', status: 'Assigned' },
]

export const SCHEDULE_SEED = [
    { id: 'SCH-2026-0001', name: 'Daily Cleaning', frequency: 'DAILY', area: 'Academic Block', staff: 'Lakshmi P.', status: 'Active' },
    { id: 'SCH-2026-0002', name: 'Deep Cleaning', frequency: 'WEEKLY', area: 'Auditorium', staff: 'Ravi S.', status: 'Active', weekday: 1 },
    { id: 'SCH-2026-0003', name: 'Washroom sanitation', frequency: 'MONTHLY', area: 'All blocks', staff: 'Meena K.', status: 'Active', dayOfMonth: 1 },
]

export const SOM_SEED = [
    { id: 'SOM-HK-2026-0001', employee: 'Lakshmi P.', month: '2026-08', criteria: 'Punctuality, quality, attendance', score: 4.6, remarks: 'Consistent floor finish', ratedBy: 'Housekeeping Supervisor' },
]

export const RO_SEED = [
    { id: 'RO-2026-0001', date: '2026-09-20', location: 'Block A RO unit', test: 'Taste and clarity check', result: 'Clear', status: 'Recorded', remarks: 'No odour', recordedBy: 'Housekeeping Supervisor' },
]

export const LOST_SEED = [
    { id: 'LF-2026-0001', date: '2026-09-18', item: 'Water bottle', foundLocation: 'Playground', reportedBy: 'Lakshmi P.', description: 'Blue steel bottle', claimStatus: 'Unclaimed', claimedBy: '', claimedDate: '', remarks: '' },
]

export function getDuties() {
    return ensureSeed(DUTY_KEY, DUTY_SEED)
}

export function getSchedules() {
    return ensureSeed(SCHEDULE_KEY, SCHEDULE_SEED)
}

export function ensureTodayOccurrences(today = new Date()) {
    const iso = today.toISOString().slice(0, 10)
    const schedules = getSchedules().filter((item) => item.status === 'Active')
    const duties = getDuties()
    const created = []
    schedules.forEach((schedule) => {
        const due = schedule.frequency === 'DAILY'
            || (schedule.frequency === 'WEEKLY' && today.getDay() === Number(schedule.weekday ?? 1))
            || (schedule.frequency === 'MONTHLY' && today.getDate() === Number(schedule.dayOfMonth ?? 1))
        if (!due) return
        const marker = `${schedule.id}-${iso}`
        if (duties.some((duty) => duty.occurrenceKey === marker)) return
        created.push({
            id: nextSerial('DUTY-2026-', [...duties, ...created], 'id'),
            occurrenceKey: marker,
            staff: schedule.staff,
            area: schedule.area,
            dutyType: schedule.name,
            assignedBy: 'Recurring Schedule',
            date: iso,
            startTime: '07:00',
            endTime: '15:00',
            priority: 'Normal',
            instructions: `${schedule.frequency} occurrence generated when the app opened.`,
            remarks: '',
            status: 'Assigned',
        })
    })
    if (created.length) saveJson(DUTY_KEY, [...created, ...duties])
    return getDuties()
}

export function completeDuty(id, remarks) {
    const duties = getDuties().map((duty) => (
        duty.id === id ? { ...duty, status: 'Completed', remarks } : duty
    ))
    saveJson(DUTY_KEY, duties)
    return duties
}

export function submitHousekeepingRequirement(input) {
    return addRequirement({ ...input, department: 'Housekeeping', requestedBy: input.requestedBy || 'Housekeeping Manager' })
}
