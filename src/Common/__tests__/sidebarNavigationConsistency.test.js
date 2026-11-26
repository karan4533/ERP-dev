import test from 'node:test'
import assert from 'node:assert/strict'
import { ROLES } from '../../constants/roles.js'
import {
    getAuthorizedNavigation,
    getNavigationForPath,
    normalizeRoleKey,
    resolveRoleFromPath,
    annotateAndTagModules,
} from '../navigation/centralNavigationRegistry.js'
import { groupNavigationItems } from '../navigation/navigationHelpers.js'
import {
    getNavigationPreferences,
    buildDefaultPreferences,
    getModuleKey,
} from '../navigation/navigationCustomizationData.js'

test('School ERP — Sidebar Navigation Consistency & Role-Based Menu Fix', async (t) => {
    // Setup mock window & localStorage for Node test environment
    const storage = new Map()
    global.window = {
        localStorage: {
            getItem: (k) => storage.get(k) || null,
            setItem: (k, v) => storage.set(k, String(v)),
            removeItem: (k) => storage.delete(k),
            clear: () => storage.clear(),
        },
        dispatchEvent: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
    }

    await t.test('1. Normalizes role variations to canonical keys', () => {
        assert.equal(normalizeRoleKey('prm'), ROLES.PRM)
        assert.equal(normalizeRoleKey('front-office'), ROLES.PRM)
        assert.equal(normalizeRoleKey('Front Office'), ROLES.PRM)
        assert.equal(normalizeRoleKey('admin'), ROLES.ADMIN)
        assert.equal(normalizeRoleKey('Administrator'), ROLES.ADMIN)
        assert.equal(normalizeRoleKey('super-admin'), ROLES.SUPER_ADMIN)
        assert.equal(normalizeRoleKey('gatekeeper'), ROLES.GATEKEEPER)
        assert.equal(normalizeRoleKey('gate-keeper'), ROLES.GATEKEEPER)
        assert.equal(normalizeRoleKey('gatekeeper-manager'), ROLES.GATEKEEPER_MANAGER)
        assert.equal(normalizeRoleKey('vandriver'), ROLES.DRIVER)
        assert.equal(normalizeRoleKey('account-head'), ROLES.ACCOUNT_HEAD)
    })

    await t.test('2. Resolves role context from path prefix when explicit role is omitted', () => {
        assert.equal(resolveRoleFromPath('/front-office/dashboard'), ROLES.PRM)
        assert.equal(resolveRoleFromPath('/front-office/visitors'), ROLES.PRM)
        assert.equal(resolveRoleFromPath('/principal/dashboard'), ROLES.PRINCIPAL)
        assert.equal(resolveRoleFromPath('/teacher/dashboard'), ROLES.TEACHER)
        assert.equal(resolveRoleFromPath('/gate-keeper/dashboard'), ROLES.GATEKEEPER)
        assert.equal(resolveRoleFromPath('/gatekeeper-manager/dashboard'), ROLES.GATEKEEPER_MANAGER)
        assert.equal(resolveRoleFromPath('/admin/dashboard'), ROLES.ADMIN)
        assert.equal(resolveRoleFromPath('/my-profile'), null)
    })

    await t.test('3. PRM / Front Office: returns State B (Authoritative Department Navigation) on Dashboard', () => {
        const nav = getAuthorizedNavigation('prm', '/front-office/dashboard')
        assert.ok(nav.length > 0, 'PRM navigation must not be empty')

        const titles = nav.map((i) => i.title)

        // Must contain all core PRM department modules
        assert.ok(titles.includes('Admission Enquiry'), 'Must include Admission Enquiry')
        assert.ok(titles.includes('Admission List'), 'Must include Admission List')
        assert.ok(titles.includes('Visitors'), 'Must include Visitors')
        assert.ok(titles.includes('User Database'), 'Must include User Database')
        assert.ok(titles.includes('Student Transfer'), 'Must include Student Transfer')
        assert.ok(titles.includes('Student Re-Enrollment'), 'Must include Student Re-Enrollment')
        assert.ok(titles.includes('TC Request'), 'Must include TC Request')
        assert.ok(titles.includes('Gate Pass'), 'Must include Gate Pass')
        assert.ok(titles.includes('Task Management'), 'Must include Task Management')
        assert.ok(titles.includes('Attendance & Leave Management'), 'Must include Attendance & Leave Management')

        // Enterprise Operations must be present
        assert.ok(titles.includes('Department Helpdesk'), 'Must include Department Helpdesk')
        assert.ok(titles.includes('Stores & Procurement'), 'Must include Stores & Procurement')
        assert.ok(titles.includes('Physical File Room'), 'Must include Physical File Room')
        assert.ok(titles.includes('Activity Monitoring'), 'Must include Activity Monitoring')
        assert.ok(titles.includes('Lost & Found'), 'Must include Lost & Found')

        // Must NOT contain Admin-only configuration / Academic Admin modules (State A contamination)
        assert.ok(!titles.includes('RBAC'), 'Must NOT include Admin RBAC')
        assert.ok(!titles.includes('Class Details'), 'Must NOT include Admin Class Details')
        assert.ok(!titles.includes('User Creation'), 'Must NOT include Admin User Creation')
    })

    await t.test('4. PRM / Front Office: preserves State B when visiting /my-profile or /settings (NEVER switches to State A)', () => {
        // Explicit role passed as activeRole (portalMeta.role or auth.role)
        const profileNav = getAuthorizedNavigation('prm', '/my-profile')
        const titles = profileNav.map((i) => i.title)

        assert.ok(titles.includes('Admission Enquiry'), 'Must retain Admission Enquiry on /my-profile')
        assert.ok(titles.includes('Admission List'), 'Must retain Admission List on /my-profile')
        assert.ok(titles.includes('Visitors'), 'Must retain Visitors on /my-profile')
        assert.ok(titles.includes('User Database'), 'Must retain User Database on /my-profile')
        assert.ok(titles.includes('Gate Pass'), 'Must retain Gate Pass on /my-profile')
        assert.ok(titles.includes('Department Helpdesk'), 'Must retain Department Helpdesk on /my-profile')

        // Must NEVER switch to Admin State A
        assert.ok(!titles.includes('RBAC'), 'Must NOT switch to Admin RBAC')
        assert.ok(!titles.includes('Class Details'), 'Must NOT switch to Admin Class Details')

        // Check settings and approvals routes as well
        const settingsNav = getNavigationForPath('/settings', 'prm')
        assert.ok(settingsNav.some((i) => i.title === 'Visitors'))
        assert.ok(settingsNav.some((i) => i.title === 'Department Helpdesk'))
        assert.ok(!settingsNav.some((i) => i.title === 'RBAC'))
    })

    await t.test('5. Principal, Director, Teacher, and Gatekeeper retain their distinct menus on /my-profile', () => {
        // Principal
        const principalNav = getAuthorizedNavigation('principal', '/my-profile')
        const principalTitles = principalNav.map((i) => i.title)
        assert.ok(principalTitles.includes('Teacher Allocation') || principalTitles.includes('Examination Timetable'), 'Principal must have principal modules')
        assert.ok(principalTitles.includes('Department Helpdesk'), 'Principal must have Department Helpdesk')
        assert.ok(!principalTitles.includes('Admission Enquiry'), 'Principal should not have Front Office specific menu')

        // Teacher
        const teacherNav = getAuthorizedNavigation('teacher', '/my-profile')
        assert.ok(teacherNav.length > 0)
        assert.ok(teacherNav.every((item) => item.role === ROLES.TEACHER))
        assert.ok(teacherNav.some((item) => item.title === 'Department Helpdesk'), 'Teacher must have Department Helpdesk')

        // Gatekeeper
        const gatekeeperNav = getAuthorizedNavigation('gatekeeper', '/my-profile')
        const gatekeeperTitles = gatekeeperNav.map((i) => i.title)
        assert.ok(gatekeeperTitles.includes('Visitors') || gatekeeperTitles.includes('Dashboard'), 'Gatekeeper has visitor/gatepass operations')
        assert.ok(gatekeeperTitles.includes('Department Helpdesk'), 'Gatekeeper has Department Helpdesk')

        // Admin
        const adminNav = getAuthorizedNavigation('admin', '/my-profile')
        const adminTitles = adminNav.map((i) => i.title)
        assert.ok(adminTitles.includes('Stores & Procurement'), 'Admin has Stores & Procurement')
        assert.ok(adminTitles.includes('Department Helpdesk'), 'Admin has Department Helpdesk')
        assert.ok(adminTitles.includes('RBAC'), 'Admin has RBAC')
    })

    await t.test('6. Collision-proof role namespacing of module IDs', () => {
        const rawItems = [
            { id: 0, title: 'Dashboard', to: '/front-office/dashboard' },
            { id: 1, title: 'Visitors', to: '/front-office/visitors' },
        ]

        const prmTagged = annotateAndTagModules(rawItems, 'prm')
        assert.equal(prmTagged[0].id, 'prm-dashboard')
        assert.equal(prmTagged[1].id, 'prm-visitors')
        assert.equal(prmTagged[0].role, ROLES.PRM)

        const adminTagged = annotateAndTagModules(rawItems, 'admin')
        assert.equal(adminTagged[0].id, 'admin-dashboard')
        assert.equal(adminTagged[1].id, 'admin-visitors')
        assert.equal(adminTagged[0].role, ROLES.ADMIN)

        // Verifies distinct IDs across roles preventing localStorage overwrite collisions
        assert.notEqual(prmTagged[0].id, adminTagged[0].id)
    })

    await t.test('7. Anti-poisoning guard clears foreign module cache and restores default preferences', () => {
        const prmItems = getAuthorizedNavigation('prm', '/front-office/dashboard')
        const storageKey = 'schoolerp_nav_customization_prm_user_example_com'

        // Simulate corrupted localStorage containing Admin module IDs under PRM key (State A poison)
        const corruptedState = {
            pinnedIds: ['admin-rbac', 'admin-class-details'],
            groups: [
                { id: 'department', label: 'Department', moduleIds: ['admin-rbac', 'admin-class-details'] },
            ],
        }
        storage.set(storageKey, JSON.stringify(corruptedState))

        // Request preferences for PRM
        const cleanPrefs = getNavigationPreferences('prm', 'user@example.com', prmItems)

        // Must flush poisoned storage and return valid PRM module groups
        const resolvedIds = cleanPrefs.groups.flatMap((g) => g.moduleIds)
        assert.ok(resolvedIds.includes('prm-visitors') || resolvedIds.some((id) => id.includes('visitor')), 'Restored PRM visitors')
        assert.ok(!resolvedIds.includes('admin-rbac'), 'Flushed poisoned admin-rbac')
    })

    await t.test('8. Categorizes modules accurately into My Work, Department, and Configuration groups', () => {
        const prmItems = getAuthorizedNavigation('prm', '/front-office/dashboard')
        const grouped = groupNavigationItems(prmItems)

        const workGroup = grouped.find((g) => g.key === 'work')
        const deptGroup = grouped.find((g) => g.key === 'department')

        assert.ok(workGroup, 'My Work group must exist')
        assert.ok(deptGroup, 'Department group must exist')

        // Verify My Work modules
        const workTitles = workGroup.items.map((i) => i.title)
        assert.ok(workTitles.includes('Task Management'), 'Task Management belongs to My Work')
        assert.ok(workTitles.includes('Attendance & Leave Management'), 'Attendance & Leave belongs to My Work')
        assert.ok(workTitles.includes('Communication'), 'Communication belongs to My Work')

        // Verify Department modules
        const deptTitles = deptGroup.items.map((i) => i.title)
        assert.ok(deptTitles.includes('Admission Enquiry'), 'Admission Enquiry belongs to Department')
        assert.ok(deptTitles.includes('Visitors'), 'Visitors belongs to Department')
        assert.ok(deptTitles.includes('User Database'), 'User Database belongs to Department')
        assert.ok(deptTitles.includes('Gate Pass'), 'Gate Pass belongs to Department')
        assert.ok(deptTitles.includes('Department Helpdesk'), 'Department Helpdesk belongs to Department')
    })

    await t.test('9. Universal Enterprise Operations: Department Helpdesk, Stores, File Room, Activity Monitoring & Lost and Found across all staff roles', () => {
        const staffRoles = Object.values(ROLES).filter((r) => r !== ROLES.STUDENT && r !== ROLES.PARENT && r !== ROLES.DRIVER)

        for (const role of staffRoles) {
            const items = getAuthorizedNavigation(role)
            const titles = items.map((i) => i.title)

            assert.ok(
                titles.includes('Department Helpdesk'),
                `Role "${role}" must have Department Helpdesk in navigation`
            )
            assert.ok(
                titles.some((t) => t.includes('Store') || t.includes('Requisition')),
                `Role "${role}" must have Stores & Procurement in navigation`
            )
            assert.ok(
                titles.some((t) => t.includes('File Room')),
                `Role "${role}" must have Physical File Room in navigation`
            )
            assert.ok(
                titles.some((t) => t.includes('Activity Monitoring')),
                `Role "${role}" must have Activity Monitoring in navigation`
            )
            assert.ok(
                titles.some((t) => t.includes('Lost & Found') || t.includes('Lost & found')),
                `Role "${role}" must have Lost & Found in navigation`
            )
        }

        // Verify Driver transit role is exempted and has only transport navigation
        const driverItems = getAuthorizedNavigation(ROLES.DRIVER)
        const driverTitles = driverItems.map((i) => i.title)
        assert.equal(driverTitles.includes('Department Helpdesk'), false, 'Driver must not have generic Department Helpdesk')
        assert.equal(driverTitles.includes('Physical File Room'), false, 'Driver must not have generic Physical File Room')
        assert.equal(driverTitles.includes('Activity Monitoring'), false, 'Driver must not have generic Activity Monitoring')
        assert.equal(driverTitles.includes('Lost & Found'), false, 'Driver must not have generic Lost & Found')
    })
})
