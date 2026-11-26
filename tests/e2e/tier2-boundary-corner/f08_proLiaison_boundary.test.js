import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { proService } from '../../../src/services/modules/proService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F08-T2-01: createCorrespondence rejects payload missing direction', async () => {
  mockAdapter.resetDatabase();
  const res = await proService.createCorrespondence({
    referenceNumber: 'REF-001',
    subject: 'Missing Direction',
    governmentDepartment: 'CBSE',
    receivedOrDispatchedDate: '2026-03-01',
  });
  assertErrorEnvelope(res);
});

test('F08-T2-02: createCorrespondence rejects payload missing referenceNumber or subject', async () => {
  mockAdapter.resetDatabase();
  const resNoRef = await proService.createCorrespondence({
    direction: 'Inward',
    subject: 'Missing Reference',
    governmentDepartment: 'CBSE',
    receivedOrDispatchedDate: '2026-03-01',
  });
  assertErrorEnvelope(resNoRef);

  const resNoSubj = await proService.createCorrespondence({
    direction: 'Inward',
    referenceNumber: 'REF-002',
    governmentDepartment: 'CBSE',
    receivedOrDispatchedDate: '2026-03-01',
  });
  assertErrorEnvelope(resNoSubj);
});

test('F08-T2-03: createCorrespondence rejects payload with whitespace-only governmentDepartment', async () => {
  mockAdapter.resetDatabase();
  const res = await proService.createCorrespondence({
    direction: 'Inward',
    referenceNumber: 'REF-003',
    subject: 'Whitespace Department',
    governmentDepartment: '   ',
    receivedOrDispatchedDate: '2026-03-01',
  });
  assertErrorEnvelope(res);
});

test('F08-T2-04: createPermit rejects payload missing expiryDate or permitType', async () => {
  mockAdapter.resetDatabase();
  const res = await proService.createPermit({
    permitNumber: 'PER-999',
    issuingAuthority: 'Fire Dept',
    issueDate: '2026-01-01',
  });
  assertErrorEnvelope(res);
});

test('F08-T2-05: createInspection rejects payload missing inspectingBody or purpose', async () => {
  mockAdapter.resetDatabase();
  const res = await proService.createInspection({
    inspectionDate: '2026-04-10',
    status: 'Scheduled',
  });
  assertErrorEnvelope(res);
});
