import test from 'node:test'
import assert from 'node:assert/strict'
import {
    DEPARTMENT_SHIFTS,
    DEFAULT_HR_POLICIES,
    parseTimeStringToMinutes,
    formatMinutesToDuration,
    evaluateAttendanceTimings,
    calculateOverviewKPIs,
    calculateEmployeeLeaveBalance,
    getAuthorizedAttendanceRecords,
    getAuthorizedReceivedLeaveRequests,
    getMyLeaveRequests,
    updateLeaveRequestDecision,
    submitLeaveRequest,
    cancelLeaveRequest,
    getPolicyForCategory,
    ENTERPRISE_EMPLOYEES,
    SEED_ATTENDANCE_LEDGER,
    SEED_LEAVE_REQUESTS,
    getAttendanceRecords
} from '../attendanceLeaveData.js'

test('1. Department Shift Timings & Grace Period Late Evaluations', () => {
    // Academic department: 08:30 AM start, 10 min grace period -> late threshold is 08:40 AM
    const acadShift = DEPARTMENT_SHIFTS.find(s => s.department.includes('Academic'))
    assert.ok(acadShift)
    assert.equal(acadShift.startTime, '08:30 AM')
    assert.equal(acadShift.gracePeriodMinutes, 10)

    // Check-in at 08:35 AM (within grace): should be On Time
    const onTimeEval = evaluateAttendanceTimings('Academic', '08:35 AM', '04:30 PM')
    assert.equal(onTimeEval.isLate, false)
    assert.equal(onTimeEval.lateMinutes, 0)
    assert.equal(onTimeEval.status, 'Present')

    // Check-in at 08:45 AM (after grace): should be Late Arrival with 15 mins late duration
    const lateEval = evaluateAttendanceTimings('Academic', '08:45 AM', '04:30 PM')
    assert.equal(lateEval.isLate, true)
    assert.equal(lateEval.lateMinutes, 15)
    assert.equal(lateEval.status, 'Late Arrival')

    // Stores department: 09:00 AM start, 15 min grace period -> late threshold is 09:15 AM
    const storesShift = DEPARTMENT_SHIFTS.find(s => s.department.includes('Stores'))
    assert.ok(storesShift)
    assert.equal(storesShift.startTime, '09:00 AM')
    assert.equal(storesShift.gracePeriodMinutes, 15)

    // Check-in at 09:12 AM: within 15 min grace -> On Time
    const storesOnTime = evaluateAttendanceTimings('Stores & Procurement', '09:12 AM', '05:30 PM')
    assert.equal(storesOnTime.isLate, false)
    assert.equal(storesOnTime.status, 'Present')

    // Early departure test: shift ends at 04:30 PM. Check-out at 03:45 PM -> 45 mins early
    const customShift = { startTime: '08:30 AM', endTime: '04:30 PM', gracePeriodMinutes: 10 }
    const earlyEval = evaluateAttendanceTimings('08:25 AM', '03:45 PM', customShift)
    assert.equal(earlyEval.isEarlyDeparture, true)
    assert.equal(earlyEval.earlyMinutes, 45)
    assert.equal(earlyEval.status, 'Early Departure')
})

test('2. Academic vs Non-Academic HR Policy Separation and Entitlements', () => {
    const acadPolicy = getPolicyForCategory('Academic')
    const nonAcadPolicy = getPolicyForCategory('Non-Academic')

    assert.ok(acadPolicy, 'Academic policy should exist')
    assert.ok(nonAcadPolicy, 'Non-Academic policy should exist')

    // Academic entitlement: 12 days Casual Leave, 10 days Sick Leave
    const acadCL = acadPolicy.categories.find(l => l.code === 'CL')
    assert.equal(acadCL.annualEntitlement, 12)
    const nonAcadCL = nonAcadPolicy.categories.find(l => l.code === 'CL')
    assert.equal(nonAcadCL.annualEntitlement, 14)

    // Earned Leave carry forward cap test
    const acadEL = acadPolicy.categories.find(l => l.code === 'EL')
    const nonAcadEL = nonAcadPolicy.categories.find(l => l.code === 'EL')
    assert.equal(acadEL.annualEntitlement, 15)
    assert.equal(acadEL.maxCarryForward, 15) // Academic max carry forward 15 days

    assert.equal(nonAcadEL.annualEntitlement, 18)
    assert.equal(nonAcadEL.maxCarryForward, 20) // Non-Academic max carry forward 20 days

    // Non-Academic specific category CompOff vs Academic statutory Maternity
    assert.ok(nonAcadPolicy.categories.some(c => c.code === 'CompOff'))
    assert.ok(acadPolicy.categories.some(c => c.code === 'MatL'))
})

