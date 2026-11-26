/**
 * Domain Models, DTO Contracts, Enums & Validation Helpers
 * Provides standardized data contracts across all ERP modules.
 */

// ============================================================================
// 1. CONSTANTS & ENUMS
// ============================================================================

let idCounter = 0;

/**
 * Generates a collision-resistant unique identifier using a monotonic counter,
 * high-resolution timestamp, and high-entropy random suffix.
 * @param {string} prefix
 * @returns {string}
 */
export function generateUniqueId(prefix = 'ID') {
  idCounter = (idCounter + 1) % 100000;
  return `${prefix}-${Date.now()}-${String(idCounter).padStart(5, '0')}-${Math.random().toString(36).substring(2, 7)}`;
}

export const CONFIDENTIALITY_TIERS = {
  STANDARD: 'General',
  DEPARTMENT_RESTRICTED: 'Restricted',
  EXECUTIVE_CONFIDENTIAL: 'Executive Confidential',
  STRICTLY_CONFIDENTIAL: 'Strictly Confidential',
};

export const FILE_STATUS = {
  IN_ARCHIVE: 'In File Room',
  CHECKED_OUT: 'Checked Out / Issued',
  RESERVED_AUDIT: 'Reserved for Audit',
  UNDER_RESTORATION: 'Under Binding / Restoration',
  DECOMMISSIONED: 'Decommissioned / Destroyed',
};

export const CCTV_CAMERA_STATUS = {
  ONLINE: 'Online / Active',
  OFFLINE: 'Offline',
  MAINTENANCE: 'Under Maintenance',
  DEGRADED: 'Degraded Video',
};

export const CCTV_APPROVAL_TIER = {
  DEPT_HEAD: 'Dept Head',
  JOINT_DIRECTOR: 'Joint Director',
  MANAGING_DIRECTOR: 'Managing Director',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const REFUND_STATUS = {
  REQUESTED: 'Requested',
  PENDING_ACCOUNTS: 'Pending Accounts Verification',
  PENDING_JD: 'Pending JD Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
};

export const PO_STATUS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ORDERED: 'Ordered',
  PARTIALLY_RECEIVED: 'Partially Received',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const CBSE_GRADE_SCALE = [
  { min: 91, max: 100, grade: 'A1', gradePoint: 10.0, description: 'Outstanding' },
  { min: 81, max: 90, grade: 'A2', gradePoint: 9.0, description: 'Excellent' },
  { min: 71, max: 80, grade: 'B1', gradePoint: 8.0, description: 'Very Good' },
  { min: 61, max: 70, grade: 'B2', gradePoint: 7.0, description: 'Good' },
  { min: 51, max: 60, grade: 'C1', gradePoint: 6.0, description: 'Fair' },
  { min: 41, max: 50, grade: 'C2', gradePoint: 5.0, description: 'Average' },
  { min: 33, max: 40, grade: 'D', gradePoint: 4.0, description: 'Pass' },
  { min: 0, max: 32, grade: 'E', gradePoint: 0.0, description: 'Needs Improvement / Essential Repeat' },
];

// ============================================================================
// 2. VALIDATION HELPERS
// ============================================================================

/**
 * Validates that specified required fields exist and are non-empty.
 * @param {Record<string, any>} data
 * @param {string[]} fields
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateRequired(data = {}, fields = []) {
  const errors = {};
  for (const field of fields) {
    const val = data[field];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      errors[field] = `${field} is required`;
    }
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates date string format (YYYY-MM-DD or ISO).
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Validates non-negative number.
 * @param {any} num
 * @returns {boolean}
 */
export function isNonNegativeNumber(num) {
  const n = Number(num);
  return !isNaN(n) && n >= 0;
}

/**
 * Validates email format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates enum inclusion.
 * @param {any} val
 * @param {Record<string, any> | any[]} allowed
 * @returns {boolean}
 */
export function isValidEnum(val, allowed) {
  const values = Array.isArray(allowed) ? allowed : Object.values(allowed);
  return values.includes(val);
}

// ============================================================================
// 3. JSDOC TYPE DEFINITIONS & FACTORIES
// ============================================================================

/**
 * @typedef {Object} StorageLocation
 * @property {string} building - Building name or block
 * @property {string} room - Room number or name
 * @property {string} rackNo - Cupboard or rack identifier
 * @property {string} shelfNo - Shelf level identifier
 * @property {string} boxNo - Storage box or binder identifier
 */

/**
 * Creates a normalized StorageLocation DTO.
 * @param {Partial<StorageLocation>} data
 * @returns {StorageLocation}
 */
export function createStorageLocation(data = {}) {
  return {
    building: data.building || 'Administrative Block',
    room: data.room || 'Archive Room 102',
    rackNo: data.rackNo || data.cupboardRack || 'Rack A',
    shelfNo: data.shelfNo || data.shelfLevel || 'Shelf 01',
    boxNo: data.boxNo || data.boxFolder || 'Box 01',
  };
}

/**
 * Calculates letter grade and points from numerical percentage or marks.
 * Rounds the percentage (Math.round) so floating percentages like 90.9% cleanly map to CBSE grade bands (A1: 91-100%).
 * @param {number} percentageOrMarks
 * @param {number} [maxMarks]
 * @returns {{ grade: string, gradePoint: number, description: string }}
 */
export function computeGrade(percentageOrMarks, maxMarks) {
  let p;
  if (maxMarks !== undefined && Number(maxMarks) > 0) {
    p = Math.round((Number(percentageOrMarks) / Number(maxMarks)) * 100);
  } else {
    p = Math.round(Number(percentageOrMarks) || 0);
  }
  p = Math.max(0, Math.min(100, p));
  const match = CBSE_GRADE_SCALE.find((s) => p >= s.min && p <= s.max);
  return match || CBSE_GRADE_SCALE[CBSE_GRADE_SCALE.length - 1];
}

/**
 * Calculates GST line item amounts.
 * @param {number} baseAmount
 * @param {number} gstRatePercent - e.g. 5, 12, 18, 28
 * @returns {{ baseAmount: number, gstRatePercent: number, gstAmount: number, totalAmount: number }}
 */
export function calculateGst(baseAmount, gstRatePercent = 18) {
  const base = Math.max(0, Number(baseAmount) || 0);
  const rate = Math.max(0, Number(gstRatePercent) || 0);
  const gst = Number(((base * rate) / 100).toFixed(2));
  const total = Number((base + gst).toFixed(2));
  return {
    baseAmount: base,
    gstRatePercent: rate,
    gstAmount: gst,
    totalAmount: total,
  };
}
