import React from 'react'
import StudentAllocationList from '../../../Common/StudentAllocation/StudentAllocationList'
import { PRINCIPAL_APPROVAL_LIST_PATH } from '../../../Common/StudentAllocation/studentAllocationData'

const PrincipalStudentAllocationApproval = () => (
    <StudentAllocationList
        mode='allocator'
        listPath={PRINCIPAL_APPROVAL_LIST_PATH}
        defaultStatusFilter='Pending Allocation'
    />
)

export default PrincipalStudentAllocationApproval
