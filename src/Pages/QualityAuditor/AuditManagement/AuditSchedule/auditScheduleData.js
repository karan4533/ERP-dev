import { addDays } from 'date-fns'
import { generateId, toDateKey } from '../../../../Common/MeetingsCalendar/utils/dateHelpers'
import { DEPARTMENTS, FREQUENCIES, getMyAudits } from '../MyAudits/myAuditsData'

export { DEPARTMENTS, FREQUENCIES }

export const SCHEDULE_STATUSES = ['Scheduled', 'Pending', 'In Progress', 'Completed', 'Overdue']

export const statusBadgeColor = {
    Scheduled: 'bg-[#515DEF33] text-[#515DEF]',
    Pending: 'bg-[#2196F333] text-[#2196F3]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Overdue: 'bg-[#FF000033] text-[#FF0000]',
}

const STORAGE_KEY = 'quality-auditor-audit-schedule'

export const parseDisplayDate = (value) => {
    const [day, month, year] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
}

const buildSchedule = ({
    scheduleId,
    auditId,
    auditName,
    department,
    frequency,
    assignedDate,
    dueDate,
    assignedBy,
    status,
    startTime = '09:00',
    endTime = '10:30',
    colorIdx = 0,
}) => ({
    id: scheduleId,
    scheduleId,
    auditId,
    auditName,
    department,
    frequency,
    assignedDate,
    dueDate,
    assignedBy,
    status,
    startTime,
    endTime,
    colorIdx,
})

const DEFAULT_AUDIT_SCHEDULES = [
    buildSchedule({
        scheduleId: 'SCH-PA-2026-001',
        auditId: 'AUD-PA-2026-041',
        auditName: 'Petty Cash & Voucher Compliance',
        department: 'Finance',
        frequency: 'Monthly',
        assignedDate: '10-06-2026',
        dueDate: '12-06-2026',
        assignedBy: 'Process Audit Manager',
        status: 'In Progress',
        startTime: '09:30',
        endTime: '11:00',
        colorIdx: 0,
    }),
    buildSchedule({
        scheduleId: 'SCH-PA-2026-002',
        auditId: 'AUD-PA-2026-042',
        auditName: 'Employee Onboarding Process',
        department: 'HR',
        frequency: 'Quarterly',
        assignedDate: '12-06-2026',
        dueDate: '14-06-2026',
        assignedBy: 'Joint Director — Audit',
        status: 'Scheduled',
        startTime: '11:00',
        endTime: '12:30',
        colorIdx: 1,
    }),
    buildSchedule({
        scheduleId: 'SCH-PA-2026-003',
        auditId: 'AUD-PA-2026-043',
        auditName: 'Food Safety & Kitchen Hygiene',
        department: 'Canteen',
        frequency: 'Monthly',
        assignedDate: '14-06-2026',
        dueDate: '16-06-2026',
        assignedBy: 'Process Audit Manager',
        status: 'Scheduled',
        startTime: '14:00',
        endTime: '15:30',
        colorIdx: 2,
    }),
    buildSchedule({
        scheduleId: 'SCH-PA-2026-004',
        auditId: 'AUD-PA-2026-044',
        auditName: 'Inventory Control & Stock Reconciliation',
        department: 'Store',
        frequency: 'Quarterly',
        assignedDate: '16-06-2026',
        dueDate: '18-06-2026',
        assignedBy: 'Process Audit Manager',
        status: 'Pending',
        startTime: '10:00',
        endTime: '11:30',
        colorIdx: 3,
    }),
    buildSchedule({
        scheduleId: 'SCH-PA-2026-005',
        auditId: 'AUD-PA-2026-038',
        auditName: 'Fleet Maintenance & Trip Logs',
        department: 'Transport',
        frequency: 'Monthly',
        assignedDate: '18-06-2026',
        dueDate: '20-06-2026',
        assignedBy: 'Joint Director — Audit',
        status: 'Scheduled',
        startTime: '09:00',
        endTime: '10:30',
        colorIdx: 4,
    }),
    buildSchedule({
        scheduleId: 'SCH-PA-2026-006',
        auditId: 'AUD-PA-2026-039',
        auditName: 'Data Backup & Access Control Policy',
        department: 'IT Support',
        frequency: 'Quarterly',
        assignedDate: '20-06-2026',
        dueDate: '22-06-2026',
        assignedBy: 'Process Audit Manager',
        status: 'Scheduled',
        startTime: '15:00',
        endTime: '16:30',
        colorIdx: 0,
    }),
    buildSchedule({
        scheduleId: 'SCH-PA-2026-007',
        auditId: 'AUD-PA-2026-045',
        auditName: 'Classroom Safety & Housekeeping Standards',
        department: 'Housekeeping',
        frequency: 'Monthly',
        assignedDate: '22-06-2026',
        dueDate: '24-06-2026',
        assignedBy: 'Process Audit Manager',
        status: 'Pending',
        startTime: '11:30',
        endTime: '13:00',
        colorIdx: 1,
    }),
    buildSchedule({
        scheduleId: 'SCH-PA-2026-008',
        auditId: 'AUD-PA-2026-046',
        auditName: 'Examination Workflow Compliance',
        department: 'Academic',
        frequency: 'Ad-hoc',
        assignedDate: '24-06-2026',
        dueDate: '26-06-2026',
        assignedBy: 'Joint Director — Audit',
        status: 'Scheduled',
        startTime: '10:30',
        endTime: '12:00',
        colorIdx: 2,
    }),
    buildSchedule({
        scheduleId: 'SCH-PA-REC-WEEK',
        auditId: 'AUD-PA-REC-WEEK',
        auditName: 'Weekly Gate Safety Walk',
        department: 'Security',
        frequency: 'WEEKLY',
        assignedDate: '01-09-2026',
        dueDate: '01-09-2026',
        assignedBy: 'Process Audit Manager',
        status: 'Scheduled',
        colorIdx: 3,
    }),
    buildSchedule({
        scheduleId: 'SCH-PA-REC-MONTH',
        auditId: 'AUD-PA-REC-MONTH',
        auditName: 'Monthly Fee Register Audit',
        department: 'Finance',
        frequency: 'MONTHLY',
        assignedDate: '01-06-2026',
        dueDate: '15-06-2026',
        assignedBy: 'Process Audit Manager',
        status: 'Scheduled',
        colorIdx: 4,
    }),
]

const RECURRENCE_META = {
    'SCH-PA-REC-WEEK': { isRecurring: true, recurrenceType: 'Weekly', dayOfWeek: 1, startDate: '01-09-2026', endDate: '', scheduleKind: 'Recurring' },
    'SCH-PA-REC-MONTH': { isRecurring: true, recurrenceType: 'Monthly', dayOfMonth: 15, startDate: '01-06-2026', endDate: '', scheduleKind: 'Recurring' },
}

const auditIdByName = () =>
    Object.fromEntries(getMyAudits().map((audit) => [audit.auditName, audit.auditId]))

const defaultAuditIdByScheduleId = Object.fromEntries(
    DEFAULT_AUDIT_SCHEDULES.map((item) => [item.scheduleId, item.auditId]),
)

const formatDisplayDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${day}-${month}-${date.getFullYear()}`
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const mostRecentDue = (schedule, today) => {
    const start = schedule.startDate ? startOfDay(parseDisplayDate(schedule.startDate)) : startOfDay(today)
    const end = schedule.endDate ? startOfDay(parseDisplayDate(schedule.endDate)) : null
    let due = null
    if (schedule.recurrenceType === 'Weekly') {
        const day = Number(schedule.dayOfWeek)
        due = startOfDay(today)
        due.setDate(due.getDate() - ((due.getDay() - day + 7) % 7))
    }
    if (schedule.recurrenceType === 'Monthly') {
        const day = Number(schedule.dayOfMonth)
        const year = today.getFullYear()
        const month = today.getMonth()
        due = new Date(year, month, day)
        if (due.getMonth() !== month) due = new Date(year, month + 1, 0)
        if (startOfDay(due) > startOfDay(today)) due = new Date(year, month - 1, day)
    }
    if (!due) return null
    due = startOfDay(due)
    if (due < start || due > startOfDay(today)) return null
    if (end && due > end) return null
    return due
}

export const scheduleKind = (item) => {
    if (item.parentScheduleId) return 'Occurrence'
    if (item.isRecurring) return 'Recurring'
    return 'One-time'
}

const materializeOccurrences = (records) => {
    const today = startOfDay(new Date())
    const additions = []
    records.filter((item) => item.isRecurring).forEach((schedule) => {
        const due = mostRecentDue(schedule, today)
        if (!due) return
        const id = `${schedule.scheduleId}-${toDateKey(due)}`
        if (records.some((item) => item.id === id) || additions.some((item) => item.id === id)) return
        const display = formatDisplayDate(due)
        additions.push({
            ...schedule,
            id,
            scheduleId: id,
            parentScheduleId: schedule.scheduleId,
            isRecurring: false,
            assignedDate: display,
            dueDate: display,
            status: 'Scheduled',
        })
    })
    return additions.length ? [...records, ...additions] : records
}

export const migrateSchedules = (records) => {
    const byName = auditIdByName()
    return records.map((item) => ({
        ...RECURRENCE_META[item.scheduleId],
        ...item,
        auditId: item.auditId ?? byName[item.auditName] ?? defaultAuditIdByScheduleId[item.scheduleId] ?? '',
        isRecurring: item.isRecurring ?? RECURRENCE_META[item.scheduleId]?.isRecurring ?? false,
    }))
}

export const saveAuditSchedules = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const addAuditSchedule = (payload) => {
    const current = getAuditSchedules().filter((item) => !item.parentScheduleId)
    const scheduleId = `SCH-PA-${Date.now()}`
    const record = buildSchedule({
        scheduleId,
        auditId: payload.auditId || `AUD-${Date.now()}`,
        auditName: payload.auditName,
        department: payload.department || 'Academic',
        frequency: payload.recurrenceType === 'Weekly' ? 'WEEKLY' : payload.recurrenceType === 'Monthly' ? 'MONTHLY' : 'Ad-hoc',
        assignedDate: payload.startDate,
        dueDate: payload.startDate,
        assignedBy: payload.assignedBy || 'Process Audit Manager',
        status: 'Scheduled',
    })
    const next = [...current, {
        ...record,
        isRecurring: payload.isRecurring,
        recurrenceType: payload.isRecurring ? payload.recurrenceType : '',
        dayOfWeek: payload.dayOfWeek,
        dayOfMonth: payload.dayOfMonth,
        startDate: payload.startDate,
        endDate: payload.endDate || '',
    }]
    const materialized = materializeOccurrences(next)
    saveAuditSchedules(materialized)
    return materialized
}

export const getAuditSchedules = () => {
    let records = DEFAULT_AUDIT_SCHEDULES
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) records = JSON.parse(stored)
    } catch {
        records = DEFAULT_AUDIT_SCHEDULES
    }
    records = migrateSchedules(records)
    const ids = new Set(records.map((item) => item.scheduleId))
    const missing = DEFAULT_AUDIT_SCHEDULES.filter((item) => !ids.has(item.scheduleId))
    if (missing.length) records = [...records, ...missing]
    records = migrateSchedules(records)
    const materialized = materializeOccurrences(records)
    if (materialized.length !== records.length || missing.length) saveAuditSchedules(materialized)
    return materialized
}

export const schedulesToCalendarEvents = (schedules) =>
    schedules.map((item) => ({
        id: item.id,
        title: item.auditName,
        description: `${item.auditId} · ${item.scheduleId} · Due ${item.dueDate}`,
        date: toDateKey(parseDisplayDate(item.assignedDate)),
        startTime: item.startTime,
        endTime: item.endTime,
        colorIdx: item.colorIdx ?? 0,
    }))

export const buildSeedCalendarEvents = () => {
    const today = new Date()
    const todayKey = toDateKey(today)
    const events = schedulesToCalendarEvents(getAuditSchedules())

    if (!events.some((event) => event.date === todayKey)) {
        events.unshift({
            id: generateId(),
            title: 'Finance Process Walkthrough',
            description: 'SCH-PA-2026-000 · Finance · Due today',
            date: todayKey,
            startTime: '09:00',
            endTime: '10:00',
            colorIdx: 0,
        })
    }

    events.push({
        id: generateId(),
        title: 'Transport Compliance Review',
        description: 'SCH-PA-2026-009 · Transport · Due next week',
        date: toDateKey(addDays(today, 7)),
        startTime: '14:00',
        endTime: '15:30',
        colorIdx: 3,
    })

    return events
}
