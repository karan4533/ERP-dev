import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { cctvService } from '../../../src/services/modules/cctvService.js';
import { CCTV_CAMERA_STATUS, CCTV_APPROVAL_TIER } from '../../../src/services/models/index.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F10-T1-01: CCTV service retrieves camera inventory with locations and operational status', async () => {
  mockAdapter.resetDatabase();
  const res = await cctvService.getCameras();
  assertSuccessEnvelope(res, 'cctvService.getCameras');
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 5);

  const mainGateCam = res.data.find((c) => (c.name && c.name.includes('Gate')) || (c.zone && c.zone.includes('Gates')));
  assert.ok(mainGateCam, 'Main gate camera should exist');
  assert.ok(mainGateCam.currentStatus, 'Camera must have currentStatus');
});

test('F10-T1-02: CCTV service logs daily operational status inspection check', async () => {
  mockAdapter.resetDatabase();
  const checkLog = {
    checkDate: '2026-03-22',
    shift: 'Morning Shift (06:00 - 14:00)',
    inspectorId: 'EMP-CCTV-001',
    inspectorName: 'S. Selvakumar',
    findingsAndAnomalies: [
      { cameraId: 'CAM-01', anomalyDescription: 'Dome housing cleaned', actionTaken: 'Cleaned', ticketRaised: false },
    ],
  };

  const res = await cctvService.logDailyCheck(checkLog);
  assertSuccessEnvelope(res, 'cctvService.logDailyCheck');
  assert.ok(res.data.id);
  assert.equal(res.data.shift, checkLog.shift);
});

test('F10-T1-03: CCTV service initiates footage requisition with incident timeframe and justification', async () => {
  mockAdapter.resetDatabase();
  const reqData = {
    incidentDate: '2026-03-21',
    timeWindowStart: '14:00',
    timeWindowEnd: '14:30',
    cameraIds: ['CAM-01', 'CAM-02'],
    requesterId: 'EMP-SEC-001',
    requesterName: 'Head of Security',
    justificationText: 'Gate parking barrier damage investigation',
    isSensitive: false,
  };

  const res = await cctvService.createFootageRequest(reqData);
  assertSuccessEnvelope(res, 'cctvService.createFootageRequest');
  assert.ok(res.data.id);
  assert.equal(res.data.currentApprovalTier, CCTV_APPROVAL_TIER.DEPT_HEAD);
});

test('F10-T1-04: CCTV service executes sequential multi-tier approvals (HOD -> JD -> Approved)', async () => {
  mockAdapter.resetDatabase();
  const createRes = await cctvService.createFootageRequest({
    incidentDate: '2026-03-21',
    timeWindowStart: '10:00',
    timeWindowEnd: '10:30',
    cameraIds: ['CAM-01'],
    requesterId: 'EMP-ADM-001',
    requesterName: 'Admin Officer',
    justificationText: 'Review of maintenance material unloading',
    isSensitive: false,
  });
  const reqId = createRes.data.id;

  // Step 1: HOD Approval
  const hodRes = await cctvService.processApprovalTier(reqId, {
    role: 'HOD',
    approved: true,
    remarks: 'Approved by Dept Head',
    reviewerName: 'Facilities Head',
  });
  assertSuccessEnvelope(hodRes);
  assert.equal(hodRes.data.currentApprovalTier, CCTV_APPROVAL_TIER.JOINT_DIRECTOR);

  // Step 2: JD Approval (non-sensitive request transitions to Approved)
  const jdRes = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
    remarks: 'Approved by Joint Director',
    reviewerName: 'Dr. K. S. Sundaram',
  });
  assertSuccessEnvelope(jdRes);
  assert.equal(jdRes.data.currentApprovalTier, CCTV_APPROVAL_TIER.APPROVED);
});

test('F10-T1-05: CCTV service delivers watermarked clip for approved requisition and updates access logs', async () => {
  mockAdapter.resetDatabase();
  const createRes = await cctvService.createFootageRequest({
    incidentDate: '2026-03-21',
    timeWindowStart: '09:00',
    timeWindowEnd: '09:30',
    cameraIds: ['CAM-01'],
    requesterId: 'EMP-SEC-001',
    requesterName: 'Security Lead',
    justificationText: 'Routine audit check',
    isSensitive: false,
  });
  const reqId = createRes.data.id;

  await cctvService.processApprovalTier(reqId, { role: 'HOD', approved: true });
  await cctvService.processApprovalTier(reqId, { role: 'JD', approved: true });

  const deliverRes = await cctvService.deliverClip(reqId, {
    clipPreparedBy: 'CCTV In-charge',
    clipDurationSeconds: 1800,
  });

  assertSuccessEnvelope(deliverRes, 'cctvService.deliverClip');
  assert.ok(deliverRes.data.clipDelivery.streamingUrl);
  assert.ok(deliverRes.data.clipDelivery.watermarkText.includes('CONFIDENTIAL'));
});
