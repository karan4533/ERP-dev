const STORAGE_KEY = 'schoolerp-academics-catalog'

const emptyCatalog = () => ({
    classes: [],
    sections: [],
    subjects: [],
    assignments: [],
    classDetails: [],
})

const loadCatalog = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return {
                classes: Array.isArray(parsed.classes) ? parsed.classes : [],
                sections: Array.isArray(parsed.sections) ? parsed.sections : [],
                subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
                assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
                classDetails: Array.isArray(parsed.classDetails) ? parsed.classDetails : [],
            }
        }
    } catch {
        /* ignore */
    }
    return emptyCatalog()
}

const saveCatalog = (catalog) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog))
}

export const getClasses = () => loadCatalog().classes

export const getClassSelectOptions = () => {
    const labelByClass = new Map(
        getClassDetails().map((item) => [
            item.className.toLowerCase(),
            item.displayName || item.className,
        ]),
    )
    return getClasses().map((className) => ({
        value: className,
        label: labelByClass.get(className.toLowerCase()) || className,
    }))
}

export const getClassDisplayLabel = (className) => {
    if (!className) return '—'
    if (className === 'All Students') return 'All Students'
    const match = getClassDetails().find(
        (item) => item.className.toLowerCase() === String(className).toLowerCase(),
    )
    return match?.displayName || className
}

export const getSections = () => loadCatalog().sections

export const getSubjects = () => loadCatalog().subjects

export const getAssignments = () => loadCatalog().assignments

export const getClassDetails = () => loadCatalog().classDetails

export const getClassDetailsById = (id) =>
    getClassDetails().find((item) => item.id === id) ?? null

const syncClassAndSectionLists = (catalog) => {
    const classSet = new Set(catalog.classes)
    const sectionSet = new Set(catalog.sections)

    catalog.classDetails.forEach((detail) => {
        if (detail.className) classSet.add(String(detail.className))
        ;(detail.sections || []).forEach((section) => {
            if (section?.name) sectionSet.add(String(section.name).toUpperCase())
        })
    })

    catalog.classes = [...classSet].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
    )
    catalog.sections = [...sectionSet].sort()
}

export const saveClassDetails = (payload) => {
    const className = String(payload.className || '').trim()
    const displayName = String(payload.displayName || className).trim() || className
    const sections = (payload.sections || [])
        .map((section) => ({
            name: String(section.name || '').trim().toUpperCase(),
            capacity: String(section.capacity || '').trim(),
        }))
        .filter((section) => section.name)

    if (!className) {
        return { success: false, message: 'Class is required.' }
    }
    if (sections.length === 0) {
        return { success: false, message: 'Add at least one section.' }
    }

    const catalog = loadCatalog()
    const existingIndex = catalog.classDetails.findIndex(
        (item) => item.className.toLowerCase() === className.toLowerCase(),
    )

    const record = {
        id: existingIndex >= 0
            ? catalog.classDetails[existingIndex].id
            : `CD-${String(catalog.classDetails.length + 1).padStart(4, '0')}`,
        className,
        displayName,
        classTeacher: String(payload.classTeacher || '').trim(),
        classTeacherEmail: String(payload.classTeacherEmail || '').trim().toLowerCase(),
        classCapacity: String(payload.classCapacity || '').trim(),
        classRoomNumber: String(payload.classRoomNumber || '').trim(),
        sections,
        createdAt: existingIndex >= 0
            ? catalog.classDetails[existingIndex].createdAt
            : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
        catalog.classDetails[existingIndex] = record
    } else {
        catalog.classDetails = [...catalog.classDetails, record]
    }

    syncClassAndSectionLists(catalog)
    saveCatalog(catalog)
    return { success: true, record }
}

export const removeClassDetails = (id) => {
    const catalog = loadCatalog()
    const target = catalog.classDetails.find((item) => item.id === id)
    if (!target) return { success: false, message: 'Class not found.' }

    catalog.classDetails = catalog.classDetails.filter((item) => item.id !== id)
    catalog.assignments = catalog.assignments.filter((item) => item.className !== target.className)

    // Rebuild class/section lists from remaining details + leftover standalone entries used by subjects/assignments
    const remainingClasses = new Set(catalog.classDetails.map((item) => item.className))
    const remainingSections = new Set()
    catalog.classDetails.forEach((detail) => {
        ;(detail.sections || []).forEach((section) => {
            if (section?.name) remainingSections.add(section.name)
        })
    })
    catalog.assignments.forEach((item) => {
        if (item.className) remainingClasses.add(item.className)
        if (item.section) remainingSections.add(String(item.section).toUpperCase())
    })

    catalog.classes = [...remainingClasses].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
    )
    catalog.sections = [...remainingSections].sort()
    saveCatalog(catalog)
    return { success: true }
}

