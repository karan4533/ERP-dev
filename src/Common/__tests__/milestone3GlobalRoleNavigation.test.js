import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ROLES, ROLE_PREFIX } from '../../constants/roles.js'
import {
    COMMUNICATION_ROLE_CONFIG,
    getCommunicationRoleConfig,
} from '../Communication/communicationRoleConfig.js'
import {
    ANNOUNCEMENT_ROUTE_CONFIG,
    getAnnouncementRoutes,
} from '../Announcement/announcementConfigs.js'
import {
    ACADEMIC_CALENDAR_ROLE_CONFIG,
    getAcademicCalendarRoleConfig,
} from '../AcademicCalendar/academicCalendarData.js'
import {
    ESCALATION_ROLE_CONFIG,
    getRoleConfig as getEscalationRoleConfig,
    getEscalationTargetForRole,
} from '../EscalationManagement/escalationRoleConfig.js'
import {
    maintenanceManagerSidebarLinks,
    driverSidebarLinks,
    proSidebarLinks,
    fileRoomSidebarLinks,
    cctvSidebarLinks,
} from '../CommonSidebar/Components/sidebarLinks.js'
import {
    DEFAULT_GATEKEEPER_DUTIES,
    loadDuties,
    DUTIES_STORAGE_KEY,
} from '../../Pages/GateKeeperManager/AssignDuty/assignDutyData.js'

const profileOptionsSource = readFileSync(
    new URL('../../Pages/Authentication/profileOptions.js', import.meta.url),
    'utf8'
)

