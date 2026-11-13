import test from 'node:test';
import assert from 'node:assert/strict';

import {
  apiClient,
  mockAdapter,
  createSuccessResponse,
  createErrorResponse,
  isApiResponse,
  paginateResults,
  generateUniqueId,
  computeGrade,
  calculateGst,
  CONFIDENTIALITY_TIERS,
  proService,
  fileRoomService,
  cctvService,
  hostelService,
  feeService,
  academicService,
  purchaseService,
  inventoryService,
  lostFoundService,
  awardsService,
  transportService,
} from '../index.js';

test('1. Central API Client & Standard Response Envelope', async () => {
  const successRes = createSuccessResponse({ id: 'TEST-1' }, { total: 1, page: 1, pageSize: 10 });
  assert.equal(successRes.success, true);
  assert.equal(successRes.data.id, 'TEST-1');
  assert.equal(successRes.meta.total, 1);
  assert.equal(successRes.error, null);
  assert.equal(isApiResponse(successRes), true);

  const errorRes = createErrorResponse('Validation failed');
  assert.equal(errorRes.success, false);
  assert.equal(errorRes.data, null);
  assert.equal(errorRes.error, 'Validation failed');
  assert.equal(isApiResponse(errorRes), true);

  // Pagination helper test
  const list = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }];
  const paged = paginateResults(list, { page: 1, pageSize: 2 });
  assert.equal(paged.items.length, 2);
  assert.equal(paged.meta.total, 3);
  assert.equal(paged.meta.page, 1);

  // File Upload abstraction test
  const uploadRes = await apiClient.upload('/api/v1/upload', { name: 'permit.pdf', size: 50000 });
  assert.equal(uploadRes.success, true);
  assert.ok(uploadRes.data.fileUrl);

  // File Download abstraction test
  const downloadRes = await apiClient.download('/api/v1/download/permit.pdf');
  assert.equal(downloadRes.success, true);
  assert.ok(downloadRes.data.downloadUrl);
});

test('2. PRO Domain Service (Correspondence, Affiliations, Permits & Compliance Calendar)', async () => {
  // Reset database to ensure clean state
  mockAdapter.resetDatabase();

  // Test Correspondence Retrieval
  const corrRes = await proService.getCorrespondence();
  assert.equal(corrRes.success, true);
  assert.ok(Array.isArray(corrRes.data));
  assert.ok(corrRes.data.length >= 2);

  // Test Creating Inward Correspondence
  const newCorr = await proService.createCorrespondence({
    direction: 'Inward',
    referenceNumber: 'DSE/INSP/2026/099',
    subject: 'Special Inspection of Fire Safety NOC',
    governmentDepartment: 'Tamil Nadu Fire & Rescue Services',
    receivedOrDispatchedDate: '2026-03-12',
    statutoryDeadline: '2026-03-30',
  });
  assert.equal(newCorr.success, true);
  assert.equal(newCorr.data.referenceNumber, 'DSE/INSP/2026/099');

  // Test Missing Required Field Validation
  const invalidCorr = await proService.createCorrespondence({ direction: 'Inward' });
  assert.equal(invalidCorr.success, false);

  // Test Compliance Calendar Aggregation
  const calendarRes = await proService.getComplianceCalendar();
  assert.equal(calendarRes.success, true);
  assert.ok(calendarRes.data.length > 0);
  assert.ok(calendarRes.data.some((item) => item.type === 'Permit Renewal'));

  // Test Stats
  const statsRes = await proService.getComplianceStats();
  assert.equal(statsRes.success, true);
  assert.ok(statsRes.data.totalCorrespondence > 0);
});

