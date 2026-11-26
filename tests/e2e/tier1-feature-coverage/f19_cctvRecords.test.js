/**
 * tests/e2e/tier1-feature-coverage/f19_cctvRecords.test.js
 * Tier 1 Feature Coverage: CCTV Records & Operational Registers (R1 / Features 13-20)
 *
 * Covers:
 * - Daily camera status Rectified Date/Time logging and defect resolution
 * - Footage requisition attachment handling (FIR / incident proof)
 * - Teachers Late report register and morning gate audit
 * - Surveillance Issue Register with severity and resolution lifecycle
 * - PA System Announcements register with campus audio zones & emergency broadcast
 * - GPS & Halt telemetry tracking unscheduled stops and speed alerts
 * - Bus Last Drop report evening dispersal verification
 * - Bus Camera Monitoring cabin and door safety audit
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { cctvService } from '../../../src/services/modules/cctvService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F19-T1-01: CCTV daily camera status and defect resolution captures Rectified Date & Time', async () => {
  mockAdapter.resetDatabase();

  // Create an active camera issue
  const createIssueRes = await cctvService.createIssue({
    zone: 'Administrative Block - North Corridor',
    defectCategory: 'Camera Offline / Signal Loss',
    severity: 'High',
    notes: 'Camera CAM-04 video feed dropped post storm.',
  });
  assertSuccessEnvelope(createIssueRes, 'createIssue');
  const issueId = createIssueRes.data.id;
  assert.equal(createIssueRes.data.status, 'Open');

  // Resolve with Rectified Date & Time
  const resolveRes = await cctvService.resolveIssue(issueId, {
    rectifiedDate: '2026-03-24',
    rectifiedTime: '11:45 AM',
    assignedTechnician: 'K. Ramesh (IT Network Team)',
    notes: 'PoE port re-terminated, camera rebooted and feed restored.',
  });

  assertSuccessEnvelope(resolveRes, 'resolveIssue');
  assert.equal(resolveRes.data.status, 'Rectified');
  assert.equal(resolveRes.data.rectifiedDate, '2026-03-24');
  assert.equal(resolveRes.data.rectifiedTime, '11:45 AM');
  assert.ok(resolveRes.data.notes.includes('PoE port re-terminated'));
});

test('F19-T1-02: CCTV footage requisition supports document attachment upload', async () => {
  mockAdapter.resetDatabase();

  const reqPayload = {
    incidentDate: '2026-03-23',
    timeWindowStart: '15:00',
    timeWindowEnd: '15:30',
    cameraIds: ['CAM-01', 'CAM-02'],
    requesterId: 'EMP-SEC-001',
    requesterName: 'Chief Security Officer',
    justificationText: 'Gate vehicular damage inquiry',
    isSensitive: false,
    attachment: {
      fileName: 'Police_FIR_Copy_Gate_Accident.pdf',
      fileSize: '1.4 MB',
      mimeType: 'application/pdf',
      uploadedAt: '2026-03-23T16:00:00Z',
    },
  };

  const res = await cctvService.createFootageRequest(reqPayload);
  assertSuccessEnvelope(res, 'createFootageRequest with attachment');
  assert.ok(res.data.id);
  assert.ok(res.data.attachment);
  assert.equal(res.data.attachment.fileName, 'Police_FIR_Copy_Gate_Accident.pdf');
  assert.equal(res.data.attachment.fileSize, '1.4 MB');
});

test('F19-T1-03: CCTV Teachers Late report logs gate arrival time and late minutes', async () => {
  mockAdapter.resetDatabase();

  const lateEntry = {
    teacherName: 'S. Rajalakshmi (Senior Secondary Physics)',
    shiftInTime: '08:30 AM',
    actualArrivalTime: '08:48 AM',
    lateMinutes: 18,
    gateNo: 'Gate 1 (Main Entrance)',
    cameraId: 'CAM-GATE-01',
    reason: 'Traffic congestion on OMR road',
  };

  const res = await cctvService.createTeachersLateReport(lateEntry);
  assertSuccessEnvelope(res, 'createTeachersLateReport');
  assert.ok(res.data.id);
  assert.equal(res.data.teacherName, lateEntry.teacherName);
  assert.equal(res.data.lateMinutes, 18);

  // Retrieve reports
  const listRes = await cctvService.getTeachersLateReports();
  assertSuccessEnvelope(listRes, 'getTeachersLateReports');
  assert.ok(listRes.data.some((r) => r.teacherName === lateEntry.teacherName));
});

test('F19-T1-04: CCTV Surveillance Issue Register tracks severity levels and lifecycle', async () => {
  mockAdapter.resetDatabase();

  const issueRes = await cctvService.createIssue({
    zone: 'Playground Perimeter West',
    defectCategory: 'Night IR Illumination Failed',
    severity: 'Critical',
    reportedBy: 'Night Shift Guard',
    assignedTechnician: 'L. Murali',
  });

  assertSuccessEnvelope(issueRes, 'createIssue');
  assert.equal(issueRes.data.severity, 'Critical');
  assert.equal(issueRes.data.status, 'Open');

  // Verify listing
  const listRes = await cctvService.getIssues();
  assertSuccessEnvelope(listRes, 'getIssues');
  assert.ok(listRes.data.some((i) => i.id === issueRes.data.id));
});

test('F19-T1-05: CCTV PA System Announcements records zone broadcasts and emergency flags', async () => {
  mockAdapter.resetDatabase();

  const paPayload = {
    category: 'Emergency Evacuation Drill',
    message: 'Attention all staff and students: Simulated fire drill in progress. Proceed to Assembly Ground 1.',
    targetZones: ['Academic Wing A', 'Academic Wing B', 'Laboratories', 'Hostel Block'],
    isEmergency: true,
    announcedBy: 'Dr. K. S. Sundaram (Joint Director)',
    authorizedBy: 'Director Academics',
  };

  const res = await cctvService.createPaAnnouncement(paPayload);
  assertSuccessEnvelope(res, 'createPaAnnouncement');
  assert.ok(res.data.id);
  assert.equal(res.data.isEmergency, true);
  assert.equal(res.data.targetZones.length, 4);

  const listRes = await cctvService.getPaAnnouncements();
  assertSuccessEnvelope(listRes, 'getPaAnnouncements');
  assert.ok(listRes.data.some((a) => a.id === res.data.id));
});

test('F19-T1-06: CCTV GPS & Halt telemetry logs unscheduled halts and speed alerts', async () => {
  mockAdapter.resetDatabase();

  const haltPayload = {
    busNo: 'TN-58-B-3389',
    routeNo: 'Route 04 (IT Corridor)',
    haltLocation: 'Near Perungudi Toll Gate',
    haltDurationMinutes: 12,
    speedAlert: true,
    scheduledTime: '07:45 AM',
    arrivalTime: '08:02 AM',
    reason: 'Heavy junction bottleneck traffic',
  };

  const res = await cctvService.createGpsHalt(haltPayload);
  assertSuccessEnvelope(res, 'createGpsHalt');
  assert.ok(res.data.id);
  assert.equal(res.data.speedAlert, true);
  assert.equal(res.data.haltDurationMinutes, 12);

  // Acknowledge halt
  const ackRes = await cctvService.acknowledgeGpsHalt(res.data.id, {
    acknowledgedBy: 'Transport Monitoring Officer',
  });
  assertSuccessEnvelope(ackRes, 'acknowledgeGpsHalt');
  assert.equal(ackRes.data.acknowledged, true);
});

test('F19-T1-07: CCTV Bus Last Drop report verifies evening student dispersal and empty bus check', async () => {
  mockAdapter.resetDatabase();

  const dropPayload = {
    busNo: 'TN-58-A-1024',
    routeNo: 'Route 01 (North Sector)',
    driverName: 'K. Selvam',
    conductorName: 'M. Arumugam',
    totalStudentsDropped: 42,
    emptyBusVerified: true,
    scheduledTime: '04:45 PM',
    actualDropTime: '04:50 PM',
    lastStopName: 'Thirunagar 4th Stop',
  };

  const res = await cctvService.createBusLastDrop(dropPayload);
  assertSuccessEnvelope(res, 'createBusLastDrop');
  assert.ok(res.data.id);
  assert.equal(res.data.emptyBusVerified, true);
  assert.equal(res.data.totalStudentsDropped, 42);

  const listRes = await cctvService.getBusLastDrops();
  assertSuccessEnvelope(listRes, 'getBusLastDrops');
  assert.ok(listRes.data.some((d) => d.busNo === 'TN-58-A-1024'));
});

test('F19-T1-08: CCTV Bus Camera Monitoring logs in-bus camera health and cabin safety', async () => {
  mockAdapter.resetDatabase();

  const auditPayload = {
    busNo: 'TN-58-C-5012',
    inspectorName: 'S. Selvakumar (Camera Room Lead)',
    frontCameraStatus: 'Online / Working',
    cabinCameraStatus: 'Online / Working',
    rearCameraStatus: 'Offline / Lens Obstructed',
    recordingHealth: 'Degraded',
    footageQuality: '720p Adequate',
    incidentReported: true,
    defectNotes: 'Rear reverse camera sensor blurred; cleaning ticket raised.',
  };

  const res = await cctvService.createBusCameraAudit(auditPayload);
  assertSuccessEnvelope(res, 'createBusCameraAudit');
  assert.ok(res.data.id);
  assert.equal(res.data.rearCameraStatus, 'Offline / Lens Obstructed');
  assert.equal(res.data.incidentReported, true);

  const listRes = await cctvService.getBusCameraAudits();
  assertSuccessEnvelope(listRes, 'getBusCameraAudits');
  assert.ok(listRes.data.some((a) => a.busNo === 'TN-58-C-5012'));
});
