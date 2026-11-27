import CampusApprovalsInbox from '../../../Common/Approvals/CampusApprovalsInbox'

export default function RequestApprovals() {
    return (
        <CampusApprovalsInbox
            viewBasePath="/joint-director-audit/request-approvals/view-request"
            description="Live approvals waiting on Joint Director Audit."
            emptyLabel="No approval requests waiting for Joint Director Audit."
        />
    )
}
