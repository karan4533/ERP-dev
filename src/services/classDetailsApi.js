import { ApiError, apiRequest, getAccessToken, isApiClassDetailsEnabled } from './apiClient'
import { mirrorApiClassDetails } from '../Common/RBAC/academicsCatalogData'

/** True when Class Details should use the masters API (flag on and a real backend session). */
export const canUseClassDetailsApi = () => isApiClassDetailsEnabled() && Boolean(getAccessToken())

const sortByNumberedName = (a, b) => a.localeCompare(b, undefined, { numeric: true })

const normalizeYear = (year) => ({
    id: year.id,
    name: year.name,
    isCurrent: Boolean(year.is_current),
    isActive: year.is_active !== false,
})

const normalizeSection = (section) => ({
    id: section.id,
    name: section.name,
    isActive: section.is_active !== false,
    capacity: section.capacity ?? null,
    roomNumber: section.room_number || '',
    classTeacherUserId: section.class_teacher_user_id || '',
    // Display only, resolved by the server from the login (and its HR record); never stored on the section.
    classTeacherName: section.class_teacher_name || section.class_teacher_email || '',
})

/**
 * Loads academic years, classes and sections in parallel and joins them. Any failure rejects, so the
 * screen shows one clear error with a retry instead of a half-filled table.
 *
 * With `academicYearId` the server does the filtering (GET /masters/classes?academic_year_id=).
 * `includeInactive` also returns deactivated classes. Only the complete, active, current-year list is
 * mirrored into the local catalog that other screens read, so a deactivated class leaves their
 * dropdowns and a class from an old year does not shadow this year's class of the same name.
 */
export const loadClassDirectory = async ({ academicYearId = '', includeInactive = false } = {}) => {
    const params = []
    if (academicYearId) params.push(`academic_year_id=${encodeURIComponent(academicYearId)}`)
    if (includeInactive) params.push('include_inactive=true')
    const query = params.length ? `?${params.join('&')}` : ''
    const [years, classes, sections] = await Promise.all([
        apiRequest('/masters/academic-years'),
        apiRequest(`/masters/classes${query}`),
        // All sections, so a class's deactivated sections can be shown and reactivated; the screens
        // decide what to display.
        apiRequest('/masters/sections?include_inactive=true'),
    ])

    const yearList = (Array.isArray(years) ? years : []).map(normalizeYear)
    const yearNameById = new Map(yearList.map((year) => [year.id, year.name]))
    const sectionsByClass = new Map()
    ;(Array.isArray(sections) ? sections : []).forEach((section) => {
        const list = sectionsByClass.get(section.class_id) || []
        list.push(normalizeSection(section))
        sectionsByClass.set(section.class_id, list)
    })

    const records = (Array.isArray(classes) ? classes : [])
        .map((item) => ({
            id: item.id,
            className: item.name,
            displayName: item.name,
            academicYearId: item.academic_year_id || '',
            academicYear: item.academic_year_id ? yearNameById.get(item.academic_year_id) || 'Unknown year' : '—',
            isActive: item.is_active !== false,
            capacity: item.capacity ?? null, // derived by the server: the sum of active section capacities
            sections: (sectionsByClass.get(item.id) || []).sort((a, b) => sortByNumberedName(a.name, b.name)),
        }))
        .sort((a, b) => sortByNumberedName(a.className, b.className))

    const filtered = Boolean(academicYearId) || includeInactive
    if (!filtered) {
        const currentYear = yearList.find((year) => year.isCurrent)
        const mirrored = records
            .filter((record) => record.isActive && (!currentYear || record.academicYearId === currentYear.id))
            .map((record) => ({ ...record, sections: record.sections.filter((section) => section.isActive) }))
        mirrorApiClassDetails(mirrored)
    }
    return { years: yearList, records, filtered }
}

let hydratePromise = null
let catalogHydrated = false

/** Best-effort: keep the dropdowns on other screens in step after a save. Never throws. */
export const refreshClassCatalog = () => {
    catalogHydrated = false
    hydratePromise = null
    return loadClassDirectory()
        .then((result) => {
            catalogHydrated = Boolean(result)
            return result
        })
        .catch(() => null)
}

/**
 * Loads Class Details once and mirrors them into the browser catalog so Principal /
 * Coordinator / Teacher / FO dropdowns match Admin. Safe to call from Auth and forms.
 */
