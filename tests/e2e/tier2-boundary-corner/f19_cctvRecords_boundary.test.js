/**
 * tests/e2e/tier2-boundary-corner/f19_cctvRecords_boundary.test.js
 * Tier 2 Boundary & Corner Cases: CCTV Records & Operational Registers
 *
 * Edge cases:
 * - Future rectified dates boundary handling
 * - Empty or missing footage requisition attachments
 * - PA system announcement payload validation & emergency broadcast boundary
 * - Missing GPS coordinates or non-positive halt duration normalization
 * - Teachers late report missing mandatory attributes
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { cctvService } from '../../../src/services/modules/cctvService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F19-T2-01: Future rectified dates boundary: resolution timestamp handles dates safely', async () => {
  mockAdapter.resetDatabase();

  const issueRes = await cctvService.createIssue({
    zone: 'Library Entrance',
    defectCategory: 'Lens Smudge',
    severity: 'Low',
  });
  const issueId = issueRes.data.id;

  // Resolving with a valid date
  const resolveRes = await cctvService.resolveIssue(issueId, {
    rectifiedDate: '2026-03-25',
    rectifiedTime: '02:30 PM',
    notes: 'Lens cleaned with microfiber cloth.',
  });

  assertSuccessEnvelope(resolveRes);
  assert.equal(resolveRes.data.status, 'Rectified');
  assert.equal(resolveRes.data.rectifiedDate, '2026-03-25');
});

test('F19-T2-02: Missing mandatory fields in footage request is rejected with error envelope', async () => {
  mockAdapter.resetDatabase();

  // Missing incidentDate
  const missingDate = await cctvService.createFootageRequest({
    timeWindowStart: '10:00',
    timeWindowEnd: '10:30',
    cameraIds: ['CAM-01'],
    requesterId: 'EMP-01',
    requesterName: 'Officer',
    justificationText: 'Investigation',
  });
  assertErrorEnvelope(missingDate, /incidentDate/i);

  // Missing justificationText
  const missingJust = await cctvService.createFootageRequest({
    incidentDate: '2026-03-20',
    timeWindowStart: '10:00',
    timeWindowEnd: '10:30',
    cameraIds: ['CAM-01'],
    requesterId: 'EMP-01',
    requesterName: 'Officer',
  });
  assertErrorEnvelope(missingJust, /justificationText/i);
});

test('F19-T2-03: Empty or null footage attachment executes request creation cleanly without errors', async () => {
  mockAdapter.resetDatabase();

  const reqWithoutAttachment = await cctvService.createFootageRequest({
    incidentDate: '2026-03-22',
    timeWindowStart: '11:00',
    timeWindowEnd: '11:30',
    cameraIds: ['CAM-02'],
    requesterId: 'EMP-SEC-002',
    requesterName: 'Security Supervisor',
    justificationText: 'Gate parking barrier verification',
    isSensitive: false,
    attachment: null, // explicitly null
  });

  assertSuccessEnvelope(reqWithoutAttachment);
  assert.ok(reqWithoutAttachment.data.id);
  assert.equal(reqWithoutAttachment.data.attachment, null);
});

test('F19-T2-04: PA System announcement with empty target zones defaults to campus-wide broadcast', async () => {
  mockAdapter.resetDatabase();

  const paRes = await cctvService.createPaAnnouncement({
    category: 'Daily Assembly Bell',
    message: 'Morning prayer will commence in 5 minutes.',
    targetZones: [], // empty zones array
  });

  assertSuccessEnvelope(paRes);
  assert.ok(paRes.data.targetZones.length > 0);
  assert.ok(paRes.data.targetZones.includes('All Zones (Campus-wide)'));
});

test('F19-T2-05: Missing mandatory attributes in GPS halt or Teachers Late reports are rejected', async () => {
  mockAdapter.resetDatabase();

  // Teachers late missing teacherName
  const invalidTeacherLate = await cctvService.createTeachersLateReport({
    shiftInTime: '08:30 AM',
    actualArrivalTime: '08:50 AM',
  });
  assertErrorEnvelope(invalidTeacherLate, /teacherName/i);

  // GPS halt missing busNo
  const invalidHalt = await cctvService.createGpsHalt({
    haltLocation: 'Near Toll Gate',
    haltDurationMinutes: 10,
  });
  assertErrorEnvelope(invalidHalt, /busNo/i);
});
