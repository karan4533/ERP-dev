import { getStudentsList } from '../StudentDatabase/studentDatabaseData'
import {
    canUseAcademicsApi,
    listAcademicsCollectionApi,
    replaceAcademicsCollectionApi,
    stripAcademicsMeta,
} from '../../services/academicsApi'

export const MAX_STARS = 3

export const RATING_CATEGORY = 'Overall Performance'

export const SOY_MONTH_COUNT = 12

const COLLECTION = 'student-star-ratings'
const STORAGE_KEY = 'student-star-ratings-som'
export const SOM_RATINGS_UPDATED_EVENT = 'schoolerp-som-ratings-updated'

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

const getAcademicYearStartYear = (asOf = new Date()) => {
    const year = asOf.getFullYear()
    return asOf.getMonth() >= 5 ? year : year - 1
}

const buildAcademicYearLabel = (startYear) => `${startYear}-${startYear + 1}`

const buildAcademicYearMonths = (startYear) => {
    const months = []
    for (let offset = 0; offset < 12; offset += 1) {
        const monthIndex = (5 + offset) % 12
        const calendarYear = startYear + (5 + offset >= 12 ? 1 : 0)
        months.push(`${MONTH_NAMES[monthIndex]} ${calendarYear}`)
    }
    return months
}

const currentAyStart = getAcademicYearStartYear()

export const ACADEMIC_YEARS = [
    buildAcademicYearLabel(currentAyStart),
    buildAcademicYearLabel(currentAyStart - 1),
]

/** Full current + previous AY month labels (legacy helpers). */
export const ACADEMIC_YEAR_MONTHS = [
    ...buildAcademicYearMonths(currentAyStart - 1),
    ...buildAcademicYearMonths(currentAyStart),
]

export const parseSomMonthLabel = (monthLabel) => {
    const parts = String(monthLabel || '').trim().split(/\s+/)
    if (parts.length < 2) return null
    const year = Number(parts[parts.length - 1])
    const monthName = parts.slice(0, -1).join(' ')
    const monthIndex = MONTH_NAMES.indexOf(monthName)
    if (!Number.isFinite(year) || monthIndex < 0) return null
    return { year, monthIndex, monthName }
}

/** Current academic year months from June through the current calendar month (no future months). */
export const getEligibleSomMonths = (asOf = new Date()) => {
    const ayStart = getAcademicYearStartYear(asOf)
    const months = buildAcademicYearMonths(ayStart)
    const current = new Date(asOf.getFullYear(), asOf.getMonth(), 1)
    return months.filter((label) => {
        const parsed = parseSomMonthLabel(label)
        if (!parsed) return false
        const monthStart = new Date(parsed.year, parsed.monthIndex, 1)
        return monthStart.getTime() <= current.getTime()
    })
}

export const getDefaultSomMonth = (asOf = new Date()) => {
    const eligible = getEligibleSomMonths(asOf)
    const label = `${MONTH_NAMES[asOf.getMonth()]} ${asOf.getFullYear()}`
    if (eligible.includes(label)) return label
    return eligible[eligible.length - 1] || label
}

/** Month options for SOM add/filter: AY start → current month only. */
export const getSomMonthOptions = (asOf = new Date()) => getEligibleSomMonths(asOf)

/** @deprecated Use getSomMonthOptions / getEligibleSomMonths */
export const getAvailableSomMonths = () => {
    const months = [...new Set(readLocalRatings().map((item) => item.month))]
    const eligible = getEligibleSomMonths()
    return months
        .filter((month) => eligible.includes(month) || ACADEMIC_YEAR_MONTHS.includes(month))
        .sort((a, b) => ACADEMIC_YEAR_MONTHS.indexOf(a) - ACADEMIC_YEAR_MONTHS.indexOf(b))
}

/** Derive academic year label (June–May) from a SOM month label like "August 2026". */
export const academicYearFromMonthLabel = (monthLabel, fallback = ACADEMIC_YEARS[0]) => {
    const parsed = parseSomMonthLabel(monthLabel)
    if (!parsed) return fallback
    const startYear = parsed.monthIndex >= 5 ? parsed.year : parsed.year - 1
    return buildAcademicYearLabel(startYear)
}

