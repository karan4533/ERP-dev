import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { awardsService } from '../../../src/services/modules/awardsService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F15-T1-01: Awards service creates Star of the Month nomination and calculates checklist score', async () => {
  mockAdapter.resetDatabase();
  const nomination = {
    month: 'April 2026',
    category: 'ACADEMIC',
    nomineeId: 'STU-002',
    nomineeName: 'Kavya Patel',
    grade: 'Grade 10',
    section: 'A',
    nominatedById: 'EMP-TCH-001',
    nominatedByName: 'Anita Verma',
    checklistScores: { punctuality: 5, hygiene: 5, mentoring: 5, homework: 4, ethics: 5 },
  };

  const res = await awardsService.nominateSom(nomination);
  assertSuccessEnvelope(res, 'awardsService.nominateSom');
  assert.ok(res.data.id);
  assert.equal(res.data.totalScore, 24);
  assert.equal(res.data.status, 'Submitted for Review');
});

test('F15-T1-02: Awards service reviews nomination and announces SOM winner', async () => {
  mockAdapter.resetDatabase();
  const nomRes = await awardsService.nominateSom({
    month: 'March 2026',
    category: 'SPORTS',
    nomineeId: 'STU-003',
    nomineeName: 'Rahul Dravid Jr.',
    nominatedById: 'EMP-TCH-002',
    nominatedByName: 'Physical Education Teacher',
    checklistScores: { punctuality: 5, hygiene: 5, mentoring: 4, homework: 4, ethics: 5 },
  });
  const nomId = nomRes.data.id;

  const reviewRes = await awardsService.reviewSom(nomId, {
    status: 'Approved by Committee',
    reviewerName: 'Awards Committee Head',
    reviewRemarks: 'Exemplary performance in inter-school athletics meet',
  });
  assertSuccessEnvelope(reviewRes);
  assert.equal(reviewRes.data.status, 'Approved by Committee');

  const announceRes = await awardsService.announceSomWinner(nomId);
  assertSuccessEnvelope(announceRes, 'awardsService.announceSomWinner');
  assert.equal(announceRes.data.status, 'Announced Winner');
});

test('F15-T1-03: Awards service validates Star of the Year eligibility requiring minimum 2 monthly wins', async () => {
  mockAdapter.resetDatabase();
  // Aarav Sharma (STU-001) has 2 monthly SOM wins in seed data
  const eligibleCheck = await awardsService.verifySoyEligibility({
    nomineeId: 'STU-001',
    academicYear: '2025-2026',
    cumulativeGpa: 9.5,
    attendancePercentage: 96.0,
    infractions: 0,
  });

  assertSuccessEnvelope(eligibleCheck, 'awardsService.verifySoyEligibility');
  assert.equal(eligibleCheck.data.isEligible, true);
  assert.ok(eligibleCheck.data.somWinsCount >= 2);
});

test('F15-T1-04: Awards service evaluates SOY nominee through Selection Committee scoring', async () => {
  mockAdapter.resetDatabase();
  const soyNom = await awardsService.nominateSoy({
    academicYear: '2025-2026',
    nomineeId: 'STU-001',
    nomineeName: 'Aarav Sharma',
    cumulativeGpa: 9.8,
    attendancePercentage: 97.5,
  });
  assertSuccessEnvelope(soyNom);
  const soyId = soyNom.data.id;

  const evalRes = await awardsService.evaluateSoyCommittee(soyId, {
    score: 96,
    remarks: 'Unanimously recommended for outstanding scholastic and community leadership',
    recommendedBy: 'Selection Committee Panel',
  });

  assertSuccessEnvelope(evalRes, 'awardsService.evaluateSoyCommittee');
  assert.equal(evalRes.data.status, 'Pending MD Final Sign-Off');
  assert.equal(evalRes.data.committeeEvaluation.score, 96);
});

test('F15-T1-05: Awards service executes executive MD final sign-off for Star of the Year', async () => {
  mockAdapter.resetDatabase();
  const soyNom = await awardsService.nominateSoy({
    academicYear: '2025-2026',
    nomineeId: 'STU-001',
    nomineeName: 'Aarav Sharma',
    cumulativeGpa: 9.8,
    attendancePercentage: 97.5,
  });
  const soyId = soyNom.data.id;
  await awardsService.evaluateSoyCommittee(soyId, { score: 98 });

  const mdRes = await awardsService.approveSoyByMd(soyId, {
    approved: true,
    mdRemarks: 'Sanctioned for Annual Rolling Trophy and Scholarship Citation',
    citationText: 'Presented for peer mentoring, 100% academic excellence, and sportsmanship.',
  });

  assertSuccessEnvelope(mdRes, 'awardsService.approveSoyByMd');
  assert.equal(mdRes.data.status, 'Approved & Selected');
  assert.equal(mdRes.data.managingDirectorApproval.approved, true);
});

test('F15-T1-06: Awards service retrieves institutional recognition statistics', async () => {
  mockAdapter.resetDatabase();
  const statsRes = await awardsService.getRecognitionStats();
  assertSuccessEnvelope(statsRes, 'awardsService.getRecognitionStats');
  assert.ok(typeof statsRes.data.totalSomNominations === 'number');
  assert.ok(typeof statsRes.data.somWinnersAnnounced === 'number');
  assert.ok(typeof statsRes.data.totalSoyNominations === 'number');
});
