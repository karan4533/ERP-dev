import ReceivedLeaveRequestsList from '../../../Common/LeaveRequest/ReceivedLeaveRequestsList'

export default function LeaveRequest() {
    return (
        <ReceivedLeaveRequestsList
            roleKey='transportmanager'
            description='Leave requests submitted by drivers for approval.'
        />
    )
}
