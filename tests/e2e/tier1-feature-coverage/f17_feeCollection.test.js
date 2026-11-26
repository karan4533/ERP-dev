import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { feeService } from '../../../src/services/modules/feeService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F17-T1-01: Fee service retrieves student fee ledger with invoices and outstanding balance', async () => {
  mockAdapter.resetDatabase();
  const res = await feeService.getStudentLedger('STU-001');
  assertSuccessEnvelope(res, 'feeService.getStudentLedger');
  assert.equal(res.data.studentId, 'STU-001');
  assert.ok(Array.isArray(res.data.invoices));
  assert.ok(typeof res.data.totalInvoiced === 'number');
  assert.ok(typeof res.data.totalPaid === 'number');
  assert.ok(typeof res.data.totalBalance === 'number');

  const paymentsRes = await feeService.getPayments();
  assertSuccessEnvelope(paymentsRes);
  assert.ok(Array.isArray(paymentsRes.data));
});

test('F17-T1-02: Fee service records partial payment and generates verified payment receipt', async () => {
  mockAdapter.resetDatabase();
  const ledgerRes = await feeService.getStudentLedger('STU-002');
  const invoice = ledgerRes.data.invoices[0];
  const priorPaid = invoice.paidAmount || 0;

  const payRes = await feeService.recordPayment({
    invoiceId: invoice.id,
    studentId: 'STU-002',
    amount: 10000,
    paymentMethod: 'UPI / Online Portal',
    transactionRef: 'UPI-2026-99120',
  });

  assertSuccessEnvelope(payRes, 'feeService.recordPayment');
  assert.ok(payRes.data.receipt);
  assert.equal(payRes.data.receipt.amount, 10000);
  assert.equal(payRes.data.invoice.paidAmount, priorPaid + 10000);
});

test('F17-T1-03: Fee service applies concession and updates invoice net payable balance', async () => {
  mockAdapter.resetDatabase();
  const ledgerRes = await feeService.getStudentLedger('STU-002');
  const invoice = ledgerRes.data.invoices[0];
  const priorConcession = invoice.concessionAmount || 0;

  const concessionRes = await feeService.applyConcession({
    invoiceId: invoice.id,
    concessionAmount: 3000,
    concessionType: 'Merit-Cum-Means Concession',
    approvedBy: 'Managing Director',
    remarks: 'Approved for top academic performance',
  });

  assertSuccessEnvelope(concessionRes, 'feeService.applyConcession');
  assert.equal(concessionRes.data.concessionAmount, priorConcession + 3000);
});

test('F17-T1-04: Fee service executes 6-stage fee refund lifecycle (Request -> Accounts -> JD -> Disbursed)', async () => {
  mockAdapter.resetDatabase();
  // 1. Request -> enters 'Pending Accounts Verification'
  const reqRes = await feeService.requestRefund({
    studentId: 'STU-001',
    invoiceId: 'INV-2026-001',
    refundAmount: 6000,
    reason: 'Duplicate payment via net banking',
    beneficiaryBankDetails: {
      accountHolder: 'Rajesh Sharma',
      accountNumber: '98765432101',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
    },
  });
  assertSuccessEnvelope(reqRes, 'feeService.requestRefund');
  const refundId = reqRes.data.id;
  assert.equal(reqRes.data.status, 'Pending Accounts Verification');

  // 2. Accounts Verification -> 'Pending JD Approval'
  const verifyRes = await feeService.approveRefund(refundId, {
    nextStatus: 'Pending JD Approval',
    approverRole: 'accounthead',
    approverName: 'Finance Head',
    remarks: 'Bank passbook and ledger cross-checked',
  });
  assertSuccessEnvelope(verifyRes);
  assert.equal(verifyRes.data.status, 'Pending JD Approval');

  // 3. JD Approval -> 'Approved'
  const jdRes = await feeService.approveRefund(refundId, {
    nextStatus: 'Approved',
    approverRole: 'jointdirector',
    approverName: 'Joint Director',
    remarks: 'Sanctioned per institutional financial regulations',
  });
  assertSuccessEnvelope(jdRes);
  assert.equal(jdRes.data.status, 'Approved');

  // 4. Disbursement -> 'Disbursed'
  const disbRes = await feeService.issueRefundVoucher(refundId, {
    voucherNo: 'REF-DISB-2026-09',
    disbursementMode: 'NEFT / RTGS Transfer',
  });
  assertSuccessEnvelope(disbRes);
  assert.equal(disbRes.data.status, 'Disbursed');
});

test('F17-T1-05: Fee service retrieves financial audit analytics across invoices, payments, and concessions', async () => {
  mockAdapter.resetDatabase();
  const auditRes = await feeService.getFeeAuditLogs();
  assertSuccessEnvelope(auditRes, 'feeService.getFeeAuditLogs');
  assert.ok(typeof auditRes.data.totalCollected === 'number');
  assert.ok(typeof auditRes.data.totalConcessions === 'number');
  assert.ok(typeof auditRes.data.netCollection === 'number');
  assert.ok(typeof auditRes.data.totalInvoices === 'number');
});
