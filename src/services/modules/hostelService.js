/**
 * Hostel Management Domain Service
 * Handles hostel blocks, rooms, bed occupancy tracking, student enrolment workflow,
 * and automated integration with Central Fee Management.
 */

import { apiClient } from '../api/apiClient.js';
import { validateRequired } from '../models/index.js';
import { createErrorResponse } from '../api/responseEnvelope.js';

export const hostelService = {
  // ==========================================================================
  // 1. HOSTEL BLOCKS & ROOMS
  // ==========================================================================

  async getBlocks(params = {}) {
    return apiClient.get('/api/v1/hostel/blocks', { params });
  },

  async getRooms(params = {}) {
    return apiClient.get('/api/v1/hostel/rooms', { params });
  },

  async getRoomById(id) {
    return apiClient.get(`/api/v1/hostel/rooms/${id}`);
  },

  // ==========================================================================
  // 2. ENROLMENT WORKFLOW (INTEGRATED WITH CENTRAL FEE MANAGEMENT)
  // ==========================================================================

  async getEnrolments(params = {}) {
    return apiClient.get('/api/v1/hostel/enrolments', { params });
  },

  async getEnrolmentByStudentId(studentId) {
    const res = await this.getEnrolments();
    if (!res.success || !Array.isArray(res.data)) return res;
    const found = res.data.find((e) => e.studentId === studentId && e.status === 'Active');
    return {
      success: true,
      data: found || null,
      meta: null,
      error: found ? null : 'No active hostel enrolment found for student',
    };
  },

  /**
   * Enrols student into hostel, allocates room and bed,
   * and automatically injects pending Hostel Fee invoice in Fee Service.
   */
  async assignHostelBed(studentId, allocationData = {}) {
    const validation = validateRequired(allocationData, [
      'hostelBlockId',
      'roomNumber',
      'bedNumber',
    ]);
    if (!studentId) {
      return createErrorResponse('studentId is required for hostel bed allocation.');
    }
    if (!validation.valid) {
      return createErrorResponse(validation.errors);
    }

    const payload = {
      studentId,
      ...allocationData,
    };

    return apiClient.post('/api/v1/hostel/enrol', payload);
  },

  /**
   * Vacates a student from their allocated hostel bed.
   */
  async vacateBed(enrolmentId, vacateData = {}) {
    const enrRes = await apiClient.get(`/api/v1/hostel/enrolments/${enrolmentId}`);
    if (!enrRes.success || !enrRes.data) return enrRes;

    const enrolment = enrRes.data;
    enrolment.status = 'Vacated';
    enrolment.checkOutDate = vacateData.checkOutDate || new Date().toISOString().split('T')[0];
    enrolment.vacateRemarks = vacateData.remarks || 'Standard vacation';

    // Free up bed in room
    const roomsRes = await this.getRooms();
    if (roomsRes.success && Array.isArray(roomsRes.data)) {
      const room = roomsRes.data.find((r) => r.blockId === enrolment.hostelBlockId && r.roomNumber === enrolment.roomNumber);
      if (room) {
        const bed = room.beds.find((b) => b.bedNumber === enrolment.bedNumber);
        if (bed) {
          bed.occupied = false;
          bed.studentId = null;
          bed.studentName = null;
          await apiClient.put(`/api/v1/hostel/rooms/${room.id}`, room);
        }
      }
    }

    return apiClient.put(`/api/v1/hostel/enrolments/${enrolmentId}`, enrolment);
  },

  async getHostelOccupancyStats() {
    const [blocksRes, enrolmentsRes] = await Promise.all([
      this.getBlocks(),
      this.getEnrolments(),
    ]);

    const blocks = blocksRes.data || [];
    const enrolments = enrolmentsRes.data || [];

    const totalBeds = blocks.reduce((acc, b) => acc + (b.totalBeds || 0), 0);
    const occupiedBeds = enrolments.filter((e) => e.status === 'Active').length;
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    return {
      success: true,
      data: {
        totalBlocks: blocks.length,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
      },
      meta: null,
      error: null,
    };
  },
};
