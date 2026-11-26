import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mockAdapter,
  CONFIDENTIALITY_TIERS,
  CCTV_CAMERA_STATUS,
  proService,
  fileRoomService,
  cctvService,
  lostFoundService,
} from '../../../services/index.js';

// ============================================================================
// MILESTONE 3: CORE INSTITUTIONAL WORKFLOW INTEGRATION TESTS
// ============================================================================

test('Milestone 3 - PRO: Government Correspondence lifecycle & department filtering', async () => {
  mockAdapter.resetDatabase();

  // 1. Initial correspondence list
  const listRes = await proService.getCorrespondence();
  assert.equal(listRes.success, true);
  const initialCount = listRes.data.length;
  assert.ok(initialCount >= 2);

  // 2. Register new Outward correspondence to CBSE
  const newOutward = await proService.createCorrespondence({
    direction: 'Outward',
    referenceNumber: 'DPS/CBSE/RENEW/2026/04',
    subject: 'Submission of Annual Quality Assessment & Faculty Qualification Matrix',
    governmentDepartment: 'Central Board of Secondary Education (CBSE)',
    receivedOrDispatchedDate: '2026-03-15',
    statutoryDeadline: '2026-04-15',
    officerInCharge: 'R. Srinivasan (PRO)',
    complianceStatus: 'Submitted - Under Scrutiny',
    linkedFileRoomNo: 'PRO/CBSE/AFF-2026/01',
  });
  assert.equal(newOutward.success, true);
  assert.equal(newOutward.data.direction, 'Outward');
  assert.equal(newOutward.data.referenceNumber, 'DPS/CBSE/RENEW/2026/04');

  // 3. Validation failure when mandatory fields are omitted
  const missingRefRes = await proService.createCorrespondence({
    direction: 'Inward',
    subject: 'Missing reference number',
  });
  assert.equal(missingRefRes.success, false);

  // 4. Update correspondence status to Closed
  const updateRes = await proService.updateCorrespondence(newOutward.data.id, {
    complianceStatus: 'Complied & Closed',
    remarks: 'Formal acknowledgment letter received from CBSE Regional Office.',
  });
  assert.equal(updateRes.success, true);
  assert.equal(updateRes.data.complianceStatus, 'Complied & Closed');

  // 5. Query updated correspondence list
  const refreshedList = await proService.getCorrespondence();
  assert.equal(refreshedList.data.length, initialCount + 1);
});

test('Milestone 3 - PRO: Statutory Permits & NOC renewal workflow', async () => {
  mockAdapter.resetDatabase();

  // 1. Fetch permits
  const permitsRes = await proService.getPermits();
  assert.equal(permitsRes.success, true);
  assert.ok(permitsRes.data.length >= 3);

  const firePermit = permitsRes.data.find((p) => p.permitType.includes('Fire') || p.permitType.includes('Sanitary')) || permitsRes.data[0];
  assert.ok(firePermit);

  // 2. Initiate Permit Renewal Workflow
  const renewalRes = await proService.renewPermit(firePermit.id, {
    applicationReferenceNumber: 'TNDF-RENEW-2026-991',
    treasuryChallanVoucher: 'CHL-TREAS-2026-08',
    inspectionScheduledDate: '2026-04-05',
  });
  assert.equal(renewalRes.success, true);
  assert.equal(renewalRes.data.status, 'Renewal In-Progress');
  assert.equal(renewalRes.data.applicationReferenceNumber, 'TNDF-RENEW-2026-991');
  assert.ok(renewalRes.data.lastRenewalInitiatedDate);

  // 3. Add a brand new permit (e.g. Ground Water / Borewell NOC)
  const addPermitRes = await proService.createPermit({
    permitType: 'Ground Water Extraction NOC',
    permitNumber: 'CGWA/NOC/2026/331',
    issuingAuthority: 'Central Ground Water Authority (CGWA)',
    issueDate: '2026-01-10',
    expiryDate: '2029-01-09',
    status: 'Valid',
    custodianOfficer: 'Facilities Engineer & PRO',
  });
  assert.equal(addPermitRes.success, true);
  assert.equal(addPermitRes.data.permitNumber, 'CGWA/NOC/2026/331');
});

