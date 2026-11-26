/**
 * Public Relations Officer (PRO) & Government Licensing Domain Service
 * Handles regulatory correspondence, board affiliations, statutory permits,
 * compliance calendar, government inspection tracking, ERP data handovers,
 * and daily work updates for PRO officers.
 */

import { apiClient } from '../api/apiClient.js';
import { mockAdapter } from '../api/mockAdapter.js';
import { validateRequired } from '../models/index.js';
import { createSuccessResponse, createErrorResponse } from '../api/responseEnvelope.js';

const INITIAL_ERP_HANDOVERS_SEED = [
  {
    id: 'HANDOVER-2026-001',
    batchId: 'ERP-BATCH-2026-01',
    date: '2026-03-10',
    dataCategory: 'Affiliation & Sanctioned Sections',
    description: 'CBSE Senior Secondary Affiliation Extension grant letter & approved section intake numbers for 2026-27.',
    handoverBy: 'R. Srinivasan (Senior PRO)',
    receivedBy: 'S. Sundaresan (ERP Technical Lead)',
    recordCount: 14,
    status: 'Imported',
    attachment: {
      fileName: 'CBSE_Affiliation_Extension_2026.pdf',
      fileSize: '2.4 MB',
      uploadedAt: '2026-03-10T10:30:00Z',
    },
    remarks: 'Imported into Master Academic Configuration tables. Grade 11/12 section limits updated.',
  },
  {
    id: 'HANDOVER-2026-002',
    batchId: 'ERP-BATCH-2026-02',
    date: '2026-03-12',
    dataCategory: 'Statutory Licensing & Fire NOC',
    description: 'Revised Building Safety & Fire NOC certificate numbers with validity periods for Transport and Facilities modules.',
    handoverBy: 'P. Meenakshi (PRO Officer)',
    receivedBy: 'A. Karthik (Senior ERP Analyst)',
    recordCount: 6,
    status: 'In Review',
    attachment: {
      fileName: 'Fire_NOC_Renewal_Approval_2026.pdf',
      fileSize: '1.8 MB',
      uploadedAt: '2026-03-12T14:15:00Z',
    },
    remarks: 'Awaiting schema field mapping for expiry alerts.',
  },
  {
    id: 'HANDOVER-2026-003',
    batchId: 'ERP-BATCH-2026-03',
    date: '2026-03-14',
    dataCategory: 'Government Approved Fee Structure',
    description: 'State Fee Determination Committee approved tuition & developmental fee caps for 2026-2027.',
    handoverBy: 'R. Srinivasan (Senior PRO)',
    receivedBy: 'S. Sundaresan (ERP Technical Lead)',
    recordCount: 32,
    status: 'Submitted',
    attachment: {
      fileName: 'Fee_Determination_Order_2026-27.pdf',
      fileSize: '3.1 MB',
      uploadedAt: '2026-03-14T09:45:00Z',
    },
    remarks: 'Queued for import into Fee Management Heads module.',
  },
];

const INITIAL_DAILY_UPDATES_SEED = [
  {
    id: 'DWU-2026-001',
    date: '2026-03-12',
    officerId: 'PRO-EMP-01',
    officerName: 'R. Srinivasan (Senior PRO)',
    authoritiesVisited: ['District Educational Office (DEO)', 'Directorate of School Education (DSE)'],
    licensingMatter: 'CBSE Higher Secondary Recognition Renewal Inspection Schedule',
    meetingSummary: 'Met CEO Dr. M. Krishnan regarding composite recognition renewal file. Inspection panel scheduled for March 28.',
    documentsHandled: 'Submitted Land Ownership Patta, DTCP blueprint copy, and staff qualification muster.',
    nextFollowUpDate: '2026-03-24',
    status: 'Pending Follow-up',
    remarks: 'CEO advised physical lab preparedness inspection prior to panel visit.',
  },
  {
    id: 'DWU-2026-002',
    date: '2026-03-11',
    officerId: 'PRO-EMP-02',
    officerName: 'P. Meenakshi (PRO Officer)',
    authoritiesVisited: ['Tamil Nadu Fire & Rescue Services', 'Municipal Corporation'],
    licensingMatter: 'Annual Fire Safety Certificate Renewal & High-Rise Clearance',
    meetingSummary: 'Conducted joint site walkthrough with Divisional Fire Officer. Verified 12 hose reels and 2 dedicated sump pumps.',
    documentsHandled: 'Received satisfactory inspection report copy; NOC certificate issuance scheduled for Friday.',
    nextFollowUpDate: '2026-03-15',
    status: 'Completed',
    remarks: 'All 4 campus blocks certified compliant under NBC Part IV.',
  },
  {
    id: 'DWU-2026-003',
    date: '2026-03-09',
    officerId: 'PRO-EMP-01',
    officerName: 'R. Srinivasan (Senior PRO)',
    authoritiesVisited: ['Regional Transport Office (RTO)'],
    licensingMatter: 'School Bus Fitness Certificate (FC) & Speed Governor Endorsements',
    meetingSummary: 'Met Motor Vehicle Inspector regarding 8 school buses due for annual fitness inspection.',
    documentsHandled: 'Submitted chassis telemetry reports, emergency exit photos, and GPS certificates.',
    nextFollowUpDate: '2026-03-18',
    status: 'In Progress',
    remarks: 'Buses 1 to 4 passed. Buses 5 to 8 slotted for physical brake testing on 18th.',
  },
];

