import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import '../harness/setup.js';
import { ROLES, ROLE_PREFIX, ROLE_HOME_PATHS } from '../../../src/constants/roles.js';
import { findUserByIdentifier } from '../../../src/Pages/Authentication/enterpriseUserDirectory.js';
import {
  normalizeRoleKey,
  resolveRoleFromPath,
} from '../../../src/Common/navigation/centralNavigationRegistry.js';

test('F03-T2-01: normalizeRoleKey handles mixed case, hyphens, and whitespace', () => {
  assert.equal(normalizeRoleKey('PRO'), ROLES.PRO);
  assert.equal(normalizeRoleKey(' pro '), ROLES.PRO);
  assert.equal(normalizeRoleKey('File-Room'), ROLES.FILE_ROOM);
  assert.equal(normalizeRoleKey('file_room'), ROLES.FILE_ROOM);
  assert.equal(normalizeRoleKey('cameraroom'), ROLES.CCTV);
  assert.equal(normalizeRoleKey('CAMERAPERSON'), ROLES.CCTV);
});

test('F03-T2-02: normalizeRoleKey handles empty or unregistered input strings safely', () => {
  assert.equal(normalizeRoleKey(''), null);
  assert.equal(normalizeRoleKey(null), null);
  assert.equal(normalizeRoleKey(undefined), null);
  // Unregistered role key cleans string but does not map to any valid institutional role
  const unmapped = normalizeRoleKey('unknown-custom-role');
  assert.notEqual(unmapped, ROLES.PRO);
  assert.notEqual(unmapped, ROLES.FILE_ROOM);
  assert.notEqual(unmapped, ROLES.CCTV);
});

test('F03-T2-03: resolveRoleFromPath handles trailing slashes, deep sub-routes, and query strings', () => {
  assert.equal(resolveRoleFromPath('/pro/'), ROLES.PRO);
  assert.equal(resolveRoleFromPath('/pro/statutory-calendar?view=month&filter=urgent'), ROLES.PRO);
  assert.equal(resolveRoleFromPath('/file-room/records/archive/2026/01'), ROLES.FILE_ROOM);
  assert.equal(resolveRoleFromPath('/cctv/cameras/CAM-01/live-feed'), ROLES.CCTV);
  assert.equal(resolveRoleFromPath('/'), null);
  assert.equal(resolveRoleFromPath(''), null);
  assert.equal(resolveRoleFromPath(null), null);
});

test('F03-T2-04: Boundary collision check between /pro and /process-auditor prevents privilege escalation (VULN-M2-01)', () => {
  // /process-auditor starts with "/pro" substring, but must NOT resolve to ROLES.PRO
  assert.equal(resolveRoleFromPath('/process-auditor'), ROLES.PROCESS_AUDITOR);
  assert.equal(resolveRoleFromPath('/process-auditor/dashboard'), ROLES.PROCESS_AUDITOR);
  assert.equal(resolveRoleFromPath('/pro/dashboard'), ROLES.PRO);
  assert.notEqual(resolveRoleFromPath('/process-auditor'), ROLES.PRO);

  const appSource = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
  assert.ok(
    appSource.includes('pathname !== "/pro" && !pathname.startsWith("/pro/")'),
    'App.jsx must use exact-delimiter check for PRO prefix'
  );
});

test('F03-T2-05: findUserByIdentifier safely returns null for nonexistent, empty, or invalid inputs', () => {
  assert.equal(findUserByIdentifier('nonexistent.user@school.edu'), null);
  assert.equal(findUserByIdentifier(''), null);
  assert.equal(findUserByIdentifier(null), null);
  assert.equal(findUserByIdentifier(undefined), null);
  assert.equal(findUserByIdentifier('   '), null);
});
