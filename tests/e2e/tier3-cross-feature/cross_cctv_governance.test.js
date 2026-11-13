/**
 * Tier 3: Cross-Feature Integration Test Suite
 * Pairwise Module: CCTV Footage Governance & Physical File Room Legal Archival
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

test('X-CG-01: Sensitive CCTV incident footage progresses through 3-tier sequential approval (HOD -> JD -> MD)', async () => {
  // 1. Create sensitive footage request
  const reqRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-GATE-01'],
    incidentDate: '2026-02-12',
    timeWindowStart: '14:30',
    timeWindowEnd: '15:15',
    justificationText: 'Vehicle collision and unauthorized visitor breach at Main Gate',
    requesterId: 'EMP-SEC-01',
    requesterName: 'Security Chief S. Raman',
    department: 'Campus Security',
    urgencyLevel: 'Emergency / Legal Investigation',
    isSensitive: true,
  });

  assert.strictEqual(reqRes.success, true);
  const requestId = reqRes.data.id;
  assert.strictEqual(reqRes.data.currentApprovalTier, 'Dept Head');

  // 2. Tier 1: Department Head (HOD) approval
  const hodRes = await cctvService.processApprovalTier(requestId, {
    role: 'HOD',
    approved: true,
    reviewerName: 'Dr. A. Joseph (HOD Admin)',
    remarks: 'Verified gate incident log. Forwarded for Joint Director approval.',
  });
  assert.strictEqual(hodRes.success, true);
  assert.strictEqual(hodRes.data.currentApprovalTier, 'Joint Director');

  // 3. Tier 2: Joint Director (JD) approval
  const jdRes = await cctvService.processApprovalTier(requestId, {
    role: 'JD',
    approved: true,
    reviewerName: 'Dr. K. S. Sundaram (Joint Director)',
    remarks: 'Approved. Sensitive incident requires MD executive sign-off.',
  });
  assert.strictEqual(jdRes.success, true);
  assert.strictEqual(jdRes.data.currentApprovalTier, 'Managing Director');

  // 4. Tier 3: Managing Director (MD) final sign-off
  const mdRes = await cctvService.processApprovalTier(requestId, {
    role: 'MD',
    approved: true,
    reviewerName: 'Dr. V. Thirunavukkarasu (Managing Director)',
    remarks: 'Sanctioned for external police and insurance investigation.',
  });
  assert.strictEqual(mdRes.success, true);
  assert.strictEqual(mdRes.data.currentApprovalTier, 'Approved');
});

test('X-CG-02: Watermarked export delivery is verified only after complete 3-tier sign-off', async () => {
  const reqRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-BUS-BAY-02'],
    incidentDate: '2026-02-12',
    timeWindowStart: '07:30',
    timeWindowEnd: '08:00',
    justificationText: 'Transport safety inquiry',
    requesterId: 'EMP-TRN-01',
    requesterName: 'Transport Supervisor',
    department: 'Transport',
    urgencyLevel: 'High',
    isSensitive: true,
  });
  const reqId = reqRes.data.id;

  // Attempt delivery before tier approvals
  const prematureDeliver = await cctvService.deliverClip(reqId, {
    deliveredTo: 'Transport Head',
  });
  assert.strictEqual(prematureDeliver.success, false);
  assert.match(prematureDeliver.error, /cannot deliver clip until all required approval tiers/i);

  // Complete all 3 tiers
  await cctvService.processApprovalTier(reqId, { role: 'HOD', approved: true });
  await cctvService.processApprovalTier(reqId, { role: 'JD', approved: true });
  await cctvService.processApprovalTier(reqId, { role: 'MD', approved: true });

  // Now delivery succeeds
  const deliverRes = await cctvService.deliverClip(reqId, {
    deliveredTo: 'Transport Head',
    watermarkText: 'CONFIDENTIAL-LEGAL-TRANSPORT-INVESTIGATION',
    mediaHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  });
  assert.strictEqual(deliverRes.success, true);
  assert.ok(deliverRes.data.clipDelivery);
  assert.ok(deliverRes.data.clipDelivery.watermarkText);
});

test('X-CG-03: CCTV incident dossier and USB custody archived into Physical File Room', async () => {
  // Archive investigation media file in File Room
  const regFile = await fileRoomService.registerFile({
    fileRefNo: 'CCTV/LEGAL/2026/INC-042',
    fileName: 'Main Gate Incident CCTV Watermarked Footage Master USB & Police Report',
    category: 'Legal, Land & Institutional Deeds',
    ownerDepartment: 'Security',
    academicYear: '2025-2026',
    storageLocation: {
      building: 'Administrative Block',
      room: 'Archive Room 102',
      rackNo: 'Rack S-02',
      shelfNo: 'Shelf 01',
      boxNo: 'Case File 14',
    },
    confidentiality: 'Executive Confidential',
    designatedApproverRole: 'director',
    retentionRule: '7 Years',
  });

  assert.strictEqual(regFile.success, true);
  assert.strictEqual(regFile.data.currentLocationStatus, 'In File Room');

  // Checkout file for police verification review
  const checkout = await fileRoomService.requestCheckout({
    fileId: regFile.data.id,
    requestedById: 'EMP-SEC-01',
    requestedByName: 'Security Chief',
    department: 'Security',
    purpose: 'Police Inspector Investigation Review',
    approvalRole: 'director',
    approvedBy: 'Managing Director',
  });

  assert.strictEqual(checkout.success, true);
  assert.strictEqual(checkout.data.file.currentLocationStatus, 'Checked Out / Issued');
});
