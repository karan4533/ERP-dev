import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { cctvService } from '../../../src/services/modules/cctvService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F10-T2-01: Out-of-order approval gating: JD cannot approve before HOD (VULN-M1-05)', async () => {
  mockAdapter.resetDatabase();
  const reqRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-01'],
    incidentDate: '2026-03-20',
    timeWindowStart: '11:00',
    timeWindowEnd: '11:30',
    requesterId: 'EMP-ADM-001',
    requesterName: 'Admin Officer',
    justificationText: 'Gate parking inquiry',
    isSensitive: false,
  });
  const reqId = reqRes.data.id;

  const outOfOrderJd = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
  });

  assertErrorEnvelope(outOfOrderJd, /Department Head \(HOD\) approval must be completed before Joint Director/i);
});

test('F10-T2-02: Out-of-order approval gating: MD cannot approve before HOD and JD', async () => {
  mockAdapter.resetDatabase();
  const reqRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-02'],
    incidentDate: '2026-03-20',
    timeWindowStart: '12:00',
    timeWindowEnd: '12:30',
    requesterId: 'EMP-ADM-001',
    requesterName: 'Admin Officer',
    justificationText: 'Foyer inquiry',
    isSensitive: true,
  });
  const reqId = reqRes.data.id;

  const outOfOrderMd = await cctvService.processApprovalTier(reqId, {
    role: 'MD',
    approved: true,
  });

  assertErrorEnvelope(outOfOrderMd, /approval must be completed before Managing Director/i);
});

test('F10-T2-03: Rejection at HOD tier transitions status to Rejected and halts further approvals', async () => {
  mockAdapter.resetDatabase();
  const reqRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-01'],
    incidentDate: '2026-03-20',
    timeWindowStart: '13:00',
    timeWindowEnd: '13:30',
    requesterId: 'EMP-ADM-001',
    requesterName: 'Admin Officer',
    justificationText: 'Minor item check',
    isSensitive: false,
  });
  const reqId = reqRes.data.id;

  const hodReject = await cctvService.processApprovalTier(reqId, {
    role: 'HOD',
    approved: false,
    remarks: 'Unjustified requisition request',
  });
  assertSuccessEnvelope(hodReject);
  assert.equal(hodReject.data.currentApprovalTier, 'Rejected');

  // Attempting JD approval after rejection must be blocked
  const jdAfterReject = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
  });
  assertErrorEnvelope(jdAfterReject, /rejected and cannot receive further/i);
});

test('F10-T2-04: Deliver clip is rejected if requisition has not achieved Approved status', async () => {
  mockAdapter.resetDatabase();
  const reqRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-01'],
    incidentDate: '2026-03-20',
    timeWindowStart: '14:00',
    timeWindowEnd: '14:30',
    requesterId: 'EMP-ADM-001',
    requesterName: 'Admin Officer',
    justificationText: 'Delivery gate check',
    isSensitive: false,
  });
  const reqId = reqRes.data.id;

  // Attempt deliver without approvals
  const prematureDeliver = await cctvService.deliverClip(reqId, {
    retrievalOperatorName: 'CCTV Custodian',
  });
  assertErrorEnvelope(prematureDeliver, /Cannot deliver clip until all required approval tiers have approved/i);
});

test('F10-T2-05: processApprovalTier rejects unauthorized or invalid approval role', async () => {
  mockAdapter.resetDatabase();
  const reqRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-01'],
    incidentDate: '2026-03-20',
    timeWindowStart: '15:00',
    timeWindowEnd: '15:30',
    requesterId: 'EMP-ADM-001',
    requesterName: 'Admin Officer',
    justificationText: 'Validation test',
    isSensitive: false,
  });
  const reqId = reqRes.data.id;

  const res = await cctvService.processApprovalTier(reqId, {
    role: 'AnonymousHacker',
    approved: true,
  });
  assertErrorEnvelope(res, /invalid approval tier role/i);
});