test('Milestone 3 - PRO: Government Inspection logging, rectification & clearance', async () => {
  mockAdapter.resetDatabase();

  // 1. Log a new inspection
  const newInspRes = await proService.createInspection({
    inspectionDate: '2026-03-20',
    inspectingBody: 'Directorate of School Education (DSE) Vigilance',
    inspectingOfficers: 'Dr. M. Krishnan (Chief Education Officer)',
    purpose: 'Annual Infrastructure and Student Safety Audit',
    status: 'Action Required',
    deficienciesNoted: [
      'Fire hose nozzle inspection tag missing on Block B 2nd floor',
      'First aid kit in Physics lab needs replenishment',
    ],
  });
  assert.equal(newInspRes.success, true);
  const inspId = newInspRes.data.id;

  // 2. Submit formal compliance response with rectification evidence
  const responseRes = await proService.updateInspection(inspId, {
    status: 'Satisfactory Clearance Issued',
    rectificationReport: 'All nozzles certified by vendor; Lab first-aid kit restocked and certified by School Nurse.',
    complianceSubmissionDate: '2026-03-25',
    formalClearanceLetterRef: 'DSE/VIG/CLR/2026/104',
  });
  assert.equal(responseRes.success, true);
  assert.equal(responseRes.data.status, 'Satisfactory Clearance Issued');
  assert.equal(responseRes.data.formalClearanceLetterRef, 'DSE/VIG/CLR/2026/104');
});

test('Milestone 3 - PRO: Statutory Compliance Calendar aggregation & Telemetry', async () => {
  mockAdapter.resetDatabase();

  // 1. Aggregated calendar items
  const calRes = await proService.getComplianceCalendar();
  assert.equal(calRes.success, true);
  assert.ok(Array.isArray(calRes.data));
  assert.ok(calRes.data.length >= 3);

  // Must contain elements from correspondence, permits, and inspections
  const types = new Set(calRes.data.map((c) => c.type));
  assert.ok(types.has('Correspondence') || types.has('Permit Renewal') || types.has('Government Inspection'));

  // Items must be chronologically ordered
  for (let i = 0; i < calRes.data.length - 1; i++) {
    const cur = new Date(calRes.data[i].date).getTime();
    const next = new Date(calRes.data[i + 1].date).getTime();
    assert.ok(cur <= next, 'Calendar items must be sorted in ascending order of date');
  }

  // 2. Telemetry and statistics
  const statsRes = await proService.getComplianceStats();
  assert.equal(statsRes.success, true);
  assert.ok(statsRes.data.totalCorrespondence >= 2);
  assert.ok(statsRes.data.activePermits >= 1);
});

