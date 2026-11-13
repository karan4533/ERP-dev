/**
 * tests/e2e/tier1-feature-coverage/f18_fileRoomEnhancements.test.js
 * Tier 1 Feature Coverage: File Room Enhancements (R1 / Features 1-9)
 *
 * Covers:
 * - File Register date filter & accession date filtering
 * - File document upload handling & rename file action
 * - Exclusion of Student & Staff records from File Room views
 * - Returnable vs Non-Returnable status lifecycle
 * - Staff requester with Department Head approval workflow
 * - Acknowledgement file upload (receipt/mail copy)
 * - Date and department combined search
 * - Archival disposal workflow, board resolution & disposal certificate
 * - Activity audit logging and reports telemetry
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';
import { CONFIDENTIALITY_TIERS, FILE_STATUS } from '../../../src/services/models/index.js';
import { assertSuccessEnvelope, assertStorageLocationStructure } from '../harness/testHelpers.js';

test('F18-T1-01: File Register supports date range and accession date filtering', async () => {
  mockAdapter.resetDatabase();

  // 1. Register test files with distinct accession dates
  await fileRoomService.registerFile({
    fileRefNo: 'EST/BLDG/SANCTION-2026-A',
    fileName: 'Main Block DTCP Building Sanction Plan',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Estate & Infrastructure',
    accessionDate: '2026-03-01',
    storageLocation: { building: 'Admin', room: '101', rackNo: 'Rack A', shelfNo: 'Shelf 01' },
  });

  await fileRoomService.registerFile({
    fileRefNo: 'EST/BLDG/SANCTION-2026-B',
    fileName: 'Sports Complex DTCP Sanction Plan',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Estate & Infrastructure',
    accessionDate: '2026-03-15',
    storageLocation: { building: 'Admin', room: '101', rackNo: 'Rack A', shelfNo: 'Shelf 02' },
  });

  // 2. Filter by date window that includes only March 2026 files
  const dateRangeRes = await fileRoomService.getFiles({ fromDate: '2026-03-01', toDate: '2026-03-10' });
  assertSuccessEnvelope(dateRangeRes, 'getFiles with date range');
  const matchedFiles = dateRangeRes.data.filter((f) => f.fileRefNo === 'EST/BLDG/SANCTION-2026-A');
  assert.equal(matchedFiles.length, 1, 'Should find file A in range 2026-03-01 to 2026-03-10');
  const excludedFiles = dateRangeRes.data.filter((f) => f.fileRefNo === 'EST/BLDG/SANCTION-2026-B');
  assert.equal(excludedFiles.length, 0, 'File B (2026-03-15) must be excluded from this range');

  // 3. Exact accession date filter
  const exactDateRes = await fileRoomService.getFiles({ accessionDate: '2026-03-15' });
  assertSuccessEnvelope(exactDateRes, 'getFiles with exact accessionDate');
  assert.ok(exactDateRes.data.some((f) => f.fileRefNo === 'EST/BLDG/SANCTION-2026-B'));
});

test('F18-T1-02: File upload handling captures file metadata (fileName, fileSize, mimeType)', async () => {
  mockAdapter.resetDatabase();

  const filePayload = {
    fileRefNo: 'LEGAL/DEED/2026/01',
    fileName: 'Permanent Land Ownership Deed Document',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Legal Affairs',
    confidentiality: CONFIDENTIALITY_TIERS.DEPARTMENT_RESTRICTED,
    storageLocation: { building: 'Strong Room', room: 'Vault A', rackNo: 'Rack 1', shelfNo: 'Shelf 1' },
    attachment: {
      fileName: 'Land_Title_Deed_Scanned_Copy.pdf',
      fileSize: '4.8 MB',
      mimeType: 'application/pdf',
      uploadDate: '2026-03-12',
    },
  };

  const regRes = await fileRoomService.registerFile(filePayload);
  assertSuccessEnvelope(regRes, 'registerFile with attachment');
  assert.ok(regRes.data.id);
  assert.ok(regRes.data.attachment, 'Attachment must be persisted');
  assert.equal(regRes.data.attachment.fileName, 'Land_Title_Deed_Scanned_Copy.pdf');
  assert.equal(regRes.data.attachment.fileSize, '4.8 MB');
});

test('F18-T1-03: Rename file action updates file name across repository and logs audit activity', async () => {
  mockAdapter.resetDatabase();

  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'ACAD/AFFIL/2026/DRAFT',
    fileName: 'Draft Affiliation Inspection Notes',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Academics',
  });
  assertSuccessEnvelope(regRes);
  const fileId = regRes.data.id;

  // Execute rename
  const newTitle = 'Official CBSE Affiliation Extension Sanction 2026-27';
  const renameRes = await fileRoomService.renameFile(fileId, newTitle);
  assertSuccessEnvelope(renameRes, 'renameFile');
  assert.equal(renameRes.data.fileName, newTitle);

  // Verify file in repository reflects new name
  const getRes = await fileRoomService.getFileById(fileId);
  assertSuccessEnvelope(getRes);
  assert.equal(getRes.data.fileName, newTitle);

  // Verify audit activity was logged
  const actRes = await fileRoomService.getActivities({ search: newTitle });
  assertSuccessEnvelope(actRes);
  assert.ok(actRes.data.some((a) => a.action === 'FILE_RENAMED' && a.fileName === newTitle));
});

test('F18-T1-04: Hide or remove Student & Staff Record categories from File Room repository', async () => {
  mockAdapter.resetDatabase();

  const filesRes = await fileRoomService.getFiles({ excludeStudentStaff: true });
  assertSuccessEnvelope(filesRes);

  const forbiddenCategories = [
    'Student Academic & Cumulative Records',
    'Student Transfer Certificates (TC) & Clearance Stubs',
    'Staff Dossiers, Service Books & Police Verifications',
  ];

  for (const file of filesRes.data) {
    assert.equal(
      forbiddenCategories.includes(file.category),
      false,
      `File ${file.fileRefNo} with category "${file.category}" must be hidden from File Room views`
    );
  }
});

test('F18-T1-05: Returnable vs Non-Returnable flag and checkout status distinction', async () => {
  mockAdapter.resetDatabase();

  // Register a file designated for permanent dispatch
  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'DISP/CERT/2026/01',
    fileName: 'Original Transfer Clearance Deed Certificate',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Administration',
    isReturnable: 'Non-Returnable',
  });
  const fileId = regRes.data.id;

  // Checkout as Non-Returnable
  const checkoutRes = await fileRoomService.requestCheckout({
    fileId,
    requestedById: 'EMP-ADM-004',
    requestedByName: 'Admissions Officer',
    purpose: 'Permanent dispatch to Directorate of School Education',
    isReturnable: 'Non-Returnable',
    expectedReturnDate: '2026-03-01', // Should be cleared / nullified for non-returnable
    approvalRole: 'admin',
  });

  assertSuccessEnvelope(checkoutRes, 'requestCheckout non-returnable');
  assert.equal(checkoutRes.data.issueRecord.isReturnable, 'Non-Returnable');
  assert.equal(checkoutRes.data.issueRecord.status, 'Dispatched / Non-Returnable');
  assert.equal(checkoutRes.data.issueRecord.expectedReturnDate, null, 'Non-returnable files have no expected return date');

  // Verify overdue evaluator does not flag non-returnable file
  const overdueRes = await fileRoomService.checkOverdueFiles();
  assertSuccessEnvelope(overdueRes);
  const isOverdue = overdueRes.data.some((i) => i.id === checkoutRes.data.issueRecord.id);
  assert.equal(isOverdue, false, 'Non-returnable file must never be marked overdue');
});

test('F18-T1-06: Staff requester and Department Head approval workflow', async () => {
  mockAdapter.resetDatabase();

  // 1. Staff raises requisition routed to HOD
  const reqRes = await fileRoomService.createAccessRequest({
    fileRefNo: 'EST/BLDG/SANCTION-2026',
    fileName: 'Science Block DTCP Building Sanction Plan',
    requestedById: 'EMP-STF-014',
    requestedByName: 'K. Parthiban (Lab Assistant)',
    department: 'Estate & Infrastructure',
    departmentHeadApprover: 'Dr. M. Senthilkumar (HOD Facilities)',
    purpose: 'Auditor verification of plumbing blueprint',
  });

  assertSuccessEnvelope(reqRes, 'createAccessRequest');
  assert.ok(reqRes.data.id);
  assert.equal(reqRes.data.departmentHeadApprovalStatus, 'Pending Dept Head');
  assert.equal(reqRes.data.requestedByName, 'K. Parthiban (Lab Assistant)');

  // 2. Department Head approves request
  const approveRes = await fileRoomService.updateAccessRequest(reqRes.data.id, {
    status: 'Approved',
    departmentHeadApprovalStatus: 'Approved',
    approvedBy: 'Dr. M. Senthilkumar (HOD Facilities)',
    approvalTimestamp: new Date().toISOString(),
  });

  assertSuccessEnvelope(approveRes, 'updateAccessRequest');
  assert.equal(approveRes.data.departmentHeadApprovalStatus, 'Approved');
  assert.equal(approveRes.data.status, 'Approved');
});

test('F18-T1-07: Acknowledgement upload (mail copy / receipt stub) in File Request checkout', async () => {
  mockAdapter.resetDatabase();

  const filesRes = await fileRoomService.getFiles();
  const availableFile = filesRes.data.find(
    (f) => f.currentLocationStatus === FILE_STATUS.IN_ARCHIVE && f.confidentiality !== CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL
  );
  assert.ok(availableFile, 'Available file required');

  const ackFile = {
    fileName: 'CBSE_Director_Signed_Acknowledgment_Email.pdf',
    fileSize: '820 KB',
    mimeType: 'application/pdf',
    uploadedAt: new Date().toISOString(),
  };

  const checkoutRes = await fileRoomService.requestCheckout({
    fileId: availableFile.id,
    requestedById: 'EMP-PRO-001',
    requestedByName: 'Senior PRO',
    purpose: 'Submission to District Collectorate',
    approvalRole: 'admin',
    expectedReturnDate: '2026-04-20',
    acknowledgementAttachment: ackFile,
  });

  assertSuccessEnvelope(checkoutRes, 'requestCheckout with acknowledgement');
  assert.ok(checkoutRes.data.issueRecord.acknowledgementAttachment);
  assert.equal(
    checkoutRes.data.issueRecord.acknowledgementAttachment.fileName,
    'CBSE_Director_Signed_Acknowledgment_Email.pdf'
  );
});

test('F18-T1-08: Archival disposal workflow with board sign-off and certificate generation', async () => {
  mockAdapter.resetDatabase();

  const disposalPayload = {
    fileRefNo: 'FIN/VOUCH/2018/OLD-01',
    fileName: 'Financial Expense Vouchers FY 2017-2018',
    category: 'Financial Audit Registers, Ledgers & Vouchers',
    ownerDepartment: 'Finance',
    retentionRule: '7-Year Statutory Period Expired',
    disposalMethod: 'Shredding',
    scheduledDate: '2026-03-20',
    disposalDate: '2026-03-20',
    boardResolutionNo: 'BOM/RES/2026/89',
    authorizedBy: 'Dr. V. Thirunavukkarasu (Managing Director)',
    witnesses: 'K. Rajendran (Custodian), S. Soundararajan (Auditor)',
    remarks: 'Cross-cut shredding witnessed and certified.',
  };

  const scheduleRes = await fileRoomService.scheduleDisposal(disposalPayload);
  assertSuccessEnvelope(scheduleRes, 'scheduleDisposal');
  assert.ok(scheduleRes.data.id);
  assert.ok(scheduleRes.data.certificateNumber);
  assert.match(scheduleRes.data.certificateNumber, /^CERT-DISP-/);
  assert.equal(scheduleRes.data.status, 'Completed');
  assert.equal(scheduleRes.data.disposalMethod, 'Shredding');

  // Verify certificate retrieval
  const certRes = await fileRoomService.getDisposalCertificate(scheduleRes.data.id);
  assertSuccessEnvelope(certRes, 'getDisposalCertificate');
  assert.equal(certRes.data.boardResolutionNo, 'BOM/RES/2026/89');
  assert.equal(certRes.data.authorizedBy, 'Dr. V. Thirunavukkarasu (Managing Director)');
});

test('F18-T1-09: File Room Activity & Reports workspace telemetry and exports', async () => {
  mockAdapter.resetDatabase();

  // Log activity
  fileRoomService.logActivity({
    action: 'ANNUAL_AUDIT_VERIFIED',
    fileRefNo: 'AUDIT/2026/REP',
    fileName: 'Annual Archival Stock Verification Report',
    actor: 'Senior Archival Auditor',
    department: 'File Room Custody',
    details: 'Completed physical stock verification of all racks.',
  });

  const actRes = await fileRoomService.getActivities();
  assertSuccessEnvelope(actRes, 'getActivities');
  assert.ok(actRes.data.length >= 1, 'Activities list should not be empty');
  assert.ok(actRes.data.some((a) => a.action === 'ANNUAL_AUDIT_VERIFIED'));

  const statsRes = await fileRoomService.getFileRoomStats();
  assertSuccessEnvelope(statsRes, 'getFileRoomStats');
  assert.ok(typeof statsRes.data.totalFiles === 'number');
  assert.ok(typeof statsRes.data.checkedOutFiles === 'number');
  assert.ok(typeof statsRes.data.totalDisposals === 'number');
});
