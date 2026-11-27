import { getStudentsList } from '../StudentDatabase/studentDatabaseData'
import { canUseOpsApi, listOpsCollectionApi, upsertOpsItemApi } from '../../services/opsApi'

const CHECKLIST_KEY = 'schoolerp-som-checklist-v1'
const DISABLED_KEY = 'schoolerp-som-checklist-disabled-v1'
const RATINGS_KEY = 'schoolerp-som-matrix-ratings-v1'
const TITLES_KEY = 'schoolerp-som-star-titles-v1'
const META_KEY = 'schoolerp-som-matrix-meta-v1'

/** Whole-star scale only — 2.5 and other half-stars are rejected by API validation. */
export const SOM_RATINGS = ['1', '2', '3', 'NA']
export const SOM_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const sub = (id, name) => ({ id, name, enabled: true })
const cat = (id, name, subs) => ({ id, name, enabled: true, subs })

export const DEFAULT_SOM_CHECKLIST = [
    cat('cat-punctuality', '1. Punctuality', [
        sub('sub-attendance', 'Attendance'),
        sub('sub-homework', 'Accomplishing Home Work / Assignments on time'),
        sub('sub-reporting', 'On time reporting'),
    ]),
    cat('cat-participation', '2. Active Participation', [
        sub('sub-classroom', 'Classroom activity'),
        sub('sub-interschool', 'Interschool activity'),
        sub('sub-performance', 'Co curricular activities (Performance Arts)'),
        sub('sub-martial', 'Co curricular activities (Martial Arts)'),
        sub('sub-special', 'Interactions during Special programs'),
        sub('sub-house', 'Inter House competitions'),
        sub('sub-assembly', 'Assembly Performance'),
        sub('sub-bfit', 'BFIT'),
    ]),
    cat('cat-behaviour', '3. Classroom Behaviour', [sub('sub-behaviour', 'Classroom Behaviour')]),
    cat('cat-grooming', '4. Personal Grooming', [sub('sub-grooming', 'Personal Grooming'), sub('sub-diet', 'Nutritious Diet')]),
    cat('cat-etiquette', '5. Table Etiquette', [sub('sub-etiquette', 'Table Etiquette')]),
    cat('cat-resources', '6. Handling Resources', [
        sub('sub-books', 'Maintenance of books & notebooks'),
        sub('sub-classroom-resources', 'Classroom resources'),
        sub('sub-objects', 'Personal objects'),
    ]),
    cat('cat-english', '7. Communication in English', [sub('sub-english', 'Communication in English')]),
    cat('cat-social', '8. Socializing', [sub('sub-social', 'Socializing')]),
    cat('cat-academic', '9. Academic Performance', [sub('sub-assessments', 'Assessments')]),
    cat('cat-creativity', '10. Creativity', [sub('sub-blog', "Student's Blog"), sub('sub-bulletin', 'Bulletin Board')]),
    cat('cat-leadership', '11. Leadership', [sub('sub-leadership', 'Exhibiting Leadership'), sub('sub-environment', 'Environmental Concern')]),
    cat('cat-library', '12. Library Usage', [sub('sub-library', 'Library Usage')]),
]

export const DEFAULT_STAR_TITLES = [
    { id: 'som', name: 'Star of the Month', mode: 'overall', subIds: [] },
    { id: 'academic', name: 'Academic Accolades', mode: 'criteria', subIds: ['sub-assessments'] },
    { id: 'progressive', name: 'Progressive Worker', mode: 'criteria', subIds: ['sub-homework', 'sub-attendance'] },
    { id: 'creative', name: 'Creative Hearts', mode: 'criteria', subIds: ['sub-blog', 'sub-bulletin'] },
    { id: 'sports', name: 'Sports Star', mode: 'criteria', subIds: ['sub-bfit', 'sub-martial'] },
]

const readJson = (key, fallback) => {
    try {
        const stored = localStorage.getItem(key)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return fallback
}

const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value))

// Server storage (ops collections "som-matrix" and "som-config"). The browser keys above stay as
// the in-page cache so the matrix reads synchronously; every change is also saved to the server,
// one record per month/year/grade/section, so teachers never overwrite each other's classes.
export const SOM_SYNC_EVENT = 'schoolerp-som-sync'
const MATRIX_COLLECTION = 'som-matrix'
const CONFIG_COLLECTION = 'som-config'

const emitSync = (detail) => {
    try {
        window.dispatchEvent(new CustomEvent(SOM_SYNC_EVENT, { detail }))
    } catch {
        /* ignore */
    }
}

