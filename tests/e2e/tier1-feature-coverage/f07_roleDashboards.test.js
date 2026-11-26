import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import '../harness/setup.js';
import { ROLES } from '../../../src/constants/roles.js';
import {
  ENTERPRISE_USER_DIRECTORY,
  findUserByIdentifier,
} from '../../../src/Pages/Authentication/enterpriseUserDirectory.js';
import { PARENT_CHILD_PROFILES } from '../../../src/Pages/Parent/parentStudentProfiles.js';
import { getStudentById } from '../../../src/Pages/Teacher/StudentsList/studentsListData.js';
import { proService } from '../../../src/services/modules/proService.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';
import { cctvService } from '../../../src/services/modules/cctvService.js';
import { transportService } from '../../../src/services/modules/transportService.js';

test('F07-T1-01: profileOptions.js defines metadata and labels for all standard and institutional roles', () => {
  const profileOptionsSource = fs.readFileSync(path.resolve('src/Pages/Authentication/profileOptions.js'), 'utf-8');
  assert.ok(profileOptionsSource.includes('ROLES.STUDENT'), 'Must include Student profile');
  assert.ok(profileOptionsSource.includes('ROLES.PARENT'), 'Must include Parent profile');
  assert.ok(profileOptionsSource.includes('ROLES.TEACHER'), 'Must include Teacher profile');
  assert.ok(profileOptionsSource.includes('ROLES.ADMIN'), 'Must include Admin profile');
  assert.ok(profileOptionsSource.includes('ROLES.HR'), 'Must include HR profile');
  assert.ok(profileOptionsSource.includes('ROLES.ACCOUNT_HEAD'), 'Must include Account Head profile');
  assert.ok(profileOptionsSource.includes('ROLES.DRIVER'), 'Must include Driver profile');
  assert.ok(profileOptionsSource.includes('getProfileLabel'), 'Must export getProfileLabel');
});

test('F07-T1-02: PARENT_CHILD_PROFILES provides parent-portal child profiles with academic links', () => {
  const childKeys = Object.keys(PARENT_CHILD_PROFILES);
  assert.ok(childKeys.length >= 3, 'Parent must have multiple linked student records');

  const child1 = PARENT_CHILD_PROFILES['STU-PAR-001'];
  assert.ok(child1, 'STU-PAR-001 must exist');
  assert.equal(child1.name, 'Abhinav Raj');
  assert.equal(child1.className, '10');
  assert.equal(child1.section, 'A');
  assert.equal(child1.rollNumber, '10-A-01');
  assert.equal(child1.admissionNumber, 'ADM-PAR-001');
});

test('F07-T1-03: Teacher student list data provides student records with academic tracking', () => {
  const student = getStudentById('STU-2024-1042');
  assert.ok(student, 'STU-2024-1042 must be resolvable');
  assert.equal(student.name, 'Aarav Sharma');
  assert.ok(student.className, 'Student must have class');
  assert.ok(student.section, 'Student must have section');
  assert.equal(student.classSection, '10-A');
  assert.equal(student.feeStatus, 'Paid');
});

test('F07-T1-04: Institutional services supply live telemetry KPIs for PRO, File Room, and CCTV dashboards', async () => {
  const proStats = await proService.getComplianceStats();
  assert.equal(proStats.success, true);
  assert.ok(typeof proStats.data.totalCorrespondence === 'number');
  assert.ok(typeof proStats.data.pendingCorrespondence === 'number');

  const fileRoomStats = await fileRoomService.getFileRoomStats();
  assert.equal(fileRoomStats.success, true);
  assert.ok(typeof fileRoomStats.data.totalFiles === 'number');
  assert.ok(typeof fileRoomStats.data.checkedOutFiles === 'number');

  const cctvStats = await cctvService.getCctvStats();
  assert.equal(cctvStats.success, true);
  assert.ok(typeof cctvStats.data.totalCameras === 'number');
  assert.ok(typeof cctvStats.data.onlineCameras === 'number');
});

test('F07-T1-05: Transport service supplies live operational telemetry for transport dashboard', async () => {
  const transportStats = await transportService.getTransportStats();
  assert.equal(transportStats.success, true);
  assert.ok(typeof transportStats.data.totalVehicles === 'number');
  assert.ok(typeof transportStats.data.totalRoutes === 'number');
  assert.ok(typeof transportStats.data.totalPassengers === 'number');
});
