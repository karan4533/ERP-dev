/**
 * tests/e2e/tier1-feature-coverage/f22_globalModulesAndReports.test.js
 * Tier 1 Feature Coverage: Global Modules, Reports & Navigation Audit (R2 / Features 22-30)
 *
 * Covers:
 * - Universal Communication role configuration & routeBase mapping across roles
 * - Universal Announcement route configurations and broadcast dispatchers
 * - Universal Escalation hierarchy routes and role configurations
 * - Universal Reports & Analytics workspace suites, CSV/PDF/print triggers
 * - Enterprise Operations Routes mounting across base paths
 * - Schedule status update lifecycle (Pending, In Progress, Completed) across audits
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import '../harness/setup.js';
import {
  COMMUNICATION_ROLE_CONFIG,
  getCommunicationRoleConfig,
} from '../../../src/Common/Communication/communicationRoleConfig.js';
import { ANNOUNCEMENT_ROUTE_CONFIG } from '../../../src/Common/Announcement/announcementConfigs.js';
import { ESCALATION_ROLE_CONFIG } from '../../../src/Common/EscalationManagement/escalationRoleConfig.js';

test('F22-T1-01: Universal communication configuration resolves across roles without undefined routeBase', () => {
  const configuredRoles = Object.keys(COMMUNICATION_ROLE_CONFIG);
  assert.ok(configuredRoles.length >= 8, 'Must configure communication for standard institutional roles');

  const requiredRoles = ['admin', 'teacher', 'student', 'principal', 'director', 'librarian', 'prm'];
  for (const role of requiredRoles) {
    const config = getCommunicationRoleConfig(role);
    assert.ok(config, `Communication config for role "${role}" must exist`);
    assert.ok(config.routeBase, `routeBase for role "${role}" must be defined`);
    assert.ok(config.routeBase.startsWith('/'), `routeBase for role "${role}" must be absolute`);
    assert.ok(config.currentUser?.name, `currentUser for role "${role}" must be populated`);
  }
});

test('F22-T1-02: Universal announcement route configuration defines list and view paths across roles', () => {
  const roles = Object.keys(ANNOUNCEMENT_ROUTE_CONFIG);
  assert.ok(roles.length >= 10, 'Announcement config must span standard and leadership roles');

  for (const roleKey of ['admin', 'principal', 'teacher', 'student', 'superadmin', 'canteenmanager']) {
    const cfg = ANNOUNCEMENT_ROUTE_CONFIG[roleKey];
    assert.ok(cfg, `Announcement config for ${roleKey} must exist`);
    assert.ok(cfg.list, `Announcement list route for ${roleKey} must exist`);
    assert.ok(cfg.view, `Announcement view route for ${roleKey} must exist`);
    assert.ok(cfg.sentByDefault, `Announcement sentByDefault for ${roleKey} must exist`);
  }
});

test('F22-T1-03: Universal escalation role config defines valid hierarchical escalation routes', () => {
  const escalationRoles = Object.keys(ESCALATION_ROLE_CONFIG);
  assert.ok(escalationRoles.length >= 6, 'Must define multiple escalation tiers');

  for (const [key, cfg] of Object.entries(ESCALATION_ROLE_CONFIG)) {
    assert.ok(cfg.routeBase, `Escalation routeBase for ${key} must exist`);
    assert.ok(cfg.roleLabel, `Escalation roleLabel for ${key} must exist`);
    if (key !== 'superAdmin') {
      assert.ok(cfg.escalatesTo, `Escalation escalatesTo for ${key} must exist`);
      assert.ok(cfg.escalatesToRoleKey, `Escalation escalatesToRoleKey for ${key} must exist`);
    } else {
      assert.equal(cfg.escalatesToRoleKey, null, 'superAdmin is the final apex escalation tier');
    }
  }
});

test('F22-T1-04: Universal Reports & Analytics Workspace supports multi-role suites and export options', () => {
  const reportsPath = path.resolve('src/Common/ReportsAnalytics/UniversalReportsAnalyticsWorkspace.jsx');
  assert.ok(fs.existsSync(reportsPath), 'UniversalReportsAnalyticsWorkspace.jsx must exist');

  const source = fs.readFileSync(reportsPath, 'utf-8');
  assert.ok(source.includes('academic'), 'Must include Academic report suite');
  assert.ok(source.includes('administrative'), 'Must include Administrative report suite');
  assert.ok(source.includes('financial'), 'Must include Financial report suite');
  assert.ok(source.includes('logistics'), 'Must include Logistics report suite');
  assert.ok(source.includes('audit'), 'Must include Audit report suite');

  // Verify Export buttons & triggers
  assert.ok(source.includes('handleExportPDF'), 'Must provide PDF export handler');
  assert.ok(source.includes('handleExportExcel') || source.includes('handleExportCSV'), 'Must provide Excel/CSV export handler');
  assert.ok(source.includes('dateFrom'), 'Must support dateFrom filter');
  assert.ok(source.includes('dateTo'), 'Must support dateTo filter');
});

test('F22-T1-05: EnterpriseOperationsRoutes mounts universal operational routes across role paths', () => {
  const enterpriseRoutesPath = path.resolve('src/Routes/EnterpriseOperationsRoutes.jsx');
  const source = fs.readFileSync(enterpriseRoutesPath, 'utf-8');

  // Verify critical universal routes
  assert.ok(source.includes('/reports-analytics'), 'Must mount /reports-analytics');
  assert.ok(source.includes('/tasks'), 'Must mount /tasks');
  assert.ok(source.includes('/escalation-management'), 'Must mount /escalation-management');
  assert.ok(source.includes('/leave-request'), 'Must mount /leave-request');
  assert.ok(source.includes('/audit-observations'), 'Must mount /audit-observations');
  assert.ok(source.includes('/stores-procurement'), 'Must mount /stores-procurement');
  assert.ok(source.includes('/file-room'), 'Must mount /file-room');
});

test('F22-T1-06: Schedule status lifecycle specifies transitions between Pending, In Progress, and Completed', () => {
  const scheduleDataPath = path.resolve(
    'src/Pages/ProcessAuditor/AuditManagement/AuditSchedule/auditScheduleData.js'
  );
  assert.ok(fs.existsSync(scheduleDataPath), 'auditScheduleData.js must exist');
  const source = fs.readFileSync(scheduleDataPath, 'utf-8');

  // Verify SCHEDULE_STATUSES includes Pending, In Progress, and Completed
  assert.ok(source.includes("'Pending'"), 'SCHEDULE_STATUSES must declare Pending');
  assert.ok(source.includes("'In Progress'"), 'SCHEDULE_STATUSES must declare In Progress');
  assert.ok(source.includes("'Completed'"), 'SCHEDULE_STATUSES must declare Completed');

  // Verify status badge color mappings exist
  assert.ok(source.includes('statusBadgeColor'), 'statusBadgeColor mapping must be declared');

  // Verify academic calendar data file exists and contains holiday and exam event types
  const calendarDataPath = path.resolve('src/Common/AcademicCalendar/academicCalendarData.js');
  assert.ok(fs.existsSync(calendarDataPath), 'academicCalendarData.js must exist');
  const calSource = fs.readFileSync(calendarDataPath, 'utf-8');
  assert.ok(calSource.includes('ACADEMIC_EVENT_TYPES'), 'Must define ACADEMIC_EVENT_TYPES');
  assert.ok(calSource.includes('holiday'), 'Must declare holiday type');
  assert.ok(calSource.includes('exam'), 'Must declare exam type');
});
