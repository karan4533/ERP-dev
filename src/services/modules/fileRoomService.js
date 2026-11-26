/**
 * Physical File Room & Archives Domain Service
 * Handles custody of physical and digital records, 4-tier storage coordinates,
 * confidentiality classification, checkout chains, overdue evaluation,
 * file renaming, disposal workflows, access requisitions, and audit activities.
 */

import { apiClient } from '../api/apiClient.js';
import { mockAdapter } from '../api/mockAdapter.js';
import { validateRequired, createStorageLocation, CONFIDENTIALITY_TIERS } from '../models/index.js';
import { createSuccessResponse, createErrorResponse } from '../api/responseEnvelope.js';

const INITIAL_DISPOSALS_SEED = [
  {
    id: 'DISP-2026-001',
    fileId: 'FILE-2026-OLD-01',
    fileRefNo: 'FIN/AUDIT/2018-19/VOUCH-12',
    fileName: 'Financial Audit Vouchers & Cash Receipts (FY 2018-2019)',
    category: 'Financial Audit Registers, Ledgers & Vouchers',
    ownerDepartment: 'Finance',
    retentionRule: '3 Years Audit Clearance',
    disposalMethod: 'Shredding',
    scheduledDate: '2026-02-15',
    disposalDate: '2026-02-16',
    boardResolutionNo: 'BOM-RES-2026/44',
    authorizedBy: 'Dr. V. Thirunavukkarasu (Managing Director)',
    witnesses: 'K. Rajendran (Custodian), S. Meenakshi (Internal Auditor)',
    certificateNumber: 'CERT-DISP-2026-001',
    status: 'Completed',
    remarks: 'Industrial cross-cut shredding witnessed and certified per statutory archival guidelines.',
  },
  {
    id: 'DISP-2026-002',
    fileId: 'FILE-2026-OLD-02',
    fileRefNo: 'PROC/TENDER/2019/COMP-04',
    fileName: 'Campus Canteen Vendor Bids & Quotation Comparative Sheets (2019)',
    category: 'Procurement, Vendor Agreements & Contracts',
    ownerDepartment: 'Operations / Facilities',
    retentionRule: '5 Years Post-Graduation',
    disposalMethod: 'Incineration',
    scheduledDate: '2026-03-01',
    disposalDate: '2026-03-02',
    boardResolutionNo: 'BOM-RES-2026/52',
    authorizedBy: 'Dr. K. S. Sundaram (Joint Director)',
    witnesses: 'K. Rajendran (Custodian), M. Parthiban (Facilities Manager)',
    certificateNumber: 'CERT-DISP-2026-002',
    status: 'Completed',
    remarks: 'Eco-incineration executed post statutory retention timeline expiration.',
  },
];

const INITIAL_ACTIVITIES_SEED = [
  {
    id: 'ACT-FLR-001',
    timestamp: '2026-03-12T09:30:00Z',
    action: 'FILE_REGISTERED',
    fileRefNo: 'EXAM/CBSE/X/2026/TAB-01',
    fileName: 'CBSE Grade 10 Pre-Board Tabulation Dossier',
    actor: 'K. Rajendran (Custodian)',
    department: 'Academics',
    details: 'Physical dossier cataloged into Rack A, Shelf 01, Box 01.',
  },
  {
    id: 'ACT-FLR-002',
    timestamp: '2026-03-11T14:15:00Z',
    action: 'FILE_CHECKOUT',
    fileRefNo: 'LEGAL/CAMPUS/2026/DEED-01',
    fileName: 'Institutional Land Ownership Title Deeds',
    actor: 'R. Vijayaraghavan',
    department: 'Administration',
    details: 'Checked out for CBSE Land Ceiling Verification (MD Approved).',
  },
  {
    id: 'ACT-FLR-003',
    timestamp: '2026-03-10T11:45:00Z',
    action: 'FILE_RENAMED',
    fileRefNo: 'GOVT/AFFIL/2025/NOC-02',
    fileName: 'CBSE Senior Secondary Affiliation Renewal Dossier',
    actor: 'K. Rajendran (Custodian)',
    department: 'PRO',
    details: 'File renamed from "Draft Affiliation Papers" to official title.',
  },
  {
    id: 'ACT-FLR-004',
    timestamp: '2026-03-08T16:20:00Z',
    action: 'DISPOSAL_CERTIFIED',
    fileRefNo: 'FIN/AUDIT/2018-19/VOUCH-12',
    fileName: 'Financial Audit Vouchers & Cash Receipts (FY 2018-2019)',
    actor: 'Dr. V. Thirunavukkarasu (MD)',
    department: 'Finance',
    details: 'Disposal certificate CERT-DISP-2026-001 issued following shredding.',
  },
];

