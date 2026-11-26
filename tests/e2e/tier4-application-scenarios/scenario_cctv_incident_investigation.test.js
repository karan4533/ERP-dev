/**
 * Tier 4: Real-World Application Scenario Test Suite
 * Scenario 2: Emergency Gate Safety Breach Investigation & CCTV Chain of Custody
 *
 * Operational Flow:
 * 1. Morning shift physical camera inspection logged.
 * 2. Urgent footage requisition raised by Campus Security for Main Gate perimeter incident.
 * 3. Formal 3-tier sequential governance review (HOD Admin -> Joint Director -> Managing Director).
 * 4. Tamper-evident watermarked clip produced and secure streaming URL issued.
 * 5. Incident investigation case file registered and archived in Physical File Room.
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { cctvService } from '../../../src/services/modules/cctvService.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('Scenario CCTV-01: Morning shift camera room health inspection log', async () => {
  const checkRes = await cctvService.logDailyCheck({
    checkDate: '2026-02-14',
    shift: 'Morning (06:00 - 14:00)',
    inspectorId: 'EMP-CCTV-01',
    inspectorName: 'S. Selvakumar',
    findingsAndAnomalies: [
      { cameraId: 'CAM-GATE-01', anomaly: 'Minor glare from morning sunlight on sensor', resolved: true },
    ],
  });

  assert.strictEqual(checkRes.success, true);
  assert.ok(checkRes.data.id);
  assert.strictEqual(checkRes.data.shift, 'Morning (06:00 - 14:00)');
});

test('Scenario CCTV-02: Security incident triggers sensitive requisition through complete 3-tier governance review', async () => {
  // Step 1: Requisition submitted by Security Chief
  const reqRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-GATE-01'],
    incidentDate: '2026-02-14',
    timeWindowStart: '08:15',
    timeWindowEnd: '08:45',
    justificationText: 'Unauthorized delivery vehicle impact with perimeter boom barrier',
    requesterId: 'EMP-SEC-01',
    requesterName: 'Security Chief S. Raman',
    department: 'Campus Security',
    urgencyLevel: 'Emergency / Legal Investigation',
    isSensitive: true,
  });
  assert.strictEqual(reqRes.success, true);
  const requestId = reqRes.data.id;

  // Step 2: HOD Admin approves
  const hodApprove = await cctvService.processApprovalTier(requestId, {
    role: 'HOD',
    approved: true,
    reviewerName: 'Dr. A. Joseph (HOD Admin)',
    remarks: 'Verified perimeter damage report. Escalating to JD.',
  });
  assert.strictEqual(hodApprove.success, true);
  assert.strictEqual(hodApprove.data.currentApprovalTier, 'Joint Director');

  // Step 3: Joint Director approves
  const jdApprove = await cctvService.processApprovalTier(requestId, {
    role: 'JD',
    approved: true,
    reviewerName: 'Dr. K. S. Sundaram (Joint Director)',
    remarks: 'Approved. Police report filed. Requires MD sign-off.',
  });
  assert.strictEqual(jdApprove.success, true);
  assert.strictEqual(jdApprove.data.currentApprovalTier, 'Managing Director');

  // Step 4: Managing Director final approval
  const mdApprove = await cctvService.processApprovalTier(requestId, {
    role: 'MD',
    approved: true,
    reviewerName: 'Dr. V. Thirunavukkarasu (Managing Director)',
    remarks: 'Sanctioned for legal inquiry and police submission.',
  });
  assert.strictEqual(mdApprove.success, true);
  assert.strictEqual(mdApprove.data.currentApprovalTier, 'Approved');
});

test('Scenario CCTV-03: Delivering watermarked evidence clip, logging audit access, and File Room legal archival', async () => {
  // 1. Create and approve request
  const reqRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-GATE-01'],
    incidentDate: '2026-02-14',
    timeWindowStart: '08:15',
    timeWindowEnd: '08:45',
    justificationText: 'Unauthorized delivery vehicle impact with perimeter boom barrier',
    requesterId: 'EMP-SEC-01',
    requesterName: 'Security Chief S. Raman',
    department: 'Campus Security',
    urgencyLevel: 'Emergency / Legal Investigation',
    isSensitive: true,
  });
  const reqId = reqRes.data.id;

  await cctvService.processApprovalTier(reqId, { role: 'HOD', approved: true });
  await cctvService.processApprovalTier(reqId, { role: 'JD', approved: true });
  await cctvService.processApprovalTier(reqId, { role: 'MD', approved: true });

  // 2. Deliver watermarked clip
  const deliverRes = await cctvService.deliverClip(reqId, {
    clipPreparedBy: 'S. Selvakumar (Camera Room Operator)',
    watermarkText: 'LEGAL-INVESTIGATION-POLICE-EVIDENCE-2026',
    clipDurationSeconds: 1800,
    fileSizeBytes: 420000000,
  });
  assert.strictEqual(deliverRes.success, true);
  assert.ok(deliverRes.data.clipDelivery);
  assert.ok(deliverRes.data.clipDelivery.watermarkText);

  // 3. Log access download in audit trail
  const logRes = await cctvService.logAccessDownload(reqId, {
    userId: 'EMP-SEC-01',
    userName: 'Security Chief S. Raman',
    action: 'EXPORT_FOR_POLICE',
  });
  assert.strictEqual(logRes.success, true);

  // 4. Register master physical case file & storage in File Room
  const regFile = await fileRoomService.registerFile({
    fileRefNo: 'CCTV/LEGAL/2026/INC-GATE-001',
    fileName: 'Main Gate Vehicle Collision Case File & Watermarked CCTV Master Drive',
    category: 'Legal, Land & Institutional Deeds',
    ownerDepartment: 'Security',
    academicYear: '2025-2026',
    storageLocation: {
      building: 'Administrative Block',
      room: 'Archive Room 102',
      rackNo: 'Rack S-03',
      shelfNo: 'Shelf 02',
      boxNo: 'Box 01',
    },
    confidentiality: 'Executive Confidential',
    designatedApproverRole: 'director',
    retentionRule: 'Permanent Archival',
  });

  assert.strictEqual(regFile.success, true);
  assert.strictEqual(regFile.data.currentLocationStatus, 'In File Room');
});
