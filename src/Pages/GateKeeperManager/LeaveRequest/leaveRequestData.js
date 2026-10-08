import {
    LEAVE_TYPES,
    LEAVE_STATUSES,
    statusBadgeColor,
    calculateTotalDays,
    getMyLeaveRequestsForRole,
    createLeaveRequest,
    getLeaveRequestById,
} from '../../../Common/LeaveRequest/leaveRequestData'
import { getSubmitterProfile } from '../../../Common/LeaveRequest/leaveRequestConfigs'

export {
    LEAVE_TYPES,
    LEAVE_STATUSES,
    statusBadgeColor,
    calculateTotalDays,
}

export const HIGHER_HIERARCHY = 'Director'

export const DEFAULT_MANAGER = {
    employeeId: 'GKM-1001',
    name: 'Rajesh Kumar',
}

export const getMyLeaveRequests = () => getMyLeaveRequestsForRole('gatekeepermanager')

export const getMyLeaveRequestById = (id) => {
    const request = getLeaveRequestById(id)
    return request?.submitterRole === 'gatekeepermanager' ? request : null
}

export const createMyLeaveRequest = (payload) => {
    const profile = getSubmitterProfile('gatekeepermanager')
    return createLeaveRequest(
        {
            employeeId: profile.employeeId,
            requestedBy: profile.requestedBy,
            role: profile.role,
            department: profile.department,
            ...payload,
        },
        'gatekeepermanager',
    )
}