const INITIAL_ACCESS_REQUESTS_SEED = [
  {
    id: 'REQ-FLR-2026-001',
    fileId: 'FILE-2026-005',
    fileRefNo: 'LEGAL/CAMPUS/2026/DEED-01',
    fileName: 'Institutional Land Ownership Title Deeds, Patta & DTCP Approvals',
    category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    confidentiality: 'Strictly Confidential / MD Approval Only',
    requestedById: 'EMP-ADM-004',
    requestedByName: 'R. Vijayaraghavan',
    department: 'Administration',
    departmentHeadApprover: 'K. Narayanaswamy (Admin Head)',
    departmentHeadApprovalStatus: 'Approved',
    purpose: 'Annual statutory land ceiling verification for CBSE renewal',
    requestDate: '2026-03-01',
    status: 'Pending Approval',
    approvalRequired: 'Managing Director',
    approvedBy: null,
    approvalTimestamp: null,
    isReturnable: 'Returnable',
  },
  {
    id: 'REQ-FLR-2026-002',
    fileId: 'FILE-2026-001',
    fileRefNo: 'EXAM/CBSE/X/2025-26/TAB-01',
    fileName: 'Grade 10 CBSE Board Examination Tabulation Register',
    category: 'Examination Tabulation & Result Sheets',
    confidentiality: 'Executive Confidential (HOD / JD Sign-off)',
    requestedById: 'EMP-TCH-008',
    requestedByName: 'M. Anand',
    department: 'Academics',
    departmentHeadApprover: 'Dr. Aruna Ramesh (Academic Dean)',
    departmentHeadApprovalStatus: 'Approved',
    purpose: 'Cross-verifying subject average percentiles for term review',
    requestDate: '2026-03-08',
    status: 'Pending Approval',
    approvalRequired: 'Joint Director',
    approvedBy: null,
    approvalTimestamp: null,
    isReturnable: 'Returnable',
  },
  {
    id: 'REQ-FLR-2026-003',
    fileId: 'FILE-2026-002',
    fileRefNo: 'FIN/AUDIT/2024-25/LED-01',
    fileName: 'Statutory Financial Audit Day Book & General Ledger',
    category: 'Financial Audit Registers, Ledgers & Vouchers',
    confidentiality: 'Department Restricted',
    requestedById: 'EMP-FIN-019',
    requestedByName: 'S. Ramanathan',
    department: 'Finance',
    departmentHeadApprover: 'P. Sundaram (Finance Head)',
    departmentHeadApprovalStatus: 'Pending Dept Head',
    purpose: 'Quarterly balance reconciliation for External Auditor',
    requestDate: '2026-03-11',
    status: 'Pending Dept Head',
    approvalRequired: 'Department Head',
    approvedBy: null,
    approvalTimestamp: null,
    isReturnable: 'Returnable',
  },
];