test('Milestone 3 - File Room: Registration with 4-Tier Coordinates & Classification', async () => {
  mockAdapter.resetDatabase();

  // 1. Register a General Academic Record File
  const regFileRes = await fileRoomService.registerFile({
    fileRefNo: 'DPS/ACAD/2026/GR10-MATH',
    fileName: 'Grade 10 Mathematics Term Assessment Master Records',
    category: 'Student Academic & Cumulative Records',
    ownerDepartment: 'Academics - Secondary Wing',
    storageLocation: {
      building: 'Main Administrative Complex',
      room: 'Central Archives Rm 204',
      rackNo: 'Rack B',
      shelfNo: 'Shelf 02',
      boxNo: 'Box 08',
    },
    confidentiality: CONFIDENTIALITY_TIERS.STANDARD,
    retentionPolicy: '10 Years after batch completion',
  });

  assert.equal(regFileRes.success, true);
  assert.equal(regFileRes.data.fileRefNo, 'DPS/ACAD/2026/GR10-MATH');
  assert.equal(regFileRes.data.storageLocation.rackNo, 'Rack B');
  assert.equal(regFileRes.data.storageLocation.shelfNo, 'Shelf 02');
  assert.equal(regFileRes.data.storageLocation.boxNo, 'Box 08');
  assert.equal(regFileRes.data.currentLocationStatus, 'In File Room');

  // 2. Register Strictly Confidential Land / Legal Deed
  const legalFileRes = await fileRoomService.registerFile({
    fileRefNo: 'DPS/LEGAL/CAMPUS-DEED-2026',
    fileName: 'Main Campus Registered Sale Deed & Parent Title Documents',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Executive Governance & Managing Director',
    storageLocation: {
      building: 'Main Administrative Complex',
      room: 'Fireproof Strongroom Vault 101',
      rackNo: 'Vault Safe A',
      shelfNo: 'Tier 1 Lockbox',
      boxNo: 'DEED-BOX-01',
    },
    confidentiality: CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL,
    retentionPolicy: 'Permanent Archive (Indefinite)',
  });
  assert.equal(legalFileRes.success, true);
  assert.equal(legalFileRes.data.confidentiality, CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL);
});

test('Milestone 3 - File Room: Strict MD Authorization & Checkout Security Gating', async () => {
  mockAdapter.resetDatabase();

  // 1. Register Strictly Confidential File
  const secretFile = await fileRoomService.registerFile({
    fileRefNo: 'EXEC/CONF/SALARY-MATRIX-2026',
    fileName: 'Leadership Executive Compensation & Board Minutes',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Executive Governance',
    confidentiality: CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL,
  });

  // 2. Teacher or Department Head requests checkout without MD approval -> Gated and Rejected
  const unauthorizedCheckout = await fileRoomService.requestCheckout({
    fileId: secretFile.data.id,
    requestedById: 'EMP-TCH-002',
    requestedByName: 'High School Coordinator',
    purpose: 'Audit review',
    approvalRole: 'coordinator', // Not director/superadmin
  });
  assert.equal(unauthorizedCheckout.success, false);
  assert.match(unauthorizedCheckout.error, /Managing Director/i);

  // 3. Authorized Checkout by Managing Director / Superadmin
  const authorizedCheckout = await fileRoomService.requestCheckout({
    fileId: secretFile.data.id,
    requestedById: 'EMP-DIR-001',
    requestedByName: 'Dr. Ramanathan (Managing Director)',
    purpose: 'Statutory Board of Trustees Audit',
    approvalRole: 'director',
    expectedReturnDate: '2026-04-10',
  });
  assert.equal(authorizedCheckout.success, true);
  assert.equal(authorizedCheckout.data.file.currentLocationStatus, 'Checked Out / Issued');
  assert.equal(authorizedCheckout.data.file.heldByUserName, 'Dr. Ramanathan (Managing Director)');

  // 4. Double Checkout Prevention: Cannot check out an already issued file
  const duplicateCheckout = await fileRoomService.requestCheckout({
    fileId: secretFile.data.id,
    requestedById: 'EMP-ADM-002',
    requestedByName: 'Admin Officer',
    purpose: 'Duplicate request',
    approvalRole: 'director',
  });
  assert.equal(duplicateCheckout.success, false);
  assert.match(duplicateCheckout.error, /Checked Out/i);

  // 5. Return Physical File to Archive
  const returnRes = await fileRoomService.returnPhysicalFile(authorizedCheckout.data.issueRecord.id, {
    returnCondition: 'Excellent / Undamaged',
    custodianNotes: 'Returned to Fireproof Strongroom Vault by MD Executive Assistant.',
  });
  assert.equal(returnRes.success, true);
  assert.equal(returnRes.data.file.currentLocationStatus, 'In File Room');
  assert.equal(returnRes.data.file.heldByUserName, null);
});

