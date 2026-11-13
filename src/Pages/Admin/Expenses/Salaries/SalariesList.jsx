import React from 'react'
import AdminExpensesWorkspace from '../AdminExpensesWorkspace'

/**
 * @deprecated Per Document 7 compliance, Admin salary/expense lists have been integrated with centralized Finance (Account Head).
 */
export default function SalariesList() {
    return <AdminExpensesWorkspace view='approvals' />
}
