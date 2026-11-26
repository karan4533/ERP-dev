import test from 'node:test';
import assert from 'node:assert/strict';
import { academicService } from '../../../../services/modules/academicService.js';
import { hostelService } from '../../../../services/modules/hostelService.js';
import { purchaseService } from '../../../../services/modules/purchaseService.js';
import { awardsService } from '../../../../services/modules/awardsService.js';
import { inventoryService } from '../../../../services/modules/inventoryService.js';
import { feeService } from '../../../../services/modules/feeService.js';

test('M4 - 1. Academic marks entry calculates percentage, CBSE grade, and syncs student results', async () => {
  const marksPayload = {
    studentId: 'STU-M4-001',
    studentName: 'Aarav Patel',
    grade: 'Grade 10',
    section: 'A',
    examId: 'EXAM-TERM1-2026',
    subjectId: 'SUB-MATH',
    subjectName: 'Mathematics',
    theoryMarks: 92,
    practicalMarks: 0,
    maxMarks: 100,
    academicYear: '2025-2026',
  };

  const res = await academicService.enterMarks(marksPayload);
  assert.equal(res.success, true);
  assert.ok(res.data);
  assert.equal(res.data.theoryMarks, 92);
  assert.equal(res.data.maxMarks, 100);
  assert.equal(res.data.totalMarks, 92);
  assert.equal(res.data.percentage, 92);
  assert.equal(res.data.gradeAwarded, 'A1'); // CBSE scale 91-100 = A1

  // Verify retrieval of marks for the student
  const fetchRes = await academicService.getMarks({ studentId: 'STU-M4-001' });
  assert.equal(fetchRes.success, true);
  assert.ok(Array.isArray(fetchRes.data));
  const record = fetchRes.data.find((m) => m.studentId === 'STU-M4-001' && m.subjectId === 'SUB-MATH');
  assert.ok(record);
  assert.equal(record.totalMarks, 92);
  assert.equal(record.gradeAwarded, 'A1');
});

test('M4 - 2. Academic marks validation rejects missing required fields and out-of-range scores', async () => {
  const invalidPayload = {
    studentId: 'STU-M4-002',
    // missing examId, subjectId, maxMarks, theoryMarks
  };

  const res = await academicService.enterMarks(invalidPayload);
  assert.equal(res.success, false);
  assert.ok(res.error);

  const overflowPayload = {
    studentId: 'STU-M4-002',
    examId: 'EXAM-TERM1-2026',
    subjectId: 'SUB-SCI',
    theoryMarks: 105,
    practicalMarks: 0,
    maxMarks: 100,
  };
  const overflowRes = await academicService.enterMarks(overflowPayload);
  assert.equal(overflowRes.success, false);
});

