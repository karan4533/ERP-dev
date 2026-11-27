import CampusApprovalsInbox from '../../../Common/Approvals/CampusApprovalsInbox'
import DepartmentRequestsInbox from './DepartmentRequestsInbox'

export default function RequestApprovals() {
    return (
        <>
            <CampusApprovalsInbox
                viewBasePath="/joint-director/request-approvals/view-request"
                description="Live approvals waiting on Joint Director."
                emptyLabel="No approval requests waiting for Joint Director."
            />
            <DepartmentRequestsInbox />
        </>
    )
}