export const getDefaultAcademicYear = (asOf = new Date()) =>
    buildAcademicYearLabel(getAcademicYearStartYear(asOf))

/** Normalize "2026-27", "2026/2027", "2026-2027" → "2026-2027". */
export const normalizeAcademicYearLabel = (value) => {
    const text = String(value || '').trim()
    const match = text.match(/(\d{4})\s*[-/]\s*(\d{2,4})/)
    if (!match) return text
    const start = Number(match[1])
    let end = Number(match[2])
    if (match[2].length === 2) end = Math.floor(start / 100) * 100 + end
    if (!Number.isFinite(start) || !Number.isFinite(end)) return text
    if (end < start) end = start + 1
    return `${start}-${end}`
}

export const ROUTE_BASE_BY_PREFIX = {
    teacher: '/teacher/star-ratings',
    coordinator: '/coordinator/star-ratings',
    principal: '/principal/star-ratings',
    director: '/director/star-ratings',
    admin: '/admin/star-ratings',
}

const buildSomRating = ({
    ratingId,
    month,
    academicYear,
    studentId,
    studentName,
    rollNumber,
    className,
    section,
    rating,
    description,
    ratedByRole = 'Teacher',
    attachmentFileId = null,
    attachmentName = '',
}) => {
    const stars = Number(rating)
    if (![1, 2, 3].includes(stars)) {
        throw new Error('Rating must be exactly 1, 2, or 3.')
    }
    return {
        id: ratingId,
        ratingId,
        month,
        academicYear,
        studentId: String(studentId),
        studentName,
        rollNumber,
        className,
        section,
        classSection: `${className}-${section}`,
        rating: stars,
        description: description || '',
        ratedByRole,
        attachmentFileId: attachmentFileId || null,
        attachmentName: attachmentName || '',
    }
}

const normalizeRating = (row) => {
    if (!row || typeof row !== 'object') return null
    const ratingId = String(row.ratingId || row.id || '').trim()
    if (!ratingId) return null
    const className = row.className || ''
    const section = row.section || ''
    const stars = Number(row.rating)
    if (![1, 2, 3].includes(stars)) return null
    return buildSomRating({
        ratingId,
        month: row.month || '',
        academicYear: row.academicYear || academicYearFromMonthLabel(row.month),
        studentId: row.studentId,
        studentName: row.studentName || '',
        rollNumber: row.rollNumber || '',
        className,
        section,
        rating: stars,
        description: row.description || '',
        ratedByRole: row.ratedByRole || 'Teacher',
        attachmentFileId: row.attachmentFileId || null,
        attachmentName: row.attachmentName || '',
    })
}

/** Normalize enrolled / list student → star-ratings row shape. */
export const mapStudentForStarRatings = (student) => {
    const className = student.className || student.class || ''
    const section = student.section || (student.classSection && student.classSection !== className ? student.classSection : '') || ''
    return {
        id: String(student.id),
        name: student.name || '',
        rollNumber: student.rollNumber || student.admissionNumber || '',
        className,
        section: section || 'A',
        classSection: section ? `${className}-${section}` : `${className}-A`,
    }
}

export const getStudents = (rows) => {
    const source = Array.isArray(rows) ? rows : getStudentsList()
    return source.map(mapStudentForStarRatings).filter((student) => student.className)
}

export const getClassSectionOptions = (rows) => {
    const sections = [...new Set(getStudents(rows).map((student) => student.classSection))]
    return sections.sort()
}

export const getStudentById = (studentId, rows) =>
    getStudents(rows).find((student) => student.id === studentId) ?? null

let apiMemory = null
let hydratePromise = null

const emitUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(SOM_RATINGS_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

const readLocalRatings = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) return parsed.map(normalizeRating).filter(Boolean)
        }
    } catch {
        /* ignore */
    }
    return []
}