test('3. 8 KPI Metrics Calculation with Counts and Percentages', () => {
    const kpis = calculateOverviewKPIs(SEED_ATTENDANCE_LEDGER, SEED_LEAVE_REQUESTS, ENTERPRISE_EMPLOYEES.length)

    // Verify all 8 required KPI keys exist
    assert.ok('totalEmployees' in kpis)
    assert.ok('presentToday' in kpis)
    assert.ok('absentToday' in kpis)
    assert.ok('onLeaveToday' in kpis)
    assert.ok('lateArrivals' in kpis)
    assert.ok('earlyDepartures' in kpis)
    assert.ok('pendingLeaveRequests' in kpis)
    assert.ok('approvedLeaveRequests' in kpis)

    // Verify percentages and calculations
    assert.equal(kpis.totalEmployees, ENTERPRISE_EMPLOYEES.length)
    assert.ok(kpis.presentPercentage >= 0 && kpis.presentPercentage <= 100)
    assert.ok(kpis.latePercentage >= 0 && kpis.latePercentage <= 100)

    // Pending and approved leave request counts
    const pendingCount = SEED_LEAVE_REQUESTS.filter(r => r.status === 'Pending').length
    const approvedCount = SEED_LEAVE_REQUESTS.filter(r => r.status === 'Approved').length
    assert.equal(kpis.pendingLeaveRequests, pendingCount)
    assert.equal(kpis.approvedLeaveRequests, approvedCount)
})

test('4. Leave Balance & Carry-Forward Engine', () => {
    // EMP-TCH-006 (Ananya Roy)
    const balance = calculateEmployeeLeaveBalance('EMP-TCH-006')
    assert.equal(balance.employeeId, 'EMP-TCH-006')
    assert.equal(balance.category, 'Academic')
    assert.ok(balance.categories.length > 0)

    const clBal = balance.categories.find(c => c.code === 'CL')
    assert.ok(clBal)
    // Opening + Annual Allocation - Used = Available
    assert.equal(clBal.availableBalance, clBal.openingBalance + clBal.annualAllocation - clBal.used)
    // Pending does not double deduct available balance
    assert.ok(clBal.pending >= 0)

    // Earned Leave eligible carry-forward should not exceed maxCarryForward cap
    const elBal = balance.categories.find(c => c.code === 'EL')
    assert.ok(elBal.eligibleCarryForward <= elBal.maxCarryForward)
})

test('5. Bi-directional Attendance Synchronization on Approval and Cancellation', () => {
    // Submit a new leave request for EMP-TCH-006 on 31-10-2026
    const newReq = submitLeaveRequest({
        employeeId: 'EMP-TCH-006',
        employeeName: 'Ananya Roy',
        department: 'Academics & Teaching',
        designation: 'Chemistry Faculty (Grade 11-A)',
        leaveType: 'Medical Leave',
        leaveTypeCode: 'SL',
        startDate: '31-10-2026',
        endDate: '31-10-2026',
        isHalfDay: false,
        reason: 'Acute fever and doctor ordered rest'
    })

    assert.ok(newReq.id)
    assert.equal(newReq.status, 'Pending')

    // Approve the leave request with supervisor remarks
    const approvalRes = updateLeaveRequestDecision(
        newReq.id,
        'Approved',
        'Dr. Ramanathan K (Principal)',
        'Get well soon. Medical certificate acknowledged.'
    )
    assert.equal(approvalRes.request.status, 'Approved')

    // Verify synchronization: the employee attendance record for 31-10-2026 must be updated to On Leave
    const syncedAttendance = approvalRes.ledger.find(
        a => a.employeeId === 'EMP-TCH-006' && a.date === '31-10-2026'
    )
    assert.ok(syncedAttendance, 'Attendance record for employee should exist')
    assert.equal(syncedAttendance.status, 'On Leave')
    assert.ok(syncedAttendance.remarks.includes('Approved: Medical Leave'))
    assert.equal(syncedAttendance.leaveRequestId, newReq.id)

    // Now test cancellation of the approved leave: should revert status to Present
    const cancelRes = cancelLeaveRequest(newReq.id, 'Employee recovered and attended morning classes')
    assert.equal(cancelRes.request.status, 'Cancelled')

    const revertedAttendance = cancelRes.ledger.find(
        a => a.employeeId === 'EMP-TCH-006' && a.date === '31-10-2026'
    )
    assert.ok(revertedAttendance)
    assert.equal(revertedAttendance.status, 'Present')
    assert.equal(revertedAttendance.leaveRequestId, null)
})

