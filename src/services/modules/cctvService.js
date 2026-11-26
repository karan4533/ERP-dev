/**
 * CCTV & Camera Room Management Domain Service
 * Handles surveillance camera assets, shift-wise daily status checks,
 * multi-tier footage requisitions, watermarked clip delivery, and audit logging.
 */

import { apiClient } from '../api/apiClient.js';
import { generateUniqueId, validateRequired, CCTV_CAMERA_STATUS } from '../models/index.js';
import { createErrorResponse } from '../api/responseEnvelope.js';

export const cctvService = {
  // ==========================================================================
  // 1. CAMERA ASSET INVENTORY
  // ==========================================================================

  async getCameras(params = {}) {
    return apiClient.get('/api/v1/cctv/cameras', { params });
  },

  async getCameraById(id) {
    return apiClient.get(`/api/v1/cctv/cameras/${id}`);
  },

  async createCamera(data = {}) {
    const validation = validateRequired(data, [
      'name',
      'zone',
      'ipAddress',
      'nvrChannel',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }
    const payload = {
      ...data,
      currentStatus: data.currentStatus || CCTV_CAMERA_STATUS.ONLINE,
      storageRetentionDays: Number(data.storageRetentionDays) || 45,
      lastDailyCheck: new Date().toISOString(),
    };
    return apiClient.post('/api/v1/cctv/cameras', payload);
  },

  async updateCamera(id, data = {}) {
    return apiClient.put(`/api/v1/cctv/cameras/${id}`, data);
  },

  async deleteCamera(id) {
    return apiClient.delete(`/api/v1/cctv/cameras/${id}`);
  },

  // ==========================================================================
  // 2. DAILY OPERATIONAL STATUS CHECKS
  // ==========================================================================

  async getDailyChecks(params = {}) {
    return apiClient.get('/api/v1/cctv/checks', { params });
  },

  async getDailyCheckById(id) {
    return apiClient.get(`/api/v1/cctv/checks/${id}`);
  },

  async updateDailyCheck(id, data = {}) {
    return apiClient.put(`/api/v1/cctv/checks/${id}`, data);
  },

  async resolveCheckAnomaly(checkId, anomalyIndex, resolutionData = {}) {
    const checkRes = await this.getDailyCheckById(checkId);
    if (!checkRes.success || !checkRes.data) return checkRes;

    const check = checkRes.data;
    const anomalies = check.findingsAndAnomalies || [];
    if (anomalyIndex >= 0 && anomalyIndex < anomalies.length) {
      anomalies[anomalyIndex] = {
        ...anomalies[anomalyIndex],
        rectifiedDate: resolutionData.rectifiedDate || new Date().toISOString().split('T')[0],
        rectifiedTime: resolutionData.rectifiedTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rectifiedBy: resolutionData.rectifiedBy || 'S. Selvakumar (Technician)',
        resolutionNotes: resolutionData.resolutionNotes || 'Defect resolved and operational feed verified.',
        isRectified: true,
      };
    }

    const allRectified = anomalies.every((a) => a.isRectified);
    if (allRectified) {
      check.status = 'Completed';
    }

    check.findingsAndAnomalies = anomalies;
    return this.updateDailyCheck(checkId, check);
  },

  async logDailyCheck(checkData = {}) {
    const validation = validateRequired(checkData, [
      'checkDate',
      'shift',
      'inspectorId',
      'inspectorName',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const payload = {
      ...checkData,
      id: generateUniqueId('CHK-CCTV'),
      findingsAndAnomalies: checkData.findingsAndAnomalies || [],
      status: checkData.findingsAndAnomalies?.length > 0 ? 'Requires Immediate Attention' : 'Completed',
    };

    return apiClient.post('/api/v1/cctv/checks', payload);
  },

  // ==========================================================================
  // 3. FOOTAGE REQUISITION & MULTI-TIER APPROVALS
  // ==========================================================================

  async getFootageRequests(params = {}) {
    return apiClient.get('/api/v1/cctv/requests', { params });
  },

  async getFootageRequestById(id) {
    return apiClient.get(`/api/v1/cctv/requests/${id}`);
  },

  async createFootageRequest(data = {}) {
    const validation = validateRequired(data, [
      'incidentDate',
      'timeWindowStart',
      'timeWindowEnd',
      'cameraIds',
      'requesterId',
      'requesterName',
      'justificationText',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const isSensitive = Boolean(data.isSensitive);
    const payload = {
      ...data,
      isSensitive,
      approvalChain: {
        deptHead: { approvedBy: null, status: 'Pending', timestamp: null, remarks: '' },
        jointDirector: { approvedBy: null, status: 'Pending', timestamp: null, remarks: '' },
        managingDirector: { approvedBy: null, status: isSensitive ? 'Pending' : 'Not Required', timestamp: null, remarks: '' },
      },
      currentApprovalTier: 'Dept Head',
      clipDelivery: null,
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: 'REQUEST_SUBMITTED',
          actorId: data.requesterId,
          actorName: data.requesterName,
          ipAddress: '192.168.1.1',
          notes: data.justificationText,
        },
      ],
    };

    return apiClient.post('/api/v1/cctv/requests', payload);
  },

  /**
   * Processes approval tier (Dept Head -> JD -> MD).
   */
  async processApprovalTier(requestId, approvalData = {}) {
    return apiClient.post(`/api/v1/cctv/requests/${requestId}/approve-tier`, approvalData);
  },

  /**
   * Generates watermarked clip delivery package upon final approval.
   */
  async deliverClip(requestId, deliveryInfo = {}) {
    const reqRes = await this.getFootageRequestById(requestId);
    if (!reqRes.success || !reqRes.data) return reqRes;

    const request = reqRes.data;
    if (request.currentApprovalTier !== 'Approved') {
      return createErrorResponse('Cannot deliver clip until all required approval tiers have approved.');
    }

    const clipDelivery = {
      clipPreparedBy: deliveryInfo.clipPreparedBy || 'S. Selvakumar (Camera Room)',
      clipPreparedTimestamp: new Date().toISOString(),
      clipDurationSeconds: Number(deliveryInfo.clipDurationSeconds) || 1800,
      fileSizeBytes: Number(deliveryInfo.fileSizeBytes) || 350000000,
      watermarkText: `${request.requesterId} / ${request.id} / CONFIDENTIAL`,
      streamingUrl: `https://cctv.school.internal/stream/${request.id}.mp4`,
      downloadExpiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      retentionLockUntil: deliveryInfo.retentionLockUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    request.clipDelivery = clipDelivery;
    request.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'CLIP_DELIVERED',
      actorId: 'EMP-CCTV-001',
      actorName: 'Camera Room In-charge',
      ipAddress: '192.168.10.2',
    });

    return apiClient.put(`/api/v1/cctv/requests/${requestId}`, request);
  },

  async logAccessDownload(requestId, { userId, userName, action = 'VIEW' }) {
    const reqRes = await this.getFootageRequestById(requestId);
    if (!reqRes.success || !reqRes.data) return reqRes;

    const request = reqRes.data;
    request.auditLog.push({
      timestamp: new Date().toISOString(),
      action: action.toUpperCase(),
      actorId: userId,
      actorName: userName,
      ipAddress: '192.168.1.100',
    });

    return apiClient.put(`/api/v1/cctv/requests/${requestId}`, request);
  },

  // ==========================================================================
  // 4. TEACHERS LATE REPORT
  // ==========================================================================

  async getTeachersLateReports(params = {}) {
    return apiClient.get('/api/v1/cctv/teachers-late', { params });
  },

  async createTeachersLateReport(data = {}) {
    const validation = validateRequired(data, [
      'teacherName',
      'shiftInTime',
      'actualArrivalTime',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const payload = {
      ...data,
      id: generateUniqueId('TL'),
      date: data.date || new Date().toISOString().split('T')[0],
      lateMinutes:
        data.lateMinutes !== undefined && data.lateMinutes !== null && !isNaN(Number(data.lateMinutes))
          ? Number(data.lateMinutes)
          : 15,
      gateNo: data.gateNo || 'Gate 1 (Main Entrance)',
      cameraId: data.cameraId || 'CAM-01',
      status: data.status || 'Logged',
      createdAt: new Date().toISOString(),
    };

    return apiClient.post('/api/v1/cctv/teachers-late', payload);
  },

  // ==========================================================================
  // 5. SURVEILLANCE ISSUE REGISTER
  // ==========================================================================

  async getIssues(params = {}) {
    return apiClient.get('/api/v1/cctv/issues', { params });
  },

  async getIssueById(id) {
    return apiClient.get(`/api/v1/cctv/issues/${id}`);
  },

  async createIssue(data = {}) {
    const validation = validateRequired(data, [
      'zone',
      'defectCategory',
      'severity',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const payload = {
      ...data,
      id: generateUniqueId('ISSUE-CCTV'),
      date: data.date || new Date().toISOString().split('T')[0],
      status: data.status || 'Open',
      rectifiedDate: null,
      rectifiedTime: null,
      reportedBy: data.reportedBy || 'S. Selvakumar (Camera Room)',
      assignedTechnician: data.assignedTechnician || 'K. Ramesh (IT Network Team)',
      createdAt: new Date().toISOString(),
    };

    return apiClient.post('/api/v1/cctv/issues', payload);
  },

  async updateIssue(id, data = {}) {
    return apiClient.put(`/api/v1/cctv/issues/${id}`, data);
  },

  async resolveIssue(id, resolutionData = {}) {
    const issueRes = await this.getIssueById(id);
    if (!issueRes.success || !issueRes.data) return issueRes;

    const issue = issueRes.data;
    const updated = {
      ...issue,
      ...resolutionData,
      status: 'Rectified',
      rectifiedDate: resolutionData.rectifiedDate || new Date().toISOString().split('T')[0],
      rectifiedTime: resolutionData.rectifiedTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assignedTechnician: resolutionData.assignedTechnician || issue.assignedTechnician,
      notes: resolutionData.notes ? `${issue.notes ? issue.notes + ' | ' : ''}Resolution: ${resolutionData.notes}` : issue.notes,
      updatedAt: new Date().toISOString(),
    };

    return this.updateIssue(id, updated);
  },

  // ==========================================================================
  // 6. PA SYSTEM ANNOUNCEMENTS
  // ==========================================================================

  async getPaAnnouncements(params = {}) {
    return apiClient.get('/api/v1/cctv/pa-announcements', { params });
  },

  async createPaAnnouncement(data = {}) {
    const validation = validateRequired(data, [
      'category',
      'message',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const payload = {
      ...data,
      id: generateUniqueId('PA'),
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      targetZones: Array.isArray(data.targetZones) && data.targetZones.length > 0 ? data.targetZones : ['All Zones (Campus-wide)'],
      isEmergency: Boolean(data.isEmergency),
      announcedBy: data.announcedBy || 'Control Room Operator',
      authorizedBy: data.authorizedBy || 'Joint Director',
      createdAt: new Date().toISOString(),
    };

    return apiClient.post('/api/v1/cctv/pa-announcements', payload);
  },

  // ==========================================================================
  // 7. GPS & HALT TELEMETRY
  // ==========================================================================

  async getGpsHalts(params = {}) {
    return apiClient.get('/api/v1/cctv/gps-halts', { params });
  },

  async createGpsHalt(data = {}) {
    const validation = validateRequired(data, [
      'busNo',
      'haltLocation',
      'haltDurationMinutes',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const payload = {
      ...data,
      id: generateUniqueId('HALT'),
      date: data.date || new Date().toISOString().split('T')[0],
      haltDurationMinutes: Number(data.haltDurationMinutes) || 5,
      speedAlert: Boolean(data.speedAlert),
      scheduledTime: data.scheduledTime || '07:45 AM',
      arrivalTime: data.arrivalTime || '08:00 AM',
      createdAt: new Date().toISOString(),
    };

    return apiClient.post('/api/v1/cctv/gps-halts', payload);
  },

  async acknowledgeGpsHalt(id, data = {}) {
    return apiClient.put(`/api/v1/cctv/gps-halts/${id}`, { ...data, acknowledged: true });
  },

  // ==========================================================================
  // 8. BUS LAST DROP DISPERSAL VERIFICATION
  // ==========================================================================

  async getBusLastDrops(params = {}) {
    return apiClient.get('/api/v1/cctv/bus-last-drops', { params });
  },

  async createBusLastDrop(data = {}) {
    const validation = validateRequired(data, [
      'busNo',
      'routeNo',
      'driverName',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const payload = {
      ...data,
      id: generateUniqueId('BLD'),
      date: data.date || new Date().toISOString().split('T')[0],
      totalStudentsDropped: Number(data.totalStudentsDropped) || 0,
      emptyBusVerified: Boolean(data.emptyBusVerified),
      scheduledTime: data.scheduledTime || '04:30 PM',
      actualDropTime: data.actualDropTime || '04:35 PM',
      createdAt: new Date().toISOString(),
    };

    return apiClient.post('/api/v1/cctv/bus-last-drops', payload);
  },

  async verifyBusLastDrop(id) {
    return apiClient.put(`/api/v1/cctv/bus-last-drops/${id}`, {
      emptyBusVerified: true,
      verifiedTimestamp: new Date().toISOString(),
    });
  },

  // ==========================================================================
  // 9. BUS CAMERA AUDIT & SAFETY MONITORING
  // ==========================================================================

  async getBusCameraAudits(params = {}) {
    return apiClient.get('/api/v1/cctv/bus-cameras', { params });
  },

  async createBusCameraAudit(data = {}) {
    const validation = validateRequired(data, [
      'busNo',
      'inspectorName',
    ]);
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const payload = {
      ...data,
      id: generateUniqueId('BCAM'),
      date: data.date || new Date().toISOString().split('T')[0],
      frontCameraStatus: data.frontCameraStatus || 'Online / Working',
      cabinCameraStatus: data.cabinCameraStatus || 'Online / Working',
      rearCameraStatus: data.rearCameraStatus || 'Online / Working',
      recordingHealth: data.recordingHealth || 'Normal',
      footageQuality: data.footageQuality || '1080p Clear',
      incidentReported: Boolean(data.incidentReported),
      createdAt: new Date().toISOString(),
    };

    return apiClient.post('/api/v1/cctv/bus-cameras', payload);
  },

  async getCctvStats() {
    const [camerasRes, requestsRes] = await Promise.all([
      this.getCameras(),
      this.getFootageRequests(),
    ]);

    const cameras = camerasRes.data || [];
    const requests = requestsRes.data || [];

    const onlineCameras = cameras.filter((c) => c.currentStatus === CCTV_CAMERA_STATUS.ONLINE).length;
    const offlineCameras = cameras.filter((c) => c.currentStatus === CCTV_CAMERA_STATUS.OFFLINE).length;
    const pendingRequests = requests.filter((r) => r.currentApprovalTier !== 'Approved' && r.currentApprovalTier !== 'Rejected').length;

    return {
      success: true,
      data: {
        totalCameras: cameras.length,
        onlineCameras,
        offlineCameras,
        pendingRequests,
        totalRequests: requests.length,
      },
      meta: null,
      error: null,
    };
  },
};
