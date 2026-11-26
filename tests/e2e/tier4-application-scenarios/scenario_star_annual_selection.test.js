/**
 * Tier 4: Real-World Application Scenario Test Suite
 * Scenario 5: Monthly SOM Win Accumulation, Annual SOY Governance & MD Sanction
 *
 * Operational Flow:
 * 1. Student nominated and announced as winner in two distinct months (e.g. October, November).
 * 2. Annual SOY eligibility formula audit confirms >=2 SOM wins, GPA >=8.5, attendance >=95%, and 0 infractions.
 * 3. Formal nomination submitted to Executive Selection Committee.
 * 4. Committee conducts multi-criteria interview scoring and recommends nominee.
 * 5. Managing Director grants final institutional sign-off and issues rolling trophy citation.
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { awardsService } from '../../../src/services/modules/awardsService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('Scenario STAR-01: Candidate accumulates two monthly SOM wins across academic terms', async () => {
  const nomineeId = 'STU-STAR-ANNUAL-01';
  const nomineeName = 'Pranav Venkat';

  // Win 1: October 2025 (Academic Category)
  const som1 = await awardsService.nominateSom({
    month: 'October 2025',
    category: 'ACADEMIC',
    nomineeId,
    nomineeName,
    nominatedById: 'TCH-01',
    nominatedByName: 'Math Teacher',
    checklistScores: { leadership: 20, initiative: 20, discipline: 20 },
  });
  assert.strictEqual(som1.success, true);
  await awardsService.announceSomWinner(som1.data.id);

  // Win 2: November 2025 (Non-Academic / Cultural Category)
  const som2 = await awardsService.nominateSom({
    month: 'November 2025',
    category: 'NON_ACADEMIC',
    nomineeId,
    nomineeName,
    nominatedById: 'TCH-02',
    nominatedByName: 'Music Instructor',
    checklistScores: { talent: 25, teamSpirit: 25 },
  });
  assert.strictEqual(som2.success, true);
  await awardsService.announceSomWinner(som2.data.id);

  // Verify wins count in SOM register
  const allSom = await awardsService.getSomNominations();
  const candidateWins = allSom.data.filter((s) => s.nomineeId === nomineeId && s.status === 'Announced Winner');
  assert.strictEqual(candidateWins.length, 2);
});

test('Scenario STAR-02: Annual SOY eligibility audit validates all 4 governance criteria', async () => {
  const nomineeId = 'STU-STAR-ANNUAL-01';

  // Pre-seed 2 wins
  const n1 = await awardsService.nominateSom({
    month: 'October 2025',
    category: 'ACADEMIC',
    nomineeId,
    nomineeName: 'Pranav Venkat',
    nominatedById: 'TCH-01',
    nominatedByName: 'Teacher',
  });
  await awardsService.announceSomWinner(n1.data.id);

  const n2 = await awardsService.nominateSom({
    month: 'December 2025',
    category: 'NON_ACADEMIC',
    nomineeId,
    nomineeName: 'Pranav Venkat',
    nominatedById: 'TCH-02',
    nominatedByName: 'Teacher',
  });
  await awardsService.announceSomWinner(n2.data.id);

  // Run eligibility audit
  const auditRes = await awardsService.verifySoyEligibility({
    nomineeId,
    academicYear: '2025-2026',
    cumulativeGpa: 9.4,
    attendancePercentage: 98.5,
    infractions: 0,
  });

  assert.strictEqual(auditRes.success, true);
  const data = auditRes.data;
  assert.strictEqual(data.minimumSomWinsMet, true);
  assert.strictEqual(data.gpaMet, true);
  assert.strictEqual(data.attendanceMet, true);
  assert.strictEqual(data.zeroDisciplinaryInfractions, true);
  assert.strictEqual(data.isEligible, true);
});

test('Scenario STAR-03: Nomination submission, Committee evaluation scoring, and MD final sanction', async () => {
  const nomineeId = 'STU-STAR-ANNUAL-01';
  const nomineeName = 'Pranav Venkat';

  // Seed 2 wins
  const w1 = await awardsService.nominateSom({
    month: 'August 2025',
    category: 'ACADEMIC',
    nomineeId,
    nomineeName,
    nominatedById: 'TCH-01',
    nominatedByName: 'Teacher',
  });
  await awardsService.announceSomWinner(w1.data.id);

  const w2 = await awardsService.nominateSom({
    month: 'January 2026',
    category: 'NON_ACADEMIC',
    nomineeId,
    nomineeName,
    nominatedById: 'TCH-02',
    nominatedByName: 'Teacher',
  });
  await awardsService.announceSomWinner(w2.data.id);

  // Step 1: Submit formal SOY nomination
  const nomRes = await awardsService.nominateSoy({
    academicYear: '2025-2026',
    nomineeId,
    nomineeName,
    cumulativeGpa: 9.5,
    attendancePercentage: 98.0,
    infractions: 0,
    achievementsSummary: 'National Olympiad Gold Medalist and Captain of Inter-School Debating Team',
  });
  assert.strictEqual(nomRes.success, true);
  const soyId = nomRes.data.id;
  assert.strictEqual(nomRes.data.status, 'Nominated for Committee Review');

  // Step 2: Executive Committee Evaluation
  const evalRes = await awardsService.evaluateSoyCommittee(soyId, {
    score: 96,
    remarks: 'Unanimous panel recommendation for sterling character and peer leadership.',
    recommendedBy: 'Executive Committee Panel (Principal, Vice-Principal, Head Boy)',
  });
  assert.strictEqual(evalRes.success, true);
  assert.strictEqual(evalRes.data.status, 'Pending MD Final Sign-Off');

  // Step 3: Managing Director Final Sanction & Citation
  const mdRes = await awardsService.approveSoyByMd(soyId, {
    approved: true,
    mdRemarks: 'Proudly sanctioned for the 2025-2026 Chairman Rolling Trophy.',
    citationText: 'Conferred with the Star of the Year award in recognition of outstanding academic brilliance, exemplary sportsmanship, and institutional integrity.',
  });

  assert.strictEqual(mdRes.success, true);
  assert.strictEqual(mdRes.data.status, 'Approved & Selected');
  assert.ok(mdRes.data.managingDirectorApproval.approved);
  assert.ok(mdRes.data.citation.includes('Star of the Year'));

  // Step 4: Verify Recognition Stats reflect the new SOY winner
  const statsRes = await awardsService.getRecognitionStats();
  assert.strictEqual(statsRes.success, true);
  assert.ok(statsRes.data.soyWinnersSelected >= 1);
});
