import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { ROLES } from '../../constants/roles.js'
import { findUserByIdentifier, ENTERPRISE_USER_DIRECTORY } from '../../Pages/Authentication/enterpriseUserDirectory.js'
import { ROLE_TO_BASE_PATH, normalizeRoleKey, getAuthorizedNavigation } from '../navigation/centralNavigationRegistry.js'
import { maintenanceManagerSidebarLinks } from '../CommonSidebar/Components/sidebarLinks.js'
import { ASSIGNMENT_HIERARCHY, DEMO_USER_ID_BY_ROLE } from '../TaskManagement/taskManagementConfig.js'
import { DEPARTMENT_CONFIGS } from '../DepartmentTicketing/departmentTicketingData.js'
import { ANNOUNCEMENT_ROUTE_CONFIG } from '../Announcement/announcementConfigs.js'
import { LEAVE_ROUTE_CONFIG } from '../LeaveRequest/leaveRequestConfigs.js'

test('Maintenance Manager — Institutional Role Separation & Parity', async (t) => {
    await t.test('1. Role constants & base path configured', () => {
        assert.equal(ROLES.MAINTENANCE_MANAGER, 'maintenancemanager')
        assert.equal(ROLE_TO_BASE_PATH[ROLES.MAINTENANCE_MANAGER], '/maintenance-manager')
        assert.equal(normalizeRoleKey('maintenancemanager'), ROLES.MAINTENANCE_MANAGER)
        assert.equal(normalizeRoleKey('maintenance'), ROLES.MAINTENANCE_MANAGER)
        assert.equal(normalizeRoleKey('Maintenance Manager'), ROLES.MAINTENANCE_MANAGER)
    })

    await t.test('2. Enterprise credentials and profile directory resolution', () => {
        const userByEmail = findUserByIdentifier('maintenancemanager@school.com')
        assert.ok(userByEmail, 'Should resolve by email')
        assert.equal(userByEmail.id, 'EMP-MNT-001')
        assert.equal(userByEmail.role, ROLES.MAINTENANCE_MANAGER)
        assert.equal(userByEmail.department, 'Campus Infrastructure & Maintenance')

        const userByUsername = findUserByIdentifier('maintenancemanager')
        assert.ok(userByUsername, 'Should resolve by username')
        assert.equal(userByUsername.id, 'EMP-MNT-001')

        const userById = findUserByIdentifier('EMP-MNT-001')
        assert.ok(userById, 'Should resolve by employee ID')
        assert.equal(userById.username, 'maintenancemanager')

        const profileOptionsCode = fs.readFileSync('src/Pages/Authentication/profileOptions.js', 'utf8')
        assert.ok(profileOptionsCode.includes('ROLES.MAINTENANCE_MANAGER'), 'Profile options must include ROLES.MAINTENANCE_MANAGER')
        assert.ok(profileOptionsCode.includes('Maintenance Manager'), 'Profile options must include Maintenance Manager label')
    })

    await t.test('3. Department Ticketing head assignment', () => {
        const maintenanceDept = DEPARTMENT_CONFIGS.find((d) => d.name === 'Maintenance & Electrical')
        assert.ok(maintenanceDept, 'Maintenance & Electrical department taxonomy must exist')
        assert.equal(maintenanceDept.managerId, 'EMP-MNT-001')
        assert.equal(maintenanceDept.managerName, 'Gopalakrishnan R')
        assert.equal(maintenanceDept.managerRole, ROLES.MAINTENANCE_MANAGER)
    })

    await t.test('4. Task Management hierarchy and ID mapping', () => {
        assert.ok(ASSIGNMENT_HIERARCHY[ROLES.PRINCIPAL].includes(ROLES.MAINTENANCE_MANAGER))
        assert.ok(ASSIGNMENT_HIERARCHY[ROLES.JOINT_DIRECTOR_ASSISTANT].includes(ROLES.MAINTENANCE_MANAGER))
        assert.ok(ASSIGNMENT_HIERARCHY[ROLES.MAINTENANCE_MANAGER].includes(ROLES.MAINTENANCE_MANAGER))
        assert.equal(DEMO_USER_ID_BY_ROLE[ROLES.MAINTENANCE_MANAGER], 'MNT-001')
    })

    await t.test('5. Announcement and Leave Request route configuration', () => {
        const announcementCfg = ANNOUNCEMENT_ROUTE_CONFIG[ROLES.MAINTENANCE_MANAGER]
        assert.ok(announcementCfg, 'Announcement route config must exist')
        assert.equal(announcementCfg.list, '/maintenance-manager/broadcast')
        assert.equal(announcementCfg.sentByDefault, 'Maintenance Manager')

        const leaveCfg = LEAVE_ROUTE_CONFIG[ROLES.MAINTENANCE_MANAGER]
        assert.ok(leaveCfg, 'Leave request config must exist')
        assert.equal(leaveCfg.myList, '/maintenance-manager/leave-request/my-requests')
    })

    await t.test('6. Sidebar navigation menu contains all dedicated maintenance modules', () => {
        const nav = getAuthorizedNavigation({ role: ROLES.MAINTENANCE_MANAGER, pathname: '/maintenance-manager/dashboard' })
        assert.ok(nav.length > 0, 'Navigation items must be populated')

        const titles = nav.map((item) => item.title)
        assert.ok(titles.includes('Dashboard'), 'Must include Dashboard')
        assert.equal(titles.includes('Campus Maintenance & Work Orders'), false, 'Campus Maintenance must be removed')
        assert.equal(titles.includes('Spares & Equipment Inventory'), false, 'Spares Inventory must be removed')
        assert.ok(titles.includes('Duty Allotment'), 'Must include Duty Allotment')
        assert.ok(titles.includes('Preventive Maintenance Schedules'), 'Must include Preventive Maintenance Schedules')
        assert.ok(titles.includes('Equipment & Safety Inspections'), 'Must include Equipment & Safety Inspections')
        assert.ok(titles.includes('Building Maintenance Register'), 'Must include Building Maintenance Register')
        assert.ok(titles.includes('Reports & Metrics'), 'Must include Reports & Metrics')
        assert.ok(titles.includes('Department Helpdesk'), 'Must include Department Helpdesk')
        assert.ok(titles.includes('Request Product from Store'), 'Must include Request Product from Store')
    })
})