export const ensureClassCatalogHydrated = () => {
    if (!canUseClassDetailsApi()) return Promise.resolve(null)
    if (catalogHydrated) return Promise.resolve(true)
    if (!hydratePromise) {
        hydratePromise = loadClassDirectory()
            .then((result) => {
                catalogHydrated = Boolean(result)
                return result
            })
            .catch(() => {
                catalogHydrated = false
                return null
            })
            .finally(() => {
                hydratePromise = null
            })
    }
    return hydratePromise
}

/** List academic years (normalized for admin / star-ratings / fee campus pickers). */
export const listAcademicYears = async () => {
    const rows = await apiRequest('/masters/academic-years')
    return (Array.isArray(rows) ? rows : []).map(normalizeYear)
}

export const createAcademicYear = async ({ name, startDate = '', endDate = '', isCurrent = false } = {}) => {
    const body = {
        name: String(name || '').trim(),
        is_current: Boolean(isCurrent),
    }
    if (startDate) body.start_date = startDate
    if (endDate) body.end_date = endDate
    const created = await apiRequest('/masters/academic-years', { method: 'POST', body })
    return normalizeYear(created)
}

export const setAcademicYearCurrent = async (yearId) => {
    const updated = await apiRequest(`/masters/academic-years/${encodeURIComponent(yearId)}/set-current`, {
        method: 'POST',
        body: {},
    })
    return normalizeYear(updated)
}

/** Active teacher and coordinator logins that can be picked as a class teacher (needs masters.write). */
export const loadClassTeacherOptions = async () => {
    const rows = await apiRequest('/masters/class-teacher-options')
    return (Array.isArray(rows) ? rows : []).map((row) => ({
        userId: row.user_id,
        email: row.email,
        name: row.name || row.email,
        role: row.role,
    }))
}

const cleanSectionNames = (sections) => {
    const seen = new Set()
    const names = []
    ;(sections || []).forEach((section) => {
        const name = String(typeof section === 'string' ? section : section?.name || '')
            .trim()
            .toUpperCase()
        if (name && !seen.has(name)) {
            seen.add(name)
            names.push(name)
        }
    })
    return names
}

const errorMessage = (error) => (error instanceof ApiError || error?.message ? error.message : 'Request failed.')

/**
 * Capacity is whole seats, 1 to 1000, or empty (not set). Returns { value } (null when empty) or
 * { message } when invalid, so a bad number is refused before any request is made.
 */
export const parseCapacity = (raw) => {
    const text = String(raw ?? '').trim()
    if (!text) return { value: null }
    if (!/^\d+$/.test(text)) return { message: 'Capacity must be a whole number.' }
    const value = Number(text)
    if (value < 1 || value > 1000) return { message: 'Capacity must be between 1 and 1000.' }
    return { value }
}

const sectionBody = (section) => {
    const body = {}
    const capacity = parseCapacity(section.capacity)
    if (capacity.message) throw new Error(`Section ${String(section.name || '').toUpperCase()}: ${capacity.message}`)
    if (capacity.value !== null) body.capacity = capacity.value
    const room = String(section.roomNumber || '').trim()
    if (room) body.room_number = room
    if (section.classTeacherUserId) body.class_teacher_user_id = section.classTeacherUserId
    return body
}

/**
 * Creates a class and its sections for ONE academic year, safe to repeat. A class is one row per name
 * per year, so the lookup is by name AND year: the same name in another year is a different class.
 * If the class already exists, only the sections that are still missing are added; sections the server
 * already has (409) count as present and are left exactly as they are (edit them from the list). A
 * deactivated class is refused with a clear message instead of a confusing "already exists".
 *
 * Resolves with { classId, className, classCreated, sectionsCreated, sectionsExisting, failures }.
 * `failures` is [{ name, message }]; the class itself failing throws.
 */
