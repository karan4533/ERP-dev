/**
 * Principal reuses the same staff star-ratings browser SoT as Director
 * (`director-staff-star-ratings` localStorage). Shared FE SoT — not REST.
 */
export {
    MAX_STARS,
    RATING_CATEGORY,
    SOY_MONTH_COUNT,
    STORAGE_KEY,
    EMPLOYEE_TYPE_OPTIONS,
    ACADEMIC_YEARS,
    ACADEMIC_YEAR_MONTHS,
    TEACHER_OPTIONS,
    COORDINATOR_OPTIONS,
    SEED_SOM_RATINGS,
    MOCK_SOM_RATINGS,
    saveSomRatings,
    getSomRatings,
    nextSomRatingId,
    addSomRating,
    getEmployeeTypeLabel,
    getAvailableSomMonths,
    getSomRatingsByMonth,
    getStarOfMonth,
    getConsolidatedSoyRatings,
    getStarOfYear,
    getEmployeesByType,
} from '../../Director/StarRatings/starRatingsData'

export const ROUTE_BASE = '/principal/star-ratings'
export const SOM_ROUTE = `${ROUTE_BASE}/star-of-month`
