/**
 * Tier 3: Cross-Feature Integration Test Suite
 * Pairwise Module: Hostel Enrolment & Central Fee Management Integration
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { hostelService } from '../../../src/services/modules/hostelService.js';
import { feeService } from '../../../src/services/modules/feeService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('X-HF-01: Hostel bed allocation automatically triggers fee invoicing in Central Fee Management', async () => {
  const studentId = 'STU-CROSS-01';
  const feeAmount = 85000;

  // 1. Enrol student into hostel
  const enrolRes = await hostelService.assignHostelBed(studentId, {
    studentName: 'Devansh Singhania',
    grade: 'Grade 11',
    section: 'A',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B3', // vacant bed in seed data
    feeAmount,
    academicYear: '2025-2026',
    term: 'Annual',
  });

  assert.strictEqual(enrolRes.success, true);
  const enrolment = enrolRes.data;
  assert.ok(enrolment.linkedFeeInvoiceId);
  assert.strictEqual(enrolment.annualHostelFee, feeAmount);

  // 2. Verify that Central Fee Management now contains this invoice
  const invRes = await feeService.getInvoiceById(enrolment.linkedFeeInvoiceId);
  assert.strictEqual(invRes.success, true);
  const invoice = invRes.data;
  assert.strictEqual(invoice.studentId, studentId);
  assert.strictEqual(invoice.totalAmount, feeAmount);
  assert.strictEqual(invoice.balanceAmount, feeAmount);
  assert.strictEqual(invoice.status, 'Pending');
  assert.strictEqual(invoice.items[0].feeHeadId, 'FH-HSTL');
});

test('X-HF-02: Partial fee collection on hostel invoice updates ledger while hostel enrolment stays active', async () => {
  // 1. Enrol student
  const enrolRes = await hostelService.assignHostelBed('STU-CROSS-02', {
    studentName: 'Ananya Iyer',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-202',
    bedNumber: 'B2', // vacant bed in seed data
    feeAmount: 60000,
  });
  const invoiceId = enrolRes.data.linkedFeeInvoiceId;

  // 2. Make partial installment payment of 30,000
  const payRes = await feeService.recordPayment({
    invoiceId,
    studentId: 'STU-CROSS-02',
    amount: 30000,
    paymentMethod: 'Net Banking',
    collectedBy: 'Accounts Cashier',
  });

  assert.strictEqual(payRes.success, true);
  assert.strictEqual(payRes.data.invoice.paidAmount, 30000);
  assert.strictEqual(payRes.data.invoice.balanceAmount, 30000);
  assert.strictEqual(payRes.data.invoice.status, 'Partially Paid');

  // 3. Confirm hostel enrolment status is still Active
  const enrCheck = await hostelService.getEnrolmentByStudentId('STU-CROSS-02');
  assert.strictEqual(enrCheck.success, true);
  assert.strictEqual(enrCheck.data.status, 'Active');
});

test('X-HF-03: Hostel fee concession correctly reduces balance in Student Fee Ledger', async () => {
  const studentId = 'STU-CROSS-03';
  const enrolRes = await hostelService.assignHostelBed(studentId, {
    studentName: 'Karthik Raja',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-202',
    bedNumber: 'B3', // vacant bed in seed data
    feeAmount: 70000,
  });
  const invoiceId = enrolRes.data.linkedFeeInvoiceId;

  // Apply merit concession of 20,000
  const concRes = await feeService.applyConcession({
    invoiceId,
    concessionAmount: 20000,
    concessionType: 'Sports Scholarship',
    approvedBy: 'Principal',
  });

  assert.strictEqual(concRes.success, true);
  assert.strictEqual(concRes.data.concessionAmount, 20000);
  assert.strictEqual(concRes.data.balanceAmount, 50000);

  // Student ledger inspection
  const ledgerRes = await feeService.getStudentLedger(studentId);
  assert.strictEqual(ledgerRes.success, true);
  assert.strictEqual(ledgerRes.data.totalBalance, 50000);
});

test('X-HF-04: Vacating hostel bed retains historical financial invoice and payments intact', async () => {
  const studentId = 'STU-CROSS-04';
  const enrolRes = await hostelService.assignHostelBed(studentId, {
    studentName: 'Pooja Hegde',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B3',
    feeAmount: 50000,
  });
  const enrolmentId = enrolRes.data.id;
  const invoiceId = enrolRes.data.linkedFeeInvoiceId;

  // Make full payment
  await feeService.recordPayment({
    invoiceId,
    studentId,
    amount: 50000,
    paymentMethod: 'UPI',
  });

  // Vacate bed
  const vacateRes = await hostelService.vacateBed(enrolmentId, { remarks: 'Term concluded' });
  assert.strictEqual(vacateRes.success, true);
  assert.strictEqual(vacateRes.data.status, 'Vacated');

  // Verify invoice remains Paid with all receipts intact
  const invRes = await feeService.getInvoiceById(invoiceId);
  assert.strictEqual(invRes.success, true);
  assert.strictEqual(invRes.data.status, 'Paid');
  assert.strictEqual(invRes.data.paidAmount, 50000);
  assert.strictEqual(invRes.data.balanceAmount, 0);
  assert.ok(invRes.data.receipts.length > 0);
});
