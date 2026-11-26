import React from 'react'
import AdminExpensesWorkspace from '../AdminExpensesWorkspace'

/**
 * @deprecated Per Document 7 compliance, Admin hostel expense list has been integrated with centralized Finance (Account Head).
 */
export default function HostelExpensesList() {
    return <AdminExpensesWorkspace view='approvals' />
}
