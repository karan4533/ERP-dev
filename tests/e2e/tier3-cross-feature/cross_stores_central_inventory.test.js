/**
 * Tier 3: Cross-Feature Integration Test Suite
 * Pairwise Module: Stores & Central Inventory Requisitions & Procurement Reorder Triggers
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { inventoryService } from '../../../src/services/modules/inventoryService.js';
import { purchaseService } from '../../../src/services/modules/purchaseService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('X-SCI-01: Departmental material issue decrements catalog currentStock and logs outward transaction', async () => {
  // 1. Create inventory item with 50 units
  const itemRes = await inventoryService.createItem({
    name: 'Standard Graph Paper Notebooks',
    category: 'Stationery',
    currentStock: 50,
    minStockLevel: 15,
    unitOfMeasure: 'Notebooks',
    unitPrice: 40,
  });
  assert.strictEqual(itemRes.success, true);
  const itemId = itemRes.data.id;

  // 2. Issue 20 notebooks to Mathematics Department
  const issueRes = await inventoryService.issueItem({
    itemId,
    issuedToId: 'EMP-TCH-03',
    issuedToName: 'S. Ramanujan (Senior Math Faculty)',
    department: 'Mathematics',
    quantity: 20,
    isReturnable: false,
  });

  assert.strictEqual(issueRes.success, true);

  // 3. Verify stock is reduced from 50 to 30
  const updatedItemRes = await inventoryService.getItemById(itemId);
  assert.strictEqual(updatedItemRes.data.currentStock, 30);

  // 4. Verify transaction recorded
  const txRes = await inventoryService.getTransactions({ itemId });
  assert.strictEqual(txRes.success, true);
  const txList = txRes.data.filter((t) => t.itemId === itemId);
  assert.ok(txList.some((t) => t.transactionType === 'OUT' && t.quantity === 20));
});

test('X-SCI-02: Depleting stock to or below minStockLevel triggers procurement purchase requisition', async () => {
  // Item with minStockLevel = 10, currentStock = 12
  const itemRes = await inventoryService.createItem({
    name: 'Sanitary Liquid Handwash 5L Can',
    category: 'Housekeeping & Sanitation',
    currentStock: 12,
    minStockLevel: 10,
    unitOfMeasure: 'Cans',
    unitPrice: 450,
  });
  const itemId = itemRes.data.id;

  // Issue 5 cans -> leaves 7 (which is below minStockLevel 10)
  const issueRes = await inventoryService.issueItem({
    itemId,
    issuedToId: 'EMP-HK-01',
    issuedToName: 'Housekeeping Head',
    department: 'Housekeeping',
    quantity: 5,
    isReturnable: false,
  });
  assert.strictEqual(issueRes.success, true);

  // Verify inventory stats detects low stock item
  const statsRes = await inventoryService.getInventoryStats();
  assert.strictEqual(statsRes.success, true);
  assert.ok(statsRes.data.lowStockItems > 0);

  // Trigger Purchase Requisition in Purchase Service for restock
  const reqRes = await purchaseService.createRequisition({
    department: 'Housekeeping & Campus Sanitation',
    requestedBy: 'Stores Manager',
    priority: 'Urgent',
    reason: `Automatic replenishment trigger: ${itemRes.data.name} below reorder threshold (Current: 7, Min: 10)`,
    items: [
      { itemId, itemName: itemRes.data.name, quantity: 25, estimatedCost: 11250 },
    ],
  });

  assert.strictEqual(reqRes.success, true);
  assert.strictEqual(reqRes.data.status, 'Pending Quotation');
});

test('X-SCI-03: Returnable item check-in replenishes stock and marks issue record Returned', async () => {
  const itemRes = await inventoryService.createItem({
    name: 'Full HD Portable Projector Epson',
    category: 'Audio Visual / IT Assets',
    currentStock: 4,
    minStockLevel: 1,
    unitOfMeasure: 'Units',
  });
  const itemId = itemRes.data.id;

  // Issue item on loan
  const issueRes = await inventoryService.issueItem({
    itemId,
    issuedToId: 'EMP-TCH-04',
    issuedToName: 'History Faculty',
    department: 'Social Sciences',
    quantity: 1,
    isReturnable: true,
  });
  assert.strictEqual(issueRes.success, true);
  const issueId = issueRes.data.id;

  // Catalog stock should now be 3
  const midItem = await inventoryService.getItemById(itemId);
  assert.strictEqual(midItem.data.currentStock, 3);

  // Return the projector
  const retRes = await inventoryService.returnItem(issueId, {
    returnCondition: 'Excellent / All Cables Present',
    receivedBy: 'Store Officer',
  });
  assert.strictEqual(retRes.success, true);
  assert.strictEqual(retRes.data.status, 'Returned & Checked In');

  // Stock should be replenished back to 4
  const finalItem = await inventoryService.getItemById(itemId);
  assert.strictEqual(finalItem.data.currentStock, 4);
});
