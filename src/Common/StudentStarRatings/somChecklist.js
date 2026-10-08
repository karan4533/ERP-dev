import { STUDENT_ATTENDANCE } from '../../Pages/Admin/Attendance/Students/studentAttendanceData'
import { getStudentsList } from '../RBAC/createdUsersData'

const CHECKLIST_KEY = 'schoolerp-som-checklist-v1'
const DISABLED_KEY = 'schoolerp-som-checklist-disabled-v1'
const RATINGS_KEY = 'schoolerp-som-matrix-ratings-v1'
const TITLES_KEY = 'schoolerp-som-star-titles-v1'
const META_KEY = 'schoolerp-som-matrix-meta-v1'

export const SOM_RATINGS = ['1', '2', '2.5', '3', 'NA']
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

export const getChecklist = () => {
    const stored = readJson(CHECKLIST_KEY, null)
    if (Array.isArray(stored) && stored.length) return stored
    writeJson(CHECKLIST_KEY, DEFAULT_SOM_CHECKLIST)
    return DEFAULT_SOM_CHECKLIST
}

export const saveChecklist = (categories) => writeJson(CHECKLIST_KEY, categories)

export const resetChecklist = () => {
    writeJson(CHECKLIST_KEY, DEFAULT_SOM_CHECKLIST)
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
}

export const getRatings = () => readJson(RATINGS_KEY, [])

export const saveRatings = (rows) => writeJson(RATINGS_KEY, rows)

export const getStarTitles = () => {
    const stored = readJson(TITLES_KEY, null)
    if (Array.isArray(stored) && stored.length) return stored
    writeJson(TITLES_KEY, DEFAULT_STAR_TITLES)
    return DEFAULT_STAR_TITLES
}

export const saveStarTitles = (titles) => writeJson(TITLES_KEY, titles)

export const getMatrixMeta = (context) => readJson(META_KEY, {})[contextKey(context)] || { classMentor: '', signoff: {} }

export const saveMatrixMeta = (context, meta) => {
    const all = readJson(META_KEY, {})
    all[contextKey(context)] = meta
    writeJson(META_KEY, all)
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

export const getSomRoster = () => {
    const created = getStudentsList().filter((student) => student.className && student.section).map((student) => ({
        id: student.id,
        name: student.name,
        grade: student.className,
        section: student.section,
    }))
    if (created.length) return created
    const seen = new Set()
    return STUDENT_ATTENDANCE.filter((student) => {
        const key = student.admissionNo || student.id
        if (seen.has(key)) return false
        seen.add(key)
        return true
    }).map((student) => ({
        id: student.admissionNo || student.id,
        name: student.studentName,
        grade: student.className,
        section: student.section,
    }))
}

export const rosterFor = (grade, section) => getSomRoster().filter((student) => student.grade === grade && student.section === section)

export const ratingFor = (ratings, context, studentId, subId) => ratings.find((item) => (
    item.month === context.month
    && String(item.year) === String(context.year)
    && item.grade === context.grade
    && item.section === context.section
    && item.studentId === studentId
    && item.subId === subId
))?.rating || ''

export const upsertRating = (context, studentId, subId, rating) => {
    const rows = getRatings().filter((item) => !(
        item.month === context.month
        && String(item.year) === String(context.year)
        && item.grade === context.grade
        && item.section === context.section
        && item.studentId === studentId
        && item.subId === subId
    ))
    if (rating) rows.push({ ...context, year: String(context.year), studentId, subId, rating })
    saveRatings(rows)
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

export const checklistTemplateCsv = (context, students, subs) => {
    const header = 'Month,Year,Grade,Section,Student Id,Student Name,Category,Subparameter,Rating'
    const lines = students.flatMap((student) => subs.map((item) => [
        context.month, context.year, context.grade, context.section, student.id, `"${student.name.replace(/"/g, '""')}"`, `"${item.categoryName.replace(/"/g, '""')}"`, `"${item.name.replace(/"/g, '""')}"`, '',
    ].join(',')))
    return [header, ...lines].join('\n')
}

export const previewSomImport = (text, context, students, subs) => {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
    if (!lines.length) return { rows: [], errors: ['The file is empty.'] }
    const headers = splitCsvLine(lines[0]).map((item) => item.toLowerCase())
    const index = (name) => headers.indexOf(name)
    const required = ['month', 'year', 'grade', 'section', 'student id', 'category', 'subparameter', 'rating']
    const missing = required.filter((name) => index(name) < 0)
    if (missing.length) return { rows: [], errors: [`Missing columns: ${missing.join(', ')}`] }
    const errors = []
    const rows = []
    lines.slice(1).forEach((line, lineIndex) => {
        const cells = splitCsvLine(line)
        const rowNumber = lineIndex + 2
        const month = cells[index('month')]
        const year = cells[index('year')]
        const grade = cells[index('grade')]
        const section = cells[index('section')]
        const studentId = cells[index('student id')]
        const studentName = index('student name') >= 0 ? cells[index('student name')] : ''
        const category = cells[index('category')]
        const subparameter = cells[index('subparameter')]
        const rating = cells[index('rating')]
        if (month !== context.month || String(year) !== String(context.year) || grade !== context.grade || section !== context.section) {
            errors.push(`Row ${rowNumber}: month, year, grade, or section does not match the open matrix.`)
            return
        }
        const student = students.find((item) => item.id === studentId) || students.find((item) => item.name.toLowerCase() === studentName.toLowerCase())
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
        rows.push({ studentId: student.id, subId: match.id, rating, studentName: student.name, subparameter: match.name })
    })
    return { rows, errors }
}

export const importSomRows = (context, rows) => {
    let ratings = getRatings()
    rows.forEach((row) => {
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
    return ratings
}
