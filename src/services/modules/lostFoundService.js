/**
 * Lost & Found Management Domain Service
 * Handles lost and found item posts, photo attachments, custodial storage,
 * claim verification workflows, and handover records.
 */

import { apiClient } from '../api/apiClient.js';
import { generateUniqueId, validateRequired } from '../models/index.js';
import { createErrorResponse } from '../api/responseEnvelope.js';

export const lostFoundService = {
  // ==========================================================================
  // 1. ITEM POSTS (LOST & FOUND)
  // ==========================================================================

  async getItems(params = {}) {
    return apiClient.get('/api/v1/lostfound/items', { params });
  },

  async getItemById(id) {
    return apiClient.get(`/api/v1/lostfound/items/${id}`);
  },

  async reportItem(itemData = {}) {
    const validation = validateRequired(itemData, [
      'type', // 'LOST' or 'FOUND'
      'title',
      'category',
      'location',
      'dateReported',
      'description',
    ]);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const payload = {
      id: generateUniqueId('LF'),
      status: itemData.type === 'FOUND' ? 'In Custody / Unclaimed' : 'Reported Lost',
      photoUrl: itemData.photoUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80',
      claimantDetails: null,
      ...itemData,
    };

    return apiClient.post('/api/v1/lostfound/items', payload);
  },

  async updateItem(id, itemData = {}) {
    return apiClient.put(`/api/v1/lostfound/items/${id}`, itemData);
  },

  async deleteItem(id) {
    return apiClient.delete(`/api/v1/lostfound/items/${id}`);
  },

  // ==========================================================================
  // 2. CLAIMS & HANDOVER VERIFICATION
  // ==========================================================================

  async submitClaim(itemId, claimData = {}) {
    const validation = validateRequired(claimData, [
      'claimantId',
      'claimantName',
      'proofDescription',
    ]);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const itemRes = await this.getItemById(itemId);
    if (!itemRes.success || !itemRes.data) return itemRes;

    const item = itemRes.data;
    item.status = 'Under Review';
    item.claimantDetails = {
      claimId: generateUniqueId('CLM'),
      claimDate: new Date().toISOString().split('T')[0],
      status: 'Under Review',
      ...claimData,
    };

    return apiClient.put(`/api/v1/lostfound/items/${itemId}`, item);
  },

  async verifyClaim(itemId, { status, reviewerNotes, verifiedBy }) {
    const itemRes = await this.getItemById(itemId);
    if (!itemRes.success || !itemRes.data) return itemRes;

    const item = itemRes.data;
    if (!item.claimantDetails) {
      return createErrorResponse('No pending claim on this item.');
    }

    item.claimantDetails.status = status; // 'Approved' | 'Rejected' | 'Proof Required'
    item.claimantDetails.reviewerNotes = reviewerNotes || '';
    item.claimantDetails.verifiedBy = verifiedBy || 'Security Custodian';

    if (status === 'Approved') {
      item.status = 'Claim Approved - Ready for Handover';
    } else if (status === 'Rejected') {
      item.status = 'In Custody / Unclaimed';
      item.claimantDetails = null;
    }

    return apiClient.put(`/api/v1/lostfound/items/${itemId}`, item);
  },

  async handoverItem(itemId, handoverData = {}) {
    const itemRes = await this.getItemById(itemId);
    if (!itemRes.success || !itemRes.data) return itemRes;

    const item = itemRes.data;
    item.status = 'Handed Over & Closed';
    item.handoverDetails = {
      handoverDate: new Date().toISOString(),
      handedOverBy: handoverData.custodianName || 'Security Officer',
      receivedBy: item.claimantDetails?.claimantName || handoverData.recipientName,
      remarks: handoverData.remarks || 'Proof of ownership verified and item returned.',
    };

    return apiClient.put(`/api/v1/lostfound/items/${itemId}`, item);
  },

  async getLostFoundStats() {
    const res = await this.getItems();
    const items = res.data || [];

    const totalLost = items.filter((i) => i.type === 'LOST').length;
    const totalFound = items.filter((i) => i.type === 'FOUND').length;
    const resolvedCount = items.filter((i) => i.status === 'Handed Over & Closed').length;
    const pendingClaims = items.filter((i) => i.status === 'Under Review').length;

    return {
      success: true,
      data: {
        totalLost,
        totalFound,
        resolvedCount,
        pendingClaims,
      },
      meta: null,
      error: null,
    };
  },
};
