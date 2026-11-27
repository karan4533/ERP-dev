import { hydrateCampusKey, loadCampusJson, persistCampusJson, usesCampusApiForKey } from '../../../services/campusJsonStore'
import {
    getStudentTransports,
    hydrateStudentTransportsFromApi,
} from '../../TransportManager/StudentTransport/studentTransportData'
import { getDuties, hydrateDutiesFromApi } from '../../TransportManager/AssignDuty/assignDutyData'
import { getDrivers, hydrateDriversFromApi } from '../../TransportManager/DriverManagement/driverManagementData'
import { isDutyDateToday, isDutyTrackingActive } from '../../../Common/Transport/activeDutyTracking'

export const SCHOOL_NAME = 'Queen Mira International School'

export const ATTENDANCE_PERIODS = ['Morning', 'Evening']

export const ATTENDANCE_PHASES = {
    Morning: [
        {
            key: 'pickup',
            label: 'Pickup',
            subtitle: "Mark pickup at student's bus stop",
            locationType: 'busStop',
        },
        {
            key: 'drop',
            label: 'Drop',
            subtitle: `Mark drop at ${SCHOOL_NAME}`,
            locationType: 'school',
        },
    ],
    Evening: [
        {
            key: 'pickup',
            label: 'Pickup',
            subtitle: `Mark pickup at ${SCHOOL_NAME}`,
            locationType: 'school',
        },
        {
            key: 'drop',
            label: 'Drop',
            subtitle: "Mark drop at student's bus stop",
            locationType: 'busStop',
        },
    ],
}

export const ATTENDANCE_STATUSES = ['Pending', 'Present', 'Absent']

export const STUDENT_ATTENDANCE_STORAGE_KEY = 'schoolerp-transport-student-attendance-v1'

const plateKey = (value) => String(value || '').replace(/[\s-]/g, '').toUpperCase()

const formatAttendanceDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}-${mm}-${yyyy}`
}

const formatMarkedAt = (date = new Date()) => date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
})

const emptyPhases = () => ({
    morning: { pickup: 'Pending', drop: 'Pending' },
    evening: { pickup: 'Pending', drop: 'Pending' },
})

const enrollmentToRosterRow = (row) => ({
    id: String(row.id || row.studentId || row.admissionNumber || ''),
    studentId: String(row.admissionNumber || row.studentId || row.id || ''),
    studentName: String(row.studentName || row.name || 'Student'),
    classSection: String(row.classSection || row.className || '—'),
    busStop: String(row.startLocation || row.pickupPoint || row.stopName || '—'),
    routeName: String(row.routeName || ''),
    vehicleNumber: String(row.vehicleNumber || ''),
    profileImage: row.profileImage || null,
    ...emptyPhases(),
})

/** Marks saved as history rows in campus ops collection. */
export function getAttendanceMarks() {
    const rows = loadCampusJson(STUDENT_ATTENDANCE_STORAGE_KEY, [])
    // Support legacy seed shape (student roster with morning/evening).
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.morning) {
        return []
    }
    return Array.isArray(rows) ? rows : []
}

export function saveAttendanceMarks(rows) {
    return persistCampusJson(STUDENT_ATTENDANCE_STORAGE_KEY, rows)
}

export async function hydrateTransportStudentAttendanceFromApi() {
    await Promise.all([
        hydrateStudentTransportsFromApi(),
        hydrateDutiesFromApi(),
        hydrateDriversFromApi(),
        usesCampusApiForKey(STUDENT_ATTENDANCE_STORAGE_KEY)
            ? hydrateCampusKey(STUDENT_ATTENDANCE_STORAGE_KEY, [])
            : Promise.resolve(false),
    ])
    return true
}

export function resolveDriverTripContext(userEmail = '') {
    const email = String(userEmail || '').trim().toLowerCase()
    const drivers = getDrivers()
    const profile = drivers.find((row) => String(row.email || '').trim().toLowerCase() === email) || null
    const duties = getDuties().filter((duty) => {
        if (!isDutyDateToday(duty.dutyDate || duty.date)) return false
        if (!isDutyTrackingActive(duty) && !['Assigned', 'In Progress', 'Completed'].includes(String(duty.dutyStatus || duty.status || ''))) {
            return false
        }
        if (email && String(duty.driverEmail || '').trim().toLowerCase() === email) return true
        if (profile?.vehicleNumber && plateKey(duty.vehicleNumber) === plateKey(profile.vehicleNumber)) return true
        if (profile?.driverName && String(duty.driverName || '') === String(profile.driverName || profile.name || '')) return true
        return false
    })
    const active = duties.find((d) => isDutyTrackingActive(d)) || duties[0] || null
    return {
        driver: profile,
        duty: active,
        routeName: active?.routeName || profile?.routeAssigned || profile?.routeName || '',
        vehicleNumber: active?.vehicleNumber || profile?.vehicleNumber || '',
    }
}

export function buildAttendanceRoster({ routeName = '', vehicleNumber = '' } = {}) {
    const enrollments = getStudentTransports()
    const wantRoute = String(routeName || '').trim().toLowerCase()
    const wantPlate = plateKey(vehicleNumber)
    const filtered = enrollments.filter((row) => {
        const sameRoute = wantRoute
            && String(row.routeName || '').trim().toLowerCase() === wantRoute
        const sameVehicle = wantPlate
            && plateKey(row.vehicleNumber) === wantPlate
        if (wantRoute || wantPlate) return sameRoute || sameVehicle
        return true
    })
    const source = filtered.length > 0 ? filtered : enrollments
    return source.map(enrollmentToRosterRow).filter((row) => row.id)
}

export function applyMarksToRoster(roster, marks, attendanceDate) {
    const dateKey = typeof attendanceDate === 'string'
        ? attendanceDate
        : formatAttendanceDate(attendanceDate)
    const todays = (Array.isArray(marks) ? marks : []).filter((row) => (
        String(row.attendanceDate || '') === dateKey
    ))
    return roster.map((student) => {
        const next = {
            ...student,
            morning: { ...(student.morning || emptyPhases().morning) },
            evening: { ...(student.evening || emptyPhases().evening) },
        }
        todays.forEach((mark) => {
            const sameStudent = String(mark.studentId || '') === String(student.studentId)
                || String(mark.rosterId || '') === String(student.id)
            if (!sameStudent) return
            const period = String(mark.period || '').toLowerCase()
            const phase = String(mark.phase || '').toLowerCase()
            if ((period === 'morning' || period === 'evening') && (phase === 'pickup' || phase === 'drop')) {
                next[period] = {
                    ...next[period],
                    [phase]: mark.status || 'Pending',
                }
            }
        })
        return next
    })
}

export async function markStudentAttendance({
    student,
    attendanceDate,
    period,
    phase,
    status,
    routeName,
    vehicleNumber,
}) {
    const dateKey = formatAttendanceDate(attendanceDate)
    const periodLabel = period === 'Evening' ? 'Evening' : 'Morning'
    const phaseLabel = phase === 'drop' ? 'Drop' : 'Pickup'
    const location = getAttendanceLocation(student, periodLabel, phase)
    const marks = getAttendanceMarks()
    const existingIdx = marks.findIndex((row) => (
        String(row.attendanceDate) === dateKey
        && String(row.studentId) === String(student.studentId)
        && String(row.period) === periodLabel
        && String(row.phase).toLowerCase() === phaseLabel.toLowerCase()
    ))
    const entry = {
        id: existingIdx >= 0 ? marks[existingIdx].id : `AH-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        attendanceDate: dateKey,
        studentId: student.studentId,
        rosterId: student.id,
        studentName: student.studentName,
        classSection: student.classSection,
        busStop: student.busStop,
        period: periodLabel,
        phase: phaseLabel,
        location,
        status,
        markedAt: formatMarkedAt(),
        routeName: routeName || student.routeName || '',
        vehicleNumber: vehicleNumber || student.vehicleNumber || '',
    }
    const next = existingIdx >= 0
        ? marks.map((row, i) => (i === existingIdx ? entry : row))
        : [...marks, entry]
    const result = await saveAttendanceMarks(next)
    return { ...result, record: entry, marks: next }
}

export const statusStyles = {
    Present: 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]',
    Absent: 'bg-[#FFEBEE] text-[#C62828] border-[#EF9A9A]',
    Pending: 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]',
}

export const filterStudents = (records, search = '') => {
    const query = search.trim().toLowerCase()
    if (!query) return records
    return records.filter((record) => [
        record.studentId,
        record.studentName,
        record.classSection,
        record.busStop,
    ].some((field) => String(field || '').toLowerCase().includes(query)))
}

export const getPhaseStats = (records, period, phase) => {
    const values = records.map((record) => record[period.toLowerCase()]?.[phase] ?? 'Pending')
    return {
        total: records.length,
        present: values.filter((value) => value === 'Present').length,
        absent: values.filter((value) => value === 'Absent').length,
        pending: values.filter((value) => value === 'Pending').length,
    }
}

export const getAttendanceLocation = (record, period, phase) => {
    const phaseConfig = ATTENDANCE_PHASES[period]?.find((item) => item.key === phase)
    if (phaseConfig?.locationType === 'school') return SCHOOL_NAME
    return record.busStop
}

export const getLocationColumnLabel = (period, phase) => {
    const phaseConfig = ATTENDANCE_PHASES[period]?.find((item) => item.key === phase)
    return phaseConfig?.locationType === 'school' ? 'School' : 'Bus Stop'
}

/** Roster for the daily marking UI (enrollments + today's marks). */
export function getTransportStudentAttendance(context = {}) {
    const roster = buildAttendanceRoster(context)
    return applyMarksToRoster(roster, getAttendanceMarks(), new Date())
}

export function saveTransportStudentAttendance(rows) {
    return saveAttendanceMarks(rows)
}

export const STUDENT_ATTENDANCE = []
