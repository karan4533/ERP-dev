/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Feature F14: Purchase Order Generation & Finance AP Liabilities (3-Quote Mandate, Idempotency)
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { purchaseService } from '../../../src/services/modules/purchaseService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('F14-T2-01: submitComparativeQuotes enforces strict 3-vendor minimum policy', async () => {
  const twoQuotes = await purchaseService.submitComparativeQuotes({
    requisitionId: 'REQ-STORE-001',
    quotes: [
      { vendorId: 'V1', vendorName: 'Vendor 1', quotedAmount: 10000 },
      { vendorId: 'V2', vendorName: 'Vendor 2', quotedAmount: 9500 },
    ],
    selectedVendorId: 'V2',
    selectionJustification: 'Lowest bidder',
  });

  assert.strictEqual(twoQuotes.success, false);
  assert.match(twoQuotes.error, /minimum of 3 comparative vendor quotes/i);
});

test('F14-T2-02: submitComparativeQuotes rejects missing selected vendor or justification', async () => {
  const validThreeQuotes = [
    { vendorId: 'V1', vendorName: 'Vendor 1', quotedAmount: 10000 },
    { vendorId: 'V2', vendorName: 'Vendor 2', quotedAmount: 9500 },
    { vendorId: 'V3', vendorName: 'Vendor 3', quotedAmount: 11000 },
  ];

  const noSelection = await purchaseService.submitComparativeQuotes({
    requisitionId: 'REQ-STORE-001',
    quotes: validThreeQuotes,
    selectedVendorId: null,
    selectionJustification: 'Valid justification',
  });
  assert.strictEqual(noSelection.success, false);

  const noJustification = await purchaseService.submitComparativeQuotes({
    requisitionId: 'REQ-STORE-001',
    quotes: validThreeQuotes,
    selectedVendorId: 'V2',
    selectionJustification: '',
  });
  assert.strictEqual(noJustification.success, false);
});

test('F14-T2-03: createPurchaseOrder validates required fields (vendorId, vendorName, lineItems)', async () => {
  const invalidPo = await purchaseService.createPurchaseOrder({
    vendorId: 'V-001',
    // Missing vendorName and lineItems
  });

  assert.strictEqual(invalidPo.success, false);
  assert.ok(invalidPo.error);
});

test('F14-T2-04: approvePurchaseOrder is idempotent and avoids duplicate AP liability vouchers', async () => {
  // First approval creates the PO and liability voucher
  const poRes = await purchaseService.createPurchaseOrder({
    vendorId: 'VND-CHEM-01',
    vendorName: 'Sigma Lab Supplies',
    lineItems: [
      { description: 'Beakers 250ml', quantity: 20, unitPrice: 150, gstPercent: 18 },
    ],
  });
  const poId = poRes.data.id;

  const app1 = await purchaseService.approvePurchaseOrder(poId, {
    approvedBy: 'Dr. Sundaram (Joint Director)',
  });
  assert.strictEqual(app1.success, true);
  assert.strictEqual(app1.data.purchaseOrder.status, 'Approved');
  const voucherId1 = app1.data.liabilityVoucher.id;

  // Query liabilities
  const liabBefore = await purchaseService.getFinanceLiabilities();
  const countBefore = liabBefore.data.length;

  // Second approval on same PO
  const app2 = await purchaseService.approvePurchaseOrder(poId, {
    approvedBy: 'Dr. Sundaram (Joint Director)',
  });
  assert.strictEqual(app2.success, true);
  assert.strictEqual(app2.data.alreadyApproved, true);
  assert.strictEqual(app2.data.liabilityVoucher.id, voucherId1);

  // Total liabilities must not increase
  const liabAfter = await purchaseService.getFinanceLiabilities();
  assert.strictEqual(liabAfter.data.length, countBefore);
});

test('F14-T2-05: approvePurchaseOrder returns error when PO does not exist', async () => {
  const res = await purchaseService.approvePurchaseOrder('PO-NON-EXISTENT', {
    approvedBy: 'Admin',
  });

  assert.strictEqual(res.success, false);
  assert.match(res.error, /not found/i);
});
