import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { proService } from '../../../src/services/modules/proService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F08-T1-01: PRO service retrieves government correspondence records', async () => {
  mockAdapter.resetDatabase();
  const res = await proService.getCorrespondence();
  assertSuccessEnvelope(res, 'proService.getCorrespondence');
  assert.ok(Array.isArray(res.data), 'Correspondence must be an array');
  assert.ok(res.data.length >= 2, 'Initial correspondence records expected');
});

test('F08-T1-02: PRO service creates inward correspondence with government authority', async () => {
  mockAdapter.resetDatabase();
  const payload = {
    direction: 'Inward',
    referenceNumber: 'GOVT-EDN-2026-442',
    subject: 'CBSE Affiliation Renewal Inspection Directive',
    governmentDepartment: 'Central Board of Secondary Education',
    receivedOrDispatchedDate: '2026-03-15',
    statutoryDeadline: '2026-04-15',
    officerInCharge: 'R. K. Meena (Regional Officer)',
  };
  const res = await proService.createCorrespondence(payload);
  assertSuccessEnvelope(res, 'proService.createCorrespondence');
  assert.ok(res.data.id);
  assert.equal(res.data.referenceNumber, payload.referenceNumber);
  assert.equal(res.data.governmentDepartment, payload.governmentDepartment);
});

test('F08-T1-03: PRO service creates outward compliance response correspondence', async () => {
  mockAdapter.resetDatabase();
  const payload = {
    direction: 'Outward',
    referenceNumber: 'SCH-PRO-OUT-2026-08',
    subject: 'Submission of Fire Safety Certificate Compliance Affidavit',
    governmentDepartment: 'Tamil Nadu Fire & Rescue Services',
    receivedOrDispatchedDate: '2026-03-20',
    statutoryDeadline: '2026-04-01',
  };
  const res = await proService.createCorrespondence(payload);
  assertSuccessEnvelope(res);
  assert.equal(res.data.direction, 'Outward');
  assert.equal(res.data.referenceNumber, payload.referenceNumber);
});

test('F08-T1-04: PRO service aggregates statutory compliance calendar with critical deadlines', async () => {
  mockAdapter.resetDatabase();
  const res = await proService.getComplianceCalendar();
  assertSuccessEnvelope(res, 'proService.getComplianceCalendar');
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length > 0);
  assert.ok(res.data.some((item) => item.type === 'Permit Renewal' || item.type === 'Correspondence Deadline'));
});

test('F08-T1-05: PRO service retrieves statutory permits and track renewal dates', async () => {
  mockAdapter.resetDatabase();
  const res = await proService.getPermits();
  assertSuccessEnvelope(res, 'proService.getPermits');
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 3);
  const firePermit = res.data.find((p) => p.permitType.includes('Fire') || p.permitNumber.includes('NOC'));
  assert.ok(firePermit, 'Fire safety NOC permit must exist');
  assert.ok(firePermit.expiryDate, 'Permit must specify expiryDate');
});

test('F08-T1-06: PRO service supplies government inspection logs and telemetry stats', async () => {
  mockAdapter.resetDatabase();
  const inspRes = await proService.getInspections();
  assertSuccessEnvelope(inspRes, 'proService.getInspections');
  assert.ok(Array.isArray(inspRes.data));

  const statsRes = await proService.getComplianceStats();
  assertSuccessEnvelope(statsRes, 'proService.getComplianceStats');
  assert.ok(typeof statsRes.data.totalCorrespondence === 'number');
  assert.ok(typeof statsRes.data.activePermits === 'number');
});