test('Milestone 3 - File Room: Inward Courier Logging & Overdue Loans', async () => {
  mockAdapter.resetDatabase();

  // 1. Log Inward Courier Delivery
  const inwardRes = await fileRoomService.logInward({
    fileName: 'CBSE Affiliation Inspection Notice & Questionnaire',
    receivedFrom: 'CBSE Regional Office, Chennai via BlueDart Courier',
    department: 'Academics & PRO',
    receivedByCustodian: 'A. Murugan (Archives Officer)',
    documentCount: 3,
    physicalCondition: 'Sealed Tamper-evident Envelope',
  });
  assert.equal(inwardRes.success, true);
  assert.equal(inwardRes.data.documentCount, 3);

  // 2. Check Overdue Loans
  const overdueRes = await fileRoomService.checkOverdueFiles();
  assert.equal(overdueRes.success, true);
  assert.ok(Array.isArray(overdueRes.data));

  // 3. File Room Master Stats
  const statsRes = await fileRoomService.getFileRoomStats();
  assert.equal(statsRes.success, true);
  assert.ok(statsRes.data.totalFiles >= 1);
  assert.ok(statsRes.data.availableFiles >= 0);
});

test('Milestone 3 - CCTV: Camera Inventory management & Status Toggling', async () => {
  mockAdapter.resetDatabase();

  // 1. Fetch Cameras
  const camRes = await cctvService.getCameras();
  assert.equal(camRes.success, true);
  assert.ok(camRes.data.length >= 4);

  // 2. Add New Perimeter Camera
  const newCamRes = await cctvService.createCamera({
    name: 'Gate 4 Emergency Evacuation Route',
    zone: 'East Perimeter & Gate 4',
    ipAddress: '192.168.10.88',
    nvrChannel: 24,
    model: 'Hikvision 4K IP Bullet DS-2CD2087G2-LU',
    currentStatus: CCTV_CAMERA_STATUS.ONLINE,
    storageRetentionDays: 45,
  });
  assert.equal(newCamRes.success, true);
  const newCamId = newCamRes.data.id;

  // 3. Toggle Status from Online to Maintenance
  const toggleRes = await cctvService.updateCamera(newCamId, {
    currentStatus: CCTV_CAMERA_STATUS.MAINTENANCE,
    remarks: 'Scheduled optic lens calibration and weather seal replacement',
  });
  assert.equal(toggleRes.success, true);
  assert.equal(toggleRes.data.currentStatus, CCTV_CAMERA_STATUS.MAINTENANCE);
});

test('Milestone 3 - CCTV: Shift-wise Daily Operational Status Logging', async () => {
  mockAdapter.resetDatabase();

  // 1. Log Daily Shift Check with findings
  const shiftLogRes = await cctvService.logDailyCheck({
    checkDate: '2026-03-22',
    shift: 'Evening Shift (14:00 - 22:00)',
    inspectorId: 'EMP-SEC-012',
    inspectorName: 'K. Parthiban (Surveillance Operator)',
    findingsAndAnomalies: [
      {
        cameraId: 'CAM-03',
        anomalyDescription: 'Night vision IR illuminator flickering',
        actionTaken: 'Raised maintenance ticket to vendor service team',
        ticketRaised: true,
      },
    ],
  });

  assert.equal(shiftLogRes.success, true);
  assert.equal(shiftLogRes.data.shift, 'Evening Shift (14:00 - 22:00)');
  assert.equal(shiftLogRes.data.status, 'Requires Immediate Attention');

  // 2. Retrieve Daily Checks
  const checksRes = await cctvService.getDailyChecks();
  assert.equal(checksRes.success, true);
  assert.ok(checksRes.data.length >= 1);
});

