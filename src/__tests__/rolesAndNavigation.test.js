import test from 'node:test'
import assert from 'node:assert/strict'

import { ROLES, ROLE_HOME_PATHS, ROLE_PREFIX } from '../constants/roles.js'
import fs from 'node:fs'
import path from 'node:path'
import {
    ENTERPRISE_USER_DIRECTORY,
    findUserByIdentifier,
} from '../Pages/Authentication/enterpriseUserDirectory.js'
import {
    getPortalLayout,
    PORTAL_LAYOUTS,
    INSTITUTIONAL_PORTAL_LAYOUTS,
} from '../Layout/layoutRegistry.js'
import {
    maintenanceManagerSidebarLinks,
    driverSidebarLinks,
    proSidebarLinks,
    fileRoomSidebarLinks,
    cctvSidebarLinks,
    roleBasedSidebarLinks,
    ROLE_SIDEBAR_CONFIGS,
} from '../Common/CommonSidebar/Components/sidebarLinks.js'
import {
    ensureEnterpriseAndWorkModules,
    getAuthorizedNavigation,
    normalizeRoleKey,
    resolveRoleFromPath,
    ROLE_TO_BASE_PATH,
} from '../Common/navigation/centralNavigationRegistry.js'
import { proService } from '../services/modules/proService.js'
import { fileRoomService } from '../services/modules/fileRoomService.js'
import { cctvService } from '../services/modules/cctvService.js'

// ============================================================================
// 1. INSTITUTIONAL ROLES & RBAC DEFINITION
// ============================================================================

test('1. ROLES constants define institutional roles (PRO, File Room, CCTV)', () => {
    assert.equal(ROLES.PRO, 'pro')
    assert.equal(ROLES.FILE_ROOM, 'fileroom')
    assert.equal(ROLES.CCTV, 'cctv')
})

test('2. ROLE_HOME_PATHS maps institutional roles and driver to their dashboards', () => {
    assert.equal(ROLE_HOME_PATHS[ROLES.PRO], '/pro/dashboard')
    assert.equal(ROLE_HOME_PATHS[ROLES.FILE_ROOM], '/file-room/dashboard')
    assert.equal(ROLE_HOME_PATHS[ROLES.CCTV], '/cctv/dashboard')
    assert.equal(ROLE_HOME_PATHS[ROLES.DRIVER], '/driver/dashboard')
})

test('3. ROLE_PREFIX correctly maps institutional role prefixes and is re-exported from AuthContext', () => {
    assert.ok(ROLE_PREFIX, 'ROLE_PREFIX must be exported')
    assert.equal(ROLE_PREFIX[ROLES.PRO], '/pro')
    assert.equal(ROLE_PREFIX[ROLES.FILE_ROOM], '/file-room')
    assert.equal(ROLE_PREFIX[ROLES.CCTV], '/cctv')
    assert.equal(ROLE_PREFIX[ROLES.DRIVER], '/driver')

    const authContextSource = fs.readFileSync(path.resolve('src/context/AuthContext.jsx'), 'utf-8')
    assert.ok(authContextSource.includes('ROLE_HOME_PATHS'), 'AuthContext must export ROLE_HOME_PATHS')
    assert.ok(authContextSource.includes('ROLE_PREFIX'), 'AuthContext must export ROLE_PREFIX')
})

// ============================================================================
// 2. ENTERPRISE USER DIRECTORY & DEMO CREDENTIALS
// ============================================================================

test('4. Enterprise directory contains PRO demo credentials', () => {
    const user = findUserByIdentifier('pro@school.edu')
    assert.ok(user, 'pro@school.edu must resolve in enterprise user directory')
    assert.equal(user.role, ROLES.PRO)
    assert.equal(user.status, 'Active')
    assert.ok(user.name.includes('Public Relations') || user.name.includes('Officer'))

    // Also resolves via username, id, or alias
    assert.equal(findUserByIdentifier('EMP-PRO-001')?.role, ROLES.PRO)
    assert.equal(findUserByIdentifier('pro')?.role, ROLES.PRO)
    assert.equal(findUserByIdentifier('pro@school.com')?.role, ROLES.PRO)
})

test('5. Enterprise directory contains File Room Custodian demo credentials', () => {
    const user = findUserByIdentifier('fileroom@school.edu')
    assert.ok(user, 'fileroom@school.edu must resolve in enterprise user directory')
    assert.equal(user.role, ROLES.FILE_ROOM)
    assert.equal(user.status, 'Active')
    assert.ok(user.name.includes('File Room') || user.name.includes('Custodian'))

    // Also resolves via id, username, or alias
    assert.equal(findUserByIdentifier('EMP-FLR-001')?.role, ROLES.FILE_ROOM)
    assert.equal(findUserByIdentifier('fileroom')?.role, ROLES.FILE_ROOM)
    assert.equal(findUserByIdentifier('fileroom@school.com')?.role, ROLES.FILE_ROOM)
})

