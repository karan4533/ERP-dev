import { budgetRows } from '../../../Common/demoDomain/financeExtras'
import { FUEL_EXPENSES, OTHER_EXPENSES, SERVICE_EXPENSES } from './transportExpensesData'

const PREVIOUS_KEY = 'schoolerp-transport-budget-requests-v1'

const PREVIOUS_SEED = [
    { id: 'TBR-2025-26', period: '2025-26', amount: 420000, status: 'Approved' },
]

const money = (value) => Number(String(value ?? '').replace(/[^\d.]/g, '')) || 0

export const getPreviousBudgetRequests = () => {
    try {
        const raw = localStorage.getItem(PREVIOUS_KEY)
        if (raw) return JSON.parse(raw)
    } catch {
        /* use seed */
    }
    localStorage.setItem(PREVIOUS_KEY, JSON.stringify(PREVIOUS_SEED))
    return PREVIOUS_SEED
}

export const transportBudgetOverview = () => {
    const previousRequests = getPreviousBudgetRequests()
    const previous = previousRequests.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    const currentRows = budgetRows().filter((row) => row.department === 'Transport')
    const current = currentRows.reduce((sum, row) => sum + Number(row.budget || 0), 0)
    const actual = [...FUEL_EXPENSES, ...SERVICE_EXPENSES, ...OTHER_EXPENSES]
        .reduce((sum, row) => sum + money(row.amount), 0)
    return {
        previousRequests,
        previous,
        current,
        actual,
        balance: current - actual,
        hasPrevious: previousRequests.length > 0,
    }
}
