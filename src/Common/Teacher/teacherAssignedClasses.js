import { getAssignmentsForTeacher } from '../RBAC/academicsCatalogData'
import { getActiveCreatedUserSession } from '../RBAC/createdUsersData'
import {
    getAllocationByEmployeeId,
    getAllocations,
    hydrateTeacherAllocationsFromApi,
    TEACHER_ALLOCATIONS_UPDATED_EVENT,
} from '../../Pages/Principal/TeacherAllocation/teacherAllocationData'
import {
    getClassTimetables,
    hydrateClassTimetablesFromApi,
    slotStartMinutes,
    CLASS_TIMETABLES_UPDATED_EVENT,
} from '../../Pages/Principal/ClassTimetable/classTimetableData'
import { apiRequest, getAccessToken, isApiAuthEnabled } from '../../services/apiClient'
import { canUseAcademicsApi } from '../../services/academicsApi'

export const TEACHER_ASSIGNMENTS_UPDATED_EVENT = 'schoolerp-teacher-assignments-updated'

let cachedSelf = null
let hydratePromise = null

const emitUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(TEACHER_ASSIGNMENTS_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

/** Normalize "Grade 10" / "10" / "10-A" style labels for comparison. */
export const normalizeClassKey = (value) => {
    const text = String(value || '')
        .trim()
        .replace(/^class\s+/i, '')
        .replace(/\s+/g, ' ')
    if (!text || text === '—') return ''
    const gradeMatch = text.match(/^grade\s*(\d+[A-Z]?)$/i)
    if (gradeMatch) return `grade ${gradeMatch[1].toLowerCase()}`
    const bare = text.match(/^(\d+[A-Z]?)$/i)
    if (bare) return `grade ${bare[1].toLowerCase()}`
    return text.toLowerCase()
}

export const normalizeSectionKey = (value) => String(value || '').trim().toUpperCase()

export const classKeysMatch = (a, b) => {
    const left = normalizeClassKey(a)
    const right = normalizeClassKey(b)
    return Boolean(left && right && left === right)
}

/**
 * Resolve the logged-in staff HR employee code (allocation / timetable key).
 * Always match by session email — never take list[0] (coordinators with
 * hr.employees.read receive the full campus roster).
 * @param {{ email?: string, name?: string }} [hint]
 */
export const resolveOwnTeacherProfile = async (hint = {}) => {
    const session = getActiveCreatedUserSession()
    const sessionEmail = String(hint.email || session?.email || '').trim().toLowerCase()
    const sessionName = String(hint.name || session?.name || '').trim()

    if (
        cachedSelf
        && sessionEmail
        && String(cachedSelf.email || '').toLowerCase() === sessionEmail
    ) {
        return cachedSelf
    }
    if (cachedSelf && !sessionEmail) return cachedSelf

    if (!isApiAuthEnabled() || !getAccessToken()) {
        cachedSelf = {
            employeeId: session?.staffCode || session?.employeeId || '',
            name: sessionName,
            email: sessionEmail,
            source: 'session',
        }
        return cachedSelf
    }
    try {
        const rows = await apiRequest('/hr/portal/employees')
        const list = Array.isArray(rows) ? rows : []
        const own = sessionEmail
            ? list.find((row) => String(row.email || '').trim().toLowerCase() === sessionEmail)
            : null
        if (own) {
            cachedSelf = {
                employeeId: String(own.id || own.employeeId || '').trim(),
                name: String(own.name || sessionName).trim(),
                email: String(own.email || sessionEmail).trim().toLowerCase(),
                source: 'hr',
            }
            return cachedSelf
        }
        // hr.self-only responses may return a single own row
        if (list.length === 1) {
            const only = list[0]
            const onlyEmail = String(only.email || '').trim().toLowerCase()
            if (!sessionEmail || !onlyEmail || onlyEmail === sessionEmail) {
                cachedSelf = {
                    employeeId: String(only.id || only.employeeId || '').trim(),
                    name: String(only.name || sessionName).trim(),
                    email: onlyEmail || sessionEmail,
                    source: 'hr',
                }
                return cachedSelf
            }
        }
    } catch {
        /* fall through */
    }
    cachedSelf = {
        employeeId: session?.staffCode || session?.employeeId || '',
        name: sessionName,
        email: sessionEmail,
        source: 'session',
    }
    return cachedSelf
}

export const clearTeacherAssignmentCache = () => {
    cachedSelf = null
    hydratePromise = null
}

export const getCachedTeacherProfile = () => cachedSelf

const rowsFromAllocation = (allocation) => {
    if (!allocation || allocation.status === 'Not Allocated') return []
    const rows = []
    const seen = new Set()
    const pushRow = (row) => {
        const className = String(row.className || '').trim()
        if (!className) return
        const section = String(row.section || '').trim()
        const key = `${normalizeClassKey(className)}|${normalizeSectionKey(section)}`
        if (seen.has(key)) return
        seen.add(key)
        rows.push({
            className,
            section,
            subject: String(row.subject || '').trim(),
            isClassTeacher: Boolean(row.isClassTeacher),
            source: 'allocation',
        })
    }

    const classTeacher = allocation.classTeacher
    if (classTeacher?.className) {
        pushRow({
            className: classTeacher.className,
            section: classTeacher.section || '',
            subject: '',
            isClassTeacher: true,
        })
    }

    const mappedClassKeys = new Set()
    ;(allocation.mappings || []).forEach((row) => {
        if (!row?.className) return
        mappedClassKeys.add(normalizeClassKey(row.className))
        pushRow({
            className: row.className,
            section: row.section || '',
            subject: row.subject || '',
            isClassTeacher: Boolean(
                classTeacher &&
                    classKeysMatch(classTeacher.className, row.className) &&
                    (!classTeacher.section
                        || normalizeSectionKey(classTeacher.section) === normalizeSectionKey(row.section)),
            ),
        })
    })

    // teachingClasses has no section — do not expand to every section when mappings /
    // class-teacher already pin Grade X-A (that was why Grade 6-B appeared for a 6-A teacher).
    const teaching = Array.isArray(allocation.teachingClasses) ? allocation.teachingClasses : []
    const subjects = Array.isArray(allocation.subjects) ? allocation.subjects : []
    teaching.forEach((className) => {
        const key = normalizeClassKey(className)
        if (!key) return
        if (mappedClassKeys.has(key)) return
        if (classTeacher && classKeysMatch(classTeacher.className, className)) return
        pushRow({
            className,
            section: '',
            subject: subjects[0] || '',
            isClassTeacher: false,
        })
    })

    return rows
}

const rowsFromRbac = (email) =>
    getAssignmentsForTeacher(email).map((item) => ({
        className: String(item.className || '').trim(),
        section: String(item.section || '').trim(),
        subject: String(item.subject || '').trim(),
        isClassTeacher: String(item.classTeacher || '').toLowerCase() === 'yes',
        source: 'rbac',
    }))

/**
 * Find allocation for this teacher: by employeeId, else match name on any allocation
 * that was saved with a seed TEA-* id while the teacher has EMP-*.
 */
const findAllocationForTeacher = (profile) => {
    if (profile.employeeId) {
        const direct = getAllocationByEmployeeId(profile.employeeId)
        if (direct) return direct
    }
    const name = String(profile.name || '').trim().toLowerCase()
    if (!name) return null
    // Allocations don't store teacher name — only employeeId. Prefer directory match via id.
    return null
}

/** Assignment rows for the current teacher (allocation preferred, RBAC fallback). */
export const getTeacherAssignmentRows = (email = '') => {
    const profile = cachedSelf || {
        employeeId: '',
        name: '',
        email: String(email || '').toLowerCase(),
    }
    const allocation = findAllocationForTeacher(profile)
    const fromAlloc = rowsFromAllocation(allocation)
    if (fromAlloc.length) return fromAlloc

    // If employeeId is set but allocation missing, still try scanning all allocations
    // (campus list is readable with academics.read) in case id casing differs.
    if (profile.employeeId) {
        const match = getAllocations().find(
            (item) => String(item.employeeId).toLowerCase() === String(profile.employeeId).toLowerCase(),
        )
        const rows = rowsFromAllocation(match)
        if (rows.length) return rows
    }

    return rowsFromRbac(profile.email || email)
}

export const getTeacherClassOptions = (email = '') => {
    const classes = [
        ...new Set(getTeacherAssignmentRows(email).map((row) => row.className).filter(Boolean)),
    ]
    return classes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

export const getTeacherSectionOptions = (email = '', className = '') => {
    const rows = getTeacherAssignmentRows(email).filter(
        (row) => !className || classKeysMatch(row.className, className),
    )
    const sections = [...new Set(rows.map((row) => row.section).filter(Boolean))]
    return sections.sort()
}

/** Unique "Class-Section" labels from the teacher's current allocations. */
export const getTeacherClassSectionOptions = (email = '') => {
    const options = []
    const seen = new Set()
    getTeacherAssignmentRows(email).forEach((row) => {
        const className = String(row.className || '').trim()
        if (!className) return
        const section = String(row.section || '').trim()
        const label = section ? `${className}-${section}` : className
        const key = label.toLowerCase()
        if (seen.has(key)) return
        seen.add(key)
        options.push(label)
    })
    return options.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

/**
 * Match a student/rating against a Class & Section filter value like "Grade 1-A" or "Grade 1".
 * Uses normalized class/section keys so "1-A" and "Grade 1-A" both match.
 */
export const matchesClassSectionFilter = (entity, classSectionFilter) => {
    if (!classSectionFilter) return true
    const filter = String(classSectionFilter).trim()
    if (!filter) return true

    const className = entity.className || entity.class || entity.grade || ''
    const section = entity.section
        || (entity.classSection && entity.classSection !== className
            ? String(entity.classSection).split('-').pop()
            : '')
        || ''
    const entityLabel = section ? `${className}-${section}` : className

    if (entity.classSection && String(entity.classSection).toLowerCase() === filter.toLowerCase()) {
        return true
    }
    if (entityLabel.toLowerCase() === filter.toLowerCase()) return true

    // "Grade 1-A" → class "Grade 1", section "A"
    const dashed = filter.match(/^(.*)-([A-Za-z0-9]+)$/)
    if (dashed) {
        const [, filterClass, filterSection] = dashed
        if (!classKeysMatch(className, filterClass)) return false
        if (!section) return true
        return normalizeSectionKey(section) === normalizeSectionKey(filterSection)
    }

    return classKeysMatch(className, filter)
}

export const getTeacherSubjectOptions = (email = '') => {
    const subjects = [
        ...new Set(getTeacherAssignmentRows(email).map((row) => row.subject).filter(Boolean)),
    ]
    return subjects.sort((a, b) => a.localeCompare(b))
}

const studentSectionKey = (student) => {
    const direct = String(student.section || '').trim()
    if (direct && direct !== '—' && direct !== '-' && direct.toLowerCase() !== 'all') {
        return normalizeSectionKey(direct)
    }
    const className = String(student.className || student.class || student.class_name || '').trim()
    const classSection = String(student.classSection || student.class_section || '').trim()
    if (classSection && className && classSection !== className) {
        const dashed = classSection.match(/-([A-Za-z0-9]+)$/)
        if (dashed) return normalizeSectionKey(dashed[1])
    }
    return ''
}

export const studentInTeacherScope = (student, email = '') => {
    const assignments = getTeacherAssignmentRows(email)
    if (!assignments.length) return false
    const className = student.className || student.class || student.class_name
    const studentSection = studentSectionKey(student)

    const classRows = assignments.filter((row) => classKeysMatch(row.className, className))
    if (!classRows.length) return false

    const sectionPinned = classRows.filter((row) => row.section)
    const rows = sectionPinned.length ? sectionPinned : classRows

    return rows.some((row) => {
        if (!row.section) return true
        if (!studentSection) {
            // Unplaced students: only class-teacher of that pinned section may see them.
            return Boolean(row.isClassTeacher)
        }
        return normalizeSectionKey(row.section) === studentSection
    })
}

/** Build weekly schedule cells from Principal class timetables for this teacher's name. */
export const getTeacherWeeklyScheduleFromTimetables = (teacherName = '', teacherEmployeeId = '') => {
    const name = String(teacherName || cachedSelf?.name || '').trim().toLowerCase()
    const employeeId = String(teacherEmployeeId || cachedSelf?.employeeId || '').trim().toLowerCase()
    const email = String(cachedSelf?.email || '').trim().toLowerCase()
    const timetables = getClassTimetables().filter(
        (item) => !item.approvalStatus || item.approvalStatus === 'Approved' || item.approvalStatus === 'Pending',
    )
    const schedule = {}
    const timeSlots = new Map()
    const days = new Set()

    const lower = (value) => String(value || '').trim().toLowerCase()

    // Email settles identity when both sides have one (two staff can share a name). Employee ids only
    // count when they match: older timetables hold seed TEA-* ids while HR now returns EMP-* codes.
    const ownsTimetable = (tt) => {
        const ownerId = lower(tt.ownerTeacherId)
        const ownerEmail = lower(tt.ownerTeacherEmail)
        if (employeeId && ownerId && ownerId === employeeId) return true
        if (email && ownerEmail) return ownerEmail === email
        return Boolean(name && lower(tt.ownerTeacherName) === name)
    }

    const periodIsMine = (row, tt, ownedByTeacher) => {
        const rowId = lower(row.teacherId || row.employeeId)
        if (employeeId && rowId && rowId === employeeId) return true
        const rowEmail = lower(row.teacherEmail)
        if (email && rowEmail) return rowEmail === email
        const rowName = lower(row.teacher)
        if (ownedByTeacher) {
            // A period in my timetable that was handed to someone else by name is theirs.
            return !rowName || rowName === name || rowName === lower(tt.ownerTeacherName)
        }
        return Boolean(name && rowName && rowName === name)
    }

    timetables.forEach((tt) => {
        const ownedByTeacher = ownsTimetable(tt)
        const pending = tt.approvalStatus === 'Pending'
        ;(tt.timelines || []).forEach((row) => {
            if (!periodIsMine(row, tt, ownedByTeacher)) return
            if (!row.day || !row.startTime || !row.endTime || !row.subject) return
            const label = `${row.startTime} - ${row.endTime}`
            if (!timeSlots.has(label)) {
                timeSlots.set(label, {
                    label,
                    time: `${row.startTime} -\n${row.endTime}`,
                    start: slotStartMinutes(row.startTime),
                })
            }
            days.add(row.day)
            if (!schedule[label]) schedule[label] = {}
            const rowClass = row.className || tt.className || ''
            const rowSection = row.section || tt.section || ''
            const classLabel = `${String(rowClass).replace(/^Grade\s+/i, '')}${rowSection ? `-${rowSection}` : ''}`.replace(/-$/, '')
            const entry = {
                subject: row.subject,
                className: pending ? `${classLabel} (pending approval)`.trim() : classLabel,
            }
            const existing = schedule[label][row.day]
            schedule[label][row.day] = existing
                ? {
                    subject: `${existing.subject} / ${entry.subject}`,
                    className: `${existing.className} / ${entry.className} (clash)`,
                    clash: true,
                }
                : entry
        })
    })

    return {
        timeSlots: [...timeSlots.values()]
            .sort((a, b) => a.start - b.start)
            .map(({ label, time }) => ({ label, time })),
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].filter((d) => days.has(d)),
        schedule,
        hasData: timeSlots.size > 0,
    }
}

export const hydrateTeacherPortalAssignments = async ({
    force = false,
    email = '',
    name = '',
} = {}) => {
    if (force) {
        clearTeacherAssignmentCache()
    }
    if (!force && hydratePromise) return hydratePromise
    hydratePromise = (async () => {
        await resolveOwnTeacherProfile({ email, name })
        if (canUseAcademicsApi()) {
            await Promise.all([hydrateTeacherAllocationsFromApi(), hydrateClassTimetablesFromApi()])
        }
        emitUpdated()
        return getTeacherAssignmentRows(cachedSelf?.email || email || '')
    })()
    try {
        return await hydratePromise
    } finally {
        hydratePromise = null
    }
}