export const getAssignmentsForTeacher = (email) => {
    if (!email) return []
    const normalized = email.trim().toLowerCase()
    return getAssignments().filter(
        (item) => item.teacherEmail?.toLowerCase() === normalized,
    )
}

export const addClass = (className) => {
    const value = String(className).trim()
    if (!value) return { success: false, message: 'Class name is required.' }

    const catalog = loadCatalog()
    if (catalog.classes.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return { success: false, message: 'Class already exists.' }
    }

    catalog.classes = [...catalog.classes, value].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
    )
    saveCatalog(catalog)
    return { success: true }
}

export const removeClass = (className) => {
    const catalog = loadCatalog()
    catalog.classes = catalog.classes.filter((item) => item !== className)
    catalog.assignments = catalog.assignments.filter((item) => item.className !== className)
    saveCatalog(catalog)
    return { success: true }
}

export const addSection = (section) => {
    const value = String(section).trim().toUpperCase()
    if (!value) return { success: false, message: 'Section is required.' }

    const catalog = loadCatalog()
    if (catalog.sections.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return { success: false, message: 'Section already exists.' }
    }

    catalog.sections = [...catalog.sections, value].sort()
    saveCatalog(catalog)
    return { success: true }
}

export const removeSection = (section) => {
    const catalog = loadCatalog()
    catalog.sections = catalog.sections.filter((item) => item !== section)
    catalog.assignments = catalog.assignments.filter((item) => item.section !== section)
    saveCatalog(catalog)
    return { success: true }
}

export const addSubject = (subject) => {
    const value = String(subject).trim()
    if (!value) return { success: false, message: 'Subject is required.' }

    const catalog = loadCatalog()
    if (catalog.subjects.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return { success: false, message: 'Subject already exists.' }
    }

    catalog.subjects = [...catalog.subjects, value].sort()
    saveCatalog(catalog)
    return { success: true }
}

export const removeSubject = (subject) => {
    const catalog = loadCatalog()
    catalog.subjects = catalog.subjects.filter((item) => item !== subject)
    catalog.assignments = catalog.assignments.filter((item) => item.subject !== subject)
    saveCatalog(catalog)
    return { success: true }
}

export const addAssignment = ({ teacherEmail, teacherName, className, section, subject, classTeacher = 'No' }) => {
    if (!teacherEmail?.trim() || !className || !section || !subject) {
        return { success: false, message: 'Teacher, class, section, and subject are required.' }
    }

    const catalog = loadCatalog()
    const email = teacherEmail.trim().toLowerCase()
    const exists = catalog.assignments.some(
        (item) =>
            item.teacherEmail === email
            && item.className === className
            && item.section === section
            && item.subject === subject,
    )
    if (exists) {
        return { success: false, message: 'This assignment already exists.' }
    }

    const id = `AC-${String(catalog.assignments.length + 1).padStart(4, '0')}`
    catalog.assignments = [
        ...catalog.assignments,
        {
            id,
            teacherEmail: email,
            teacherName: teacherName?.trim() || '',
            className,
            section,
            subject,
            classTeacher: classTeacher === 'Yes' ? 'Yes' : 'No',
            totalStudents: 0,
        },
    ]
    saveCatalog(catalog)
    return { success: true, id }
}

export const removeAssignment = (id) => {
    const catalog = loadCatalog()
    catalog.assignments = catalog.assignments.filter((item) => item.id !== id)
    saveCatalog(catalog)
    return { success: true }
}

export const updateAssignmentStudentCounts = (getStudentCount) => {
    const catalog = loadCatalog()
    catalog.assignments = catalog.assignments.map((item) => ({
        ...item,
        totalStudents: getStudentCount(item.className, item.section),
    }))
    saveCatalog(catalog)
}
