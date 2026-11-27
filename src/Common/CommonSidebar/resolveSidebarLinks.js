import {
    superAdminSidebarLinks, canteenManagerSidebarLinks, gateKeeperManagerSidebarLinks, gateKeeperSidebarLinks,
    directorSidebarLinks, principalSidebarLinks, librarianSidebarLinks, prmSidebarLinks, proSidebarLinks,
    studentSidebarLinks, parentSidebarLinks, teacherSidebarLinks, coordinatorSidebarLinks, itSupportManagerSidebarLinks,
    stationeryStoreManagerSidebarLinks, housekeepingManagerSidebarLinks, maintenanceManagerSidebarLinks,
    transportManagerSidebarLinks, jointDirectorSidebarLinks, jointDirectorAssistantSidebarLinks,
    jointDirectorAuditSidebarLinks, processAuditorSidebarLinks, qualityAuditorSidebarLinks, hrSidebarLinks,
    accountHeadSidebarLinks, driverSidebarLinks, fileRoomSidebarLinks, cctvRoomSidebarLinks,
} from './Components/sidebarLinks'
import { getFilteredAdminSidebarLinks } from '../../Pages/SuperAdmin/UserCreation/adminUsersData'
import { getFilteredCoordinatorSidebarLinks, getFilteredTeacherSidebarLinks } from '../RBAC/rolePermissionsData'
import { filterAccountHeadSidebarForRole } from '../../Pages/AccountHead/financeDomain/financeRoleAccess'
import { isPathUnder } from '../../utils/pathPrefix'

/** The menu the signed-in user sees for the portal they are in (shared by the sidebar and global search). */
export const resolveSidebarLinks = (pathname, authRole) => {
    if (pathname.startsWith('/super-admin')) return superAdminSidebarLinks
    if (pathname.startsWith('/parent')) return parentSidebarLinks
    if (pathname.startsWith('/student')) return studentSidebarLinks
    if (pathname.startsWith('/coordinator')) return getFilteredCoordinatorSidebarLinks(coordinatorSidebarLinks)
    if (pathname.startsWith('/teacher')) return getFilteredTeacherSidebarLinks(teacherSidebarLinks)
    if (pathname.startsWith('/librarian')) return librarianSidebarLinks
    if (pathname.startsWith('/canteen-manager')) return canteenManagerSidebarLinks
    if (pathname.startsWith('/it-support-manager')) return itSupportManagerSidebarLinks
    if (pathname.startsWith('/stationery-store-manager')) return stationeryStoreManagerSidebarLinks
    if (pathname.startsWith('/housekeeping-manager')) return housekeepingManagerSidebarLinks
    if (pathname.startsWith('/maintenance-manager')) return maintenanceManagerSidebarLinks
    if (pathname.startsWith('/transport-manager')) return transportManagerSidebarLinks
    if (pathname.startsWith('/process-auditor')) return processAuditorSidebarLinks
    if (pathname.startsWith('/quality-auditor')) return qualityAuditorSidebarLinks
    if (pathname.startsWith('/hr')) return hrSidebarLinks
    if (pathname.startsWith('/file-room')) return fileRoomSidebarLinks
    if (pathname.startsWith('/cctv-room')) return cctvRoomSidebarLinks
    if (pathname.startsWith('/account-head')) return filterAccountHeadSidebarForRole(accountHeadSidebarLinks, authRole)
    if (pathname.startsWith('/driver')) return driverSidebarLinks
    if (pathname.startsWith('/joint-director-audit')) return jointDirectorAuditSidebarLinks
    if (pathname.startsWith('/joint-director-assistant')) return jointDirectorAssistantSidebarLinks
    if (pathname.startsWith('/joint-director')) return jointDirectorSidebarLinks
    if (pathname.startsWith('/gatekeeper-manager')) return gateKeeperManagerSidebarLinks
    if (pathname.startsWith('/gate-keeper')) return gateKeeperSidebarLinks
    if (pathname.startsWith('/director')) return directorSidebarLinks
    if (pathname.startsWith('/principal')) return principalSidebarLinks
    if (pathname.startsWith('/front-office')) return prmSidebarLinks
    // Segment match — must not treat `/process-auditor` as PRO.
    if (isPathUnder(pathname, '/pro')) return proSidebarLinks
    return getFilteredAdminSidebarLinks()
}

export { flattenSidebarLinks } from '../CommonHeader/Components/globalSearchIndex'
