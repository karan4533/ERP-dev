import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { lostFoundService } from '../../../src/services/modules/lostFoundService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F11-T2-01: reportItem rejects payload missing required fields (type, title, description)', async () => {
  mockAdapter.resetDatabase();
  const missingType = await lostFoundService.reportItem({
    title: 'Water Bottle',
    category: 'Bottles',
    location: 'Cafeteria',
    dateReported: '2026-03-20',
    description: 'Blue insulated bottle',
  });
  assertErrorEnvelope(missingType);

  const missingTitle = await lostFoundService.reportItem({
    type: 'FOUND',
    category: 'Bottles',
    location: 'Cafeteria',
    dateReported: '2026-03-20',
    description: 'Blue insulated bottle',
  });
  assertErrorEnvelope(missingTitle);

  const missingDesc = await lostFoundService.reportItem({
    type: 'FOUND',
    title: 'Water Bottle',
    category: 'Bottles',
    location: 'Cafeteria',
    dateReported: '2026-03-20',
  });
  assertErrorEnvelope(missingDesc);
});

test('F11-T2-02: submitClaim rejects payload missing required claimant identification or proof', async () => {
  mockAdapter.resetDatabase();
  const reportRes = await lostFoundService.reportItem({
    type: 'FOUND',
    title: 'Umbrella Red Fabric',
    category: 'Personal Belongings',
    location: 'Main Porch',
    dateReported: '2026-03-20',
    description: 'Foldable compact red umbrella',
  });
  const itemId = reportRes.data.id;

  const missingProof = await lostFoundService.submitClaim(itemId, {
    claimantId: 'STU-001',
    claimantName: 'Aarav Sharma',
  });
  assertErrorEnvelope(missingProof);

  const missingClaimant = await lostFoundService.submitClaim(itemId, {
    proofDescription: 'Has wooden handle',
  });
  assertErrorEnvelope(missingClaimant);
});

test('F11-T2-03: submitClaim returns error when item ID does not exist', async () => {
  mockAdapter.resetDatabase();
  const res = await lostFoundService.submitClaim('NONEXISTENT-ITEM-999', {
    claimantId: 'STU-001',
    claimantName: 'Aarav Sharma',
    proofDescription: 'Description of non-existent item',
  });
  assertErrorEnvelope(res, /not found/i);
});

test('F11-T2-04: verifyClaim returns error when verifying item with no pending claim', async () => {
  mockAdapter.resetDatabase();
  const reportRes = await lostFoundService.reportItem({
    type: 'FOUND',
    title: 'Lab Notebook Physics',
    category: 'Notebooks',
    location: 'Physics Lab',
    dateReported: '2026-03-20',
    description: 'Class 11 practical record',
  });
  const itemId = reportRes.data.id;

  const res = await lostFoundService.verifyClaim(itemId, {
    status: 'Approved',
  });
  assertErrorEnvelope(res, /no pending claim/i);
});

test('F11-T2-05: handoverItem returns error when item ID does not exist', async () => {
  mockAdapter.resetDatabase();
  const res = await lostFoundService.handoverItem('NONEXISTENT-ITEM-000', {
    custodianName: 'Head Gatekeeper',
  });
  assertErrorEnvelope(res, /not found/i);
});
