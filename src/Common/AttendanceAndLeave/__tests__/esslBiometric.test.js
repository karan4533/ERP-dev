import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getEsslDevices,
    getBiometricMappings,
    getRawBiometricPunches,
    filterDuplicatePunches,
    computeFirstInLastOut,
    syncEsslDevices,
    resolveUnmappedDeviceUser,
} from '../esslBiometricEngine.js'
import {
    getCorrectionRequests,
    submitAttendanceRegularization,
    approveAttendanceRegularization,
    rejectAttendanceRegularization,
    directAdminAttendanceOverride,
    getAuthorizedCorrectionRequests,
    getStudentAttendanceRecords,
    updateStudentAttendanceStatus,
    markAllStudentAttendance,
    getAttendanceRecords,
    ENTERPRISE_EMPLOYEES,
} from '../attendanceLeaveData.js'

test('1. eSSL Biometric Devices Registry & Active Health', () => {
    const devices = getEsslDevices()
    assert.ok(Array.isArray(devices))
    assert.equal(devices.length, 4, 'Should register 4 default eSSL hardware units')

    const silkBio = devices.find((d) => d.deviceId === 'DEV-ESSL-01')
    assert.ok(silkBio)
    assert.equal(silkBio.name, 'Main Campus Gate - SilkBio')
    assert.equal(silkBio.status, 'Online')
    assert.equal(silkBio.port, 4370)
    assert.ok(silkBio.healthScore >= 95)
})

test('2. Biometric Punch Deduplication & Debounce Window', () => {
    const samplePunches = [
        {
            punchId: 'P1',
            deviceUserId: '1002',
            punchDate: '31-10-2026',
            timestamp: '2026-10-31T08:24:05',
        },
        // Duplicate within 40 seconds (should be filtered)
        {
            punchId: 'P1-DUP',
            deviceUserId: '1002',
            punchDate: '31-10-2026',
            timestamp: '2026-10-31T08:24:45',
        },
        // Valid punch later in the day (Check-out)
        {
            punchId: 'P2',
            deviceUserId: '1002',
            punchDate: '31-10-2026',
            timestamp: '2026-10-31T16:15:00',
        },
    ]

    const deduplicated = filterDuplicatePunches(samplePunches, 2)
    assert.equal(deduplicated.length, 2, 'Debounce window should drop secondary punch within 2 minutes')
    assert.equal(deduplicated[0].punchId, 'P1')
    assert.equal(deduplicated[1].punchId, 'P2')
})

test('3. First-In / Last-Out Biometric Punch Calculation', () => {
    // Principal (EMP-PRN-001 / deviceUserId 1002) has punches on 31-10-2026
    const filo = computeFirstInLastOut('EMP-PRN-001', '31-10-2026')
    assert.ok(filo)
    assert.equal(filo.firstIn, '08:24 AM')
    assert.ok(filo.punchCount >= 1)
})

test('4. eSSL Device Synchronization Trigger', () => {
    const syncRes = syncEsslDevices()
    assert.ok(syncRes.success)
    assert.equal(syncRes.totalDevicesCount, 4)
    assert.equal(syncRes.activeDevicesCount, 4)
    assert.ok(syncRes.totalPunchesProcessed > 0)
})

test('5. Unmapped Biometric User Resolution', () => {
    // Device User ID 9999 is unmapped in seed data
    const rawPunches = getRawBiometricPunches()
    const unmapped = rawPunches.find((p) => p.deviceUserId === '9999')
    assert.ok(unmapped, 'Unmapped seed punch should exist')

    // Resolve unmapped user to EMP-TCH-001
    const newMapping = resolveUnmappedDeviceUser('9999', 'EMP-TCH-001', 'Priya Sundaram', 'Academics & Teaching')
    assert.equal(newMapping.deviceUserId, '9999')
    assert.equal(newMapping.employeeId, 'EMP-TCH-001')

    const mappings = getBiometricMappings()
    assert.ok(mappings.some((m) => m.deviceUserId === '9999'))
})

