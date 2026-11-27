import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { EXPENSE_COLUMNS, loadFinanceExpensesByKeyword } from '../liveExpenseLoader'

export default function TransportExpensesList() {
    const loadRows = useCallback(() => loadFinanceExpensesByKeyword(['transport', 'fuel', 'fleet', 'vehicle']), [])
    return (
        <AdminLiveDataList
            title='Transport Expenses'
            description='Live finance OUT transactions for transport/fuel/fleet spend.'
            columns={EXPENSE_COLUMNS}
            loadRows={loadRows}
            searchKeys={['narration', 'category', 'voucherNo']}
        />
    )
}
