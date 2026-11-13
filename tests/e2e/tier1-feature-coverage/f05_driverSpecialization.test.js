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

test('F05-T1-01: Driver sidebar links array contains exactly 8 specialized transport links', () => {
  assert.equal(
    driverSidebarLinks.length,
    8,
    `Expected exactly 8 driver links, got ${driverSidebarLinks.length}`
  );
});

test('F05-T1-02: Driver navigation includes core route, duty, and trip tracking items', () => {
  const paths = driverSidebarLinks.map((l) => l.to);
  assert.ok(paths.includes('/driver/dashboard'), 'Driver dashboard missing');
  assert.ok(paths.includes('/driver/my-duty'), 'My Duty missing');
  assert.ok(paths.includes('/driver/my-route/route-details'), 'Route details missing');
});

test('F05-T1-03: Driver navigation includes passenger manifest and attendance history', () => {
  const paths = driverSidebarLinks.map((l) => l.to);
  assert.ok(
    paths.includes('/driver/attendance-management/student-attendance'),
    'Student passenger manifest & boarding missing'
  );
  assert.ok(
    paths.includes('/driver/attendance-management/attendance-history'),
    'Attendance history missing'
  );
});

test('F05-T1-04: Driver navigation includes vehicle management, fuel, and maintenance requests', () => {
  const paths = driverSidebarLinks.map((l) => l.to);
  assert.ok(paths.includes('/driver/vehicle-management'), 'Vehicle management missing');
  assert.ok(paths.includes('/driver/fuel-request'), 'Fuel request missing');
  assert.ok(paths.includes('/driver/maintenance-request'), 'Maintenance request missing');
});

test('F05-T1-05: ensureEnterpriseAndWorkModules exempts driver role from generic module injection', () => {
  const initialCount = driverSidebarLinks.length;
  const processed = ensureEnterpriseAndWorkModules(driverSidebarLinks, ROLES.DRIVER);
  assert.equal(
    processed.length,
    initialCount,
    'Driver navigation should not expand with enterprise modules'
  );
});

test('F05-T1-06: DriverRoutes does not mount EnterpriseOperationsRoutes', () => {
  const driverRoutesPath = path.resolve('src/Routes/DriverRoutes.jsx');
  const source = fs.readFileSync(driverRoutesPath, 'utf-8');
  assert.equal(
    source.includes('EnterpriseOperationsRoutes'),
    false,
    'DriverRoutes must not mount EnterpriseOperationsRoutes'
  );
});
