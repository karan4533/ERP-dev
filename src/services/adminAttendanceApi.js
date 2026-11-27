import { apiRequest, getAccessToken, isApiAdminAttendanceEnabled } from './apiClient'
import { listAttendanceApi } from './attendanceApi'
import { listStudentsApi } from './studentsApi'

/** True when the Administrator attendance lists should read the server (flag on + real session). */
export const canUseAdminAttendanceApi = () => isApiAdminAttendanceEnabled() && Boolean(getAccessToken())

const DASH = '—'
const NOT_MARKED = 'Not marked'

const pad = (value) => String(value).padStart(2, '0')

/** Local calendar date as YYYY-MM-DD (never toISOString: that shifts the day for users east of UTC). */
export const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/**
 * HR attendance rows were written in two date formats (dd-mm-yyyy by the HR screens, ISO by
 * others). Returns YYYY-MM-DD, or '' when the value is not a recognised date.
 */
export const normalizeAttendanceDate = (value) => {
    const text = String(value ?? '').trim()
    let match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
    if (match) return `${match[1]}-${match[2]}-${match[3]}`
    match = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text)
    if (match) return `${match[3]}-${pad(match[2])}-${pad(match[1])}`
    return ''
}

const clockOrDash = (value) => {
    const text = String(value ?? '').trim()
    return /\d/.test(text) ? text : DASH // HR stores "—" (sometimes mis-encoded) when nobody punched
}

