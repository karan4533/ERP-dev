const STORAGE_KEY = 'schoolerp-academics-catalog'

/** Fired after Class Details from the API are mirrored so open screens can refresh dropdowns. */
export const CLASS_CATALOG_UPDATED_EVENT = 'schoolerp-class-catalog-updated'

const emitClassCatalogUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(CLASS_CATALOG_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

const emptyCatalog = () => ({
    classes: [],
    sections: [],
    subjects: [],
    assignments: [],
    classDetails: [],
})

const classKey = (value) => String(value || '').trim().toLowerCase().replace(/^(grade|class)\s+/, '')

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

/**
 * Active section names for one class from the mirrored Class Details catalog.
 * Falls back to the flat campus section list when the class is not in the catalog yet.
 */
export const getSectionsForClass = (className) => {
    const key = classKey(className)
    if (!key) return getSections()
    const detail = getClassDetails().find((item) => classKey(item.className) === key)
    if (!detail) return getSections()
    const names = (detail.sections || [])
        .map((section) => String(section?.name || '').trim().toUpperCase())
        .filter(Boolean)
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

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

/**
 * Mirrors the server's classes and sections into this browser catalog so the screens that still
 * read it (student allocation, assigned classes, activities, lesson plans, documents) offer the
 * same classes. The server is the source of truth for a mirrored class: its name, sections,
 * capacities, room and class teacher all come from the server. `records` must be the complete list
 * of ACTIVE classes of the current academic year, so an API-sourced class that is no longer in it
 * (deactivated, deleted or from an old year) leaves the browser catalog and the other screens'
 * dropdowns. Entries created only in the browser (no `apiId`) are never removed. Writes only when
 * something changed.
 */
export const mirrorApiClassDetails = (records) => {
    const catalog = loadCatalog()
    const before = JSON.stringify(catalog)

    const mirroredIds = new Set((records || []).map((record) => String(record.id)))
    const isStale = (item) => item.source === 'api' && item.apiId && !mirroredIds.has(String(item.apiId))
    const stale = catalog.classDetails.filter(isStale)
    catalog.classDetails = catalog.classDetails.filter((item) => !isStale(item))

    // The flat class and section lists (getClasses, getSections) feed the other screens' dropdowns and
    // only ever grow, so a class the server no longer lists must leave them too, unless something that
    // is still here uses the name.
    if (stale.length > 0) {
        const keepClass = new Set()
        const keepSection = new Set()
        const keep = (className, sectionName) => {
            if (className) keepClass.add(String(className).toLowerCase())
            if (sectionName) keepSection.add(String(sectionName).toUpperCase())
        }
        catalog.classDetails.forEach((detail) => {
            keep(detail.className)
            ;(detail.sections || []).forEach((section) => keep(null, section?.name))
        })
        ;(records || []).forEach((record) => {
            keep(record.className)
            ;(record.sections || []).forEach((section) => keep(null, section.name))
        })
        catalog.assignments.forEach((item) => keep(item.className, item.section))
        const goneClasses = new Set(stale.map((item) => String(item.className).toLowerCase()))
        const goneSections = new Set(
            stale.flatMap((item) => (item.sections || []).map((section) => String(section.name).toUpperCase())),
        )
        catalog.classes = catalog.classes.filter(
            (name) => !goneClasses.has(String(name).toLowerCase()) || keepClass.has(String(name).toLowerCase()),
        )
        catalog.sections = catalog.sections.filter(
            (name) => !goneSections.has(String(name).toUpperCase()) || keepSection.has(String(name).toUpperCase()),
        )
    }

    ;(records || []).forEach((record) => {
        const className = String(record.className || '').trim()
        if (!className) return
        const index = catalog.classDetails.findIndex(
            (item) => String(item.className).toLowerCase() === className.toLowerCase(),
        )
        const local = index >= 0 ? catalog.classDetails[index] : null
        const sections = record.sections || []
        const taught = sections.find((section) => section.classTeacherName)
        const roomed = sections.find((section) => section.roomNumber)
        const now = new Date().toISOString()
        const next = {
            classTeacherEmail: '',
            ...local,
            id: local?.id || `CD-API-${String(record.id).slice(0, 8)}`,
            className,
            displayName: local?.displayName || className,
            sections: sections.map((section) => ({
                name: String(section.name).toUpperCase(),
                capacity: section.capacity ? String(section.capacity) : '',
            })),
            classCapacity: record.capacity ? String(record.capacity) : '',
            classTeacher: taught?.classTeacherName || '',
            classRoomNumber: roomed?.roomNumber || '',
            source: 'api',
            apiId: record.id,
            academicYearId: record.academicYearId || '',
            createdAt: local?.createdAt || now,
            updatedAt: local?.updatedAt || now,
        }
        if (index >= 0) catalog.classDetails[index] = next
        else catalog.classDetails = [...catalog.classDetails, next]
    })

    syncClassAndSectionLists(catalog)
    if (JSON.stringify(catalog) !== before) {
        saveCatalog(catalog)
        emitClassCatalogUpdated()
    } else {
        // Still notify listeners so a late-mounted screen after login hydrate can re-read.
        emitClassCatalogUpdated()
    }
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
