/**
 * Shared class / academic-year options for Fee Structure UI.
 * Classes: always include canonical Pre-KG…Grade 12 plus anything already on campus.
 * Years: prefer Admin masters academic years when the API is reachable.
 */
import { getClasses } from '../../../Common/RBAC/academicsCatalogData'
import { CLASS_LEVEL_OPTIONS } from '../../Admin/Class/ClassDetails/classDetailsOptions'
import { DEFAULT_ACADEMIC_YEAR } from '../financeDomain/financeConstants'
import { FINANCE_ACADEMIC_YEARS } from '../financeDomain/financeMasters'
import { canUseClassDetailsApi, listAcademicYears } from '../../../services/classDetailsApi'
import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'

export const CANONICAL_CLASS_COUNT = CLASS_LEVEL_OPTIONS.length // 15

/** School-wide fee structures (e.g. Transport) apply to every class. */
export const ALL_CLASSES_LABEL = 'All Classes'

export const isAllClassesFee = (className) => {
    const value = String(className || '').trim().toLowerCase()
    return value === 'all classes' || value === 'all' || value === '*'
}

/** Full class list for Define / filters — never shrink to only classes that already have a fee row. */
export const buildCampusClassOptions = ({ students = [], feeStructures = [] } = {}) => {
    const fromStudents = students.map((row) => String(row.className || '').trim()).filter(Boolean)
    const fromStructures = feeStructures.map((row) => String(row.className || '').trim()).filter(Boolean)
    const fromCatalog = getClasses().map((row) => String(row || '').trim()).filter(Boolean)
    const merged = [
        ALL_CLASSES_LABEL,
        ...CLASS_LEVEL_OPTIONS,
        ...fromCatalog,
        ...fromStudents,
        ...fromStructures,
    ]
    const unique = [...new Set(
        merged
            .map((name) => String(name || '').trim())
            .filter(Boolean)
            .filter((name) => name === ALL_CLASSES_LABEL || !isAllClassesFee(name)),
    )]
    return unique.sort((a, b) => {
        if (a === ALL_CLASSES_LABEL) return -1
        if (b === ALL_CLASSES_LABEL) return 1
        return a.localeCompare(b, undefined, { numeric: true })
    })
}

export const buildAcademicYearOptions = ({
    students = [],
    feeStructures = [],
    adminYears = [],
} = {}) => {
    const fromAdmin = (adminYears || []).map((year) => (
        typeof year === 'string' ? year : year?.name
    )).filter(Boolean)
    const currentAdmin = (adminYears || []).find((year) => year?.isCurrent)?.name
    const fromStructures = feeStructures.map((row) => row.academicYear).filter(Boolean)
    const fromStudents = students.map((row) => row.academicYear).filter(Boolean)
    const merged = [
        ...fromAdmin,
        currentAdmin,
        ...fromStructures,
        ...fromStudents,
        DEFAULT_ACADEMIC_YEAR,
        ...FINANCE_ACADEMIC_YEARS,
    ].map((year) => String(year || '').trim()).filter(Boolean)
    return {
        years: [...new Set(merged)],
        currentYear: currentAdmin || fromStructures[0] || DEFAULT_ACADEMIC_YEAR,
    }
}

/** Load Admin academic years when the caller has a token (Account Head included). */
export const loadAdminAcademicYears = async () => {
    if (!isApiAuthEnabled() || !getAccessToken()) return []
    try {
        // Prefer masters API even if VITE_USE_API_CLASSES is off — Account Head still needs campus years.
        if (canUseClassDetailsApi() || getAccessToken()) {
            return await listAcademicYears()
        }
    } catch {
        /* fall through */
    }
    return []
}
