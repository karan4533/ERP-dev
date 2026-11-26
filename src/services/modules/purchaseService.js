/**
 * Stores & Procurement / Purchase Order Domain Service
 * Handles material requisitions, 3-vendor comparative evaluations,
 * PO generation with tax/GST calculations, and Finance liability integration.
 */

import { apiClient } from '../api/apiClient.js';
import { generateUniqueId, validateRequired, calculateGst, PO_STATUS } from '../models/index.js';
import { createErrorResponse } from '../api/responseEnvelope.js';

export const purchaseService = {
  // ==========================================================================
  // 1. MATERIAL REQUISITIONS
  // ==========================================================================

  async getRequisitions(params = {}) {
    return apiClient.get('/api/v1/purchase/requisitions', { params });
  },

  async createRequisition(reqData = {}) {
    const validation = validateRequired(reqData, ['department', 'requestedBy', 'items']);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const payload = {
      id: generateUniqueId('REQ-STORE'),
      status: 'Pending Quotation',
      createdAt: new Date().toISOString().split('T')[0],
      ...reqData,
    };
    return apiClient.post('/api/v1/purchase/requisitions', payload);
  },

  // ==========================================================================
  // 2. COMPARATIVE VENDOR QUOTATIONS
  // ==========================================================================

  async getComparativeQuotes(params = {}) {
    return apiClient.get('/api/v1/purchase/quotes', { params });
  },

  /**
   * Submits comparative vendor evaluations. Enforces minimum 3 quotes policy.
   */
  async submitComparativeQuotes(quoteData = {}) {
    const { requisitionId, quotes, selectedVendorId, selectionJustification } = quoteData;
    if (!requisitionId || !Array.isArray(quotes) || quotes.length < 3) {
      return createErrorResponse('Procurement policy requires a minimum of 3 comparative vendor quotes.');
    }
    if (!selectedVendorId || !selectionJustification) {
      return createErrorResponse('Selected vendor and selection justification are required.');
    }

    const payload = {
      id: generateUniqueId('COMP-QUOTE'),
      requisitionId,
      quotes,
      selectedVendorId,
      selectionJustification,
      evaluationDate: new Date().toISOString().split('T')[0],
    };

    return apiClient.post('/api/v1/purchase/quotes', payload);
  },

  // ==========================================================================
  // 3. PURCHASE ORDER GENERATION & FINANCE INTEGRATION
  // ==========================================================================

  async getPurchaseOrders(params = {}) {
    return apiClient.get('/api/v1/purchase/pos', { params });
  },

  async getPurchaseOrderById(id) {
    return apiClient.get(`/api/v1/purchase/pos/${id}`);
  },

  /**
   * Creates a new Purchase Order draft with itemized GST calculations.
   */
  async createPurchaseOrder(poData = {}) {
    const validation = validateRequired(poData, ['vendorId', 'vendorName', 'lineItems']);
    if (!validation.valid) return createErrorResponse(validation.errors);

    // Calculate itemized totals and GST
    let subtotal = 0;
    let totalGst = 0;

    const calculatedLineItems = (poData.lineItems || []).map((item) => {
      const itemSubtotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
      const gstCalc = calculateGst(itemSubtotal, item.gstPercent || 18);
      subtotal += gstCalc.baseAmount;
      totalGst += gstCalc.gstAmount;
      return {
        ...item,
        subtotal: gstCalc.baseAmount,
        gstPercent: gstCalc.gstRatePercent,
        gstAmount: gstCalc.gstAmount,
        total: gstCalc.totalAmount,
      };
    });

    const grandTotal = Number((subtotal + totalGst).toFixed(2));

    const payload = {
      id: generateUniqueId('PO'),
      poNumber: `PO/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      orderDate: new Date().toISOString().split('T')[0],
      status: PO_STATUS.PENDING_APPROVAL,
      lineItems: calculatedLineItems,
      subtotal,
      totalGst,
      grandTotal,
      linkedFinanceLiabilityVoucherId: null,
      ...poData,
    };

    return apiClient.post('/api/v1/purchase/pos', payload);
  },

  /**
   * Approves PO and automatically generates Accounts Payable Liability in Finance.
   */
  async approvePurchaseOrder(poId, approvalData = {}) {
    return apiClient.post(`/api/v1/purchase/pos/${poId}/approve`, approvalData);
  },

  async getFinanceLiabilities(params = {}) {
    return apiClient.get('/api/v1/purchase/liabilities', { params });
  },

  async getPurchaseStats() {
    const [posRes, reqRes] = await Promise.all([
      this.getPurchaseOrders(),
      this.getRequisitions(),
    ]);

    const pos = posRes.data || [];
    const requisitions = reqRes.data || [];

    const totalSpend = pos.reduce((acc, p) => acc + (p.grandTotal || 0), 0);
    const approvedPos = pos.filter((p) => p.status === 'Approved').length;
    const pendingPos = pos.filter((p) => p.status === 'Pending Approval').length;

    return {
      success: true,
      data: {
        totalPurchaseOrders: pos.length,
        approvedPos,
        pendingPos,
        totalSpend,
        totalRequisitions: requisitions.length,
      },
      meta: null,
      error: null,
    };
  },
};
