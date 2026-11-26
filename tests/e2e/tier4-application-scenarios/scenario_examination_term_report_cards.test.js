/**
 * Tier 4: Real-World Application Scenario Test Suite
 * Scenario 4: Examination Term Marks Entry, CBSE Grade Tabulation & Report Card Dossier Generation
 *
 * Operational Flow:
 * 1. Teacher views scheduled examination term and reviews student class dossier.
 * 2. Teacher inputs theory and practical marks for multiple scholastic subjects.
 * 3. System enforces maxMarks limits and calculates CBSE letter grades (A1-E) and grade points (10.0-0.0).
 * 4. Comprehensive Term Report Card generated with co-scholastic domain ratings, attendance percentage, and remarks.
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { academicService } from '../../../src/services/modules/academicService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('Scenario EXAM-01: Teacher views examination session and accesses student academic dossier', async () => {
  const examsRes = await academicService.getExamSessions();
  assert.strictEqual(examsRes.success, true);
  assert.ok(examsRes.data.length > 0);

  const studentId = 'STU-001';
  const dossierRes = await academicService.getStudentDossier(studentId);
  assert.strictEqual(dossierRes.success, true);
  assert.strictEqual(dossierRes.data.studentId, studentId);
  assert.ok(dossierRes.data.attendancePercentage >= 90.0);
});

test('Scenario EXAM-02: Subject teachers enter theory & practical marks with CBSE grade automation', async () => {
  const studentId = 'STU-EXAM-SCN-01';
  const examId = 'EXAM-2025-T2';

  // Subject 1: Mathematics (Theory: 75, Practical: 20 -> Total 95 -> A1, GP: 10.0)
  const mathRes = await academicService.enterMarks({
    examId,
    studentId,
    subjectId: 'SUB-MATH',
    subjectName: 'Mathematics Standard',
    maxMarks: 100,
    theoryMarks: 75,
    practicalMarks: 20,
  });
  assert.strictEqual(mathRes.success, true);
  assert.strictEqual(mathRes.data.totalMarks, 95);
  assert.strictEqual(mathRes.data.gradeAwarded, 'A1');
  assert.strictEqual(mathRes.data.gradePoint, 10.0);

  // Subject 2: Science (Theory: 68, Practical: 18 -> Total 86 -> A2, GP: 9.0)
  const sciRes = await academicService.enterMarks({
    examId,
    studentId,
    subjectId: 'SUB-SCI',
    subjectName: 'Science & Technology',
    maxMarks: 100,
    theoryMarks: 68,
    practicalMarks: 18,
  });
  assert.strictEqual(sciRes.success, true);
  assert.strictEqual(sciRes.data.totalMarks, 86);
  assert.strictEqual(sciRes.data.gradeAwarded, 'A2');
  assert.strictEqual(sciRes.data.gradePoint, 9.0);

  // Subject 3: English (Theory: 72, Practical: 0 -> Total 72 -> B1, GP: 8.0)
  const engRes = await academicService.enterMarks({
    examId,
    studentId,
    subjectId: 'SUB-ENG',
    subjectName: 'English Communicative',
    maxMarks: 100,
    theoryMarks: 72,
    practicalMarks: 0,
  });
  assert.strictEqual(engRes.success, true);
  assert.strictEqual(engRes.data.totalMarks, 72);
  assert.strictEqual(engRes.data.gradeAwarded, 'B1');
  assert.strictEqual(engRes.data.gradePoint, 8.0);
});

test('Scenario EXAM-03: Generating comprehensive student report card with co-scholastics and attendance', async () => {
  const studentId = 'STU-EXAM-SCN-02';
  const examId = 'EXAM-2025-T2';

  // Enter marks for two subjects
  await academicService.enterMarks({
    examId,
    studentId,
    subjectId: 'SUB-MATH',
    maxMarks: 100,
    theoryMarks: 80,
    practicalMarks: 15,
  });
  await academicService.enterMarks({
    examId,
    studentId,
    subjectId: 'SUB-ENG',
    maxMarks: 100,
    theoryMarks: 85,
    practicalMarks: 0,
  });

  // Generate Report Card
  const reportRes = await academicService.getReportCard(studentId, {
    examId,
    academicYear: '2025-2026',
  });

  assert.strictEqual(reportRes.success, true);
  const rc = reportRes.data;
  assert.strictEqual(rc.studentId, studentId);
  assert.strictEqual(rc.scholasticMarks.length, 2);
  assert.strictEqual(rc.summary.pass, true);
  assert.ok(rc.summary.totalMarks === 180);
  assert.ok(rc.summary.maxMarks === 200);
  assert.ok(rc.summary.percentage === 90.0);
  assert.ok(Array.isArray(rc.coScholastics));
  assert.ok(rc.coScholastics.length >= 4);
  assert.ok(rc.teacherRemarks.length > 0);
});
