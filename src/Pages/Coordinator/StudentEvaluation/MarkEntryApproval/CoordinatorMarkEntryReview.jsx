import React from 'react'
import MarkEntryReviewTierView from '../../../../Common/MarkEntryApproval/MarkEntryReviewTierView'

const CoordinatorMarkEntryReview = () => (
    <MarkEntryReviewTierView
        role="Coordinator"
        listBasePath="/coordinator/student-evaluation/mark-entry-approval"
        reportCardPath="/coordinator/student-evaluation/report-cards"
    />
)

export default CoordinatorMarkEntryReview