test('M4 - 3. Administrative Hostel Bed Allocation updates occupancy and generates fee invoice', async () => {
  // Query occupancy stats
  const statsRes = await hostelService.getHostelOccupancyStats();
  assert.equal(statsRes.success, true);
  assert.ok(statsRes.data.totalBeds > 0);

  // Find an available room and bed from room inventory
  const roomsRes = await hostelService.getRooms();
  assert.equal(roomsRes.success, true);
  assert.ok(Array.isArray(roomsRes.data));

  let targetRoom = null;
  let targetBed = null;
  for (const r of roomsRes.data) {
    const freeBed = r.beds?.find((b) => !b.occupied);
    if (freeBed) {
      targetRoom = r;
      targetBed = freeBed;
      break;
    }
  }
  assert.ok(targetRoom && targetBed, 'Must have at least one free bed in test fixture');

  const studentId = 'STU-M4-HOSTEL-01';
  const allocPayload = {
    hostelBlockId: targetRoom.blockId,
    roomNumber: targetRoom.roomNumber,
    bedNumber: targetBed.bedNumber,
    studentName: 'Ishaan Verma',
    feeAmount: 48000,
    annualHostelFee: 48000,
    checkInDate: '2026-06-01',
    term: 'T1 (Summer)',
    academicYear: '2025-2026',
  };

  const assignRes = await hostelService.assignHostelBed(studentId, allocPayload);
  assert.equal(assignRes.success, true);
  assert.ok(assignRes.data);
  assert.equal(assignRes.data.studentId, studentId);
  const enrolmentId = assignRes.data.id;

  // Cross-module verification: check invoice was generated in fee system
  const invRes = await feeService.getInvoices({ studentId });
  assert.equal(invRes.success, true);
  const hostelInv = invRes.data.find(
    (inv) => inv.studentId === studentId && (
      inv.items?.some((i) => i.feeHeadId === 'FH-HSTL' || i.name?.includes('Hostel'))
      || inv.feeCategory === 'Hostel'
      || inv.feeHead === 'FH-HSTL'
    )
  );
  assert.ok(hostelInv, 'Hostel invoice must be generated in fee ledger');
  assert.equal(hostelInv.totalAmount, 48000);

  // Conflict test: cannot assign already occupied bed
  const duplicateRes = await hostelService.assignHostelBed('STU-M4-HOSTEL-02', allocPayload);
  assert.equal(duplicateRes.success, false, 'Occupied bed assignment must be rejected');

  // Vacate bed workflow
  const vacateRes = await hostelService.vacateBed(enrolmentId, { remarks: 'Completed academic year' });
  assert.equal(vacateRes.success, true);
  assert.equal(vacateRes.data.status, 'Vacated');
});

test('M4 - 4. Purchase Order Generation & Approval generates Finance AP Liability Voucher', async () => {
  const poData = {
    vendorId: 'VEND-M4-001',
    vendorName: 'Apex School Supplies Pvt Ltd',
    lineItems: [
      { itemId: 'SKU-PAP-01', name: 'A4 Copier Paper Ream', quantity: 50, unitPrice: 240, gstPercent: 18 },
      { itemId: 'SKU-PEN-01', name: 'Whiteboard Marker Pack', quantity: 20, unitPrice: 150, gstPercent: 18 },
    ],
    billingDepartment: 'Examination Cell',
    deliveryTerms: 'Immediate',
    paymentTerms: 'Net 30',
  };

  const createRes = await purchaseService.createPurchaseOrder(poData);
  assert.equal(createRes.success, true);
  assert.ok(createRes.data);
  const createdPO = createRes.data;
  assert.ok(createdPO.id);
  assert.ok(createdPO.poNumber);
  assert.ok(createdPO.grandTotal > 0);

  // Approve PO with approver credentials
  const approveRes = await purchaseService.approvePurchaseOrder(createdPO.id, {
    approvedBy: 'Admin Head',
    approvalNotes: 'Approved for annual examination materials',
  });
  assert.equal(approveRes.success, true);
  assert.ok(approveRes.data.purchaseOrder);
  assert.equal(approveRes.data.purchaseOrder.status, 'Approved');

  // Verify Accounts Payable liability voucher was generated
  const liabilitiesRes = await purchaseService.getFinanceLiabilities();
  assert.equal(liabilitiesRes.success, true);
  assert.ok(Array.isArray(liabilitiesRes.data));

  const liabilityVoucher = liabilitiesRes.data.find(
    (v) => (v.poId === createdPO.id || v.poNumber === createdPO.poNumber)
  );
  assert.ok(liabilityVoucher, 'AP liability voucher must be generated upon PO approval');
  assert.equal(liabilityVoucher.payeeName, 'Apex School Supplies Pvt Ltd');
  assert.equal(liabilityVoucher.amountDue, createdPO.grandTotal);
  assert.equal(liabilityVoucher.status, 'Pending Payment');
});

