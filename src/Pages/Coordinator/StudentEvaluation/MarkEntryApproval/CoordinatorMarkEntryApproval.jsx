import React from 'react'
import MarkEntryApprovalTierView from '../../../../Common/MarkEntryApproval/MarkEntryApprovalTierView'

const CoordinatorMarkEntryApproval = () => (
    <MarkEntryApprovalTierView
        role="Coordinator"
        listBasePath="/coordinator/student-evaluation/mark-entry-approval"
        reviewBasePath="/coordinator/student-evaluation/mark-entry-approval/review"
        reportCardPath="/coordinator/student-evaluation/report-cards"
    />
)

export default CoordinatorMarkEntryApproval