test('6. Enterprise directory contains CCTV In-charge demo credentials', () => {
    const user = findUserByIdentifier('cctv@school.edu')
    assert.ok(user, 'cctv@school.edu must resolve in enterprise user directory')
    assert.equal(user.role, ROLES.CCTV)
    assert.equal(user.status, 'Active')
    assert.ok(user.name.includes('CCTV') || user.name.includes('Surveillance'))

    // Also resolves via id, username, or alias
    assert.equal(findUserByIdentifier('EMP-CCTV-001')?.role, ROLES.CCTV)
    assert.equal(findUserByIdentifier('cctv')?.role, ROLES.CCTV)
    assert.equal(findUserByIdentifier('cctv@school.com')?.role, ROLES.CCTV)
})

// ============================================================================
// 3. LAYOUT REGISTRY CONFIGURATION
// ============================================================================

test('7. Layout registry registers PRO, File Room, and CCTV portal layouts with breadcrumb support', () => {
    const proLayout = getPortalLayout(ROLES.PRO)
    assert.ok(proLayout, 'PRO portal layout must be configured')
    assert.equal(proLayout.role, 'pro')
    assert.equal(proLayout.showBreadcrumb, true)

    const fileRoomLayout = getPortalLayout(ROLES.FILE_ROOM)
    assert.ok(fileRoomLayout, 'File Room portal layout must be configured')
    assert.equal(fileRoomLayout.role, 'fileroom')
    assert.equal(fileRoomLayout.showBreadcrumb, true)

    const cctvLayout = getPortalLayout(ROLES.CCTV)
    assert.ok(cctvLayout, 'CCTV portal layout must be configured')
    assert.equal(cctvLayout.role, 'cctv')
    assert.equal(cctvLayout.showBreadcrumb, true)

    // Direct property lookup on PORTAL_LAYOUTS
    assert.equal(PORTAL_LAYOUTS[ROLES.PRO]?.role, 'pro')
    assert.equal(PORTAL_LAYOUTS[ROLES.FILE_ROOM]?.role, 'fileroom')
    assert.equal(PORTAL_LAYOUTS[ROLES.CCTV]?.role, 'cctv')
})

// ============================================================================
// 4. MAINTENANCE ROLE NAVIGATION CLEANUP
// ============================================================================

test('8. Maintenance role navigation cleans up Items 3 & 4 while retaining all other 20 items', () => {
    assert.equal(
        maintenanceManagerSidebarLinks.length,
        20,
        `Expected 20 maintenance links after removing items 3 and 4, got ${maintenanceManagerSidebarLinks.length}`
    )

    // Confirm Item 3 ("Campus Maintenance & Work Orders" / "/maintenance-manager/campus-maintenance") is removed
    const hasCampusMaint = maintenanceManagerSidebarLinks.some(
        (link) => link.to === '/maintenance-manager/campus-maintenance' || link.title?.includes('Power Infrastructure')
    )
    assert.equal(hasCampusMaint, false, 'Campus Maintenance & Work Orders must be removed')

    // Confirm Item 4 ("Spares & Equipment Inventory" / "/maintenance-manager/inventory") is removed
    const hasSparesInv = maintenanceManagerSidebarLinks.some(
        (link) => link.to === '/maintenance-manager/inventory' && link.title?.includes('Spares & Equipment')
    )
    assert.equal(hasSparesInv, false, 'Spares & Equipment Inventory must be removed')

    // Confirm legitimate maintenance items are retained
    const paths = maintenanceManagerSidebarLinks.map((l) => l.to)
    assert.ok(paths.includes('/maintenance-manager/dashboard'))
    assert.ok(paths.includes('/maintenance-manager/task-management'))
    assert.ok(paths.includes('/maintenance-manager/requests-approvals'))
    assert.ok(paths.includes('/maintenance-manager/duty-allotment'))
    assert.ok(paths.includes('/maintenance-manager/schedules'))
    assert.ok(paths.includes('/maintenance-manager/equipment-inspections'))
    assert.ok(paths.includes('/maintenance-manager/building-maintenance'))
})

// ============================================================================
// 5. DRIVER ROLE SPECIALIZATION & MODULE EXEMPTION
// ============================================================================

