import test from 'node:test';
import assert from 'node:assert/strict';

import { fileRoomService } from '../../../services/modules/fileRoomService.js';
import { mockAdapter } from '../../../services/api/mockAdapter.js';
import { CONFIDENTIALITY_TIERS } from '../../../services/models/index.js';

test('File Room M1 - Date Range & Exclusion Filtering', async () => {
  mockAdapter.resetDatabase();

  // Test 1: Accession date filtering
  const allRes = await fileRoomService.getFiles();
  assert.equal(allRes.success, true);
  assert.ok(Array.isArray(allRes.data));
  const totalCount = allRes.data.length;

  const filteredRes = await fileRoomService.getFiles({
    fromDate: '2026-02-01',
    toDate: '2026-03-31',
  });
  assert.equal(filteredRes.success, true);
  for (const file of filteredRes.data) {
    if (file.accessionDate) {
      assert.ok(file.accessionDate >= '2026-02-01');
      assert.ok(file.accessionDate <= '2026-03-31');
    }
  }

  // Test 2: Student & Staff record exclusion
  const excludedRes = await fileRoomService.getFiles({ excludeStudentStaff: true });
  assert.equal(excludedRes.success, true);
  for (const file of excludedRes.data) {
    assert.notEqual(file.category, 'Student Academic & Cumulative Records');
    assert.notEqual(file.category, 'Student Transfer Certificates (TC) & Clearance Stubs');
    assert.notEqual(file.category, 'Staff Dossiers, Service Books & Police Verifications');
  }
});

test('File Room M1 - File Renaming with Audit Logging', async () => {
  mockAdapter.resetDatabase();

  const filesRes = await fileRoomService.getFiles();
  const fileToRename = filesRes.data[0];
  assert.ok(fileToRename, 'Must have at least one file');

  const oldName = fileToRename.fileName;
  const newName = 'Audited Legal Land Deed Master Dossier (Updated)';

  // Validation: short name fails
  const shortFail = await fileRoomService.renameFile(fileToRename.id, 'AB');
  assert.equal(shortFail.success, false);
  assert.ok(shortFail.error.includes('at least 3 characters'));

  // Successful rename
  const renameRes = await fileRoomService.renameFile(fileToRename.id, newName);
  assert.equal(renameRes.success, true);
  assert.equal(renameRes.data.fileName, newName);

  // Verify in getFileById
  const fetched = await fileRoomService.getFileById(fileToRename.id);
  assert.equal(fetched.data.fileName, newName);

  // Verify activity was logged
  const activitiesRes = await fileRoomService.getActivities();
  const renameActivity = activitiesRes.data.find(
    (a) => a.action === 'FILE_RENAMED' && a.details.includes(newName)
  );
  assert.ok(renameActivity, 'Rename activity must be logged in fileroom_activities');
});

test('File Room M1 - Returnable vs Non-Returnable Checkout with Acknowledgement Upload', async () => {
  mockAdapter.resetDatabase();

  // Register a new test file for checkout
  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'TEST/LEGAL/2026/RET-01',
    fileName: 'Original Encumbrance Certificate',
    category: 'Legal, Land Deeds, Lease & Trust Documents',
    confidentiality: CONFIDENTIALITY_TIERS.CONFIDENTIAL,
    ownerDepartment: 'Administration',
    isReturnable: 'Returnable',
    storageCoordinates: { rackNumber: 'RACK-T', shelfNumber: 'SHELF-1', boxNumber: 'BOX-1' },
  });
  assert.equal(regRes.success, true);
  const testFileId = regRes.data.id;

  // Checkout 1: Non-Returnable with acknowledgement attachment
  const checkoutNonReturnable = await fileRoomService.requestCheckout({
    fileId: testFileId,
    borrowerName: 'M. Auditor',
    borrowerDepartment: 'External Audit',
    requestedByName: 'A. Secretary',
    departmentHeadApprover: 'Dr. Head of Admin',
    purpose: 'Permanent submission to Sub-Registrar',
    isReturnable: 'Non-Returnable',
    acknowledgementAttachment: {
      fileName: 'courier_receipt_stub.pdf',
      fileSize: '450 KB',
      uploadedAt: '2026-03-12T10:00:00Z',
    },
  });

  assert.equal(checkoutNonReturnable.success, true);
  const issue = checkoutNonReturnable.data.issueRecord;
  assert.equal(issue.isReturnable, 'Non-Returnable');
  assert.equal(issue.status, 'Dispatched / Non-Returnable');
  assert.equal(issue.expectedReturnDate, null);
  assert.ok(issue.acknowledgementAttachment);
  assert.equal(issue.acknowledgementAttachment.fileName, 'courier_receipt_stub.pdf');
  assert.equal(issue.departmentHeadApprover, 'Dr. Head of Admin');
  assert.equal(issue.departmentHeadApprovalStatus, 'Approved');

  // Verify file's location status updated
  const updatedFile = await fileRoomService.getFileById(testFileId);
  assert.equal(updatedFile.data.currentLocationStatus, 'Dispatched / Non-Returnable');
});

