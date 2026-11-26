/**
 * Central Fee Collection & Fee Audit Domain Service
 * Handles fee heads, invoicing, collection, receipts, partial payments,
 * concessions, end-to-end refund workflows, and fee audit logs.
 */

import { apiClient } from '../api/apiClient.js';
import { generateUniqueId, validateRequired, REFUND_STATUS } from '../models/index.js';
import { createErrorResponse } from '../api/responseEnvelope.js';

export const feeService = {
  // ==========================================================================
  // 1. FEE HEADS & STRUCTURES
  // ==========================================================================

  async getFeeHeads(params = {}) {
    return apiClient.get('/api/v1/fees/heads', { params });
  },

  async createFeeHead(data) {
    const validation = validateRequired(data, ['code', 'name', 'defaultAmount', 'category']);
    if (!validation.valid) return createErrorResponse(validation.errors);
    return apiClient.post('/api/v1/fees/heads', data);
  },

  // ==========================================================================
  // 2. INVOICES & STUDENT FEE LEDGER
  // ==========================================================================

  async getInvoices(params = {}) {
    return apiClient.get('/api/v1/fees/invoices', { params });
  },

  async getInvoiceById(id) {
    return apiClient.get(`/api/v1/fees/invoices/${id}`);
  },

  async getStudentLedger(studentId) {
    const invRes = await this.getInvoices();
    if (!invRes.success || !Array.isArray(invRes.data)) return invRes;

    const studentInvoices = invRes.data.filter((inv) => inv.studentId === studentId);
    const totalInvoiced = studentInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const totalPaid = studentInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const totalBalance = studentInvoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

    return {
      success: true,
      data: {
        studentId,
        invoices: studentInvoices,
        totalInvoiced,
        totalPaid,
        totalBalance,
      },
      meta: { total: studentInvoices.length },
      error: null,
    };
  },

  async createInvoice(invoiceData) {
    const validation = validateRequired(invoiceData, ['studentId', 'totalAmount', 'items']);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const payload = {
      invoiceNumber: `INV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      paidAmount: 0,
      balanceAmount: Number(invoiceData.totalAmount),
      status: 'Pending',
      receipts: [],
      ...invoiceData,
    };
    return apiClient.post('/api/v1/fees/invoices', payload);
  },

  // ==========================================================================
  // 3. PAYMENT COLLECTION & RECEIPTS (FULL & PARTIAL)
  // ==========================================================================

  async getPayments(params = {}) {
    return apiClient.get('/api/v1/fees/payments', { params });
  },

  async recordPayment(paymentData = {}) {
    const validation = validateRequired(paymentData, [
      'invoiceId',
      'studentId',
      'amount',
      'paymentMethod',
    ]);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const invRes = await this.getInvoiceById(paymentData.invoiceId);
    if (!invRes.success || !invRes.data) return invRes;

    const invoice = invRes.data;
    const paidAmt = Number(paymentData.amount);
    const newPaidTotal = (invoice.paidAmount || 0) + paidAmt;
    const newBalance = Math.max(0, invoice.totalAmount - (invoice.concessionAmount || 0) - newPaidTotal);

    const receipt = {
      id: generateUniqueId('REC'),
      receiptNumber: `REC/${new Date().getFullYear()}/${Math.floor(5000 + Math.random() * 5000)}`,
      invoiceId: invoice.id,
      studentId: paymentData.studentId,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      amount: paidAmt,
      paymentMethod: paymentData.paymentMethod,
      transactionRef: paymentData.transactionRef || generateUniqueId('TX'),
      collectedBy: paymentData.collectedBy || 'Cashier',
      status: 'Cleared',
    };

    // Update invoice status
    invoice.paidAmount = newPaidTotal;
    invoice.balanceAmount = newBalance;
    invoice.status = newBalance === 0 ? 'Paid' : 'Partially Paid';
    invoice.receipts = [...(invoice.receipts || []), receipt.id];

    await apiClient.put(`/api/v1/fees/invoices/${invoice.id}`, invoice);
    await apiClient.post('/api/v1/fees/payments', receipt);

    return {
      success: true,
      data: { invoice, receipt },
      meta: null,
      error: null,
    };
  },

  async applyConcession({ invoiceId, concessionAmount, concessionType, approvedBy, remarks }) {
    const invRes = await this.getInvoiceById(invoiceId);
    if (!invRes.success || !invRes.data) return invRes;

    const invoice = invRes.data;
    invoice.concessionAmount = (invoice.concessionAmount || 0) + Number(concessionAmount);
    invoice.concessionDetails = {
      type: concessionType || 'Merit Scholarship',
      amount: Number(concessionAmount),
      approvedBy: approvedBy || 'Principal',
      remarks: remarks || '',
    };
    invoice.balanceAmount = Math.max(0, invoice.totalAmount - invoice.concessionAmount - (invoice.paidAmount || 0));
    if (invoice.balanceAmount === 0 && invoice.paidAmount > 0) {
      invoice.status = 'Paid';
    }

    return apiClient.put(`/api/v1/fees/invoices/${invoice.id}`, invoice);
  },

  // ==========================================================================
  // 4. FEE REFUND WORKFLOW
  // ==========================================================================

  async getRefundRequests(params = {}) {
    return apiClient.get('/api/v1/fees/refunds', { params });
  },

  async requestRefund(refundData = {}) {
    return apiClient.post('/api/v1/fees/refunds/request', refundData);
  },

  async approveRefund(refundId, approvalData = {}) {
    return apiClient.post(`/api/v1/fees/refunds/${refundId}/approve`, approvalData);
  },

  async issueRefundVoucher(refundId, voucherData = {}) {
    return apiClient.post(`/api/v1/fees/refunds/${refundId}/approve`, {
      ...voucherData,
      nextStatus: REFUND_STATUS.DISBURSED,
      approverRole: 'Finance Disbursement Officer',
    });
  },

  // ==========================================================================
  // 5. AUDIT & ANALYTICS
  // ==========================================================================

  async getFeeAuditLogs(params = {}) {
    const [invRes, payRes, refRes] = await Promise.all([
      this.getInvoices(params),
      this.getPayments(params),
      this.getRefundRequests(params),
    ]);

    const invoices = invRes.data || [];
    const payments = payRes.data || [];
    const refunds = refRes.data || [];

    const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalConcessions = invoices.reduce((acc, i) => acc + (i.concessionAmount || 0), 0);
    const totalRefunded = refunds.filter((r) => r.status === 'Disbursed').reduce((acc, r) => acc + (r.refundAmount || 0), 0);
    const netCollection = totalCollected - totalRefunded;

    return {
      success: true,
      data: {
        totalCollected,
        totalConcessions,
        totalRefunded,
        netCollection,
        totalInvoices: invoices.length,
        totalPayments: payments.length,
        totalRefundRequests: refunds.length,
      },
      meta: null,
      error: null,
    };
  },
};