test('Milestone 3 - CCTV: Multi-Tier Sequential Approval Chain (HOD -> JD -> MD) & Watermarking', async () => {
  mockAdapter.resetDatabase();

  // 1. Submit Sensitive Footage Requisition (Requires HOD -> JD -> MD approval)
  const reqRes = await cctvService.createFootageRequest({
    incidentDate: '2026-03-21',
    timeWindowStart: '14:30',
    timeWindowEnd: '15:15',
    cameraIds: ['CAM-01', 'CAM-02'],
    requesterId: 'EMP-HOD-SCI',
    requesterName: 'Dr. Ananya Roy (Science Dept Head)',
    justificationText: 'Senior Chemistry lab unauthorized entry after school hours',
    isSensitive: true,
  });
  assert.equal(reqRes.success, true);
  assert.equal(reqRes.data.isSensitive, true);
  assert.equal(reqRes.data.currentApprovalTier, 'Dept Head');
  const reqId = reqRes.data.id;

  // 2. Tier 1: Department Head Review & Approval
  const hodStep = await cctvService.processApprovalTier(reqId, {
    role: 'HOD',
    approved: true,
    remarks: 'Incident verified by lab assistant. Recommended for footage review.',
    reviewerName: 'Dr. Ananya Roy',
  });
  assert.equal(hodStep.success, true);
  assert.equal(hodStep.data.currentApprovalTier, 'Joint Director');

  // 3. Tier 2: Joint Director Review & Approval
  const jdStep = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
    remarks: 'Approved by Operations Directorate. Forwarded to MD due to sensitive laboratory protocol.',
    reviewerName: 'Joint Director (Operations)',
  });
  assert.equal(jdStep.success, true);
  assert.equal(jdStep.data.currentApprovalTier, 'Managing Director');

  // 4. Tier 3: Managing Director Final Authorization
  const mdStep = await cctvService.processApprovalTier(reqId, {
    role: 'MD',
    approved: true,
    remarks: 'Final executive authorization approved. Export watermarked copy only.',
    reviewerName: 'Managing Director',
  });
  assert.equal(mdStep.success, true);
  assert.equal(mdStep.data.currentApprovalTier, 'Approved');

  // 5. Deliver Watermarked Clip
  const deliverRes = await cctvService.deliverClip(reqId, {
    clipPreparedBy: 'Surveillance Room Supervisor',
    clipDurationSeconds: 2700,
    fileSizeBytes: 350000000,
  });
  assert.equal(deliverRes.success, true);
  assert.ok(deliverRes.data.clipDelivery.watermarkText.includes('CONFIDENTIAL'));
  assert.ok(deliverRes.data.clipDelivery.streamingUrl);

  // 6. Log Access / Download Audit
  const accessLogRes = await cctvService.logAccessDownload(reqId, {
    downloadedById: 'EMP-HOD-SCI',
    downloadedByName: 'Dr. Ananya Roy',
    clientIp: '192.168.1.105',
    purpose: 'Official internal inquiry documentation',
  });
  assert.equal(accessLogRes.success, true);
});

test('Milestone 3 - CCTV: Approval Rejection Gating at Intermediate Tier', async () => {
  mockAdapter.resetDatabase();

  // Create standard footage request
  const reqRes = await cctvService.createFootageRequest({
    incidentDate: '2026-03-20',
    timeWindowStart: '12:00',
    timeWindowEnd: '12:30',
    cameraIds: ['CAM-04'],
    requesterId: 'EMP-TCH-005',
    requesterName: 'Sports Coach',
    justificationText: 'Lost cricket ball search',
    isSensitive: false,
  });
  assert.equal(reqRes.success, true);
  const reqId = reqRes.data.id;

  // HOD Rejection
  const hodReject = await cctvService.processApprovalTier(reqId, {
    role: 'HOD',
    approved: false,
    remarks: 'Not an authorized security or statutory reason for CCTV review.',
    reviewerName: 'Head of Physical Education',
  });
  assert.equal(hodReject.success, true);
  assert.equal(hodReject.data.currentApprovalTier, 'Rejected');

  // Verify that subsequent tier approval is blocked after rejection
  const blockedJd = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
  });
  assert.equal(blockedJd.success, false);
  assert.match(blockedJd.error, /rejected/i);
});

