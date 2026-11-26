/**
 * Transport & Fleet Management Domain Service
 * Handles vehicle assets, route stops, driver duty allotments,
 * student passenger manifests with photo roster, and boarding status tracking.
 */

import { apiClient } from '../api/apiClient.js';
import { validateRequired, generateUniqueId } from '../models/index.js';
import { createErrorResponse } from '../api/responseEnvelope.js';

export const transportService = {
  // ==========================================================================
  // 1. VEHICLES & FLEET
  // ==========================================================================

  async getVehicles(params = {}) {
    return apiClient.get('/api/v1/transport/vehicles', { params });
  },

  async getVehicleById(id) {
    return apiClient.get(`/api/v1/transport/vehicles/${id}`);
  },

  async updateVehicle(id, data = {}) {
    return apiClient.put(`/api/v1/transport/vehicles/${id}`, data);
  },

  // ==========================================================================
  // 2. ROUTES & STOPS
  // ==========================================================================

  async getRoutes(params = {}) {
    return apiClient.get('/api/v1/transport/routes', { params });
  },

  async getRouteById(id) {
    return apiClient.get(`/api/v1/transport/routes/${id}`);
  },

  // ==========================================================================
  // 3. PASSENGER MANIFEST & BOARDING STATUS (WITH FINANCE FEE SYNC)
  // ==========================================================================

  async getPassengerManifest(params = {}) {
    return apiClient.get('/api/v1/transport/manifest', { params });
  },

  /**
   * Updates student boarding status for driver trip (Boarded / Absent / Dropped).
   */
  async updateBoardingStatus({ studentId, boardingStatus }) {
    if (!studentId || !boardingStatus) {
      return createErrorResponse('studentId and boardingStatus are required.');
    }

    const manifestRes = await this.getPassengerManifest();
    if (!manifestRes.success || !Array.isArray(manifestRes.data)) return manifestRes;

    const manifest = manifestRes.data;
    const studentEntry = manifest.find((s) => s.studentId === studentId);
    if (!studentEntry) {
      return createErrorResponse(`Student ${studentId} not found in transport manifest.`);
    }

    studentEntry.boardingStatus = boardingStatus;
    studentEntry.lastStatusUpdated = new Date().toISOString();

    // Persist changes
    await apiClient.put(`/api/v1/transport/manifest/${studentId}`, studentEntry);
    return { success: true, data: studentEntry, meta: null, error: null };
  },

  // ==========================================================================
  // 4. DRIVER & CONDUCTOR NOC CLEARANCE
  // ==========================================================================

  async getNocClearances(params = {}) {
    return apiClient.get('/api/v1/transport/driver-conductor-noc', { params });
  },

  async getNocById(id) {
    return apiClient.get(`/api/v1/transport/driver-conductor-noc/${id}`);
  },

  async createNocClearance(data = {}) {
    const validation = validateRequired(data, [
      'staffType',
      'staffName',
      'vehicleAssigned',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const toBoolean = (val) => val === true || val === 'true' || val === 1 || val === '1';
    const clearancesInput = data.clearances || {};

    const payload = {
      ...data,
      id: generateUniqueId('NOC-TRP'),
      staffType: data.staffType || 'Driver',
      staffId: data.staffId || generateUniqueId('EMP-STF'),
      licenseNo: data.licenseNo || 'N/A',
      clearances: {
        vehicleKeys: toBoolean(clearancesInput.vehicleKeys),
        fuelCard: toBoolean(clearancesInput.fuelCard),
        toolKit: toBoolean(clearancesInput.toolKit),
        firstAid: toBoolean(clearancesInput.firstAid),
        fastag: toBoolean(clearancesInput.fastag),
        finesCleared: toBoolean(clearancesInput.finesCleared),
        kmAuditVerified: toBoolean(clearancesInput.kmAuditVerified),
      },
      nocStatus: data.nocStatus || 'Clearance In Progress',
      issuedDate: data.nocStatus === 'Cleared / NOC Issued' ? (data.issuedDate || new Date().toISOString().split('T')[0]) : null,
      issuedBy: data.nocStatus === 'Cleared / NOC Issued' ? (data.issuedBy || 'A. David Raj (Transport Manager)') : null,
      certificateNo: data.nocStatus === 'Cleared / NOC Issued' ? (data.certificateNo || `NOC/TRP/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`) : null,
      createdAt: new Date().toISOString(),
    };

    return apiClient.post('/api/v1/transport/driver-conductor-noc', payload);
  },

  async updateNocClearance(id, data = {}) {
    return apiClient.put(`/api/v1/transport/driver-conductor-noc/${id}`, data);
  },

  async issueNocCertificate(id, issueData = {}) {
    const nocRes = await this.getNocById(id);
    if (!nocRes.success || !nocRes.data) return nocRes;

    const record = nocRes.data;
    const cl = record.clearances || {};
    const allChecked =
      cl.vehicleKeys &&
      cl.fuelCard &&
      cl.toolKit &&
      cl.firstAid &&
      cl.fastag &&
      cl.finesCleared &&
      cl.kmAuditVerified;

    if (!allChecked && !issueData.allowWaiver) {
      return createErrorResponse('Cannot issue NOC: All 7 checklist clearances (keys, fuel card, tool kit, first aid, FASTag, fines, KM audit) must be cleared or authorized with manager waiver.');
    }

    if (record.nocStatus === 'Cleared / NOC Issued' && record.certificateNo) {
      if (issueData.remarks) record.remarks = issueData.remarks;
      return this.updateNocClearance(id, record);
    }

    record.nocStatus = 'Cleared / NOC Issued';
    record.issuedDate = issueData.issuedDate || new Date().toISOString().split('T')[0];
    record.issuedBy = issueData.issuedBy || 'A. David Raj (Transport Manager)';
    record.certificateNo = issueData.certificateNo || `NOC/TRP/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
    if (issueData.remarks) {
      record.remarks = issueData.remarks;
    }

    return this.updateNocClearance(id, record);
  },

  async getTransportStats() {
    const [vehRes, routesRes, manRes] = await Promise.all([
      this.getVehicles(),
      this.getRoutes(),
      this.getPassengerManifest(),
    ]);

    const vehicles = vehRes.data || [];
    const routes = routesRes.data || [];
    const manifest = manRes.data || [];

    const activeVehicles = vehicles.filter((v) => v.status === 'Active').length;
    const totalPassengers = manifest.length;
    const boardedCount = manifest.filter((m) => m.boardingStatus === 'Boarded').length;
    const feePendingCount = manifest.filter((m) => m.feeStatus === 'Pending').length;

    return {
      success: true,
      data: {
        totalVehicles: vehicles.length,
        activeVehicles,
        totalRoutes: routes.length,
        totalPassengers,
        boardedCount,
        feePendingCount,
      },
      meta: null,
      error: null,
    };
  },
};