test('3. File Room Service (Registration, 4-Tier Coordinates, Confidentiality & Overdue Check)', async () => {
  mockAdapter.resetDatabase();

  // 1. Direct File Registration with 4-Tier Storage Coordinates
  const newFileRes = await fileRoomService.registerFile({
    fileRefNo: 'TEST/ACAD/2026/01',
    fileName: 'Curriculum Framework Master File',
    category: 'Student Academic & Cumulative Records',
    ownerDepartment: 'Academics',
    storageLocation: {
      building: 'Administrative Block',
      room: 'Archive Room 102',
      rackNo: 'Rack C',
      shelfNo: 'Shelf 04',
      boxNo: 'Box 12',
    },
    confidentiality: CONFIDENTIALITY_TIERS.DEPARTMENT_RESTRICTED,
  });
  assert.equal(newFileRes.success, true);
  assert.equal(newFileRes.data.storageLocation.rackNo, 'Rack C');
  assert.equal(newFileRes.data.storageLocation.shelfNo, 'Shelf 04');

  // 2. Strictly Confidential Access Control (Requires MD Approval)
  const strictlyConfidentialFile = await fileRoomService.registerFile({
    fileRefNo: 'EXEC/DEED/TITLE-001',
    fileName: 'Campus Land Title Deeds Original Sanctions',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    ownerDepartment: 'Executive Governance',
    confidentiality: CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL,
  });

  // Attempt checkout without MD approval -> must fail
  const failedCheckout = await fileRoomService.requestCheckout({
    fileId: strictlyConfidentialFile.data.id,
    requestedById: 'EMP-TCH-001',
    requestedByName: 'Teacher',
    purpose: 'Reviewing deed',
    approvalRole: 'teacher', // Not director/superadmin
  });
  assert.equal(failedCheckout.success, false);
  assert.match(failedCheckout.error, /Managing Director/i);

  // Attempt checkout WITH MD approval -> must succeed
  const validCheckout = await fileRoomService.requestCheckout({
    fileId: strictlyConfidentialFile.data.id,
    requestedById: 'EMP-JD-001',
    requestedByName: 'Joint Director',
    purpose: 'Statutory government inspection submission',
    approvalRole: 'director',
    approvedBy: 'Managing Director',
  });
  assert.equal(validCheckout.success, true);
  assert.equal(validCheckout.data.file.currentLocationStatus, 'Checked Out / Issued');

  // 3. Prevent Double Checkout
  const doubleCheckout = await fileRoomService.requestCheckout({
    fileId: strictlyConfidentialFile.data.id,
    requestedById: 'EMP-HR-001',
    requestedByName: 'HR',
    purpose: 'Another review',
    approvalRole: 'director',
  });
  assert.equal(doubleCheckout.success, false);
  assert.match(doubleCheckout.error, /Checked Out/i);

  // 4. Return Physical File
  const returnRes = await fileRoomService.returnPhysicalFile(validCheckout.data.issueRecord.id, {
    returnCondition: 'Mint',
    notes: 'Restocked safely to fireproof vault.',
  });
  assert.equal(returnRes.success, true);
  assert.equal(returnRes.data.file.currentLocationStatus, 'In File Room');

  // 5. Overdue Files Detection
  const overdueRes = await fileRoomService.checkOverdueFiles();
  assert.equal(overdueRes.success, true);
  assert.ok(overdueRes.data.length >= 1);
});

test('4. CCTV Service (Cameras, Daily Status Checks & Multi-Tier Approvals)', async () => {
  mockAdapter.resetDatabase();

  // 1. Camera Inventory
  const camRes = await cctvService.getCameras();
  assert.equal(camRes.success, true);
  assert.ok(camRes.data.length >= 5);

  // 2. Daily Status Check Log
  const checkRes = await cctvService.logDailyCheck({
    checkDate: '2026-03-11',
    shift: 'Morning Shift (06:00 - 14:00)',
    inspectorId: 'EMP-CCTV-001',
    inspectorName: 'S. Selvakumar',
    findingsAndAnomalies: [
      { cameraId: 'CAM-02', anomalyDescription: 'Lens dirty', actionTaken: 'Cleaned', ticketRaised: false },
    ],
  });
  assert.equal(checkRes.success, true);

  // 3. Create Sensitive Footage Request (Requires MD Approval)
  const reqRes = await cctvService.createFootageRequest({
    incidentDate: '2026-03-10',
    timeWindowStart: '10:00',
    timeWindowEnd: '10:30',
    cameraIds: ['CAM-01'],
    requesterId: 'EMP-SEC-01',
    requesterName: 'Chief Security Officer',
    justificationText: 'Gate perimeter breach investigation',
    isSensitive: true,
  });
  assert.equal(reqRes.success, true);
  assert.equal(reqRes.data.isSensitive, true);
  assert.equal(reqRes.data.currentApprovalTier, 'Dept Head');

  const reqId = reqRes.data.id;

  // Step A: HOD Approval
  const hodApprove = await cctvService.processApprovalTier(reqId, {
    role: 'HOD',
    approved: true,
    remarks: 'Approved for campus security inquiry',
    reviewerName: 'Head of Security',
  });
  assert.equal(hodApprove.success, true);
  assert.equal(hodApprove.data.currentApprovalTier, 'Joint Director');

  // Step B: JD Approval (Because isSensitive is true, goes to MD)
  const jdApprove = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
    remarks: 'Approved by Operations',
    reviewerName: 'Joint Director',
  });
  assert.equal(jdApprove.success, true);
  assert.equal(jdApprove.data.currentApprovalTier, 'Managing Director');

  // Step C: MD Final Approval
  const mdApprove = await cctvService.processApprovalTier(reqId, {
    role: 'MD',
    approved: true,
    remarks: 'Final executive authorization granted',
    reviewerName: 'Managing Director',
  });
  assert.equal(mdApprove.success, true);
  assert.equal(mdApprove.data.currentApprovalTier, 'Approved');

  // Step D: Deliver Watermarked Clip
  const clipRes = await cctvService.deliverClip(reqId, {
    clipPreparedBy: 'Camera Room In-charge',
    clipDurationSeconds: 1800,
    fileSizeBytes: 250000000,
  });
  assert.equal(clipRes.success, true);
  assert.ok(clipRes.data.clipDelivery.streamingUrl);
  assert.match(clipRes.data.clipDelivery.watermarkText, /CONFIDENTIAL/);
});