test('M4 - 5. Star Awards SOM & SOY Workflows support full governance lifecycle', async () => {
  const candidateId = 'EMP-M4-010';
  const candidateName = 'Meera Deshmukh';

  // 1. Submit and announce 2 SOM awards so SOY eligibility (>= 2 wins) passes
  for (const month of ['October 2026', 'November 2026']) {
    const somRes = await awardsService.nominateSom({
      month,
      category: 'ACADEMIC',
      nomineeId: candidateId,
      nomineeName: candidateName,
      nominatedById: 'VICE-PRIN-01',
      nominatedByName: 'Vice Principal',
      checklistScores: { pedagogy: 30, studentMentorship: 35, professionalConduct: 30 },
    });
    assert.equal(somRes.success, true);
    const somId = somRes.data.id;

    const reviewRes = await awardsService.reviewSom(somId, {
      status: 'Reviewed',
      reviewRemarks: `Exemplary performance during ${month}`,
      reviewerName: 'Selection Committee Chair',
    });
    assert.equal(reviewRes.success, true);

    const winRes = await awardsService.announceSomWinner(somId);
    assert.equal(winRes.success, true);
    assert.equal(winRes.data.status, 'Announced Winner');
  }

  // 2. SOY Eligibility Verification
  const eligRes = await awardsService.verifySoyEligibility({
    nomineeId: candidateId,
    academicYear: '2025-2026',
    cumulativeGpa: 9.2,
    attendancePercentage: 98.0,
    infractions: 0,
  });
  assert.equal(eligRes.success, true);
  assert.equal(eligRes.data.isEligible, true);
  assert.ok(eligRes.data.somWinsCount >= 2);

  // 3. Nominate for SOY
  const soyNomRes = await awardsService.nominateSoy({
    academicYear: '2025-2026',
    nomineeId: candidateId,
    nomineeName: candidateName,
    cumulativeGpa: 9.2,
    attendancePercentage: 98.0,
    infractions: 0,
  });
  assert.equal(soyNomRes.success, true);
  const soyId = soyNomRes.data.id;
  assert.equal(soyNomRes.data.status, 'Nominated for Committee Review');

  // 4. Committee Evaluation
  const evalRes = await awardsService.evaluateSoyCommittee(soyId, {
    score: 96,
    remarks: 'Unanimous panel recommendation for annual faculty excellence',
    recommendedBy: 'Executive Academic Council',
  });
  assert.equal(evalRes.success, true);
  assert.equal(evalRes.data.status, 'Pending MD Final Sign-Off');

  // 5. MD Final Sanction
  const mdRes = await awardsService.approveSoyByMd(soyId, {
    approved: true,
    mdRemarks: 'Sanctioned for annual institutional trophy with distinction citation',
    citationText: 'Conferred for sterling pedagogical leadership and state olympiad coaching.',
  });
  assert.equal(mdRes.success, true);
  assert.equal(mdRes.data.status, 'Approved & Selected');
  assert.ok(mdRes.data.citation);
});

test('M4 - 6. Stores & Inventory Unification (Item Creation, Adjustment & Returns)', async () => {
  // 1. Create new catalogue item
  const itemPayload = {
    code: 'SKU-SCI-MIC-01',
    name: 'Compound Optical Microscope 1000x',
    category: 'Laboratory Equipment',
    unitPrice: 12500,
    currentStock: 10,
    unitOfMeasure: 'Units',
    minStockLevel: 2,
  };

  const createRes = await inventoryService.createItem(itemPayload);
  assert.equal(createRes.success, true);
  assert.ok(createRes.data);
  assert.equal(createRes.data.code, 'SKU-SCI-MIC-01');
  assert.equal(createRes.data.currentStock, 10);
  const itemId = createRes.data.id;

  // 2. Stock Adjustment (set physical count to 9)
  const adjustRes = await inventoryService.recordStockMovement({
    itemId,
    transactionType: 'ADJUSTMENT',
    quantity: 9,
    referenceNo: 'ADJ-PHY-001',
    performedBy: 'Lab Technician',
    notes: 'Physical count adjustment',
  });
  assert.equal(adjustRes.success, true);

  // Verify stock updated
  const updatedItem = await inventoryService.getItemById(itemId);
  assert.equal(updatedItem.data.currentStock, 9);

  // 3. Issue returnable item
  const issueRes = await inventoryService.issueItem({
    itemId,
    issuedToId: 'EMP-FAC-01',
    issuedToName: 'Biology Faculty',
    department: 'Science Department',
    quantity: 1,
    isReturnable: true,
  });
  assert.equal(issueRes.success, true);
  const issueId = issueRes.data.id;

  // Verify stock was decremented to 8
  const afterIssue = await inventoryService.getItemById(itemId);
  assert.equal(afterIssue.data.currentStock, 8);

  // 4. Return item & check-in
  const returnRes = await inventoryService.returnItem(issueId, {
    receivedBy: 'Store Officer',
    notes: 'Returned in good condition',
  });
  assert.equal(returnRes.success, true);

  // Verify stock was restored to 9
  const restoredItem = await inventoryService.getItemById(itemId);
  assert.equal(restoredItem.data.currentStock, 9);
});

