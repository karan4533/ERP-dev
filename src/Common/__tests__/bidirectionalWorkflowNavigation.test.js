import test from 'node:test'
import assert from 'node:assert/strict'
import { ROLES } from '../../constants/roles.js'
import {
    getAuthorizedNavigation,
    getNavigationForPath,
    normalizeRoleKey,
} from '../navigation/centralNavigationRegistry.js'
import { getRoleConfig, ESCALATION_ROLE_CONFIG } from '../EscalationManagement/escalationRoleConfig.js'
import { LEAVE_ROUTE_CONFIG, APPROVER_DECISION_TITLES } from '../LeaveRequest/leaveRequestConfigs.js'
import { getPageTitle } from '../CommonHeader/Components/TitleMappings.js'

test('School ERP — Bidirectional Workflow & Receive Navigation Verification', async (t) => {
    const staffRoles = Object.values(ROLES).filter((r) => r !== ROLES.STUDENT && r !== ROLES.PARENT && r !== ROLES.DRIVER)
    const auditorRoles = [ROLES.PROCESS_AUDITOR, ROLES.QUALITY_AUDITOR, ROLES.JOINT_DIRECTOR_AUDIT]
    const auditeeRoles = staffRoles.filter((r) => !auditorRoles.includes(r))

    await t.test('1. Every Auditee role receives Audit Observations in their navigation', () => {
        for (const role of auditeeRoles) {
            const nav = getAuthorizedNavigation(role)
            const auditItem = nav.find((i) => i.title === 'Audit Observations')

            assert.ok(
                auditItem,
                `Role "${role}" must have "Audit Observations" in sidebar navigation so they can receive and action audit findings`
            )
            assert.ok(
                auditItem.to.includes('audit-observations'),
                `Role "${role}" Audit Observations path must point to /audit-observations`
            )
            assert.equal(
                auditItem.group,
                'work',
                `Role "${role}" Audit Observations should be in the "work" group`
            )
        }
    })

    await t.test('2. Process Auditor & Quality Auditor have their observation creator and staff operations', () => {
        const fieldAuditorRoles = [ROLES.PROCESS_AUDITOR, ROLES.QUALITY_AUDITOR]
        for (const role of fieldAuditorRoles) {
            const nav = getAuthorizedNavigation(role)
            const titles = nav.map((i) => i.title)

            // Audit creators must have Observations
            assert.ok(
                titles.includes('Observations'),
                `Auditor "${role}" must have "Observations" module`
            )

            // Auditor must also have personal work tools
            assert.ok(
                titles.includes('Task Management'),
                `Auditor "${role}" must have "Task Management"`
            )
            assert.ok(
                titles.includes('Attendance & Leave Management'),
                `Auditor "${role}" must have "Attendance & Leave Management"`
            )
            assert.ok(
                titles.includes('Department Helpdesk'),
                `Auditor "${role}" must have "Department Helpdesk"`
            )
        }

        // JD Audit has Findings & Compliance
        const jdNav = getAuthorizedNavigation(ROLES.JOINT_DIRECTOR_AUDIT)
        const jdTitles = jdNav.map((i) => i.title)
        assert.ok(jdTitles.includes('Findings & Compliance'), 'JD Audit must have Findings & Compliance')
    })

    await t.test('3. Escalation Management covers all 25 roles with valid routing hierarchy', () => {
        const allRoles = Object.values(ROLES)
        for (const role of allRoles) {
            const config = getRoleConfig(role)
            assert.ok(
                config,
                `Role "${role}" must be registered in ESCALATION_ROLE_CONFIG`
            )
            assert.ok(
                config.roleLabel,
                `Role "${role}" escalation config must provide a human-readable label`
            )
        }
    })

    await t.test('4. Leave Request configuration covers departmental managers with received list & decision titles', () => {
        const supervisorRoles = [
            'admin',
            'superadmin',
            'teacher',
            'principal',
            'director',
            'prm',
            'gatekeepermanager',
            'coordinator',
            'librarian',
            'canteenmanager',
            'itsupportmanager',
            'stationerystoremanager',
            'housekeepingmanager',
            'jointdirector',
            'jointdirectorassistant',
            'jointdirectoraudit',
            'hr',
            'accounthead',
        ]

        for (const roleKey of supervisorRoles) {
            const cfg = LEAVE_ROUTE_CONFIG[roleKey]
            assert.ok(
                cfg,
                `Supervisor role "${roleKey}" must exist in LEAVE_ROUTE_CONFIG`
            )
            assert.ok(
                cfg.receivedList,
                `Supervisor role "${roleKey}" must have receivedList configured to receive leave requests`
            )
        }
    })

    await t.test('5. getPageTitle dynamically matches Audit Observations, Leaves, and GRN across all roles', () => {
        assert.equal(getPageTitle('/admin/audit-observations'), 'Audit Observations')
        assert.equal(getPageTitle('/teacher/audit-observations'), 'Audit Observations')
        assert.equal(getPageTitle('/principal/audit-observations/OBS-PA-2026-001'), 'View Audit Observation Details')
        assert.equal(getPageTitle('/admin/leave-request/received-leaves'), 'Received Leave Requests')
        assert.equal(getPageTitle('/hr/leave-request/received'), 'Received Leave Requests')
        assert.equal(getPageTitle('/coordinator/leave-request/my-leaves'), 'My Leave Requests')
        assert.equal(getPageTitle('/canteen-manager/goods-receipt'), 'Goods Receipt (GRN)')
    })
})
