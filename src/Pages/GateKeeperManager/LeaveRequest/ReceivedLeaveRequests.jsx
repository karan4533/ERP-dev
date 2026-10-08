import ReceivedLeaveRequestsList from '../../../Common/LeaveRequest/ReceivedLeaveRequestsList'

export default function ReceivedLeaveRequests() {
    return (
        <ReceivedLeaveRequestsList
            roleKey='gatekeepermanager'
            description='Leave requests submitted by Gate Keepers for approval.'
        />
    )
}
