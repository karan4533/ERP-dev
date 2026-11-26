import {
    accountHeadSidebarLinks,
    adminSidebarLinks,
    canteenManagerSidebarLinks,
    coordinatorSidebarLinks,
    directorSidebarLinks,
    driverSidebarLinks,
    gateKeeperManagerSidebarLinks,
    gateKeeperSidebarLinks,
    housekeepingManagerSidebarLinks,
    maintenanceManagerSidebarLinks,
    hrSidebarLinks,
    itSupportManagerSidebarLinks,
    jointDirectorAssistantSidebarLinks,
    jointDirectorAuditSidebarLinks,
    jointDirectorSidebarLinks,
    librarianSidebarLinks,
    parentSidebarLinks,
    principalSidebarLinks,
    prmSidebarLinks,
    processAuditorSidebarLinks,
    qualityAuditorSidebarLinks,
    stationeryStoreManagerSidebarLinks,
    studentSidebarLinks,
    superAdminSidebarLinks,
    teacherSidebarLinks,
    transportManagerSidebarLinks,
    proSidebarLinks,
    fileRoomSidebarLinks,
    cctvSidebarLinks,
} from '../CommonSidebar/Components/sidebarLinks'
import {
    getFilteredCoordinatorSidebarLinks,
    getFilteredTeacherSidebarLinks,
} from '../RBAC/rolePermissionsData'
import { getFilteredAdminSidebarLinks } from '../../Pages/SuperAdmin/UserCreation/adminUsersData'
import {
    findNavigationSource,
    getNavigationLabel,
    normalizeNavigationItems,
} from './navigationHelpers'
import {
    getAuthorizedNavigation,
    normalizeRoleKey,
    resolveRoleFromPath,
} from './centralNavigationRegistry'

export {
    getAuthorizedNavigation,
    normalizeRoleKey,
    resolveRoleFromPath,
}

export const NAVIGATION_SOURCES = Object.freeze([
    { prefix: '/pro', getItems: () => proSidebarLinks },
    { prefix: '/file-room', getItems: () => fileRoomSidebarLinks },
    { prefix: '/cctv', getItems: () => cctvSidebarLinks },
    { prefix: '/super-admin', getItems: () => superAdminSidebarLinks },
    { prefix: '/parent', getItems: () => parentSidebarLinks },
    { prefix: '/student', getItems: () => studentSidebarLinks },
    { prefix: '/coordinator', getItems: () => getFilteredCoordinatorSidebarLinks(coordinatorSidebarLinks) },
    { prefix: '/teacher', getItems: () => getFilteredTeacherSidebarLinks(teacherSidebarLinks) },
    { prefix: '/librarian', getItems: () => librarianSidebarLinks },
    { prefix: '/canteen-manager', getItems: () => canteenManagerSidebarLinks },
    { prefix: '/it-support-manager', getItems: () => itSupportManagerSidebarLinks },
    { prefix: '/stationery-store-manager', getItems: () => stationeryStoreManagerSidebarLinks },
    { prefix: '/housekeeping-manager', getItems: () => housekeepingManagerSidebarLinks },
    { prefix: '/maintenance-manager', getItems: () => maintenanceManagerSidebarLinks },
    { prefix: '/transport-manager', getItems: () => transportManagerSidebarLinks },
    { prefix: '/process-auditor', getItems: () => processAuditorSidebarLinks },
    { prefix: '/quality-auditor', getItems: () => qualityAuditorSidebarLinks },
    { prefix: '/account-head', getItems: () => accountHeadSidebarLinks },
    { prefix: '/joint-director-audit', getItems: () => jointDirectorAuditSidebarLinks },
    { prefix: '/joint-director-assistant', getItems: () => jointDirectorAssistantSidebarLinks },
    { prefix: '/joint-director', getItems: () => jointDirectorSidebarLinks },
    { prefix: '/gatekeeper-manager', getItems: () => gateKeeperManagerSidebarLinks },
    { prefix: '/gate-keeper', getItems: () => gateKeeperSidebarLinks },
    { prefix: '/director', getItems: () => directorSidebarLinks },
    { prefix: '/principal', getItems: () => principalSidebarLinks },
    { prefix: '/front-office', getItems: () => prmSidebarLinks },
    { prefix: '/driver', getItems: () => driverSidebarLinks },
    { prefix: '/hr', getItems: () => hrSidebarLinks },
    { prefix: '/admin', getItems: () => getFilteredAdminSidebarLinks() },
])

/**
 * Authoritative role-aware navigation retriever.
 * Resolves based on role and path without defaulting blindly to admin on shared routes.
 */
export const getNavigationForPath = (pathname, role = null) => {
    const resolvedRole = role || resolveRoleFromPath(pathname)
    if (resolvedRole) {
        return getAuthorizedNavigation(resolvedRole, pathname)
    }

    // Try path prefix first
    const source = findNavigationSource(pathname, NAVIGATION_SOURCES)
    if (source) {
        return normalizeNavigationItems(source.getItems())
    }

    // Fall back to getAuthorizedNavigation using path inspection
    return getAuthorizedNavigation(null, pathname)
}

export const getNavigationLabelForPath = (pathname, role = null) => {
    const items = getNavigationForPath(pathname, role)
    return getNavigationLabel(items, pathname)
}