test('5. Hostel Service & Automatic Fee Management Integration', async () => {
  mockAdapter.resetDatabase();

  // 1. Initial State: Check Fee Invoices Count
  const initialInvoicesRes = await feeService.getInvoices();
  const initialInvoiceCount = initialInvoicesRes.data.length;

  // 2. Assign Hostel Bed to Student STU-101
  const assignRes = await hostelService.assignHostelBed('STU-101', {
    studentName: 'Vikram Seth',
    gender: 'Male',
    grade: 'Grade 11',
    section: 'B',
    hostelBlockId: 'HOSTEL-BLK-A',
    hostelBlockName: 'Block A - Boys Senior Wing',
    roomNumber: 'A-201',
    bedNumber: 'B3', // Bed 3 was free in seed data
    feeAmount: 80000,
  });

  assert.equal(assignRes.success, true);
  assert.equal(assignRes.data.studentId, 'STU-101');
  assert.equal(assignRes.data.annualHostelFee, 80000);
  assert.ok(assignRes.data.linkedFeeInvoiceId);

  // 3. Verify that Hostel Fee Invoice was automatically inserted into Fee Management!
  const updatedInvoicesRes = await feeService.getInvoices();
  assert.equal(updatedInvoicesRes.data.length, initialInvoiceCount + 1);

  const hostelFeeInvoice = updatedInvoicesRes.data.find(
    (inv) => inv.id === assignRes.data.linkedFeeInvoiceId
  );
  assert.ok(hostelFeeInvoice);
  assert.equal(hostelFeeInvoice.studentId, 'STU-101');
  assert.equal(hostelFeeInvoice.totalAmount, 80000);
  assert.equal(hostelFeeInvoice.items[0].name, 'Hostel & Boarding Fee');

  // 4. Verify Double-Booking Prevention: Attempting to assign Bed B3 again must fail!
  const doubleAssignRes = await hostelService.assignHostelBed('STU-102', {
    studentName: 'Another Student',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B3', // Already assigned to STU-101
    feeAmount: 80000,
  });
  assert.equal(doubleAssignRes.success, false);
  assert.match(doubleAssignRes.error, /already occupied/i);
});

test('6. Fee Service (Invoicing, Partial Payments, Concessions & Refund Workflow)', async () => {
  mockAdapter.resetDatabase();

  // 1. Student Fee Ledger
  const ledgerRes = await feeService.getStudentLedger('STU-002');
  assert.equal(ledgerRes.success, true);
  assert.equal(ledgerRes.data.studentId, 'STU-002');
  assert.ok(ledgerRes.data.totalBalance > 0);

  // 2. Partial Payment Recording
  const invoiceId = ledgerRes.data.invoices[0].id;
  const payRes = await feeService.recordPayment({
    invoiceId,
    studentId: 'STU-002',
    amount: 5000,
    paymentMethod: 'UPI',
  });
  assert.equal(payRes.success, true);
  assert.equal(payRes.data.receipt.amount, 5000);
  assert.ok(payRes.data.invoice.paidAmount > 20000);

  // 3. Concession Application
  const concessionRes = await feeService.applyConcession({
    invoiceId,
    concessionAmount: 2000,
    concessionType: 'Sports Merit Concession',
  });
  assert.equal(concessionRes.success, true);
  assert.ok(concessionRes.data.concessionAmount >= 7000);

  // 4. Fee Refund Workflow (Request -> Approve -> Disburse)
  const refundReqRes = await feeService.requestRefund({
    studentId: 'STU-001',
    invoiceId: 'INV-2026-001',
    refundAmount: 5000,
    reason: 'Excess payment made during online transfer',
    beneficiaryBankDetails: {
      accountHolder: 'Rajesh Sharma',
      accountNumber: '9988112233',
      bankName: 'HDFC',
      ifscCode: 'HDFC0001',
    },
  });
  assert.equal(refundReqRes.success, true);
  assert.equal(refundReqRes.data.refundAmount, 5000);

  // Step B1: Accounts Verification
  const verifyRefundRes = await feeService.approveRefund(refundReqRes.data.id, {
    nextStatus: 'Pending JD Approval',
    approverRole: 'accounthead',
    approverName: 'Finance Head',
    remarks: 'Bank transaction verified',
  });
  assert.equal(verifyRefundRes.success, true);
  assert.equal(verifyRefundRes.data.status, 'Pending JD Approval');

  // Step B2: JD Approval
  const approveRefundRes = await feeService.approveRefund(refundReqRes.data.id, {
    nextStatus: 'Approved',
    approverRole: 'jointdirector',
    approverName: 'Joint Director',
    remarks: 'Sanctioned per institutional policy',
  });
  assert.equal(approveRefundRes.success, true);
  assert.equal(approveRefundRes.data.status, 'Approved');

  // Step C: Issue Refund Voucher & Disburse
  const disburseRes = await feeService.issueRefundVoucher(refundReqRes.data.id, {
    voucherNo: 'REF-VOUCH-DISB-01',
    disbursementMode: 'Direct Bank Transfer',
  });
  assert.equal(disburseRes.success, true);
  assert.equal(disburseRes.data.status, 'Disbursed');
});