test('9. Driver role navigation displays exclusively focused transport items', () => {
    const titles = driverSidebarLinks.map((l) => l.title)
    const paths = driverSidebarLinks.map((l) => l.to)

    // Assert generic non-transport items are removed
    assert.equal(titles.includes('Request Product from Store'), false)
    assert.equal(titles.includes('Staff Relieving & NOC'), false)
    assert.equal(titles.includes('Reports & Analytics'), false)
    assert.equal(titles.includes('Department Helpdesk'), false)

    // Assert all 8 focused transport items are present
    assert.ok(paths.includes('/driver/dashboard'), 'Dashboard link missing')
    assert.ok(paths.includes('/driver/my-duty'), 'My Duty link missing')
    assert.ok(paths.includes('/driver/my-route/route-details'), 'Route Details & Stops link missing')
    assert.ok(paths.includes('/driver/attendance-management/student-attendance'), 'Student Passenger Manifest & Boarding missing')
    assert.ok(paths.includes('/driver/attendance-management/attendance-history'), 'Attendance History missing')
    assert.ok(paths.includes('/driver/vehicle-management'), 'Vehicle Management link missing')
    assert.ok(paths.includes('/driver/fuel-request'), 'Fuel Request link missing')
    assert.ok(paths.includes('/driver/maintenance-request'), 'Maintenance Request link missing')

    assert.equal(driverSidebarLinks.length, 8, `Expected exactly 8 focused driver links, got ${driverSidebarLinks.length}`)
})

test('10. ensureEnterpriseAndWorkModules exempts ROLES.DRIVER from generic module injection', () => {
    const initialCount = driverSidebarLinks.length
    const processed = ensureEnterpriseAndWorkModules(driverSidebarLinks, ROLES.DRIVER)

    assert.equal(
        processed.length,
        initialCount,
        'Driver navigation should not have generic enterprise modules injected'
    )

    // Contrast with other staff role (e.g. MAINTENANCE_MANAGER or HR)
    const staffTestItems = [{ id: 1, title: 'Dashboard', to: '/hr/dashboard' }]
    const staffProcessed = ensureEnterpriseAndWorkModules(staffTestItems, ROLES.HR)
    assert.ok(staffProcessed.length > 1, 'Staff roles should have enterprise modules injected')
})

// ============================================================================
// 6. CENTRAL NAVIGATION REGISTRY & ROLE NORMALIZATION
// ============================================================================

test('11. Central navigation registry normalizes institutional role strings', () => {
    assert.equal(normalizeRoleKey('pro'), ROLES.PRO)
    assert.equal(normalizeRoleKey('PRO'), ROLES.PRO)
    assert.equal(normalizeRoleKey('fileroom'), ROLES.FILE_ROOM)
    assert.equal(normalizeRoleKey('file-room'), ROLES.FILE_ROOM)
    assert.equal(normalizeRoleKey('cctv'), ROLES.CCTV)
    assert.equal(normalizeRoleKey('cameraroom'), ROLES.CCTV)
    assert.equal(normalizeRoleKey('cameraperson'), ROLES.CCTV)
})

test('12. Central navigation registry resolves path prefixes to institutional roles', () => {
    assert.equal(resolveRoleFromPath('/pro/dashboard'), ROLES.PRO)
    assert.equal(resolveRoleFromPath('/pro/statutory-calendar'), ROLES.PRO)
    assert.equal(resolveRoleFromPath('/file-room/dashboard'), ROLES.FILE_ROOM)
    assert.equal(resolveRoleFromPath('/file-room/documents'), ROLES.FILE_ROOM)
    assert.equal(resolveRoleFromPath('/cctv/dashboard'), ROLES.CCTV)
    assert.equal(resolveRoleFromPath('/cctv/cameras'), ROLES.CCTV)
    assert.equal(resolveRoleFromPath('/driver/dashboard'), ROLES.DRIVER)
})

test('13. ROLE_TO_BASE_PATH maps canonical base routes for institutional roles', () => {
    assert.equal(ROLE_TO_BASE_PATH[ROLES.PRO], '/pro')
    assert.equal(ROLE_TO_BASE_PATH[ROLES.FILE_ROOM], '/file-room')
    assert.equal(ROLE_TO_BASE_PATH[ROLES.CCTV], '/cctv')
    assert.equal(ROLE_TO_BASE_PATH[ROLES.DRIVER], '/driver')
})

// ============================================================================
// 7. SIDEBAR CONFIGURATIONS & LINK REGISTRY
// ============================================================================

