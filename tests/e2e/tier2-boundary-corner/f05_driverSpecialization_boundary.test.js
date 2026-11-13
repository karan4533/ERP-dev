import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import '../harness/setup.js';
import { ROLES } from '../../../src/constants/roles.js';
import { driverSidebarLinks } from '../../../src/Common/CommonSidebar/Components/sidebarLinks.js';
import {
  ensureEnterpriseAndWorkModules,
  getAuthorizedNavigation,
} from '../../../src/Common/navigation/centralNavigationRegistry.js';

test('F05-T2-01: Driver links array length is strictly 8 items', () => {
  assert.equal(driverSidebarLinks.length, 8);
});

test('F05-T2-02: Driver navigation excludes all administrative back-office and compliance modules', () => {
  const forbiddenTitles = [
    'Department Helpdesk',
    'Stores & Procurement',
    'Physical File Room',
    'Activity Monitoring',
    'Lost & Found',
    'Staff Relieving & NOC',
    'Reports & Analytics',
    'Central Administration',
  ];

  const currentTitles = driverSidebarLinks.map((l) => l.title);
  for (const forbidden of forbiddenTitles) {
    assert.equal(
      currentTitles.includes(forbidden),
      false,
      `Driver navigation should not include "${forbidden}"`
    );
  }
});

test('F05-T2-03: ensureEnterpriseAndWorkModules explicitly contrasts Driver role vs generic Staff roles', () => {
  const baseline = [{ id: 1, title: 'Dashboard', to: '/test/dashboard' }];

  // Driver role: zero enterprise modules injected
  const driverResult = ensureEnterpriseAndWorkModules(baseline, ROLES.DRIVER);
  assert.equal(driverResult.length, 1, 'Driver role must receive zero injected modules');

  // HR role: enterprise modules injected
  const hrResult = ensureEnterpriseAndWorkModules(baseline, ROLES.HR);
  assert.ok(hrResult.length > 1, 'HR role must receive injected enterprise modules');

  // Superadmin role: enterprise modules injected
  const adminResult = ensureEnterpriseAndWorkModules(baseline, ROLES.ADMIN);
  assert.ok(adminResult.length > 1, 'Admin role must receive injected enterprise modules');
});

test('F05-T2-04: Driver route isolation: DriverRoutes.jsx contains zero administrative routes', () => {
  const driverRoutesPath = path.resolve('src/Routes/DriverRoutes.jsx');
  const source = fs.readFileSync(driverRoutesPath, 'utf-8');

  assert.equal(source.includes('/driver/stores'), false);
  assert.equal(source.includes('/driver/file-room'), false);
  assert.equal(source.includes('/driver/cctv'), false);
  assert.equal(source.includes('EnterpriseOperationsRoutes'), false);
});

test('F05-T2-05: Empty array passed to ensureEnterpriseAndWorkModules for driver role returns empty array', () => {
  const empty = [];
  const res = ensureEnterpriseAndWorkModules(empty, ROLES.DRIVER);
  assert.equal(res.length, 0);
});
