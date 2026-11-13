/**
 * tests/e2e/tier2-boundary-corner/f18_fileRoom_boundary.test.js
 * Tier 2 Boundary & Corner Cases: File Room Enhancements
 *
 * Edge cases:
 * - Invalid file renames (empty, whitespace, under minimum character length, non-existent file)
 * - Boundary dates (reversed date ranges, far future dates, empty query filters)
 * - Non-returnable checkout boundaries (immutable return status, overdue immunity)
 * - Unapproved requests & validation guards for disposal scheduling
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F18-T2-01: Invalid file rename: empty name, whitespace only, or length < 3 is rejected', async () => {
  mockAdapter.resetDatabase();

  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'EST/BLDG/SANCTION-2026',
    fileName: 'Campus Blueprints Original',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Estate',
  });
  const fileId = regRes.data.id;

  // 1. Empty string
  const emptyRes = await fileRoomService.renameFile(fileId, '');
  assertErrorEnvelope(emptyRes, /characters/i, 'Empty file name should be rejected');

  // 2. Whitespace only
  const wsRes = await fileRoomService.renameFile(fileId, '   ');
  assertErrorEnvelope(wsRes, /characters/i, 'Whitespace-only file name should be rejected');

  // 3. Less than 3 characters
  const shortRes = await fileRoomService.renameFile(fileId, 'AB');
  assertErrorEnvelope(shortRes, /characters/i, 'File name under 3 chars should be rejected');

  // Verify original name remains untouched
  const getRes = await fileRoomService.getFileById(fileId);
  assert.equal(getRes.data.fileName, 'Campus Blueprints Original');
});

test('F18-T2-02: Renaming non-existent file ID returns error envelope', async () => {
  mockAdapter.resetDatabase();
  const res = await fileRoomService.renameFile('NON-EXISTENT-ID-99999', 'Valid New Title');
  assertErrorEnvelope(res, /not found/i, 'Non-existent file ID rename must fail');
});

test('F18-T2-03: Inverted date boundary (fromDate > toDate) returns 0 records without unhandled crash', async () => {
  mockAdapter.resetDatabase();
  const res = await fileRoomService.getFiles({ fromDate: '2026-12-31', toDate: '2026-01-01' });
  assertSuccessEnvelope(res, 'Reversed date range must return valid envelope');
  assert.equal(res.data.length, 0, 'Inverted date window should match zero files');
});

test('F18-T2-04: Searching by non-existent date window yields empty results with total 0', async () => {
  mockAdapter.resetDatabase();
  const res = await fileRoomService.getFiles({ fromDate: '2099-01-01', toDate: '2099-12-31' });
  assertSuccessEnvelope(res);
  assert.equal(res.data.length, 0);
  assert.equal(res.meta.total, 0);
});

test('F18-T2-05: Non-returnable checkout retains non-returnable status and is immune to overdue flagging', async () => {
  mockAdapter.resetDatabase();

  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'TC/PERM/DISPATCH-01',
    fileName: 'Permanent Student Clearance Dossier for University Entry',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Academics',
    isReturnable: 'Non-Returnable',
  });

  const checkoutRes = await fileRoomService.requestCheckout({
    fileId: regRes.data.id,
    requestedById: 'EMP-ADM-005',
    requestedByName: 'Director Assistant',
    purpose: 'Archival transfer to state record office',
    isReturnable: 'Non-Returnable',
    approvalRole: 'admin',
  });

  assertSuccessEnvelope(checkoutRes);
  const issueId = checkoutRes.data.issueRecord.id;

  // Verify outward register entry
  const outwardRes = await fileRoomService.getOutwardRegister();
  const issueRecord = outwardRes.data.find((o) => o.id === issueId);
  assert.ok(issueRecord);
  assert.equal(issueRecord.status, 'Dispatched / Non-Returnable');
  assert.equal(issueRecord.expectedReturnDate, null);

  // Even if time passes, overdue evaluator excludes it
  const overdueRes = await fileRoomService.checkOverdueFiles();
  assertSuccessEnvelope(overdueRes);
  assert.equal(overdueRes.data.some((i) => i.id === issueId), false);
});

test('F18-T2-06: Missing mandatory fields in disposal scheduling is rejected with error envelope', async () => {
  mockAdapter.resetDatabase();

  // Missing boardResolutionNo
  const missingRes = await fileRoomService.scheduleDisposal({
    fileRefNo: 'FIN/VOUCH/2016',
    fileName: 'Old Cash Vouchers',
    disposalMethod: 'Shredding',
    authorizedBy: 'Managing Director',
    // boardResolutionNo omitted
  });
  assertErrorEnvelope(missingRes, /boardResolutionNo/i);

  // Missing authorizedBy
  const missingAuth = await fileRoomService.scheduleDisposal({
    fileRefNo: 'FIN/VOUCH/2016',
    fileName: 'Old Cash Vouchers',
    disposalMethod: 'Shredding',
    boardResolutionNo: 'RES-01',
    // authorizedBy omitted
  });
  assertErrorEnvelope(missingAuth, /authorizedBy/i);
});
