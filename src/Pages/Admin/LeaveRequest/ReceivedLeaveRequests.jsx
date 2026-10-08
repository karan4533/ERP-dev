import ReceivedLeaveRequestsList from '../../../Common/LeaveRequest/ReceivedLeaveRequestsList'

export default function ReceivedLeaveRequests() {
    return (
        <ReceivedLeaveRequestsList
            roleKey='admin'
            description='Leave requests submitted to Admin for approval.'
        />
    )
}
