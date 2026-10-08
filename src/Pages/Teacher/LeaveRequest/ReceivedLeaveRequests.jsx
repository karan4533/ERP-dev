import { useEffect } from 'react'
import ReceivedLeaveRequestsList from '../../../Common/LeaveRequest/ReceivedLeaveRequestsList'
import { ensureTeacherStudentLeaveSeed } from '../../../Common/LeaveRequest/leaveRequestData'

export default function ReceivedLeaveRequests() {
    useEffect(() => {
        ensureTeacherStudentLeaveSeed()
    }, [])
    return (
        <ReceivedLeaveRequestsList
            roleKey='teacher'
            description='Student leave requests in the shared leave store. Approve and reject update that same record.'
        />
    )
}