test('Milestone 3 — Global Role, Navigation, and Action Audit Suite', async (t) => {
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
    global.localStorage = window.localStorage

    await t.test('1. Communication module configured across all 29 roles without undefined routeBase', () => {
        const allRoles = Object.values(ROLES)
        assert.ok(allRoles.length >= 26, 'Should have all standard roles')
        const institutionalRoles = ['pro', 'fileroom', 'cctv']
        const combined = [...new Set([...allRoles, ...institutionalRoles])]

        for (const roleKey of combined) {
            const config = getCommunicationRoleConfig(roleKey)
            assert.ok(config, `Communication config missing for role: ${roleKey}`)
            assert.ok(config.routeBase, `routeBase missing for role: ${roleKey}`)
            assert.ok(config.routeBase.startsWith('/'), `routeBase must be absolute: ${config.routeBase}`)
            assert.ok(config.currentUser, `currentUser missing for role: ${roleKey}`)
            assert.ok(config.currentUser.id, `currentUser.id missing for role: ${roleKey}`)
            assert.ok(config.currentUser.name, `currentUser.name missing for role: ${roleKey}`)
        }
    })

    await t.test('2. Announcement module route mappings configured for institutional and staff roles', () => {
        const criticalRoles = ['transportmanager', 'processauditor', 'qualityauditor', 'accounthead', 'driver', 'pro', 'fileroom', 'cctv', 'parent']
        for (const roleKey of criticalRoles) {
            const routes = getAnnouncementRoutes(roleKey)
            assert.ok(routes, `Announcement routes missing for role: ${roleKey}`)
            assert.notEqual(routes, ANNOUNCEMENT_ROUTE_CONFIG.admin, `Role ${roleKey} should not fall back to admin announcement routes`)
            assert.ok(routes.list, `Announcement list route missing for role: ${roleKey}`)
            assert.ok(routes.view, `Announcement view route missing for role: ${roleKey}`)
        }
    })

    await t.test('3. Academic calendar module configured across all 29 roles eliminating permission blocks', () => {
        const allRoles = Object.values(ROLES)
        const institutionalRoles = ['pro', 'fileroom', 'cctv']
        const combined = [...new Set([...allRoles, ...institutionalRoles])]

        for (const roleKey of combined) {
            const config = getAcademicCalendarRoleConfig(roleKey)
            assert.ok(config, `Academic calendar config missing for role: ${roleKey}`)
            assert.ok(config.routeBase, `routeBase missing for calendar role: ${roleKey}`)
            assert.ok(config.roleLabel, `roleLabel missing for calendar role: ${roleKey}`)
        }
    })

    await t.test('4. Escalation module configured for PRO, File Room, CCTV, and Driver with valid governance escalation hierarchy', () => {
        // PRO escalates to Managing Director
        const proConfig = getEscalationRoleConfig('pro')
        assert.ok(proConfig, 'PRO escalation config must exist')
        assert.equal(proConfig.escalatesToRoleKey, 'director')
        assert.equal(proConfig.routeBase, '/pro/escalation-management')

        // File Room escalates to Joint Director
        const fileRoomConfig = getEscalationRoleConfig('fileroom')
        assert.ok(fileRoomConfig, 'File Room escalation config must exist')
        assert.equal(fileRoomConfig.escalatesToRoleKey, 'jointDirector')
        assert.equal(fileRoomConfig.routeBase, '/file-room/escalation-management')

        // CCTV escalates to Joint Director
        const cctvConfig = getEscalationRoleConfig('cctv')
        assert.ok(cctvConfig, 'CCTV escalation config must exist')
        assert.equal(cctvConfig.escalatesToRoleKey, 'jointDirector')
        assert.equal(cctvConfig.routeBase, '/cctv/escalation-management')

        // Driver escalates to Transport Manager
        const driverConfig = getEscalationRoleConfig('driver')
        assert.ok(driverConfig, 'Driver escalation config must exist')
        assert.equal(driverConfig.escalatesToRoleKey, 'transportManager')
        assert.equal(driverConfig.routeBase, '/driver/escalation-management')
    })

    await t.test('5. Authentication Profile options include PRO, FILE_ROOM, and CCTV identities', () => {
        assert.match(profileOptionsSource, /role:\s*ROLES\.PRO\b/)
        assert.match(profileOptionsSource, /label:\s*['"]Public Relations Officer['"]/)
        assert.match(profileOptionsSource, /alt:\s*['"]pro_profile['"]/)

        assert.match(profileOptionsSource, /role:\s*ROLES\.FILE_ROOM\b/)
        assert.match(profileOptionsSource, /label:\s*['"]File Room Custodian['"]/)
        assert.match(profileOptionsSource, /alt:\s*['"]file_room_profile['"]/)

        assert.match(profileOptionsSource, /role:\s*ROLES\.CCTV\b/)
        assert.match(profileOptionsSource, /label:\s*['"]CCTV In-charge['"]/)
        assert.match(profileOptionsSource, /alt:\s*['"]cctv_profile['"]/)

        assert.match(profileOptionsSource, /export\s+const\s+PROFILE_BY_ROLE/)
        assert.match(profileOptionsSource, /export\s+(?:const|function)\s+getProfileLabel/)
    })

    await t.test('6. Invariant sidebar lengths preserved: maintenanceManager === 20 and driver === 8', () => {
        assert.equal(maintenanceManagerSidebarLinks.length, 20, 'maintenanceManagerSidebarLinks length must remain exactly 20')
        assert.equal(driverSidebarLinks.length, 8, 'driverSidebarLinks length must remain exactly 8')
    })

    await t.test('7. Reports & Analytics sidebar navigation connected for PRO, File Room, and CCTV', () => {
        const proReports = proSidebarLinks.find((l) => l.to === '/pro/reports-analytics')
        assert.ok(proReports, 'proSidebarLinks must contain /pro/reports-analytics')
        assert.equal(proReports.title, 'Reports & Analytics')

        const fileRoomReports = fileRoomSidebarLinks.find((l) => l.to === '/file-room/reports-analytics')
        assert.ok(fileRoomReports, 'fileRoomSidebarLinks must contain /file-room/reports-analytics')
        assert.equal(fileRoomReports.title, 'Reports & Analytics')

        const cctvReports = cctvSidebarLinks.find((l) => l.to === '/cctv/reports-analytics')
        assert.ok(cctvReports, 'cctvSidebarLinks must contain /cctv/reports-analytics')
        assert.equal(cctvReports.title, 'Reports & Analytics')
    })

    await t.test('8. Security Duty Shifts support Pending, In Progress, Completed status lifecycle', () => {
        const initial = loadDuties()
        assert.ok(Array.isArray(initial), 'Initial duties must be an array')
        assert.ok(initial.length >= 4, 'Must have at least 4 seed duty records')

        const validStatuses = ['Pending', 'In Progress', 'Completed']
        for (const item of initial) {
            assert.ok(validStatuses.includes(item.status), `Duty status must be one of ${validStatuses.join(', ')}`)
            assert.ok(item.dutyId, 'dutyId required')
            assert.ok(item.gateLocation, 'gateLocation required')
        }
    })
})
