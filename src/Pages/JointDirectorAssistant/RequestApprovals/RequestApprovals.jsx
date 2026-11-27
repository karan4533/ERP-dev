import CampusApprovalsInbox from '../../../Common/Approvals/CampusApprovalsInbox'

export default function RequestApprovals() {
    return (
        <CampusApprovalsInbox
            viewBasePath="/joint-director-assistant/request-approvals/view-request"
            description="Live approvals waiting on Joint Director Assistant."
            emptyLabel="No approval requests waiting for Joint Director Assistant."
        />
    )
}
