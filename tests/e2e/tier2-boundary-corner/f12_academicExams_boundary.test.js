/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Feature F12: Academic & Examinations (Marks Entry, Grade Boundary Calculations, Report Cards)
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { academicService } from '../../../src/services/modules/academicService.js';
import { computeGrade } from '../../../src/services/models/index.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('F12-T2-01: enterMarks rejects theory + practical exceeding maxMarks', async () => {
  const result = await academicService.enterMarks({
    examId: 'EXAM-2025-T1',
    studentId: 'STU-101',
    subjectId: 'SUB-MATH',
    maxMarks: 100,
    theoryMarks: 85,
    practicalMarks: 25, // Total 110 > 100
  });

  assert.strictEqual(result.success, false);
  assert.match(result.error, /cannot exceed maximum marks/i);
});

test('F12-T2-02: enterMarks rejects payloads missing mandatory fields', async () => {
  const result = await academicService.enterMarks({
    examId: 'EXAM-2025-T1',
    // Missing studentId, subjectId, maxMarks, theoryMarks
  });

  assert.strictEqual(result.success, false);
  assert.ok(result.error);
});

test('F12-T2-03: CBSE grade calculation boundary thresholds (A1/A2, C2/D, D/E)', () => {
  // 91.0 is A1, 90.9 is A2
  const g91 = computeGrade(91, 100);
  assert.strictEqual(g91.grade, 'A1');
  assert.strictEqual(g91.gradePoint, 10.0);

  const g90 = computeGrade(90, 100);
  assert.strictEqual(g90.grade, 'A2');
  assert.strictEqual(g90.gradePoint, 9.0);

  // 33.0 is D (Pass cutoff), 32.9 is E (Fail)
  const g33 = computeGrade(33, 100);
  assert.strictEqual(g33.grade, 'D');
  assert.strictEqual(g33.gradePoint, 4.0);

  const g32 = computeGrade(32, 100);
  assert.strictEqual(g32.grade, 'E');
  assert.strictEqual(g32.gradePoint, 0.0);
});

test('F12-T2-04: Non-100 maxMarks scales percentage correctly to standard CBSE scale', () => {
  // Max marks = 50: 16/50 = 32% (E), 17/50 = 34% (D)
  const gFail = computeGrade(16, 50);
  assert.strictEqual(gFail.grade, 'E');

  const gPass = computeGrade(17, 50);
  assert.strictEqual(gPass.grade, 'D');

  // Max marks = 200: 182/200 = 91% (A1)
  const gTop = computeGrade(182, 200);
  assert.strictEqual(gTop.grade, 'A1');
});

test('F12-T2-05: calculateStudentTotals handles empty marks list and failing single subject', () => {
  const emptyTotals = academicService.calculateStudentTotals([]);
  assert.strictEqual(emptyTotals.totalMarks, 0);
  assert.strictEqual(emptyTotals.pass, false);

  // If one subject is failed (< 33%), overall pass must be false even if overall percentage is high
  const marksWithFail = [
    { subjectId: 'SUB-1', totalMarks: 95, maxMarks: 100, percentage: 95 },
    { subjectId: 'SUB-2', totalMarks: 20, maxMarks: 100, percentage: 20 },
  ];
  const failingTotals = academicService.calculateStudentTotals(marksWithFail);
  assert.strictEqual(failingTotals.pass, false);
});