test('7. Academic Service (Marks Entry, Grade Calculations, Report Card & Student Dossier)', async () => {
  mockAdapter.resetDatabase();

  // 1. Grade scale calculations
  assert.equal(computeGrade(95).grade, 'A1');
  assert.equal(computeGrade(85).grade, 'A2');
  assert.equal(computeGrade(75).grade, 'B1');
  assert.equal(computeGrade(65).grade, 'B2');
  assert.equal(computeGrade(55).grade, 'C1');
  assert.equal(computeGrade(45).grade, 'C2');
  assert.equal(computeGrade(35).grade, 'D');
  assert.equal(computeGrade(25).grade, 'E');

  // 2. Enter Examination Marks with Validation
  const markEntryRes = await academicService.enterMarks({
    examId: 'EXAM-2025-T2',
    studentId: 'STU-002',
    subjectId: 'SUB-MAT',
    subjectName: 'Mathematics',
    maxMarks: 100,
    theoryMarks: 75,
    practicalMarks: 20,
  });
  assert.equal(markEntryRes.success, true);
  assert.equal(markEntryRes.data.totalMarks, 95);
  assert.equal(markEntryRes.data.gradeAwarded, 'A1');

  // Total marks exceeding maxMarks -> must fail validation
  const invalidMarks = await academicService.enterMarks({
    examId: 'EXAM-2025-T2',
    studentId: 'STU-002',
    subjectId: 'SUB-MAT',
    maxMarks: 100,
    theoryMarks: 90,
    practicalMarks: 20, // 110 > 100
  });
  assert.equal(invalidMarks.success, false);
  assert.match(invalidMarks.error, /cannot exceed/i);

  // 3. Report Card Generation
  const reportCardRes = await academicService.getReportCard('STU-001', { examId: 'EXAM-2025-T2' });
  assert.equal(reportCardRes.success, true);
  assert.equal(reportCardRes.data.studentId, 'STU-001');
  assert.ok(reportCardRes.data.scholasticMarks.length >= 4);
  assert.equal(reportCardRes.data.summary.pass, true);
  assert.ok(reportCardRes.data.summary.percentage > 85);

  // 4. Comprehensive Student Dossier for Teachers
  const dossierRes = await academicService.getStudentDossier('STU-001');
  assert.equal(dossierRes.success, true);
  assert.equal(dossierRes.data.fullName, 'Aarav Sharma');
  assert.ok(dossierRes.data.parentDetails.fatherPhone);
  assert.ok(dossierRes.data.transportInfo.busNumber);
});

test('8. Purchase Service (Requisitions, 3-Vendor Quotes, GST Calculations & Finance Linkage)', async () => {
  mockAdapter.resetDatabase();

  // 1. GST calculation helper test
  const gst18 = calculateGst(10000, 18);
  assert.equal(gst18.baseAmount, 10000);
  assert.equal(gst18.gstAmount, 1800);
  assert.equal(gst18.totalAmount, 11800);

  // 2. Minimum 3 Comparative Quotes Enforced
  const invalidQuoteRes = await purchaseService.submitComparativeQuotes({
    requisitionId: 'REQ-STORE-2026-001',
    quotes: [
      { vendorId: 'V1', totalAmount: 10000 },
      { vendorId: 'V2', totalAmount: 11000 },
    ], // Only 2 quotes!
    selectedVendorId: 'V1',
    selectionJustification: 'Lowest bid',
  });
  assert.equal(invalidQuoteRes.success, false);
  assert.match(invalidQuoteRes.error, /minimum of 3/i);

  // Valid 3-vendor quotes submission
  const validQuoteRes = await purchaseService.submitComparativeQuotes({
    requisitionId: 'REQ-STORE-2026-001',
    quotes: [
      { vendorId: 'V1', totalAmount: 10000 },
      { vendorId: 'V2', totalAmount: 11000 },
      { vendorId: 'V3', totalAmount: 12000 },
    ],
    selectedVendorId: 'V1',
    selectionJustification: 'Lowest bid meeting technical specs',
  });
  assert.equal(validQuoteRes.success, true);

  // 3. Purchase Order Generation with GST
  const poRes = await purchaseService.createPurchaseOrder({
    vendorId: 'VEND-01',
    vendorName: 'Apex Scientific',
    lineItems: [
      { itemName: 'Microscopes Model X', quantity: 5, unitPrice: 10000, gstPercent: 18 },
    ],
  });
  assert.equal(poRes.success, true);
  assert.equal(poRes.data.subtotal, 50000);
  assert.equal(poRes.data.totalGst, 9000);
  assert.equal(poRes.data.grandTotal, 59000);

  // 4. PO Approval -> Automatically Generates Accounts Payable Liability Voucher in Finance!
  const initialLiabilities = await purchaseService.getFinanceLiabilities();
  const initialLiabCount = initialLiabilities.data.length;

  const approveRes = await purchaseService.approvePurchaseOrder(poRes.data.id, {
    approvedBy: 'Dr. K. S. Sundaram (Joint Director)',
  });
  assert.equal(approveRes.success, true);
  assert.equal(approveRes.data.purchaseOrder.status, 'Approved');
  assert.ok(approveRes.data.liabilityVoucher);
  assert.equal(approveRes.data.liabilityVoucher.amountDue, 59000);

  const updatedLiabilities = await purchaseService.getFinanceLiabilities();
  assert.equal(updatedLiabilities.data.length, initialLiabCount + 1);
});