test('M4 - 7. Fee Collection & 6-Stage Governed Refund Lifecycle', async () => {
  // 1. Record fee payment
  const invRes = await feeService.getInvoices();
  const invoice = invRes.data?.[0];
  assert.ok(invoice, 'Seed invoices must exist');

  const paymentRes = await feeService.recordPayment({
    invoiceId: invoice.id,
    studentId: invoice.studentId,
    amount: 5000,
    paymentMethod: 'UPI',
    transactionRef: 'UPI-M4-TEST-9921',
  });
  assert.equal(paymentRes.success, true);
  assert.ok(paymentRes.data.receipt);

  // 2. Request refund (Stage 1)
  const refundReqRes = await feeService.requestRefund({
    studentId: invoice.studentId,
    studentName: 'Student Requester',
    invoiceId: invoice.id,
    refundCategory: 'Tuition Excess',
    refundAmount: 2500,
    reason: 'Overpayment on term tuition fee',
    beneficiaryBankDetails: {
      accountHolder: 'Student Requester',
      bankName: 'HDFC Bank',
      accountNumber: '5010029384756',
      ifscCode: 'HDFC0000123',
    },
  });
  assert.equal(refundReqRes.success, true);
  assert.ok(refundReqRes.data);
  const refund = refundReqRes.data;
  assert.equal(refund.status, 'Pending Accounts Verification');

  // 3. Accounts Verification (Stage 2)
  const verifyRes = await feeService.approveRefund(refund.id, {
    nextStatus: 'Pending JD Approval',
    approverRole: 'Accounts Officer',
    approverName: 'Senior Accountant',
    remarks: 'Verified excess payment against bank reconciliation statement',
  });
  assert.equal(verifyRes.success, true);
  assert.equal(verifyRes.data.status, 'Pending JD Approval');

  // 4. JD Approval (Stage 3)
  const jdRes = await feeService.approveRefund(refund.id, {
    nextStatus: 'Approved',
    approverRole: 'Joint Director',
    approverName: 'JD Finance',
    remarks: 'Approved for disbursement via electronic bank transfer',
  });
  assert.equal(jdRes.success, true);
  assert.equal(jdRes.data.status, 'Approved');

  // 5. Issue Refund Voucher & Disburse (Stage 4)
  const disburseRes = await feeService.issueRefundVoucher(refund.id, {
    disbursementMode: 'Bank Transfer (NEFT/RTGS)',
    transactionRef: 'NEFT-M4-2026-9988',
    disbursedBy: 'Finance Cashier',
    notes: 'Transfer completed',
  });
  assert.equal(disburseRes.success, true);
  assert.equal(disburseRes.data.status, 'Disbursed');
  assert.ok(disburseRes.data.refundVoucherNumber);
  assert.equal(disburseRes.data.disbursementMode, 'Bank Transfer (NEFT/RTGS)');

  // 6. Audit & Analytics verification
  const auditRes = await feeService.getFeeAuditLogs();
  assert.equal(auditRes.success, true);
  assert.ok(auditRes.data.totalCollected > 0);
  assert.ok(auditRes.data.totalRefunded >= 2500);
  assert.equal(auditRes.data.netCollection, auditRes.data.totalCollected - auditRes.data.totalRefunded);
});