test('6. Rejection Workflow Requires Rationale and Leaves Attendance Unmutated', () => {
    const req = submitLeaveRequest({
        employeeId: 'EMP-ADM-001',
        employeeName: 'Suresh Raina',
        department: 'Administration',
        designation: 'Administrative Officer',
        leaveType: 'Casual Leave',
        leaveTypeCode: 'CL',
        startDate: '31-10-2026',
        endDate: '31-10-2026',
        isHalfDay: false,
        reason: 'Personal shopping'
    })

    // Rejection without rationale should fail or throw
    assert.throws(() => {
        updateLeaveRequestDecision(req.id, 'Rejected', 'Dr. Kavita Sharma', '   ')
    }, /rejection rationale is mandatory/i)

    // Rejection with proper rationale succeeds
    const rejectionRes = updateLeaveRequestDecision(
        req.id,
        'Rejected',
        'Dr. Kavita Sharma',
        'Quarterly audit in progress. Presence required.'
    )
    assert.equal(rejectionRes.request.status, 'Rejected')
    assert.equal(rejectionRes.request.reviewRemarks, 'Quarterly audit in progress. Presence required.')

    // The attendance ledger remains as Present/On Time, not On Leave
    const att = rejectionRes.ledger.find(a => a.employeeId === 'EMP-ADM-001' && a.date === '31-10-2026')
    if (att) {
        assert.notEqual(att.status, 'On Leave')
    }
})

test('7. Hierarchical Access Scoping Across Roles', () => {
    // 1. Director / Principal sees organization-wide records
    const dirRecords = getAuthorizedAttendanceRecords('director', 'Management', 'EMP-DIR-001')
    assert.equal(dirRecords.length, getAttendanceRecords().length)

    // 2. Department Head (Coordinator / Academic Head) sees all Academic department records
    const coordRecords = getAuthorizedAttendanceRecords('coordinator', 'Academics & Teaching', 'EMP-CRD-001')
    assert.ok(coordRecords.length > 0)
    assert.ok(coordRecords.every(r => r.category === 'Academic' || r.department.includes('Academic') || r.employeeId === 'EMP-CRD-001'))

    // 3. Individual Teacher sees only their own attendance record
    const teacherRecords = getAuthorizedAttendanceRecords('teacher', 'Academics & Teaching', 'EMP-TCH-006')
    assert.equal(teacherRecords.length, 1)
    assert.equal(teacherRecords[0].employeeId, 'EMP-TCH-006')

    // 4. Driver sees only their own attendance record
    const driverRecords = getAuthorizedAttendanceRecords('driver', 'Transport & Fleet Logistics', 'EMP-DRV-001')
    assert.equal(driverRecords.length, 1)
    assert.equal(driverRecords[0].employeeId, 'EMP-DRV-001')

    // 5. Supervisor received leave requests scoping
    const dirReceivedLeaves = getAuthorizedReceivedLeaveRequests('director', 'Management')
    assert.ok(dirReceivedLeaves.length > 0, 'Director receives organization subordinate requests')

    const teacherReceivedLeaves = getAuthorizedReceivedLeaveRequests('teacher', 'Academics & Teaching')
    assert.equal(teacherReceivedLeaves.length, 0, 'Individual teacher receives no subordinate leave requests')

    // 6. My Leave Requests returns only the employee’s own requests
    const myLeaves = getMyLeaveRequests('EMP-TCH-006')
    assert.ok(myLeaves.every(r => r.employeeId === 'EMP-TCH-006'))
})