test('9. Inventory Service (Catalog, Stock Movements & Issue/Return Tracking)', async () => {
  mockAdapter.resetDatabase();

  // 1. Catalog Item Creation
  const newItemRes = await inventoryService.createItem({
    name: 'Standard Basketball Size 6',
    category: 'Sports Equipment',
    currentStock: 20,
    minStockLevel: 5,
    unitOfMeasure: 'Pieces',
    unitPrice: 1200,
  });
  assert.equal(newItemRes.success, true);
  const itemId = newItemRes.data.id;

  // 2. Issue Returnable Equipment
  const issueRes = await inventoryService.issueItem({
    itemId,
    issuedToId: 'EMP-TCH-001',
    issuedToName: 'Teacher',
    department: 'Sports',
    quantity: 2,
    isReturnable: true,
  });
  assert.equal(issueRes.success, true);
  assert.equal(issueRes.data.status, 'Checked Out / Pending Return');

  // Verify stock decremented
  const itemAfterIssue = await inventoryService.getItemById(itemId);
  assert.equal(itemAfterIssue.data.currentStock, 18);

  // 3. Return Equipment -> Restocked
  const returnRes = await inventoryService.returnItem(issueRes.data.id, {
    returnCondition: 'Good',
  });
  assert.equal(returnRes.success, true);
  assert.equal(returnRes.data.status, 'Returned & Checked In');

  const itemAfterReturn = await inventoryService.getItemById(itemId);
  assert.equal(itemAfterReturn.data.currentStock, 20);
});

test('10. Lost & Found Service (Post Creation, Claims, Verification & Handover)', async () => {
  mockAdapter.resetDatabase();

  // 1. Report Found Item
  const reportRes = await lostFoundService.reportItem({
    type: 'FOUND',
    title: 'Scientific Calculator Casio fx-991EX',
    category: 'Electronics & Gadgets',
    location: 'Physics Lab Bench 4',
    dateReported: '2026-03-11',
    description: 'Black dual-power solar calculator with name sticker "S.K."',
  });
  assert.equal(reportRes.success, true);
  const itemId = reportRes.data.id;

  // 2. Submit Claim
  const claimRes = await lostFoundService.submitClaim(itemId, {
    claimantId: 'STU-001',
    claimantName: 'Aarav Sharma',
    proofDescription: 'Name sticker on back with battery cover tape.',
  });
  assert.equal(claimRes.success, true);
  assert.equal(claimRes.data.status, 'Under Review');

  // 3. Verify Claim
  const verifyRes = await lostFoundService.verifyClaim(itemId, {
    status: 'Approved',
    reviewerNotes: 'Ownership proof confirmed with class teacher.',
  });
  assert.equal(verifyRes.success, true);
  assert.equal(verifyRes.data.status, 'Claim Approved - Ready for Handover');

  // 4. Handover Item
  const handoverRes = await lostFoundService.handoverItem(itemId, {
    custodianName: 'Head Gatekeeper',
    remarks: 'Item handed over to student in presence of security officer.',
  });
  assert.equal(handoverRes.success, true);
  assert.equal(handoverRes.data.status, 'Handed Over & Closed');
});

test('11. Institutional Awards Service (Separate SOM & SOY Workflows with MD Sign-off)', async () => {
  mockAdapter.resetDatabase();

  // 1. Star of the Month (SOM) Nomination
  const somRes = await awardsService.nominateSom({
    month: 'March 2026',
    category: 'ACADEMIC',
    nomineeId: 'STU-002',
    nomineeName: 'Kavya Patel',
    grade: 'Grade 10',
    section: 'A',
    nominatedById: 'EMP-TCH-001',
    nominatedByName: 'Class Teacher',
    checklistScores: { punctuality: 5, hygiene: 5, mentoring: 4, homework: 5, ethics: 5 },
  });
  assert.equal(somRes.success, true);
  assert.equal(somRes.data.totalScore, 24);

  // Announce SOM Winner
  const announceRes = await awardsService.announceSomWinner(somRes.data.id);
  assert.equal(announceRes.success, true);
  assert.equal(announceRes.data.status, 'Announced Winner');

  // 2. Star of the Year (SOY) Eligibility Verification
  // Aarav Sharma (STU-001) has 2 monthly SOM wins in seed data!
  const eligibleCheck = await awardsService.verifySoyEligibility({
    nomineeId: 'STU-001',
    academicYear: '2025-2026',
    cumulativeGpa: 9.6,
    attendancePercentage: 96.5,
    infractions: 0,
  });
  assert.equal(eligibleCheck.success, true);
  assert.equal(eligibleCheck.data.isEligible, true);
  assert.equal(eligibleCheck.data.somWinsCount >= 2, true);

  // Student with < 2 wins should fail eligibility
  const ineligibleCheck = await awardsService.verifySoyEligibility({
    nomineeId: 'STU-999', // 0 wins
    academicYear: '2025-2026',
    cumulativeGpa: 9.0,
    attendancePercentage: 96.0,
    infractions: 0,
  });
  assert.equal(ineligibleCheck.data.isEligible, false);

  // 3. Nominate SOY
  const soyNomRes = await awardsService.nominateSoy({
    academicYear: '2025-2026',
    nomineeId: 'STU-001',
    nomineeName: 'Aarav Sharma',
  });
  assert.equal(soyNomRes.success, true);

  // 3b. Committee Evaluation
  const evalRes = await awardsService.evaluateSoyCommittee(soyNomRes.data.id, {
    score: 95,
    remarks: 'Unanimous committee recommendation',
    recommendedBy: 'Selection Committee',
  });
  assert.equal(evalRes.success, true);
  assert.equal(evalRes.data.status, 'Pending MD Final Sign-Off');

  // 4. Executive MD Final Sign-Off
  const mdSignoff = await awardsService.approveSoyByMd(soyNomRes.data.id, {
    approved: true,
    mdRemarks: 'Sanctioned for Annual Rolling Trophy',
    citationText: 'For exemplary academic dedication and leadership.',
  });
  assert.equal(mdSignoff.success, true);
  assert.equal(mdSignoff.data.status, 'Approved & Selected');
  assert.equal(mdSignoff.data.managingDirectorApproval.approved, true);
});

