import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { EXPENSE_COLUMNS, loadFinanceExpensesByKeyword } from '../liveExpenseLoader'

export default function HostelExpensesList() {
    const loadRows = useCallback(() => loadFinanceExpensesByKeyword(['hostel', 'boarding', 'mess']), [])
    return (
        <AdminLiveDataList
            title='Hostel Expenses'
            description='Live finance OUT transactions for hostel-related spend.'
            columns={EXPENSE_COLUMNS}
            loadRows={loadRows}
            searchKeys={['narration', 'category', 'voucherNo']}
        />
    )
}
