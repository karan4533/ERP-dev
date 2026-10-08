import { STUDENTS_LIST } from '../../Pages/Teacher/StudentsList/studentsListData'

export const MAX_STARS = 3

export const RATING_CATEGORY = 'Overall Performance'

export const SOY_MONTH_COUNT = 10

export const ACADEMIC_YEARS = ['2025-2026']

export const ACADEMIC_YEAR_MONTHS = [
    'June 2025',
    'July 2025',
    'August 2025',
    'September 2025',
    'October 2025',
    'November 2025',
    'December 2025',
    'January 2026',
    'February 2026',
    'March 2026',
]

export const ROUTE_BASE_BY_PREFIX = {
    teacher: '/teacher/star-ratings',
    coordinator: '/coordinator/star-ratings',
}

const STORAGE_KEY = 'student-star-ratings-som'

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
}) => ({
    ratingId,
    month,
    academicYear,
    studentId,
    studentName,
    rollNumber,
    className,
    section,
    classSection: `${className}-${section}`,
    rating,
    description,
    ratedByRole,
})

const DEFAULT_SOM_RATINGS = []

export const getClassSectionOptions = () => {
    const sections = [...new Set(STUDENTS_LIST.map((s) => `${s.className}-${s.section}`))]
    return sections.sort()
}

export const getStudents = () => STUDENTS_LIST

export const getStudentById = (studentId) =>
    STUDENTS_LIST.find((student) => student.id === studentId) ?? null

const readRatings = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        // ignore
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SOM_RATINGS))
    return DEFAULT_SOM_RATINGS
}

const writeRatings = (ratings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings))
}

export const getSomRatings = () => readRatings()

export const addSomRating = (payload) => {
    const list = readRatings()
    const maxId = list.reduce((max, item) => {
        const num = parseInt(String(item.ratingId).replace('SSR-', ''), 10)
        return Number.isNaN(num) ? max : Math.max(max, num)
    }, 0)
    const ratingId = `SSR-${String(maxId + 1).padStart(3, '0')}`

    const record = buildSomRating({
        ratingId,
        month: payload.month,
        academicYear: payload.academicYear ?? ACADEMIC_YEARS[0],
        studentId: payload.studentId,
        studentName: payload.studentName,
        rollNumber: payload.rollNumber,
        className: payload.className,
        section: payload.section,
        rating: payload.rating,
        description: payload.description,
        ratedByRole: payload.ratedByRole ?? 'Teacher',
    })

    writeRatings([...list, record])
    return record
}

export const getAvailableSomMonths = () => {
    const months = [...new Set(readRatings().map((item) => item.month))]
    return months.sort((a, b) => ACADEMIC_YEAR_MONTHS.indexOf(a) - ACADEMIC_YEAR_MONTHS.indexOf(b))
}

export const getSomRatingsByMonth = (month) =>
    readRatings().filter((item) => item.month === month)

export const getStarOfMonth = (month) => {
    const monthRatings = getSomRatingsByMonth(month)
    if (!monthRatings.length) return null
    return monthRatings.reduce((best, current) =>
        current.rating > best.rating ? current : best,
    )
}

export const getConsolidatedSoyRatings = (academicYear = '2025-2026') => {
    const yearRatings = readRatings().filter((item) => item.academicYear === academicYear)
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
    return ROUTE_BASE_BY_PREFIX.teacher
}