const pushToServer = (collection, id, body) => {
    if (!canUseOpsApi()) return Promise.resolve(true)
    return upsertOpsItemApi(collection, id, body)
        .then(() => true)
        .catch((error) => {
            emitSync({ ok: false, message: error?.message || 'Star of the Month changes could not be saved to the server.' })
            return false
        })
}

const sameContext = (row, context) => (
    row.month === context.month
    && String(row.year) === String(context.year)
    && row.grade === context.grade
    && row.section === context.section
)

const contextRecord = (context) => {
    const key = contextKey(context)
    return {
        context: { month: context.month, year: String(context.year), grade: context.grade, section: context.section },
        ratings: readJson(RATINGS_KEY, [])
            .filter((row) => sameContext(row, context))
            .map(({ studentId, subId, rating }) => ({ studentId, subId, rating })),
        disabledSubs: readJson(DISABLED_KEY, {})[key] || [],
        meta: readJson(META_KEY, {})[key] || null,
    }
}

const pushContext = (context) => pushToServer(MATRIX_COLLECTION, contextKey(context), contextRecord(context))

/**
 * Load every class matrix and the shared checklist/titles from the server into the page cache.
 * Classes that exist only in this browser (rated before server storage) are uploaded once.
 */
export async function hydrateSomFromApi() {
    if (!canUseOpsApi()) return false
    try {
        const [matrices, configs] = await Promise.all([
            listOpsCollectionApi(MATRIX_COLLECTION),
            listOpsCollectionApi(CONFIG_COLLECTION),
        ])
        const serverKeys = new Set()
        const ratings = []
        const disabled = {}
        const meta = {}
        ;(Array.isArray(matrices) ? matrices : []).forEach((record) => {
            const context = record?.context
            if (!context) return
            const key = contextKey(context)
            serverKeys.add(key)
            ;(record.ratings || []).forEach((row) => ratings.push({ ...context, ...row }))
            if (Array.isArray(record.disabledSubs) && record.disabledSubs.length) disabled[key] = record.disabledSubs
            if (record.meta) meta[key] = record.meta
        })

        const localRatings = readJson(RATINGS_KEY, [])
        const localOnly = new Map()
        localRatings.forEach((row) => {
            const key = contextKey(row)
            if (!serverKeys.has(key)) localOnly.set(key, row)
        })
        const localDisabled = readJson(DISABLED_KEY, {})
        const localMeta = readJson(META_KEY, {})
        localOnly.forEach((row, key) => {
            localRatings.filter((item) => contextKey(item) === key).forEach((item) => ratings.push(item))
            if (localDisabled[key]) disabled[key] = localDisabled[key]
            if (localMeta[key]) meta[key] = localMeta[key]
        })

        writeJson(RATINGS_KEY, ratings)
        writeJson(DISABLED_KEY, disabled)
        writeJson(META_KEY, meta)

        const config = Object.fromEntries((Array.isArray(configs) ? configs : []).map((row) => [row.id, row]))
        if (Array.isArray(config.checklist?.categories) && config.checklist.categories.length) {
            writeJson(CHECKLIST_KEY, config.checklist.categories)
        }
        if (Array.isArray(config.titles?.titles) && config.titles.titles.length) {
            writeJson(TITLES_KEY, config.titles.titles)
        }

        await Promise.all([...localOnly.values()].map((row) => pushContext(row)))
        return true
    } catch (error) {
        emitSync({ ok: false, message: error?.message || 'Star of the Month data could not be loaded from the server.' })
        return false
    }
}

export const getChecklist = () => {
    const stored = readJson(CHECKLIST_KEY, null)
    if (Array.isArray(stored) && stored.length) return stored
    writeJson(CHECKLIST_KEY, DEFAULT_SOM_CHECKLIST)
    return DEFAULT_SOM_CHECKLIST
}

export const saveChecklist = (categories) => {
    writeJson(CHECKLIST_KEY, categories)
    pushToServer(CONFIG_COLLECTION, 'checklist', { categories })
}

export const resetChecklist = () => {
    saveChecklist(DEFAULT_SOM_CHECKLIST)
    return DEFAULT_SOM_CHECKLIST
}

export const contextKey = ({ month, year, grade, section }) => `${year}|${month}|${grade}|${section}`

export const getDisabledSubs = (context) => readJson(DISABLED_KEY, {})[contextKey(context)] || []

export const setSubDisabled = (context, subId, disabled) => {
    const all = readJson(DISABLED_KEY, {})
    const key = contextKey(context)
    const current = new Set(all[key] || [])
    if (disabled) current.add(subId)
    else current.delete(subId)
    all[key] = [...current]
    writeJson(DISABLED_KEY, all)
    pushContext(context)
}

export const getRatings = () => readJson(RATINGS_KEY, [])

export const saveRatings = (rows) => writeJson(RATINGS_KEY, rows)

