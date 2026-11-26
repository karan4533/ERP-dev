import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { lostFoundService } from '../../../src/services/modules/lostFoundService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F11-T1-01: Lost & Found service reports new found item with category, location, and date', async () => {
  mockAdapter.resetDatabase();
  const payload = {
    type: 'FOUND',
    title: 'Titan Fastrack Analog Wristwatch (Black Strap)',
    category: 'Accessories & Watches',
    location: 'Senior Wing Basketball Court',
    dateReported: '2026-03-24',
    description: 'Found near scorekeeper table after inter-house match.',
  };

  const res = await lostFoundService.reportItem(payload);
  assertSuccessEnvelope(res, 'lostFoundService.reportItem');
  assert.ok(res.data.id);
  assert.equal(res.data.type, 'FOUND');
  assert.equal(res.data.title, payload.title);
  assert.equal(res.data.status, 'In Custody / Unclaimed');
});

test('F11-T1-02: Lost & Found service queries items catalog with filtering', async () => {
  mockAdapter.resetDatabase();
  const res = await lostFoundService.getItems({ type: 'FOUND' });
  assertSuccessEnvelope(res, 'lostFoundService.getItems');
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 1);
});

test('F11-T1-03: Lost & Found service submits ownership claim with claimant verification details', async () => {
  mockAdapter.resetDatabase();
  const reportRes = await lostFoundService.reportItem({
    type: 'FOUND',
    title: 'Parker Stainless Steel Fountain Pen',
    category: 'Stationery',
    location: 'Auditorium Row F',
    dateReported: '2026-03-23',
    description: 'Blue ink cartridge loaded in pen',
  });
  const itemId = reportRes.data.id;

  const claimRes = await lostFoundService.submitClaim(itemId, {
    claimantId: 'STU-001',
    claimantName: 'Aarav Sharma',
    claimantPhone: '+91 98765 43210',
    proofDescription: 'Engraved with initials "A.S." on cap.',
  });

  assertSuccessEnvelope(claimRes, 'lostFoundService.submitClaim');
  assert.equal(claimRes.data.status, 'Under Review');
  assert.equal(claimRes.data.claimantDetails.claimantId, 'STU-001');
});

test('F11-T1-04: Lost & Found service verifies and approves valid ownership claim', async () => {
  mockAdapter.resetDatabase();
  const reportRes = await lostFoundService.reportItem({
    type: 'FOUND',
    title: 'Casio Scientific Calculator fx-991CW',
    category: 'Electronics',
    location: 'Chemistry Lab Bench 2',
    dateReported: '2026-03-22',
    description: 'Black dual-power scientific calculator',
  });
  const itemId = reportRes.data.id;

  await lostFoundService.submitClaim(itemId, {
    claimantId: 'STU-002',
    claimantName: 'Kavya Patel',
    proofDescription: 'Battery lid has periodic table sticker.',
  });

  const verifyRes = await lostFoundService.verifyClaim(itemId, {
    status: 'Approved',
    reviewerNotes: 'Verified sticker and student roll number on sticker.',
    verifiedBy: 'Security Supervisor',
  });

  assertSuccessEnvelope(verifyRes, 'lostFoundService.verifyClaim');
  assert.equal(verifyRes.data.status, 'Claim Approved - Ready for Handover');
});

test('F11-T1-05: Lost & Found service completes item handover and closes custody case', async () => {
  mockAdapter.resetDatabase();
  const reportRes = await lostFoundService.reportItem({
    type: 'FOUND',
    title: 'Spectacles with Brown Frame',
    category: 'Personal Belongings',
    location: 'Library Reading Hall',
    dateReported: '2026-03-21',
    description: 'Prescription reading glasses in black magnetic case',
  });
  const itemId = reportRes.data.id;

  await lostFoundService.submitClaim(itemId, {
    claimantId: 'TEA-1001',
    claimantName: 'Anita Verma',
    proofDescription: 'Prescription reading glasses in black case',
  });
  await lostFoundService.verifyClaim(itemId, { status: 'Approved' });

  const handoverRes = await lostFoundService.handoverItem(itemId, {
    custodianName: 'Head Gatekeeper',
    remarks: 'Item handed over to teacher in person with signature.',
  });

  assertSuccessEnvelope(handoverRes, 'lostFoundService.handoverItem');
  assert.equal(handoverRes.data.status, 'Handed Over & Closed');
});

test('F11-T1-06: Lost & Found service returns operational telemetry metrics', async () => {
  mockAdapter.resetDatabase();
  const statsRes = await lostFoundService.getLostFoundStats();
  assertSuccessEnvelope(statsRes, 'lostFoundService.getLostFoundStats');
  assert.ok(typeof statsRes.data.totalFound === 'number');
  assert.ok(typeof statsRes.data.pendingClaims === 'number');
  assert.ok(typeof statsRes.data.resolvedCount === 'number');
});
