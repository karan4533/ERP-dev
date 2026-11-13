import React from 'react'
import MarkEntryReviewTierView from '../../../Common/MarkEntryApproval/MarkEntryReviewTierView'

const PrincipalMarkEntryReview = () => (
    <MarkEntryReviewTierView
        role="Principal"
        listBasePath="/principal/mark-entry-approval"
        reportCardPath="/principal/student-evaluation/report-cards"
    />
)

export default PrincipalMarkEntryReview