const writeLocalRatings = (ratings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings))
}

const usesApiMemory = () => canUseAcademicsApi() && apiMemory !== null

export const getSomRatings = () => {
    if (usesApiMemory()) return apiMemory.map((item) => ({ ...item }))
    return readLocalRatings()
}

const persistRatings = async (ratings) => {
    const list = (Array.isArray(ratings) ? ratings : []).map(normalizeRating).filter(Boolean)
    if (canUseAcademicsApi()) {
        apiMemory = list
        const payload = list.map((row) => stripAcademicsMeta({ ...row, id: row.ratingId }))
        await replaceAcademicsCollectionApi(COLLECTION, payload)
        writeLocalRatings(list)
        emitUpdated()
        return list
    }
    writeLocalRatings(list)
    emitUpdated()
    return list
}

/** Load campus SOM ratings from GET /academics/student-star-ratings. */
export async function hydrateSomRatingsFromApi({ force = false } = {}) {
    if (!canUseAcademicsApi()) {
        apiMemory = null
        return getSomRatings()
    }
    if (hydratePromise && !force) return hydratePromise
    hydratePromise = listAcademicsCollectionApi(COLLECTION)
        .then((rows) => {
            const list = (Array.isArray(rows) ? rows : []).map(normalizeRating).filter(Boolean)
            apiMemory = list
            writeLocalRatings(list)
            emitUpdated()
            return list
        })
        .catch(() => {
            // Keep any local cache so a transient failure does not wipe teacher work.
            if (apiMemory == null) apiMemory = readLocalRatings()
            return apiMemory
        })
        .finally(() => {
            hydratePromise = null
        })
    return hydratePromise
}

export const addSomRating = async (payload) => {
    if (canUseAcademicsApi()) {
        await hydrateSomRatingsFromApi()
    }
    const list = getSomRatings()
    const month = String(payload.month || '').trim()
    const studentId = String(payload.studentId || '')
    const academicYear = normalizeAcademicYearLabel(
        payload.academicYear ?? academicYearFromMonthLabel(month),
    )

    const existingIndex = list.findIndex(
        (item) => String(item.studentId) === studentId && item.month === month,
    )

    let record
    if (existingIndex >= 0) {
        if (!payload.allowOverwrite) {
            const err = new Error(`A Star of the Month rating already exists for this student in ${month}.`)
            err.code = 'duplicate'
            throw err
        }
        record = buildSomRating({
            ratingId: list[existingIndex].ratingId,
            month,
            academicYear,
            studentId,
            studentName: payload.studentName,
            rollNumber: payload.rollNumber,
            className: payload.className,
            section: payload.section,
            rating: payload.rating,
            description: payload.description,
            ratedByRole: payload.ratedByRole ?? 'Teacher',
            attachmentFileId: payload.attachmentFileId ?? list[existingIndex].attachmentFileId,
            attachmentName: payload.attachmentName ?? list[existingIndex].attachmentName,
        })
        const next = [...list]
        next[existingIndex] = record
        await persistRatings(next)
        return record
    }

    const maxId = list.reduce((max, item) => {
        const num = parseInt(String(item.ratingId).replace(/^SSR-?/i, ''), 10)
        return Number.isNaN(num) ? max : Math.max(max, num)
    }, 0)
    const ratingId = `SSR-${String(maxId + 1).padStart(3, '0')}`
    record = buildSomRating({
        ratingId,
        month,
        academicYear,
        studentId,
        studentName: payload.studentName,
        rollNumber: payload.rollNumber,
        className: payload.className,
        section: payload.section,
        rating: payload.rating,
        description: payload.description,
        ratedByRole: payload.ratedByRole ?? 'Teacher',
        attachmentFileId: payload.attachmentFileId || null,
        attachmentName: payload.attachmentName || '',
    })
    await persistRatings([...list, record])
    return record
}

