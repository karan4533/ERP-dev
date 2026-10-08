import { ROLES } from '../../../constants/roles'
import {
    calculateTotalDays,
    getLeaveRequestById as getUnifiedLeaveRequest,
    getMyLeaveRequestsForRole,
    LEAVE_TYPES,
} from '../../../Common/LeaveRequest/leaveRequestData'

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected']

export { LEAVE_TYPES, calculateTotalDays }

export const DEFAULT_DRIVER = {
    driverName: 'Suresh Kumar',
    driverId: 'DRV001',
}

export const approvalStatusBadgeColor = {
    Pending: 'bg-[#FF57221A] text-[#FF5722]',
    Approved: 'bg-[#4CAF501A] text-[#4CAF50]',
    Rejected: 'bg-[#6670851A] text-[#667085]',
}

const mapToDriverRecord = (request) => ({
    id: request.id,
    leaveRequestId: request.leaveRequestId,
    driverName: request.requestedBy,
    driverId: request.employeeId,
    leaveType: request.leaveType,
    fromDate: request.fromDate,
    toDate: request.toDate,
    totalDays: request.totalDays,
    reason: request.reason,
    appliedDate: request.appliedDate,
    approvalStatus: request.status,
})

export const LEAVE_REQUESTS = []

export const getLeaveRequestById = (id) => {
    const request = getUnifiedLeaveRequest(id)
    if (!request || request.submitterRole !== ROLES.DRIVER) return null
    return mapToDriverRecord(request)
}

const parseDate = (value) => {
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterLeaveRequests = ({
    records,
    search = '',
    approvalStatus = '',
    fromDate = null,
    toDate = null,
}) => {
    const source = records?.length ? records : getMyLeaveRequestsForRole(ROLES.DRIVER).map(mapToDriverRecord)
    return source.filter((record) => {
        const query = search.trim().toLowerCase()
        const matchesSearch = !query || [
            record.leaveRequestId,
            record.driverName,
            record.driverId,
            record.leaveType,
            record.reason,
        ].some((field) => String(field).toLowerCase().includes(query))

        const matchesStatus = !approvalStatus || record.approvalStatus === approvalStatus

        const appliedDate = parseDate(record.appliedDate)
        const matchesFrom = !fromDate || (appliedDate && appliedDate >= fromDate)
        const matchesTo = !toDate || (appliedDate && appliedDate <= toDate)

        return matchesSearch && matchesStatus && matchesFrom && matchesTo
    })
}