test('M4 - 8. Fee Refund Rejection Lifecycle records audit history and rejection notes', async () => {
  const refundReqRes = await feeService.requestRefund({
    studentId: 'STU-M4-REJ-01',
    studentName: 'Invalid Claim Student',
    refundCategory: 'Activity Fee',
    refundAmount: 8000,
    reason: 'Claiming refund after attendance for entire semester',
  });
  assert.equal(refundReqRes.success, true);
  const refundId = refundReqRes.data.id;

  const rejectRes = await feeService.approveRefund(refundId, {
    nextStatus: 'Rejected',
    approverRole: 'Joint Director',
    approverName: 'JD Academics',
    remarks: 'Rejected: School policy stipulates activity fees are non-refundable post semester commencement',
  });
  assert.equal(rejectRes.success, true);
  assert.equal(rejectRes.data.status, 'Rejected');
  assert.ok(rejectRes.data.auditHistory.some((h) => h.notes && h.notes.includes('School policy stipulates')));
});

test('M4 - 9. VULN-M4-01: Fee refund sequential state machine prevents out-of-order transitions and rejected/disbursed re-actions', async () => {
  // 1. Create a refund request (initial status: Pending Accounts Verification)
  const reqRes = await feeService.requestRefund({
    studentId: 'STU-M4-STATE-01',
    studentName: 'Rohan Sharma',
    refundCategory: 'Caution Deposit',
    refundAmount: 5000,
    reason: 'Graduation caution deposit refund request',
  });
  assert.equal(reqRes.success, true);
  const refundId = reqRes.data.id;
  assert.equal(reqRes.data.status, 'Pending Accounts Verification');

  // 2. Out-of-order: Attempt transition to 'Approved' directly from 'Pending Accounts Verification' (bypassing JD Approval)
  const prematureApprove = await feeService.approveRefund(refundId, {
    nextStatus: 'Approved',
    approverRole: 'Joint Director',
    remarks: 'Bypass attempt',
  });
  assert.equal(prematureApprove.success, false);
  assert.ok(prematureApprove.error.includes('Must be in \'Pending JD Approval\''));

  // 3. Out-of-order: Attempt transition to 'Disbursed' directly from 'Pending Accounts Verification'
  const prematureDisburse = await feeService.issueRefundVoucher(refundId, {
    disbursementMode: 'Cheque',
  });
  assert.equal(prematureDisburse.success, false);
  assert.ok(prematureDisburse.error.includes('Must be in \'Approved\''));

  // 4. Valid transition to 'Pending JD Approval'
  const jdStep = await feeService.approveRefund(refundId, {
    nextStatus: 'Pending JD Approval',
    approverRole: 'Accounts Officer',
    remarks: 'Accounts verified',
  });
  assert.equal(jdStep.success, true);
  assert.equal(jdStep.data.status, 'Pending JD Approval');

  // 5. Out-of-order: Attempt transition to 'Disbursed' directly from 'Pending JD Approval' (bypassing 'Approved')
  const prematureDisburseFromJd = await feeService.issueRefundVoucher(refundId, {
    disbursementMode: 'Cheque',
  });
  assert.equal(prematureDisburseFromJd.success, false);
  assert.ok(prematureDisburseFromJd.error.includes('Must be in \'Approved\''));

  // 6. Valid transition to 'Approved'
  const approvedStep = await feeService.approveRefund(refundId, {
    nextStatus: 'Approved',
    approverRole: 'Joint Director',
    remarks: 'JD sanctioned',
  });
  assert.equal(approvedStep.success, true);
  assert.equal(approvedStep.data.status, 'Approved');

  // 7. Valid transition to 'Disbursed'
  const disburseStep = await feeService.issueRefundVoucher(refundId, {
    disbursementMode: 'Bank Transfer (NEFT/RTGS)',
    transactionRef: 'NEFT-M4-ORDER-1234',
  });
  assert.equal(disburseStep.success, true);
  assert.equal(disburseStep.data.status, 'Disbursed');

  // 8. Re-attempt approval or disbursement on already 'Disbursed' refund
  const secondDisburse = await feeService.issueRefundVoucher(refundId, {
    disbursementMode: 'Cheque',
  });
  assert.equal(secondDisburse.success, false);
  assert.equal(secondDisburse.error, 'Cannot disburse or approve a rejected or already disbursed refund request.');

  const secondApprove = await feeService.approveRefund(refundId, {
    nextStatus: 'Approved',
  });
  assert.equal(secondApprove.success, false);
  assert.equal(secondApprove.error, 'Cannot disburse or approve a rejected or already disbursed refund request.');

  // 9. Rejection state machine test: Create refund and reject it
  const reqRes2 = await feeService.requestRefund({
    studentId: 'STU-M4-STATE-02',
    studentName: 'Priya Nair',
    refundCategory: 'Hostel Fee',
    refundAmount: 12000,
    reason: 'Hostel cancellation outside grace period',
  });
  assert.equal(reqRes2.success, true);
  const refundId2 = reqRes2.data.id;

  const rejectRes = await feeService.approveRefund(refundId2, {
    nextStatus: 'Rejected',
    approverRole: 'Accounts Officer',
    remarks: 'Policy violation',
  });
  assert.equal(rejectRes.success, true);
  assert.equal(rejectRes.data.status, 'Rejected');

  // Attempt approval/disbursement on 'Rejected' refund
  const disburseRejected = await feeService.issueRefundVoucher(refundId2, {
    disbursementMode: 'Cheque',
  });
  assert.equal(disburseRejected.success, false);
  assert.equal(disburseRejected.error, 'Cannot disburse or approve a rejected or already disbursed refund request.');

  const approveRejected = await feeService.approveRefund(refundId2, {
    nextStatus: 'Approved',
  });
  assert.equal(approveRejected.success, false);
  assert.equal(approveRejected.error, 'Cannot disburse or approve a rejected or already disbursed refund request.');
});

