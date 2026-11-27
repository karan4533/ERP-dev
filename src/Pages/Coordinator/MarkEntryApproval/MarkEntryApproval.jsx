import MarkApprovalListPage from '../../../Common/MarkEntryApproval/MarkApprovalListPage'

/** Coordinator approval step — same path main already ships in the sidebar. */
const MarkEntryApproval = () => (
    <MarkApprovalListPage
        basePath='/coordinator/student-evaluation/mark-entry-approval'
        role='coordinator'
    />
)

export default MarkEntryApproval
