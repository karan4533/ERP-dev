/**
 * tests/e2e/tier5-adversarial/tier5_m1_m2_hardening.test.js
 * Tier 5 White-Box Adversarial Hardening Suite: Features 1-21 (M1 & M2)
 *
 * Covers:
 * - VULN-ADV-01: CCTV Teachers Late Report 0-minute punctuality delay coercion
 * - VULN-ADV-02: Transport NOC duplicate certificate generation & certificateNo preservation
 * - VULN-ADV-03: Transport NOC string boolean clearance sanitization
 * - VULN-ADV-04: File Room repeat disposal of destroyed physical records
 * - VULN-ADV-05: File Room service-level Permanent Archival disposal authorization guard
 * - VULN-ADV-06: PRO ERP Handover status state-machine whitelist enforcement
 * - CCTV Multi-tier sequential approval bypass & clip delivery gating
 * - File Room concurrent checkout race condition & idempotency
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';
import { proService } from '../../../src/services/modules/proService.js';
import { cctvService } from '../../../src/services/modules/cctvService.js';
import { transportService } from '../../../src/services/modules/transportService.js';
import { CONFIDENTIALITY_TIERS } from '../../../src/services/models/index.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('T5-ADV-01: [CCTV] Teachers Late Report punctuality: lateMinutes = 0 is preserved and not coerced to 15', async () => {
  mockAdapter.resetDatabase();

  const onTimeReport = await cctvService.createTeachersLateReport({
    teacherName: 'Dr. V. Ramanathan',
    shiftInTime: '08:00 AM',
    actualArrivalTime: '08:00 AM',
    lateMinutes: 0,
    gateNo: 'Gate 1 (Main Entrance)',
  });

  assertSuccessEnvelope(onTimeReport);
  assert.equal(
    onTimeReport.data.lateMinutes,
    0,
    'lateMinutes of 0 must NOT be coerced to default 15 minutes delay'
  );
});

test('T5-ADV-02: [Transport NOC] Certificate issuance is idempotent and preserves original certificateNo on duplicate calls', async () => {
  mockAdapter.resetDatabase();

  const regRes = await transportService.createNocClearance({
    staffType: 'Driver',
    staffName: 'K. Balakrishnan',
    vehicleAssigned: 'BUS-12',
    clearances: {
      vehicleKeys: true,
      fuelCard: true,
      toolKit: true,
      firstAid: true,
      fastag: true,
      finesCleared: true,
      kmAuditVerified: true,
    },
  });
  const nocId = regRes.data.id;

  // First issuance
  const firstIssue = await transportService.issueNocCertificate(nocId, {
    issuedBy: 'A. David Raj (Transport Manager)',
    certificateNo: 'NOC/TRP/2026/777',
  });
  assertSuccessEnvelope(firstIssue);
  assert.equal(firstIssue.data.certificateNo, 'NOC/TRP/2026/777');

  // Second issuance call on same record
  const secondIssue = await transportService.issueNocCertificate(nocId, {
    issuedBy: 'A. David Raj (Transport Manager)',
  });
  assertSuccessEnvelope(secondIssue);
  assert.equal(
    secondIssue.data.certificateNo,
    'NOC/TRP/2026/777',
    'Repeated certificate issuance MUST preserve existing certificate number rather than generating a new one'
  );
});

test('T5-ADV-03: [Transport NOC] String "false" is correctly parsed as false and blocks clearance without waiver', async () => {
  mockAdapter.resetDatabase();

  const regRes = await transportService.createNocClearance({
    staffType: 'Conductor',
    staffName: 'P. Arulraj',
    vehicleAssigned: 'BUS-14',
    clearances: {
      vehicleKeys: true,
      fuelCard: 'false', // String "false"
      toolKit: true,
      firstAid: true,
      fastag: true,
      finesCleared: true,
      kmAuditVerified: true,
    },
  });
  assertSuccessEnvelope(regRes);
  assert.equal(regRes.data.clearances.fuelCard, false, 'String "false" must be coerced to boolean false');

  // Attempting to issue certificate without waiver must fail
  const issueRes = await transportService.issueNocCertificate(regRes.data.id);
  assertErrorEnvelope(issueRes, /clearance|checklist/i);
});

test('T5-ADV-04: [File Room] Attempting to re-dispose of an already destroyed file is rejected', async () => {
  mockAdapter.resetDatabase();

  const regRes = await fileRoomService.registerFile({
    fileRefNo: 'DISP/REPEAT/2026',
    fileName: 'Obsolete Accounting Slips (2012)',
    category: 'Financial Audit Registers, Ledgers & Vouchers',
    ownerDepartment: 'Finance',
    retentionRule: '3 Years Audit Clearance',
  });
  const fileId = regRes.data.id;

  // First disposal
  const disp1 = await fileRoomService.scheduleDisposal({
    fileId,
    disposalMethod: 'Shredding',
    boardResolutionNo: 'BOM-RES-2026/101',
    authorizedBy: 'Dr. V. Thirunavukkarasu (Managing Director)',
  });
  assertSuccessEnvelope(disp1);
  assert.equal(disp1.data.status, 'Completed');

  // Second disposal attempt on same file
  const disp2 = await fileRoomService.scheduleDisposal({
    fileId,
    disposalMethod: 'Incineration',
    boardResolutionNo: 'BOM-RES-2026/102',
    authorizedBy: 'Dr. V. Thirunavukkarasu (Managing Director)',
  });
  assertErrorEnvelope(
    disp2,
    /already disposed/i,
    'Scheduling disposal on an already destroyed file must be rejected'
  );
});

test('T5-ADV-05: [File Room] Permanent Archival records cannot be disposed without Managing Director authorization', async () => {
  mockAdapter.resetDatabase();

  const permFile = await fileRoomService.registerFile({
    fileRefNo: 'LEGAL/DEED/PERM/01',
    fileName: 'Institutional Land Ownership Title Deeds',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Executive Governance',
    retentionRule: 'Permanent Archival',
  });

  // Attempt disposal with unauthorized non-MD signatory
  const unauthDisp = await fileRoomService.scheduleDisposal({
    fileId: permFile.data.id,
    disposalMethod: 'Shredding',
    boardResolutionNo: 'BOM-RES-2026/999',
    authorizedBy: 'K. Rajendran (File Room Custodian)', // Non-MD signatory
  });
  assertErrorEnvelope(
    unauthDisp,
    /Permanent Archival.*Managing Director/i,
    'Permanent Archival file disposal must require Managing Director authorization'
  );
});

test('T5-ADV-06: [PRO] ERP Data Handover status update validates status whitelist', async () => {
  mockAdapter.resetDatabase();

  const createRes = await proService.createErpHandover({
    dataCategory: 'Affiliation & Sanctioned Sections',
    description: 'CBSE Extension order',
    handoverBy: 'Senior PRO',
    receivedBy: 'ERP Lead',
  });
  const hId = createRes.data.id;

  // Invalid status string
  const invalidUpdate = await proService.updateErpHandover(hId, {
    status: 'CORRUPTED_CUSTOM_STATUS',
  });
  assertErrorEnvelope(
    invalidUpdate,
    /Invalid handover status/i,
    'Arbitrary unvalidated status updates must be rejected'
  );
});

test('T5-ADV-07: [CCTV] Out-of-order sequential approval tier attempts are strictly rejected', async () => {
  mockAdapter.resetDatabase();

  const sensitiveReq = await cctvService.createFootageRequest({
    incidentDate: '2026-03-12',
    timeWindowStart: '10:00',
    timeWindowEnd: '10:30',
    cameraIds: ['CAM-01'],
    requesterId: 'EMP-TCH-001',
    requesterName: 'Teacher',
    justificationText: 'Student altercation inquiry',
    isSensitive: true,
  });
  const reqId = sensitiveReq.data.id;

  // Attack 1: Joint Director attempts approval before HOD
  const jdPremature = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
    reviewerName: 'Joint Director',
  });
  assertErrorEnvelope(jdPremature, /Department Head.*approval must be completed/i);

  // Attack 2: Managing Director attempts approval before HOD & JD
  const mdPremature = await cctvService.processApprovalTier(reqId, {
    role: 'MD',
    approved: true,
    reviewerName: 'Managing Director',
  });
  assertErrorEnvelope(mdPremature, /approval must be completed/i);

  // Attack 3: Delivering clip before approvals are complete
  const prematureDelivery = await cctvService.deliverClip(reqId, {});
  assertErrorEnvelope(prematureDelivery, /Cannot deliver clip until all required approval tiers/i);
});

test('T5-ADV-08: [File Room] Concurrent checkout requests on a single physical file allow exactly one borrower', async () => {
  mockAdapter.resetDatabase();

  const regFile = await fileRoomService.registerFile({
    fileRefNo: 'LEGAL/LAND/2026/01',
    fileName: 'Single Master Land Deed',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Administration',
    confidentiality: CONFIDENTIALITY_TIERS.CONFIDENTIAL,
  });
  const fileId = regFile.data.id;

  const [checkoutA, checkoutB] = await Promise.all([
    fileRoomService.requestCheckout({
      fileId,
      requestedById: 'STAFF-01',
      requestedByName: 'Officer A',
      purpose: 'Statutory verification',
    }),
    fileRoomService.requestCheckout({
      fileId,
      requestedById: 'STAFF-02',
      requestedByName: 'Officer B',
      purpose: 'Audit review',
    }),
  ]);

  const successCount = (checkoutA.success ? 1 : 0) + (checkoutB.success ? 1 : 0);
  const failCount = (!checkoutA.success ? 1 : 0) + (!checkoutB.success ? 1 : 0);

  assert.equal(successCount, 1, 'Exactly one concurrent checkout must succeed');
  assert.equal(failCount, 1, 'The competing concurrent checkout must be rejected as file is unavailable');
});
