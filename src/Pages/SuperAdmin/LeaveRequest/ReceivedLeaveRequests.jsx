import ReceivedLeaveRequestsList from '../../../Common/LeaveRequest/ReceivedLeaveRequestsList'

export default function ReceivedLeaveRequests() {
    return (
        <ReceivedLeaveRequestsList
            roleKey='superadmin'
            description='Leave requests submitted by Admin for Super Admin approval.'
        />
    )
}
