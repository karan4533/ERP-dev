import React from 'react'
import AdminExpensesWorkspace from '../AdminExpensesWorkspace'

/**
 * @deprecated Per Document 7 compliance, Admin other expense list has been integrated with centralized Finance (Account Head).
 */
export default function OtherExpensesList() {
    return <AdminExpensesWorkspace view='approvals' />
}