test('14. Sidebar links exports institutional links and registers them in ROLE_SIDEBAR_CONFIGS', () => {
    assert.ok(Array.isArray(proSidebarLinks) && proSidebarLinks.length > 0)
    assert.ok(Array.isArray(fileRoomSidebarLinks) && fileRoomSidebarLinks.length > 0)
    assert.ok(Array.isArray(cctvSidebarLinks) && cctvSidebarLinks.length > 0)

    assert.ok(roleBasedSidebarLinks.PRO)
    assert.ok(roleBasedSidebarLinks.FileRoom)
    assert.ok(roleBasedSidebarLinks.CCTV)

    assert.ok(ROLE_SIDEBAR_CONFIGS.pro)
    assert.ok(ROLE_SIDEBAR_CONFIGS.fileroom)
    assert.ok(ROLE_SIDEBAR_CONFIGS.cctv)
})

// ============================================================================
// 8. SERVICE LAYER INTEGRATION READINESS
// ============================================================================

test('15. Service layer provides telemetry and stats for PRO, File Room, and CCTV dashboards', async () => {
    const proStats = await proService.getComplianceStats()
    assert.equal(proStats.success, true)
    assert.ok(typeof proStats.data.totalCorrespondence === 'number')

    const fileRoomStats = await fileRoomService.getFileRoomStats()
    assert.equal(fileRoomStats.success, true)
    assert.ok(typeof fileRoomStats.data.totalFiles === 'number')

    const cctvStats = await cctvService.getCctvStats()
    assert.equal(cctvStats.success, true)
    assert.ok(typeof cctvStats.data.totalCameras === 'number')
})

// ============================================================================
// 9. ADVERSARIAL VULNERABILITY REMEDIATION VERIFICATION
// ============================================================================

test('16. Maintenance Manager runtime navigation excludes deprecated items (VULN-M2-03)', () => {
    const nav = getAuthorizedNavigation(ROLES.MAINTENANCE_MANAGER, '/maintenance-manager/dashboard')
    const titles = nav.map((item) => item.title)
    const paths = nav.map((item) => item.to)

    assert.equal(titles.includes('Campus Maintenance & Work Orders'), false, 'Campus Maintenance must not be present')
    assert.equal(titles.includes('Spares & Equipment Inventory'), false, 'Spares Inventory must not be present')
    assert.equal(paths.includes('/maintenance-manager/campus-maintenance'), false, 'Path campus-maintenance must not be present')
    assert.equal(paths.includes('/maintenance-manager/inventory'), false, 'Path /maintenance-manager/inventory must not be present')
})

test('17. Driver runtime navigation excludes generic enterprise operations (VULN-M2-03 Driver)', () => {
    const nav = getAuthorizedNavigation(ROLES.DRIVER, '/driver/dashboard')
    const titles = nav.map((item) => item.title)

    assert.equal(titles.includes('Department Helpdesk'), false, 'Driver must not have Department Helpdesk')
    assert.equal(titles.includes('Stores & Procurement'), false, 'Driver must not have Stores & Procurement')
    assert.equal(titles.includes('Physical File Room'), false, 'Driver must not have Physical File Room')
    assert.equal(titles.includes('Activity Monitoring'), false, 'Driver must not have Activity Monitoring')
    assert.equal(titles.includes('Lost & Found'), false, 'Driver must not have Lost & Found')

    // Also when called without pathname
    const navNoPath = getAuthorizedNavigation(ROLES.DRIVER)
    const titlesNoPath = navNoPath.map((item) => item.title)
    assert.equal(titlesNoPath.includes('Department Helpdesk'), false)
    assert.equal(titlesNoPath.includes('Stores & Procurement'), false)
})

test('18. App.jsx route perimeter and DriverRoutes route isolation (VULN-M2-01 & VULN-M2-02)', () => {
    const appSource = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8')
    // VULN-M2-01: Pro boundary check does not collide with /process-auditor
    assert.ok(
        appSource.includes('pathname !== "/pro" && !pathname.startsWith("/pro/")'),
        'App.jsx must use boundary-delimited check for ROLES.PRO'
    )
    assert.ok(
        !appSource.includes('if (!pathname.startsWith("/pro")) {\n      return <Navigate to={ROLE_HOME_PATHS[ROLES.PRO]}'),
        'App.jsx must not use bare startsWith("/pro") for PRO perimeter check'
    )

    const driverRoutesSource = fs.readFileSync(path.resolve('src/Routes/DriverRoutes.jsx'), 'utf-8')
    // VULN-M2-02: DriverRoutes must not mount EnterpriseOperationsRoutes
    assert.equal(
        driverRoutesSource.includes('EnterpriseOperationsRoutes'),
        false,
        'DriverRoutes must not import or mount EnterpriseOperationsRoutes'
    )
})