test('M4 - 10. VULN-M4-02: Inventory requisition return idempotency prevents duplicate check-in and stock inflation', async () => {
  // 1. Create catalogue item with initial stock of 10
  const itemRes = await inventoryService.createItem({
    name: 'Precision Digital Vernier Caliper',
    category: 'Physics Laboratory',
    unitPrice: 3200,
    currentStock: 10,
    unitOfMeasure: 'Units',
  });
  assert.equal(itemRes.success, true);
  const itemId = itemRes.data.id;
  assert.equal(itemRes.data.currentStock, 10);

  // 2. Issue 2 units as returnable item
  const issueRes = await inventoryService.issueItem({
    itemId,
    issuedToId: 'EMP-PHY-02',
    issuedToName: 'Physics Instructor',
    department: 'Science',
    quantity: 2,
    isReturnable: true,
  });
  assert.equal(issueRes.success, true);
  const issueId = issueRes.data.id;

  // Stock should now be 8
  const afterIssue = await inventoryService.getItemById(itemId);
  assert.equal(afterIssue.data.currentStock, 8);

  // 3. First return check-in
  const firstReturn = await inventoryService.returnItem(issueId, {
    receivedBy: 'Chief Storekeeper',
    returnCondition: 'Excellent',
  });
  assert.equal(firstReturn.success, true);
  assert.equal(firstReturn.data.status, 'Returned & Checked In');

  // Stock should be restored to 10
  const afterFirstReturn = await inventoryService.getItemById(itemId);
  assert.equal(afterFirstReturn.data.currentStock, 10);

  // 4. Duplicate return check-in attempt (replay attack / duplicate submission)
  const secondReturn = await inventoryService.returnItem(issueId, {
    receivedBy: 'Assistant Storekeeper',
    returnCondition: 'Good',
  });
  assert.equal(secondReturn.success, false);
  assert.equal(secondReturn.error, 'Requisition item has already been returned and checked in.');

  // Stock MUST NOT be artificially inflated to 12
  const afterSecondReturn = await inventoryService.getItemById(itemId);
  assert.equal(afterSecondReturn.data.currentStock, 10);
});

