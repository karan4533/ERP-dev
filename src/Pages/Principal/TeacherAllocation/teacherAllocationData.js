const STORAGE_KEY = 'principal-teacher-allocation'

export const ROUTE_BASE = '/principal/academic/teacher-allocation'

export const ALLOCATION_STATUSES = ['Active', 'Inactive', 'Not Allocated']

export const ACADEMIC_YEARS = ['2026–2027', '2025–2026']

export const GRADES = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12',
]

export const SECTIONS = ['A', 'B', 'C']

export const SUBJECTS = [
    'Mathematics',
    'English',
    'Science',
    'Tamil',
    'Social Science',
    'Computer Science',
]

export const DEPARTMENTS = [
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

export const TEACHERS = [
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

const emptyAllocation = () => ({
    status: 'Not Allocated',
    classTeacher: null,
    teachingClasses: [],
    subjects: [],
    mappings: [],
})

const DEFAULT_ALLOCATIONS = [
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
    {
        employeeId: 'TEA-1002',
        status: 'Active',
        classTeacher: null,
        teachingClasses: ['Grade 1', 'Grade 2', 'Grade 5'],
        subjects: ['English', 'Tamil'],
        mappings: [
            { id: 'MAP-003', className: 'Grade 1', section: 'A', subject: 'English' },
            { id: 'MAP-004', className: 'Grade 2', section: 'B', subject: 'English' },
            { id: 'MAP-005', className: 'Grade 5', section: 'A', subject: 'Tamil' },
        ],
    },
    {
        employeeId: 'TEA-1003',
        status: 'Not Allocated',
        classTeacher: null,
        teachingClasses: [],
        subjects: [],
        mappings: [],
    },
    {
        employeeId: 'TEA-1004',
        status: 'Not Allocated',
        classTeacher: null,
        teachingClasses: [],
        subjects: [],
        mappings: [],
    },
    {
        employeeId: 'TEA-1005',
        status: 'Inactive',
        classTeacher: { academicYear: '2025–2026', className: 'Grade 8', section: 'B' },
        teachingClasses: ['Grade 8'],
        subjects: ['Social Science'],
        mappings: [
            { id: 'MAP-006', className: 'Grade 8', section: 'B', subject: 'Social Science' },
        ],
    },
]

export const getAllocations = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return [...DEFAULT_ALLOCATIONS]
}

export const saveAllocations = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getTeacherById = (employeeId) =>
    TEACHERS.find((item) => item.employeeId === employeeId) ?? null

export const getAllocationByEmployeeId = (employeeId) =>
    getAllocations().find((item) => item.employeeId === employeeId) ?? null

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
    TEACHERS.map((teacher) => getTeacherAllocationRow(teacher))

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

export const saveTeacherAllocation = (employeeId, payload) => {
    const validation = validateAllocation(payload, employeeId)
    if (!validation.valid) return { success: false, errors: validation.errors }

    const record = {
        employeeId,
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

    saveAllocations(updated)
    return { success: true, record }
}

export const removeTeacherAllocation = (employeeId) => {
    const allocations = getAllocations()
    const updated = allocations.map((item) =>
        item.employeeId === employeeId ? { ...emptyAllocation(), employeeId } : item,
    )
    saveAllocations(updated)
    return updated
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