test('12. Transport Service (Vehicles, Routes, Boarding Status & Fee Sync)', async () => {
  mockAdapter.resetDatabase();

  // 1. Vehicle fleet
  const vehRes = await transportService.getVehicles();
  assert.equal(vehRes.success, true);
  assert.ok(vehRes.data.length >= 1);

  // 2. Routes & Stops
  const routesRes = await transportService.getRoutes();
  assert.equal(routesRes.success, true);
  assert.ok(routesRes.data[0].stops.length >= 3);

  // 3. Passenger Manifest with Boarding Status & Fee Indicator
  const manifestRes = await transportService.getPassengerManifest();
  assert.equal(manifestRes.success, true);
  assert.ok(manifestRes.data.length >= 2);

  // Check student with pending fee has fee status indicated
  const pendingStudent = manifestRes.data.find((s) => s.studentId === 'STU-002');
  assert.ok(pendingStudent);
  assert.equal(pendingStudent.feeStatus, 'Pending');

  // 4. Update Boarding Status
  const updateRes = await transportService.updateBoardingStatus({
    studentId: 'STU-002',
    boardingStatus: 'Boarded',
  });
  assert.equal(updateRes.success, true);
  assert.equal(updateRes.data.boardingStatus, 'Boarded');

  // Stats
  const statsRes = await transportService.getTransportStats();
  assert.equal(statsRes.success, true);
  assert.ok(statsRes.data.totalVehicles >= 1);
});

test('13. VULN-M1-01 AbortSignal Handling in Central API Client', async () => {
  // 1. Immediate abort with pre-aborted controller
  const preAbortedCtrl = new AbortController();
  preAbortedCtrl.abort('User navigated away');
  const immAbortRes = await apiClient.get('/api/v1/pro/correspondence', {
    delayMs: 50,
    signal: preAbortedCtrl.signal,
  });
  assert.equal(immAbortRes.success, false);
  assert.equal(immAbortRes.data, null);
  assert.match(immAbortRes.error, /aborted|User navigated away/i);

  // 2. Abort triggered during simulated network delay
  const delayCtrl = new AbortController();
  const delayPromise = apiClient.get('/api/v1/pro/correspondence', {
    delayMs: 100,
    signal: delayCtrl.signal,
  });
  setTimeout(() => delayCtrl.abort('Timeout reached'), 15);
  const delayRes = await delayPromise;
  assert.equal(delayRes.success, false);
  assert.match(delayRes.error, /aborted|Timeout reached/i);

  // 3. Normal request without abort resolves cleanly
  const normalCtrl = new AbortController();
  const normalRes = await apiClient.get('/api/v1/pro/correspondence', {
    delayMs: 10,
    signal: normalCtrl.signal,
  });
  assert.equal(normalRes.success, true);
  assert.ok(Array.isArray(normalRes.data));

  // 4. File upload with aborted signal
  const uploadCtrl = new AbortController();
  uploadCtrl.abort('Upload cancelled');
  const uploadRes = await apiClient.upload('/api/v1/upload', { name: 'file.pdf' }, {
    signal: uploadCtrl.signal,
  });
  assert.equal(uploadRes.success, false);
});

test('14. VULN-M1-02 Collision-Proof Primary Key ID Generation Under Concurrency', async () => {
  // 1. Direct generator sanity check
  const id1 = generateUniqueId('TEST');
  const id2 = generateUniqueId('TEST');
  assert.ok(id1.startsWith('TEST-'));
  assert.notEqual(id1, id2);

  // 2. Tight-loop uniqueness across 500 synchronous invocations
  const set = new Set();
  for (let i = 0; i < 500; i++) {
    set.add(generateUniqueId('LOOP'));
  }
  assert.equal(set.size, 500, 'All 500 synchronously generated IDs must be unique');

  // 3. Concurrent POST requests without explicit IDs through mockAdapter
  const writes = await Promise.all(
    Array.from({ length: 30 }, (_, idx) =>
      apiClient.post('/api/v1/inventory/catalog', {
        name: `Concurrent Item ${idx}`,
        category: 'Test',
        currentStock: 10,
        unitOfMeasure: 'pcs',
      })
    )
  );

  const writeIds = new Set(writes.map((w) => w.data.id));
  assert.equal(writeIds.size, 30, 'All 30 concurrently created records must possess unique IDs');
});

