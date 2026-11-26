import test from 'node:test';
import assert from 'node:assert/strict';

import { proService } from '../../../services/modules/proService.js';
import { mockAdapter } from '../../../services/api/mockAdapter.js';

test('PRO M1 - ERP Data Handover CRUD & Status Progression', async () => {
  mockAdapter.resetDatabase();

  // Test 1: Fetch initial handovers
  const listRes = await proService.getErpHandovers();
  assert.equal(listRes.success, true);
  assert.ok(Array.isArray(listRes.data));
  const initialCount = listRes.data.length;
  assert.ok(initialCount >= 1);

  // Test 2: Validation - missing required field
  const invalidRes = await proService.createErpHandover({
    batchId: 'BATCH-X',
    // missing dataCategory & handoverBy
  });
  assert.equal(invalidRes.success, false);
  assert.ok(invalidRes.error, 'Validation error must be returned');

  // Test 3: Create valid handover
  const createRes = await proService.createErpHandover({
    batchId: 'ERP-BATCH-TEST-99',
    date: '2026-03-15',
    dataCategory: 'Statutory Licensing & Fire NOC',
    description: 'Updated Municipal Corporation building stability certificate.',
    handoverBy: 'R. Srinivasan (Senior PRO)',
    receivedBy: 'S. Sundaresan (ERP Lead)',
    recordCount: 8,
    attachment: {
      fileName: 'Building_Stability_Cert_2026.pdf',
      fileSize: '1.2 MB',
      uploadedAt: '2026-03-15T11:00:00Z',
    },
    remarks: 'Please map to structural audit records.',
  });

  assert.equal(createRes.success, true);
  assert.equal(createRes.data.batchId, 'ERP-BATCH-TEST-99');
  assert.equal(createRes.data.status, 'Submitted');
  assert.ok(createRes.data.attachment);
  assert.equal(createRes.data.attachment.fileName, 'Building_Stability_Cert_2026.pdf');

  const handoverId = createRes.data.id;

  // Test 4: Update status to 'In Review' then 'Imported'
  const updateRes = await proService.updateErpHandover(handoverId, {
    status: 'Imported',
    remarks: 'Successfully imported into ERP Master DB.',
  });
  assert.equal(updateRes.success, true);
  assert.equal(updateRes.data.status, 'Imported');
  assert.equal(updateRes.data.remarks, 'Successfully imported into ERP Master DB.');

  // Verify in getErpHandoverById
  const getByIdRes = await proService.getErpHandoverById(handoverId);
  assert.equal(getByIdRes.success, true);
  assert.equal(getByIdRes.data.status, 'Imported');
});

test('PRO M1 - Daily Work Update CRUD & Follow-up Tracking', async () => {
  mockAdapter.resetDatabase();

  // Test 1: Fetch initial daily updates
  const listRes = await proService.getDailyWorkUpdates();
  assert.equal(listRes.success, true);
  assert.ok(Array.isArray(listRes.data));
  assert.ok(listRes.data.length >= 1);

  // Test 2: Validation - missing required field
  const invalidRes = await proService.createDailyWorkUpdate({
    officerName: 'Test Officer',
    // missing date and licensingMatter
  });
  assert.equal(invalidRes.success, false);
  assert.ok(invalidRes.error, 'Validation error must be returned');

  // Test 3: Create valid daily update
  const createRes = await proService.createDailyWorkUpdate({
    date: '2026-03-14',
    officerId: 'PRO-EMP-03',
    officerName: 'S. Kausalya (Liaison Officer)',
    authoritiesVisited: ['Regional Transport Office (RTO)', 'Traffic Police Commissionerate'],
    licensingMatter: 'School Bus Route Permits & CCTV Feed Integration',
    meetingSummary: 'Discussed route 14 modification through arterial bypass and CCTV streaming audit.',
    documentsHandled: 'Submitted Bus Fitness Certs #10 to #22.',
    nextFollowUpDate: '2026-03-22',
    status: 'Pending Follow-up',
    remarks: 'Awaiting formal RTO route amendment certificate.',
  });

  assert.equal(createRes.success, true);
  assert.equal(createRes.data.licensingMatter, 'School Bus Route Permits & CCTV Feed Integration');
  assert.equal(createRes.data.status, 'Pending Follow-up');
  assert.deepEqual(createRes.data.authoritiesVisited, [
    'Regional Transport Office (RTO)',
    'Traffic Police Commissionerate',
  ]);

  const updateId = createRes.data.id;

  // Test 4: Update status to 'Completed'
  const updateRes = await proService.updateDailyWorkUpdate(updateId, {
    status: 'Completed',
    remarks: 'Route amendment permit received and filed.',
  });
  assert.equal(updateRes.success, true);
  assert.equal(updateRes.data.status, 'Completed');

  // Verify in getDailyWorkUpdateById
  const singleRes = await proService.getDailyWorkUpdateById(updateId);
  assert.equal(singleRes.success, true);
  assert.equal(singleRes.data.status, 'Completed');
});

test('PRO M1 - Compliance Stats Integration for ERP & Daily Updates', async () => {
  mockAdapter.resetDatabase();

  const statsRes = await proService.getComplianceStats();
  assert.equal(statsRes.success, true);

  // Check new telemetry fields
  assert.ok(typeof statsRes.data.totalErpHandovers === 'number');
  assert.ok(typeof statsRes.data.pendingErpHandovers === 'number');
  assert.ok(typeof statsRes.data.totalDailyUpdates === 'number');
  assert.ok(typeof statsRes.data.pendingDailyVisits === 'number');

  assert.ok(statsRes.data.totalErpHandovers >= 1);
  assert.ok(statsRes.data.totalDailyUpdates >= 1);
});
