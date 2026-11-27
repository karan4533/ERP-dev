import {
    canUseAcademicsApi,
    listAcademicsCollectionApi,
    replaceAcademicsCollectionApi,
    stripAcademicsMeta,
} from '../../../services/academicsApi'
import { canUseEmployeeDirectoryApi, loadEmployeeDirectory } from '../../../services/employeeDirectoryApi'
import { apiRequest, getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import {
    getClasses as getCatalogClasses,
    getSections as getCatalogSections,
    getSectionsForClass as getCatalogSectionsForClass,
    getSubjects as getCatalogSubjects,
} from '../../../Common/RBAC/academicsCatalogData'
import { liveArray } from '../../../Common/RBAC/liveArray'
import { CLASS_LEVEL_OPTIONS } from '../../Admin/Class/ClassDetails/classDetailsOptions'
import { ensureClassCatalogHydrated } from '../../../services/classDetailsApi'

export const STORAGE_KEY = 'principal-teacher-allocation'
export const TEACHER_ALLOCATIONS_UPDATED_EVENT = 'schoolerp-teacher-allocations-updated'

const emitUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(TEACHER_ALLOCATIONS_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

export const ROUTE_BASE = '/principal/academic/teacher-allocation'

export const ALLOCATION_STATUSES = ['Active', 'Inactive', 'Not Allocated']

export const ACADEMIC_YEARS = ['2026–2027', '2025–2026']

const FALLBACK_GRADES = [...CLASS_LEVEL_OPTIONS]

const FALLBACK_SECTIONS = ['A', 'B', 'C']

const FALLBACK_SUBJECTS = [
    'Mathematics',
    'English',
    'Science',
    'Tamil',
    'Social Science',
    'Computer Science',
]

const apiCatalogMode = () => isApiAuthEnabled() && Boolean(getAccessToken())

const normalizeGradeLabel = (value) => {
    const text = String(value || '').trim()
    if (!text) return ''
    if (/^grade\s+/i.test(text)) return text.replace(/^grade\s+/i, 'Grade ')
    if (/^\d+[A-Z]?$/i.test(text)) return `Grade ${text}`
    return text
}

/** Live class list from Admin Class Details / academics catalog (fallback seed grades offline only). */
export const getGrades = () => {
    const fromCatalog = getCatalogClasses().map(normalizeGradeLabel).filter(Boolean)
    if (fromCatalog.length) return [...new Set(fromCatalog)]
    return apiCatalogMode() ? [] : [...FALLBACK_GRADES]
}

export const getSections = () => {
    const fromCatalog = getCatalogSections().map((item) => String(item || '').trim().toUpperCase()).filter(Boolean)
    if (fromCatalog.length) return [...new Set(fromCatalog)]
    return apiCatalogMode() ? [] : [...FALLBACK_SECTIONS]
}

export const getSectionsForClass = (className) => {
    const fromCatalog = getCatalogSectionsForClass(className)
    if (fromCatalog.length) return fromCatalog
    return apiCatalogMode() ? [] : [...FALLBACK_SECTIONS]
}

/** Prefetch Class Details so allocation dropdowns match Admin. */
export const hydrateClassCatalogForAllocation = () => ensureClassCatalogHydrated()

let masterSubjects = []

/** Subject names from the campus subject master (GET /masters/subjects). */
export const hydrateMasterSubjects = async () => {
    if (!isApiAuthEnabled() || !getAccessToken()) return false
    try {
        const rows = await apiRequest('/masters/subjects')
        masterSubjects = (Array.isArray(rows) ? rows : [])
            .map((row) => String(row?.name || '').trim())
            .filter(Boolean)
        return true
    } catch {
        return false
    }
}

// Server subject master + Class Details catalog + the standard school subjects, one entry per name.
export const getSubjects = () => {
    const byKey = new Map()
    ;[...masterSubjects, ...getCatalogSubjects(), ...FALLBACK_SUBJECTS].forEach((item) => {
        const name = String(item || '').trim()
        if (name && !byKey.has(name.toLowerCase())) byKey.set(name.toLowerCase(), name)
    })
    return [...byKey.values()].sort((a, b) => a.localeCompare(b))
}

/** Live getters for dropdowns — prefer Admin Class Details catalog over seed fallbacks. */
export const GRADES = liveArray(getGrades)
export const SECTIONS = liveArray(getSections)
export const SUBJECTS = liveArray(getSubjects)

/** Departments for filters — rebuilt from live teacher roster when hydrated. */
export let DEPARTMENTS = [
    'Academic',
    'Mathematics',
    'English',
    'Science',
    'Tamil',
    'Social Science',
    'Computer Science',
]

export const allocationStatusColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Inactive: 'bg-[#FF980033] text-[#FF9800]',
    'Not Allocated': 'bg-[#66708533] text-[#667085]',
}

/** Demo roster only when HR directory is unavailable / empty. */
const DEMO_TEACHERS = [
    {
        employeeId: 'TEA-1001',
        name: 'Mr. Ravi Kumar',
        department: 'Mathematics',
        designation: 'Senior Teacher',
        qualification: 'M.Sc Mathematics',
        joiningDate: '15-06-2020',
        profilePhoto: '',
    },
    {
        employeeId: 'TEA-1002',
        name: 'Ms. Anitha Verma',
        department: 'English',
        designation: 'Teacher',
        qualification: 'M.A English',
        joiningDate: '01-07-2021',
        profilePhoto: '',
    },
    {
        employeeId: 'TEA-1003',
        name: 'Rajesh Kumar',
        department: 'Science',
        designation: 'Teacher',
        qualification: 'M.Sc Physics',
        joiningDate: '10-08-2019',
        profilePhoto: '',
    },
    {
        employeeId: 'TEA-1004',
        name: 'Priya Nair',
        department: 'Computer Science',
        designation: 'Teacher',
        qualification: 'B.Tech IT',
        joiningDate: '05-06-2024',
        profilePhoto: '',
    },
    {
        employeeId: 'TEA-1005',
        name: 'Karthik Selvan',
        department: 'Social Science',
        designation: 'Teacher',
        qualification: 'M.A History',
        joiningDate: '12-07-2025',
        profilePhoto: '',
    },
    {
        employeeId: 'TEA-1006',
        name: 'Meera Iyer',
        department: 'Tamil',
        designation: 'Teacher',
        qualification: 'M.A Tamil',
        joiningDate: '20-08-2025',
        profilePhoto: '',
    },
]

let teacherRoster = null
let teacherRosterHydrating = null
// 'idle' | 'loading' | 'ready' | 'empty' | 'error' — server mode only; offline uses the demo roster.
let teacherRosterStatus = 'idle'

export const getTeacherRosterStatus = () => teacherRosterStatus

const dashToEmpty = (value) => {
    const text = String(value ?? '').trim()
    return !text || text === '—' ? '' : text
}

const isInactiveEmployment = (status) =>
    /^(inactive|relieved|terminated|resigned|exited|left)$/i.test(String(status || '').trim())

/** HR / RBAC rows that Principal can allocate (teachers + academic teaching staff). */
export const isAllocatableTeacherRecord = (row, detail = null) => {
    if (!row) return false
    if (isInactiveEmployment(row.status)) return false
    const designation = dashToEmpty(detail?.employmentInfo?.designation || row.role)
    const department = dashToEmpty(row.department)
    const category = dashToEmpty(detail?.employmentInfo?.category)
    const role = dashToEmpty(row.role)
    const blob = `${role} ${designation} ${department} ${category}`.toLowerCase()
    if (/\b(principal|director|jointdirector\w*|administrator|admin|accountant|accounts|hr\b|gate|security|driver|peon|clerk|nurse)\b/.test(blob)) {
        if (!/\bteacher\b|\btgt\b|\bpgt\b|\bprt\b|\bleturer\b|\blecturer\b/.test(blob)) return false
    }
    if (/\bteacher\b|\btgt\b|\bpgt\b|\bprt\b|\bleturer\b|\blecturer\b|\binstructor\b/.test(blob)) return true
    if (/\bacademic/.test(blob)) return true
    if (String(role).toLowerCase() === 'teacher') return true
    return false
}

export const mapDirectoryRecordToTeacher = ({ row, detail }) => {
    const employeeId = String(row.employeeId || row.id || '').trim()
    const designation =
        dashToEmpty(detail?.employmentInfo?.designation) ||
        dashToEmpty(row.role) ||
        'Teacher'
    return {
        employeeId,
        name: dashToEmpty(row.name) || employeeId,
        email: dashToEmpty(row.email || detail?.contactInfo?.email || detail?.email).toLowerCase(),
        department: dashToEmpty(row.department) || 'Academic',
        designation,
        qualification:
            dashToEmpty(row.qualification) ||
            dashToEmpty(detail?.professionalInfo?.qualification) ||
            '',
        joiningDate: dashToEmpty(detail?.professionalInfo?.joiningDate) || '',
        profilePhoto: row.profileImage || '',
        source: row.source || 'hr',
    }
}

const rebuildDepartments = (teachers) => {
    const unique = [...new Set(teachers.map((item) => item.department).filter(Boolean))]
    DEPARTMENTS = unique.length ? unique.sort((a, b) => a.localeCompare(b)) : DEPARTMENTS
}

export const getDepartments = () => [...DEPARTMENTS]

// With API/catalog mode on (or after an empty HR hydrate), never show the demo TEA-* roster:
// allocating one of those people saves an allocation that matches no real employee.
export const getTeachers = () => {
    if (Array.isArray(teacherRoster) && teacherRoster.length) return [...teacherRoster]
    return []
}

/** @deprecated Prefer getTeachers() — live proxy; empty when API/catalog mode is on. */
export const TEACHERS = liveArray(getTeachers)

export const setTeacherRoster = (teachers) => {
    teacherRoster = Array.isArray(teachers) ? teachers : []
    rebuildDepartments(teacherRoster)
    emitUpdated()
}

export const clearTeacherRosterMemory = () => {
    teacherRoster = null
    emitUpdated()
}

/**
 * Load teachers from HR Employee Directory (same source as Principal Employee Database).
 * In API/catalog mode an empty directory yields [] (never DEMO_TEACHERS).
 */
export const hydrateTeachersFromDirectory = async ({ force = false } = {}) => {
    if (!force && Array.isArray(teacherRoster) && teacherRoster.length) return true
    if (teacherRosterHydrating) return teacherRosterHydrating

    teacherRosterHydrating = (async () => {
        if (!canUseEmployeeDirectoryApi()) {
            teacherRoster = apiCatalogMode() ? [] : null
            teacherRosterStatus = 'idle'
            emitUpdated()
            return false
        }
        teacherRosterStatus = 'loading'
        try {
            const [{ records }] = await Promise.all([loadEmployeeDirectory(), hydrateMasterSubjects()])
            const allocatedIds = new Set(getAllocations().map((item) => String(item.employeeId)))
            const teachers = records
                .filter(({ row, detail }) => {
                    const id = String(row?.employeeId || row?.id || '')
                    return isAllocatableTeacherRecord(row, detail) || allocatedIds.has(id)
                })
                .map(mapDirectoryRecordToTeacher)
                .filter((item) => item.employeeId)

            if (teachers.length) {
                teacherRosterStatus = 'ready'
                setTeacherRoster(teachers)
                return true
            }
            // Empty directory: keep [] so getters never fall through to DEMO_TEACHERS.
            teacherRoster = []
            teacherRosterStatus = 'empty'
            emitUpdated()
            return false
        } catch {
            teacherRoster = []
            teacherRosterStatus = 'error'
            emitUpdated()
            return false
        } finally {
            teacherRosterHydrating = null
        }
    })()

    return teacherRosterHydrating
}

const emptyAllocation = () => ({
    status: 'Not Allocated',
    classTeacher: null,
    teachingClasses: [],
    subjects: [],
    mappings: [],
})

/** Intentional offline demo only — never used when the academics API is expected. */
const DEMO_ALLOCATIONS = [
    {
        employeeId: 'TEA-1001',
        status: 'Active',
        classTeacher: { academicYear: '2026–2027', className: 'Grade 10', section: 'A' },
        teachingClasses: ['Grade 9', 'Grade 10'],
        subjects: ['Mathematics'],
        mappings: [
            { id: 'MAP-001', className: 'Grade 9', section: 'A', subject: 'Mathematics' },
            { id: 'MAP-002', className: 'Grade 10', section: 'A', subject: 'Mathematics' },
        ],
    },
]

let apiMemoryAllocations = null
// idle | loading | ready | error — server mode only. ready+[] means a valid empty collection.
let allocationHydrateStatus = 'idle'
let allocationHydrateError = ''
let allocationSaveInFlight = false
let lastConfirmedServerAllocations = null

const usesApiMemory = () => canUseAcademicsApi()

const purgeBrowserCopies = () => {
    try {
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(STORAGE_KEY)
    } catch {
        /* ignore */
    }
}

const cleanList = (rows) => (Array.isArray(rows) ? rows.map(stripAcademicsMeta) : [])

export const getAllocationHydrateStatus = () => allocationHydrateStatus
export const getAllocationHydrateError = () => allocationHydrateError
export const isAllocationSaveInFlight = () => allocationSaveInFlight
export const canSaveTeacherAllocations = () => {
    if (!usesApiMemory()) return true
    return allocationHydrateStatus === 'ready' && Array.isArray(apiMemoryAllocations) && !allocationSaveInFlight
}

export const clearTeacherAllocationMemory = () => {
    apiMemoryAllocations = null
    lastConfirmedServerAllocations = null
    allocationHydrateStatus = 'idle'
    allocationHydrateError = ''
    emitUpdated()
}

export const hydrateTeacherAllocationsFromApi = async ({ force = false } = {}) => {
    if (!canUseAcademicsApi()) {
        allocationHydrateStatus = 'idle'
        allocationHydrateError = ''
        return false
    }
    if (!force && allocationHydrateStatus === 'ready' && Array.isArray(apiMemoryAllocations)) {
        return true
    }
    allocationHydrateStatus = 'loading'
    allocationHydrateError = ''
    emitUpdated()
    try {
        const rows = await listAcademicsCollectionApi('teacher-allocations')
        const cleaned = cleanList(Array.isArray(rows) ? rows : [])
        apiMemoryAllocations = cleaned
        lastConfirmedServerAllocations = cleaned.map((row) => ({ ...row }))
        allocationHydrateStatus = 'ready'
        allocationHydrateError = ''
        purgeBrowserCopies()
        emitUpdated()
        return true
    } catch (error) {
        // CA-05: do not treat a failed load as an empty collection (would wipe on save).
        apiMemoryAllocations = null
        allocationHydrateStatus = 'error'
        allocationHydrateError = error?.message || 'Could not load teacher allocations from the server.'
        emitUpdated()
        return false
    }
}

export const getAllocations = () => {
    if (usesApiMemory() || apiCatalogMode()) {
        // CA-03: never surface demo rows as live allocations when API mode is on.
        if (!Array.isArray(apiMemoryAllocations)) return []
        return [...apiMemoryAllocations]
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return []
}

/** True when offline demo allocations would previously apply — always false (demos removed). */
export const isUsingDemoAllocations = () => false

export const saveAllocations = async (records) => {
    const list = Array.isArray(records) ? records : []
    if (usesApiMemory()) {
        if (!canSaveTeacherAllocations()) {
            return {
                success: false,
                errors: [
                    allocationHydrateStatus === 'error'
                        ? (allocationHydrateError || 'Allocations have not loaded. Retry before saving.')
                        : 'Wait for teacher allocations to finish loading before saving.',
                ],
            }
        }
        const previous = Array.isArray(lastConfirmedServerAllocations)
            ? lastConfirmedServerAllocations.map((row) => ({ ...row }))
            : []
        allocationSaveInFlight = true
        apiMemoryAllocations = list
        emitUpdated()
        try {
            const saved = await replaceAcademicsCollectionApi('teacher-allocations', cleanList(list))
            const cleaned = cleanList(Array.isArray(saved) ? saved : list)
            apiMemoryAllocations = cleaned
            lastConfirmedServerAllocations = cleaned.map((row) => ({ ...row }))
            allocationSaveInFlight = false
            emitUpdated()
            return { success: true, records: cleaned }
        } catch (error) {
            apiMemoryAllocations = previous
            lastConfirmedServerAllocations = previous.map((row) => ({ ...row }))
            allocationSaveInFlight = false
            emitUpdated()
            return {
                success: false,
                errors: [error?.message || 'Could not save teacher allocations. Changes were not kept.'],
            }
        }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    emitUpdated()
    return { success: true, records: list }
}

export const getTeacherById = (employeeId) => {
    const key = String(employeeId || '')
    return getTeachers().find((item) => String(item.employeeId) === key) ?? null
}

export const getAllocationByEmployeeId = (employeeId) =>
    getAllocations().find((item) => String(item.employeeId) === String(employeeId)) ?? null

export const getTeacherAllocationRow = (teacher) => {
    const allocation = getAllocationByEmployeeId(teacher.employeeId) ?? emptyAllocation()
    const classTeacherLabel = allocation.classTeacher
        ? `${allocation.classTeacher.className} - ${allocation.classTeacher.section}`
        : '—'

    return {
        ...teacher,
        allocation,
        classTeacherLabel,
        teachingClassesLabel: allocation.teachingClasses.length
            ? allocation.teachingClasses.join(', ')
            : '—',
        subjectsLabel: allocation.subjects.length ? allocation.subjects.join(', ') : '—',
        status: allocation.status,
    }
}

export const getTeacherAllocationRows = () =>
    getTeachers().map((teacher) => getTeacherAllocationRow(teacher))

/** True when the list is still the offline demo TEA-* seed (not HR / not API mode). */
export const isUsingDemoTeacherRoster = () => false

export const emptyTeacherAllocationFilters = {
    search: '',
    department: '',
    className: '',
    subject: '',
    status: '',
}

export const filterTeacherAllocationRows = (rows, filters) => {
    const search = filters.search.trim().toLowerCase()

    return rows.filter((row) => {
        if (filters.department && row.department !== filters.department) return false
        if (filters.status && row.status !== filters.status) return false

        if (filters.className) {
            const inTeaching = row.allocation.teachingClasses.includes(filters.className)
            const inClassTeacher = row.allocation.classTeacher?.className === filters.className
            const inMappings = row.allocation.mappings.some((m) => m.className === filters.className)
            if (!inTeaching && !inClassTeacher && !inMappings) return false
        }

        if (filters.subject) {
            const inSubjects = row.allocation.subjects.includes(filters.subject)
            const inMappings = row.allocation.mappings.some((m) => m.subject === filters.subject)
            if (!inSubjects && !inMappings) return false
        }

        if (search) {
            const haystack = `${row.employeeId} ${row.name} ${row.department} ${row.designation} ${row.classTeacherLabel} ${row.teachingClassesLabel} ${row.subjectsLabel}`.toLowerCase()
            if (!haystack.includes(search)) return false
        }

        return true
    })
}

const mappingKey = (className, section, subject) => `${className}|${section}|${subject}`

export const validateAllocation = (payload, employeeId) => {
    const errors = []
    const allAllocations = getAllocations().filter((item) => item.employeeId !== employeeId)

    if (!payload.teachingClasses?.length) {
        errors.push('At least one teaching class must be assigned.')
    }

    if (!payload.subjects?.length) {
        errors.push('At least one subject must be assigned.')
    }

    const teachingSet = new Set(payload.teachingClasses ?? [])
    if (teachingSet.size !== (payload.teachingClasses?.length ?? 0)) {
        errors.push('Duplicate teaching classes are not allowed.')
    }

    const subjectSet = new Set(payload.subjects ?? [])
    if (subjectSet.size !== (payload.subjects?.length ?? 0)) {
        errors.push('Duplicate subjects are not allowed.')
    }

    if (payload.classTeacher?.className && payload.classTeacher?.section) {
        const { academicYear, className, section } = payload.classTeacher
        const conflict = allAllocations.find(
            (item) =>
                item.status === 'Active'
                && item.classTeacher
                && item.classTeacher.academicYear === academicYear
                && item.classTeacher.className === className
                && item.classTeacher.section === section,
        )
        if (conflict) {
            errors.push(`Class Teacher for ${className} Section ${section} is already assigned to another teacher.`)
        }
    }

    const ownMappingKeys = new Set()
    ;(payload.mappings ?? []).forEach((row) => {
        if (!row.className || !row.section || !row.subject) return
        const key = mappingKey(row.className, row.section, row.subject)
        if (ownMappingKeys.has(key)) {
            errors.push(`Duplicate mapping: ${row.className} Section ${row.section} — ${row.subject}.`)
        }
        ownMappingKeys.add(key)

        const conflict = allAllocations.find(
            (item) =>
                item.status === 'Active'
                && item.mappings.some(
                    (m) =>
                        m.className === row.className
                        && m.section === row.section
                        && m.subject === row.subject,
                ),
        )
        if (conflict) {
            errors.push(`${row.className} Section ${row.section} — ${row.subject} is already assigned to another teacher.`)
        }
    })

    return { valid: errors.length === 0, errors }
}

export const saveTeacherAllocation = async (employeeId, payload) => {
    const validation = validateAllocation(payload, employeeId)
    if (!validation.valid) return { success: false, errors: validation.errors }

    const teacher = getTeacherById(employeeId)
    const record = {
        employeeId,
        email: teacher?.email || '',
        status: payload.status || 'Active',
        classTeacher: payload.classTeacher?.className ? payload.classTeacher : null,
        teachingClasses: payload.teachingClasses ?? [],
        subjects: payload.subjects ?? [],
        mappings: (payload.mappings ?? []).filter((row) => row.className && row.section && row.subject),
    }

    const allocations = getAllocations()
    const existingIndex = allocations.findIndex((item) => item.employeeId === employeeId)
    const updated = [...allocations]

    if (existingIndex >= 0) {
        updated[existingIndex] = record
    } else {
        updated.push(record)
    }

    const saved = await saveAllocations(updated)
    if (!saved.success) return { success: false, errors: saved.errors || ['Save failed.'] }
    return { success: true, record }
}

export const removeTeacherAllocation = async (employeeId) => {
    const allocations = getAllocations()
    const updated = allocations.map((item) =>
        item.employeeId === employeeId ? { ...emptyAllocation(), employeeId, email: item.email || '' } : item,
    )
    const saved = await saveAllocations(updated)
    if (!saved.success) return { success: false, errors: saved.errors || ['Remove failed.'], records: getAllocations() }
    return { success: true, records: saved.records || updated }
}

export const createEmptyMappingRow = () => ({
    id: `MAP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    className: '',
    section: '',
    subject: '',
})

export const defaultAllocationForm = () => ({
    status: 'Active',
    classTeacher: { academicYear: ACADEMIC_YEARS[0], className: '', section: '' },
    teachingClasses: [],
    subjects: [],
    mappings: [createEmptyMappingRow()],
})
