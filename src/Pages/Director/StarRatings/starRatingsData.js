export const MAX_STARS = 3

export const RATING_CATEGORY = 'Overall Performance'

export const SOY_MONTH_COUNT = 10

export const EMPLOYEE_TYPE_OPTIONS = [
    { value: 'teacher', label: 'Teacher' },
    { value: 'coordinator', label: 'Co-ordinator' },
]

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

export const TEACHER_OPTIONS = [
    { id: 'TEA-1001', name: 'Mr. Ravi Kumar', department: 'Mathematics' },
    { id: 'TEA-1002', name: 'Ms. Anitha Verma', department: 'English' },
    { id: 'TEA-1003', name: 'Rajesh Kumar', department: 'Science' },
]

export const COORDINATOR_OPTIONS = [
    { id: 'COO-1001', name: 'Sandy Selva', department: 'Science' },
    { id: 'COO-1002', name: 'John Milton', department: 'Mathematics' },
    { id: 'COO-1003', name: 'Priya Nair', department: 'English' },
]

const buildSomRating = ({
    ratingId,
    month,
    academicYear,
    employeeType,
    employeeId,
    employeeName,
    department,
    rating,
    description,
}) => ({
    ratingId,
    month,
    academicYear,
    employeeType,
    employeeId,
    employeeName,
    department,
    rating,
    description,
})

export const MOCK_SOM_RATINGS = [
    buildSomRating({ ratingId: 'SOM-001', month: 'June 2025', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1001', employeeName: 'Mr. Ravi Kumar', department: 'Mathematics', rating: 3, description: 'Outstanding classroom delivery and student outcomes.' }),
    buildSomRating({ ratingId: 'SOM-002', month: 'June 2025', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1002', employeeName: 'Ms. Anitha Verma', department: 'English', rating: 2, description: 'Good engagement; consistent assignment follow-up.' }),
    buildSomRating({ ratingId: 'SOM-003', month: 'June 2025', academicYear: '2025-2026', employeeType: 'coordinator', employeeId: 'COO-1001', employeeName: 'Sandy Selva', department: 'Science', rating: 3, description: 'Excellent department coordination.' }),
    buildSomRating({ ratingId: 'SOM-004', month: 'July 2025', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1001', employeeName: 'Mr. Ravi Kumar', department: 'Mathematics', rating: 3, description: 'Maintained high teaching standards.' }),
    buildSomRating({ ratingId: 'SOM-005', month: 'July 2025', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1003', employeeName: 'Rajesh Kumar', department: 'Science', rating: 2, description: 'Solid lab sessions and student support.' }),
    buildSomRating({ ratingId: 'SOM-006', month: 'July 2025', academicYear: '2025-2026', employeeType: 'coordinator', employeeId: 'COO-1002', employeeName: 'John Milton', department: 'Mathematics', rating: 2, description: 'Effective exam scheduling support.' }),
    buildSomRating({ ratingId: 'SOM-007', month: 'August 2025', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1002', employeeName: 'Ms. Anitha Verma', department: 'English', rating: 3, description: 'Exceptional literary club leadership.' }),
    buildSomRating({ ratingId: 'SOM-008', month: 'August 2025', academicYear: '2025-2026', employeeType: 'coordinator', employeeId: 'COO-1001', employeeName: 'Sandy Selva', department: 'Science', rating: 2, description: 'Good inter-department liaison.' }),
    buildSomRating({ ratingId: 'SOM-009', month: 'September 2025', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1001', employeeName: 'Mr. Ravi Kumar', department: 'Mathematics', rating: 2, description: 'Strong term assessment preparation.' }),
    buildSomRating({ ratingId: 'SOM-010', month: 'September 2025', academicYear: '2025-2026', employeeType: 'coordinator', employeeId: 'COO-1003', employeeName: 'Priya Nair', department: 'English', rating: 3, description: 'Proactive curriculum alignment.' }),
    buildSomRating({ ratingId: 'SOM-011', month: 'October 2025', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1003', employeeName: 'Rajesh Kumar', department: 'Science', rating: 3, description: 'Science fair coordination excellence.' }),
    buildSomRating({ ratingId: 'SOM-012', month: 'November 2025', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1001', employeeName: 'Mr. Ravi Kumar', department: 'Mathematics', rating: 3, description: 'Top performer for mid-year review.' }),
    buildSomRating({ ratingId: 'SOM-013', month: 'December 2025', academicYear: '2025-2026', employeeType: 'coordinator', employeeId: 'COO-1001', employeeName: 'Sandy Selva', department: 'Science', rating: 3, description: 'Holiday event planning executed well.' }),
    buildSomRating({ ratingId: 'SOM-014', month: 'January 2026', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1002', employeeName: 'Ms. Anitha Verma', department: 'English', rating: 2, description: 'Steady progress in board prep classes.' }),
    buildSomRating({ ratingId: 'SOM-015', month: 'February 2026', academicYear: '2025-2026', employeeType: 'teacher', employeeId: 'TEA-1001', employeeName: 'Mr. Ravi Kumar', department: 'Mathematics', rating: 3, description: 'Consistent excellence through Term 2.' }),
    buildSomRating({ ratingId: 'SOM-016', month: 'March 2026', academicYear: '2025-2026', employeeType: 'coordinator', employeeId: 'COO-1001', employeeName: 'Sandy Selva', department: 'Science', rating: 3, description: 'Year-end department review leadership.' }),
]

export const getEmployeeTypeLabel = (type) =>
    EMPLOYEE_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ?? type

export const getAvailableSomMonths = () => {
    const months = [...new Set(MOCK_SOM_RATINGS.map((item) => item.month))]
    const order = ACADEMIC_YEAR_MONTHS
    return months.sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

export const getSomRatingsByMonth = (month) =>
    MOCK_SOM_RATINGS.filter((item) => item.month === month)

export const getStarOfMonth = (month) => {
    const monthRatings = getSomRatingsByMonth(month)
    if (!monthRatings.length) return null
    return monthRatings.reduce((best, current) =>
        current.rating > best.rating ? current : best,
    )
}

export const getConsolidatedSoyRatings = (academicYear = '2025-2026') => {
    const yearRatings = MOCK_SOM_RATINGS.filter((item) => item.academicYear === academicYear)
    const grouped = yearRatings.reduce((acc, item) => {
        if (!acc[item.employeeId]) {
            acc[item.employeeId] = {
                employeeId: item.employeeId,
                employeeName: item.employeeName,
                employeeType: item.employeeType,
                department: item.department,
                academicYear,
                monthlyRatings: [],
            }
        }
        acc[item.employeeId].monthlyRatings.push({ month: item.month, rating: item.rating })
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

export const getEmployeesByType = (employeeType) =>
    employeeType === 'coordinator' ? COORDINATOR_OPTIONS : TEACHER_OPTIONS
