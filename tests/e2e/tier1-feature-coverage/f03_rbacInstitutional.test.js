import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { ROLES, ROLE_HOME_PATHS, ROLE_PREFIX } from '../../../src/constants/roles.js';
import {
  ENTERPRISE_USER_DIRECTORY,
  findUserByIdentifier,
} from '../../../src/Pages/Authentication/enterpriseUserDirectory.js';
import {
  getPortalLayout,
  PORTAL_LAYOUTS,
} from '../../../src/Layout/layoutRegistry.js';
import {
  normalizeRoleKey,
  resolveRoleFromPath,
  ROLE_TO_BASE_PATH,
} from '../../../src/Common/navigation/centralNavigationRegistry.js';

test('F03-T1-01: Institutional role constants are explicitly defined in ROLES', () => {
  assert.equal(ROLES.PRO, 'pro', 'ROLES.PRO must equal "pro"');
  assert.equal(ROLES.FILE_ROOM, 'fileroom', 'ROLES.FILE_ROOM must equal "fileroom"');
  assert.equal(ROLES.CCTV, 'cctv', 'ROLES.CCTV must equal "cctv"');
});

test('F03-T1-02: ROLE_HOME_PATHS and ROLE_PREFIX map institutional roles to dedicated base routes', () => {
  assert.equal(ROLE_HOME_PATHS[ROLES.PRO], '/pro/dashboard');
  assert.equal(ROLE_HOME_PATHS[ROLES.FILE_ROOM], '/file-room/dashboard');
  assert.equal(ROLE_HOME_PATHS[ROLES.CCTV], '/cctv/dashboard');

  assert.equal(ROLE_PREFIX[ROLES.PRO], '/pro');
  assert.equal(ROLE_PREFIX[ROLES.FILE_ROOM], '/file-room');
  assert.equal(ROLE_PREFIX[ROLES.CCTV], '/cctv');
});

test('F03-T1-03: Enterprise User Directory contains active demo users for all institutional roles', () => {
  const proUser = findUserByIdentifier('pro@school.edu');
  assert.ok(proUser, 'PRO demo user must exist');
  assert.equal(proUser.role, ROLES.PRO);
  assert.equal(proUser.status, 'Active');

  const fileRoomUser = findUserByIdentifier('fileroom@school.edu');
  assert.ok(fileRoomUser, 'File Room demo user must exist');
  assert.equal(fileRoomUser.role, ROLES.FILE_ROOM);
  assert.equal(fileRoomUser.status, 'Active');

  const cctvUser = findUserByIdentifier('cctv@school.edu');
  assert.ok(cctvUser, 'CCTV demo user must exist');
  assert.equal(cctvUser.role, ROLES.CCTV);
  assert.equal(cctvUser.status, 'Active');
});

test('F03-T1-04: getPortalLayout retrieves verified portal layouts for institutional roles', () => {
  const proLayout = getPortalLayout(ROLES.PRO);
  assert.ok(proLayout, 'PRO portal layout must be configured');
  assert.equal(proLayout.role, 'pro');
  assert.equal(proLayout.showBreadcrumb, true);

  const fileRoomLayout = getPortalLayout(ROLES.FILE_ROOM);
  assert.ok(fileRoomLayout, 'File Room portal layout must be configured');
  assert.equal(fileRoomLayout.role, 'fileroom');
  assert.equal(fileRoomLayout.showBreadcrumb, true);

  const cctvLayout = getPortalLayout(ROLES.CCTV);
  assert.ok(cctvLayout, 'CCTV portal layout must be configured');
  assert.equal(cctvLayout.role, 'cctv');
  assert.equal(cctvLayout.showBreadcrumb, true);
});

test('F03-T1-05: normalizeRoleKey and resolveRoleFromPath resolve canonical roles and base paths', () => {
  assert.equal(normalizeRoleKey('pro'), ROLES.PRO);
  assert.equal(normalizeRoleKey('fileroom'), ROLES.FILE_ROOM);
  assert.equal(normalizeRoleKey('file-room'), ROLES.FILE_ROOM);
  assert.equal(normalizeRoleKey('cctv'), ROLES.CCTV);
  assert.equal(normalizeRoleKey('cameraperson'), ROLES.CCTV);

  assert.equal(resolveRoleFromPath('/pro/dashboard'), ROLES.PRO);
  assert.equal(resolveRoleFromPath('/file-room/documents'), ROLES.FILE_ROOM);
  assert.equal(resolveRoleFromPath('/cctv/cameras'), ROLES.CCTV);

  assert.equal(ROLE_TO_BASE_PATH[ROLES.PRO], '/pro');
  assert.equal(ROLE_TO_BASE_PATH[ROLES.FILE_ROOM], '/file-room');
  assert.equal(ROLE_TO_BASE_PATH[ROLES.CCTV], '/cctv');
});