test('15. VULN-M1-03 Purchase Order Approval Idempotency & Financial Liability Deduplication', async () => {
  mockAdapter.resetDatabase();

  // Create a purchase order
  const createRes = await purchaseService.createPurchaseOrder({
    vendorId: 'VEND-001',
    vendorName: 'Apex Scientific Labs Ltd.',
    lineItems: [
      { itemName: 'Borosilicate Beakers 250ml', quantity: 20, unitPrice: 150, gstRatePercent: 18 },
    ],
  });
  assert.equal(createRes.success, true);
  const poId = createRes.data.id;

  // Retrieve baseline liabilities count
  const initialLiabilities = (await purchaseService.getFinanceLiabilities()).data.length;

  // Execute two concurrent approvals for the same PO
  const [app1, app2] = await Promise.all([
    purchaseService.approvePurchaseOrder(poId, { approvedBy: 'Finance Approver 1' }),
    purchaseService.approvePurchaseOrder(poId, { approvedBy: 'Finance Approver 2' }),
  ]);

  assert.equal(app1.success, true);
  assert.equal(app2.success, true);

  // One of them was the initial approval, the other received idempotent alreadyApproved: true
  const hasAlreadyApproved = app1.data.alreadyApproved || app2.data.alreadyApproved;
  assert.equal(hasAlreadyApproved, true);

  // Subsequent third approval must also be idempotent
  const app3 = await purchaseService.approvePurchaseOrder(poId);
  assert.equal(app3.success, true);
  assert.equal(app3.data.alreadyApproved, true);

  // Exactly ONE new liability voucher created (initialLiabilities + 1)
  const finalLiabilities = (await purchaseService.getFinanceLiabilities()).data;
  assert.equal(finalLiabilities.length, initialLiabilities + 1);
  const matchingVouchers = finalLiabilities.filter((v) => v.poId === poId);
  assert.equal(matchingVouchers.length, 1);
});

test('16. VULN-M1-04 Hostel Re-Enrolment Idempotency & Active Occupancy Conflict Check', async () => {
  mockAdapter.resetDatabase();

  const studentId = 'STU-TST-888';
  const allocData = {
    studentName: 'Rohan Mehra',
    hostelBlockId: 'BLK-A',
    hostelBlockName: 'Block A (Junior Boys)',
    roomNumber: 'A-201',
    bedNumber: 'B3',
    feeAmount: 85000,
  };

  // 1. Initial valid enrolment
  const enr1 = await hostelService.assignHostelBed(studentId, allocData);
  assert.equal(enr1.success, true);
  assert.equal(enr1.data.status, 'Active');
  const originalInvoiceId = enr1.data.linkedFeeInvoiceId;

  // Count invoices in fee service
  const feeRes1 = await feeService.getInvoices();
  const studentInvoices1 = feeRes1.data.filter((i) => i.studentId === studentId);
  assert.equal(studentInvoices1.length, 1);

  // 2. Re-enrol same student on SAME bed -> must return existing enrolment without duplicate invoices
  const enr2 = await hostelService.assignHostelBed(studentId, allocData);
  assert.equal(enr2.success, true);
  assert.equal(enr2.data.id, enr1.data.id);
  assert.equal(enr2.data.linkedFeeInvoiceId, originalInvoiceId);

  const feeRes2 = await feeService.getInvoices();
  const studentInvoices2 = feeRes2.data.filter((i) => i.studentId === studentId);
  assert.equal(studentInvoices2.length, 1, 'Re-enrolment must NOT create duplicate fee invoices');

  // 3. Attempt to enrol the same student (while active in Bed B3) in a DIFFERENT bed (Bed B4)
  const conflictEnrol = await hostelService.assignHostelBed(studentId, {
    ...allocData,
    bedNumber: 'B4',
  });
  assert.equal(conflictEnrol.success, false);
  assert.match(conflictEnrol.error, /already actively enrolled in Hostel BLK-A, Room A-201, Bed B3/);

  // 4. Vacate student from Bed B3
  const vacateRes = await hostelService.vacateBed(enr1.data.id, { remarks: 'Completed academic term' });
  assert.equal(vacateRes.success, true);
  assert.equal(vacateRes.data.status, 'Vacated');

  // 5. Now allocating to Bed B4 must succeed since student is no longer active
  const enr3 = await hostelService.assignHostelBed(studentId, {
    ...allocData,
    bedNumber: 'B4',
  });
  assert.equal(enr3.success, true);
  assert.equal(enr3.data.bedNumber, 'B4');
});

