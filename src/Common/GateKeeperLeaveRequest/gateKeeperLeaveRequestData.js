export {
    LEAVE_TYPES,
    LEAVE_STATUSES,
    statusBadgeColor,
    calculateTotalDays,
    getAllLeaveRequests,
    getLeaveRequestById,
    getLeaveRequestsByEmployeeId,
    updateLeaveRequestStatus,
    getPendingLeaveApprovalCount,
    createGatekeeperLeaveRequest,
    updateGatekeeperLeaveRequestStatus,
    getPendingGatekeeperLeaveApprovalCount,
} from '../LeaveRequest/leaveRequestData'

export const REQUESTED_TO = 'Gate Keeper Manager'

export const DEFAULT_GATEKEEPER = {
    employeeId: 'GK-1001',
    name: 'Suresh Menon',
}

export { createGatekeeperLeaveRequest as createLeaveRequest } from '../LeaveRequest/leaveRequestData'
