/**
 * Tier 4: Real-World Application Scenario Test Suite
 * Scenario 3: New Student Enrolment, Hostel Allocation, Fee Invoicing & Ledger Clearance
 *
 * Operational Flow:
 * 1. New student admitted and allocated a vacant hostel bed.
 * 2. Automated fee invoice generated in Central Fee Management.
 * 3. Cashier records initial fee installment with receipt generation.
 * 4. Principal sanctions merit scholarship concession, recalculating balance.
 * 5. Final settlement payment made, invoice marked Paid, and fee audit net collections updated.
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { hostelService } from '../../../src/services/modules/hostelService.js';
import { feeService } from '../../../src/services/modules/feeService.js';
import { academicService } from '../../../src/services/modules/academicService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('Scenario STU-ADM-01: Hostel bed allocation automatically triggers fee invoicing', async () => {
  const studentId = 'STU-ADM-2026-88';
  const feeAmount = 80000;

  const enrolRes = await hostelService.assignHostelBed(studentId, {
    studentName: 'Vikramaditya Rao',
    grade: 'Grade 11',
    section: 'B',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B3', // vacant in seed
    feeAmount,
    academicYear: '2025-2026',
    term: 'Annual',
    wardenName: 'Mr. M. Kumar',
  });

  assert.strictEqual(enrolRes.success, true);
  const invoiceId = enrolRes.data.linkedFeeInvoiceId;
  assert.ok(invoiceId);

  // Verify Central Fee Management invoice
  const invRes = await feeService.getInvoiceById(invoiceId);
  assert.strictEqual(invRes.success, true);
  assert.strictEqual(invRes.data.studentId, studentId);
  assert.strictEqual(invRes.data.balanceAmount, feeAmount);
  assert.strictEqual(invRes.data.status, 'Pending');
});

test('Scenario STU-ADM-02: Installment payment and merit concession recalculate student ledger', async () => {
  const studentId = 'STU-ADM-2026-89';
  const enrolRes = await hostelService.assignHostelBed(studentId, {
    studentName: 'Madhavan Krishnan',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-202',
    bedNumber: 'B2', // vacant in seed
    feeAmount: 90000,
  });
  const invoiceId = enrolRes.data.linkedFeeInvoiceId;

  // Step 1: Parent pays installment 1 of 40,000
  const pay1Res = await feeService.recordPayment({
    invoiceId,
    studentId,
    amount: 40000,
    paymentMethod: 'Net Banking',
    collectedBy: 'Accounts Cashier',
  });
  assert.strictEqual(pay1Res.success, true);
  assert.strictEqual(pay1Res.data.invoice.status, 'Partially Paid');
  assert.strictEqual(pay1Res.data.invoice.balanceAmount, 50000);

  // Step 2: Principal approves 15,000 Merit Scholarship concession
  const concRes = await feeService.applyConcession({
    invoiceId,
    concessionAmount: 15000,
    concessionType: 'Academic Excellence Scholarship',
    approvedBy: 'Principal',
    remarks: 'Top scorer in entrance assessment',
  });
  assert.strictEqual(concRes.success, true);
  assert.strictEqual(concRes.data.concessionAmount, 15000);
  assert.strictEqual(concRes.data.balanceAmount, 35000);

  // Verify student ledger
  const ledgerRes = await feeService.getStudentLedger(studentId);
  assert.strictEqual(ledgerRes.success, true);
  assert.strictEqual(ledgerRes.data.totalPaid, 40000);
  assert.strictEqual(ledgerRes.data.totalBalance, 35000);
});

test('Scenario STU-ADM-03: Final settlement marks invoice Paid and dossier confirms student status', async () => {
  const studentId = 'STU-ADM-2026-90';
  const enrolRes = await hostelService.assignHostelBed(studentId, {
    studentName: 'Sanjay Dutt',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-202',
    bedNumber: 'B3', // vacant in seed
    feeAmount: 50000,
  });
  const invoiceId = enrolRes.data.linkedFeeInvoiceId;

  // Full settlement payment
  const fullPayRes = await feeService.recordPayment({
    invoiceId,
    studentId,
    amount: 50000,
    paymentMethod: 'Card Swipe',
    collectedBy: 'Senior Cashier',
  });
  assert.strictEqual(fullPayRes.success, true);
  assert.strictEqual(fullPayRes.data.invoice.status, 'Paid');
  assert.strictEqual(fullPayRes.data.invoice.balanceAmount, 0);

  // Verify audit logs reflect collected amount
  const auditRes = await feeService.getFeeAuditLogs();
  assert.strictEqual(auditRes.success, true);
  assert.ok(auditRes.data.totalCollected >= 50000);

  // Academic dossier fallback returns active student record
  const dossierRes = await academicService.getStudentDossier(studentId);
  assert.strictEqual(dossierRes.success, true);
  assert.strictEqual(dossierRes.data.studentId, studentId);
});