export const getStarTitles = () => {
    const stored = readJson(TITLES_KEY, null)
    if (Array.isArray(stored) && stored.length) return stored
    writeJson(TITLES_KEY, DEFAULT_STAR_TITLES)
    return DEFAULT_STAR_TITLES
}

export const saveStarTitles = (titles) => {
    writeJson(TITLES_KEY, titles)
    pushToServer(CONFIG_COLLECTION, 'titles', { titles })
}

export const getMatrixMeta = (context) => readJson(META_KEY, {})[contextKey(context)] || { classMentor: '', signoff: {} }

export const saveMatrixMeta = (context, meta) => {
    const all = readJson(META_KEY, {})
    all[contextKey(context)] = meta
    writeJson(META_KEY, all)
    pushContext(context)
}

export const isNumericRating = (value) => value !== 'NA' && value !== '' && value !== undefined && !Number.isNaN(Number(value))

export const averageRatings = (values) => {
    const numbers = values.filter(isNumericRating).map(Number)
    if (!numbers.length) return null
    return Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 1000) / 1000
}

export const flattenSubs = (categories) => categories.flatMap((category) => (
    category.enabled === false ? [] : category.subs.filter((item) => item.enabled !== false).map((item) => ({ ...item, categoryId: category.id, categoryName: category.name }))
))

export const visibleSubs = (categories, context) => {
    const disabled = new Set(getDisabledSubs(context))
    return flattenSubs(categories).filter((item) => !disabled.has(item.id))
}

/** Roster from enrolled campus students (optional pre-filtered rows). Never falls back to demo attendance. */
export const getSomRoster = (rows) => {
    const source = Array.isArray(rows) ? rows : getStudentsList()
    return source
        .filter((student) => student.className || student.class)
        .map((student) => {
            const grade = student.className || student.class || ''
            const section = student.section
                || (student.classSection && student.classSection !== grade ? student.classSection : '')
                || 'A'
            return {
                id: String(student.id),
                name: student.name || '',
                grade,
                section,
            }
        })
}

export const rosterFor = (grade, section, rows) => getSomRoster(rows).filter((student) => student.grade === grade && student.section === section)

export const ratingFor = (ratings, context, studentId, subId) => ratings.find((item) => (
    item.month === context.month
    && String(item.year) === String(context.year)
    && item.grade === context.grade
    && item.section === context.section
    && item.studentId === studentId
    && item.subId === subId
))?.rating || ''

export const upsertRating = (context, studentId, subId, rating) => {
    const value = String(rating || '').trim()
    if (value && !SOM_RATINGS.includes(value)) {
        throw new Error(`Rating must be one of ${SOM_RATINGS.join(', ')}.`)
    }
    const rows = getRatings().filter((item) => !(
        item.month === context.month
        && String(item.year) === String(context.year)
        && item.grade === context.grade
        && item.section === context.section
        && item.studentId === studentId
        && item.subId === subId
    ))
    if (value) rows.push({ ...context, year: String(context.year), studentId, subId, rating: value })
    saveRatings(rows)
    pushContext(context)
    return rows
}

export const studentScore = (subs, ratings, context, studentId, subIds) => {
    const selected = subIds ? subs.filter((item) => subIds.includes(item.id)) : subs
    return averageRatings(selected.map((item) => ratingFor(ratings, context, studentId, item.id)))
}

export const rankStudents = (students, scoreOf) => [...students]
    .map((student) => ({ ...student, score: scoreOf(student) }))
    .filter((student) => student.score !== null)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

export const titlePlacements = (titles, students, subs, ratings, context) => titles.map((title) => {
    const ranked = rankStudents(students, (student) => studentScore(
        subs,
        ratings,
        context,
        student.id,
        title.mode === 'overall' ? null : title.subIds,
    ))
    return {
        ...title,
        winner: ranked[0] || null,
        runnerUp1: ranked[1] || null,
        runnerUp2: ranked[2] || null,
    }
})

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

export const checklistTemplateHeaders = [
    'Month', 'Year', 'Grade', 'Section', 'Student Id', 'Student Name', 'Category', 'Subparameter', 'Rating',
]

export const checklistTemplateRows = (context, students, subs) => students.flatMap((student) => (
    subs.map((item) => ({
        Month: context.month,
        Year: context.year,
        Grade: context.grade,
        Section: context.section,
        'Student Id': student.id,
        'Student Name': student.name,
        Category: item.categoryName,
        Subparameter: item.name,
        Rating: '',
    }))
))

export const checklistTemplateCsv = (context, students, subs) => {
    const header = checklistTemplateHeaders.join(',')
    const lines = checklistTemplateRows(context, students, subs).map((row) => checklistTemplateHeaders.map((key) => {
        const value = String(row[key] ?? '')
        return `"${value.replace(/"/g, '""')}"`
    }).join(','))
    return [header, ...lines].join('\n')
}

