import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';
import { CONFIDENTIALITY_TIERS } from '../../../src/services/models/index.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F09-T2-01: Strictly Confidential physical file checkout is blocked without MD executive approval', async () => {
  mockAdapter.resetDatabase();
  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'CORP/DEED/2026/TOPSECRET',
    fileName: 'Land Acquisition Title Deed Original Sanctions',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Board of Governors',
    confidentiality: CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL,
  });
  assertSuccessEnvelope(regRes);
  const fileId = regRes.data.id;

  const failedCheckout = await fileRoomService.requestCheckout({
    fileId,
    requestedById: 'EMP-TCH-001',
    requestedByName: 'Teacher',
    purpose: 'Reviewing deed',
    approvalRole: 'teacher', // Not director/superadmin
  });

  assertErrorEnvelope(failedCheckout, /Managing Director|superadmin|authorized/i);
});

test('F09-T2-02: Strictly Confidential physical file checkout succeeds with Managing Director authorization', async () => {
  mockAdapter.resetDatabase();
  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'CORP/TITLE/002',
    fileName: 'Campus Blueprints 2026',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Executive',
    confidentiality: CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL,
  });
  const fileId = regRes.data.id;

  const validCheckout = await fileRoomService.requestCheckout({
    fileId,
    requestedById: 'EMP-DIR-001',
    requestedByName: 'Managing Director',
    purpose: 'Statutory Inspection Submission',
    approvalRole: 'director',
    approvedBy: 'Managing Director',
  });

  assertSuccessEnvelope(validCheckout, 'Checkout with MD authorization should succeed');
  assert.equal(validCheckout.data.file.currentLocationStatus, 'Checked Out / Issued');
});

test('F09-T2-03: Double-checkout prevention: attempting to check out an already checked out file is rejected', async () => {
  mockAdapter.resetDatabase();
  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'ACAD/SYLL/2026',
    fileName: 'Curriculum Master Register',
    category: 'Curriculum',
    ownerDepartment: 'Academics',
    confidentiality: CONFIDENTIALITY_TIERS.DEPARTMENT_RESTRICTED,
  });
  const fileId = regRes.data.id;

  // First checkout
  const firstCheckout = await fileRoomService.requestCheckout({
    fileId,
    requestedById: 'EMP-ADM-001',
    requestedByName: 'Admin Officer',
    purpose: 'Syllabus audit',
    approvalRole: 'admin',
  });
  assertSuccessEnvelope(firstCheckout);

  // Second checkout attempt on same file
  const secondCheckout = await fileRoomService.requestCheckout({
    fileId,
    requestedById: 'EMP-TCH-002',
    requestedByName: 'Teacher Two',
    purpose: 'Lesson planning',
    approvalRole: 'admin',
  });

  assertErrorEnvelope(secondCheckout, /Checked Out|unavailable/i);
});

test('F09-T2-04: registerFile rejects payload missing mandatory fields (fileRefNo, fileName, ownerDepartment)', async () => {
  mockAdapter.resetDatabase();
  const missingRefRes = await fileRoomService.registerFile({
    fileName: 'File without Ref',
    category: 'General',
    ownerDepartment: 'Admin',
  });
  assertErrorEnvelope(missingRefRes);

  const missingNameRes = await fileRoomService.registerFile({
    fileRefNo: 'REF-001',
    category: 'General',
    ownerDepartment: 'Admin',
  });
  assertErrorEnvelope(missingNameRes);

  const missingDeptRes = await fileRoomService.registerFile({
    fileRefNo: 'REF-002',
    fileName: 'Valid Name',
    category: 'General',
  });
  assertErrorEnvelope(missingDeptRes);
});

test('F09-T2-05: returnPhysicalFile returns error when issue ID does not exist', async () => {
  mockAdapter.resetDatabase();
  const res = await fileRoomService.returnPhysicalFile('NONEXISTENT-ISSUE-ID-999');
  assertErrorEnvelope(res, /not found/i);
});