const splitCsvLine = (line) => {
    const cells = []
    let current = ''
    let quoted = false
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index]
        if (char === '"') {
            if (quoted && line[index + 1] === '"') {
                current += '"'
                index += 1
            } else quoted = !quoted
        } else if (char === ',' && !quoted) {
            cells.push(current)
            current = ''
        } else current += char
    }
    cells.push(current)
    return cells.map((cell) => cell.trim())
}

export const INDIVIDUAL_SOM_TEMPLATE_HEADERS = [
    'Month', 'Student Id', 'Student Name', 'Roll Number', 'Class', 'Section', 'Rating', 'Description',
]

export const individualSomTemplateRows = (students, month) => (Array.isArray(students) ? students : []).map((student) => ({
    Month: month || getDefaultSomMonth(),
    'Student Id': student.id,
    'Student Name': student.name,
    'Roll Number': student.rollNumber || '',
    Class: student.className,
    Section: student.section,
    Rating: '',
    Description: '',
}))

export const previewIndividualSomImportRows = (tableRows, students, existing = getSomRatings()) => {
    if (!Array.isArray(tableRows) || !tableRows.length) {
        return { rows: [], errors: ['The file is empty.'], duplicates: [] }
    }
    const headers = tableRows[0].map((item) => String(item ?? '').trim().toLowerCase())
    const required = ['month', 'student id', 'rating']
    const missing = required.filter((name) => headers.indexOf(name) < 0)
    if (missing.length) return { rows: [], errors: [`Missing columns: ${missing.join(', ')}`], duplicates: [] }
    const cell = (cells, name) => {
        const index = headers.indexOf(name)
        return index >= 0 ? String(cells[index] ?? '').trim() : ''
    }
    const errors = []
    const rows = []
    const duplicates = []
    const seen = new Set()
    tableRows.slice(1).forEach((cells, lineIndex) => {
        if (!cells || !cells.some((value) => String(value ?? '').trim())) return
        const rowNumber = lineIndex + 2
        const month = cell(cells, 'month')
        const studentId = cell(cells, 'student id')
        const studentName = cell(cells, 'student name')
        const ratingRaw = cell(cells, 'rating')
        if (!ratingRaw) return
        const rating = Number(ratingRaw)
        if (![1, 2, 3].includes(rating)) {
            errors.push(`Row ${rowNumber}: rating must be 1, 2, or 3 (got "${ratingRaw}").`)
            return
        }
        const student = students.find((item) => item.id === studentId)
            || students.find((item) => item.name.toLowerCase() === studentName.toLowerCase())
        if (!student) {
            errors.push(`Row ${rowNumber}: student ${studentId || studentName || '(blank)'} is not in your scope.`)
            return
        }
        const dupKey = `${student.id}|${month}`
        if (seen.has(dupKey)) {
            errors.push(`Row ${rowNumber}: duplicate in file for ${student.name} / ${month}.`)
            return
        }
        seen.add(dupKey)
        const already = existing.some((item) => String(item.studentId) === String(student.id) && item.month === month)
        const row = {
            rowNumber,
            month,
            studentId: student.id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            className: student.className,
            section: student.section,
            rating,
            description: cell(cells, 'description'),
            status: already ? 'Duplicate' : 'New',
        }
        if (already) duplicates.push(row)
        else rows.push(row)
    })
    return { rows, errors, duplicates }
}

export const previewIndividualSomImportCsv = (text, students, existing) => {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
    return previewIndividualSomImportRows(lines.map((line) => splitCsvLine(line)), students, existing)
}

export const importIndividualSomRows = async (rows, { ratedByRole = 'Teacher' } = {}) => {
    const accepted = (Array.isArray(rows) ? rows : []).filter((row) => row.status !== 'Duplicate')
    const saved = []
    for (const row of accepted) {
        // eslint-disable-next-line no-await-in-loop -- sequential persist keeps rating ids stable
        saved.push(await addSomRating({
            ...row,
            academicYear: normalizeAcademicYearLabel(academicYearFromMonthLabel(row.month)),
            ratedByRole,
            allowOverwrite: false,
        }))
    }
    return saved
}

