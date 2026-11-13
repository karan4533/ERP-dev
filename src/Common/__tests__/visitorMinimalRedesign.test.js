import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'
import {
    getVisitorLogs,
    saveVisitorLogs,
    registerVisitorCheckIn,
    recordVisitorCheckOut,
    calculateVisitDuration,
    formatCompactDuration,
    parseDateTimeToMs,
    getAuthorizedStaffDirectory,
    INITIAL_VISITOR_LOGS
} from '../GatePassSecurity/gatePassSecurityData.js'

describe('Visitors Module — Minimal Check-in / Check-out Redesign Tests', () => {
    beforeEach(() => {
        saveVisitorLogs([])
    })

    test('1. Check-in validation: required fields must be present', () => {
        // Missing visitorName
        assert.throws(() => {
            registerVisitorCheckIn({
                visitorName: '',
                phone: '+91 98401 11223',
                personToMeet: 'Dr. Ramanathan K',
                department: 'Academics & Teaching',
                purpose: 'Meeting'
            })
        }, /Visitor Full Name is required/)

        // Missing phone
        assert.throws(() => {
            registerVisitorCheckIn({
                visitorName: 'John Doe',
                phone: '',
                personToMeet: 'Dr. Ramanathan K',
                department: 'Academics & Teaching',
                purpose: 'Meeting'
            })
        }, /Phone Number is required/)

        // Missing person to meet
        assert.throws(() => {
            registerVisitorCheckIn({
                visitorName: 'John Doe',
                phone: '+91 98401 11223',
                personToMeet: '',
                department: 'Academics & Teaching',
                purpose: 'Meeting'
            })
        }, /Person to Meet is required/)

        // Missing department
        assert.throws(() => {
            registerVisitorCheckIn({
                visitorName: 'John Doe',
                phone: '+91 98401 11223',
                personToMeet: 'Dr. Ramanathan K',
                department: '',
                purpose: 'Meeting'
            })
        }, /Department is required/)

        // Missing purpose
        assert.throws(() => {
            registerVisitorCheckIn({
                visitorName: 'John Doe',
                phone: '+91 98401 11223',
                personToMeet: 'Dr. Ramanathan K',
                department: 'Academics & Teaching',
                purpose: ''
            })
        }, /Purpose of Visit is required/)
    })

    test('2. Successful visitor check-in with auto-populated fields and initial status "Checked In"', () => {
        const staff = getAuthorizedStaffDirectory()
        const targetStaff = staff[0]

        const newVisitor = registerVisitorCheckIn({
            visitorName: 'Anitha Raman',
            phone: '+91 98765 43210',
            personToMeet: targetStaff.name,
            department: targetStaff.department,
            purpose: 'Admission Enquiry for Grade 6',
            visitorOrganization: 'Parent / Self',
            idProofType: 'Aadhaar Card',
            idProofNumber: 'XXXX-XXXX-1234',
            remarks: 'Requires syllabus brochure',
            recordedBy: 'Kavita Reddy (PRM / Front Office)'
        })

        // Assert auto-populated fields
        assert.ok(newVisitor.id.startsWith('VIS-2026-'), 'Visitor ID must follow VIS-2026-XXXX format')
        assert.ok(newVisitor.entryDate, 'Check-in date must be auto-populated')
        assert.ok(newVisitor.entryTime, 'Check-in time must be auto-populated')
        assert.strictEqual(newVisitor.status, 'Checked In', 'Initial status must be "Checked In"')
        assert.strictEqual(newVisitor.recordedBy, 'Kavita Reddy (PRM / Front Office)')
        assert.strictEqual(newVisitor.exitTime, null, 'Exit time must be null upon check-in')
        assert.strictEqual(newVisitor.remarks, 'Requires syllabus brochure')

        // Verify visitor is in log
        const logs = getVisitorLogs()
        assert.strictEqual(logs.length, 1)
        assert.strictEqual(logs[0].id, newVisitor.id)
    })

    test('3. Duplicate active visitor check-in prevention', () => {
        registerVisitorCheckIn({
            visitorName: 'Ramesh Kumar',
            phone: '+91 98410 12345',
            personToMeet: 'Dr. Kavita Sharma',
            department: 'Academics & Teaching',
            purpose: 'Term Discussion'
        })

        // Attempting to check in the same person while currently inside should throw an error
        assert.throws(() => {
            registerVisitorCheckIn({
                visitorName: 'Ramesh Kumar',
                phone: '+91 98410 12345',
                personToMeet: 'Dr. Kavita Sharma',
                department: 'Academics & Teaching',
                purpose: 'Duplicate checkin attempt'
            })
        }, /already checked in under active badge/)
    })

    test('4. Accurate visit duration calculation formula: Check-out - Check-in', () => {
        // Test exact examples from specification:
        // 15 minutes
        const dur15m = calculateVisitDuration('05-11-2026', '10:00 AM', '05-11-2026', '10:15 AM')
        assert.strictEqual(dur15m, '15 minutes')
        assert.strictEqual(formatCompactDuration(dur15m), '15m')

        // 1 hour 20 minutes (80 mins)
        const dur1h20m = calculateVisitDuration('05-11-2026', '09:30 AM', '05-11-2026', '10:50 AM')
        assert.strictEqual(dur1h20m, '1 hour 20 minutes')
        assert.strictEqual(formatCompactDuration(dur1h20m), '1h 20m')

        // 35 minutes (as shown in user mockup for Priya Menon)
        const dur35m = calculateVisitDuration('05-11-2026', '08:45 AM', '05-11-2026', '09:20 AM')
        assert.strictEqual(dur35m, '35 minutes')
        assert.strictEqual(formatCompactDuration(dur35m), '35m')

        // 3 hours 45 minutes (225 mins)
        const dur3h45m = calculateVisitDuration('05-11-2026', '08:00 AM', '05-11-2026', '11:45 AM')
        assert.strictEqual(dur3h45m, '3 hours 45 minutes')
        assert.strictEqual(formatCompactDuration(dur3h45m), '3h 45m')

        // Multi-day visit: 1 day 2 hours
        const durDay = calculateVisitDuration('04-11-2026', '10:00 AM', '05-11-2026', '12:00 PM')
        assert.strictEqual(durDay, '1 day 2 hours')
        assert.strictEqual(formatCompactDuration(durDay), '1d 2h')
    })

    test('5. Live elapsed duration while checked in', () => {
        // Visitor checked in 45 minutes ago
        const past = new Date(Date.now() - 45 * 60 * 1000)
        const pastDate = past.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
        const pastTime = past.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

        const liveDuration = calculateVisitDuration(pastDate, pastTime, null, null, past.toISOString())
        assert.ok(liveDuration.includes('minute'), `Live duration should be in minutes, got: ${liveDuration}`)
    })

    test('6. Single Action Check-Out: timestamp recorded, duration persisted, status updated', () => {
        const v = registerVisitorCheckIn({
            visitorName: 'Priya Menon',
            phone: '+91 98402 67890',
            personToMeet: 'Admin Office',
            department: 'Administration',
            purpose: 'Fee Receipt Clearance',
            recordedBy: 'Kavita Reddy (PRM / Front Office)'
        })

        // Check Out visitor
        const checkedOut = recordVisitorCheckOut(v.id, 'Ram Singh (Gatekeeper)', 'Badge returned')

        assert.strictEqual(checkedOut.status, 'Checked Out')
        assert.ok(checkedOut.exitDate, 'Exit date must be set')
        assert.ok(checkedOut.exitTime, 'Exit time must be set')
        assert.ok(checkedOut.exitTimestamp, 'Exit ISO timestamp must be set')
        assert.ok(checkedOut.visitDuration, 'Visit duration must be recorded')
        assert.strictEqual(checkedOut.officerCheckOut, 'Ram Singh (Gatekeeper)')

        // Verify status in persistent logs
        const updatedLogs = getVisitorLogs()
        const found = updatedLogs.find((item) => item.id === v.id)
        assert.strictEqual(found.status, 'Checked Out')
        assert.strictEqual(found.visitDuration, checkedOut.visitDuration)
    })

    test('7. Prevention of double check-outs (idempotent)', () => {
        const v = registerVisitorCheckIn({
            visitorName: 'Suresh Raina',
            phone: '+91 98400 99999',
            personToMeet: 'Sports Director',
            department: 'Physical Education',
            purpose: 'Tournament Discussion'
        })

        const firstCheckOut = recordVisitorCheckOut(v.id, 'Gatekeeper #1')
        const firstDuration = firstCheckOut.visitDuration

        // Second checkout attempt should be idempotent and not alter the original checkout
        const secondCheckOut = recordVisitorCheckOut(v.id, 'Gatekeeper #2')
        assert.strictEqual(secondCheckOut.status, 'Checked Out')
        assert.strictEqual(secondCheckOut.visitDuration, firstDuration)
        assert.strictEqual(secondCheckOut.exitTime, firstCheckOut.exitTime)
    })

    test('8. Full synchronization between Front Office and Gatekeeper', () => {
        // Front Office registers visitor
        const foVisitor = registerVisitorCheckIn({
            visitorName: 'Kishore Kumar',
            phone: '+91 91234 56789',
            personToMeet: 'Dr. Ramanathan K',
            department: 'Academics & Teaching',
            purpose: 'Alumni Event',
            recordedBy: 'Kavita Reddy (Front Office)'
        })

        // Gatekeeper reads visitor from shared register
        const gatekeeperView = getVisitorLogs()
        const gatekeeperRecord = gatekeeperView.find((r) => r.id === foVisitor.id)
        assert.ok(gatekeeperRecord, 'Gatekeeper must see the visitor registered by Front Office')
        assert.strictEqual(gatekeeperRecord.status, 'Checked In')

        // Gatekeeper executes check out at the gate
        const gkCheckedOut = recordVisitorCheckOut(foVisitor.id, 'Dhanraj Pillai (Gatekeeper)')
        assert.strictEqual(gkCheckedOut.status, 'Checked Out')

        // Front Office reads again from shared register
        const frontOfficeView = getVisitorLogs()
        const foRecord = frontOfficeView.find((r) => r.id === foVisitor.id)
        assert.strictEqual(foRecord.status, 'Checked Out', 'Front Office must see Checked Out status updated by Gatekeeper')
        assert.strictEqual(foRecord.visitDuration, gkCheckedOut.visitDuration)
    })

    test('9. Initial default demo visitors match mockup records', () => {
        const ramesh = INITIAL_VISITOR_LOGS.find((v) => v.visitorName === 'Ramesh Kumar')
        assert.ok(ramesh, 'Ramesh Kumar must exist in initial visitor records')
        assert.strictEqual(ramesh.personToMeet, 'Dr. Kavita Sharma')
        assert.strictEqual(ramesh.status, 'Checked In')

        const priya = INITIAL_VISITOR_LOGS.find((v) => v.visitorName === 'Priya Menon')
        assert.ok(priya, 'Priya Menon must exist in initial visitor records')
        assert.strictEqual(priya.personToMeet, 'Admin Office')
        assert.strictEqual(priya.status, 'Checked Out')
        assert.strictEqual(priya.visitDuration, '35 minutes')
    })
})