const ensureProStores = () => {
  if (mockAdapter && mockAdapter.stores) {
    if (!mockAdapter.stores['pro_erp_handovers'] || mockAdapter.stores['pro_erp_handovers'].length === 0) {
      mockAdapter.stores['pro_erp_handovers'] = mockAdapter.loadStore('pro_erp_handovers', INITIAL_ERP_HANDOVERS_SEED);
    }
    if (!mockAdapter.stores['pro_daily_updates'] || mockAdapter.stores['pro_daily_updates'].length === 0) {
      mockAdapter.stores['pro_daily_updates'] = mockAdapter.loadStore('pro_daily_updates', INITIAL_DAILY_UPDATES_SEED);
    }
  }
};

export const proService = {
  // ==========================================================================
  // 1. GOVERNMENT CORRESPONDENCE
  // ==========================================================================

  async getCorrespondence(params = {}) {
    return apiClient.get('/api/v1/pro/correspondence', { params });
  },

  async getCorrespondenceById(id) {
    return apiClient.get(`/api/v1/pro/correspondence/${id}`);
  },

  async createCorrespondence(data) {
    const validation = validateRequired(data, [
      'direction',
      'referenceNumber',
      'subject',
      'governmentDepartment',
      'receivedOrDispatchedDate',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }
    return apiClient.post('/api/v1/pro/correspondence', data);
  },

  async updateCorrespondence(id, data) {
    return apiClient.put(`/api/v1/pro/correspondence/${id}`, data);
  },

  async deleteCorrespondence(id) {
    return apiClient.delete(`/api/v1/pro/correspondence/${id}`);
  },

  // ==========================================================================
  // 2. INSTITUTIONAL AFFILIATIONS & RECOGNITION
  // ==========================================================================

  async getAffiliations(params = {}) {
    return apiClient.get('/api/v1/pro/affiliations', { params });
  },

  async getAffiliationById(id) {
    return apiClient.get(`/api/v1/pro/affiliations/${id}`);
  },

  async createAffiliation(data) {
    const validation = validateRequired(data, [
      'boardAuthority',
      'affiliationCode',
      'sanctionedGrades',
      'validityStartDate',
      'validityEndDate',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }
    return apiClient.post('/api/v1/pro/affiliations', data);
  },

  async updateAffiliation(id, data) {
    return apiClient.put(`/api/v1/pro/affiliations/${id}`, data);
  },

  // ==========================================================================
  // 3. STATUTORY PERMITS & NOCs
  // ==========================================================================

  async getPermits(params = {}) {
    return apiClient.get('/api/v1/pro/permits', { params });
  },

  async getPermitById(id) {
    return apiClient.get(`/api/v1/pro/permits/${id}`);
  },

  async createPermit(data) {
    const validation = validateRequired(data, [
      'permitType',
      'permitNumber',
      'issuingAuthority',
      'issueDate',
      'expiryDate',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }
    return apiClient.post('/api/v1/pro/permits', data);
  },

  async updatePermit(id, data) {
    return apiClient.put(`/api/v1/pro/permits/${id}`, data);
  },

  async renewPermit(id, renewalData = {}) {
    return apiClient.patch(`/api/v1/pro/permits/${id}`, {
      status: 'Renewal In-Progress',
      ...renewalData,
      lastRenewalInitiatedDate: new Date().toISOString().split('T')[0],
    });
  },

  // ==========================================================================
  // 4. GOVERNMENT INSPECTIONS
  // ==========================================================================

  async getInspections(params = {}) {
    return apiClient.get('/api/v1/pro/inspections', { params });
  },

  async getInspectionById(id) {
    return apiClient.get(`/api/v1/pro/inspections/${id}`);
  },

  async createInspection(data) {
    const validation = validateRequired(data, [
      'inspectionDate',
      'inspectingBody',
      'purpose',
      'status',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }
    return apiClient.post('/api/v1/pro/inspections', data);
  },

  async updateInspection(id, data) {
    return apiClient.put(`/api/v1/pro/inspections/${id}`, data);
  },

  // ==========================================================================
  // 5. PRO TEAM GIVEN DATA FOR ERP TEAM (ERP DATA HANDOVERS)
  // ==========================================================================

  async getErpHandovers(params = {}) {
    ensureProStores();
    let handovers = mockAdapter.stores['pro_erp_handovers'] || [];
    if (params.status && params.status !== 'ALL') {
      handovers = handovers.filter((h) => h.status === params.status);
    }
    if (params.dataCategory && params.dataCategory !== 'ALL') {
      handovers = handovers.filter((h) => h.dataCategory === params.dataCategory);
    }
    if (params.fromDate || params.toDate) {
      handovers = handovers.filter((h) => {
        const itemDate = h.date || '';
        if (params.fromDate && itemDate < params.fromDate) return false;
        if (params.toDate && itemDate > params.toDate) return false;
        return true;
      });
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      handovers = handovers.filter(
        (h) =>
          h.batchId?.toLowerCase().includes(q) ||
          h.description?.toLowerCase().includes(q) ||
          h.dataCategory?.toLowerCase().includes(q) ||
          h.handoverBy?.toLowerCase().includes(q) ||
          h.receivedBy?.toLowerCase().includes(q)
      );
    }
    return createSuccessResponse(handovers, { total: handovers.length });
  },

  async getErpHandoverById(id) {
    ensureProStores();
    const handovers = mockAdapter.stores['pro_erp_handovers'] || [];
    const item = handovers.find((h) => String(h.id) === String(id) || h.batchId === id);
    if (!item) {
      return createErrorResponse(`ERP handover batch ${id} not found.`);
    }
    return createSuccessResponse(item);
  },

  async createErpHandover(data = {}) {
    ensureProStores();
    const validation = validateRequired(data, [
      'dataCategory',
      'description',
      'handoverBy',
      'receivedBy',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const year = new Date().getFullYear();
    const seq = Math.floor(10 + Math.random() * 90);
    const newHandover = {
      id: `HANDOVER-${year}-${seq}`,
      batchId: data.batchId || `ERP-BATCH-${year}-${seq}`,
      date: data.date || new Date().toISOString().split('T')[0],
      dataCategory: data.dataCategory,
      description: data.description,
      handoverBy: data.handoverBy,
      receivedBy: data.receivedBy,
      recordCount: Number(data.recordCount) || 1,
      status: data.status || 'Submitted',
      attachment: data.attachment || null,
      remarks: data.remarks || '',
      revisionNotes: data.revisionNotes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockAdapter.stores['pro_erp_handovers'].unshift(newHandover);
    mockAdapter.persistStore('pro_erp_handovers');
    return createSuccessResponse(newHandover);
  },

  async updateErpHandover(id, data = {}) {
    ensureProStores();
    const VALID_HANDOVER_STATUSES = ['Submitted', 'In Review', 'Imported', 'Verified', 'Returned for Revision'];
    if (data.status && !VALID_HANDOVER_STATUSES.includes(data.status)) {
      return createErrorResponse(
        `Invalid handover status: '${data.status}'. Permissible statuses: ${VALID_HANDOVER_STATUSES.join(', ')}`
      );
    }

    const handovers = mockAdapter.stores['pro_erp_handovers'] || [];
    const index = handovers.findIndex((h) => String(h.id) === String(id) || h.batchId === id);
    if (index === -1) {
      return createErrorResponse(`ERP handover batch ${id} not found.`);
    }

    const updated = {
      ...handovers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    handovers[index] = updated;
    mockAdapter.persistStore('pro_erp_handovers');
    return createSuccessResponse(updated);
  },

  async deleteErpHandover(id) {
    ensureProStores();
    const handovers = mockAdapter.stores['pro_erp_handovers'] || [];
    const index = handovers.findIndex((h) => String(h.id) === String(id) || h.batchId === id);
    if (index === -1) {
      return createErrorResponse(`ERP handover batch ${id} not found.`);
    }
    const removed = handovers.splice(index, 1)[0];
    mockAdapter.persistStore('pro_erp_handovers');
    return createSuccessResponse(removed);
  },

  // ==========================================================================
  // 6. DAILY WORK UPDATES
  // ==========================================================================

  async getDailyWorkUpdates(params = {}) {
    ensureProStores();
    let updates = mockAdapter.stores['pro_daily_updates'] || [];
    if (params.officer && params.officer !== 'ALL') {
      updates = updates.filter(
        (u) => u.officerId === params.officer || u.officerName.includes(params.officer)
      );
    }
    if (params.authority && params.authority !== 'ALL') {
      updates = updates.filter((u) => {
        if (Array.isArray(u.authoritiesVisited)) {
          return u.authoritiesVisited.some((a) => a.includes(params.authority));
        }
        return String(u.authoritiesVisited).includes(params.authority);
      });
    }
    if (params.status && params.status !== 'ALL') {
      updates = updates.filter((u) => u.status === params.status);
    }
    if (params.fromDate || params.toDate) {
      updates = updates.filter((u) => {
        const itemDate = u.date || '';
        if (params.fromDate && itemDate < params.fromDate) return false;
        if (params.toDate && itemDate > params.toDate) return false;
        return true;
      });
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      updates = updates.filter(
        (u) =>
          u.officerName?.toLowerCase().includes(q) ||
          u.licensingMatter?.toLowerCase().includes(q) ||
          u.meetingSummary?.toLowerCase().includes(q) ||
          u.documentsHandled?.toLowerCase().includes(q) ||
          (Array.isArray(u.authoritiesVisited)
            ? u.authoritiesVisited.join(' ').toLowerCase().includes(q)
            : String(u.authoritiesVisited).toLowerCase().includes(q))
      );
    }
    return createSuccessResponse(updates, { total: updates.length });
  },

  async getDailyWorkUpdateById(id) {
    ensureProStores();
    const updates = mockAdapter.stores['pro_daily_updates'] || [];
    const item = updates.find((u) => String(u.id) === String(id));
    if (!item) {
      return createErrorResponse(`Daily work update ${id} not found.`);
    }
    return createSuccessResponse(item);
  },

  async createDailyWorkUpdate(data = {}) {
    ensureProStores();
    const validation = validateRequired(data, [
      'date',
      'officerName',
      'authoritiesVisited',
      'licensingMatter',
      'meetingSummary',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const year = new Date().getFullYear();
    const seq = Math.floor(100 + Math.random() * 900);
    const newUpdate = {
      id: `DWU-${year}-${seq}`,
      date: data.date,
      officerId: data.officerId || 'PRO-EMP-01',
      officerName: data.officerName,
      authoritiesVisited: Array.isArray(data.authoritiesVisited)
        ? data.authoritiesVisited
        : [data.authoritiesVisited],
      licensingMatter: data.licensingMatter,
      meetingSummary: data.meetingSummary,
      documentsHandled: data.documentsHandled || 'General documentation',
      nextFollowUpDate: data.nextFollowUpDate || null,
      status: data.status || 'Completed',
      remarks: data.remarks || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockAdapter.stores['pro_daily_updates'].unshift(newUpdate);
    mockAdapter.persistStore('pro_daily_updates');
    return createSuccessResponse(newUpdate);
  },

  async updateDailyWorkUpdate(id, data = {}) {
    ensureProStores();
    const updates = mockAdapter.stores['pro_daily_updates'] || [];
    const index = updates.findIndex((u) => String(u.id) === String(id));
    if (index === -1) {
      return createErrorResponse(`Daily work update ${id} not found.`);
    }

    const updated = {
      ...updates[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    updates[index] = updated;
    mockAdapter.persistStore('pro_daily_updates');
    return createSuccessResponse(updated);
  },

  async deleteDailyWorkUpdate(id) {
    ensureProStores();
    const updates = mockAdapter.stores['pro_daily_updates'] || [];
    const index = updates.findIndex((u) => String(u.id) === String(id));
    if (index === -1) {
      return createErrorResponse(`Daily work update ${id} not found.`);
    }
    const removed = updates.splice(index, 1)[0];
    mockAdapter.persistStore('pro_daily_updates');
    return createSuccessResponse(removed);
  },

  // ==========================================================================
  // 7. COMPLIANCE CALENDAR & SUMMARY STATS
  // ==========================================================================

  async getComplianceCalendar(params = {}) {
    const [corrRes, permitRes, inspRes] = await Promise.all([
      this.getCorrespondence(params),
      this.getPermits(params),
      this.getInspections(params),
    ]);

    const calendarItems = [];

    if (corrRes.success && Array.isArray(corrRes.data)) {
      corrRes.data.forEach((c) => {
        if (c.statutoryDeadline) {
          calendarItems.push({
            id: `CAL-CORR-${c.id}`,
            title: `Statutory Deadline: ${c.subject}`,
            date: c.statutoryDeadline,
            type: 'Correspondence',
            department: c.governmentDepartment,
            status: c.complianceStatus,
            priority: c.escalationLevel === 'Critical Escalated to JD/MD' ? 'Critical' : 'Normal',
            refId: c.id,
          });
        }
      });
    }

    if (permitRes.success && Array.isArray(permitRes.data)) {
      permitRes.data.forEach((p) => {
        if (p.expiryDate) {
          calendarItems.push({
            id: `CAL-PERMIT-${p.id}`,
            title: `Permit Expiry: ${p.permitType}`,
            date: p.expiryDate,
            type: 'Permit Renewal',
            department: p.issuingAuthority,
            status: p.status,
            priority: p.status === 'Renewal Due' ? 'Urgent' : 'Normal',
            refId: p.id,
          });
        }
      });
    }

    if (inspRes.success && Array.isArray(inspRes.data)) {
      inspRes.data.forEach((i) => {
        calendarItems.push({
          id: `CAL-INSP-${i.id}`,
          title: `Inspection: ${i.inspectingBody}`,
          date: i.inspectionDate,
          type: 'Government Inspection',
          department: i.inspectingBody,
          status: i.status,
          priority: i.status === 'Action Required' ? 'Urgent' : 'Normal',
          refId: i.id,
        });
      });
    }

    // Sort by date ascending
    calendarItems.sort((a, b) => new Date(a.date) - new Date(b.date));
    return createSuccessResponse(calendarItems, { total: calendarItems.length });
  },

  async getComplianceStats() {
    ensureProStores();
    const [corr, permits, inspections, handovers, dailyUpdates] = await Promise.all([
      this.getCorrespondence(),
      this.getPermits(),
      this.getInspections(),
      this.getErpHandovers(),
      this.getDailyWorkUpdates(),
    ]);

    const pendingCorr = (corr.data || []).filter((c) => c.complianceStatus !== 'Complied & Closed').length;
    const renewalDuePermits = (permits.data || []).filter((p) => p.status === 'Renewal Due' || p.status === 'Renewal In-Progress').length;
    const actionRequiredInspections = (inspections.data || []).filter((i) => i.status === 'Action Required').length;
    const pendingHandovers = (handovers.data || []).filter((h) => h.status === 'Submitted' || h.status === 'In Review').length;
    const pendingDailyVisits = (dailyUpdates.data || []).filter((d) => d.status === 'Pending Follow-up').length;

    return createSuccessResponse({
      totalCorrespondence: corr.data?.length || 0,
      pendingCorrespondence: pendingCorr,
      activePermits: (permits.data || []).filter((p) => p.status === 'Valid').length,
      permitsNeedingAttention: renewalDuePermits,
      totalInspections: inspections.data?.length || 0,
      actionRequiredInspections,
      totalErpHandovers: handovers.data?.length || 0,
      pendingErpHandovers: pendingHandovers,
      totalDailyUpdates: dailyUpdates.data?.length || 0,
      pendingDailyVisits,
    });
  },
};
