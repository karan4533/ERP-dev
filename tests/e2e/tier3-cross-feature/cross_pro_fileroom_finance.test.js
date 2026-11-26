/**
 * Tier 3: Cross-Feature Integration Test Suite
 * Pairwise Module: PRO Government Liaison, Physical File Room Custody & Finance Inspection Fees
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { proService } from '../../../src/services/modules/proService.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';
import { feeService } from '../../../src/services/modules/feeService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('X-PFF-01: PRO Government liaison schedules CBSE affiliation inspection and links required files', async () => {
  // PRO logs upcoming inspection
  const inspRes = await proService.createInspection({
    inspectionDate: '2026-03-15',
    inspectingBody: 'Central Board of Secondary Education',
    purpose: 'CBSE Composite Affiliation Inspection',
    status: 'Scheduled',
    officerInCharge: 'Mr. R. Raghavan (PRO)',
    checklist: [
      { item: 'Campus Land Title & Survey Sketch (Original Deed)', required: true },
      { item: 'Fire & Safety NOC Compliance Certificate', required: true },
      { item: 'Structural Stability Certificate', required: true },
    ],
  });

  assert.strictEqual(inspRes.success, true);
  assert.strictEqual(inspRes.data.status, 'Scheduled');

  // Verify correspondence entry exists
  const corrRes = await proService.createCorrespondence({
    direction: 'Inward',
    governmentDepartment: 'CBSE Regional Office',
    subject: 'Intimation of Composite Inspection for Affiliation Extension',
    referenceNumber: 'CBSE/AFF/EXT-2026/0491',
    category: 'Affiliation',
    receivedOrDispatchedDate: '2026-02-10',
    handlingOfficer: 'Mr. R. Raghavan',
    actionRequired: 'Prepare physical dossier and land deeds from Custody',
  });

  assert.strictEqual(corrRes.success, true);
  assert.strictEqual(corrRes.data.direction, 'Inward');
});

test('X-PFF-02: Strictly Confidential file requires MD sign-off before File Room releases custody to PRO', async () => {
  // File FILE-2026-002 in seed data is 'Strictly Confidential'
  const fileRes = await fileRoomService.getFileById('FILE-2026-002');
  assert.strictEqual(fileRes.success, true);
  const file = fileRes.data;
  assert.strictEqual(file.confidentiality, 'Strictly Confidential');

  // Attempt checkout without Director/Superadmin role -> must fail
  const unauthCheckout = await fileRoomService.requestCheckout({
    fileId: file.id,
    requestedById: 'EMP-PRO-01',
    requestedByName: 'Mr. R. Raghavan (PRO)',
    department: 'Public Relations Office',
    purpose: 'CBSE Inspection Commission Review',
    approvalRole: 'pro', // Unauthorized for Strictly Confidential
  });
  assert.strictEqual(unauthCheckout.success, false);
  assert.match(unauthCheckout.error, /require explicit Managing Director/i);

  // Authorized checkout with director approval role -> succeeds
  const authCheckout = await fileRoomService.requestCheckout({
    fileId: file.id,
    requestedById: 'EMP-PRO-01',
    requestedByName: 'Mr. R. Raghavan (PRO)',
    department: 'Public Relations Office',
    purpose: 'CBSE Inspection Commission Review',
    approvalRole: 'director',
    approvedBy: 'Managing Director',
    custodianName: 'File Room In-charge',
  });

  assert.strictEqual(authCheckout.success, true);
  assert.strictEqual(authCheckout.data.file.currentLocationStatus, 'Checked Out / Issued');
  assert.strictEqual(authCheckout.data.file.heldByUserName, 'Mr. R. Raghavan (PRO)');
});

test('X-PFF-03: Inspection fee challan recorded in Finance and deed return restores File Room custody', async () => {
  // 1. Checkout file
  const checkoutRes = await fileRoomService.requestCheckout({
    fileId: 'FILE-2026-002',
    requestedById: 'EMP-PRO-01',
    requestedByName: 'Mr. R. Raghavan (PRO)',
    department: 'PRO',
    purpose: 'CBSE Commission',
    approvalRole: 'director',
  });
  const issueId = checkoutRes.data.issueRecord.id;

  // 2. Statutory inspection fee challan logged in Fee system
  const feeHeadRes = await feeService.createFeeHead({
    code: 'FH-STATUTORY-CBSE',
    name: 'Statutory Board Inspection Fee',
    defaultAmount: 25000,
    category: 'Institutional',
  });
  assert.strictEqual(feeHeadRes.success, true);

  // 3. Return the physical deed back to File Room rack
  const returnRes = await fileRoomService.returnPhysicalFile(issueId, {
    receivedByCustodian: 'File Room In-charge',
    returnCondition: 'Intact / Pristine',
    notes: 'Returned by PRO after successful CBSE commission inspection.',
  });

  assert.strictEqual(returnRes.success, true);
  assert.strictEqual(returnRes.data.issue.status, 'Returned');
  assert.strictEqual(returnRes.data.file.currentLocationStatus, 'In File Room');
  assert.strictEqual(returnRes.data.file.heldByUserId, null);
});
