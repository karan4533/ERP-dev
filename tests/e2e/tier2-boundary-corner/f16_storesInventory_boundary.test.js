/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Feature F16: Stores & Inventory Management (Stock Exceeded, Consumable Non-Returnable, Validation)
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { inventoryService } from '../../../src/services/modules/inventoryService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('F16-T2-01: recordStockMovement rejects OUT transaction exceeding currentStock', async () => {
  const itemRes = await inventoryService.createItem({
    name: 'Scientific Calculator Casio',
    category: 'Electronics',
    currentStock: 5,
    unitOfMeasure: 'Units',
    minStockLevel: 2,
    unitPrice: 850,
  });
  const itemId = itemRes.data.id;

  const result = await inventoryService.recordStockMovement({
    itemId,
    transactionType: 'OUT',
    quantity: 10, // Exceeds available 5
    notes: 'Bulk classroom issue',
  });

  assert.strictEqual(result.success, false);
  assert.match(result.error, /insufficient stock/i);
});

test('F16-T2-02: issueItem rejects requests exceeding available stock', async () => {
  const itemRes = await inventoryService.createItem({
    name: 'Compound Microscopes',
    category: 'Laboratory',
    currentStock: 3,
    unitOfMeasure: 'Units',
  });
  const itemId = itemRes.data.id;

  const issueRes = await inventoryService.issueItem({
    itemId,
    issuedToId: 'EMP-TCH-01',
    issuedToName: 'Biology Teacher',
    department: 'Science Department',
    quantity: 10,
    isReturnable: true,
  });

  assert.strictEqual(issueRes.success, false);
  assert.match(issueRes.error, /insufficient stock/i);
});

test('F16-T2-03: createItem rejects missing required attributes (name, category, currentStock, UoM)', async () => {
  const result = await inventoryService.createItem({
    name: 'Chart Papers',
    // Missing category, currentStock, unitOfMeasure
  });

  assert.strictEqual(result.success, false);
  assert.ok(result.error);
});

test('F16-T2-04: returnItem rejects returning an already returned item', async () => {
  // Create item with stock
  const itemRes = await inventoryService.createItem({
    name: 'Digital Multimeter',
    category: 'Physics Lab',
    currentStock: 10,
    unitOfMeasure: 'Units',
  });

  const issueRes = await inventoryService.issueItem({
    itemId: itemRes.data.id,
    issuedToId: 'EMP-TCH-02',
    issuedToName: 'Physics Faculty',
    department: 'Science',
    quantity: 1,
    isReturnable: true,
  });
  const issueId = issueRes.data.id;

  // First return succeeds
  const ret1 = await inventoryService.returnItem(issueId, { returnCondition: 'Good' });
  assert.strictEqual(ret1.success, true);
  assert.strictEqual(ret1.data.status, 'Returned & Checked In');

  // Second return on same issue record must fail
  const ret2 = await inventoryService.returnItem(issueId, { returnCondition: 'Good' });
  assert.strictEqual(ret2.success, false);
  assert.match(ret2.error, /already been returned/i);
});

test('F16-T2-05: returnItem rejects return attempt on consumable non-returnable issue', async () => {
  const itemRes = await inventoryService.createItem({
    name: 'A4 Printing Paper Ream',
    category: 'Stationery',
    currentStock: 50,
    unitOfMeasure: 'Reams',
  });

  const issueRes = await inventoryService.issueItem({
    itemId: itemRes.data.id,
    issuedToId: 'EMP-ADM-01',
    issuedToName: 'Exam Office Staff',
    department: 'Examinations',
    quantity: 5,
    isReturnable: false, // Consumable
  });
  const issueId = issueRes.data.id;

  const returnAttempt = await inventoryService.returnItem(issueId, { returnCondition: 'Good' });
  assert.strictEqual(returnAttempt.success, false);
  assert.match(returnAttempt.error, /flagged as consumable non-returnable/i);
});