test('M4 - 11. VULN-M4-03: Star of the Year MD approval strictly enforces committee evaluation prerequisite', async () => {
  const candidateId = 'EMP-M4-SOY-GATE';
  const candidateName = 'Ananya Sen';

  // 1. Establish 2 SOM wins for candidate eligibility
  for (const month of ['August 2026', 'September 2026']) {
    const somRes = await awardsService.nominateSom({
      month,
      category: 'ACADEMIC',
      nomineeId: candidateId,
      nomineeName: candidateName,
      nominatedById: 'HOD-SCI-01',
      nominatedByName: 'Science HOD',
      checklistScores: { pedagogy: 32, studentMentorship: 34, professionalConduct: 32 },
    });
    assert.equal(somRes.success, true);
    await awardsService.reviewSom(somRes.data.id, {
      status: 'Reviewed',
      reviewRemarks: `Outstanding contributions in ${month}`,
      reviewerName: 'Awards Panel',
    });
    await awardsService.announceSomWinner(somRes.data.id);
  }

  // 2. Nominate for SOY
  const soyNomRes = await awardsService.nominateSoy({
    academicYear: '2025-2026',
    nomineeId: candidateId,
    nomineeName: candidateName,
    cumulativeGpa: 9.6,
    attendancePercentage: 99.2,
    infractions: 0,
  });
  assert.equal(soyNomRes.success, true);
  const soyId = soyNomRes.data.id;
  assert.equal(soyNomRes.data.status, 'Nominated for Committee Review');
  assert.equal(soyNomRes.data.committeeEvaluation, null);

  // 3. Premature MD final sanction without committee scoring must be rejected
  const prematureMdSanction = await awardsService.approveSoyByMd(soyId, {
    approved: true,
    mdRemarks: 'Fast-tracked bypass attempt',
    citationText: 'Premature Trophy',
  });
  assert.equal(prematureMdSanction.success, false);
  assert.equal(prematureMdSanction.error, 'Nomination must be evaluated by committee before MD final sign-off.');

  // Verify candidate record status is uncorrupted
  const checkSoyRes = await awardsService.getSoyNominations();
  const nominationInStore = checkSoyRes.data.find((n) => n.id === soyId);
  assert.ok(nominationInStore);
  assert.equal(nominationInStore.status, 'Nominated for Committee Review');
  assert.equal(nominationInStore.committeeEvaluation, null);

  // 4. Properly conduct Committee Evaluation
  const evalRes = await awardsService.evaluateSoyCommittee(soyId, {
    score: 98.5,
    remarks: 'Unanimous selection by Executive Academic Council',
    recommendedBy: 'Executive Academic Council',
  });
  assert.equal(evalRes.success, true);
  assert.equal(evalRes.data.status, 'Pending MD Final Sign-Off');
  assert.ok(evalRes.data.committeeEvaluation);
  assert.equal(evalRes.data.committeeEvaluation.score, 98.5);

  // 5. Valid MD final sanction now succeeds
  const validMdSanction = await awardsService.approveSoyByMd(soyId, {
    approved: true,
    mdRemarks: 'Sanctioned for annual gold rolling trophy',
    citationText: 'Conferred for extraordinary pedagogical excellence and institutional service.',
  });
  assert.equal(validMdSanction.success, true);
  assert.equal(validMdSanction.data.status, 'Approved & Selected');
  assert.equal(validMdSanction.data.citation, 'Conferred for extraordinary pedagogical excellence and institutional service.');
});
