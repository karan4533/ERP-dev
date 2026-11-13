/**
 * Master Services Barrel Export
 * Central entry point for all API abstraction, mock adapter, domain services, and models.
 */

// API Infrastructure
export { apiClient } from './api/apiClient.js';
export { mockAdapter } from './api/mockAdapter.js';
export {
  createSuccessResponse,
  createErrorResponse,
  isApiResponse,
  paginateResults,
} from './api/responseEnvelope.js';

// Domain Models & Validation
export {
  CONFIDENTIALITY_TIERS,
  FILE_STATUS,
  CCTV_CAMERA_STATUS,
  CCTV_APPROVAL_TIER,
  REFUND_STATUS,
  PO_STATUS,
  CBSE_GRADE_SCALE,
  validateRequired,
  isValidDate,
  isNonNegativeNumber,
  isValidEmail,
  isValidEnum,
  createStorageLocation,
  generateUniqueId,
  computeGrade,
  calculateGst,
} from './models/index.js';

// Seed Data
export * from './data/seedData.js';

// Domain Services
export { proService } from './modules/proService.js';
export { fileRoomService } from './modules/fileRoomService.js';
export { cctvService } from './modules/cctvService.js';
export { hostelService } from './modules/hostelService.js';
export { feeService } from './modules/feeService.js';
export { academicService } from './modules/academicService.js';
export { purchaseService } from './modules/purchaseService.js';
export { inventoryService } from './modules/inventoryService.js';
export { lostFoundService } from './modules/lostFoundService.js';
export { awardsService } from './modules/awardsService.js';
export { transportService } from './modules/transportService.js';