export const getSomRatingsByMonth = (month) =>
    getSomRatings().filter((item) => item.month === month)

/** Match a rating row to a portal student (id first, then roll / name + class). */
export const ratingMatchesStudent = (rating, student) => {
    if (!rating || !student) return false
    const ratingId = String(rating.studentId || '').trim()
    const studentId = String(student.id || '').trim()
    if (ratingId && studentId && ratingId === studentId) return true

    const ratingRoll = String(rating.rollNumber || '').trim().toLowerCase()
    const studentRoll = String(student.rollNumber || student.admissionNumber || '').trim().toLowerCase()
    if (ratingRoll && studentRoll && ratingRoll === studentRoll) return true

    const ratingName = String(rating.studentName || '').trim().toLowerCase()
    const studentName = String(student.name || '').trim().toLowerCase()
    if (!ratingName || !studentName || ratingName !== studentName) return false

    const ratingClass = String(rating.className || '').trim().toLowerCase()
    const studentClass = String(student.className || student.class || '').trim().toLowerCase()
    if (ratingClass && studentClass && ratingClass !== studentClass) return false

    const ratingSection = String(rating.section || '').trim().toUpperCase()
    const studentSection = String(student.section || '').trim().toUpperCase()
    if (ratingSection && studentSection && ratingSection !== studentSection) return false

    return true
}

export const getSomRatingsForStudent = (student) =>
    getSomRatings().filter((item) => ratingMatchesStudent(item, student))

export const getSoyRatingForStudent = (student, academicYear) => {
    const consolidated = getConsolidatedSoyRatings(academicYear)
    return consolidated.find((item) => ratingMatchesStudent(item, student)) ?? null
}

export const getStarOfMonth = (month) => {
    const monthRatings = getSomRatingsByMonth(month)
    if (!monthRatings.length) return null
    return monthRatings.reduce((best, current) =>
        current.rating > best.rating ? current : best,
    )
}

export const getConsolidatedSoyRatings = (academicYear = '2025-2026') => {
    const targetYear = normalizeAcademicYearLabel(academicYear)
    const yearRatings = getSomRatings().filter(
        (item) => normalizeAcademicYearLabel(item.academicYear) === targetYear,
    )
    const grouped = yearRatings.reduce((acc, item) => {
        if (!acc[item.studentId]) {
            acc[item.studentId] = {
                studentId: item.studentId,
                studentName: item.studentName,
                rollNumber: item.rollNumber,
                className: item.className,
                section: item.section,
                classSection: item.classSection,
                academicYear,
                monthlyRatings: [],
            }
        }
        acc[item.studentId].monthlyRatings.push({ month: item.month, rating: item.rating })
        return acc
    }, {})

    return Object.values(grouped)
        .map((entry) => {
            const total = entry.monthlyRatings.reduce((sum, item) => sum + item.rating, 0)
            const monthsRated = entry.monthlyRatings.length
            const averageRating = monthsRated ? total / monthsRated : 0
            return {
                ...entry,
                monthsRated,
                averageRating: Number(averageRating.toFixed(2)),
                annualRating: Math.round(averageRating),
            }
        })
        .sort((a, b) => b.averageRating - a.averageRating)
}

export const getStarOfYear = (academicYear = '2025-2026') => {
    const consolidated = getConsolidatedSoyRatings(academicYear)
    return consolidated[0] ?? null
}

export const getRouteBaseFromPath = (pathname) => {
    if (pathname.startsWith('/coordinator')) return ROUTE_BASE_BY_PREFIX.coordinator
    if (pathname.startsWith('/principal')) return ROUTE_BASE_BY_PREFIX.principal || '/principal/star-ratings'
    if (pathname.startsWith('/director')) return ROUTE_BASE_BY_PREFIX.director || '/director/star-ratings'
    if (pathname.startsWith('/admin')) return ROUTE_BASE_BY_PREFIX.admin || '/admin/star-ratings'
    return ROUTE_BASE_BY_PREFIX.teacher
}
