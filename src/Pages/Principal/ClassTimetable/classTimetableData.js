import {
    getClasses as getCatalogClasses,
    getSections as getCatalogSections,
    getSectionsForClass as getCatalogSectionsForClass,
    getSubjects as getCatalogSubjects,
} from '../../../Common/RBAC/academicsCatalogData'
import {
    canUseAcademicsApi,
    deleteAcademicsRecordApi,
    listAcademicsCollectionApi,
    replaceAcademicsCollectionApi,
    stripAcademicsMeta,
} from '../../../services/academicsApi'
import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { listAcademicYears } from '../../../services/classDetailsApi'
import { listDirectoryApi } from '../../../services/communicationApi'
import {
    getAllocationByEmployeeId,
    getAllocations,
    getGrades as getAllocationGrades,
    getTeachers,
    hydrateTeacherAllocationsFromApi,
    hydrateTeachersFromDirectory,
    isUsingDemoTeacherRoster,
} from '../TeacherAllocation/teacherAllocationData'

export const STORAGE_KEY = 'principal-class-timetables'
export const CHANGE_KEY = 'principal-class-timetable-change-requests'
export const CLASS_TIMETABLES_UPDATED_EVENT = 'schoolerp-class-timetables-updated'

export const ROUTE_BASE = '/principal/class-timetable'
export const CREATE_ROUTE = '/principal/create-class-timetable'
export const COORDINATOR_ROUTE_BASE = '/coordinator/class/class-timetable'
export const COORDINATOR_CREATE_ROUTE = '/coordinator/class/create-class-timetable'
export const DIRECTOR_ROUTE_BASE = '/director/class-timetable-approvals'

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Denied']

export const TERMS = ['Term 1', 'Term 2', 'Term 3']
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Live catalog helpers (empty until Class Details / subjects exist). */
// Falls back to the Teacher Allocation class list (standard levels) when this browser has no
// Class Details catalog, so a teacher without an allocation still gets class options.
export const getGradeOptions = () => {
    const classes = getCatalogClasses()
    return classes.length ? classes : getAllocationGrades()
}
export const getSectionOptions = (className = '') => {
    if (className) {
        const forClass = getCatalogSectionsForClass(className)
        if (forClass.length) return forClass
    }
    return getCatalogSections()
}
export const getSubjectOptions = () => getCatalogSubjects()

/** @deprecated Prefer getGradeOptions / getSectionOptions / getSubjectOptions */
export const GRADES = []
export const SECTIONS = []
export const SUBJECTS = []
export const TEACHERS = []

export const getTimetableRoutes = (pathname = '') => {
    if (String(pathname).startsWith('/admin')) {
        return {
            listPath: '/admin/class/timetable-list',
            createPath: '/admin/class/add-timetable',
            editPath: (id) => `/admin/class/edit-timetable/${id}`,
            reviewer: 'Admin',
            canApprove: false,
            canEdit: true,
        }
    }
    if (String(pathname).startsWith('/coordinator')) {
        return {
            listPath: COORDINATOR_ROUTE_BASE,
            createPath: COORDINATOR_CREATE_ROUTE,
            editPath: (id) => `/coordinator/class/edit-class-timetable/${id}`,
            reviewer: 'Coordinator',
            canApprove: false,
            canEdit: true,
        }
    }
    if (String(pathname).startsWith('/director')) {
        return {
            listPath: DIRECTOR_ROUTE_BASE,
            createPath: CREATE_ROUTE,
            editPath: (id) => `/director/edit-class-timetable/${id}`,
            reviewer: 'Director',
            // Client review: timetable publish/change approval is Principal-only.
            canApprove: false,
            canEdit: true,
        }
    }
    if (String(pathname).startsWith('/teacher')) {
        return {
            listPath: '/teacher/class/class-timetable',
            createPath: '/teacher/class/class-timetable',
            editPath: () => '/teacher/class/class-timetable',
            reviewer: 'Teacher',
            canApprove: false,
            canEdit: false,
        }
    }
    return {
        listPath: ROUTE_BASE,
        createPath: CREATE_ROUTE,
        editPath: (id) => `/principal/edit-class-timetable/${id}`,
        reviewer: 'Principal',
        canApprove: true,
        canEdit: true,
    }
}

const classKeysMatch = (left, right) => {
    const normalize = (value) => String(value || '').trim().toLowerCase().replace(/^grade\s+/, '')
    return normalize(left) === normalize(right)
}

