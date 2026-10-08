import React from 'react'
import StudentAllocationList from './StudentAllocationList'

const StudentAllocationApproval = () => (
    <StudentAllocationList
        mode='approver'
        listPath='/director/student-allocation-approval'
        defaultStatusFilter='Pending Approval'
    />
)

export default StudentAllocationApproval
