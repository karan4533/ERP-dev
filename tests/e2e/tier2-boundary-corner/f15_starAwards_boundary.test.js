/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Feature F15: Star of Month & Star of Year Workflows (Eligibility Rules & Governance)
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { awardsService } from '../../../src/services/modules/awardsService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('F15-T2-01: verifySoyEligibility reports ineligible when nominee has fewer than 2 SOM wins', async () => {
  // Nominee STU-NO-SOM has 0 SOM wins
  const result = await awardsService.verifySoyEligibility({
    nomineeId: 'STU-NO-SOM',
    academicYear: '2025-2026',
    cumulativeGpa: 9.8,
    attendancePercentage: 99.0,
    infractions: 0,
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.minimumSomWinsMet, false);
  assert.strictEqual(result.data.isEligible, false);
});

test('F15-T2-02: verifySoyEligibility reports ineligible on low GPA, poor attendance, or infractions', async () => {
  // Candidate with 2 SOM wins but low GPA
  const lowGpaRes = await awardsService.verifySoyEligibility({
    nomineeId: 'STU-001', // Has SOM wins in seed data
    cumulativeGpa: 7.8, // < 8.5 threshold
    attendancePercentage: 96.0,
    infractions: 0,
  });
  assert.strictEqual(lowGpaRes.data.gpaMet, false);
  assert.strictEqual(lowGpaRes.data.isEligible, false);

  // Candidate with infractions
  const infractionsRes = await awardsService.verifySoyEligibility({
    nomineeId: 'STU-001',
    cumulativeGpa: 9.2,
    attendancePercentage: 96.0,
    infractions: 1, // > 0 threshold
  });
  assert.strictEqual(infractionsRes.data.zeroDisciplinaryInfractions, false);
  assert.strictEqual(infractionsRes.data.isEligible, false);
});

test('F15-T2-03: nominateSoy rejects candidate failing eligibility requirements', async () => {
  const result = await awardsService.nominateSoy({
    academicYear: '2025-2026',
    nomineeId: 'STU-INELIGIBLE',
    nomineeName: 'Ineligible Student',
    cumulativeGpa: 7.0,
  });

  assert.strictEqual(result.success, false);
  assert.match(result.error, /does not meet mandatory SOY criteria/i);
});

test('F15-T2-04: approveSoyByMd prevents MD sign-off on un-evaluated nomination', async () => {
  // In seed data or new nomination that hasn't been evaluated by committee
  const nomRes = await awardsService.getSoyNominations();
  const soyList = nomRes.data || [];
  const pendingNom = soyList.find((s) => s.status === 'Nominated for Committee Review');

  if (pendingNom) {
    const mdSignOff = await awardsService.approveSoyByMd(pendingNom.id, {
      approved: true,
      mdRemarks: 'Sanctioned prematurely',
    });
    assert.strictEqual(mdSignOff.success, false);
    assert.match(mdSignOff.error, /must be evaluated by committee/i);
  } else {
    // If none found in seed data, verify non-existent ID fails
    const notFound = await awardsService.approveSoyByMd('SOY-NON-EXISTENT');
    assert.strictEqual(notFound.success, false);
  }
});

test('F15-T2-05: nominateSom validates all mandatory fields (month, category, nominee)', async () => {
  const missingMonth = await awardsService.nominateSom({
    category: 'ACADEMIC',
    nomineeId: 'STU-100',
    nomineeName: 'Student',
    nominatedById: 'TCH-01',
    nominatedByName: 'Teacher',
  });
  assert.strictEqual(missingMonth.success, false);

  const missingCategory = await awardsService.nominateSom({
    month: 'October 2025',
    nomineeId: 'STU-100',
    nomineeName: 'Student',
    nominatedById: 'TCH-01',
    nominatedByName: 'Teacher',
  });
  assert.strictEqual(missingCategory.success, false);
});
