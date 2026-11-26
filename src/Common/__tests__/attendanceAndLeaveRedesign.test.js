import test from 'node:test'
import assert from 'node:assert/strict'
import {
    submitLeaveRequest,
    updateLeaveRequestDecision,
    cancelLeaveRequest,
    calculateEmployeeLeaveBalance,
    calculateWorkingDays,
    previewCarryForward,
    executeCarryForward,
    adjustEmployeeLeaveBalance,
    updateHrPolicyCategory,
    canUserManagePolicies,
    getRoleAwareKPIs,
    getAuthorizedAttendanceRecords,
    getAuthorizedReceivedLeaveRequests,
    getMyLeaveRequests,
    getLeaveLedger,
    directAdminAttendanceOverride,
    canRoleDecideLeave,
    getAttendanceRecords,
    ENTERPRISE_EMPLOYEES,
    FULL_ACCESS_MANAGEMENT_ROLES
} from '../AttendanceAndLeave/attendanceLeaveData.js'

test('Attendance & Leave Management Redesign Test Suite', async (t) => {
    await t.test('1. Working Days Calculation: skips Sundays, 2nd & 4th Saturdays, and institutional holidays', () => {
        // Monday 03-11-2026 to Friday 07-11-2026: 5 working days
        const fullWeekDays = calculateWorkingDays('03-11-2026', '07-11-2026', false)
        assert.equal(fullWeekDays, 5)

        // Monday 03-11-2026 to Sunday 09-11-2026 (7 calendar days, Sunday off) -> 6 working days
        const spanWithSunday = calculateWorkingDays('03-11-2026', '09-11-2026', false)
        assert.equal(spanWithSunday, 6)

        // Half-day flag returns 0.5
        const halfDay = calculateWorkingDays('04-11-2026', '04-11-2026', true)
        assert.equal(halfDay, 0.5)
    })

    await t.test('2. Role-Aware Dynamic KPIs: Management vs Employee views', () => {
        // Management role (e.g. Principal / Super Admin / PRM)
        const mgmtKPIs = getRoleAwareKPIs('principal', 'EMP-PRIN-001', 'principal@school.com')
        assert.equal(mgmtKPIs.isManagement, true)
        assert.ok(typeof mgmtKPIs.totalStaff === 'number')
        assert.ok(typeof mgmtKPIs.presentToday === 'number')
        assert.ok(typeof mgmtKPIs.onLeaveToday === 'number')
        assert.ok(typeof mgmtKPIs.pendingLeaveApprovals === 'number')

        // Employee role (e.g. Teacher)
        const empKPIs = getRoleAwareKPIs('teacher', 'EMP-TCH-006', 'ananya.roy@school.com')
        assert.equal(empKPIs.isManagement, false)
        assert.ok(typeof empKPIs.presentDays === 'number')
        assert.ok(typeof empKPIs.leaveBalance === 'number')
        assert.ok(typeof empKPIs.pendingLeaveRequests === 'number')
        assert.ok(typeof empKPIs.approvedLeaveDays === 'number')
    })

    await t.test('3. Full Access Management Roles: All 8 roles have organization-wide access', () => {
        const requiredFullAccessRoles = [
            'prm',
            'principal',
            'director',
            'joint-director',
            'joint-director-assistant',
            'joint-director-audit',
            'super-admin',
            'admin'
        ]

        requiredFullAccessRoles.forEach((role) => {
            const records = getAuthorizedAttendanceRecords(role, 'admin@school.com', 'EMP-001')
            assert.ok(records.length >= getAttendanceRecords().length - 2, `${role} should see organization records`)

            const leaves = getAuthorizedReceivedLeaveRequests(role, 'admin@school.com')
            assert.ok(Array.isArray(leaves), `${role} should receive subordinate leave requests`)
        })
    })

    await t.test('4. Employee Data Isolation: Unauthorized roles only see their own attendance/leaves', () => {
        const teacherRecords = getAuthorizedAttendanceRecords('teacher', 'ananya.roy@school.com', 'EMP-TCH-006')
        assert.equal(teacherRecords.length, 1)
        assert.equal(teacherRecords[0].employeeId, 'EMP-TCH-006')

        const teacherLeaves = getAuthorizedReceivedLeaveRequests('teacher', 'ananya.roy@school.com')
        assert.equal(teacherLeaves.length, 0, 'Individual teacher should receive no subordinate leave requests')
    })

    await t.test('5. Leave Application & Approval Workflow with Attendance Synchronization', () => {
        // Step A: Employee applies for leave
        const app = submitLeaveRequest({
            employeeId: 'EMP-TCH-006',
            employeeName: 'Ananya Roy',
            department: 'Academics & Teaching',
            designation: 'Chemistry Faculty',
            leaveType: 'Casual Leave',
            leaveTypeCode: 'CL',
            startDate: '10-11-2026',
            endDate: '11-11-2026',
            isHalfDay: false,
            reason: 'Family wedding event'
        })
        assert.ok(app.id)
        assert.equal(app.status, 'Pending')

        // Step B: Rejection requires mandatory remarks
        assert.throws(() => {
            updateLeaveRequestDecision(app.id, 'Rejected', 'Dr. Ramanathan K', '   ')
        }, /rejection rationale is mandatory/i)

        // Step C: Authorized approval
        const approvedRes = updateLeaveRequestDecision(
            app.id,
            'Approved',
            'Dr. Ramanathan K (Principal)',
            'Approved for family event.'
        )
        assert.equal(approvedRes.request.status, 'Approved')

        // Step D: Verify attendance synchronized to 'On Leave'
        const att = approvedRes.ledger.find((a) => a.employeeId === 'EMP-TCH-006')
        assert.ok(att)
        assert.equal(att.status, 'On Leave')
        assert.equal(att.leaveRequestId, app.id)

        // Step E: Cancellation reverts attendance
        const cancelRes = cancelLeaveRequest(app.id, 'Event postponed')
        assert.equal(cancelRes.request.status, 'Cancelled')
        const revertedAtt = cancelRes.ledger.find((a) => a.employeeId === 'EMP-TCH-006')
        assert.equal(revertedAtt.status, 'Present')
    })

    await t.test('6. HR Policy Administration: Academic vs Non-Academic policy separation and updates', () => {
        assert.equal(canUserManagePolicies('hr'), true)
        assert.equal(canUserManagePolicies('super-admin'), true)
        assert.equal(canUserManagePolicies('admin'), true)
        assert.equal(canUserManagePolicies('teacher'), false)
        assert.equal(canUserManagePolicies('librarian'), false)

        // Update Academic policy category
        const updatedAcad = updateHrPolicyCategory('Academic', {
            code: 'CL',
            name: 'Casual Leave',
            annualEntitlement: 14,
            carryForwardAllowed: true,
            maxCarryForward: 6
        }, 'HR Manager')

        const cl = updatedAcad.categories.find((c) => c.code === 'CL')
        assert.equal(cl.annualEntitlement, 14)
        assert.equal(cl.maxCarryForward, 6)
    })

    await t.test('7. HR Adjustment to Leave Balance Ledger with Audit Log', () => {
        const tx = adjustEmployeeLeaveBalance({
            employeeId: 'EMP-TCH-006',
            leaveTypeCode: 'CL',
            adjustmentType: 'CREDIT',
            days: 2,
            remarks: 'Special compensatory credit granted by Principal for Sunday science exhibition',
            performedBy: 'HR Admin'
        })

        assert.ok(tx.id)
        assert.equal(tx.creditedDays, 2)
        assert.equal(tx.transactionType, 'HR Adjustment')
        assert.ok(tx.remarks.includes('Special compensatory credit'))

        const ledger = getLeaveLedger('EMP-TCH-006')
        assert.ok(ledger.some((t) => t.id === tx.id))
    })

    await t.test('8. Leave Carry-Forward Engine: Preview and Idempotent Execution', () => {
        // Step A: Preview
        const preview = previewCarryForward({
            staffCategory: 'Academic',
            sourceYear: '2025-2026',
            targetYear: '2026-2027'
        })
        assert.ok(Array.isArray(preview))
        assert.ok(preview.length > 0)
        assert.ok(preview[0].maxLimit >= 0)

        // Step B: Execute carry-forward first time
        const res1 = executeCarryForward({
            staffCategory: 'Academic',
            sourceYear: '2025-2026',
            targetYear: '2026-2027',
            performedBy: 'HR Administrator'
        })
        assert.equal(res1.success, true)
        assert.ok(res1.processedCount >= 0)

        // Step C: Execute carry-forward second time -> must be IDEMPOTENT (no duplicate credits)
        const res2 = executeCarryForward({
            staffCategory: 'Academic',
            sourceYear: '2025-2026',
            targetYear: '2026-2027',
            performedBy: 'HR Administrator'
        })
        assert.equal(res2.success, true)
        assert.equal(res2.processedCount, 0, 'Subsequent execution must process 0 new items to ensure idempotency')
        assert.ok(res2.skippedCount > 0, 'Subsequent execution must skip all previously processed items')
    })

    await t.test('9. Attendance Regularization & Override with Audit Trail', () => {
        const override = directAdminAttendanceOverride(
            'EMP-TCH-006',
            '31-10-2026',
            '08:25 AM',
            '03:50 PM',
            'Present',
            'Biometric SilkBio gate device sensor sync correction',
            'HR Administrator'
        )
        assert.ok(override)
        assert.equal(override.status, 'Present')
        assert.equal(override.checkInTime, '08:25 AM')
        assert.ok(override.remarks.includes('Admin Override'))
    })

    await t.test('10. PRM & Department Heads View-Only vs HR Decision Authority', () => {
        // PRM and Department Heads can view all authorized data
        const prmAttendance = getAuthorizedAttendanceRecords('prm')
        assert.ok(prmAttendance.length >= 20, 'PRM must have visibility over all organization attendance records')

        const prmLeaves = getAuthorizedReceivedLeaveRequests('prm')
        assert.ok(prmLeaves.length > 0, 'PRM must have visibility over leave applications')

        // Only HR has decision authority
        assert.equal(canRoleDecideLeave('prm'), false, 'PRM cannot make accept/reject decisions')
        assert.equal(canRoleDecideLeave('coordinator'), false, 'Department heads cannot make accept/reject decisions')
        assert.equal(canRoleDecideLeave('transport-manager'), false, 'Transport manager cannot make accept/reject decisions')
        assert.equal(canRoleDecideLeave('hr'), true, 'HR role has decision authority')
        assert.equal(canRoleDecideLeave('super-admin'), true, 'Super Admin has decision authority')

        // Non-HR calling updateLeaveRequestDecision must throw unauthorized error
        const req = submitLeaveRequest({
            employeeId: 'EMP-TCH-006',
            employeeName: 'Ananya Roy',
            department: 'Academics & Teaching',
            designation: 'Faculty',
            leaveType: 'Casual Leave',
            leaveTypeCode: 'CL',
            startDate: '2026-11-20',
            endDate: '2026-11-20',
            totalDays: 1,
            isHalfDay: false,
            reason: 'Medical checkup',
            approver: 'Human Resources Department (Sunita Deshmukh)'
        })

        assert.throws(
            () => updateLeaveRequestDecision(req.id, 'Approved', 'Kavita Reddy', 'Approved by PRM', 'prm'),
            /Only Human Resources \(HR\) is authorized to accept or reject leave applications/
        )

        // HR successfully approves
        const approved = updateLeaveRequestDecision(req.id, 'Approved', 'Sunita Deshmukh', 'Sanctioned by HR', 'hr')
        assert.equal(approved.success, true)
        assert.equal(approved.request.status, 'Approved')
    })

    await t.test('11. Short Permission Application & Personal Leave Management', () => {
        // PRM (EMP-PRM-001) has personal leave balances & personal leave management
        const prmBalance = calculateEmployeeLeaveBalance('EMP-PRM-001')
        assert.ok(prmBalance, 'PRM must have personal statutory leave balance')
        assert.ok(prmBalance.categories.some(c => c.code === 'PERM'), 'Policy must include PERM (Permission) option')
        assert.ok(prmBalance.categories.some(c => c.code === 'CL'), 'Policy must include CL')

        const prmMyLeaves = getMyLeaveRequests('EMP-PRM-001')
        assert.ok(Array.isArray(prmMyLeaves), 'PRM must have personal leave requests history')

        // Submit a short Permission application (max 2 hours, 0 days deducted)
        const permReq = submitLeaveRequest({
            employeeId: 'EMP-PRM-001',
            employeeName: 'Kavita Reddy',
            department: 'Public Relations & Reception',
            designation: 'Public Relations Manager',
            leaveType: 'Permission',
            leaveCategory: 'Permission',
            leaveTypeCode: 'PERM',
            startDate: '2026-11-25',
            endDate: '2026-11-25',
            totalDays: 0,
            isHalfDay: false,
            isPermission: true,
            permissionHours: 2,
            permissionSession: 'Morning Session (08:30 AM - 10:30 AM)',
            reason: 'Official visit to educational board liaison desk',
            approver: 'Human Resources Department (Sunita Deshmukh)',
            approverRole: 'hr'
        })

        assert.ok(permReq)
        assert.equal(permReq.leaveTypeCode, 'PERM')
        assert.equal(permReq.totalDays, 0, 'Permission must deduct 0 full days from leave balance')
        assert.equal(permReq.permissionHours, 2, 'Permission must be up to 2 hours')

        // More than 2 hours permission must be rejected as per HR policy
        assert.throws(
            () => submitLeaveRequest({
                employeeId: 'EMP-PRM-001',
                employeeName: 'Kavita Reddy',
                leaveType: 'Permission',
                leaveCategory: 'Permission',
                totalDays: 0,
                permissionHours: 3,
                reason: 'Extended absence'
            }),
            /Permission request cannot exceed a maximum of 2 hours/
        )
    })
})