const cellAt = (cells, headers, name) => {
    const index = headers.indexOf(name)
    return index >= 0 ? String(cells[index] ?? '').trim() : ''
}

/** Parse CSV text or a sheet.js worksheet AOA into the same preview shape. */
export const previewSomImportRows = (tableRows, context, students, subs, existingRatings = getRatings()) => {
    if (!Array.isArray(tableRows) || !tableRows.length) {
        return { rows: [], errors: ['The file is empty.'], duplicates: [] }
    }
    const headers = tableRows[0].map((item) => String(item ?? '').trim().toLowerCase())
    const required = ['month', 'year', 'grade', 'section', 'student id', 'category', 'subparameter', 'rating']
    const missing = required.filter((name) => headers.indexOf(name) < 0)
    if (missing.length) return { rows: [], errors: [`Missing columns: ${missing.join(', ')}`], duplicates: [] }

    const errors = []
    const rows = []
    const duplicates = []
    const seenInFile = new Set()

    tableRows.slice(1).forEach((cells, lineIndex) => {
        if (!cells || !cells.some((cell) => String(cell ?? '').trim())) return
        const rowNumber = lineIndex + 2
        const month = cellAt(cells, headers, 'month')
        const year = cellAt(cells, headers, 'year')
        const grade = cellAt(cells, headers, 'grade')
        const section = cellAt(cells, headers, 'section')
        const studentId = cellAt(cells, headers, 'student id')
        const studentName = cellAt(cells, headers, 'student name')
        const category = cellAt(cells, headers, 'category')
        const subparameter = cellAt(cells, headers, 'subparameter')
        const rating = cellAt(cells, headers, 'rating')

        if (!rating) return

        if (month !== context.month || String(year) !== String(context.year) || grade !== context.grade || section !== context.section) {
            errors.push(`Row ${rowNumber}: month, year, grade, or section does not match the open matrix.`)
            return
        }
        const student = students.find((item) => item.id === studentId)
            || students.find((item) => item.name.toLowerCase() === studentName.toLowerCase())
        if (!student) {
            errors.push(`Row ${rowNumber}: student ${studentId || studentName || '(blank)'} is not in this class.`)
            return
        }
        const match = subs.find((item) => item.name.toLowerCase() === subparameter.toLowerCase() && item.categoryName.toLowerCase() === category.toLowerCase())
            || subs.find((item) => item.name.toLowerCase() === subparameter.toLowerCase())
        if (!match) {
            errors.push(`Row ${rowNumber}: ${category} / ${subparameter} is not in the current checklist.`)
            return
        }
        if (!SOM_RATINGS.includes(rating)) {
            errors.push(`Row ${rowNumber}: rating "${rating}" is not one of ${SOM_RATINGS.join(', ')}.`)
            return
        }
        const dupKey = `${student.id}|${match.id}`
        if (seenInFile.has(dupKey)) {
            errors.push(`Row ${rowNumber}: duplicate in file for ${student.name} / ${match.name}.`)
            return
        }
        seenInFile.add(dupKey)

        const already = existingRatings.some((item) => (
            item.month === context.month
            && String(item.year) === String(context.year)
            && item.grade === context.grade
            && item.section === context.section
            && item.studentId === student.id
            && item.subId === match.id
        ))
        const row = {
            studentId: student.id,
            subId: match.id,
            rating,
            studentName: student.name,
            subparameter: match.name,
            status: already ? 'Duplicate' : 'New',
            rowNumber,
        }
        if (already) duplicates.push(row)
        else rows.push(row)
    })

    return { rows, errors, duplicates }
}

export const previewSomImport = (text, context, students, subs, existingRatings) => {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
    const tableRows = lines.map((line) => splitCsvLine(line))
    return previewSomImportRows(tableRows, context, students, subs, existingRatings)
}

/** Import only New rows; duplicates are blocked unless explicitly allowed. */
export const importSomRows = (context, rows, { allowOverwrite = false } = {}) => {
    const accepted = allowOverwrite ? rows : rows.filter((row) => row.status !== 'Duplicate')
    let ratings = getRatings()
    accepted.forEach((row) => {
        ratings = ratings.filter((item) => !(
            item.month === context.month
            && String(item.year) === String(context.year)
            && item.grade === context.grade
            && item.section === context.section
            && item.studentId === row.studentId
            && item.subId === row.subId
        ))
        ratings.push({ ...context, year: String(context.year), studentId: row.studentId, subId: row.subId, rating: row.rating })
    })
    saveRatings(ratings)
    pushContext(context)
    return ratings
}
