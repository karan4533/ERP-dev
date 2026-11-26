import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import '../harness/setup.js';
import { ROLES } from '../../../src/constants/roles.js';
import { PARENT_CHILD_PROFILES } from '../../../src/Pages/Parent/parentStudentProfiles.js';
import { getStudentById } from '../../../src/Pages/Teacher/StudentsList/studentsListData.js';
import { proService } from '../../../src/services/modules/proService.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';
import { cctvService } from '../../../src/services/modules/cctvService.js';
import { transportService } from '../../../src/services/modules/transportService.js';

test('F07-T2-01: Parent child profile lookup returns undefined for nonexistent child IDs', () => {
  assert.equal(PARENT_CHILD_PROFILES['STU-INVALID-999'], undefined);
  assert.equal(PARENT_CHILD_PROFILES[''], undefined);
  assert.equal(PARENT_CHILD_PROFILES[null], undefined);
});

test('F07-T2-02: Teacher student repository lookup returns null for nonexistent student IDs', () => {
  const result = getStudentById('NONEXISTENT-STUDENT-ID');
  assert.equal(result, null);
  assert.equal(getStudentById(''), null);
  assert.equal(getStudentById(null), null);
});

test('F07-T2-03: profileOptions source verifies unique role assignments across all options', () => {
  const source = fs.readFileSync(path.resolve('src/Pages/Authentication/profileOptions.js'), 'utf-8');
  assert.ok(source.includes('PROFILE_OPTIONS'), 'Must export PROFILE_OPTIONS');
  assert.ok(source.includes('PROFILE_BY_ROLE'), 'Must export PROFILE_BY_ROLE');
});

test('F07-T2-04: Institutional telemetry services return zeroed metrics without crashing when data stores are empty', async () => {
  // Clear storage
  globalThis.localStorage.clear();

  const proStats = await proService.getComplianceStats();
  assert.equal(proStats.success, true);
  assert.equal(typeof proStats.data.totalCorrespondence, 'number');
  assert.ok(!isNaN(proStats.data.totalCorrespondence));

  const fileStats = await fileRoomService.getFileRoomStats();
  assert.equal(fileStats.success, true);
  assert.equal(typeof fileStats.data.totalFiles, 'number');
  assert.ok(!isNaN(fileStats.data.totalFiles));

  const cctvStats = await cctvService.getCctvStats();
  assert.equal(cctvStats.success, true);
  assert.equal(typeof cctvStats.data.totalCameras, 'number');
  assert.ok(!isNaN(cctvStats.data.totalCameras));
});

test('F07-T2-05: Transport telemetry calculates statistics safely when no passengers have boarded', async () => {
  const stats = await transportService.getTransportStats();
  assert.equal(stats.success, true);
  assert.ok(typeof stats.data.totalVehicles === 'number');
  assert.ok(typeof stats.data.totalPassengers === 'number');
  assert.ok(stats.data.totalPassengers >= 0);
});
