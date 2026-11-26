import React from 'react'
import AdminExpensesWorkspace from '../AdminExpensesWorkspace'

/**
 * @deprecated Per Document 7 compliance, Admin transport expense list has been integrated with centralized Finance (Account Head).
 */
export default function TransportExpensesList() {
    return <AdminExpensesWorkspace view='approvals' />
}
