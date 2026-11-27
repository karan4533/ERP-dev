import { pullFinanceState } from '../../../services/financeApi'
import { formatCurrency } from '../../AccountHead/financeDomain/financeHelpers'

export const EXPENSE_COLUMNS = [
    { key: 'transactionDate', label: 'Date' },
    { key: 'narration', label: 'Narration' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'voucherNo', label: 'Voucher' },
]

export async function loadFinanceExpensesByKeyword(keywords = []) {
    const state = await pullFinanceState()
    const data = state?.data || state || {}
    const transactions = Array.isArray(data.transactions) ? data.transactions : []
    const keys = keywords.map((k) => String(k).toLowerCase())
    return transactions
        .filter((row) => {
            if (row.direction && row.direction !== 'OUT') return false
            const blob = `${row.category || ''} ${row.narration || ''} ${row.sourceModule || ''}`.toLowerCase()
            return keys.length === 0 || keys.some((key) => blob.includes(key))
        })
        .map((row) => ({
            id: row.id,
            transactionDate: row.transactionDate || row.date || '—',
            narration: row.narration || '—',
            category: row.category || 'Expense',
            amount: formatCurrency(row.amount || 0),
            status: row.status || '—',
            voucherNo: row.voucherNo || row.reference || '—',
        }))
}
