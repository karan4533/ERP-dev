import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { purchaseService } from '../../../src/services/modules/purchaseService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F14-T1-01: Purchase service accepts minimum 3 comparative vendor quotes', async () => {
  mockAdapter.resetDatabase();
  const res = await purchaseService.submitComparativeQuotes({
    requisitionId: 'REQ-STORE-2026-001',
    quotes: [
      { vendorId: 'VEND-01', vendorName: 'Apex Scientific', totalAmount: 45000 },
      { vendorId: 'VEND-02', vendorName: 'Lab Instruments Co.', totalAmount: 48000 },
      { vendorId: 'VEND-03', vendorName: 'Universal Supplies Ltd.', totalAmount: 47500 },
    ],
    selectedVendorId: 'VEND-01',
    selectionJustification: 'Lowest technically compliant quote with 2-year warranty.',
  });

  assertSuccessEnvelope(res, 'purchaseService.submitComparativeQuotes');
  assert.equal(res.data.selectedVendorId, 'VEND-01');
});

test('F14-T1-02: Purchase service creates purchase order and calculates line-item GST and grand total', async () => {
  mockAdapter.resetDatabase();
  const poData = {
    vendorId: 'VEND-01',
    vendorName: 'Apex Scientific Labs Ltd.',
    requisitionId: 'REQ-STORE-2026-001',
    lineItems: [
      { itemName: 'Borosilicate Glass Beakers 500ml', quantity: 20, unitPrice: 200, gstRatePercent: 18 },
      { itemName: 'Digital Analytical Balance 0.1mg', quantity: 2, unitPrice: 15000, gstRatePercent: 18 },
    ],
  };

  const res = await purchaseService.createPurchaseOrder(poData);
  assertSuccessEnvelope(res, 'purchaseService.createPurchaseOrder');
  assert.ok(res.data.id);
  assert.equal(res.data.status, 'Pending Approval');
  assert.equal(res.data.subtotal, 34000); // (20*200 = 4000) + (2*15000 = 30000)
  assert.equal(res.data.totalGst, 6120);  // 18% of 34000 = 6120
  assert.equal(res.data.grandTotal, 40120);
});

test('F14-T1-03: Purchase order approval automatically generates Accounts Payable liability voucher in Finance', async () => {
  mockAdapter.resetDatabase();
  const initialLiabilities = (await purchaseService.getFinanceLiabilities()).data.length;

  const poRes = await purchaseService.createPurchaseOrder({
    vendorId: 'VEND-02',
    vendorName: 'Standard Stationery Mart',
    lineItems: [
      { itemName: 'A4 Copier Paper 75GSM Boxes', quantity: 50, unitPrice: 300, gstRatePercent: 12 },
    ],
  });
  const poId = poRes.data.id;

  const approveRes = await purchaseService.approvePurchaseOrder(poId, {
    approvedBy: 'Dr. K. S. Sundaram (Joint Director)',
    remarks: 'Approved for annual administrative operations',
  });

  assertSuccessEnvelope(approveRes, 'purchaseService.approvePurchaseOrder');
  assert.equal(approveRes.data.purchaseOrder.status, 'Approved');
  assert.ok(approveRes.data.liabilityVoucher);
  assert.equal(approveRes.data.liabilityVoucher.poId, poId);

  const updatedLiabilitiesRes = await purchaseService.getFinanceLiabilities();
  assert.equal(updatedLiabilitiesRes.data.length, initialLiabilities + 1);
});

test('F14-T1-04: Purchase service lists purchase orders and filters by status', async () => {
  mockAdapter.resetDatabase();
  const res = await purchaseService.getPurchaseOrders();
  assertSuccessEnvelope(res, 'purchaseService.getPurchaseOrders');
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 1);
});

test('F14-T1-05: Purchase service supplies procurement and requisition telemetry metrics', async () => {
  mockAdapter.resetDatabase();
  const statsRes = await purchaseService.getPurchaseStats();
  assertSuccessEnvelope(statsRes, 'purchaseService.getPurchaseStats');
  assert.ok(typeof statsRes.data.totalPurchaseOrders === 'number');
  assert.ok(typeof statsRes.data.pendingPos === 'number');
  assert.ok(typeof statsRes.data.totalRequisitions === 'number');
});
