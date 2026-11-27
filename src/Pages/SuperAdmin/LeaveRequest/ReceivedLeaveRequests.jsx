import ReceivedLeaveRequestsList from '../../../Common/LeaveRequest/ReceivedLeaveRequestsList'

export default function ReceivedLeaveRequests() {
    return (
        <ReceivedLeaveRequestsList
            roleKey='superadmin'
            description='Live campus leave inbox (GET /leave-requests). Includes requests awaiting Super Admin and campus-wide leave visible to this role.'
        />
    )
}
