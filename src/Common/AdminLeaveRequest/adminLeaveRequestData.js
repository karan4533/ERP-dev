export {
    LEAVE_TYPES,
    LEAVE_STATUSES,
    statusBadgeColor,
    calculateTotalDays,
    getAllAdminLeaveRequests,
    getAdminLeaveRequestById,
    createAdminLeaveRequest,
    updateAdminLeaveRequestStatus,
    getPendingAdminLeaveApprovalCount,
    getLeaveRequestById,
    getMyLeaveRequestsForRole,
    getReceivedLeaveRequestsForRole,
    createLeaveRequest,
    updateLeaveRequestStatus,
} from '../LeaveRequest/leaveRequestData'

export const REQUESTED_TO = 'Super Admin'

export const DEFAULT_ADMIN = {
    employeeId: 'ADM-001',
    name: 'System Admin',
    role: 'Admin',
    department: 'Administration',
}