test('File Room M1 - Multi-Stage Access Request Requisition Workflow', async () => {
  mockAdapter.resetDatabase();

  // Create access request
  const reqRes = await fileRoomService.createAccessRequest({
    fileId: 'FILE-2026-001',
    fileRefNo: 'LEGAL/2026/DEED-01',
    fileName: 'Land Ownership Patta',
    requestedByName: 'Staff Officer John',
    requestedById: 'STF-102',
    department: 'Administration',
    departmentHeadApprover: 'Prof. Davis (HOD Admin)',
    purpose: 'CBSE Affiliation compliance inspection',
    urgencyLevel: 'High',
  });
  assert.equal(reqRes.success, true);
  assert.equal(reqRes.data.departmentHeadApprovalStatus, 'Pending Dept Head');

  const reqId = reqRes.data.id;

  // Dept Head Approves
  const approveRes = await fileRoomService.updateAccessRequest(reqId, {
    departmentHeadApprovalStatus: 'Approved',
    remarks: 'Approved for regulatory submission',
  });
  assert.equal(approveRes.success, true);
  assert.equal(approveRes.data.departmentHeadApprovalStatus, 'Approved');

  // Fetch all requests
  const listRes = await fileRoomService.getAccessRequests();
  assert.equal(listRes.success, true);
  const found = listRes.data.find((r) => r.id === reqId);
  assert.ok(found);
  assert.equal(found.departmentHeadApprovalStatus, 'Approved');
});

test('File Room M1 - Archival Disposal Workflow & Certificate Generation', async () => {
  mockAdapter.resetDatabase();

  // Register a file for disposal
  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'DISP/OBSOLETE/2015/01',
    fileName: 'Outdated Transport Bus Fuel Slips (2015)',
    category: 'Financial Audit Registers, Ledgers & Vouchers',
    confidentiality: CONFIDENTIALITY_TIERS.INTERNAL_OPERATIONAL,
    ownerDepartment: 'Finance',
    storageCoordinates: { rackNumber: 'RACK-D', shelfNumber: 'SHELF-9', boxNumber: 'BOX-9' },
  });
  assert.equal(regRes.success, true);
  const fileId = regRes.data.id;

  // Schedule & execute disposal
  const dispRes = await fileRoomService.scheduleDisposal({
    fileId: fileId,
    disposalMethod: 'Shredding',
    scheduledDate: '2026-03-15',
    boardResolutionNo: 'BOM-2026/RES-99',
    authorizedBy: 'Dr. V. Thirunavukkarasu (Managing Director)',
    witnesses: 'K. Rajendran, S. Meenakshi',
    remarks: 'Complied with 8-year statutory limit.',
  });

  assert.equal(dispRes.success, true);
  assert.equal(dispRes.data.status, 'Completed');
  assert.ok(dispRes.data.certificateNumber.startsWith('CERT-DISP-'));

  // Verify file status was updated to Disposed / Destroyed
  const fileAfter = await fileRoomService.getFileById(fileId);
  assert.equal(fileAfter.data.currentLocationStatus, 'Disposed / Destroyed');

  // Retrieve certificate
  const certRes = await fileRoomService.getDisposalCertificate(dispRes.data.certificateNumber);
  assert.equal(certRes.success, true);
  assert.equal(certRes.data.boardResolutionNo, 'BOM-2026/RES-99');
  assert.equal(certRes.data.disposalMethod, 'Shredding');

  // Verify stats include total disposals
  const statsRes = await fileRoomService.getFileRoomStats();
  assert.equal(statsRes.success, true);
  assert.ok(statsRes.data.totalDisposals >= 1);
});
