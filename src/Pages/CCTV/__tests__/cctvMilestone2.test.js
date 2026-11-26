import test from 'node:test'
import assert from 'node:assert/strict'
import { cctvService } from '../../../services/modules/cctvService.js'
import { mockAdapter } from '../../../services/api/mockAdapter.js'
import { cctvSidebarLinks } from '../../../Common/CommonSidebar/Components/sidebarLinks.js'

test('Milestone 2 CCTV Enhancements — Automated Domain & Route Suites', async (t) => {
    mockAdapter.resetDatabase()

    await t.test('1. Daily Camera Status: Anomaly Rectification with Date, Time, Inspector & Notes', async () => {
        const checksRes = await cctvService.getDailyChecks()
        assert.equal(checksRes.success, true)
        assert.ok(checksRes.data.length > 0)

        const targetCheck = checksRes.data.find((c) => c.id === 'CHK-CCTV-2026-001') || checksRes.data[0]
        assert.ok(targetCheck.findingsAndAnomalies.length > 0)
        assert.equal(Boolean(targetCheck.findingsAndAnomalies[0].isRectified), false)

        const resolutionRes = await cctvService.resolveCheckAnomaly(targetCheck.id, 0, {
            rectifiedDate: '2026-03-10',
            rectifiedTime: '15:45',
            rectifiedBy: 'K. Ramesh (IT Network Specialist)',
            resolutionNotes: 'Re-crimped RJ45 patch cable, POE link re-established.',
        })

        assert.equal(resolutionRes.success, true)
        const updatedCheck = resolutionRes.data
        assert.equal(updatedCheck.status, 'Completed')
        const anomaly = updatedCheck.findingsAndAnomalies[0]
        assert.equal(anomaly.isRectified, true)
        assert.equal(anomaly.rectifiedDate, '2026-03-10')
        assert.equal(anomaly.rectifiedTime, '15:45')
        assert.equal(anomaly.rectifiedBy, 'K. Ramesh (IT Network Specialist)')
        assert.match(anomaly.resolutionNotes, /POE link re-established/i)
    })

    await t.test('2. CCTV Footage Requisition: Attachment Upload & Metadata Persistence', async () => {
        const newReq = await cctvService.createFootageRequest({
            incidentDate: '2026-03-10',
            timeWindowStart: '09:00 AM',
            timeWindowEnd: '09:30 AM',
            cameraIds: ['CAM-01', 'CAM-02'],
            requesterId: 'EMP-SEC-002',
            requesterName: 'Campus Security Supervisor',
            justificationText: 'Gate vehicular damage inquiry',
            attachmentFileName: 'Security_Gate_FIR_Copy_2026.pdf',
            attachmentData: 'data:application/pdf;base64,JVBERi0xLjQK...',
            isSensitive: false,
        })

        assert.equal(newReq.success, true)
        assert.equal(newReq.data.attachmentFileName, 'Security_Gate_FIR_Copy_2026.pdf')
        assert.ok(newReq.data.attachmentData)

        // Retrieve and confirm attachment persistence
        const fetched = await cctvService.getFootageRequestById(newReq.data.id)
        assert.equal(fetched.success, true)
        assert.equal(fetched.data.attachmentFileName, 'Security_Gate_FIR_Copy_2026.pdf')
    })

    await t.test('3. Teachers Late Report: Entry Gate Surveillance Log & Delay Calculation', async () => {
        const createRes = await cctvService.createTeachersLateReport({
            date: '2026-03-11',
            teacherId: 'EMP-TCH-022',
            teacherName: 'Dr. V. Ramanathan',
            department: 'Computer Science',
            shiftInTime: '08:00 AM',
            actualArrivalTime: '08:24 AM',
            lateMinutes: 24,
            gateNo: 'Gate 1 (Main Entrance)',
            cameraId: 'CAM-01',
            reason: 'Railway overbridge detour',
            actionTaken: 'Gate entry late memo signed',
            status: 'Logged',
        })

        assert.equal(createRes.success, true)
        assert.match(createRes.data.id, /^TL/i)
        assert.equal(createRes.data.lateMinutes, 24)
        assert.equal(createRes.data.gateNo, 'Gate 1 (Main Entrance)')

        const allReports = await cctvService.getTeachersLateReports()
        assert.equal(allReports.success, true)
        assert.ok(allReports.data.some((r) => r.id === createRes.data.id))
    })

    await t.test('4. Surveillance Issue Register: Defect Lifecycle Progression (Open -> Rectified)', async () => {
        const createRes = await cctvService.createIssue({
            date: '2026-03-11',
            zone: 'Science Laboratories Wing',
            assetId: 'CAM-03',
            assetName: 'Composite Science Laboratories Hallway',
            defectCategory: 'Camera Lens Scratched / Dirty',
            severity: 'High',
            reportedBy: 'S. Selvakumar',
            assignedTechnician: 'P. Velu',
            notes: 'Feed blurred after chemical vapor exposure in hallway.',
        })

        assert.equal(createRes.success, true)
        assert.equal(createRes.data.status, 'Open')
        const issueId = createRes.data.id

        // Advance to Rectified
        const resolveRes = await cctvService.resolveIssue(issueId, {
            rectifiedDate: '2026-03-11',
            rectifiedTime: '16:00',
            assignedTechnician: 'P. Velu (Senior Technician)',
            notes: 'Optical glass cleaned with isopropyl and recalibrated.',
        })

        assert.equal(resolveRes.success, true)
        assert.equal(resolveRes.data.status, 'Rectified')
        assert.equal(resolveRes.data.rectifiedDate, '2026-03-11')
        assert.equal(resolveRes.data.rectifiedTime, '16:00')
    })

    await t.test('5. PA System Announcements: Multi-Zone Audio Broadcast & Emergency Flags', async () => {
        const paRes = await cctvService.createPaAnnouncement({
            date: '2026-03-11',
            time: '10:30 AM',
            category: 'Emergency',
            targetZones: ['Campus Perimeter & Gates', 'Dining Hall & Cafeteria'],
            message: 'Campus perimeter drill in progress. Stand by for instructions.',
            announcedBy: 'Security Central',
            authorizedBy: 'Dr. K. S. Sundaram',
            isEmergency: true,
        })

        assert.equal(paRes.success, true)
        assert.equal(paRes.data.isEmergency, true)
        assert.equal(paRes.data.targetZones.length, 2)

        const listRes = await cctvService.getPaAnnouncements()
        assert.equal(listRes.success, true)
        assert.ok(listRes.data.some((p) => p.id === paRes.data.id))
    })

    await t.test('6. GPS & Halt Telemetry: Unscheduled Bus Stoppage & Speed Warning Audit', async () => {
        const haltRes = await cctvService.createGpsHalt({
            date: '2026-03-11',
            busNo: 'BUS-08',
            routeCode: 'ROUTE-08',
            driverName: 'S. Shanmugam',
            haltLocation: 'Thirunagar Main Bus Stop Bypass',
            scheduledTime: '07:40 AM',
            arrivalTime: '08:02 AM',
            haltDurationMinutes: 22,
            delayReason: 'Tyre puncture check',
            speedAlert: true,
        })

        assert.equal(haltRes.success, true)
        assert.equal(haltRes.data.speedAlert, true)
        assert.equal(haltRes.data.haltDurationMinutes, 22)

        const ackRes = await cctvService.acknowledgeGpsHalt(haltRes.data.id)
        assert.equal(ackRes.success, true)
        assert.equal(ackRes.data.acknowledged, true)
    })

    await t.test('7. Bus Last Drop Report: Evening Student Dispersal & Empty Bus Verification', async () => {
        const dropRes = await cctvService.createBusLastDrop({
            date: '2026-03-10',
            busNo: 'BUS-08',
            routeNo: 'ROUTE-08',
            driverName: 'S. Shanmugam',
            conductorName: 'P. Alagar',
            totalStudentsDropped: 38,
            lastStopName: 'Thirunagar 3rd Stop',
            scheduledTime: '04:30 PM',
            actualDropTime: '04:36 PM',
            emptyBusVerified: false,
            remarks: 'Dispersal ongoing',
        })

        assert.equal(dropRes.success, true)
        assert.equal(dropRes.data.emptyBusVerified, false)

        const verifyRes = await cctvService.verifyBusLastDrop(dropRes.data.id)
        assert.equal(verifyRes.success, true)
        assert.equal(verifyRes.data.emptyBusVerified, true)
    })

    await t.test('8. Bus Camera Monitoring: In-Bus Multi-Channel Camera Diagnostics', async () => {
        const auditRes = await cctvService.createBusCameraAudit({
            date: '2026-03-11',
            busNo: 'BUS-08',
            frontCameraStatus: 'Online / Working',
            cabinCameraStatus: 'Offline / Degraded',
            rearCameraStatus: 'Online / Working',
            recordingHealth: 'Degraded',
            footageQuality: 'Flickering cabin channel',
            safetyObservation: 'Driver wore seatbelt, speed limit observed.',
            incidentReported: true,
            inspectorName: 'S. Selvakumar',
        })

        assert.equal(auditRes.success, true)
        assert.equal(auditRes.data.incidentReported, true)
        assert.equal(auditRes.data.cabinCameraStatus, 'Offline / Degraded')

        const allAudits = await cctvService.getBusCameraAudits()
        assert.equal(allAudits.success, true)
        assert.ok(allAudits.data.some((a) => a.id === auditRes.data.id))
    })

    await t.test('9. CCTV Sidebar Navigation: All 6 New Routes Properly Registered', () => {
        const paths = cctvSidebarLinks.map((l) => l.to)
        assert.ok(paths.includes('/cctv/teachers-late-report'), 'Missing teachers late report sidebar link')
        assert.ok(paths.includes('/cctv/issue-register'), 'Missing issue register sidebar link')
        assert.ok(paths.includes('/cctv/pa-announcements'), 'Missing pa announcements sidebar link')
        assert.ok(paths.includes('/cctv/gps-halt'), 'Missing gps halt sidebar link')
        assert.ok(paths.includes('/cctv/bus-last-drop'), 'Missing bus last drop sidebar link')
        assert.ok(paths.includes('/cctv/bus-camera-monitoring'), 'Missing bus camera monitoring sidebar link')
    })
})
