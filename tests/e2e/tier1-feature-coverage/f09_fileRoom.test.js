import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';
import { CONFIDENTIALITY_TIERS, FILE_STATUS } from '../../../src/services/models/index.js';
import { assertSuccessEnvelope, assertStorageLocationStructure } from '../harness/testHelpers.js';

test('F09-T1-01: File Room service registers physical document with 4-tier storage coordinates', async () => {
  mockAdapter.resetDatabase();
  const fileData = {
    fileRefNo: 'EST/BLDG/SANCTION-2026',
    fileName: 'Science Block DTCP Building Sanction Plan',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Estate & Infrastructure',
    storageLocation: {
      building: 'Administrative Block',
      room: 'Strong Room 102',
      rackNo: 'Rack D',
      shelfNo: 'Shelf 02',
      boxNo: 'Box 08',
    },
    confidentiality: CONFIDENTIALITY_TIERS.DEPARTMENT_RESTRICTED,
  };

  const res = await fileRoomService.registerFile(fileData);
  assertSuccessEnvelope(res, 'fileRoomService.registerFile');
  assert.ok(res.data.id);
  assert.equal(res.data.fileRefNo, fileData.fileRefNo);
  assertStorageLocationStructure(res.data.storageLocation);
  assert.equal(res.data.storageLocation.rackNo, 'Rack D');
  assert.equal(res.data.currentLocationStatus, FILE_STATUS.IN_ARCHIVE);
});

test('F09-T1-02: File Room service checks out file and updates status to Checked Out / Issued', async () => {
  mockAdapter.resetDatabase();
  const filesRes = await fileRoomService.getFiles();
  const availableFile = filesRes.data.find(
    (f) => f.currentLocationStatus === FILE_STATUS.IN_ARCHIVE && f.confidentiality !== CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL
  );
  assert.ok(availableFile, 'Must have an available non-strictly-confidential file');

  const checkoutRes = await fileRoomService.requestCheckout({
    fileId: availableFile.id,
    requestedById: 'EMP-ADM-002',
    requestedByName: 'Administrative Coordinator',
    purpose: 'Preparation for CBSE Affiliation Audit',
    approvalRole: 'admin',
    expectedReturnDate: '2026-04-10',
  });

  assertSuccessEnvelope(checkoutRes, 'fileRoomService.requestCheckout');
  assert.equal(checkoutRes.data.file.currentLocationStatus, FILE_STATUS.CHECKED_OUT);
  assert.ok(checkoutRes.data.issueRecord.id);
  assert.equal(checkoutRes.data.issueRecord.fileId, availableFile.id);
});

test('F09-T1-03: File Room service restocks checked-out file back to archive upon physical return', async () => {
  mockAdapter.resetDatabase();
  const outwardRes = await fileRoomService.getOutwardRegister();
  const activeIssue = outwardRes.data.find((o) => o.status === 'Issued' || o.status === 'Overdue');
  assert.ok(activeIssue, 'Must find an active issue in seed data');

  const returnRes = await fileRoomService.returnPhysicalFile(activeIssue.id, {
    returnCondition: 'Mint',
    notes: 'Restocked safely into assigned rack and shelf.',
  });

  assertSuccessEnvelope(returnRes, 'fileRoomService.returnPhysicalFile');
  assert.equal(returnRes.data.file.currentLocationStatus, FILE_STATUS.IN_ARCHIVE);
  assert.equal(returnRes.data.issue.status, 'Returned');
});

test('F09-T1-04: File Room service checks for overdue physical files based on loan duration', async () => {
  mockAdapter.resetDatabase();
  const overdueRes = await fileRoomService.checkOverdueFiles();
  assertSuccessEnvelope(overdueRes, 'fileRoomService.checkOverdueFiles');
  assert.ok(Array.isArray(overdueRes.data));
  assert.ok(overdueRes.data.length >= 1, 'Seed data should contain at least one overdue file checkout');
});

test('F09-T1-05: File Room service returns accurate archive health and checkout statistics', async () => {
  mockAdapter.resetDatabase();
  const statsRes = await fileRoomService.getFileRoomStats();
  assertSuccessEnvelope(statsRes, 'fileRoomService.getFileRoomStats');
  assert.ok(statsRes.data.totalFiles >= 4);
  assert.ok(typeof statsRes.data.checkedOutFiles === 'number');
  assert.ok(typeof statsRes.data.strictlyConfidentialCount === 'number');
});
