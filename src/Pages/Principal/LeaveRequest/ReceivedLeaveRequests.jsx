import ReceivedLeaveRequestsList from '../../../Common/LeaveRequest/ReceivedLeaveRequestsList'

export default function ReceivedLeaveRequests() {
    return (
        <ReceivedLeaveRequestsList
            roleKey='principal'
            description='Teacher and coordinator leave requests awaiting Principal. Your approval forwards the request to HR for final confirmation.'
        />
    )
}
