import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { EXPENSE_COLUMNS, loadFinanceExpensesByKeyword } from '../liveExpenseLoader'

export default function LibraryExpensesList() {
    const loadRows = useCallback(() => loadFinanceExpensesByKeyword(['library', 'book']), [])
    return (
        <AdminLiveDataList
            title='Library Expenses'
            description='Live finance OUT transactions for library spend.'
            columns={EXPENSE_COLUMNS}
            loadRows={loadRows}
            searchKeys={['narration', 'category', 'voucherNo']}
        />
    )
}