test('17. VULN-M1-05 CCTV Footage Multi-Tier Sequential Approval & Rejection Gating', async () => {
  mockAdapter.resetDatabase();

  // Create a footage request
  const createRes = await cctvService.createFootageRequest({
    cameraIds: ['CAM-01'],
    incidentDate: '2026-03-12',
    timeWindowStart: '10:00',
    timeWindowEnd: '10:30',
    requesterId: 'EMP-ADM-001',
    requesterName: 'P. Arumugam',
    department: 'Dining & Facilities',
    reasonCategory: 'Property Damage',
    justificationText: 'Gate impact footage requested for insurance claim.',
    isSensitive: false,
  });
  assert.equal(createRes.success, true);
  const reqId = createRes.data.id;
  assert.equal(createRes.data.currentApprovalTier, 'Dept Head');

  // 1. Rejection of invalid role
  const invalidRoleRes = await cctvService.processApprovalTier(reqId, {
    role: 'UnauthorizedObserver',
    approved: true,
  });
  assert.equal(invalidRoleRes.success, false);
  assert.match(invalidRoleRes.error, /Invalid approval tier role/);

  // 2. Out-of-order approval gating: JD cannot approve before HOD
  const outOfOrderJd = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
  });
  assert.equal(outOfOrderJd.success, false);
  assert.match(outOfOrderJd.error, /Department Head \(HOD\) approval must be completed before Joint Director/);

  // 3. Out-of-order approval gating: MD cannot approve before HOD and JD
  const outOfOrderMd = await cctvService.processApprovalTier(reqId, {
    role: 'MD',
    approved: true,
  });
  assert.equal(outOfOrderMd.success, false);
  assert.match(outOfOrderMd.error, /Department Head \(HOD\) approval must be completed before Managing Director/);

  // 4. Test Rejection flow: HOD rejects
  const hodReject = await cctvService.processApprovalTier(reqId, {
    role: 'HOD',
    approved: false,
    remarks: 'Request unjustified',
  });
  assert.equal(hodReject.success, true);
  assert.equal(hodReject.data.currentApprovalTier, 'Rejected');

  // 5. Subsequent approvals must be blocked because tier is Rejected
  const jdAfterReject = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
  });
  assert.equal(jdAfterReject.success, false);
  assert.match(jdAfterReject.error, /Request has been rejected and cannot receive further tier approvals/);

  // 6. Explicit reopen resets request to Dept Head tier
  const reopenRes = await cctvService.processApprovalTier(reqId, {
    role: 'HOD',
    approved: true,
    reopen: true,
    remarks: 'Reopened upon submission of police report',
  });
  assert.equal(reopenRes.success, true);
  assert.equal(reopenRes.data.currentApprovalTier, 'Joint Director');

  // 7. Complete JD approval for non-sensitive request -> transitions to Approved
  const jdApprove = await cctvService.processApprovalTier(reqId, {
    role: 'JD',
    approved: true,
    reviewerName: 'Dr. K. S. Sundaram (Joint Director)',
  });
  assert.equal(jdApprove.success, true);
  assert.equal(jdApprove.data.currentApprovalTier, 'Approved');

  // 8. Clip delivery is now permitted
  const deliverRes = await cctvService.deliverClip(reqId, {
    retrievalOperatorName: 'CCTV Custodian',
  });
  assert.equal(deliverRes.success, true);
  assert.ok(deliverRes.data.clipDelivery.streamingUrl);
});

test('18. Academic Grade Calculation & CBSE Percentage Rounding', async () => {
  mockAdapter.resetDatabase();

  // 1. Direct computeGrade rounding tests across float boundaries
  const g90_9 = computeGrade(90.9);
  assert.equal(g90_9.grade, 'A1');
  assert.equal(g90_9.gradePoint, 10.0);

  const g90_5 = computeGrade(90.5);
  assert.equal(g90_5.grade, 'A1');
  assert.equal(g90_5.gradePoint, 10.0);

  const g90_4 = computeGrade(90.4);
  assert.equal(g90_4.grade, 'A2');
  assert.equal(g90_4.gradePoint, 9.0);

  // 2. computeGrade with 2-argument signature (totalMarks, maxMarks)
  const gScaled = computeGrade(45.5, 50); // 91%
  assert.equal(gScaled.grade, 'A1');

  const gScaledPass = computeGrade(16.5, 50); // 33%
  assert.equal(gScaledPass.grade, 'D');

  const gScaledFail = computeGrade(16.0, 50); // 32%
  assert.equal(gScaledFail.grade, 'E');

  // 3. academicService calculateGrade wrapper tests
  const calc1 = academicService.calculateGrade(90.9);
  assert.equal(calc1.grade, 'A1');

  const calc2 = academicService.calculateGrade(90.9, 100);
  assert.equal(calc2.grade, 'A1');

  // 4. Marks entry with float percentage rounds to correct CBSE band
  const markRes = await academicService.enterMarks({
    examId: 'EXAM-2026-T1',
    studentId: 'STU-001',
    subjectId: 'SUB-PHYS',
    maxMarks: 100,
    theoryMarks: 60.9,
    practicalMarks: 30.0, // total = 90.9
  });
  assert.equal(markRes.success, true);
  assert.equal(markRes.data.totalMarks, 90.9);
  assert.equal(markRes.data.gradeAwarded, 'A1');
  assert.equal(markRes.data.gradePoint, 10.0);

  // 5. Totals calculation with float percentage
  const totals = academicService.calculateStudentTotals([
    { totalMarks: 45.5, maxMarks: 50 },
    { totalMarks: 45.4, maxMarks: 50 },
  ]); // 90.9 / 100 -> 90.9%
  assert.equal(totals.overallGrade, 'A1');
  assert.equal(totals.gradePoint, 10.0);
  assert.equal(totals.pass, true);
});
