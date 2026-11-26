import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { ROLES } from '../../../src/constants/roles.js';
import { maintenanceManagerSidebarLinks } from '../../../src/Common/CommonSidebar/Components/sidebarLinks.js';
import {
  getAuthorizedNavigation,
  ensureEnterpriseAndWorkModules,
} from '../../../src/Common/navigation/centralNavigationRegistry.js';

test('F04-T2-01: Zero links in maintenanceManagerSidebarLinks point to deprecated campus-maintenance or inventory paths', () => {
  const deprecatedUrls = [
    '/maintenance-manager/campus-maintenance',
    '/maintenance-manager/inventory',
    '/maintenance-manager/campus-maintenance/',
    '/maintenance-manager/inventory/',
  ];

  for (const link of maintenanceManagerSidebarLinks) {
    assert.equal(
      deprecatedUrls.includes(link.to),
      false,
      `Link "${link.title}" has deprecated destination: ${link.to}`
    );
    if (link.subLinks && Array.isArray(link.subLinks)) {
      for (const sub of link.subLinks) {
        assert.equal(
          deprecatedUrls.includes(sub.to),
          false,
          `Sublink "${sub.title}" has deprecated destination: ${sub.to}`
        );
      }
    }
  }
});

test('F04-T2-02: Zero links in maintenance navigation contain deprecated titles regardless of letter case', () => {
  const forbiddenPatterns = [
    /power infrastructure/i,
    /campus maintenance & work/i,
    /spares & equipment/i,
  ];

  for (const link of maintenanceManagerSidebarLinks) {
    for (const pattern of forbiddenPatterns) {
      assert.equal(
        pattern.test(link.title || ''),
        false,
        `Link title "${link.title}" matched forbidden pattern ${pattern}`
      );
    }
  }
});

test('F04-T2-03: Runtime navigation resolver under varied pathnames strictly filters deprecated modules', () => {
  const testPaths = [
    '/maintenance-manager/dashboard',
    '/maintenance-manager/task-management',
    '/maintenance-manager/schedules',
    '/maintenance-manager/equipment-inspections',
  ];

  for (const path of testPaths) {
    const nav = getAuthorizedNavigation(ROLES.MAINTENANCE_MANAGER, path);
    const paths = nav.map((i) => i.to);
    assert.equal(paths.includes('/maintenance-manager/campus-maintenance'), false);
    assert.equal(paths.includes('/maintenance-manager/inventory'), false);
  }
});

test('F04-T2-04: Length constraint: maintenanceManagerSidebarLinks is capped at exactly 20 legitimate items', () => {
  assert.equal(maintenanceManagerSidebarLinks.length, 20);
});

test('F04-T2-05: Every retained maintenance link has valid non-empty title and valid icon component or string', () => {
  for (const link of maintenanceManagerSidebarLinks) {
    assert.ok(link.title && link.title.trim().length > 0, 'Link must have title');
    assert.ok(link.to && link.to.startsWith('/maintenance-manager'), 'Link path must start with role prefix');
    assert.ok(link.icon, `Link "${link.title}" must specify an icon`);
  }
});
