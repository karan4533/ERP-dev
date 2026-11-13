/**
 * Tier 3: Cross-Feature Integration Test Suite
 * Pairwise Module: Purchase Order Generation & Finance AP Liabilities Integration
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { purchaseService } from '../../../src/services/modules/purchaseService.js';
import { PO_STATUS } from '../../../src/services/models/index.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('X-PF-01: End-to-end procurement requisition to comparative quotes to draft PO generation', async () => {
  // 1. Create store requisition
  const reqRes = await purchaseService.createRequisition({
    department: 'Chemistry Lab',
    requestedBy: 'Dr. Meenakshi (HOD Chemistry)',
    priority: 'High',
    items: [
      { itemName: 'Analytical Balance 0.1mg', quantity: 2, estimatedCost: 35000 },
      { itemName: 'pH Meter Digital', quantity: 5, estimatedCost: 15000 },
    ],
  });
  assert.strictEqual(reqRes.success, true);
  const reqId = reqRes.data.id;

  // 2. Submit 3-vendor comparative evaluations
  const quotesRes = await purchaseService.submitComparativeQuotes({
    requisitionId: reqId,
    quotes: [
      { vendorId: 'VND-01', vendorName: 'Apex Scientific Labs', quotedAmount: 48000, warrantyMonths: 24 },
      { vendorId: 'VND-02', vendorName: 'Borosil Lab Supplies', quotedAmount: 46500, warrantyMonths: 36 },
      { vendorId: 'VND-03', vendorName: 'Thermo Scientific Reseller', quotedAmount: 51000, warrantyMonths: 12 },
    ],
    selectedVendorId: 'VND-02',
    selectionJustification: 'Lowest quote with extended 36-month comprehensive warranty',
  });
  assert.strictEqual(quotesRes.success, true);

  // 3. Generate Draft Purchase Order
  const poRes = await purchaseService.createPurchaseOrder({
    requisitionId: reqId,
    vendorId: 'VND-02',
    vendorName: 'Borosil Lab Supplies',
    deliveryTerms: 'Door delivery within 14 days',
    paymentTerms: '30 days net from invoice date',
    lineItems: [
      { description: 'Analytical Balance 0.1mg', quantity: 2, unitPrice: 16000, gstPercent: 18 },
      { description: 'pH Meter Digital', quantity: 5, unitPrice: 2900, gstPercent: 18 },
    ],
  });

  assert.strictEqual(poRes.success, true);
  const po = poRes.data;
  assert.strictEqual(po.status, PO_STATUS.PENDING_APPROVAL);
  assert.strictEqual(po.vendorId, 'VND-02');

  // Verify GST calculation: (2 * 16000 + 5 * 2900) = 32000 + 14500 = 46500. GST @ 18% = 8370. Total = 54870.
  assert.strictEqual(po.subtotal, 46500);
  assert.strictEqual(po.totalGst, 8370);
  assert.strictEqual(po.grandTotal, 54870);
});

test('X-PF-02: PO approval by Joint Director automatically injects AP liability voucher into Finance', async () => {
  const poRes = await purchaseService.createPurchaseOrder({
    vendorId: 'VND-SPORTS-01',
    vendorName: 'Cosco Sports Equipment Ltd',
    lineItems: [
      { description: 'Basketball Competition Standard', quantity: 10, unitPrice: 1800, gstPercent: 12 },
    ],
  });
  const poId = poRes.data.id;
  const poTotal = poRes.data.grandTotal;

  // Approve PO
  const approveRes = await purchaseService.approvePurchaseOrder(poId, {
    approvedBy: 'Dr. K. S. Sundaram (Joint Director)',
    remarks: 'Approved for annual inter-school tournament preparations.',
  });

  assert.strictEqual(approveRes.success, true);
  assert.strictEqual(approveRes.data.purchaseOrder.status, 'Approved');
  assert.ok(approveRes.data.liabilityVoucher);

  const voucher = approveRes.data.liabilityVoucher;
  assert.strictEqual(voucher.poId, poId);
  assert.strictEqual(voucher.payeeName, 'Cosco Sports Equipment Ltd');
  assert.strictEqual(voucher.amountDue, poTotal);
  assert.strictEqual(voucher.status, 'Pending Payment');

  // Query Finance Liabilities directly
  const allLiabs = await purchaseService.getFinanceLiabilities();
  assert.strictEqual(allLiabs.success, true);
  const foundInFinance = allLiabs.data.some((l) => l.id === voucher.id);
  assert.strictEqual(foundInFinance, true);
});

test('X-PF-03: Multiple approved POs aggregate total institutional spend in Procurement stats', async () => {
  const statsBeforeRes = await purchaseService.getPurchaseStats();
  const spendBefore = statsBeforeRes.data.totalSpend;
  const approvedBefore = statsBeforeRes.data.approvedPos;

  // Create and approve PO 1
  const po1 = await purchaseService.createPurchaseOrder({
    vendorId: 'VND-A',
    vendorName: 'Vendor A',
    lineItems: [{ description: 'Item A', quantity: 1, unitPrice: 10000, gstPercent: 18 }],
  });
  await purchaseService.approvePurchaseOrder(po1.data.id);

  // Create and approve PO 2
  const po2 = await purchaseService.createPurchaseOrder({
    vendorId: 'VND-B',
    vendorName: 'Vendor B',
    lineItems: [{ description: 'Item B', quantity: 1, unitPrice: 20000, gstPercent: 18 }],
  });
  await purchaseService.approvePurchaseOrder(po2.data.id);

  const statsAfterRes = await purchaseService.getPurchaseStats();
  assert.strictEqual(statsAfterRes.data.approvedPos, approvedBefore + 2);
  const expectedSpend = spendBefore + po1.data.grandTotal + po2.data.grandTotal;
  assert.strictEqual(statsAfterRes.data.totalSpend, expectedSpend);
});
