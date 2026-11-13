/**
 * Mock Service Adapter & In-Memory / LocalStorage Persistence Engine
 * Routes API requests through local mock data stores with realistic CRUD,
 * filtering, sorting, pagination, and multi-module workflow integration.
 */

import {
  INITIAL_PRO_DATA,
  INITIAL_FILE_ROOM_DATA,
  INITIAL_CCTV_DATA,
  INITIAL_HOSTEL_DATA,
  INITIAL_FEE_DATA,
  INITIAL_ACADEMIC_DATA,
  INITIAL_PURCHASE_DATA,
  INITIAL_INVENTORY_DATA,
  INITIAL_LOST_FOUND_DATA,
  INITIAL_AWARDS_DATA,
  INITIAL_TRANSPORT_DATA,
} from '../data/seedData.js';
import {
  createSuccessResponse,
  createErrorResponse,
  paginateResults,
} from './responseEnvelope.js';
import { calculateGst, generateUniqueId } from '../models/index.js';

export { generateUniqueId };

const STORAGE_PREFIX = 'schoolerp_mock_db_v1_';

class MockAdapter {
  constructor() {
    this.stores = {};
    this.customRoutes = [];
    this.initStores();
    this.registerBuiltInRoutes();
  }

  /**
   * Safely loads a store from localStorage or returns fallback.
   * @param {string} key
   * @param {any} fallback
   * @returns {any}
   */
  loadStore(key, fallback) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_PREFIX + key);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (err) {
        console.warn(`[MockAdapter] Failed to read localStorage key ${key}:`, err);
      }
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  /**
   * Safely persists a store into localStorage.
   * @param {string} key
   */
  persistStore(key) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          STORAGE_PREFIX + key,
          JSON.stringify(this.stores[key])
        );
      } catch (err) {
        console.warn(`[MockAdapter] Failed to save localStorage key ${key}:`, err);
      }
    }
  }

  /**
   * Initializes all domain stores.
   */
  initStores() {
    this.stores = {
      'pro_correspondence': this.loadStore('pro_correspondence', INITIAL_PRO_DATA.correspondence),
      'pro_affiliations': this.loadStore('pro_affiliations', INITIAL_PRO_DATA.affiliations),
      'pro_permits': this.loadStore('pro_permits', INITIAL_PRO_DATA.permits),
      'pro_inspections': this.loadStore('pro_inspections', INITIAL_PRO_DATA.inspections),

      'fileroom_files': this.loadStore('fileroom_files', INITIAL_FILE_ROOM_DATA.files),
      'fileroom_inward': this.loadStore('fileroom_inward', INITIAL_FILE_ROOM_DATA.inwardRegister),
      'fileroom_outward': this.loadStore('fileroom_outward', INITIAL_FILE_ROOM_DATA.outwardRegister),

      'cctv_cameras': this.loadStore('cctv_cameras', INITIAL_CCTV_DATA.cameras),
      'cctv_checks': this.loadStore('cctv_checks', INITIAL_CCTV_DATA.dailyChecks),
      'cctv_requests': this.loadStore('cctv_requests', INITIAL_CCTV_DATA.footageRequests),
      'cctv_teachers_late': this.loadStore('cctv_teachers_late', INITIAL_CCTV_DATA.teachersLateReports || []),
      'cctv_issues': this.loadStore('cctv_issues', INITIAL_CCTV_DATA.issues || []),
      'cctv_pa_announcements': this.loadStore('cctv_pa_announcements', INITIAL_CCTV_DATA.paAnnouncements || []),
      'cctv_gps_halts': this.loadStore('cctv_gps_halts', INITIAL_CCTV_DATA.gpsHalts || []),
      'cctv_bus_last_drops': this.loadStore('cctv_bus_last_drops', INITIAL_CCTV_DATA.busLastDrops || []),
      'cctv_bus_cameras': this.loadStore('cctv_bus_cameras', INITIAL_CCTV_DATA.busCameraAudits || []),

      'hostel_blocks': this.loadStore('hostel_blocks', INITIAL_HOSTEL_DATA.blocks),
      'hostel_rooms': this.loadStore('hostel_rooms', INITIAL_HOSTEL_DATA.rooms),
      'hostel_enrolments': this.loadStore('hostel_enrolments', INITIAL_HOSTEL_DATA.enrolments),

      'fees_heads': this.loadStore('fees_heads', INITIAL_FEE_DATA.feeHeads),
      'fees_invoices': this.loadStore('fees_invoices', INITIAL_FEE_DATA.invoices),
      'fees_payments': this.loadStore('fees_payments', INITIAL_FEE_DATA.payments),
      'fees_refunds': this.loadStore('fees_refunds', INITIAL_FEE_DATA.refundRequests),

      'academics_exams': this.loadStore('academics_exams', INITIAL_ACADEMIC_DATA.examSessions),
      'academics_marks': this.loadStore('academics_marks', INITIAL_ACADEMIC_DATA.marks),
      'academics_dossiers': this.loadStore('academics_dossiers', INITIAL_ACADEMIC_DATA.studentDossiers),

      'purchase_requisitions': this.loadStore('purchase_requisitions', INITIAL_PURCHASE_DATA.requisitions),
      'purchase_quotes': this.loadStore('purchase_quotes', INITIAL_PURCHASE_DATA.comparativeQuotes),
      'purchase_pos': this.loadStore('purchase_pos', INITIAL_PURCHASE_DATA.purchaseOrders),
      'purchase_liabilities': this.loadStore('purchase_liabilities', INITIAL_PURCHASE_DATA.financeLiabilities),

      'inventory_catalog': this.loadStore('inventory_catalog', INITIAL_INVENTORY_DATA.catalog),
      'inventory_transactions': this.loadStore('inventory_transactions', INITIAL_INVENTORY_DATA.transactions),
      'inventory_issues': this.loadStore('inventory_issues', INITIAL_INVENTORY_DATA.issueRegister),

      'lostfound_items': this.loadStore('lostfound_items', INITIAL_LOST_FOUND_DATA.items),

      'awards_som': this.loadStore('awards_som', INITIAL_AWARDS_DATA.somNominations),
      'awards_soy': this.loadStore('awards_soy', INITIAL_AWARDS_DATA.soyNominations),

      'transport_vehicles': this.loadStore('transport_vehicles', INITIAL_TRANSPORT_DATA.vehicles),
      'transport_routes': this.loadStore('transport_routes', INITIAL_TRANSPORT_DATA.routes),
      'transport_manifest': this.loadStore('transport_manifest', INITIAL_TRANSPORT_DATA.passengerManifest),
      'transport_driver_conductor_noc': this.loadStore('transport_driver_conductor_noc', INITIAL_TRANSPORT_DATA.nocClearances || []),
    };
  }

  /**
   * Resets mock database back to initial seed data.
   */
  resetDatabase() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => window.localStorage.removeItem(k));
      } catch (err) {
        console.warn('[MockAdapter] Error clearing localStorage:', err);
      }
    }
    this.initStores();
  }

  /**
   * Registers a custom route pattern with an execution handler.
   * @param {string} method - 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'
   * @param {string} pattern - e.g. '/api/v1/hostel/enrol' or '/api/v1/purchase/pos/:id/approve'
   * @param {Function} handler - ({ params, query, data, headers }) => ApiResponse
   */
  registerRoute(method, pattern, handler) {
    this.customRoutes.push({
      method: method.toUpperCase(),
      pattern,
      regex: this.compilePatternToRegex(pattern),
      handler,
    });
  }

  /**
   * Compiles path string with :params into regex.
   * @param {string} pattern
   * @returns {{ regex: RegExp, paramNames: string[] }}
   */
  compilePatternToRegex(pattern) {
    const paramNames = [];
    const regexStr = pattern
      .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\//g, '\\/');
    return {
      regex: new RegExp(`^${regexStr}$`),
      paramNames,
    };
  }

  /**
   * Matches URL to route pattern and extracts path parameters.
   * @param {string} method
   * @param {string} pathname
   * @returns {{ route: any, params: Record<string, string> } | null}
   */
  matchRoute(method, pathname) {
    const normalizedMethod = method.toUpperCase();
    const cleanPath = pathname.split('?')[0];

    for (const route of this.customRoutes) {
      if (route.method !== normalizedMethod) continue;
      const match = cleanPath.match(route.regex.regex);
      if (match) {
        const params = {};
        route.regex.paramNames.forEach((name, idx) => {
          params[name] = match[idx + 1];
        });
        return { route, params };
      }
    }
    return null;
  }

  /**
   * Registers built-in routes for specialized workflows.
   */
  registerBuiltInRoutes() {
    // 1. Hostel Enrolment -> Automatic Fee Invoicing
    this.registerRoute('POST', '/api/v1/hostel/enrol', ({ data }) => {
      const { studentId, hostelBlockId, roomNumber, bedNumber, academicYear, term, checkInDate, feeAmount, wardenName } = data || {};
      if (!studentId || !hostelBlockId || !roomNumber || !bedNumber) {
        return createErrorResponse('Missing required hostel enrolment fields.');
      }

      // Check if student is already actively enrolled in this bed or another bed
      const activeEnrolments = (this.stores['hostel_enrolments'] || []).filter(
        (e) => e.studentId === studentId && e.status === 'Active'
      );

      const sameBedEnrolment = activeEnrolments.find(
        (e) => e.hostelBlockId === hostelBlockId && e.roomNumber === roomNumber && e.bedNumber === bedNumber
      );

      if (sameBedEnrolment) {
        // Idempotent re-enrolment: return existing enrolment without duplicate invoices
        return createSuccessResponse(sameBedEnrolment);
      }

      const differentBedEnrolment = activeEnrolments.find(
        (e) => e.hostelBlockId !== hostelBlockId || e.roomNumber !== roomNumber || e.bedNumber !== bedNumber
      );

      if (differentBedEnrolment) {
        return createErrorResponse(
          `Student ${studentId} is already actively enrolled in Hostel ${differentBedEnrolment.hostelBlockId}, Room ${differentBedEnrolment.roomNumber}, Bed ${differentBedEnrolment.bedNumber}. Vacate current bed before re-allocating.`
        );
      }

      // Check if bed is already occupied by another student
      const rooms = this.stores['hostel_rooms'] || [];
      const targetRoom = rooms.find((r) => r.blockId === hostelBlockId && r.roomNumber === roomNumber);
      if (targetRoom) {
        const targetBed = targetRoom.beds.find((b) => b.bedNumber === bedNumber);
        if (targetBed && targetBed.occupied && targetBed.studentId !== studentId) {
          return createErrorResponse(`Bed ${bedNumber} in Room ${roomNumber} is already occupied by ${targetBed.studentName || 'another student'}.`);
        }
        if (targetBed) {
          targetBed.occupied = true;
          targetBed.studentId = studentId;
          targetBed.studentName = data.studentName || 'Enrolled Student';
          this.persistStore('hostel_rooms');
        }
      }

      // Create Enrolment Record
      const newEnrolment = {
        id: generateUniqueId('HSTL-ENR'),
        studentId,
        studentName: data.studentName || 'Enrolled Student',
        gender: data.gender || 'Not Specified',
        grade: data.grade || 'N/A',
        section: data.section || 'A',
        hostelBlockId,
        hostelBlockName: data.hostelBlockName || hostelBlockId,
        roomNumber,
        bedNumber,
        checkInDate: checkInDate || new Date().toISOString().split('T')[0],
        academicYear: academicYear || '2025-2026',
        term: term || 'Annual',
        wardenName: wardenName || 'Hostel Warden',
        status: 'Active',
        linkedFeeInvoiceId: generateUniqueId('INV-HSTL'),
        annualHostelFee: Number(feeAmount) || 75000,
        feePaymentStatus: 'Pending',
      };
      this.stores['hostel_enrolments'].unshift(newEnrolment);
      this.persistStore('hostel_enrolments');

      // Automatically insert pending Hostel Fee invoice in Fee Management
      const newInvoice = {
        id: newEnrolment.linkedFeeInvoiceId,
        invoiceNumber: `INV/HSTL/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        studentId,
        studentName: newEnrolment.studentName,
        grade: newEnrolment.grade,
        section: newEnrolment.section,
        academicYear: newEnrolment.academicYear,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [
          { feeHeadId: 'FH-HSTL', name: 'Hostel & Boarding Fee', amount: newEnrolment.annualHostelFee },
        ],
        totalAmount: newEnrolment.annualHostelFee,
        concessionAmount: 0,
        paidAmount: 0,
        balanceAmount: newEnrolment.annualHostelFee,
        status: 'Pending',
        receipts: [],
      };
      this.stores['fees_invoices'].unshift(newInvoice);
      this.persistStore('fees_invoices');

      return createSuccessResponse(newEnrolment);
    });

    // 2. Purchase Order Approval -> Automatic Finance Accounts Payable Voucher
    this.registerRoute('POST', '/api/v1/purchase/pos/:id/approve', ({ params, data }) => {
      const poId = params.id;
      const po = this.stores['purchase_pos'].find((p) => p.id === poId);
      if (!po) {
        return createErrorResponse(`Purchase order ${poId} not found.`);
      }

      // Idempotency: return existing liability voucher if already approved
      if (po.status === 'Approved') {
        const existingVoucher = (this.stores['purchase_liabilities'] || []).find(
          (v) => v.poId === po.id || v.id === po.linkedFinanceLiabilityVoucherId
        );
        return createSuccessResponse({
          purchaseOrder: po,
          liabilityVoucher: existingVoucher || null,
          alreadyApproved: true,
        });
      }

      po.status = 'Approved';
      po.approvedBy = data?.approvedBy || 'Dr. K. S. Sundaram (Joint Director)';
      po.approvalDate = new Date().toISOString().split('T')[0];

      // Auto-generate Accounts Payable Liability Voucher in Finance
      const voucherId = generateUniqueId('VOUCH-LIAB');
      po.linkedFinanceLiabilityVoucherId = voucherId;
      this.persistStore('purchase_pos');

      const liabilityVoucher = {
        id: voucherId,
        voucherNumber: `AP/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
        poId: po.id,
        poNumber: po.poNumber,
        payeeName: po.vendorName,
        payeeCategory: 'Vendor / Stores Supplier',
        amountDue: po.grandTotal,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        liabilityAccount: 'Accounts Payable - Laboratory & Campus Stores',
        status: 'Pending Payment',
        generatedDate: new Date().toISOString().split('T')[0],
      };
      this.stores['purchase_liabilities'].unshift(liabilityVoucher);
      this.persistStore('purchase_liabilities');

      return createSuccessResponse({ purchaseOrder: po, liabilityVoucher });
    });

    // 3. CCTV Footage Multi-Tier Approval
    this.registerRoute('POST', '/api/v1/cctv/requests/:id/approve-tier', ({ params, data }) => {
      const requestId = params.id;
      const req = this.stores['cctv_requests'].find((r) => r.id === requestId);
      if (!req) return createErrorResponse(`CCTV Request ${requestId} not found.`);

      const { role, approved, remarks, reviewerName, reopen } = data || {};

      const validRoles = ['HOD', 'deptHead', 'JD', 'jointDirector', 'MD', 'managingDirector'];
      if (!validRoles.includes(role)) {
        return createErrorResponse(`Invalid approval tier role: ${role}. Valid roles are HOD, JD, or MD.`);
      }

      // If rejected, reject further approvals unless explicitly reopened
      if (req.currentApprovalTier === 'Rejected' && !reopen) {
        return createErrorResponse('Request has been rejected and cannot receive further tier approvals unless explicitly reopened.');
      }

      if (reopen) {
        req.currentApprovalTier = 'Dept Head';
        if (req.approvalChain?.deptHead) req.approvalChain.deptHead.status = 'Pending';
        if (req.approvalChain?.jointDirector) req.approvalChain.jointDirector.status = 'Pending';
        if (req.approvalChain?.managingDirector) {
          req.approvalChain.managingDirector.status = req.isSensitive ? 'Pending' : 'Not Required';
        }
      }

      const statusText = approved ? 'Approved' : 'Rejected';
      const timestamp = new Date().toISOString();

      if (role === 'HOD' || role === 'deptHead') {
        req.approvalChain.deptHead = {
          approvedBy: reviewerName || 'Department Head',
          status: statusText,
          timestamp,
          remarks: remarks || '',
        };
        req.currentApprovalTier = approved ? 'Joint Director' : 'Rejected';
      } else if (role === 'JD' || role === 'jointDirector') {
        // Enforce sequential tier progression: HOD tier must be completed before JD can approve
        if (req.approvalChain?.deptHead?.status !== 'Approved') {
          return createErrorResponse('Department Head (HOD) approval must be completed before Joint Director (JD) review.');
        }

        req.approvalChain.jointDirector = {
          approvedBy: reviewerName || 'Joint Director',
          status: statusText,
          timestamp,
          remarks: remarks || '',
        };
        if (approved) {
          req.currentApprovalTier = req.isSensitive ? 'Managing Director' : 'Approved';
        } else {
          req.currentApprovalTier = 'Rejected';
        }
      } else if (role === 'MD' || role === 'managingDirector') {
        // Enforce sequential tier progression: HOD and JD tiers must be completed before MD can approve
        if (req.approvalChain?.deptHead?.status !== 'Approved') {
          return createErrorResponse('Department Head (HOD) approval must be completed before Managing Director (MD) review.');
        }
        if (req.approvalChain?.jointDirector?.status !== 'Approved') {
          return createErrorResponse('Joint Director (JD) approval must be completed before Managing Director (MD) review.');
        }

        req.approvalChain.managingDirector = {
          approvedBy: reviewerName || 'Managing Director',
          status: statusText,
          timestamp,
          remarks: remarks || '',
        };
        req.currentApprovalTier = approved ? 'Approved' : 'Rejected';
      }

      if (!req.auditLog) req.auditLog = [];
      req.auditLog.push({
        timestamp,
        action: `${role.toUpperCase()}_${statusText.toUpperCase()}`,
        actorId: data?.actorId || 'EMP-AUTH',
        actorName: reviewerName || role,
        ipAddress: '192.168.1.50',
      });

      this.persistStore('cctv_requests');
      return createSuccessResponse(req);
    });

    // 4. File Room Checkout with Confidentiality Verification
    this.registerRoute('POST', '/api/v1/fileroom/checkout', ({ data }) => {
      const { fileId, requestedById, requestedByName, department, purpose, expectedReturnDate, approvalRole } = data || {};
      const file = this.stores['fileroom_files'].find((f) => f.id === fileId);
      if (!file) return createErrorResponse(`File ${fileId} not found.`);

      if (file.currentLocationStatus === 'Checked Out / Issued') {
        return createErrorResponse(`File is currently unavailable (Status: Checked Out). Held by ${file.heldByUserName || 'staff'}.`);
      }

      // Check Confidentiality Level
      if (file.confidentiality === 'Strictly Confidential') {
        if (approvalRole !== 'director' && approvalRole !== 'superadmin') {
          return createErrorResponse('Strictly Confidential files require explicit Managing Director (MD) sign-off before release.');
        }
      }

      const issueRecord = {
        id: generateUniqueId('ISS-FILE'),
        fileId: file.id,
        fileName: file.fileName,
        requestedById: requestedById || 'EMP-CURRENT',
        requestedByName: requestedByName || 'Requesting Officer',
        department: department || file.ownerDepartment,
        purpose: purpose || 'Official administrative review',
        approvalRequired: file.confidentiality === 'Strictly Confidential' ? 'Managing Director' : 'Joint Director',
        approvalStatus: 'Approved',
        approvedBy: data.approvedBy || 'Designated Approver',
        approvalTimestamp: new Date().toISOString(),
        issuedByCustodian: data.custodianName || 'File Room In-charge',
        issueDateTime: new Date().toISOString(),
        expectedReturnDate: expectedReturnDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        actualReturnDate: null,
        receivingAcknowledgmentSigned: true,
        status: 'Issued',
        returnCondition: null,
        custodianInspectionNotes: null,
      };

      file.currentLocationStatus = 'Checked Out / Issued';
      file.heldByUserId = issueRecord.requestedById;
      file.heldByUserName = issueRecord.requestedByName;
      file.heldByUserDept = issueRecord.department;
      file.lastMovementDate = issueRecord.issueDateTime.split('T')[0];

      this.stores['fileroom_outward'].unshift(issueRecord);
      this.persistStore('fileroom_outward');
      this.persistStore('fileroom_files');

      return createSuccessResponse({ file, issueRecord });
    });

    // 5. File Room Return
    this.registerRoute('POST', '/api/v1/fileroom/return/:id', ({ params, data }) => {
      const issueId = params.id;
      const issue = this.stores['fileroom_outward'].find((i) => i.id === issueId);
      if (!issue) return createErrorResponse(`Checkout record ${issueId} not found.`);

      const file = this.stores['fileroom_files'].find((f) => f.id === issue.fileId);
      if (file) {
        file.currentLocationStatus = 'In File Room';
        file.heldByUserId = null;
        file.heldByUserName = null;
        file.heldByUserDept = null;
        file.lastMovementDate = new Date().toISOString().split('T')[0];
        this.persistStore('fileroom_files');
      }

      issue.status = 'Returned';
      issue.actualReturnDate = new Date().toISOString();
      issue.returnCondition = data?.returnCondition || 'Good';
      issue.custodianInspectionNotes = data?.notes || 'Returned to assigned rack.';
      this.persistStore('fileroom_outward');

      return createSuccessResponse({ file, issue });
    });

    // 6. Fee Refund Workflow (Request -> Approve -> Disburse)
    this.registerRoute('POST', '/api/v1/fees/refunds/request', ({ data }) => {
      const { studentId, invoiceId, paymentReceiptId, refundAmount, reason, beneficiaryBankDetails } = data || {};
      if (!studentId || !refundAmount || !reason) {
        return createErrorResponse('Missing required refund request fields.');
      }

      const newRefund = {
        id: generateUniqueId('REFUND-REQ'),
        refundVoucherNumber: `REF-VOUCH-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
        studentId,
        studentName: data.studentName || 'Student',
        invoiceId: invoiceId || null,
        paymentReceiptId: paymentReceiptId || null,
        refundCategory: data.refundCategory || 'Fee Refund',
        refundAmount: Number(refundAmount),
        reason,
        beneficiaryBankDetails: beneficiaryBankDetails || {},
        status: 'Pending Accounts Verification',
        auditHistory: [
          { stage: 'Requested', role: data.requesterRole || 'applicant', user: data.requesterName || 'Applicant', timestamp: new Date().toISOString(), notes: reason },
        ],
      };

      this.stores['fees_refunds'].unshift(newRefund);
      this.persistStore('fees_refunds');
      return createSuccessResponse(newRefund);
    });

    this.registerRoute('POST', '/api/v1/fees/refunds/:id/approve', ({ params, data }) => {
      const refund = this.stores['fees_refunds'].find((r) => r.id === params.id);
      if (!refund) return createErrorResponse(`Refund ${params.id} not found.`);

      const { approverRole, approverName, nextStatus, remarks } = data || {};
      const targetStatus = nextStatus || 'Approved';

      // Disallow any approval or disbursement attempt if currently Rejected or Disbursed
      if (refund.status === 'Rejected' || refund.status === 'Disbursed') {
        return createErrorResponse('Cannot disburse or approve a rejected or already disbursed refund request.');
      }

      // Enforce strict sequential state machine transitions
      if (targetStatus === 'Approved') {
        if (refund.status !== 'Pending JD Approval') {
          return createErrorResponse(`Cannot transition refund from '${refund.status}' to 'Approved'. Must be in 'Pending JD Approval'.`);
        }
      } else if (targetStatus === 'Disbursed') {
        if (refund.status !== 'Approved') {
          return createErrorResponse(`Cannot transition refund from '${refund.status}' to 'Disbursed'. Must be in 'Approved'.`);
        }
      } else if (targetStatus === 'Pending JD Approval') {
        if (refund.status !== 'Pending Accounts Verification' && refund.status !== 'Requested') {
          return createErrorResponse(`Cannot transition refund from '${refund.status}' to 'Pending JD Approval'. Must be in 'Pending Accounts Verification' or 'Requested'.`);
        }
      } else if (targetStatus === 'Rejected') {
        // Rejection is permissible from active stages ('Requested', 'Pending Accounts Verification', 'Pending JD Approval')
      } else {
        return createErrorResponse(`Invalid next status: ${targetStatus}`);
      }

      refund.status = targetStatus;
      if (targetStatus === 'Disbursed' && !refund.refundVoucherNumber) {
        refund.refundVoucherNumber = data?.voucherNo || `REF-VOUCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      }
      if (data?.voucherNo) refund.refundVoucherNumber = data.voucherNo;
      if (data?.disbursementMode) refund.disbursementMode = data.disbursementMode;
      if (data?.transactionRef) refund.transactionRef = data.transactionRef;
      if (data?.chequeNumber) refund.chequeNumber = data.chequeNumber;
      if (data?.disbursedBy) refund.disbursedBy = data.disbursedBy;
      refund.auditHistory.push({
        stage: approverRole || 'Approval',
        role: approverRole,
        user: approverName || 'Approving Authority',
        timestamp: new Date().toISOString(),
        notes: remarks || 'Sanctioned per institutional policy.',
      });

      this.persistStore('fees_refunds');
      return createSuccessResponse(refund);
    });

    this.registerRoute('PUT', '/api/v1/fees/refunds/:id', ({ params, data }) => {
      const refund = this.stores['fees_refunds'].find((r) => r.id === params.id);
      if (!refund) return createErrorResponse(`Refund ${params.id} not found.`);

      if (data?.status && data.status !== refund.status) {
        const targetStatus = data.status;
        if (refund.status === 'Rejected' || refund.status === 'Disbursed') {
          return createErrorResponse('Cannot disburse or approve a rejected or already disbursed refund request.');
        }
        if (targetStatus === 'Approved' && refund.status !== 'Pending JD Approval') {
          return createErrorResponse(`Cannot transition refund from '${refund.status}' to 'Approved'. Must be in 'Pending JD Approval'.`);
        }
        if (targetStatus === 'Disbursed' && refund.status !== 'Approved') {
          return createErrorResponse(`Cannot transition refund from '${refund.status}' to 'Disbursed'. Must be in 'Approved'.`);
        }
        if (targetStatus === 'Pending JD Approval' && refund.status !== 'Pending Accounts Verification' && refund.status !== 'Requested') {
          return createErrorResponse(`Cannot transition refund from '${refund.status}' to 'Pending JD Approval'. Must be in 'Pending Accounts Verification' or 'Requested'.`);
        }
      }

      Object.assign(refund, data, { updatedAt: new Date().toISOString() });
      this.persistStore('fees_refunds');
      return createSuccessResponse(refund);
    });
  }

  /**
   * Helper to map a generic resource URL to store key.
   * e.g. /api/v1/pro/correspondence -> pro_correspondence
   * @param {string} pathname
   * @returns {string | null}
   */
  resolveStoreKey(pathname) {
    const cleanPath = pathname.replace(/^\/api\/v1\//, '').split('?')[0];
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const key = `${parts[0]}_${parts[1]}`;
      if (this.stores[key]) return key;
      const normalizedKey = `${parts[0]}_${parts[1].replace(/-/g, '_')}`;
      if (this.stores[normalizedKey]) return normalizedKey;
    }
    if (parts.length === 1 && this.stores[parts[0]]) {
      return parts[0];
    }
    return null;
  }

  /**
   * Primary entry point called by apiClient.
   * @param {{ method: string, url: string, data?: any, params?: any, headers?: any }} req
   * @returns {Promise<any>}
   */
  async handleRequest(req) {
    const { method = 'GET', url, data = null, params = {}, headers = {} } = req;
    const urlObj = new URL(url, 'http://localhost');
    const pathname = urlObj.pathname;

    // Combine query parameters from url and options
    const query = { ...params };
    urlObj.searchParams.forEach((val, key) => {
      query[key] = val;
    });

    // 1. Check custom registered routes
    const customMatch = this.matchRoute(method, pathname);
    if (customMatch) {
      try {
        const response = await customMatch.route.handler({
          params: customMatch.params,
          query,
          data,
          headers,
        });
        return response;
      } catch (err) {
        return createErrorResponse(err);
      }
    }

    // 2. Generic REST CRUD Handler
    const storeKey = this.resolveStoreKey(pathname);
    if (!storeKey) {
      return createErrorResponse(`Mock endpoint not found: ${method} ${pathname}`);
    }

    const collection = this.stores[storeKey] || [];
    const cleanPath = pathname.replace(/^\/api\/v1\//, '');
    const pathParts = cleanPath.split('/').filter(Boolean);
    const id = pathParts.length > 2 ? pathParts[2] : null;

    if (method.toUpperCase() === 'GET') {
      if (id) {
        const item = collection.find((x) => String(x.id) === String(id));
        return item
          ? createSuccessResponse(item)
          : createErrorResponse(`Item ${id} not found in ${storeKey}`);
      }

      // Filter, search, and paginate
      const search = query.search || query.q;
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || Number(query.limit) || 20;
      const sortBy = query.sortBy || 'id';
      const sortOrder = query.sortOrder || 'desc';

      const paginated = paginateResults(collection, {
        page,
        pageSize,
        search,
        sortBy,
        sortOrder,
      });
      return createSuccessResponse(paginated.items, paginated.meta);
    }

    if (method.toUpperCase() === 'POST') {
      const newItem = {
        id: data?.id || generateUniqueId(storeKey.toUpperCase()),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      collection.unshift(newItem);
      this.persistStore(storeKey);
      return createSuccessResponse(newItem);
    }

    if (method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH') {
      if (!id) return createErrorResponse(`ID required for ${method} on ${storeKey}`);
      const index = collection.findIndex((x) => String(x.id) === String(id));
      if (index === -1) return createErrorResponse(`Item ${id} not found in ${storeKey}`);

      const updatedItem = {
        ...collection[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      collection[index] = updatedItem;
      this.persistStore(storeKey);
      return createSuccessResponse(updatedItem);
    }

    if (method.toUpperCase() === 'DELETE') {
      if (!id) return createErrorResponse(`ID required for DELETE on ${storeKey}`);
      const index = collection.findIndex((x) => String(x.id) === String(id));
      if (index === -1) return createErrorResponse(`Item ${id} not found in ${storeKey}`);

      const removed = collection.splice(index, 1)[0];
      this.persistStore(storeKey);
      return createSuccessResponse(removed);
    }

    return createErrorResponse(`Unsupported HTTP method ${method}`);
  }
}

export const mockAdapter = new MockAdapter();