export const saveClassWithSections = async ({ className, sections, academicYearId = '' }) => {
    const name = String(className || '').trim()
    const sectionNames = cleanSectionNames(sections)
    if (!name) throw new Error('Class is required.')
    if (sectionNames.length === 0) throw new Error('Add at least one section.')

    // Validate every section's inputs before the first request, so nothing is half-saved by a typo.
    const detailsByName = new Map()
    ;(sections || []).forEach((section) => {
        if (typeof section === 'string') return
        const key = String(section?.name || '').trim().toUpperCase()
        if (key && !detailsByName.has(key)) detailsByName.set(key, sectionBody(section))
    })

    let yearId = academicYearId
    if (!yearId) {
        const years = await apiRequest('/masters/academic-years')
        const current = (Array.isArray(years) ? years : []).find((year) => year.is_current && year.is_active !== false)
        if (!current) throw new Error('There is no current academic year. Choose an academic year first.')
        yearId = current.id
    }

    const inYear = await apiRequest(`/masters/classes?academic_year_id=${encodeURIComponent(yearId)}&include_inactive=true`)
    let target = (Array.isArray(inYear) ? inYear : []).find(
        (item) => String(item.name).toLowerCase() === name.toLowerCase(),
    )
    if (target && target.is_active === false) {
        throw new Error(`Class ${target.name} is deactivated in this academic year. Reactivate it from the class list, then add sections.`)
    }

    const result = {
        classId: '',
        className: name,
        classCreated: false,
        sectionsCreated: [],
        sectionsExisting: [],
        failures: [],
    }

    if (!target) {
        // No `section` here: every section, the first included, is created below with its own details.
        target = await apiRequest('/masters/classes', { method: 'POST', body: { name, academic_year_id: yearId } })
        result.classCreated = true
    }
    result.classId = target.id
    result.className = target.name

    for (const sectionName of sectionNames) {
        try {
            await apiRequest('/masters/sections', {
                method: 'POST',
                body: { class_id: target.id, name: sectionName, ...(detailsByName.get(sectionName) || {}) },
            })
            result.sectionsCreated.push(sectionName)
        } catch (error) {
            if (error?.status === 409) result.sectionsExisting.push(sectionName)
            else result.failures.push({ name: sectionName, message: errorMessage(error) })
        }
    }

    await refreshClassCatalog()
    return result
}

/**
 * Edits one section. Send only what changes: `capacity` and `classTeacherUserId` accept null to clear,
 * `roomNumber` accepts '' to clear. Resolves with the saved section. The server checks permission,
 * campus, the teacher's role and that a section in use is not renamed.
 */
export const updateSectionDetails = async (sectionId, changes) => {
    const body = {}
    if ('name' in changes) body.name = String(changes.name || '').trim()
    if ('isActive' in changes) body.is_active = Boolean(changes.isActive)
    if ('capacity' in changes) {
        const capacity = parseCapacity(changes.capacity)
        if (capacity.message) throw new Error(capacity.message)
        body.capacity = capacity.value
    }
    if ('roomNumber' in changes) body.room_number = String(changes.roomNumber || '').trim() || null
    if ('classTeacherUserId' in changes) body.class_teacher_user_id = changes.classTeacherUserId || null
    const saved = await apiRequest(`/masters/sections/${sectionId}`, { method: 'PATCH', body })
    await refreshClassCatalog()
    return saved
}

/** Adds one section to an existing class (same fields as when creating a class). */
export const addSectionToClass = async (classId, section) => {
    const name = String(section?.name || '').trim().toUpperCase()
    if (!name) throw new Error('Section is required.')
    const saved = await apiRequest('/masters/sections', {
        method: 'POST',
        body: { class_id: classId, name, ...sectionBody({ ...section, name }) },
    })
    await refreshClassCatalog()
    return saved
}

/** Deactivates (false) or reactivates (true) a class. Its records stay linked to it. */
export const setClassActive = async (classId, isActive) => {
    const saved = await apiRequest(`/masters/classes/${classId}`, { method: 'PATCH', body: { is_active: Boolean(isActive) } })
    await refreshClassCatalog()
    return saved
}

/** Permanently deletes a class nothing refers to. The server refuses (409) and says what uses it. */
export const deleteClass = async (classId) => {
    const deleted = await apiRequest(`/masters/classes/${classId}`, { method: 'DELETE' })
    await refreshClassCatalog()
    return deleted
}

const normalizeSubject = (row) => ({
    id: String(row.id),
    code: row.code || '',
    name: row.name || '',
})

/** Campus subject masters (GET /masters/subjects). */
export const listSubjects = async () => {
    const rows = await apiRequest('/masters/subjects')
    return (Array.isArray(rows) ? rows : []).map(normalizeSubject)
}

/** Create a campus subject (POST /masters/subjects). */
export const createSubject = async ({ code, name }) => {
    const saved = await apiRequest('/masters/subjects', {
        method: 'POST',
        body: {
            code: String(code || '').trim().toUpperCase(),
            name: String(name || '').trim(),
        },
    })
    return normalizeSubject(saved)
}
