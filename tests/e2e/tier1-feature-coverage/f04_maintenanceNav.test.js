import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { ROLES } from '../../../src/constants/roles.js';
import { maintenanceManagerSidebarLinks } from '../../../src/Common/CommonSidebar/Components/sidebarLinks.js';
import { getAuthorizedNavigation } from '../../../src/Common/navigation/centralNavigationRegistry.js';

test('F04-T1-01: Maintenance manager sidebar links array contains exactly 20 items', () => {
  assert.equal(
    maintenanceManagerSidebarLinks.length,
    20,
    `Expected 20 maintenance links after cleanup, but found ${maintenanceManagerSidebarLinks.length}`
  );
});

test('F04-T1-02: Deprecated "Campus Maintenance & Power Infrastructure" is completely removed', () => {
  const hasCampusMaint = maintenanceManagerSidebarLinks.some(
    (link) => link.to === '/maintenance-manager/campus-maintenance' ||
      (link.title && /Power Infrastructure|Campus Maintenance & Work/i.test(link.title))
  );
  assert.equal(hasCampusMaint, false, 'Campus Maintenance & Power Infrastructure must be absent');
});

test('F04-T1-03: Deprecated "Spares & Equipment Inventory" is completely removed', () => {
  const hasSparesInv = maintenanceManagerSidebarLinks.some(
    (link) => link.to === '/maintenance-manager/inventory' ||
      (link.title && /Spares & Equipment Inventory/i.test(link.title))
  );
  assert.equal(hasSparesInv, false, 'Spares & Equipment Inventory must be absent');
});

test('F04-T1-04: Legitimate core maintenance modules are retained', () => {
  const paths = maintenanceManagerSidebarLinks.map((l) => l.to);
  assert.ok(paths.includes('/maintenance-manager/dashboard'), 'Dashboard must be retained');
  assert.ok(paths.includes('/maintenance-manager/task-management'), 'Task management must be retained');
  assert.ok(paths.includes('/maintenance-manager/requests-approvals'), 'Requests approvals must be retained');
  assert.ok(paths.includes('/maintenance-manager/duty-allotment'), 'Duty allotment must be retained');
});

test('F04-T1-05: Legitimate operational maintenance inspection and facility modules are retained', () => {
  const paths = maintenanceManagerSidebarLinks.map((l) => l.to);
  assert.ok(paths.includes('/maintenance-manager/schedules'), 'Schedules must be retained');
  assert.ok(paths.includes('/maintenance-manager/equipment-inspections'), 'Equipment inspections must be retained');
  assert.ok(paths.includes('/maintenance-manager/building-maintenance'), 'Building maintenance must be retained');
});

test('F04-T1-06: getAuthorizedNavigation runtime resolution confirms absence of deprecated items for maintenance role', () => {
  const runtimeNav = getAuthorizedNavigation(ROLES.MAINTENANCE_MANAGER, '/maintenance-manager/dashboard');
  const paths = runtimeNav.map((item) => item.to);
  const titles = runtimeNav.map((item) => item.title);

  assert.equal(paths.includes('/maintenance-manager/campus-maintenance'), false);
  assert.equal(paths.includes('/maintenance-manager/inventory'), false);
  assert.equal(titles.some((t) => /Power Infrastructure|Spares & Equipment/i.test(t)), false);
});
