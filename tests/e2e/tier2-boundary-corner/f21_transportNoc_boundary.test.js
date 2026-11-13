/**
 * tests/e2e/tier2-boundary-corner/f21_transportNoc_boundary.test.js
 * Tier 2 Boundary & Corner Cases: Transport Driver & Conductor NOC Management
 *
 * Edge cases:
 * - Incomplete checklist blocks NOC certificate issuance unless manager waiver is granted
 * - Manager waiver issuance requires justification remarks
 * - Missing mandatory fields in NOC registration (staffType, staffName, vehicleAssigned)
 * - Non-existent NOC record lookup error handling
 * - Partial checklist update idempotency
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { transportService } from '../../../src/services/modules/transportService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F21-T2-01: Incomplete checklist blocks NOC certificate issuance without manager waiver', async () => {
  mockAdapter.resetDatabase();

  // Create record with fuelCard and fines un-cleared
  const createRes = await transportService.createNocClearance({
    staffType: 'Driver',
    staffName: 'V. Sundaram',
    vehicleAssigned: 'Bus TN-58-B-3389',
    clearances: {
      vehicleKeys: true,
      fuelCard: false, // Incomplete!
      toolKit: true,
      firstAid: true,
      fastag: true,
      finesCleared: false, // Incomplete!
      kmAuditVerified: true,
    },
  });
  const nocId = createRes.data.id;

  // Attempt to issue certificate without waiver
  const failedIssue = await transportService.issueNocCertificate(nocId, {
    issuedBy: 'A. David Raj (Transport Manager)',
  });

  assertErrorEnvelope(failedIssue, /checklist|clearance|waiver/i, 'Must block NOC issuance with incomplete checklist');

  // Verify status remains in progress
  const getRes = await transportService.getNocById(nocId);
  assert.equal(getRes.data.nocStatus, 'Clearance In Progress');
});

test('F21-T2-02: Manager waiver allows NOC certificate issuance with recorded remarks', async () => {
  mockAdapter.resetDatabase();

  const createRes = await transportService.createNocClearance({
    staffType: 'Conductor',
    staffName: 'N. Ganesan',
    vehicleAssigned: 'Bus TN-58-A-1024',
    clearances: {
      vehicleKeys: true,
      fuelCard: false,
      toolKit: true,
      firstAid: true,
      fastag: true,
      finesCleared: true,
      kmAuditVerified: true,
    },
  });
  const nocId = createRes.data.id;

  // Issue with manager waiver
  const waiverIssue = await transportService.issueNocCertificate(nocId, {
    allowWaiver: true,
    issuedBy: 'A. David Raj (Transport Manager)',
    remarks: 'Fuel card balance verified with accounts department; authorized under manager discretion.',
  });

  assertSuccessEnvelope(waiverIssue, 'Waiver issuance should succeed');
  assert.equal(waiverIssue.data.nocStatus, 'Cleared / NOC Issued');
  assert.ok(waiverIssue.data.certificateNo);
  assert.ok(waiverIssue.data.remarks.includes('Fuel card balance verified'));
});

test('F21-T2-03: Missing mandatory fields in NOC registration is rejected with error envelope', async () => {
  mockAdapter.resetDatabase();

  // Missing staffName
  const missingName = await transportService.createNocClearance({
    staffType: 'Driver',
    vehicleAssigned: 'Bus 01',
  });
  assertErrorEnvelope(missingName, /staffName/i);

  // Missing vehicleAssigned
  const missingVehicle = await transportService.createNocClearance({
    staffType: 'Driver',
    staffName: 'Driver Name',
  });
  assertErrorEnvelope(missingVehicle, /vehicleAssigned/i);
});

test('F21-T2-04: Non-existent NOC record lookup returns error envelope', async () => {
  mockAdapter.resetDatabase();
  const res = await transportService.getNocById('NOC-NON-EXISTENT-9999');
  assertErrorEnvelope(res, /not found/i);
});

test('F21-T2-05: Partial checklist update preserves existing cleared items idempotently', async () => {
  mockAdapter.resetDatabase();

  const createRes = await transportService.createNocClearance({
    staffType: 'Driver',
    staffName: 'K. Saravanan',
    vehicleAssigned: 'Bus 05',
    clearances: {
      vehicleKeys: true,
      fuelCard: false,
      toolKit: true,
      firstAid: false,
      fastag: true,
      finesCleared: false,
      kmAuditVerified: false,
    },
  });
  const nocId = createRes.data.id;

  // Update only finesCleared and firstAid
  const updatedClearances = {
    vehicleKeys: true,
    fuelCard: false,
    toolKit: true,
    firstAid: true, // newly cleared
    fastag: true,
    finesCleared: true, // newly cleared
    kmAuditVerified: false,
  };

  const updateRes = await transportService.updateNocClearance(nocId, {
    clearances: updatedClearances,
  });

  assertSuccessEnvelope(updateRes);
  assert.equal(updateRes.data.clearances.firstAid, true);
  assert.equal(updateRes.data.clearances.finesCleared, true);
  assert.equal(updateRes.data.clearances.vehicleKeys, true);
});
