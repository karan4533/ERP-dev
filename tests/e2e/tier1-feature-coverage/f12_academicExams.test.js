import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { academicService } from '../../../src/services/modules/academicService.js';
import { computeGrade } from '../../../src/services/models/index.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F12-T1-01: Academic service enters theory and practical marks and computes total and CBSE grade', async () => {
  mockAdapter.resetDatabase();
  const res = await academicService.enterMarks({
    examId: 'EXAM-2025-T2',
    studentId: 'STU-002',
    subjectId: 'SUB-SCI',
    subjectName: 'Science',
    maxMarks: 100,
    theoryMarks: 76,
    practicalMarks: 19,
  });

  assertSuccessEnvelope(res, 'academicService.enterMarks');
  assert.equal(res.data.totalMarks, 95);
  assert.equal(res.data.gradeAwarded, 'A1');
  assert.equal(res.data.gradePoint, 10.0);
});

test('F12-T1-02: Academic grade calculation correctly evaluates percentages across CBSE grade bands', () => {
  assert.equal(academicService.calculateGrade(92).grade, 'A1');
  assert.equal(academicService.calculateGrade(82).grade, 'A2');
  assert.equal(academicService.calculateGrade(72).grade, 'B1');
  assert.equal(academicService.calculateGrade(62).grade, 'B2');
  assert.equal(academicService.calculateGrade(52).grade, 'C1');
  assert.equal(academicService.calculateGrade(42).grade, 'C2');
  assert.equal(academicService.calculateGrade(35).grade, 'D');
  assert.equal(academicService.calculateGrade(20).grade, 'E');
});

test('F12-T1-03: Academic service generates comprehensive report card with scholastic marks and summary', async () => {
  mockAdapter.resetDatabase();
  const res = await academicService.getReportCard('STU-001', { examId: 'EXAM-2025-T2' });
  assertSuccessEnvelope(res, 'academicService.getReportCard');
  assert.equal(res.data.studentId, 'STU-001');
  assert.ok(Array.isArray(res.data.scholasticMarks));
  assert.ok(res.data.scholasticMarks.length >= 4);
  assert.equal(res.data.summary.pass, true);
  assert.ok(res.data.summary.percentage > 80);
});

test('F12-T1-04: Academic service generates teacher student dossier with complete profile and transport info', async () => {
  mockAdapter.resetDatabase();
  const res = await academicService.getStudentDossier('STU-001');
  assertSuccessEnvelope(res, 'academicService.getStudentDossier');
  assert.equal(res.data.fullName, 'Aarav Sharma');
  assert.ok(res.data.parentDetails.fatherPhone);
  assert.ok(res.data.transportInfo.busNumber);
});

test('F12-T1-05: Academic service calculates cumulative student totals, average, and pass status', () => {
  const subjectScores = [
    { totalMarks: 90, maxMarks: 100 },
    { totalMarks: 85, maxMarks: 100 },
    { totalMarks: 95, maxMarks: 100 },
  ];
  const totals = academicService.calculateStudentTotals(subjectScores);
  assert.equal(totals.totalMarks, 270);
  assert.equal(totals.maxMarks, 300);
  assert.equal(totals.percentage, 90);
  assert.equal(totals.overallGrade, 'A2');
  assert.equal(totals.pass, true);
});

test('F12-T1-06: Academic service retrieves registered examinations list', async () => {
  mockAdapter.resetDatabase();
  const res = await academicService.getExamSessions();
  assertSuccessEnvelope(res, 'academicService.getExamSessions');
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 1);
});