/** Subjects allocated to a teacher (optionally narrowed by class / section mappings). */
export const getSubjectsForTimetableTeacher = (employeeId, className = '', section = '') => {
    if (!employeeId) return []
    const allocation = getAllocationByEmployeeId(employeeId)
    if (!allocation) return []

    const mappings = Array.isArray(allocation.mappings) ? allocation.mappings : []
    if (className) {
        const mapped = mappings
            .filter((item) => classKeysMatch(item.className, className))
            .filter((item) => !section || !item.section || String(item.section) === String(section))
            .map((item) => item.subject)
            .filter(Boolean)
        if (mapped.length) return [...new Set(mapped)].sort((a, b) => a.localeCompare(b))
    }

    const subjects = Array.isArray(allocation.subjects) ? allocation.subjects.filter(Boolean) : []
    if (subjects.length) return [...new Set(subjects)].sort((a, b) => a.localeCompare(b))

    return [...new Set(mappings.map((item) => item.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

/**
 * Subjects teachers currently handle for a class (union of active allocation mappings).
 * Optionally narrow by selected sections; `__ALL__` / empty sections = all sections for that class.
 * Falls back to subjects already used on class timetables for the same class.
 */
export const getSubjectsForClass = (className = '', sections = []) => {
    if (!className) return []

    const selectedSections = Array.isArray(sections)
        ? sections.map(String).filter((value) => value && value !== '__ALL__')
        : []
    const matchAllSections = !selectedSections.length
        || (Array.isArray(sections) && sections.includes('__ALL__'))

    const fromAllocations = []
    getAllocations().forEach((allocation) => {
        const status = String(allocation?.status || 'Active').toLowerCase()
        if (status && status !== 'active') return
        const mappings = Array.isArray(allocation?.mappings) ? allocation.mappings : []
        mappings.forEach((item) => {
            if (!classKeysMatch(item.className, className)) return
            if (!matchAllSections) {
                const section = String(item.section || '')
                if (section && !selectedSections.includes(section)) return
            }
            if (item.subject) fromAllocations.push(item.subject)
        })
    })
    if (fromAllocations.length) {
        return [...new Set(fromAllocations)].sort((a, b) => a.localeCompare(b))
    }

    const fromTimetables = []
    getClassTimetables().forEach((record) => {
        const timelines = Array.isArray(record?.timelines) ? record.timelines : []
        timelines.forEach((row) => {
            if (!classKeysMatch(row.className || record.className, className)) return
            if (!matchAllSections) {
                const section = String(row.section || '')
                if (section && !selectedSections.includes(section)) return
            }
            if (row.subject) fromTimetables.push(row.subject)
        })
    })
    return [...new Set(fromTimetables)].sort((a, b) => a.localeCompare(b))
}

/** Teaching classes allocated to a teacher. */
export const getClassesForTimetableTeacher = (employeeId) => {
    if (!employeeId) return getGradeOptions()
    const allocation = getAllocationByEmployeeId(employeeId)
    const teaching = Array.isArray(allocation?.teachingClasses) ? allocation.teachingClasses.filter(Boolean) : []
    if (teaching.length) return [...new Set(teaching)].sort((a, b) => a.localeCompare(b))
    const fromMaps = (allocation?.mappings || []).map((item) => item.className).filter(Boolean)
    if (fromMaps.length) return [...new Set(fromMaps)].sort((a, b) => a.localeCompare(b))
    return getGradeOptions()
}

/** Sections mapped for a teacher + class (from allocation mappings). */
export const getSectionsForTimetableTeacher = (employeeId, className = '') => {
    if (!employeeId || !className) return []
    const allocation = getAllocationByEmployeeId(employeeId)
    const mappings = Array.isArray(allocation?.mappings) ? allocation.mappings : []
    const sections = mappings
        .filter((item) => classKeysMatch(item.className, className))
        .map((item) => item.section)
        .filter(Boolean)
    if (sections.length) return [...new Set(sections)].sort((a, b) => a.localeCompare(b))
    // Class allocated without section detail — fall back to Admin Class Details for that class.
    return getSectionOptions(className)
}

/** Apply class selection on a timeline row: map section + subject from teacher allocation. */
export const applyClassToTimelineRow = (row, employeeId, className, teacherName = '') => {
    const sections = getSectionsForTimetableTeacher(employeeId, className)
    const section = sections.length === 1 ? sections[0] : (sections.includes(row.section) ? row.section : '')
    const subjects = getSubjectsForTimetableTeacher(employeeId, className, section)
    const subject = subjects.length === 1
        ? subjects[0]
        : (subjects.includes(row.subject) ? row.subject : '')
    return {
        ...row,
        className: className || '',
        section,
        subject,
        teacher: teacherName || row.teacher,
    }
}

const classifyTimetableOwnerRole = (rawRole = '', rawName = '') => {
    const blob = `${rawRole} ${rawName}`.toLowerCase()
    if (/\b(director|principal|admin|super\s*admin|hr\b|human resources|account|finance|prm|gate|driver|librarian|parent|student)\b/.test(blob)) {
        if (/\bteacher\b|\btgt\b|\bpgt\b|\bprt\b/.test(blob)) return 'teacher'
        if (/\bcoordinator\b/.test(blob)) return 'coordinator'
        return 'other'
    }
    if (/\bcoordinator\b/.test(blob)) return 'coordinator'
    if (/\bteacher\b|\btgt\b|\bpgt\b|\bprt\b|\binstructor\b|\blecturer\b/.test(blob)) return 'teacher'
    return 'other'
}

/**
 * Owner picker for Class Timetable.
 * - Coordinator panel: teachers only
 * - Principal / Director: teachers + coordinators (not Director/HR/etc.)
 */
export async function loadClassTimetableTeacherOptions({ viewerPath = '' } = {}) {
    const includeCoordinators = !String(viewerPath).startsWith('/coordinator')

    try {
        await hydrateTeacherAllocationsFromApi()
    } catch {
        /* ignore */
    }
    try {
        await hydrateTeachersFromDirectory({ force: true })
    } catch {
        /* ignore */
    }

    const byKey = new Map()
    const put = (row) => {
        const employeeId = String(row?.employeeId || '').trim()
        const name = String(row?.name || '').trim()
        const email = String(row?.email || '').trim().toLowerCase()
        const roleKind = classifyTimetableOwnerRole(row?.role || row?.designation || '', name)
        if (!employeeId && !email) return
        if (roleKind === 'other') return
        if (roleKind === 'coordinator' && !includeCoordinators) return

        const key = employeeId || `email:${email}`
        const prev = byKey.get(key) || {}
        const nextName = name || prev.name || email || employeeId
        const prevId = String(prev.employeeId || '')
        const preferIncomingId = Boolean(employeeId) && (
            !prevId
            || (/^emp[-_]/i.test(employeeId) && !/^emp[-_]/i.test(prevId))
            || (/^tea[-_]/i.test(employeeId) && !/^(emp|tea)[-_]/i.test(prevId))
        )
        const next = {
            employeeId: preferIncomingId ? employeeId : (prevId || employeeId),
            name: nextName,
            email: email || prev.email || '',
            roleKind: roleKind === 'coordinator' || prev.roleKind === 'coordinator' ? 'coordinator' : 'teacher',
        }
        byKey.set(key, next)
        if (email) byKey.set(`email:${email}`, next)
    }

    if (!isUsingDemoTeacherRoster()) {
        getTeachers()
            .filter((item) => item.employeeId && item.name)
            .forEach((item) => put({
                employeeId: item.employeeId,
                name: item.name,
                email: item.email || '',
                designation: item.designation || 'Teacher',
                role: item.designation || 'Teacher',
            }))
    }

    if (isApiAuthEnabled() && getAccessToken()) {
        try {
            const people = await listDirectoryApi()
            ;(Array.isArray(people) ? people : []).forEach((person) => {
                const role = String(person.role || '').toLowerCase()
                if (role !== 'teacher' && role !== 'coordinator') return
                if (role === 'coordinator' && !includeCoordinators) return
                put({
                    employeeId: person.employeeId || '',
                    name: person.name || person.email || 'Staff',
                    email: person.email || '',
                    role,
                    designation: person.role || '',
                })
            })
        } catch {
            /* ignore */
        }
    }

    // Allocated staff: only keep if we already classified them as teacher/coordinator,
    // or their id is known from the filtered maps above.
    getAllocations()
        .filter((row) => row?.employeeId && String(row.status || '').toLowerCase() !== 'not allocated')
        .forEach((row) => {
            const id = String(row.employeeId)
            const known = [...byKey.values()].find((item) => item.employeeId === id)
            if (!known) return
            put({
                employeeId: id,
                name: known.name,
                email: known.email || '',
                role: known.roleKind,
                designation: known.roleKind,
            })
        })

    const deduped = new Map()
    byKey.forEach((row) => {
        const id = String(row.employeeId || '').trim()
        if (!id || id.startsWith('email:')) return
        if (row.roleKind === 'coordinator' && !includeCoordinators) return
        const prev = deduped.get(id)
        if (!prev || (row.name && row.name !== id && prev.name === id)) {
            deduped.set(id, row)
        }
    })

    return [...deduped.values()]
        .filter((item) => item.employeeId && item.name)
        .map(({ employeeId, name, email }) => ({ employeeId, name, email }))
        .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Campus academic years for create/filter dropdowns.
 * Prefers GET /masters/academic-years; falls back to years already used on timetables.
 * @returns {Promise<Array<{ id: string, name: string, isCurrent: boolean }>>}
 */
export async function loadAcademicYearOptions() {
    let years = []
    if (isApiAuthEnabled() && getAccessToken()) {
        try {
            const rows = await listAcademicYears()
            years = (Array.isArray(rows) ? rows : [])
                .filter((row) => row?.name && row.isActive !== false)
                .map((row) => ({
                    id: String(row.id || row.name),
                    name: String(row.name),
                    isCurrent: Boolean(row.isCurrent),
                }))
        } catch {
            years = []
        }
    }

    const fromTimetables = getClassTimetables()
        .map((row) => row.academicYear)
        .filter(Boolean)
        .map((name) => ({ id: String(name), name: String(name), isCurrent: false }))

    const byName = new Map()
    ;[...years, ...fromTimetables].forEach((row) => {
        if (!byName.has(row.name)) byName.set(row.name, row)
        else if (row.isCurrent) byName.set(row.name, { ...byName.get(row.name), isCurrent: true })
    })

    return [...byName.values()].sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }))
}

export const approvalStatusColor = {
    Approved: 'text-[#4CAF50] border-[#4CAF5033] bg-[#4CAF5014]',
    Pending: 'text-[#FF9800] border-[#FF980033] bg-[#FF980014]',
    Denied: 'text-[#980E0F] border-[#980E0F33] bg-[#980E0F14]',
}

export const createTimelineRow = () => ({
    id: `TL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    periodNumber: '',
    day: '',
    className: '',
    section: '',
    subject: '',
    teacher: '',
    startTime: '',
    endTime: '',
})

export const defaultClassTimetableForm = () => ({
    timetableId: '',
    academicYear: '',
    term: '',
    ownerTeacherId: '',
    ownerTeacherName: '',
    ownerTeacherEmail: '',
    timelines: [createTimelineRow()],
})

const DEFAULT_CLASS_TIMETABLES = []

let apiMemoryTimetables = null
let apiMemoryChanges = null
// idle | loading | ready | error — server mode only. ready + [] is a valid empty campus.
let timetableHydrateStatus = 'idle'
let timetableHydrateError = ''
let timetableSaveInFlight = false
let lastConfirmedServerTimetables = null
let lastConfirmedServerChanges = null

const usesApiMemory = () => canUseAcademicsApi()

const emitUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(CLASS_TIMETABLES_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

const purgeBrowserCopies = () => {
    try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(CHANGE_KEY)
        sessionStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(CHANGE_KEY)
    } catch {
        /* ignore */
    }
}

export const getTimetableHydrateStatus = () => timetableHydrateStatus
export const getTimetableHydrateError = () => timetableHydrateError
export const isTimetableSaveInFlight = () => timetableSaveInFlight
export const canSaveClassTimetables = () => {
    if (!usesApiMemory()) return true
    return (
        timetableHydrateStatus === 'ready'
        && Array.isArray(apiMemoryTimetables)
        && Array.isArray(apiMemoryChanges)
        && !timetableSaveInFlight
    )
}

export const clearClassTimetableMemory = () => {
    apiMemoryTimetables = null
    apiMemoryChanges = null
    lastConfirmedServerTimetables = null
    lastConfirmedServerChanges = null
    timetableHydrateStatus = 'idle'
    timetableHydrateError = ''
    emitUpdated()
}

const cleanList = (rows) => (Array.isArray(rows) ? rows.map(stripAcademicsMeta) : [])

const cloneList = (rows) => (Array.isArray(rows) ? rows.map((row) => ({ ...row })) : [])

export const hydrateClassTimetablesFromApi = async ({ force = false } = {}) => {
    if (!canUseAcademicsApi()) {
        timetableHydrateStatus = 'idle'
        timetableHydrateError = ''
        return false
    }
    if (
        !force
        && timetableHydrateStatus === 'ready'
        && Array.isArray(apiMemoryTimetables)
        && Array.isArray(apiMemoryChanges)
    ) {
        return true
    }
    timetableHydrateStatus = 'loading'
    timetableHydrateError = ''
    emitUpdated()
    try {
        const [tts, changes] = await Promise.all([
            listAcademicsCollectionApi('class-timetables'),
            listAcademicsCollectionApi('class-timetable-change-requests'),
        ])
        const cleanedTt = cleanList(Array.isArray(tts) ? tts : [])
        const cleanedCh = cleanList(Array.isArray(changes) ? changes : [])
        apiMemoryTimetables = cleanedTt
        apiMemoryChanges = cleanedCh
        lastConfirmedServerTimetables = cloneList(cleanedTt)
        lastConfirmedServerChanges = cloneList(cleanedCh)
        timetableHydrateStatus = 'ready'
        timetableHydrateError = ''
        purgeBrowserCopies()
        emitUpdated()
        return true
    } catch (error) {
        // TT-02: failed load must not look like a confirmed empty collection (would wipe on save).
        apiMemoryTimetables = null
        apiMemoryChanges = null
        timetableHydrateStatus = 'error'
        timetableHydrateError = error?.message || 'Could not load class timetables from the server.'
        emitUpdated()
        return false
    }
}

export const getClassTimetables = () => {
    if (usesApiMemory()) {
        return Array.isArray(apiMemoryTimetables) ? [...apiMemoryTimetables] : []
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return [...DEFAULT_CLASS_TIMETABLES]
}

export const saveClassTimetables = async (records) => {
    const list = Array.isArray(records) ? records : []
    if (usesApiMemory()) {
        if (!canSaveClassTimetables()) {
            return {
                success: false,
                errors: [
                    timetableHydrateStatus === 'error'
                        ? (timetableHydrateError || 'Timetables have not loaded. Retry before saving.')
                        : 'Wait for class timetables to finish loading before saving.',
                ],
            }
        }
        const previous = cloneList(lastConfirmedServerTimetables)
        timetableSaveInFlight = true
        apiMemoryTimetables = list
        emitUpdated()
        try {
            const saved = await replaceAcademicsCollectionApi('class-timetables', cleanList(list))
            const cleaned = cleanList(Array.isArray(saved) ? saved : list)
            apiMemoryTimetables = cleaned
            lastConfirmedServerTimetables = cloneList(cleaned)
            timetableSaveInFlight = false
            emitUpdated()
            return { success: true, records: cleaned }
        } catch (error) {
            apiMemoryTimetables = previous
            lastConfirmedServerTimetables = cloneList(previous)
            timetableSaveInFlight = false
            emitUpdated()
            return {
                success: false,
                errors: [error?.message || 'Could not save class timetables. Changes were not kept.'],
            }
        }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    emitUpdated()
    return { success: true, records: list }
}

export const getClassTimetableById = (id) =>
    getClassTimetables().find((item) => item.id === id) ?? null

export const generateTimetableId = () => {
    const list = getClassTimetables()
    const max = list.reduce((acc, item) => {
        const num = Number(String(item.id).replace('CTT', ''))
        return Number.isFinite(num) ? Math.max(acc, num) : acc
    }, 0)
    return `CTT${String(max + 1).padStart(3, '0')}`
}

export const formatSubmittedDate = () =>
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-')

export const addClassTimetable = async (payload) => {
    const ownerName = payload.ownerTeacherName || ''
    const timelines = (payload.timelines || [])
        .filter((row) => row.day && row.subject && row.className && row.section)
        .map((row) => ({
            ...row,
            teacher: row.teacher || ownerName,
        }))
    const first = timelines[0] || {}
    const record = {
        id: payload.timetableId || generateTimetableId(),
        // Summary fields for list filters (first period); full detail is on each timeline row.
        className: first.className || '',
        section: first.section || '',
        academicYear: payload.academicYear,
        term: payload.term,
        ownerTeacherId: payload.ownerTeacherId || '',
        ownerTeacherName: ownerName,
        ownerTeacherEmail: payload.ownerTeacherEmail || '',
        createdByRole: payload.createdByRole || 'Principal',
        submittedDate: formatSubmittedDate(),
        approvalStatus: 'Pending',
        timelines,
    }
    const saved = await saveClassTimetables([record, ...getClassTimetables()])
    if (!saved.success) {
        return { success: false, errors: saved.errors || ['Save failed.'], record: null }
    }
    return { success: true, record }
}

// <input type="time"> only renders "HH:MM"; older rows may hold "09:00 AM".
const toTimeInputValue = (value) => {
    const mins = slotStartMinutes(value)
    if (mins === Number.MAX_SAFE_INTEGER) return String(value || '')
    return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

export const classRecordToForm = (record) => {
    if (!record) return defaultClassTimetableForm()
    return {
        timetableId: record.id || '',
        academicYear: record.academicYear || '',
        term: record.term || '',
        ownerTeacherId: record.ownerTeacherId || '',
        ownerTeacherName: record.ownerTeacherName || '',
        ownerTeacherEmail: record.ownerTeacherEmail || '',
        timelines: Array.isArray(record.timelines) && record.timelines.length
            ? record.timelines.map((row) => ({
                ...createTimelineRow(),
                ...row,
                startTime: toTimeInputValue(row.startTime),
                endTime: toTimeInputValue(row.endTime),
            }))
            : [createTimelineRow()],
    }
}

/** Update an existing class timetable; edits reset approval to Pending. */
export const updateClassTimetable = async (id, payload) => {
    const ownerName = payload.ownerTeacherName || ''
    const timelines = (payload.timelines || [])
        .filter((row) => row.day && row.subject && row.className && row.section)
        .map((row) => ({
            ...row,
            teacher: row.teacher || ownerName,
        }))
    const first = timelines[0] || {}
    const list = getClassTimetables()
    const idx = list.findIndex((item) => String(item.id) === String(id))
    if (idx < 0) return { success: false, errors: ['Class timetable not found.'], record: null }
    const updated = {
        ...list[idx],
        className: first.className || list[idx].className || '',
        section: first.section || list[idx].section || '',
        academicYear: payload.academicYear,
        term: payload.term,
        ownerTeacherId: payload.ownerTeacherId || '',
        ownerTeacherName: ownerName,
        ownerTeacherEmail: payload.ownerTeacherEmail || '',
        approvalStatus: 'Pending',
        rejectionReason: '',
        reviewedBy: '',
        timelines,
    }
    const next = [...list]
    next[idx] = updated
    const saved = await saveClassTimetables(next)
    if (!saved.success) {
        return { success: false, errors: saved.errors || ['Save failed.'], record: null }
    }
    return { success: true, record: updated }
}

/** Principal / Admin / Director delete; the server returns 403 for other roles and audits the removal. */
export const deleteClassTimetable = async (id) => {
    const key = String(id || '')
    if (!key) return { success: false, errors: ['Class timetable not found.'] }
    if (usesApiMemory()) {
        if (!canSaveClassTimetables()) {
            return {
                success: false,
                errors: [getTimetableHydrateError() || 'Wait for class timetables to finish loading before deleting.'],
            }
        }
        timetableSaveInFlight = true
        try {
            await deleteAcademicsRecordApi('class-timetables', key)
        } catch (error) {
            timetableSaveInFlight = false
            return { success: false, errors: [error?.message || 'Could not delete the class timetable.'] }
        }
        timetableSaveInFlight = false
        await hydrateClassTimetablesFromApi({ force: true })
        return { success: true }
    }
    const next = getClassTimetables().filter((item) => String(item.id) !== key)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    emitUpdated()
    return { success: true }
}

// "09:00", "9:00 AM", "01:30 PM" → minutes since midnight (unparseable sorts last).
export const slotStartMinutes = (value) => {
    const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)?/i)
    if (!match) return Number.MAX_SAFE_INTEGER
    let hours = Number(match[1]) % 24
    const meridiem = (match[3] || '').toUpperCase()
    if (meridiem === 'PM' && hours < 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0
    return hours * 60 + Number(match[2])
}

const slotEndMinutes = (value) => {
    const mins = slotStartMinutes(value)
    return mins === Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : mins
}

/** FE clash check for create/edit (room N/A — not in model). */
export const findTimetableConflicts = (timelines = [], { ownerTeacherId = '', ownerTeacherName = '' } = {}) => {
    const errors = []
    const complete = (Array.isArray(timelines) ? timelines : []).filter(
        (row) => row?.day && row?.className && row?.section && row?.subject && row?.startTime && row?.endTime,
    )
    for (let i = 0; i < complete.length; i += 1) {
        for (let j = i + 1; j < complete.length; j += 1) {
            const a = complete[i]
            const b = complete[j]
            if (String(a.day).toLowerCase() !== String(b.day).toLowerCase()) continue
            const aStart = slotStartMinutes(a.startTime)
            const aEnd = slotEndMinutes(a.endTime)
            const bStart = slotStartMinutes(b.startTime)
            const bEnd = slotEndMinutes(b.endTime)
            if (aStart >= aEnd || bStart >= bEnd) continue
            if (!(aStart < bEnd && bStart < aEnd)) continue
            const sameClass = classKeysMatch(a.className, b.className)
                && String(a.section).trim().toUpperCase() === String(b.section).trim().toUpperCase()
            if (sameClass) {
                errors.push(
                    `Class conflict: ${a.className} ${a.section} has overlapping periods on ${a.day}.`,
                )
            }
            const teacherA = String(a.teacher || ownerTeacherName || '').trim().toLowerCase()
            const teacherB = String(b.teacher || ownerTeacherName || '').trim().toLowerCase()
            const sameTeacher = Boolean(ownerTeacherId)
                || (teacherA && teacherB && teacherA === teacherB)
            if (sameTeacher) {
                errors.push(
                    `Teacher conflict: overlapping periods on ${a.day} (${a.startTime}–${a.endTime} / ${b.startTime}–${b.endTime}).`,
                )
            }
        }
    }
    return [...new Set(errors)]
}

export const buildClassGridFromTimelines = (timelines = []) => {
    const dayOrder = (day) => {
        const index = DAYS.findIndex((name) => name.toLowerCase() === String(day).trim().toLowerCase())
        return index === -1 ? DAYS.length : index
    }
    const days = [...new Set(timelines.map((row) => row.day).filter(Boolean))]
        .sort((a, b) => dayOrder(a) - dayOrder(b))
    const slotMap = new Map()

    timelines.forEach((row) => {
        if (!row.day || !row.startTime || !row.endTime) return
        const label = `${row.startTime} - ${row.endTime}`
        if (!slotMap.has(label)) {
            slotMap.set(label, {
                label,
                time: `${row.startTime} -\n${row.endTime}`,
                start: slotStartMinutes(row.startTime),
            })
        }
    })

    const timeSlots = [...slotMap.values()]
        .sort((a, b) => a.start - b.start)
        .map(({ label, time }) => ({ label, time }))
    const schedule = {}

    timelines.forEach((row) => {
        if (!row.day || !row.startTime || !row.endTime || !row.subject) return
        const label = `${row.startTime} - ${row.endTime}`
        if (!schedule[label]) schedule[label] = {}
        const classLabel = row.className
            ? `${String(row.className).replace(/^Grade\s+/i, '')}${row.section ? `-${row.section}` : ''}`
            : ''
        schedule[label][row.day] = {
            subject: classLabel ? `${row.subject} (${classLabel})` : row.subject,
            teacher: row.teacher || '—',
        }
    })

    return {
        days: days.length ? days : DAYS.slice(0, 5),
        timeSlots: timeSlots.length ? timeSlots : [{ time: '—', label: '—' }],
        schedule,
    }
}

export const getClassSectionLabel = (record) => {
    const fromRows = [...new Set(
        (record?.timelines || [])
            .filter((row) => row.className)
            .map((row) => `${row.className}${row.section ? ` - ${row.section}` : ''}`),
    )]
    if (fromRows.length) return fromRows.join(', ')
    if (record?.className) return `${record.className}${record.section ? ` - ${record.section}` : ''}`
    return '—'
}

const readChangesLocal = () => {
    try {
        const stored = localStorage.getItem(CHANGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return []
}

export const getTimetableChangeRequests = () => {
    if (usesApiMemory()) {
        return Array.isArray(apiMemoryChanges) ? [...apiMemoryChanges] : []
    }
    return readChangesLocal()
}

const saveChanges = async (items) => {
    const list = Array.isArray(items) ? items : []
    if (usesApiMemory()) {
        if (!canSaveClassTimetables()) {
            return {
                success: false,
                errors: [
                    timetableHydrateStatus === 'error'
                        ? (timetableHydrateError || 'Timetables have not loaded. Retry before saving.')
                        : 'Wait for class timetables to finish loading before saving.',
                ],
            }
        }
        const previous = cloneList(lastConfirmedServerChanges)
        timetableSaveInFlight = true
        apiMemoryChanges = list
        emitUpdated()
        try {
            const saved = await replaceAcademicsCollectionApi('class-timetable-change-requests', cleanList(list))
            const cleaned = cleanList(Array.isArray(saved) ? saved : list)
            apiMemoryChanges = cleaned
            lastConfirmedServerChanges = cloneList(cleaned)
            timetableSaveInFlight = false
            emitUpdated()
            return { success: true, records: cleaned }
        } catch (error) {
            apiMemoryChanges = previous
            lastConfirmedServerChanges = cloneList(previous)
            timetableSaveInFlight = false
            emitUpdated()
            return {
                success: false,
                errors: [error?.message || 'Could not save timetable change requests.'],
            }
        }
    }
    localStorage.setItem(CHANGE_KEY, JSON.stringify(list))
    emitUpdated()
    return { success: true, records: list }
}

export const addTimetableChangeRequest = async (payload) => {
    const items = getTimetableChangeRequests()
    const record = {
        id: `TCR-${Date.now()}`,
        timetableId: payload.timetableId || '',
        className: payload.className,
        section: payload.section,
        day: payload.day,
        periodNumber: payload.periodNumber || '',
        currentSubject: payload.currentSubject || '',
        requestedSubject: payload.requestedSubject,
        requestedTeacher: payload.requestedTeacher || '',
        reason: payload.reason,
        requestedBy: payload.requestedBy,
        requestedByRole: payload.requestedByRole,
        status: 'Pending',
        reviewedBy: '',
        reviewedAt: '',
        rejectionReason: '',
    }
    const saved = await saveChanges([record, ...items])
    if (!saved.success) return { success: false, errors: saved.errors || ['Save failed.'], record: null }
    return { success: true, record }
}

/**
 * TT-06: Change-request UI is disabled. Keep this path from inventing years or
 * auto-Approving — apply subject/teacher only onto an existing Pending/Approved row
 * and leave status Pending for Principal/Director review.
 */
const applyChangeToTimetable = async (request) => {
    const timetables = getClassTimetables()
    const match = timetables.find((item) => (
        item.id === request.timetableId
        || (item.className === request.className && item.section === request.section)
    ))
    if (!match) {
        return { success: false, errors: ['No matching class timetable to update. Create one first.'] }
    }
    const row = {
        id: `TL-${Date.now()}`,
        periodNumber: request.periodNumber || '1',
        day: request.day,
        className: request.className || match.className,
        section: request.section || match.section,
        subject: request.requestedSubject,
        teacher: request.requestedTeacher || match.ownerTeacherName || '—',
        startTime: '09:00',
        endTime: '09:45',
    }
    const timelines = match.timelines.map((item) => (
        item.day === request.day && (!request.periodNumber || item.periodNumber === request.periodNumber)
            ? { ...item, subject: request.requestedSubject, teacher: request.requestedTeacher || item.teacher }
            : item
    ))
    const changed = timelines.some((item, index) => item !== match.timelines[index])
    const nextTimelines = changed ? timelines : [...timelines, row]
    return saveClassTimetables(timetables.map((item) => (
        item.id === match.id
            ? { ...item, timelines: nextTimelines, approvalStatus: 'Pending' }
            : item
    )))
}

/** Principal / Director decides a submitted class timetable (Approve / Deny). */
export const decideClassTimetableApproval = async (id, approvalStatus, reviewer = 'Principal', rejectionReason = '') => {
    const nextStatus = approvalStatus === 'Approved' ? 'Approved' : 'Denied'
    const list = getClassTimetables()
    const target = list.find((item) => item.id === id)
    if (!target || target.approvalStatus !== 'Pending') {
        return { success: false, errors: ['Only Pending timetables can be approved or denied.'], record: null }
    }
    const updated = {
        ...target,
        approvalStatus: nextStatus,
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
        rejectionReason: nextStatus === 'Denied' ? rejectionReason : '',
    }
    const saved = await saveClassTimetables(list.map((item) => (item.id === id ? updated : item)))
    if (!saved.success) return { success: false, errors: saved.errors || ['Save failed.'], record: null }
    return { success: true, record: updated }
}

export const decideTimetableChangeRequest = async (id, approved, reviewer, rejectionReason = '') => {
    const items = getTimetableChangeRequests()
    const target = items.find((item) => item.id === id)
    if (!target || target.status !== 'Pending') {
        return { success: false, errors: ['Change request not found or already decided.'], records: items }
    }
    if (approved) {
        const applied = await applyChangeToTimetable(target)
        if (!applied.success) {
            return { success: false, errors: applied.errors || ['Could not apply change to timetable.'], records: items }
        }
    }
    const next = items.map((item) => (
        item.id === id
            ? {
                ...item,
                status: approved ? 'Approved' : 'Rejected',
                reviewedBy: reviewer,
                reviewedAt: new Date().toISOString(),
                rejectionReason: approved ? '' : rejectionReason,
            }
            : item
    ))
    const saved = await saveChanges(next)
    if (!saved.success) return { success: false, errors: saved.errors || ['Save failed.'], records: items }
    return { success: true, records: saved.records || next }
}