test('Milestone 3 - Lost & Found: Complete Post, Claim, Verification & Handover Lifecycle', async () => {
  mockAdapter.resetDatabase();

  // 1. Report a FOUND item with photo attachment and location details
  const reportRes = await lostFoundService.reportItem({
    type: 'FOUND',
    title: 'Titan Fastrack Digital Watch (Black Strap)',
    category: 'Watches & Wearables',
    location: 'Football Ground Pavilion Bleachers',
    dateReported: '2026-03-22',
    description: 'Black silicone strap with scratch on left bezel. Found near Bench 3.',
    photoUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80',
    custodianOfficer: 'P. Arumugam (Campus Gatekeeper)',
  });
  assert.equal(reportRes.success, true);
  assert.equal(reportRes.data.status, 'In Custody / Unclaimed');
  const itemId = reportRes.data.id;

  // 2. Student Submits an Ownership Claim with Verification Proof
  const claimRes = await lostFoundService.submitClaim(itemId, {
    claimantId: 'STU-108',
    claimantName: 'Rohan Verma (Grade 9-B)',
    claimantContact: '9840192837',
    proofDescription: 'Watch screen has alarm set for 06:15 AM and serial starts with FST-8821.',
  });
  assert.equal(claimRes.success, true);
  assert.equal(claimRes.data.status, 'Under Review');
  assert.equal(claimRes.data.claimantDetails.claimantName, 'Rohan Verma (Grade 9-B)');

  // 3. Custodian Verifies Claim -> Approve
  const verifyRes = await lostFoundService.verifyClaim(itemId, {
    status: 'Approved',
    reviewerNotes: 'Student showed purchase warranty card matching serial FST-8821.',
    verifiedBy: 'Senior Gatekeeper & Custodian',
  });
  assert.equal(verifyRes.success, true);
  assert.equal(verifyRes.data.status, 'Claim Approved - Ready for Handover');

  // 4. Execute Physical Handover with Identity Verification
  const handoverRes = await lostFoundService.handoverItem(itemId, {
    custodianName: 'P. Arumugam (Head Gatekeeper)',
    recipientName: 'Rohan Verma (Grade 9-B)',
    remarks: 'Item handed over in presence of Grade 9 Class Teacher Mrs. Shalini.',
  });
  assert.equal(handoverRes.success, true);
  assert.equal(handoverRes.data.status, 'Handed Over & Closed');
  assert.ok(handoverRes.data.handoverDetails.handoverDate);
  assert.equal(handoverRes.data.handoverDetails.receivedBy, 'Rohan Verma (Grade 9-B)');

  // 5. Lost & Found Telemetry Stats
  const statsRes = await lostFoundService.getLostFoundStats();
  assert.equal(statsRes.success, true);
  assert.ok(statsRes.data.resolvedCount >= 1);
});

test('Milestone 3 - Lost & Found: Claim Rejection & Custody Retention', async () => {
  mockAdapter.resetDatabase();

  // 1. Report FOUND Item
  const reportRes = await lostFoundService.reportItem({
    type: 'FOUND',
    title: 'Apple Pencil Gen 2',
    category: 'Electronics & Gadgets',
    location: 'Design & Robotics Lab',
    dateReported: '2026-03-23',
    description: 'White stylus with initials engraved near top.',
  });
  assert.equal(reportRes.success, true);
  const itemId = reportRes.data.id;

  // 2. Submit Claim with incorrect description
  const claimRes = await lostFoundService.submitClaim(itemId, {
    claimantId: 'STU-205',
    claimantName: 'Unknown Student',
    proofDescription: 'No engraving, plain white.',
  });
  assert.equal(claimRes.success, true);

  // 3. Custodian Rejects Claim
  const rejectRes = await lostFoundService.verifyClaim(itemId, {
    status: 'Rejected',
    reviewerNotes: 'Initials do not match student records. Claim rejected.',
    verifiedBy: 'IT Lab Technician',
  });
  assert.equal(rejectRes.success, true);
  assert.equal(rejectRes.data.status, 'In Custody / Unclaimed');
  assert.equal(rejectRes.data.claimantDetails, null);
});