const ensureStores = () => {
  if (mockAdapter && mockAdapter.stores) {
    if (!mockAdapter.stores['fileroom_disposals'] || mockAdapter.stores['fileroom_disposals'].length === 0) {
      mockAdapter.stores['fileroom_disposals'] = mockAdapter.loadStore('fileroom_disposals', INITIAL_DISPOSALS_SEED);
    }
    if (!mockAdapter.stores['fileroom_activities'] || mockAdapter.stores['fileroom_activities'].length === 0) {
      mockAdapter.stores['fileroom_activities'] = mockAdapter.loadStore('fileroom_activities', INITIAL_ACTIVITIES_SEED);
    }
    if (!mockAdapter.stores['fileroom_access_requests'] || mockAdapter.stores['fileroom_access_requests'].length === 0) {
      mockAdapter.stores['fileroom_access_requests'] = mockAdapter.loadStore('fileroom_access_requests', INITIAL_ACCESS_REQUESTS_SEED);
    }
  }
};

export const fileRoomService = {
  // ==========================================================================
  // 1. FILE MASTER REPOSITORY
  // ==========================================================================

  async getFiles(params = {}) {
    ensureStores();
    const res = await apiClient.get('/api/v1/fileroom/files', { params });
    if (!res.success || !Array.isArray(res.data)) {
      return res;
    }

    let files = res.data;

    // Filter by Date Range (fromDate, toDate) based on accessionDate or lastMovementDate or createdAt
    if (params.fromDate || params.toDate) {
      files = files.filter((f) => {
        const fileDate = f.accessionDate || f.lastMovementDate || f.createdAt?.split('T')[0] || '';
        if (!fileDate) return true;
        if (params.fromDate && fileDate < params.fromDate) return false;
        if (params.toDate && fileDate > params.toDate) return false;
        return true;
      });
    }

    // Filter by accessionDate exact match if provided
    if (params.accessionDate) {
      files = files.filter((f) => {
        const fileDate = f.accessionDate || f.lastMovementDate || f.createdAt?.split('T')[0] || '';
        return fileDate === params.accessionDate;
      });
    }

    // Filter out Student & Staff records if requested
    if (params.excludeStudentStaff) {
      const studentStaffCategories = [
        'Student Academic & Cumulative Records',
        'Student Transfer Certificates (TC) & Clearance Stubs',
        'Staff Dossiers, Service Books & Police Verifications',
      ];
      files = files.filter((f) => !studentStaffCategories.includes(f.category));
    }

    return createSuccessResponse(files, { total: files.length });
  },

  async getFileById(id) {
    return apiClient.get(`/api/v1/fileroom/files/${id}`);
  },

  /**
   * Directly registers a new physical file into master custody.
   * Standardizes 4-tier storage coordinates, confidentiality, and document attachments.
   */
  async registerFile(fileData = {}) {
    ensureStores();
    const validation = validateRequired(fileData, [
      'fileRefNo',
      'fileName',
      'category',
      'ownerDepartment',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const today = new Date().toISOString().split('T')[0];
    const payload = {
      ...fileData,
      storageLocation: createStorageLocation(fileData.storageLocation || {}),
      confidentiality: fileData.confidentiality || CONFIDENTIALITY_TIERS.STANDARD,
      currentLocationStatus: fileData.currentLocationStatus || 'In File Room',
      accessionDate: fileData.accessionDate || today,
      lastMovementDate: today,
      isReturnable: fileData.isReturnable ?? 'Returnable',
      attachment: fileData.attachment || null,
      heldByUserId: null,
      heldByUserName: null,
      heldByUserDept: null,
    };

    const res = await apiClient.post('/api/v1/fileroom/files', payload);
    if (res.success) {
      this.logActivity({
        action: 'FILE_REGISTERED',
        fileRefNo: res.data.fileRefNo,
        fileName: res.data.fileName,
        actor: fileData.registeredBy || 'File Room Custodian',
        department: res.data.ownerDepartment,
        details: `Physical file accessioned into ${res.data.storageLocation?.cupboardRack || 'Rack'}, ${res.data.storageLocation?.shelfLevel || 'Shelf'}.`,
      });
    }
    return res;
  },

  async updateFile(id, fileData = {}) {
    ensureStores();
    if (fileData.storageLocation) {
      fileData.storageLocation = createStorageLocation(fileData.storageLocation);
    }
    const res = await apiClient.put(`/api/v1/fileroom/files/${id}`, fileData);
    if (res.success) {
      this.logActivity({
        action: 'FILE_UPDATED',
        fileRefNo: res.data.fileRefNo,
        fileName: res.data.fileName,
        actor: fileData.updatedBy || 'File Room Custodian',
        department: res.data.ownerDepartment,
        details: `File metadata updated.`,
      });
    }
    return res;
  },

  /**
   * Renames a file in repository and updates active loans and activities.
   */
  async renameFile(id, newFileName) {
    ensureStores();
    if (!newFileName || typeof newFileName !== 'string' || newFileName.trim().length < 3) {
      return createErrorResponse('File name must be at least 3 characters.');
    }

    const trimmed = newFileName.trim();
    const filesCollection = mockAdapter.stores['fileroom_files'] || [];
    const file = filesCollection.find((f) => String(f.id) === String(id) || f.fileRefNo === id);
    if (!file) {
      return createErrorResponse(`File ${id} not found.`);
    }

    const oldName = file.fileName;
    file.fileName = trimmed;
    file.updatedAt = new Date().toISOString();
    mockAdapter.persistStore('fileroom_files');

    // Also sync active checkout register rows if any
    const outwardCollection = mockAdapter.stores['fileroom_outward'] || [];
    outwardCollection.forEach((item) => {
      if (String(item.fileId) === String(file.id) || item.fileRefNo === file.fileRefNo) {
        item.fileName = trimmed;
      }
    });
    mockAdapter.persistStore('fileroom_outward');

    this.logActivity({
      action: 'FILE_RENAMED',
      fileRefNo: file.fileRefNo,
      fileName: trimmed,
      actor: 'File Room Custodian',
      department: file.ownerDepartment,
      details: `Renamed from "${oldName}" to "${trimmed}".`,
    });

    return createSuccessResponse(file);
  },

  async deleteFile(id) {
    ensureStores();
    return apiClient.delete(`/api/v1/fileroom/files/${id}`);
  },

  // ==========================================================================
  // 2. INWARD COURIER / DEPOSIT REGISTER
  // ==========================================================================

  async getInwardRegister(params = {}) {
    return apiClient.get('/api/v1/fileroom/inward', { params });
  },

  async logInward(inwardData = {}) {
    ensureStores();
    const validation = validateRequired(inwardData, [
      'fileName',
      'receivedFrom',
      'department',
      'receivedByCustodian',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }
    const payload = {
      ...inwardData,
      inwardDate: inwardData.inwardDate || new Date().toISOString(),
      documentCount: Number(inwardData.documentCount) || 1,
      physicalCondition: inwardData.physicalCondition || 'Good',
    };
    const res = await apiClient.post('/api/v1/fileroom/inward', payload);
    if (res.success) {
      this.logActivity({
        action: 'INWARD_DEPOSIT',
        fileRefNo: res.data.fileRefNo || 'INW-NEW',
        fileName: res.data.fileName,
        actor: res.data.receivedByCustodian,
        department: res.data.department,
        details: `Received from ${res.data.receivedFrom}. Condition: ${res.data.physicalCondition}.`,
      });
    }
    return res;
  },

  // ==========================================================================
  // 3. OUTWARD CHECKOUT & BORROWING WORKFLOW
  // ==========================================================================

  async getOutwardRegister(params = {}) {
    ensureStores();
    return apiClient.get('/api/v1/fileroom/outward', { params });
  },

  /**
   * Initiates checkout request with confidentiality, returnable status, and acknowledgement attachment.
   */
  async requestCheckout(data = {}) {
    ensureStores();
    const checkoutData = {
      ...data,
      requestedById: data.requestedById || data.borrowerId || data.requestedByName || 'STAFF-001',
      requestedByName: data.requestedByName || data.borrowerName,
    };
    const validation = validateRequired(checkoutData, [
      'fileId',
      'requestedById',
      'requestedByName',
      'purpose',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const isNonReturnable = data.isReturnable === 'Non-Returnable' || data.isReturnable === false;
    const checkoutPayload = {
      ...data,
      isReturnable: isNonReturnable ? 'Non-Returnable' : 'Returnable',
      status: isNonReturnable ? 'Dispatched / Non-Returnable' : 'Issued',
      expectedReturnDate: isNonReturnable ? null : data.expectedReturnDate,
      departmentHeadApprover: data.departmentHeadApprover || 'Department Head',
      departmentHeadApprovalStatus: data.departmentHeadApprovalStatus || 'Approved',
      acknowledgementAttachment: data.acknowledgementAttachment || null,
    };

    const res = await apiClient.post('/api/v1/fileroom/checkout', checkoutPayload);
    if (res.success) {
      // If non-returnable, update outward status accordingly
      if (isNonReturnable && res.data?.issueRecord) {
        res.data.issueRecord.status = 'Dispatched / Non-Returnable';
        res.data.issueRecord.isReturnable = 'Non-Returnable';
        res.data.issueRecord.expectedReturnDate = null;
        res.data.issueRecord.acknowledgementAttachment = checkoutPayload.acknowledgementAttachment;
        res.data.issueRecord.departmentHeadApprover = checkoutPayload.departmentHeadApprover;
        res.data.issueRecord.departmentHeadApprovalStatus = checkoutPayload.departmentHeadApprovalStatus;
        mockAdapter.persistStore('fileroom_outward');

        const files = mockAdapter.stores['fileroom_files'] || [];
        const fileObj = files.find((f) => String(f.id) === String(data.fileId));
        if (fileObj) {
          fileObj.currentLocationStatus = 'Dispatched / Non-Returnable';
          mockAdapter.persistStore('fileroom_files');
        }
      } else if (res.data?.issueRecord) {
        res.data.issueRecord.isReturnable = 'Returnable';
        res.data.issueRecord.acknowledgementAttachment = checkoutPayload.acknowledgementAttachment;
        res.data.issueRecord.departmentHeadApprover = checkoutPayload.departmentHeadApprover;
        res.data.issueRecord.departmentHeadApprovalStatus = checkoutPayload.departmentHeadApprovalStatus;
        mockAdapter.persistStore('fileroom_outward');
      }

      this.logActivity({
        action: 'FILE_CHECKOUT',
        fileRefNo: res.data.file?.fileRefNo || 'ISS-FILE',
        fileName: res.data.file?.fileName || 'Physical File',
        actor: data.requestedByName,
        department: data.department || res.data.file?.ownerDepartment,
        details: isNonReturnable
          ? `Dispatched as Non-Returnable permanent issue to ${data.requestedByName}.`
          : `Issued to ${data.requestedByName}. Due: ${data.expectedReturnDate || '7 Days'}.`,
      });
    }
    return res;
  },

  /**
   * Processes file return, condition check, and restores archive status.
   */
  async returnPhysicalFile(issueId, data = {}) {
    ensureStores();
    const res = await apiClient.post(`/api/v1/fileroom/return/${issueId}`, data);
    if (res.success) {
      this.logActivity({
        action: 'FILE_RETURNED',
        fileRefNo: res.data.file?.fileRefNo || 'RET-FILE',
        fileName: res.data.file?.fileName || 'Physical File',
        actor: data.returnedBy || 'Borrowing Staff',
        department: res.data.file?.ownerDepartment,
        details: `Restored to archive. Condition: ${data.returnCondition || 'Good'}.`,
      });
    }
    return res;
  },

  /**
   * Evaluates all active issues for overdue status.
   */
  async checkOverdueFiles() {
    ensureStores();
    const res = await this.getOutwardRegister();
    if (!res.success || !Array.isArray(res.data)) return res;

    const today = new Date().toISOString().split('T')[0];
    const overdueIssues = res.data.filter((issue) => {
      // Non-returnable files cannot be overdue
      if (issue.isReturnable === 'Non-Returnable' || issue.status === 'Dispatched / Non-Returnable') {
        return false;
      }
      const isPastDue = Boolean(
        issue.expectedReturnDate &&
        issue.expectedReturnDate < today &&
        !issue.actualReturnDate
      );
      if (issue.status === 'Issued' && isPastDue) {
        issue.status = 'Overdue';
      }
      return issue.status === 'Overdue' || isPastDue;
    });

    return createSuccessResponse(overdueIssues, { total: overdueIssues.length });
  },

  // ==========================================================================
  // 4. ACCESS REQUISITIONS & MULTI-STAGE APPROVALS
  // ==========================================================================

  async getAccessRequests(params = {}) {
    ensureStores();
    let requests = mockAdapter.stores['fileroom_access_requests'] || [];
    if (params.status && params.status !== 'ALL') {
      requests = requests.filter((r) => r.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      requests = requests.filter(
        (r) =>
          r.fileName?.toLowerCase().includes(q) ||
          r.fileRefNo?.toLowerCase().includes(q) ||
          r.requestedByName?.toLowerCase().includes(q) ||
          r.department?.toLowerCase().includes(q)
      );
    }
    return createSuccessResponse(requests, { total: requests.length });
  },

  async createAccessRequest(requestData = {}) {
    ensureStores();
    const validation = validateRequired(requestData, [
      'fileRefNo',
      'fileName',
      'requestedByName',
      'department',
      'purpose',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const newRequest = {
      id: `REQ-FLR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      fileId: requestData.fileId || `FILE-${Math.floor(100 + Math.random() * 900)}`,
      fileRefNo: requestData.fileRefNo,
      fileName: requestData.fileName,
      category: requestData.category || 'General Administration',
      confidentiality: requestData.confidentiality || 'Standard / Public',
      requestedById: requestData.requestedById || requestData.staffId || 'EMP-REQ',
      requestedByName: requestData.requestedByName,
      department: requestData.department,
      departmentHeadApprover: requestData.departmentHeadApprover || 'Department Head',
      departmentHeadApprovalStatus: requestData.departmentHeadApprovalStatus || 'Pending Dept Head',
      purpose: requestData.purpose,
      requestDate: requestData.requestDate || new Date().toISOString().split('T')[0],
      status: requestData.status || (requestData.departmentHeadApprovalStatus === 'Approved' ? 'Pending Approval' : 'Pending Dept Head'),
      approvalRequired: requestData.approvalRequired || (requestData.confidentiality?.includes('MD') ? 'Managing Director' : 'Joint Director'),
      approvedBy: null,
      approvalTimestamp: null,
      isReturnable: requestData.isReturnable || 'Returnable',
      createdAt: new Date().toISOString(),
    };

    mockAdapter.stores['fileroom_access_requests'].unshift(newRequest);
    mockAdapter.persistStore('fileroom_access_requests');

    this.logActivity({
      action: 'REQUISITION_RAISED',
      fileRefNo: newRequest.fileRefNo,
      fileName: newRequest.fileName,
      actor: newRequest.requestedByName,
      department: newRequest.department,
      details: `Requisition submitted. Routed to Dept Head: ${newRequest.departmentHeadApprover}.`,
    });

    return createSuccessResponse(newRequest);
  },

  async updateAccessRequest(id, updateData = {}) {
    ensureStores();
    const requests = mockAdapter.stores['fileroom_access_requests'] || [];
    const index = requests.findIndex((r) => String(r.id) === String(id));
    if (index === -1) {
      return createErrorResponse(`Access request ${id} not found.`);
    }

    const updated = {
      ...requests[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    requests[index] = updated;
    mockAdapter.persistStore('fileroom_access_requests');

    this.logActivity({
      action: updated.status === 'Approved' ? 'REQUISITION_APPROVED' : 'REQUISITION_UPDATED',
      fileRefNo: updated.fileRefNo,
      fileName: updated.fileName,
      actor: updateData.approvedBy || 'Authorizing Officer',
      department: updated.department,
      details: `Requisition state updated to ${updated.status}.`,
    });

    return createSuccessResponse(updated);
  },

  // ==========================================================================
  // 5. ARCHIVAL DISPOSAL WORKFLOW & CERTIFICATES
  // ==========================================================================

  async getDisposals(params = {}) {
    ensureStores();
    let disposals = mockAdapter.stores['fileroom_disposals'] || [];
    if (params.status && params.status !== 'ALL') {
      disposals = disposals.filter((d) => d.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      disposals = disposals.filter(
        (d) =>
          d.fileName?.toLowerCase().includes(q) ||
          d.fileRefNo?.toLowerCase().includes(q) ||
          d.certificateNumber?.toLowerCase().includes(q) ||
          d.disposalMethod?.toLowerCase().includes(q)
      );
    }
    return createSuccessResponse(disposals, { total: disposals.length });
  },

  async scheduleDisposal(disposalData = {}) {
    ensureStores();
    const payload = { ...disposalData };
    if (payload.fileId || payload.fileRefNo) {
      const targetFile = (mockAdapter.stores['fileroom_files'] || []).find(
        (f) => (payload.fileId && String(f.id) === String(payload.fileId)) || (payload.fileRefNo && f.fileRefNo === payload.fileRefNo)
      );
      if (targetFile) {
        if (!payload.fileRefNo) payload.fileRefNo = targetFile.fileRefNo;
        if (!payload.fileName) payload.fileName = targetFile.fileName;
        if (!payload.category) payload.category = targetFile.category;
        if (!payload.ownerDepartment) payload.ownerDepartment = targetFile.ownerDepartment;
        if (!payload.retentionRule) payload.retentionRule = targetFile.retentionRule;

        if (targetFile.currentLocationStatus === 'Disposed / Destroyed' || targetFile.currentLocationStatus === 'Digitally Archived') {
          return createErrorResponse(`File ${targetFile.fileRefNo} is already disposed (Status: ${targetFile.currentLocationStatus}).`);
        }
        if (targetFile.retentionRule === 'Permanent Archival') {
          const isMdAuthorized = payload.authorizedBy && /Managing Director|MD|Dr\. V\. Thirunavukkarasu/i.test(payload.authorizedBy);
          if (!isMdAuthorized && !payload.permanentOverrideAuthorized) {
            return createErrorResponse('Disposal of Permanent Archival records requires explicit Managing Director authorization.');
          }
        }
      }
    }

    const validation = validateRequired(payload, [
      'fileRefNo',
      'fileName',
      'disposalMethod',
      'authorizedBy',
      'boardResolutionNo',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const certSeq = Math.floor(100 + Math.random() * 900);
    const certYear = new Date().getFullYear();
    const newDisposal = {
      id: `DISP-${certYear}-${certSeq}`,
      fileId: payload.fileId || `FILE-DISP-${certSeq}`,
      fileRefNo: payload.fileRefNo,
      fileName: payload.fileName,
      category: payload.category || 'General Administrative Records',
      ownerDepartment: payload.ownerDepartment || 'General Administration',
      retentionRule: payload.retentionRule || 'Archival Period Expired',
      disposalMethod: payload.disposalMethod, // Shredding, Incineration, Digital Archival Only, Secure Destruction
      scheduledDate: payload.scheduledDate || new Date().toISOString().split('T')[0],
      disposalDate: payload.disposalDate || new Date().toISOString().split('T')[0],
      boardResolutionNo: payload.boardResolutionNo,
      authorizedBy: payload.authorizedBy,
      witnesses: payload.witnesses || 'K. Rajendran (Custodian)',
      certificateNumber: `CERT-DISP-${certYear}-${certSeq}`,
      status: payload.status || 'Completed',
      remarks: payload.remarks || 'Archival disposal executed according to statutory retention schedule.',
      createdAt: new Date().toISOString(),
    };

    mockAdapter.stores['fileroom_disposals'].unshift(newDisposal);
    mockAdapter.persistStore('fileroom_disposals');

    // Update corresponding file status in fileroom_files
    const files = mockAdapter.stores['fileroom_files'] || [];
    const targetFile = files.find(
      (f) => String(f.id) === String(newDisposal.fileId) || f.fileRefNo === newDisposal.fileRefNo
    );
    if (targetFile) {
      targetFile.currentLocationStatus =
        newDisposal.disposalMethod === 'Digital Archival Only'
          ? 'Digitally Archived'
          : 'Disposed / Destroyed';
      targetFile.lastMovementDate = newDisposal.disposalDate;
      mockAdapter.persistStore('fileroom_files');
    }

    this.logActivity({
      action: 'DISPOSAL_CERTIFIED',
      fileRefNo: newDisposal.fileRefNo,
      fileName: newDisposal.fileName,
      actor: newDisposal.authorizedBy,
      department: newDisposal.ownerDepartment,
      details: `Disposal Certificate ${newDisposal.certificateNumber} generated via ${newDisposal.disposalMethod}. Resolution: ${newDisposal.boardResolutionNo}.`,
    });

    return createSuccessResponse(newDisposal);
  },

  async getDisposalCertificate(disposalId) {
    ensureStores();
    const disposals = mockAdapter.stores['fileroom_disposals'] || [];
    const item = disposals.find(
      (d) => String(d.id) === String(disposalId) || d.certificateNumber === disposalId
    );
    if (!item) {
      return createErrorResponse(`Disposal certificate ${disposalId} not found.`);
    }
    return createSuccessResponse(item);
  },

  // ==========================================================================
  // 6. ACTIVITIES & AUDIT REPORTING
  // ==========================================================================

  async getActivities(params = {}) {
    ensureStores();
    let activities = mockAdapter.stores['fileroom_activities'] || [];
    if (params.action && params.action !== 'ALL') {
      activities = activities.filter((a) => a.action === params.action);
    }
    if (params.department && params.department !== 'ALL') {
      activities = activities.filter((a) => a.department === params.department);
    }
    if (params.fromDate || params.toDate) {
      activities = activities.filter((a) => {
        const actDate = a.timestamp?.split('T')[0] || '';
        if (params.fromDate && actDate < params.fromDate) return false;
        if (params.toDate && actDate > params.toDate) return false;
        return true;
      });
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      activities = activities.filter(
        (a) =>
          a.fileName?.toLowerCase().includes(q) ||
          a.fileRefNo?.toLowerCase().includes(q) ||
          a.actor?.toLowerCase().includes(q) ||
          a.details?.toLowerCase().includes(q)
      );
    }
    return createSuccessResponse(activities, { total: activities.length });
  },

  logActivity(activityData = {}) {
    ensureStores();
    const newActivity = {
      id: `ACT-FLR-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString(),
      action: activityData.action || 'FILE_OPERATION',
      fileRefNo: activityData.fileRefNo || 'GENERAL',
      fileName: activityData.fileName || 'Archive Record',
      actor: activityData.actor || 'Custodian',
      department: activityData.department || 'Administration',
      details: activityData.details || '',
    };
    if (mockAdapter.stores['fileroom_activities']) {
      mockAdapter.stores['fileroom_activities'].unshift(newActivity);
      mockAdapter.persistStore('fileroom_activities');
    }
    return newActivity;
  },

  // ==========================================================================
  // 7. DASHBOARD STATS
  // ==========================================================================

  async getFileRoomStats() {
    ensureStores();
    const [filesRes, outwardRes, disposalsRes] = await Promise.all([
      this.getFiles(),
      this.getOutwardRegister(),
      this.getDisposals(),
    ]);

    const files = filesRes.data || [];
    const outward = outwardRes.data || [];
    const disposals = disposalsRes.data || [];

    const totalFiles = files.length;
    const checkedOutFiles = files.filter((f) => f.currentLocationStatus === 'Checked Out / Issued').length;
    const availableFiles = files.filter((f) => f.currentLocationStatus === 'In File Room').length;
    const strictlyConfidentialCount = files.filter((f) => f.confidentiality === CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL).length;
    const overdueCount = outward.filter((o) => o.status === 'Overdue').length;
    const totalDisposals = disposals.length;

    return createSuccessResponse({
      totalFiles,
      availableFiles,
      checkedOutFiles,
      strictlyConfidentialCount,
      overdueCount,
      totalDisposals,
    });
  },
};
