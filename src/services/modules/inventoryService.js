/**
 * Inventory & Store Management Domain Service
 * Handles item catalog, stock intake/dispatch/adjustments/transfers,
 * and issue/return register with returnable tracking.
 */

import { apiClient } from '../api/apiClient.js';
import { generateUniqueId, validateRequired } from '../models/index.js';
import { createErrorResponse } from '../api/responseEnvelope.js';

export const inventoryService = {
  // ==========================================================================
  // 1. ITEM CATALOG
  // ==========================================================================

  async getCatalog(params = {}) {
    return apiClient.get('/api/v1/inventory/catalog', { params });
  },

  async getItemById(id) {
    return apiClient.get(`/api/v1/inventory/catalog/${id}`);
  },

  async createItem(itemData = {}) {
    const validation = validateRequired(itemData, ['name', 'category', 'currentStock', 'unitOfMeasure']);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const payload = {
      code: itemData.code || generateUniqueId('ITM'),
      currentStock: Number(itemData.currentStock) || 0,
      minStockLevel: Number(itemData.minStockLevel) || 10,
      unitPrice: Number(itemData.unitPrice) || 0,
      ...itemData,
    };
    return apiClient.post('/api/v1/inventory/catalog', payload);
  },

  async updateItem(id, itemData = {}) {
    return apiClient.put(`/api/v1/inventory/catalog/${id}`, itemData);
  },

  async deleteItem(id) {
    return apiClient.delete(`/api/v1/inventory/catalog/${id}`);
  },

  // ==========================================================================
  // 2. STOCK MOVEMENTS (IN, OUT, ADJUSTMENT, TRANSFER)
  // ==========================================================================

  async getTransactions(params = {}) {
    return apiClient.get('/api/v1/inventory/transactions', { params });
  },

  async recordStockMovement({ itemId, transactionType, quantity, referenceNo, performedBy, notes }) {
    const itemRes = await this.getItemById(itemId);
    if (!itemRes.success || !itemRes.data) return itemRes;

    const item = itemRes.data;
    const qty = Number(quantity);

    if (transactionType === 'OUT' && item.currentStock < qty) {
      return createErrorResponse(`Insufficient stock for ${item.name}. Available: ${item.currentStock}, Requested: ${qty}`);
    }

    if (transactionType === 'IN') {
      item.currentStock += qty;
    } else if (transactionType === 'OUT') {
      item.currentStock -= qty;
    } else if (transactionType === 'ADJUSTMENT') {
      item.currentStock = qty;
    }

    await apiClient.put(`/api/v1/inventory/catalog/${itemId}`, item);

    const transaction = {
      id: generateUniqueId('TX-INV'),
      itemId,
      itemName: item.name,
      transactionType,
      quantity: qty,
      referenceNo: referenceNo || generateUniqueId('REF'),
      timestamp: new Date().toISOString(),
      performedBy: performedBy || 'Store Officer',
      notes: notes || '',
    };

    await apiClient.post('/api/v1/inventory/transactions', transaction);
    return { success: true, data: { item, transaction }, meta: null, error: null };
  },

  // ==========================================================================
  // 3. STORE ISSUE & RETURN REGISTER
  // ==========================================================================

  async getIssueRegister(params = {}) {
    return apiClient.get('/api/v1/inventory/issues', { params });
  },

  async issueItem(issueData = {}) {
    const validation = validateRequired(issueData, [
      'itemId',
      'issuedToId',
      'issuedToName',
      'department',
      'quantity',
    ]);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const movementRes = await this.recordStockMovement({
      itemId: issueData.itemId,
      transactionType: 'OUT',
      quantity: issueData.quantity,
      referenceNo: generateUniqueId('ISS'),
      performedBy: issueData.issuedByName || 'Store Officer',
      notes: `Issued to ${issueData.issuedToName} (${issueData.department})`,
    });

    if (!movementRes.success) return movementRes;

    const isReturnable = Boolean(issueData.isReturnable);
    const newIssue = {
      id: generateUniqueId('ISSUE'),
      itemId: issueData.itemId,
      itemName: movementRes.data.item.name,
      issuedToId: issueData.issuedToId,
      issuedToName: issueData.issuedToName,
      department: issueData.department,
      quantity: Number(issueData.quantity),
      issueDate: new Date().toISOString().split('T')[0],
      isReturnable,
      expectedReturnDate: isReturnable ? (issueData.expectedReturnDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) : null,
      actualReturnDate: null,
      status: isReturnable ? 'Checked Out / Pending Return' : 'Issued (Consumable)',
      returnCondition: null,
    };

    return apiClient.post('/api/v1/inventory/issues', newIssue);
  },

  async returnItem(issueId, returnData = {}) {
    const issueRes = await apiClient.get(`/api/v1/inventory/issues/${issueId}`);
    if (!issueRes.success || !issueRes.data) return issueRes;

    const issue = issueRes.data;
    if (issue.status === 'Returned & Checked In' || issue.status === 'Returned') {
      return createErrorResponse('Requisition item has already been returned and checked in.');
    }

    if (!issue.isReturnable) {
      return createErrorResponse('Item was flagged as consumable non-returnable.');
    }

    // Restock the returned item
    await this.recordStockMovement({
      itemId: issue.itemId,
      transactionType: 'IN',
      quantity: issue.quantity,
      referenceNo: `RET-${issueId}`,
      performedBy: returnData.receivedBy || 'Store Officer',
      notes: `Returned by ${issue.issuedToName}`,
    });

    issue.status = 'Returned & Checked In';
    issue.actualReturnDate = new Date().toISOString();
    issue.returnCondition = returnData.returnCondition || 'Good';

    return apiClient.put(`/api/v1/inventory/issues/${issueId}`, issue);
  },

  async getInventoryStats() {
    const catalogRes = await this.getCatalog();
    const items = catalogRes.data || [];

    const totalItems = items.length;
    const lowStockItems = items.filter((i) => i.currentStock <= (i.minStockLevel || 10)).length;
    const totalInventoryValue = items.reduce((acc, i) => acc + (i.currentStock * (i.unitPrice || 0)), 0);

    return {
      success: true,
      data: {
        totalItems,
        lowStockItems,
        totalInventoryValue,
      },
      meta: null,
      error: null,
    };
  },
};
