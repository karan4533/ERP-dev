/**
 * Academic & Examination Management Domain Service
 * Handles marks entry, grade calculations, report card generation,
 * and comprehensive student academic dossiers for teachers.
 */

import { apiClient } from '../api/apiClient.js';
import { computeGrade, generateUniqueId, validateRequired } from '../models/index.js';
import { createErrorResponse } from '../api/responseEnvelope.js';

export const academicService = {
  // ==========================================================================
  // 1. EXAM SESSIONS & MARKS ENTRY
  // ==========================================================================

  async getExamSessions(params = {}) {
    return apiClient.get('/api/v1/academics/exams', { params });
  },

  async getMarks(params = {}) {
    return apiClient.get('/api/v1/academics/marks', { params });
  },

  /**
   * Enters marks for a student or batch of students with automated grade calculation.
   */
  async enterMarks(markEntryData = {}) {
    const validation = validateRequired(markEntryData, [
      'examId',
      'studentId',
      'subjectId',
      'maxMarks',
      'theoryMarks',
    ]);
    if (!validation.valid) return createErrorResponse(validation.errors);

    const maxMarks = Number(markEntryData.maxMarks) || 100;
    const theoryMarks = Number(markEntryData.theoryMarks) || 0;
    const practicalMarks = Number(markEntryData.practicalMarks) || 0;
    const totalMarks = theoryMarks + practicalMarks;

    if (totalMarks > maxMarks) {
      return createErrorResponse(`Total marks (${totalMarks}) cannot exceed maximum marks (${maxMarks}).`);
    }

    const percentage = Number(((totalMarks / maxMarks) * 100).toFixed(1));
    const gradeInfo = computeGrade(totalMarks, maxMarks);

    const payload = {
      id: markEntryData.id || generateUniqueId(`MRK-${markEntryData.studentId}-${markEntryData.subjectId}`),
      examId: markEntryData.examId,
      studentId: markEntryData.studentId,
      grade: markEntryData.grade || 'Grade 10',
      section: markEntryData.section || 'A',
      subjectId: markEntryData.subjectId,
      subjectName: markEntryData.subjectName || markEntryData.subjectId,
      maxMarks,
      theoryMarks,
      practicalMarks,
      totalMarks,
      percentage,
      gradeAwarded: gradeInfo.grade,
      gradePoint: gradeInfo.gradePoint,
    };

    return apiClient.post('/api/v1/academics/marks', payload);
  },

  // ==========================================================================
  // 2. GRADE CALCULATION & TOTALS
  // ==========================================================================

  calculateGrade(percentageOrMarks, maxMarks) {
    return computeGrade(percentageOrMarks, maxMarks);
  },

  computeGrade(totalMarks, maxMarks) {
    return computeGrade(totalMarks, maxMarks);
  },

  calculateStudentTotals(marksList = []) {
    if (!Array.isArray(marksList) || marksList.length === 0) {
      return { totalMarks: 0, maxMarks: 0, percentage: 0, overallGrade: 'N/A', pass: false };
    }

    const totalMarks = marksList.reduce((acc, m) => acc + (m.totalMarks || 0), 0);
    const maxMarks = marksList.reduce((acc, m) => acc + (m.maxMarks || 100), 0);
    const percentage = maxMarks > 0 ? Number(((totalMarks / maxMarks) * 100).toFixed(1)) : 0;
    const gradeInfo = computeGrade(totalMarks, maxMarks);
    const hasFailedSubject = marksList.some((m) => {
      const subjectPct = m.percentage !== undefined
        ? Number(m.percentage)
        : (m.maxMarks > 0 ? (Number(m.totalMarks) / Number(m.maxMarks)) * 100 : 0);
      return subjectPct < 33;
    });

    return {
      totalMarks,
      maxMarks,
      percentage,
      overallGrade: gradeInfo.grade,
      gradePoint: gradeInfo.gradePoint,
      pass: !hasFailedSubject && percentage >= 33,
    };
  },

  // ==========================================================================
  // 3. REPORT CARD GENERATION
  // ==========================================================================

  async getReportCard(studentId, { examId, academicYear = '2025-2026' } = {}) {
    const [marksRes, dossierRes] = await Promise.all([
      this.getMarks({ studentId }),
      this.getStudentDossier(studentId),
    ]);

    const allMarks = marksRes.data || [];
    const studentMarks = allMarks.filter((m) => {
      const matchStudent = m.studentId === studentId;
      const matchExam = examId ? m.examId === examId : true;
      return matchStudent && matchExam;
    });

    const totals = this.calculateStudentTotals(studentMarks);
    const dossier = dossierRes.data || {};

    return {
      success: true,
      data: {
        studentId,
        studentName: dossier.fullName || 'Student',
        admissionNumber: dossier.admissionNumber || studentId,
        grade: dossier.grade || 'Grade 10',
        section: dossier.section || 'A',
        academicYear,
        examId: examId || 'EXAM-2025-T2',
        scholasticMarks: studentMarks,
        summary: totals,
        coScholastics: dossier.coScholasticRatings || [
          { domain: 'Work Education / IT Skills', grade: 'A' },
          { domain: 'Art & Cultural Education', grade: 'A' },
          { domain: 'Health & Physical Education', grade: 'A' },
          { domain: 'Discipline & Conduct', grade: 'A' },
        ],
        attendancePercentage: dossier.attendancePercentage || 95.0,
        teacherRemarks: totals.pass
          ? 'Consistently diligent, exhibits sterling academic and peer leadership.'
          : 'Requires remedial guidance in key subjects.',
        generatedDate: new Date().toISOString().split('T')[0],
      },
      meta: null,
      error: null,
    };
  },

  // ==========================================================================
  // 4. TEACHER STUDENT DOSSIER
  // ==========================================================================

  async getStudentDossier(studentId) {
    const dossiersRes = await apiClient.get('/api/v1/academics/dossiers');
    if (!dossiersRes.success || !Array.isArray(dossiersRes.data)) return dossiersRes;

    const found = dossiersRes.data.find((d) => d.studentId === studentId);
    if (found) {
      return { success: true, data: found, meta: null, error: null };
    }

    // Default dossier fallback for demo students
    return {
      success: true,
      data: {
        studentId,
        admissionNumber: `ADM-${studentId}`,
        fullName: 'Enrolled Student',
        gender: 'Male',
        grade: 'Grade 10',
        section: 'A',
        attendancePercentage: 94.0,
        scholasticRank: 5,
        parentDetails: {
          fatherName: 'Guardian',
          fatherPhone: '+91 98400 00000',
        },
      },
      meta: null,
      error: null,
    };
  },
};