test('6. Attendance Regularization Submission, Approval & Ledger Sync', () => {
    // Submit regularization request for EMP-TCH-002
    const req = submitAttendanceRegularization({
        employeeId: 'EMP-TCH-002',
        employeeName: 'Meera Nair',
        department: 'Academics & Teaching',
        designation: 'Class Teacher - Grade 10',
        attendanceDate: '31-10-2026',
        requestType: 'MISSING_PUNCH',
        requestedInTime: '08:30 AM',
        requestedOutTime: '03:45 PM',
        shiftName: 'Academic Morning Shift',
        reason: 'Biometric reader timeout at entrance gate',
    })
    assert.ok(req.id.startsWith('CORR-'))
    assert.equal(req.status, 'Pending')

    // Approve the request
    const approveRes = approveAttendanceRegularization(req.id, 'principal', 'Dr. Ramanathan K', 'Verified with gate register')
    assert.ok(approveRes.success)
    assert.equal(approveRes.request.status, 'Approved')

    // Verify ledger record was updated and audit trail recorded
    const ledger = getAttendanceRecords()
    const target = ledger.find((r) => r.employeeId === 'EMP-TCH-002' && r.date === '31-10-2026')
    assert.ok(target)
    assert.equal(target.status, 'Present')
    assert.equal(target.checkInTime, '08:30 AM')
    assert.equal(target.source, 'REGULARIZED')
    assert.ok(target.overrideHistory.length > 0)
    assert.equal(target.overrideHistory[0].changeSource, 'REGULARIZED')
})

test('7. Direct Admin Manual Override with Mandatory Audit Justification', () => {
    // Attempt override without reason -> must throw error
    assert.throws(
        () => {
            directAdminAttendanceOverride({
                employeeId: 'EMP-DIR-001',
                date: '31-10-2026',
                newCheckInTime: '09:00 AM',
                newCheckOutTime: '06:00 PM',
                newStatus: 'Present',
                reason: '', // Empty reason
            })
        },
        /Audit justification reason is mandatory/,
        'Should require audit reason'
    )

    // Override with valid audit justification
    const res = directAdminAttendanceOverride({
        employeeId: 'EMP-DIR-001',
        date: '31-10-2026',
        newCheckInTime: '09:00 AM',
        newCheckOutTime: '06:00 PM',
        newStatus: 'Present',
        reason: 'Authorized by Management for offsite board meeting',
        authorizedByRole: 'super-admin',
        authorizedByName: 'Super Administrator',
    })
    assert.ok(res.success)

    const ledger = getAttendanceRecords()
    const updated = ledger.find((r) => r.employeeId === 'EMP-DIR-001' && r.date === '31-10-2026')
    assert.ok(updated)
    assert.equal(updated.source, 'MANUAL_OVERRIDE')
    assert.ok(updated.overrideHistory.length > 0)
    assert.equal(updated.overrideHistory[0].changeSource, 'MANUAL_OVERRIDE')
    assert.equal(updated.overrideHistory[0].reason, 'Authorized by Management for offsite board meeting')
})

test('8. Student Class Attendance Roster & Bulk Marking', () => {
    // Fetch Class 10 Section A
    const roster = getStudentAttendanceRecords('10', 'A')
    assert.ok(Array.isArray(roster))
    assert.equal(roster.length, 10, 'Class 10-A should have 10 initial students')

    // Mark individual student as OD (On Duty)
    updateStudentAttendanceStatus(roster[0].studentId, 'OD', 'Inter-school science exhibition representative')
    let updatedRoster = getStudentAttendanceRecords('10', 'A')
    let student1 = updatedRoster.find((s) => s.studentId === roster[0].studentId)
    assert.equal(student1.status, 'OD')
    assert.equal(student1.remarks, 'Inter-school science exhibition representative')

    // Mark student as Permission
    updateStudentAttendanceStatus(roster[1].studentId, 'Permission', 'Early departure for dentist appointment')
    updatedRoster = getStudentAttendanceRecords('10', 'A')
    let student2 = updatedRoster.find((s) => s.studentId === roster[1].studentId)
    assert.equal(student2.status, 'Permission')

    // Mark student as Leave
    updateStudentAttendanceStatus(roster[2].studentId, 'Leave', 'Sick leave letter submitted')
    updatedRoster = getStudentAttendanceRecords('10', 'A')
    let student3 = updatedRoster.find((s) => s.studentId === roster[2].studentId)
    assert.equal(student3.status, 'Leave')

    // Bulk mark all students as Present
    markAllStudentAttendance('10', 'A', 'Present', 'Class Teacher')
    const bulkRoster = getStudentAttendanceRecords('10', 'A')
    assert.ok(bulkRoster.every((s) => s.status === 'Present'))
})
