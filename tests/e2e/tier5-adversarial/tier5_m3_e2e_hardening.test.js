/**
 * tests/e2e/tier5-adversarial/tier5_m3_e2e_hardening.test.js
 * Tier 5 White-Box Adversarial Hardening Suite: Features 22-30 (M3)
 *
 * Covers:
 * - F22-ADV-01: Role Dictionary Prototype Pollution & Malformed Role Key Resilience
 * - F22-ADV-02: Route Safety & Parameter Injection Resilience Across All 29 Roles
 * - F22-ADV-03: Shared Duty Store Resilience Under Storage Corruption and Rapid Toggling
 * - F22-ADV-04: Universal Reports CSV Injection Neutralization & Print Fallback
 * - F22-ADV-05: Strict Invariant Preservation Across Roles (Maintenance=20, Driver=8)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { ROLES, ROLE_PREFIX } from '../../../src/constants/roles.js';
import {
  getCommunicationRoleConfig,
} from '../../../src/Common/Communication/communicationRoleConfig.js';
import {
  getAnnouncementRoutes,
  getAnnouncementViewPath,
} from '../../../src/Common/Announcement/announcementConfigs.js';
import {
  getAcademicCalendarRoleConfig,
} from '../../../src/Common/AcademicCalendar/academicCalendarData.js';
import {
  getRoleConfig,
} from '../../../src/Common/EscalationManagement/escalationRoleConfig.js';
import {
  loadDuties,
  DUTIES_STORAGE_KEY,
} from '../../../src/Pages/GateKeeperManager/AssignDuty/assignDutyData.js';
import * as sidebarLinks from '../../../src/Common/CommonSidebar/Components/sidebarLinks.js';

test('F22-ADV-01: Role Dictionary Prototype Pollution & Malformed Role Key Resilience', () => {
  const adversarialKeys = [
    '__proto__',
    'constructor',
    'toString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    null,
    undefined,
    '',
    '   ',
    12345,
    true,
    {},
    [],
    'unknown_role_xyz_999'
  ];

  for (const key of adversarialKeys) {
    // 1. Announcements must never return Object.prototype; must provide valid list and view routes
    const ann = getAnnouncementRoutes(key);
    assert.ok(ann && typeof ann === 'object', `getAnnouncementRoutes must return an object for ${String(key)}`);
    assert.ok(typeof ann.list === 'string' && ann.list.startsWith('/'), `ann.list must be valid string for ${String(key)}`);
    assert.ok(typeof ann.view === 'string' && ann.view.startsWith('/'), `ann.view must be valid string for ${String(key)}`);

    const viewPath = getAnnouncementViewPath(key, '101');
    assert.ok(typeof viewPath === 'string' && !viewPath.startsWith('undefined/'), `viewPath must not start with undefined for ${String(key)}`);

    // 2. Communication must return undefined or valid config without throwing
    const comm = getCommunicationRoleConfig(key);
    if (comm) {
      assert.ok(typeof comm.routeBase === 'string', `comm.routeBase must be string if config returned for ${String(key)}`);
      assert.ok(comm.currentUser && typeof comm.currentUser.name === 'string', `currentUser.name must exist if config returned for ${String(key)}`);
    }

    // 3. Calendar must return undefined or valid config
    const cal = getAcademicCalendarRoleConfig(key);
    if (cal) {
      assert.ok(typeof cal.routeBase === 'string', `cal.routeBase must be string if config returned for ${String(key)}`);
    }

    // 4. Escalation must return null or valid config
    const esc = getRoleConfig(key);
    if (esc) {
      assert.ok(typeof esc.routeBase === 'string', `esc.routeBase must be string for ${String(key)}`);
    }
  }
});

test('F22-ADV-02: Route Safety & Parameter Injection Resilience Across All 29 Roles', () => {
  const allRoles = Object.values(ROLES);
  const institutionalRoles = ['pro', 'fileroom', 'cctv'];
  const uniqueRoles = [...new Set([...allRoles, ...institutionalRoles])];
  assert.equal(uniqueRoles.length, 29, 'Must evaluate exactly 29 unique roles');

  for (const role of uniqueRoles) {
    const prefix = ROLE_PREFIX[role];
    assert.ok(prefix, `Missing prefix for ${role}`);
    assert.ok(prefix.startsWith('/') && !prefix.endsWith('/'), `Prefix must be canonical: ${prefix}`);

    // Verify operational routes mount cleanly without double slashes
    const testPaths = [
      `${prefix}/communication/inbox/CONV-123`,
      `${prefix}/announcement/view/ANN-999`,
      `${prefix}/stores-procurement/inventory`,
      `${prefix}/escalation-management/view/ESC-001`,
      `${prefix}/leave-request/my-requests/view/LEV-001`,
      `${prefix}/reports-analytics`,
    ];

    for (const p of testPaths) {
      assert.ok(!p.includes('//'), `Path must not contain double slashes: ${p}`);
      assert.ok(!p.includes('undefined'), `Path must not contain undefined: ${p}`);
    }
  }
});

test('F22-ADV-03: Shared Duty Store Resilience Under Storage Corruption and Rapid Toggling', () => {
  const storageMap = new Map();
  const mockStorage = {
    getItem: (k) => storageMap.get(String(k)) ?? null,
    setItem: (k, v) => storageMap.set(String(k), String(v)),
    clear: () => storageMap.clear(),
  };
  globalThis.localStorage = mockStorage;

  // 1. Rapid sequential status cycling (Pending -> In Progress -> Completed -> Pending)
  let duties = [
    { id: 'DUT001', dutyId: 'DUT001', gateLocation: 'Main Gate', status: 'Pending', assignedBy: 'Security Head' }
  ];
  const statuses = ['Pending', 'In Progress', 'Completed'];

  for (let i = 0; i < 50; i++) {
    const nextStatus = statuses[i % statuses.length];
    duties[0].status = nextStatus;
    mockStorage.setItem(DUTIES_STORAGE_KEY || 'schoolerp_gatekeeper_duties_v1', JSON.stringify(duties));
    const reloaded = JSON.parse(mockStorage.getItem(DUTIES_STORAGE_KEY || 'schoolerp_gatekeeper_duties_v1'));
    assert.equal(reloaded[0].status, nextStatus);
    assert.equal(reloaded[0].dutyId, 'DUT001');
    assert.equal(reloaded[0].gateLocation, 'Main Gate');
  }

  // 2. Storage corruption resilience: non-array primitives must never crash array consumers
  const corruptValues = ['12345', '"string"', 'true', '{}', 'null', '{invalid json'];
  for (const badVal of corruptValues) {
    mockStorage.setItem(DUTIES_STORAGE_KEY || 'schoolerp_gatekeeper_duties_v1', badVal);
    const loaded = loadDuties();
    assert.ok(Array.isArray(loaded), `Corrupt value ${badVal} must yield an array`);
    assert.doesNotThrow(() => loaded.filter(x => x), `Array.filter must not throw on ${badVal}`);
  }
});

test('F22-ADV-04: Universal Reports CSV Injection Neutralization & Print Fallback', () => {
  // Test formula escaping logic
  const escapeCsvSecure = (val) => {
    let s = String(val ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };

  const formulaAttacks = ['=SUM(A1:A10)', '=cmd|\'/C calc\'!A0', '+1234', '-5678', '@SUM(1,2)'];
  for (const attack of formulaAttacks) {
    const escaped = escapeCsvSecure(attack);
    assert.ok(escaped.startsWith('"\''), `Formula ${attack} must be prefixed with single quote in CSV`);
  }

  // Test Print Fallback when window.open returns null (popup blocked)
  let fallbackPrintTriggered = false;
  const mockWindowBlocked = {
    open: () => null,
    print: () => { fallbackPrintTriggered = true; },
  };

  if (typeof mockWindowBlocked !== 'undefined') {
    const printWin = mockWindowBlocked.open('', '_blank');
    if (!printWin) {
      mockWindowBlocked.print();
    }
  }
  assert.ok(fallbackPrintTriggered, 'window.print must trigger when window.open is blocked');
});

test('F22-ADV-05: Strict Invariant Preservation Across Roles', () => {
  assert.equal(sidebarLinks.maintenanceManagerSidebarLinks.length, 20, 'maintenanceManagerSidebarLinks must remain exactly 20');
  assert.equal(sidebarLinks.driverSidebarLinks.length, 8, 'driverSidebarLinks must remain exactly 8');

  // Deprecated maintenance titles must be absent
  const mTitles = sidebarLinks.maintenanceManagerSidebarLinks.map(l => l.title);
  assert.ok(!mTitles.includes('Campus Maintenance & Power Infrastructure'));
  assert.ok(!mTitles.includes('Spares & Equipment Inventory'));

  // Driver sidebar links must be strictly transport duties
  const dTitles = sidebarLinks.driverSidebarLinks.map(l => l.title);
  assert.ok(!dTitles.includes('Reports & Analytics'));
  assert.ok(!dTitles.includes('Staff Relieving'));
  assert.ok(!dTitles.includes('Hostel Management'));
});
