import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { pullFinanceState } from '../../../../services/financeApi'
import { formatCurrency } from '../../../AccountHead/financeDomain/financeHelpers'

const COLUMNS = [
    { key: 'transactionDate', label: 'Date' },
    { key: 'narration', label: 'Narration' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'voucherNo', label: 'Voucher' },
]

export default function SalariesList() {
    const loadRows = useCallback(async () => {
        const state = await pullFinanceState()
        const data = state?.data || state || {}
        const transactions = Array.isArray(data.transactions) ? data.transactions : []
        return transactions
            .filter((row) => {
                if (row.direction && row.direction !== 'OUT') return false
                const blob = `${row.category || ''} ${row.narration || ''} ${row.sourceModule || ''}`.toLowerCase()
                return blob.includes('salary') || blob.includes('payroll') || blob.includes('wage')
            })
            .map((row) => ({
                id: row.id,
                transactionDate: row.transactionDate || row.date || '—',
                narration: row.narration || '—',
                category: row.category || 'Salary',
                amount: formatCurrency(row.amount || 0),
                status: row.status || '—',
                voucherNo: row.voucherNo || row.reference || '—',
            }))
    }, [])

    return (
        <AdminLiveDataList
            title='Salary Expenses'
            description='Live finance OUT transactions categorized as salary/payroll.'
            columns={COLUMNS}
            loadRows={loadRows}
            searchKeys={['narration', 'category', 'voucherNo']}
            addPath='/admin/expenses/add-salaries-exp'
        />
    )
}
