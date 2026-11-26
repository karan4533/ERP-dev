import React from 'react'
import MarkEntryApprovalTierView from '../../../Common/MarkEntryApproval/MarkEntryApprovalTierView'

const PrincipalMarkEntryApproval = () => (
    <MarkEntryApprovalTierView
        role="Principal"
        listBasePath="/principal/mark-entry-approval"
        reviewBasePath="/principal/mark-entry-approval/review"
        reportCardPath="/principal/student-evaluation/report-cards"
    />
)

export default PrincipalMarkEntryApproval
