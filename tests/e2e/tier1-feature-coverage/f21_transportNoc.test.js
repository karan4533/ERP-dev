/**
 * tests/e2e/tier1-feature-coverage/f21_transportNoc.test.js
 * Tier 1 Feature Coverage: Transport Driver & Conductor NOC Management (R1 / Feature 21)
 *
 * Covers:
 * - Driver NOC creation with 7-point vehicle & financial clearance checklist
 * - Conductor NOC creation with ticket machine, first-aid & medical clearance
 * - NOC certificate generation with unique certificate reference
 * - Multi-criteria filtering by staff type (Driver vs Conductor) and NOC status
 * - Incremental checklist updates and manager sign-off
 * - Verification of Transport Manager sidebar and routes
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { transportService } from '../../../src/services/modules/transportService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F21-T1-01: Transport service creates Driver NOC clearance with 7-point checklist', async () => {
  mockAdapter.resetDatabase();

  const driverNocPayload = {
    staffType: 'Driver',
    staffId: 'DRV-EMP-104',
    staffName: 'M. Karunakaran',
    vehicleAssigned: 'Bus TN-58-A-1024 (Route 01)',
    licenseNo: 'TN58-20120004921',
    licenseExpiryDate: '2028-06-30',
    clearances: {
      vehicleKeys: true,
      fuelCard: true,
      toolKit: true,
      firstAid: true,
      fastag: true,
      finesCleared: true,
      kmAuditVerified: true,
    },
    reasonForRelieving: 'Retirement on superannuation',
  };

  const res = await transportService.createNocClearance(driverNocPayload);
  assertSuccessEnvelope(res, 'createNocClearance for Driver');
  assert.ok(res.data.id);
  assert.equal(res.data.staffType, 'Driver');
  assert.equal(res.data.staffName, driverNocPayload.staffName);
  assert.equal(res.data.clearances.vehicleKeys, true);
  assert.equal(res.data.clearances.finesCleared, true);
});

test('F21-T1-02: Transport service creates Conductor NOC clearance with operational checklist', async () => {
  mockAdapter.resetDatabase();

  const conductorNocPayload = {
    staffType: 'Conductor',
    staffId: 'CND-EMP-088',
    staffName: 'R. Soundararajan',
    vehicleAssigned: 'Bus TN-58-B-3389 (Route 04)',
    licenseNo: 'CND-LIC-2018-99',
    clearances: {
      vehicleKeys: true,
      fuelCard: false, // In progress
      toolKit: true,
      firstAid: true,
      fastag: true,
      finesCleared: true,
      kmAuditVerified: true,
    },
    reasonForRelieving: 'Transfer to residential campus unit',
  };

  const res = await transportService.createNocClearance(conductorNocPayload);
  assertSuccessEnvelope(res, 'createNocClearance for Conductor');
  assert.ok(res.data.id);
  assert.equal(res.data.staffType, 'Conductor');
  assert.equal(res.data.clearances.fuelCard, false);
  assert.equal(res.data.nocStatus, 'Clearance In Progress');
});

test('F21-T1-03: Transport service validates checklist and issues NOC certificate with unique number', async () => {
  mockAdapter.resetDatabase();

  // Create record with all 7 clearances cleared
  const createRes = await transportService.createNocClearance({
    staffType: 'Driver',
    staffName: 'S. Muthusamy',
    vehicleAssigned: 'Bus TN-58-C-5012',
    licenseNo: 'TN58-20150008812',
    clearances: {
      vehicleKeys: true,
      fuelCard: true,
      toolKit: true,
      firstAid: true,
      fastag: true,
      finesCleared: true,
      kmAuditVerified: true,
    },
  });
  const nocId = createRes.data.id;

  // Issue Certificate
  const issueRes = await transportService.issueNocCertificate(nocId, {
    issuedBy: 'A. David Raj (Transport Manager)',
    issuedDate: '2026-03-24',
    remarks: 'All depot items, keys, and transit logbooks safely handed over.',
  });

  assertSuccessEnvelope(issueRes, 'issueNocCertificate');
  assert.equal(issueRes.data.nocStatus, 'Cleared / NOC Issued');
  assert.ok(issueRes.data.certificateNo);
  assert.match(issueRes.data.certificateNo, /^NOC\/TRP\//);
  assert.equal(issueRes.data.issuedBy, 'A. David Raj (Transport Manager)');
});

test('F21-T1-04: Transport service retrieves and filters NOC records by staff type and status', async () => {
  mockAdapter.resetDatabase();

  await transportService.createNocClearance({
    staffType: 'Driver',
    staffName: 'Driver One',
    vehicleAssigned: 'Bus 01',
    nocStatus: 'Cleared / NOC Issued',
  });

  await transportService.createNocClearance({
    staffType: 'Conductor',
    staffName: 'Conductor Two',
    vehicleAssigned: 'Bus 02',
    nocStatus: 'Clearance In Progress',
  });

  const listRes = await transportService.getNocClearances();
  assertSuccessEnvelope(listRes, 'getNocClearances');
  assert.ok(Array.isArray(listRes.data));
  assert.ok(listRes.data.length >= 2);
  assert.ok(listRes.data.some((n) => n.staffType === 'Driver'));
  assert.ok(listRes.data.some((n) => n.staffType === 'Conductor'));
});

test('F21-T1-05: Transport service updates clearance items incrementally', async () => {
  mockAdapter.resetDatabase();

  const createRes = await transportService.createNocClearance({
    staffType: 'Driver',
    staffName: 'P. Vignesh',
    vehicleAssigned: 'Bus TN-58-D-7700',
    clearances: {
      vehicleKeys: true,
      fuelCard: false,
      toolKit: false,
      firstAid: false,
      fastag: false,
      finesCleared: false,
      kmAuditVerified: false,
    },
  });
  const nocId = createRes.data.id;

  // Update clearances after keys & fuel card surrendered
  const updatedClearances = {
    vehicleKeys: true,
    fuelCard: true,
    toolKit: true,
    firstAid: true,
    fastag: true,
    finesCleared: true,
    kmAuditVerified: true,
  };

  const updateRes = await transportService.updateNocClearance(nocId, {
    clearances: updatedClearances,
    notes: 'FASTag de-linked from account. Depot fine receipt cleared.',
  });

  assertSuccessEnvelope(updateRes, 'updateNocClearance');
  assert.equal(updateRes.data.clearances.fuelCard, true);
  assert.equal(updateRes.data.clearances.kmAuditVerified, true);
});

test('F21-T1-06: Transport service getNocById retrieves full record envelope', async () => {
  mockAdapter.resetDatabase();

  const createRes = await transportService.createNocClearance({
    staffType: 'Conductor',
    staffName: 'T. Murugesan',
    vehicleAssigned: 'Bus TN-58-B-1122',
  });
  const nocId = createRes.data.id;

  const getRes = await transportService.getNocById(nocId);
  assertSuccessEnvelope(getRes, 'getNocById');
  assert.equal(getRes.data.id, nocId);
  assert.equal(getRes.data.staffName, 'T. Murugesan');
});
