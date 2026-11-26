import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'
import {
    getStudentGatePasses,
    saveStudentGatePasses,
    createStudentGatePassRequest,
    approveStudentGatePass,
    rejectStudentGatePass,
    recordStudentExit,
    recordStudentReturn,
    getVisitorLogs,
    saveVisitorLogs,
    registerVisitorCheckIn,
    recordVisitorCheckOut,
    getActiveVisitors,
    getVisitorHistory,
    getUnifiedGatekeeperKPIs,
    getSecurityMovementAuditLogs,
    getAuthorizedStaffDirectory,
    getAvailableStudents,
    CAMPUS_NAME
} from '../GatePassSecurity/gatePassSecurityData.js'

describe('Visitor & Gate Pass Management — Complete Workflow Integration', () => {
    beforeEach(() => {
        // Reset in-memory / mock storage before each test
        saveStudentGatePasses([])
        saveVisitorLogs([])
    })

    test('1. Staff & Student SIS Auto-Population Helpers', () => {
        const staff = getAuthorizedStaffDirectory()
        assert.ok(staff.length >= 20, 'Staff directory should contain enterprise employees')
        const principal = staff.find((s) => s.role === 'principal')
        assert.ok(principal, 'Principal must be in staff directory')
        assert.strictEqual(principal.department, 'Academics & Teaching')

        const students = getAvailableStudents()
        assert.ok(students.length >= 6, 'Available students directory should have default student records')
        const aarav = students.find((s) => s.studentName === 'Aarav Sharma')
        assert.ok(aarav, 'Aarav Sharma should exist in SIS directory')
        assert.ok(aarav.classSection, 'Aarav Sharma should have class & section')
    })

    test('2. PRM Creates a Student Gate Pass Request (Step 1)', () => {
        const request = createStudentGatePassRequest({
            studentId: 'STU-2025-1001',
            studentName: 'Aarav Sharma',
            classSection: 'Grade 10 A',
            department: 'Academics - Secondary',
            reason: 'Medical consultation at Apollo Hospital',
            date: '05-11-2026',
            expectedDepartureTime: '11:30 AM',
            expectedReturnTime: '03:00 PM',
            accompanyingPerson: 'Suresh Sharma (Father)',
            parentGuardianInfo: 'Suresh Sharma (+91 98401 22334)',
            remarks: 'Doctor appointment card presented.',
            requesterName: 'Kavita Reddy (PRM / Front Office)',
            requesterRole: 'prm'
        })

        assert.ok(request.id, 'Request must have an ID')
        assert.strictEqual(request.status, 'Pending Approval', 'Initial status must be Pending Approval')
        assert.strictEqual(request.approvedBy, null, 'Must not be approved yet')
        assert.strictEqual(request.studentName, 'Aarav Sharma')

        const allPasses = getStudentGatePasses()
        const found = allPasses.find((p) => p.id === request.id)
        assert.ok(found, 'Request must be saved in storage')
    })

    test('3. Principal Approves Request (Step 2 & 3)', () => {
        const request = createStudentGatePassRequest({
            studentId: 'STU-2025-1002',
            studentName: 'Riya Sen',
            classSection: 'Grade 8 B',
            reason: 'Debate competition',
            expectedDepartureTime: '09:00 AM',
            expectedReturnTime: '01:00 PM'
        })

        const approvalResult = approveStudentGatePass(
            request.id,
            'principal',
            'Dr. Ramanathan K',
            'Approved on behalf of school representation'
        )

        assert.strictEqual(approvalResult.success, true)
        const pass = approvalResult.pass
        assert.strictEqual(pass.status, 'Approved')
        assert.ok(pass.gatePassId.startsWith('GP-STU-2026-'), 'Unique permanent Gate Pass ID must be generated')
        assert.ok(pass.qrCodeValue, 'QR code payload must be generated')
        assert.strictEqual(pass.approvedBy.name, 'Dr. Ramanathan K')
        assert.strictEqual(pass.approvedBy.role, 'principal')
    })

    test('4. Director of Academics Approves Request (Step 2 & 3)', () => {
        const request = createStudentGatePassRequest({
            studentId: 'STU-2025-1003',
            studentName: 'Rohan Verma',
            classSection: 'Grade 11 Science',
            reason: 'Passport verification',
            expectedDepartureTime: '01:00 PM',
            expectedReturnTime: '04:00 PM'
        })

        const approvalResult = approveStudentGatePass(
            request.id,
            'director',
            'Dr. Kavita Sharma',
            'Authorized by Director of Academics'
        )

        assert.strictEqual(approvalResult.success, true)
        assert.strictEqual(approvalResult.pass.status, 'Approved')
        assert.strictEqual(approvalResult.pass.approvedBy.name, 'Dr. Kavita Sharma')
        assert.strictEqual(approvalResult.pass.approvedBy.role, 'director')
    })

    test('5. Simultaneous Approval Guard (Strict Idempotency — Only 1 Approval & 1 Gate Pass Generated)', () => {
        const request = createStudentGatePassRequest({
            studentId: 'STU-2025-1004',
            studentName: 'Ananya Iyer',
            classSection: 'Grade 9 A',
            reason: 'Family emergency',
            expectedDepartureTime: '11:00 AM',
            expectedReturnTime: '03:00 PM'
        })

        // Principal approves first
        const firstApproval = approveStudentGatePass(
            request.id,
            'principal',
            'Dr. Ramanathan K',
            'Principal approval'
        )
        assert.strictEqual(firstApproval.success, true)
        const generatedPassId = firstApproval.pass.gatePassId

        // Director of Academics attempts to approve nearly simultaneously
        const secondApproval = approveStudentGatePass(
            generatedPassId,
            'director',
            'Dr. Kavita Sharma',
            'Director approval'
        )

        // Must reject duplicate approval gracefully
        assert.strictEqual(secondApproval.success, false)
        assert.strictEqual(secondApproval.code, 'ALREADY_APPROVED')
        assert.strictEqual(secondApproval.pass.gatePassId, generatedPassId, 'No second gate pass ID generated')
        assert.strictEqual(secondApproval.pass.approvedBy.name, 'Dr. Ramanathan K', 'First approver remains recorded')
    })

    test('6. Gatekeeper Cannot Approve Pending Passes (Security Guard)', () => {
        const request = createStudentGatePassRequest({
            studentId: 'STU-2025-1005',
            studentName: 'Dhruv Patel',
            classSection: 'Grade 12 Commerce',
            reason: 'Self checkout attempt',
            expectedDepartureTime: '12:00 PM',
            expectedReturnTime: '02:00 PM'
        })

        // Gatekeeper attempts to approve
        assert.throws(() => {
            approveStudentGatePass(request.id, 'gatekeeper', 'Ram Singh', 'Unauthorized approval')
        }, /Unauthorized/)

        // Gatekeeper attempts to record exit for pending pass
        assert.throws(() => {
            recordStudentExit(request.id, 'Ram Singh')
        }, /Security Breach Prevention/)
    })

    test('7. Gatekeeper Records Student Exit and Return Workflow (Step 4)', () => {
        const request = createStudentGatePassRequest({
            studentId: 'STU-2025-1001',
            studentName: 'Aarav Sharma',
            classSection: 'Grade 10 A',
            reason: 'Dentist appointment',
            expectedDepartureTime: '10:00 AM',
            expectedReturnTime: '01:00 PM'
        })

        // Approved by Principal
        const { pass } = approveStudentGatePass(request.id, 'principal', 'Dr. Ramanathan K')

        // Gatekeeper records departure
        const exitedPass = recordStudentExit(pass.gatePassId, 'Ram Singh (Gatekeeper Main Gate)', '10:05 AM', 'Guardian verified')
        assert.strictEqual(exitedPass.status, 'Exit Recorded')
        assert.strictEqual(exitedPass.exitGatekeeper, 'Ram Singh (Gatekeeper Main Gate)')

        // Gatekeeper records safe return
        const returnedPass = recordStudentReturn(pass.gatePassId, 'Ram Singh (Gatekeeper Main Gate)', '12:50 PM', 'Student safely returned')
        assert.strictEqual(returnedPass.status, 'Returned')
        assert.strictEqual(returnedPass.returnGatekeeper, 'Ram Singh (Gatekeeper Main Gate)')
    })

    test('8. Front Office Minimal Visitor Check-in & Badge Generation', () => {
        const visitor = registerVisitorCheckIn({
            visitorName: 'Rajendra Prasad',
            phone: '+91 98401 22334',
            visitorOrganization: 'Prasad & Sons Book Publishers',
            personToMeet: 'Priya Menon',
            department: 'Academics & Teaching',
            purpose: 'Senior secondary physics textbook samples submission',
            idProofType: 'Aadhaar Card',
            idProofNumber: 'XXXX-XXXX-4512',
            numberOfVisitors: 1,
            recordedBy: 'Kavita Reddy (PRM / Front Office)'
        })

        assert.ok(visitor.id.startsWith('VIS-2026-'), 'Visitor ID should be generated')
        assert.ok(visitor.badgeNumber.startsWith('VIS-B-'), 'Badge number should be generated')
        assert.ok(visitor.badgeQrPayload, 'QR payload should be generated')
        assert.strictEqual(visitor.status, 'Checked In')
        assert.strictEqual(visitor.personToMeet, 'Priya Menon')
        assert.strictEqual(visitor.department, 'Academics & Teaching')
        assert.strictEqual(visitor.campusName, CAMPUS_NAME)

        // Disallow duplicate active session with same visitor and phone
        assert.throws(() => {
            registerVisitorCheckIn({
                visitorName: 'Rajendra Prasad',
                phone: '+91 98401 22334',
                personToMeet: 'Dr. Ramanathan K',
                department: 'Academics & Teaching',
                purpose: 'Duplicate check in'
            })
        }, /already checked in/)
    })

    test('9. Visitor & Gatekeeper Synchronization & Check-Out', () => {
        const v = registerVisitorCheckIn({
            visitorName: 'Suresh Raina',
            phone: '+91 94440 99881',
            personToMeet: 'Arunachalam S',
            department: 'Administration',
            purpose: 'Courier delivery parcel'
        })

        // Active register contains visitor
        let active = getActiveVisitors()
        assert.strictEqual(active.some((item) => item.id === v.id), true)

        // Gatekeeper records check-out
        const checkedOut = recordVisitorCheckOut(v.id, 'Ram Singh (Gatekeeper)')
        assert.strictEqual(checkedOut.status, 'Checked Out')
        assert.ok(checkedOut.exitTime)

        // Disappears from active visitors register
        active = getActiveVisitors()
        assert.strictEqual(active.some((item) => item.id === v.id), false)

        // Remains in complete historical records
        const history = getVisitorHistory()
        assert.strictEqual(history.some((item) => item.id === v.id), true)
    })

    test('10. Unified Gatekeeper KPIs Calculation', () => {
        // Register 1 active visitor
        registerVisitorCheckIn({
            visitorName: 'Active Guest 1',
            phone: '+91 98400 11111',
            personToMeet: 'Priya Menon',
            department: 'Academics & Teaching',
            purpose: 'Consultation'
        })

        // Create & approve 1 student gate pass (Awaiting Exit)
        const req1 = createStudentGatePassRequest({
            studentId: 'STU-2025-1001',
            studentName: 'Aarav Sharma',
            classSection: 'Grade 10 A',
            reason: 'Medical appointment',
            expectedDepartureTime: '11:00 AM',
            expectedReturnTime: '02:00 PM'
        })
        const { pass: approvedPass } = approveStudentGatePass(req1.id, 'principal', 'Dr. Ramanathan K')

        // Create, approve & exit 1 student pass (Currently Outside)
        const req2 = createStudentGatePassRequest({
            studentId: 'STU-2025-1002',
            studentName: 'Riya Sen',
            classSection: 'Grade 8 B',
            reason: 'Tournament',
            expectedDepartureTime: '09:00 AM',
            expectedReturnTime: '01:00 PM'
        })
        const { pass: p2 } = approveStudentGatePass(req2.id, 'director', 'Dr. Kavita Sharma')
        recordStudentExit(p2.gatePassId, 'Ram Singh')

        const kpis = getUnifiedGatekeeperKPIs()
        assert.strictEqual(kpis.visitorsCurrentlyInside, 1, 'Should have 1 active visitor')
        assert.strictEqual(kpis.studentPassesAwaitingExit, 1, 'Should have 1 pass awaiting exit')
        assert.strictEqual(kpis.studentsCurrentlyOutside, 1, 'Should have 1 student currently outside')
    })

    test('11. Security Movement Audit Trail Integrity', () => {
        const req = createStudentGatePassRequest({
            studentId: 'STU-2025-1006',
            studentName: 'Meera Nair',
            classSection: 'Grade 7 A',
            reason: 'Sports meet',
            expectedDepartureTime: '08:00 AM',
            expectedReturnTime: '12:00 PM'
        })

        const { pass } = approveStudentGatePass(req.id, 'principal', 'Dr. Ramanathan K')
        recordStudentExit(pass.gatePassId, 'Ram Singh')
        recordStudentReturn(pass.gatePassId, 'Ram Singh')

        const auditTrail = getSecurityMovementAuditLogs()
        assert.ok(auditTrail.length >= 4, 'Audit trail must log request, approval, exit, and return')

        const actions = auditTrail.map((l) => l.action)
        assert.ok(actions.includes('CREATE_STUDENT_GATE_PASS_REQUEST'))
        assert.ok(actions.includes('APPROVE_STUDENT_GATE_PASS'))
        assert.ok(actions.includes('RECORD_STUDENT_EXIT'))
        assert.ok(actions.includes('RECORD_STUDENT_RETURN'))
    })
})

