/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Feature F17: Fee Collection & Fee Audit (Refund State Machine, Concessions, Validation)
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { feeService } from '../../../src/services/modules/feeService.js';
import { REFUND_STATUS } from '../../../src/services/models/index.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('F17-T2-01: recordPayment validates required fields (invoiceId, studentId, amount, paymentMethod)', async () => {
  const missingFields = await feeService.recordPayment({
    studentId: 'STU-001',
    // Missing invoiceId, amount, paymentMethod
  });

  assert.strictEqual(missingFields.success, false);
  assert.ok(missingFields.error);
});

test('F17-T2-02: requestRefund validates mandatory fields (studentId, refundAmount, reason)', async () => {
  const invalidRefund = await feeService.requestRefund({
    studentId: 'STU-001',
    // Missing refundAmount, reason
  });

  assert.strictEqual(invalidRefund.success, false);
  assert.match(invalidRefund.error, /missing required refund request fields/i);
});

test('F17-T2-03: refund state machine blocks premature disbursement before JD approval', async () => {
  // Create new refund request (starts at 'Pending Accounts Verification')
  const reqRes = await feeService.requestRefund({
    studentId: 'STU-001',
    studentName: 'Aarav Sharma',
    refundAmount: 5000,
    reason: 'Duplicate laboratory deposit fee',
  });
  const refundId = reqRes.data.id;

  // Attempt direct disbursement from Pending Accounts Verification
  const disburseRes = await feeService.issueRefundVoucher(refundId, {
    voucherNo: 'REF-VOUCH-DIRECT',
    disbursementMode: 'NEFT',
  });

  assert.strictEqual(disburseRes.success, false);
  assert.match(disburseRes.error, /Cannot transition refund from .* to 'Disbursed'/i);
});

test('F17-T2-04: refund state machine blocks approval before Accounts Verification', async () => {
  const reqRes = await feeService.requestRefund({
    studentId: 'STU-002',
    studentName: 'Kavya Patel',
    refundAmount: 12000,
    reason: 'Hostel caution deposit refund on withdrawal',
  });
  const refundId = reqRes.data.id;

  // Directly try to mark 'Approved' without progressing through 'Pending JD Approval'
  const prematureApprove = await feeService.approveRefund(refundId, {
    approverRole: 'Joint Director',
    nextStatus: REFUND_STATUS.APPROVED,
  });

  assert.strictEqual(prematureApprove.success, false);
  assert.match(prematureApprove.error, /Cannot transition refund from .* to 'Approved'/i);
});

test('F17-T2-05: disallows transition on rejected or already disbursed refunds', async () => {
  // Progress refund cleanly: Request -> Pending JD Approval -> Approved -> Disbursed
  const reqRes = await feeService.requestRefund({
    studentId: 'STU-003',
    studentName: 'Rohan Verma',
    refundAmount: 2500,
    reason: 'Library caution deposit',
  });
  const refundId = reqRes.data.id;

  // 1. Accounts verification -> Pending JD Approval
  const step1 = await feeService.approveRefund(refundId, {
    approverRole: 'Accounts Officer',
    nextStatus: REFUND_STATUS.PENDING_JD,
  });
  assert.strictEqual(step1.success, true);

  // 2. JD Approval -> Approved
  const step2 = await feeService.approveRefund(refundId, {
    approverRole: 'Joint Director',
    nextStatus: REFUND_STATUS.APPROVED,
  });
  assert.strictEqual(step2.success, true);

  // 3. Disburse -> Disbursed
  const step3 = await feeService.issueRefundVoucher(refundId, {
    voucherNo: 'REF-VOUCH-TEST-01',
    disbursementMode: 'Cheque',
  });
  assert.strictEqual(step3.success, true);
  assert.strictEqual(step3.data.status, 'Disbursed');

  // 4. Attempt to approve or transition an already disbursed refund
  const invalidTransition = await feeService.approveRefund(refundId, {
    approverRole: 'Auditor',
    nextStatus: REFUND_STATUS.APPROVED,
  });
  assert.strictEqual(invalidTransition.success, false);
  assert.match(invalidTransition.error, /Cannot disburse or approve a rejected or already disbursed refund request/i);
});
