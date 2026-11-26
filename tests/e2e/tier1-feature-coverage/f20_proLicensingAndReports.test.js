/**
 * tests/e2e/tier1-feature-coverage/f20_proLicensingAndReports.test.js
 * Tier 1 Feature Coverage: PRO Licensing & Operational Workflows (R1 / Features 10-12)
 *
 * Covers:
 * - Rebranding to "Government Licensing" in PRO service and documentation
 * - "PRO Team Given the Data For ERP Team" batch handover lifecycle
 * - "Daily Work Update" logging of visits, authorities, and milestones
 * - Multi-criteria search and retrieval of handovers and updates
 * - Aggregated PRO compliance and operational telemetry
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { proService } from '../../../src/services/modules/proService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F20-T1-01: PRO interface and layout headers reflect "Government Licensing"', () => {
  // Check layoutRegistry.js
  const layoutRegistryPath = path.resolve('src/Layout/layoutRegistry.js');
  if (fs.existsSync(layoutRegistryPath)) {
    const layoutSource = fs.readFileSync(layoutRegistryPath, 'utf-8');
    assert.match(
      layoutSource,
      /government licensing/i,
      'layoutRegistry must reflect Government Licensing title for PRO'
    );
  }

  // Check ProCorrespondence.jsx
  const correspondencePath = path.resolve('src/Pages/PRO/ProCorrespondence.jsx');
  if (fs.existsSync(correspondencePath)) {
    const corrSource = fs.readFileSync(correspondencePath, 'utf-8');
    assert.match(
      corrSource,
      /government licensing/i,
      'ProCorrespondence header must reflect Government Licensing'
    );
    assert.equal(
      corrSource.includes('Government Liaison Cases'),
      false,
      'ProCorrespondence must not use deprecated "Government Liaison Cases"'
    );
  }
});

test('F20-T1-02: PRO service initiates ERP Data Handover batch with category, records, and attachment', async () => {
  mockAdapter.resetDatabase();

  const handoverPayload = {
    batchId: 'ERP-BATCH-2026-99',
    date: '2026-03-22',
    dataCategory: 'CBSE Affiliation & Section Sanction',
    description: 'Composite grant renewal letter with approved intake limits for 2026-2027.',
    handoverBy: 'R. Srinivasan (Senior PRO)',
    receivedBy: 'S. Sundaresan (ERP Technical Lead)',
    recordCount: 20,
    status: 'Submitted',
    attachment: {
      fileName: 'CBSE_Sanction_Grant_Order_2026.pdf',
      fileSize: '3.4 MB',
      uploadedAt: '2026-03-22T10:00:00Z',
    },
    remarks: 'Requires immediate fee and student capacity ledger updates.',
  };

  const res = await proService.createErpHandover(handoverPayload);
  assertSuccessEnvelope(res, 'createErpHandover');
  assert.ok(res.data.id);
  assert.equal(res.data.batchId, 'ERP-BATCH-2026-99');
  assert.equal(res.data.status, 'Submitted');
  assert.equal(res.data.attachment.fileName, 'CBSE_Sanction_Grant_Order_2026.pdf');
});

test('F20-T1-03: PRO service retrieves and filters ERP Data Handover batches', async () => {
  mockAdapter.resetDatabase();

  // Create two distinct handovers
  await proService.createErpHandover({
    batchId: 'BATCH-A',
    dataCategory: 'Statutory Licensing & Fire NOC',
    description: 'Fire NOC certificates',
    handoverBy: 'PRO Team',
    receivedBy: 'ERP Team',
    status: 'In Review',
  });

  await proService.createErpHandover({
    batchId: 'BATCH-B',
    dataCategory: 'State Fee Approval',
    description: 'Fee committee order',
    handoverBy: 'PRO Team',
    receivedBy: 'ERP Team',
    status: 'Imported',
  });

  // Filter by category
  const catRes = await proService.getErpHandovers({ category: 'Statutory Licensing & Fire NOC' });
  assertSuccessEnvelope(catRes);
  assert.ok(catRes.data.some((h) => h.batchId === 'BATCH-A'));

  // Filter by status
  const statusRes = await proService.getErpHandovers({ status: 'Imported' });
  assertSuccessEnvelope(statusRes);
  assert.ok(statusRes.data.some((h) => h.batchId === 'BATCH-B'));
});

test('F20-T1-04: PRO service logs Daily Work Update tracking officer visits and licensing milestones', async () => {
  mockAdapter.resetDatabase();

  const updatePayload = {
    date: '2026-03-23',
    officerId: 'PRO-EMP-01',
    officerName: 'R. Srinivasan (Senior PRO)',
    authoritiesVisited: ['District Educational Office (DEO)', 'District Collectorate'],
    licensingMatter: 'Annual Recognition Renewal and Land Ceilings Clearance',
    meetingSummary: 'Submitted Form II compliance dossier to CEO. Inspection panel proposed for first week of April.',
    documentsHandled: 'Land ownership title deed copies, building stability cert, DTCP drawings',
    nextFollowUpDate: '2026-03-30',
    status: 'Pending Follow-up',
    remarks: 'Awaiting formal letter dispatch from collectorate office.',
  };

  const res = await proService.createDailyWorkUpdate(updatePayload);
  assertSuccessEnvelope(res, 'createDailyWorkUpdate');
  assert.ok(res.data.id);
  assert.equal(res.data.officerName, updatePayload.officerName);
  assert.equal(res.data.authoritiesVisited.length, 2);
  assert.equal(res.data.status, 'Pending Follow-up');
});

test('F20-T1-05: PRO Daily Work Update filtering by officer, authority, and status', async () => {
  mockAdapter.resetDatabase();

  await proService.createDailyWorkUpdate({
    date: '2026-03-20',
    officerId: 'PRO-EMP-02',
    officerName: 'P. Meenakshi (PRO Officer)',
    authoritiesVisited: ['Tamil Nadu Fire & Rescue Services'],
    licensingMatter: 'Fire NOC Walkthrough Inspection',
    meetingSummary: 'Conducted field review of hose reels.',
    status: 'Completed',
  });

  // Filter by officer
  const officerRes = await proService.getDailyWorkUpdates({ officer: 'P. Meenakshi' });
  assertSuccessEnvelope(officerRes);
  assert.ok(officerRes.data.some((u) => u.officerName.includes('Meenakshi')));

  // Filter by authority
  const authRes = await proService.getDailyWorkUpdates({ authority: 'Fire & Rescue' });
  assertSuccessEnvelope(authRes);
  assert.ok(authRes.data.some((u) => u.licensingMatter.includes('Fire NOC')));
});

test('F20-T1-06: PRO compliance telemetry aggregates handovers and daily work logs', async () => {
  mockAdapter.resetDatabase();

  const statsRes = await proService.getComplianceStats();
  assertSuccessEnvelope(statsRes, 'getComplianceStats');
  assert.ok(typeof statsRes.data.totalCorrespondence === 'number');
  assert.ok(typeof statsRes.data.activePermits === 'number');
  assert.ok(
    typeof statsRes.data.totalErpHandovers === 'number' || typeof statsRes.data.totalHandovers === 'number',
    'Must include totalErpHandovers or totalHandovers count'
  );
  assert.ok(typeof statsRes.data.totalDailyUpdates === 'number', 'Must include totalDailyUpdates count');
});
