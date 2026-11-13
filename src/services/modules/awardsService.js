/**
 * Institutional Recognition & Awards Domain Service
 * Handles separate, configurable workflows for Star of the Month (SOM)
 * and Star of the Year (SOY) with eligibility formulas and MD sign-off.
 */

import { apiClient } from '../api/apiClient.js';
import { generateUniqueId, validateRequired } from '../models/index.js';
import { createErrorResponse } from '../api/responseEnvelope.js';

export const awardsService = {
  // ==========================================================================
  // 1. STAR OF THE MONTH (SOM) WORKFLOW
  // ==========================================================================

  async getSomNominations(params = {}) {
    return apiClient.get('/api/v1/awards/som', { params });
  },

  async nominateSom(nominationData = {}) {
    const validation = validateRequired(nominationData, [
      'month',
      'category', // 'ACADEMIC' | 'NON_ACADEMIC'
      'nomineeId',
      'nomineeName',
      'nominatedById',
      'nominatedByName',
    ]);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const scores = nominationData.checklistScores || {};
    const totalScore = Object.values(scores).reduce((acc, v) => acc + (Number(v) || 0), 0);

    const payload = {
      id: generateUniqueId('SOM'),
      status: 'Submitted for Review',
      checklistScores: scores,
      totalScore,
      ...nominationData,
    };

    return apiClient.post('/api/v1/awards/som', payload);
  },

  async reviewSom(nominationId, { status, reviewRemarks, reviewerName }) {
    const nomRes = await apiClient.get(`/api/v1/awards/som/${nominationId}`);
    if (!nomRes.success || !nomRes.data) return nomRes;

    const nomination = nomRes.data;
    nomination.status = status || 'Reviewed';
    nomination.reviewRemarks = reviewRemarks || '';
    nomination.reviewerName = reviewerName || 'Coordinator';

    return apiClient.put(`/api/v1/awards/som/${nominationId}`, nomination);
  },

  async announceSomWinner(nominationId) {
    const nomRes = await apiClient.get(`/api/v1/awards/som/${nominationId}`);
    if (!nomRes.success || !nomRes.data) return nomRes;

    const nomination = nomRes.data;
    nomination.status = 'Announced Winner';
    nomination.announcedDate = new Date().toISOString().split('T')[0];

    return apiClient.put(`/api/v1/awards/som/${nominationId}`, nomination);
  },

  // ==========================================================================
  // 2. STAR OF THE YEAR (SOY) WORKFLOW (ANNUAL & MD SIGN-OFF)
  // ==========================================================================

  async getSoyNominations(params = {}) {
    return apiClient.get('/api/v1/awards/soy', { params });
  },

  /**
   * Verifies annual eligibility criteria:
   * - Minimum 2 SOM wins in the academic year.
   * - Cumulative GPA >= 8.5.
   * - Attendance >= 95%.
   * - Zero disciplinary infractions.
   */
  async verifySoyEligibility({ nomineeId, academicYear = '2025-2026', cumulativeGpa, attendancePercentage, infractions = 0 }) {
    const somRes = await this.getSomNominations();
    const somList = somRes.data || [];

    const somWins = somList.filter(
      (s) => s.nomineeId === nomineeId && s.status === 'Announced Winner'
    ).length;

    const minimumSomWinsMet = somWins >= 2;
    const gpaMet = (Number(cumulativeGpa) || 9.0) >= 8.5;
    const attendanceMet = (Number(attendancePercentage) || 96.0) >= 95.0;
    const zeroInfractions = infractions === 0;

    const isEligible = minimumSomWinsMet && gpaMet && attendanceMet && zeroInfractions;

    return {
      success: true,
      data: {
        nomineeId,
        academicYear,
        somWinsCount: somWins,
        minimumSomWinsMet,
        cumulativeGpa: Number(cumulativeGpa) || 9.0,
        gpaMet,
        attendancePercentage: Number(attendancePercentage) || 96.0,
        attendanceMet,
        zeroDisciplinaryInfractions: zeroInfractions,
        isEligible,
      },
      meta: null,
      error: null,
    };
  },

  async nominateSoy(soyData = {}) {
    const validation = validateRequired(soyData, ['academicYear', 'nomineeId', 'nomineeName']);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const eligibility = await this.verifySoyEligibility(soyData);
    if (!eligibility.data?.isEligible) {
      return createErrorResponse('Nominee does not meet mandatory SOY criteria (requires >= 2 monthly SOM wins, GPA >= 8.5, attendance >= 95%, zero infractions).');
    }

    const payload = {
      id: generateUniqueId('SOY'),
      status: 'Nominated for Committee Review',
      eligibilityVerification: eligibility.data,
      committeeEvaluation: null,
      managingDirectorApproval: { approved: false, mdRemarks: null, timestamp: null },
      citation: null,
      ...soyData,
    };

    return apiClient.post('/api/v1/awards/soy', payload);
  },

  async evaluateSoyCommittee(nominationId, { score, remarks, recommendedBy }) {
    const nomRes = await apiClient.get(`/api/v1/awards/soy/${nominationId}`);
    if (!nomRes.success || !nomRes.data) return nomRes;

    const nomination = nomRes.data;
    nomination.committeeEvaluation = {
      score: Number(score) || 90,
      remarks: remarks || '',
      recommendedBy: recommendedBy || 'Executive Committee Panel',
      evaluatedDate: new Date().toISOString().split('T')[0],
    };
    nomination.status = 'Pending MD Final Sign-Off';

    return apiClient.put(`/api/v1/awards/soy/${nominationId}`, nomination);
  },

  /**
   * Executive MD Final Sign-off for Star of the Year trophy & citation.
   */
  async approveSoyByMd(nominationId, { approved, mdRemarks, citationText } = {}) {
    const nomRes = await apiClient.get(`/api/v1/awards/soy/${nominationId}`);
    if (!nomRes.success || !nomRes.data) return nomRes;

    const nomination = nomRes.data;
    if (nomination.status !== 'Pending MD Final Sign-Off' || !nomination.committeeEvaluation) {
      return createErrorResponse('Nomination must be evaluated by committee before MD final sign-off.');
    }

    nomination.managingDirectorApproval = {
      approved: Boolean(approved),
      mdRemarks: mdRemarks || 'Sanctioned for annual rolling trophy.',
      timestamp: new Date().toISOString(),
    };

    if (approved) {
      nomination.status = 'Approved & Selected';
      nomination.citation = citationText || 'Outstanding academic excellence and sterling institutional leadership.';
    } else {
      nomination.status = 'Declined by MD';
    }

    return apiClient.put(`/api/v1/awards/soy/${nominationId}`, nomination);
  },

  async getRecognitionStats() {
    const [somRes, soyRes] = await Promise.all([
      this.getSomNominations(),
      this.getSoyNominations(),
    ]);

    const som = somRes.data || [];
    const soy = soyRes.data || [];

    return {
      success: true,
      data: {
        totalSomNominations: som.length,
        somWinnersAnnounced: som.filter((s) => s.status === 'Announced Winner').length,
        totalSoyNominations: soy.length,
        soyWinnersSelected: soy.filter((s) => s.status === 'Approved & Selected').length,
      },
      meta: null,
      error: null,
    };
  },
};
