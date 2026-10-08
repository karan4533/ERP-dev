import {
    LEAVE_TYPES,
    LEAVE_STATUSES,
    statusBadgeColor,
    calculateTotalDays,
    getLeaveRequestById,
} from '../../../Common/LeaveRequest/leaveRequestData'

export {
    LEAVE_TYPES,
    LEAVE_STATUSES,
    statusBadgeColor,
    calculateTotalDays,
}

export const HIGHER_HIERARCHY = 'Admin'

export const MY_LEAVE_REQUESTS = []
export const RECEIVED_LEAVE_REQUESTS = []

export const getMyLeaveRequestById = (id) => {
    const request = getLeaveRequestById(id)
    return request?.submitterRole === 'director' ? request : null
}

export const getReceivedLeaveRequestById = (id) => {
    const request = getLeaveRequestById(id)
    return request?.approverRole === 'director' ? request : null
}
