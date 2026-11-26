import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { inventoryService } from '../../../src/services/modules/inventoryService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F16-T1-01: Inventory service creates SKU in catalog with initial stock and pricing', async () => {
  mockAdapter.resetDatabase();
  const itemData = {
    name: 'Compound Optical Microscope 1000x',
    category: 'Science Laboratory Equipment',
    currentStock: 15,
    minStockLevel: 5,
    unitOfMeasure: 'Pieces',
    unitPrice: 12500,
    supplierName: 'Apex Scientific Labs Ltd.',
  };

  const res = await inventoryService.createItem(itemData);
  assertSuccessEnvelope(res, 'inventoryService.createItem');
  assert.ok(res.data.id);
  assert.equal(res.data.name, itemData.name);
  assert.equal(res.data.currentStock, 15);
});

test('F16-T1-02: Inventory service retrieves catalog items with stock levels', async () => {
  mockAdapter.resetDatabase();
  const res = await inventoryService.getCatalog();
  assertSuccessEnvelope(res, 'inventoryService.getCatalog');
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 3);
});

test('F16-T1-03: Inventory service issues returnable item and decrements current stock', async () => {
  mockAdapter.resetDatabase();
  const createRes = await inventoryService.createItem({
    name: 'Volleyball Synthetic Leather Size 5',
    category: 'Sports Equipment',
    currentStock: 20,
    unitOfMeasure: 'Pieces',
    unitPrice: 800,
  });
  const itemId = createRes.data.id;

  const issueRes = await inventoryService.issueItem({
    itemId,
    issuedToId: 'EMP-TCH-002',
    issuedToName: 'Sports Instructor',
    department: 'Physical Education',
    quantity: 4,
    isReturnable: true,
  });

  assertSuccessEnvelope(issueRes, 'inventoryService.issueItem');
  assert.equal(issueRes.data.status, 'Checked Out / Pending Return');
  assert.equal(issueRes.data.quantity, 4);

  const itemAfter = await inventoryService.getItemById(itemId);
  assert.equal(itemAfter.data.currentStock, 16);
});

test('F16-T1-04: Inventory service returns returnable equipment and increments stock back', async () => {
  mockAdapter.resetDatabase();
  const createRes = await inventoryService.createItem({
    name: 'Stopwatch Digital Professional',
    category: 'Sports Equipment',
    currentStock: 10,
    unitOfMeasure: 'Pieces',
    unitPrice: 650,
  });
  const itemId = createRes.data.id;

  const issueRes = await inventoryService.issueItem({
    itemId,
    issuedToId: 'EMP-TCH-001',
    issuedToName: 'Teacher',
    department: 'Physical Education',
    quantity: 2,
    isReturnable: true,
  });
  const issueId = issueRes.data.id;

  const returnRes = await inventoryService.returnItem(issueId, {
    returnCondition: 'Good',
    notes: 'Returned in full working condition',
  });

  assertSuccessEnvelope(returnRes, 'inventoryService.returnItem');
  assert.equal(returnRes.data.status, 'Returned & Checked In');

  const itemAfterReturn = await inventoryService.getItemById(itemId);
  assert.equal(itemAfterReturn.data.currentStock, 10);
});

test('F16-T1-05: Inventory service records stock movement transactions (IN / OUT / ADJUSTMENT)', async () => {
  mockAdapter.resetDatabase();
  const createRes = await inventoryService.createItem({
    name: 'Whiteboard Marker Pens (Pack of 10)',
    category: 'Stationery',
    currentStock: 50,
    unitOfMeasure: 'Packs',
    unitPrice: 250,
  });
  const itemId = createRes.data.id;

  const movementRes = await inventoryService.recordStockMovement({
    itemId,
    transactionType: 'IN',
    quantity: 20,
    referenceNo: 'GRN-2026-99',
    performedBy: 'Store Supervisor',
    notes: 'Received fresh consignment from distributor',
  });

  assertSuccessEnvelope(movementRes, 'inventoryService.recordStockMovement');
  assert.equal(movementRes.data.item.currentStock, 70);
});

test('F16-T1-06: Inventory service computes total valuation and low-stock telemetry metrics', async () => {
  mockAdapter.resetDatabase();
  const statsRes = await inventoryService.getInventoryStats();
  assertSuccessEnvelope(statsRes, 'inventoryService.getInventoryStats');
  assert.ok(typeof statsRes.data.totalItems === 'number');
  assert.ok(typeof statsRes.data.lowStockItems === 'number');
  assert.ok(typeof statsRes.data.totalInventoryValue === 'number');
});
