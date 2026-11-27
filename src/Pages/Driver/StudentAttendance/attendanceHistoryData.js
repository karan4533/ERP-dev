import { getAttendanceMarks, hydrateTransportStudentAttendanceFromApi } from './studentAttendanceData'

export const HISTORY_PERIODS = ['Morning', 'Evening']
export const HISTORY_PHASES = ['Pickup', 'Drop']
export const MARKED_STATUSES = ['Present', 'Absent']

export const markedStatusBadgeColor = {
    Present: 'bg-[#4CAF501A] text-[#4CAF50]',
    Absent: 'bg-[#FF57221A] text-[#FF5722]',
}

const parseAttendanceDate = (value) => {
    const [day, month, year] = String(value || '').split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export function getAttendanceHistory() {
    return getAttendanceMarks()
        .filter((row) => ['Present', 'Absent'].includes(String(row.status || '')))
        .slice()
        .sort((a, b) => {
            const da = parseAttendanceDate(a.attendanceDate)?.getTime() || 0
            const db = parseAttendanceDate(b.attendanceDate)?.getTime() || 0
            if (db !== da) return db - da
            return String(b.markedAt || '').localeCompare(String(a.markedAt || ''))
        })
}

export function hydrateAttendanceHistoryFromApi() {
    return hydrateTransportStudentAttendanceFromApi()
}

/** @deprecated Prefer getAttendanceHistory() after hydrate */
export const ATTENDANCE_HISTORY = []

export const filterAttendanceHistory = ({
    records,
    search = '',
    period = '',
    phase = '',
    status = '',
    fromDate = null,
    toDate = null,
    timeframe = '',
}) => {
    const now = new Date()
    let rangeFrom = fromDate
    let rangeTo = toDate
    if (timeframe === 'week' && !fromDate && !toDate) {
        rangeFrom = new Date(now)
        rangeFrom.setDate(now.getDate() - 7)
        rangeTo = now
    }
    if (timeframe === 'month' && !fromDate && !toDate) {
        rangeFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        rangeTo = now
    }

    return (Array.isArray(records) ? records : []).filter((record) => {
        const query = search.trim().toLowerCase()
        const matchesSearch = !query || [
            record.studentId,
            record.studentName,
            record.classSection,
            record.busStop,
            record.location,
        ].some((field) => String(field || '').toLowerCase().includes(query))

        const matchesPeriod = !period || record.period === period
        const matchesPhase = !phase || String(record.phase || '').toLowerCase() === String(phase).toLowerCase()
        const matchesStatus = !status || record.status === status

        const attendanceDate = parseAttendanceDate(record.attendanceDate)
        const matchesFrom = !rangeFrom || (attendanceDate && attendanceDate >= rangeFrom)
        const matchesTo = !rangeTo || (attendanceDate && attendanceDate <= rangeTo)

        return matchesSearch && matchesPeriod && matchesPhase && matchesStatus && matchesFrom && matchesTo
    })
}
