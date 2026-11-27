import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { EXPENSE_COLUMNS, loadFinanceExpensesByKeyword } from '../liveExpenseLoader'

export default function OtherExpensesList() {
    const loadRows = useCallback(() => loadFinanceExpensesByKeyword([]), [])
    return (
        <AdminLiveDataList
            title='Other Expenses'
            description='All live finance OUT transactions.'
            columns={EXPENSE_COLUMNS}
            loadRows={loadRows}
            searchKeys={['narration', 'category', 'voucherNo']}
        />
    )
}