const timeOfDay = (iso) => {
    const parsed = iso ? new Date(iso) : null
    if (!parsed || Number.isNaN(parsed.getTime())) return DASH
    return parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const byNumberedName = (a, b) => a.localeCompare(b, undefined, { numeric: true })
const uniqueSorted = (values) => [...new Set(values.map((v) => String(v ?? '').trim()).filter(Boolean))].sort(byNumberedName)
const failure = (result) => (result.status === 'rejected' ? result.reason?.message || 'Request failed.' : '')

/**
 * Student attendance for one date. With a class (and no section) the roster is requested, so
 * students nobody marked yet appear as "Not marked". With a section the API only returns marked
 * students (its roster does not know a student's section), so the roster is not used then.
 *
 * Class and section choices come from the masters API and the enrolled students; if either list
 * fails the attendance is still shown with a warning.
 */
export const loadStudentAttendance = async ({ date, className = '', section = '' }) => {
    const roster = Boolean(className) && !section
    const [marks, classes, sections, students] = await Promise.all([
        listAttendanceApi({ date, className, section, roster }),
        ...[
            apiRequest('/masters/classes'),
            apiRequest('/masters/sections'),
            listStudentsApi(),
        ].map((request) => request.then((value) => ({ status: 'fulfilled', value }), (reason) => ({ status: 'rejected', reason }))),
    ])

    const warnings = []
    if (classes.status === 'rejected') warnings.push(`The class list could not be loaded (${failure(classes)}).`)
    if (sections.status === 'rejected') warnings.push(`The section list could not be loaded (${failure(sections)}).`)

    const records = marks.map((row) => {
        const status = row.attendanceStatus || NOT_MARKED
        return {
            id: `${row.studentId}:${row.date}`,
            studentId: String(row.studentId),
            admissionNo: row.admissionNumber || DASH,
            studentName: row.studentName || DASH,
            className: row.className || DASH,
            section: row.section || DASH,
            markedAt: row.attendanceStatus ? timeOfDay(row.time) : DASH,
            inOut: row.inOutStatus || DASH,
            status,
        }
    })

    const masterClasses = classes.status === 'fulfilled' ? classes.value.map((item) => item.name) : []
    const masterSections = sections.status === 'fulfilled' ? sections.value.map((item) => item.name) : []
    const studentClasses = students.status === 'fulfilled' ? students.value.map((item) => item.className) : []
    return {
        records,
        warnings,
        classOptions: uniqueSorted([...masterClasses, ...studentClasses, ...marks.map((row) => row.className)]),
        sectionOptions: uniqueSorted([...masterSections, ...marks.map((row) => row.section)]),
    }
}

/**
 * Employee attendance: the HR attendance collection joined to HR employees by employee id. The
 * collection has no date filter, so every record is returned and the screen filters by date.
 * Names and roles are optional: without the employee list the IDs are still shown, with a warning.
 */
export const loadEmployeeAttendance = async () => {
    const [attendance, employees] = await Promise.allSettled([
        apiRequest('/hr/attendance'),
        apiRequest('/hr/portal/employees'),
    ])
    if (attendance.status === 'rejected') throw attendance.reason

    const warnings = []
    if (employees.status === 'rejected') {
        warnings.push(`Employee names and roles could not be loaded (${failure(employees)}); employee IDs are shown instead.`)
    }
    const byId = new Map(
        (employees.status === 'fulfilled' ? employees.value : []).map((item) => [String(item.id), item]),
    )

    const records = (Array.isArray(attendance.value) ? attendance.value : []).map((item, index) => {
        const employee = byId.get(String(item.employeeId))
        return {
            id: String(item.id ?? `row-${index}`),
            employeeId: String(item.employeeId || DASH),
            employeeName: employee?.name || DASH,
            role: employee?.role || employee?.designation || DASH,
            date: normalizeAttendanceDate(item.date),
            punchInTime: clockOrDash(item.punchIn) !== DASH ? clockOrDash(item.punchIn) : clockOrDash(item.checkIn),
            punchOutTime: clockOrDash(item.punchOut) !== DASH ? clockOrDash(item.punchOut) : clockOrDash(item.checkOut),
            status: String(item.status || DASH),
            source: String(item.source || ''),
        }
    })
    return {
        records,
        warnings,
        roleOptions: uniqueSorted(records.map((record) => (record.role === DASH ? '' : record.role))),
        statusOptions: uniqueSorted(records.map((record) => (record.status === DASH ? '' : record.status))),
        dailyTrend: buildDailyTrendFromRecords(records),
    }
}

const shiftIsoDate = (iso, deltaDays) => {
    const [y, m, d] = iso.split('-').map(Number)
    const date = new Date(y, m - 1, d + deltaDays)
    return toIsoDate(date)
}

const isPresentLike = (status) => /^(present|late)$/i.test(String(status || '').trim())

/** Build last-N-day present rate from records that already carry a `date` field. */
const buildDailyTrendFromRecords = (records, days = 7) => {
    const today = toIsoDate(new Date())
    const labels = []
    const rates = []
    for (let i = days - 1; i >= 0; i -= 1) {
        const iso = shiftIsoDate(today, -i)
        labels.push(iso.slice(5)) // MM-DD
        const dayRows = records.filter((row) => row.date === iso)
        if (!dayRows.length) {
            rates.push(null)
            continue
        }
        const present = dayRows.filter((row) => isPresentLike(row.status)).length
        rates.push(Math.round((present / dayRows.length) * 100))
    }
    return { labels, rates }
}

/**
 * Probe recent calendar days for any student marks (campus-wide). Used so Super Admin opens on a
 * day that has data instead of an empty "today" table when teachers have not marked yet.
 */
export const findLatestStudentAttendanceDate = async ({ lookback = 21 } = {}) => {
    const today = toIsoDate(new Date())
    for (let i = 0; i < lookback; i += 1) {
        const iso = shiftIsoDate(today, -i)
        const rows = await listAttendanceApi({ date: iso })
        if (Array.isArray(rows) && rows.length) return iso
    }
    return today
}

/**
 * Last `days` of campus-wide student attendance rates for overview charts (honest nulls when empty).
 */
export const loadStudentAttendanceDailyTrend = async ({ days = 7 } = {}) => {
    const today = toIsoDate(new Date())
    const dates = Array.from({ length: days }, (_, i) => shiftIsoDate(today, -(days - 1 - i)))
    const settled = await Promise.allSettled(dates.map((date) => listAttendanceApi({ date })))
    const labels = []
    const rates = []
    settled.forEach((result, index) => {
        labels.push(dates[index].slice(5))
        if (result.status !== 'fulfilled' || !Array.isArray(result.value) || !result.value.length) {
            rates.push(null)
            return
        }
        const present = result.value.filter((row) => isPresentLike(row.attendanceStatus || row.status)).length
        rates.push(Math.round((present / result.value.length) * 100))
    })
    return { labels, rates }
}
