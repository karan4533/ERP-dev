import { getTransportRows, hydrateTransportRows, saveTransportRows } from '../transportCampus'
import { usesCampusApiForKey } from '../../../services/campusJsonStore'
import {
    getFuelExpenses,
    getOtherExpenses,
    getServiceExpenses,
    TRANSPORT_EXPENSES_STORAGE_KEY,
} from './transportExpensesData'

/** Campus ops collection — never seed demo ₹4.2L / ₹4.8L figures. */
export const TRANSPORT_BUDGET_REQUESTS_STORAGE_KEY = 'schoolerp-transport-budget-requests-v1'

const DEMO_FINANCE_BUDGET_KEY = 'schoolerp-finance-budget-v1'
const LEGACY_LOCAL_BUDGET_KEY = 'schoolerp-transport-budget-requests-v1'

const money = (value) => Number(String(value ?? '').replace(/[^\d.]/g, '')) || 0

const currentAcademicYear = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    // Indian academic year roughly Apr–Mar
    return month >= 4 ? `${year}-${String(year + 1).slice(-2)}` : `${year - 1}-${String(year).slice(-2)}`
}

const previousAcademicYear = () => {
    const current = currentAcademicYear()
    const start = Number(String(current).slice(0, 4))
    if (!Number.isFinite(start)) return ''
    return `${start - 1}-${String(start).slice(-2)}`
}

const periodOf = (row) => String(row.period || row.academicYear || row.year || '').trim()

const isApproved = (row) => /approv/i.test(String(row.status || 'Approved'))

export function getBudgetRequests() {
    // Empty offline seed — do not inject PREVIOUS_SEED / demo amounts.
    return getTransportRows(TRANSPORT_BUDGET_REQUESTS_STORAGE_KEY, [])
}

export function hydrateBudgetRequestsFromApi() {
    if (usesCampusApiForKey(TRANSPORT_BUDGET_REQUESTS_STORAGE_KEY)) {
        try {
            localStorage.removeItem(LEGACY_LOCAL_BUDGET_KEY)
            localStorage.removeItem(DEMO_FINANCE_BUDGET_KEY)
        } catch {
            /* ignore */
        }
    }
    return hydrateTransportRows(TRANSPORT_BUDGET_REQUESTS_STORAGE_KEY)
}

export function saveBudgetRequests(rows) {
    return saveTransportRows(TRANSPORT_BUDGET_REQUESTS_STORAGE_KEY, rows)
}

export const sumExpenseAmounts = () => (
    [...getFuelExpenses(), ...getServiceExpenses(), ...getOtherExpenses()]
        .reduce((sum, row) => sum + money(row.amount), 0)
)

/**
 * Live transport budget overview for TM Expenses.
 * Previous / current = approved campus budget-request rows for those years.
 * Actual = sum of live transport-expenses (fuel + service + other).
 */
export const transportBudgetOverview = () => {
    const requests = getBudgetRequests()
    const approved = requests.filter(isApproved)
    const currentYear = currentAcademicYear()
    const prevYear = previousAcademicYear()

    const sumForPeriod = (period) => approved
        .filter((row) => periodOf(row) === period || (!periodOf(row) && !period))
        .reduce((sum, row) => sum + money(row.amount ?? row.budget), 0)

    let previous = sumForPeriod(prevYear)
    let current = sumForPeriod(currentYear)

    // If periods are not tagged, treat all approved requests as current budget.
    if (!previous && !current && approved.length > 0) {
        current = approved.reduce((sum, row) => sum + money(row.amount ?? row.budget), 0)
    }

    const actual = sumExpenseAmounts()
    const apiLive = usesCampusApiForKey(TRANSPORT_EXPENSES_STORAGE_KEY)
        || usesCampusApiForKey(TRANSPORT_BUDGET_REQUESTS_STORAGE_KEY)

    return {
        previousRequests: approved,
        previous,
        current,
        actual,
        balance: current - actual,
        hasPrevious: previous > 0,
        hasCurrent: current > 0,
        apiLive,
        currentYear,
        previousYear: prevYear,
    }
}
