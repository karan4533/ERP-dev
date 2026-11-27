import {
    Ticket,
    ShoppingCart,
    Archive,
    BarChart3,
    Sparkles,
    ClipboardList,
    CalendarCheck,
    Rss,
    MessageCircle,
    CalendarDays,
    ShieldAlert,
    ShieldCheck,
    FileText,
} from 'lucide-react'
import { ROLES } from '../../constants/roles.js'
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
} from '../CommonSidebar/Components/sidebarLinks.js'
import {
    getFilteredCoordinatorSidebarLinks,
    getFilteredTeacherSidebarLinks,
} from '../RBAC/rolePermissionsData.js'
import { getFilteredAdminSidebarLinks } from '../../Pages/SuperAdmin/UserCreation/adminUsersData.js'
import {
    findNavigationSource,
    getNavigationLabel,
    normalizeNavigationItems,
} from './navigationHelpers.js'

/**
 * Normalizes role string to canonical key matching ROLES constants.
 */
export const normalizeRoleKey = (role) => {
    if (!role) return null
    const clean = String(role).toLowerCase().replace(/[-_\s]/g, '')
    if (clean === 'prm' || clean === 'frontoffice') return ROLES.PRM
    if (clean === 'admin' || clean === 'administrator') return ROLES.ADMIN
    if (clean === 'superadmin') return ROLES.SUPER_ADMIN
    if (clean === 'teacher') return ROLES.TEACHER
    if (clean === 'coordinator') return ROLES.COORDINATOR
    if (clean === 'principal') return ROLES.PRINCIPAL
    if (clean === 'director') return ROLES.DIRECTOR
    if (clean === 'managingdirector' || clean === 'md') return ROLES.MANAGING_DIRECTOR
    if (clean === 'gatekeeper') return ROLES.GATEKEEPER
    if (clean === 'gatekeepermanager') return ROLES.GATEKEEPER_MANAGER
    if (clean === 'hr') return ROLES.HR
    if (clean === 'accounthead' || clean === 'accounts') return ROLES.ACCOUNT_HEAD
    if (clean === 'financemanager') return ROLES.FINANCE_MANAGER
    if (clean === 'accountassistant') return ROLES.ACCOUNT_ASSISTANT
    if (clean === 'financeassistant') return ROLES.FINANCE_ASSISTANT
    if (clean === 'hostelwarden') return ROLES.HOSTEL_WARDEN
    if (clean === 'librarian') return ROLES.LIBRARIAN
    if (clean === 'driver' || clean === 'vandriver') return ROLES.DRIVER
    if (clean === 'student') return ROLES.STUDENT
    if (clean === 'parent') return ROLES.PARENT
    if (clean === 'canteenmanager') return ROLES.CANTEEN_MANAGER
    if (clean === 'itsupportmanager' || clean === 'itsupport') return ROLES.IT_SUPPORT_MANAGER
    if (clean === 'stationerystoremanager' || clean === 'stores') return ROLES.STATIONERY_STORE_MANAGER
    if (clean === 'housekeepingmanager' || clean === 'housekeeping') return ROLES.HOUSEKEEPING_MANAGER
    if (clean === 'maintenancemanager' || clean === 'maintenance') return ROLES.MAINTENANCE_MANAGER
    if (clean === 'transportmanager' || clean === 'transport') return ROLES.TRANSPORT_MANAGER
    if (clean === 'jointdirector') return ROLES.JOINT_DIRECTOR
    if (clean === 'jointdirectorassistant') return ROLES.JOINT_DIRECTOR_ASSISTANT
    if (clean === 'jointdirectoraudit') return ROLES.JOINT_DIRECTOR_AUDIT
    if (clean === 'processauditor') return ROLES.PROCESS_AUDITOR
    if (clean === 'qualityauditor') return ROLES.QUALITY_AUDITOR
    if (clean === 'pro') return ROLES.PRO
    if (clean === 'fileroom' || clean === 'fileroomincharge') return ROLES.FILE_ROOM
    if (clean === 'cctv' || clean === 'cameraroom' || clean === 'cameraperson') return ROLES.CCTV
    return clean
}

/**
 * Canonical base path per role.
 */
export const ROLE_TO_BASE_PATH = Object.freeze({
    [ROLES.SUPER_ADMIN]: '/super-admin',
    [ROLES.ADMIN]: '/admin',
    [ROLES.PRM]: '/front-office',
    [ROLES.PRINCIPAL]: '/principal',
    [ROLES.DIRECTOR]: '/director',
    [ROLES.TEACHER]: '/teacher',
    [ROLES.COORDINATOR]: '/coordinator',
    [ROLES.GATEKEEPER]: '/gate-keeper',
    [ROLES.GATEKEEPER_MANAGER]: '/gatekeeper-manager',
    [ROLES.JOINT_DIRECTOR]: '/joint-director',
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: '/joint-director-assistant',
    [ROLES.JOINT_DIRECTOR_AUDIT]: '/joint-director-audit',
    [ROLES.HR]: '/hr',
    [ROLES.ACCOUNT_HEAD]: '/account-head',
    [ROLES.LIBRARIAN]: '/librarian',
    [ROLES.CANTEEN_MANAGER]: '/canteen-manager',
    [ROLES.IT_SUPPORT_MANAGER]: '/it-support-manager',
    [ROLES.STATIONERY_STORE_MANAGER]: '/stationery-store-manager',
    [ROLES.HOUSEKEEPING_MANAGER]: '/housekeeping-manager',
    [ROLES.MAINTENANCE_MANAGER]: '/maintenance-manager',
    [ROLES.TRANSPORT_MANAGER]: '/transport-manager',
    [ROLES.PROCESS_AUDITOR]: '/process-auditor',
    [ROLES.QUALITY_AUDITOR]: '/quality-auditor',
    [ROLES.DRIVER]: '/driver',
    [ROLES.PRO]: '/pro',
    [ROLES.FILE_ROOM]: '/file-room',
    [ROLES.CCTV]: '/cctv',
    [ROLES.HOSTEL_WARDEN]: '/hostel-warden',
    [ROLES.MANAGING_DIRECTOR]: '/director',
    [ROLES.FINANCE_MANAGER]: '/account-head',
    [ROLES.ACCOUNT_ASSISTANT]: '/account-head',
    [ROLES.FINANCE_ASSISTANT]: '/account-head',
})

/**
 * Path prefix mapping for detecting role context when explicit role is not passed.
 */
export const PATH_PREFIX_TO_ROLE = Object.freeze([
    { prefix: '/pro', role: ROLES.PRO },
    { prefix: '/file-room', role: ROLES.FILE_ROOM },
    { prefix: '/cctv', role: ROLES.CCTV },
    { prefix: '/super-admin', role: ROLES.SUPER_ADMIN },
    { prefix: '/parent', role: ROLES.PARENT },
    { prefix: '/student', role: ROLES.STUDENT },
    { prefix: '/coordinator', role: ROLES.COORDINATOR },
    { prefix: '/teacher', role: ROLES.TEACHER },
    { prefix: '/librarian', role: ROLES.LIBRARIAN },
    { prefix: '/canteen-manager', role: ROLES.CANTEEN_MANAGER },
    { prefix: '/it-support-manager', role: ROLES.IT_SUPPORT_MANAGER },
    { prefix: '/stationery-store-manager', role: ROLES.STATIONERY_STORE_MANAGER },
    { prefix: '/housekeeping-manager', role: ROLES.HOUSEKEEPING_MANAGER },
    { prefix: '/maintenance-manager', role: ROLES.MAINTENANCE_MANAGER },
    { prefix: '/transport-manager', role: ROLES.TRANSPORT_MANAGER },
    { prefix: '/process-auditor', role: ROLES.PROCESS_AUDITOR },
    { prefix: '/quality-auditor', role: ROLES.QUALITY_AUDITOR },
    { prefix: '/account-head', role: ROLES.ACCOUNT_HEAD },
    { prefix: '/joint-director-audit', role: ROLES.JOINT_DIRECTOR_AUDIT },
    { prefix: '/joint-director-assistant', role: ROLES.JOINT_DIRECTOR_ASSISTANT },
    { prefix: '/joint-director', role: ROLES.JOINT_DIRECTOR },
    { prefix: '/gatekeeper-manager', role: ROLES.GATEKEEPER_MANAGER },
    { prefix: '/gate-keeper', role: ROLES.GATEKEEPER },
    { prefix: '/director', role: ROLES.DIRECTOR },
    { prefix: '/principal', role: ROLES.PRINCIPAL },
    { prefix: '/front-office', role: ROLES.PRM },
    { prefix: '/driver', role: ROLES.DRIVER },
    { prefix: '/hr', role: ROLES.HR },
    { prefix: '/admin', role: ROLES.ADMIN },
])

/**
 * Resolves role from a URL path prefix if available.
 */
export const resolveRoleFromPath = (pathname) => {
    if (!pathname) return null
    const path = String(pathname)
    const match = PATH_PREFIX_TO_ROLE.find((entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`))
    return match ? match.role : null
}

/**
 * Raw role provider mapping.
 */
const ROLE_NAVIGATION_PROVIDERS = {
    [ROLES.SUPER_ADMIN]: () => superAdminSidebarLinks,
    [ROLES.ADMIN]: () => getFilteredAdminSidebarLinks(),
    [ROLES.PRM]: () => prmSidebarLinks,
    [ROLES.PRINCIPAL]: () => principalSidebarLinks,
    [ROLES.DIRECTOR]: () => directorSidebarLinks,
    [ROLES.TEACHER]: () => getFilteredTeacherSidebarLinks(teacherSidebarLinks),
    [ROLES.COORDINATOR]: () => getFilteredCoordinatorSidebarLinks(coordinatorSidebarLinks),
    [ROLES.GATEKEEPER]: () => gateKeeperSidebarLinks,
    [ROLES.GATEKEEPER_MANAGER]: () => gateKeeperManagerSidebarLinks,
    [ROLES.JOINT_DIRECTOR]: () => jointDirectorSidebarLinks,
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: () => jointDirectorAssistantSidebarLinks,
    [ROLES.JOINT_DIRECTOR_AUDIT]: () => jointDirectorAuditSidebarLinks,
    [ROLES.HR]: () => hrSidebarLinks,
    [ROLES.ACCOUNT_HEAD]: () => accountHeadSidebarLinks,
    [ROLES.LIBRARIAN]: () => librarianSidebarLinks,
    [ROLES.STUDENT]: () => studentSidebarLinks,
    [ROLES.PARENT]: () => parentSidebarLinks,
    [ROLES.CANTEEN_MANAGER]: () => canteenManagerSidebarLinks,
    [ROLES.IT_SUPPORT_MANAGER]: () => itSupportManagerSidebarLinks,
    [ROLES.STATIONERY_STORE_MANAGER]: () => stationeryStoreManagerSidebarLinks,
    [ROLES.HOUSEKEEPING_MANAGER]: () => housekeepingManagerSidebarLinks,
    [ROLES.MAINTENANCE_MANAGER]: () => maintenanceManagerSidebarLinks,
    [ROLES.TRANSPORT_MANAGER]: () => transportManagerSidebarLinks,
    [ROLES.PROCESS_AUDITOR]: () => processAuditorSidebarLinks,
    [ROLES.QUALITY_AUDITOR]: () => qualityAuditorSidebarLinks,
    [ROLES.DRIVER]: () => driverSidebarLinks,
    [ROLES.PRO]: () => proSidebarLinks,
    [ROLES.FILE_ROOM]: () => fileRoomSidebarLinks,
    [ROLES.CCTV]: () => cctvSidebarLinks,
    [ROLES.MANAGING_DIRECTOR]: () => directorSidebarLinks,
    [ROLES.FINANCE_MANAGER]: () => accountHeadSidebarLinks,
    [ROLES.ACCOUNT_ASSISTANT]: () => accountHeadSidebarLinks,
    [ROLES.FINANCE_ASSISTANT]: () => accountHeadSidebarLinks,
    [ROLES.HOSTEL_WARDEN]: () => [
        { id: 1, title: 'Hostel Management', to: '/hostel-warden/dashboard', icon: ShieldCheck, group: 'department', role: ROLES.HOSTEL_WARDEN },
    ],
}

/**
 * Ensures that every staff role has access to the essential enterprise operations
 * (Department Helpdesk, Stores & Procurement, Physical File Room, Activity Monitoring, Lost & Found)
 * and essential personal work operations (Task Management, Attendance & Leave, Announcement, Communication, Calendar, Escalation).
 */
export const ensureEnterpriseAndWorkModules = (items = [], role = null) => {
    const safeRole = normalizeRoleKey(role)
    if (!safeRole || safeRole === ROLES.STUDENT || safeRole === ROLES.PARENT || safeRole === ROLES.DRIVER) {
        return items
    }

    const basePath = ROLE_TO_BASE_PATH[safeRole] || `/${safeRole}`
    const result = [...items]

    const hasItem = (predicate) => result.some(predicate)

    // 1. Department Helpdesk
    const hasHelpdesk = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('helpdesk') || str.includes('department-ticketing')
    })
    if (!hasHelpdesk) {
        result.push({
            id: `${safeRole}-department-helpdesk`,
            title: 'Department Helpdesk',
            to: `${basePath}/department-ticketing`,
            icon: Ticket,
            group: 'department',
            role: safeRole,
        })
    }

    // 2. Stores & Procurement
    const hasStores = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('stores') || str.includes('procurement') || str.includes('requisition')
    })
    if (!hasStores) {
        result.push({
            id: `${safeRole}-stores-procurement`,
            title: 'Stores & Procurement',
            to: `${basePath}/stores-procurement`,
            icon: ShoppingCart,
            group: 'department',
            role: safeRole,
        })
    }

    // 3. Physical File Room
    const hasFileRoom = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('file-room') || str.includes('file room')
    })
    if (!hasFileRoom) {
        result.push({
            id: `${safeRole}-file-room`,
            title: 'Physical File Room',
            to: `${basePath}/file-room`,
            icon: Archive,
            group: 'department',
            role: safeRole,
        })
    }

    // 4. Activity Monitoring
    const hasActivity = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('activity-monitoring') || str.includes('activity monitoring')
    })
    if (!hasActivity) {
        result.push({
            id: `${safeRole}-activity-monitoring`,
            title: 'Activity Monitoring',
            to: `${basePath}/activity-monitoring`,
            icon: BarChart3,
            group: 'department',
            role: safeRole,
        })
    }

    // 5. Lost & Found
    const hasLostFound = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('lost') && str.includes('found')
    })
    if (!hasLostFound) {
        result.push({
            id: `${safeRole}-lost-and-found`,
            title: 'Lost & Found',
            to: `${basePath}/lost-and-found`,
            icon: Sparkles,
            group: 'department',
            role: safeRole,
        })
    }

    // --- Personal Work Tools ---
    // 6. Task Management
    const hasTasks = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('task')
    })
    if (!hasTasks) {
        result.push({
            id: `${safeRole}-task-management`,
            title: 'Task Management',
            to: `${basePath}/task-management`,
            icon: ClipboardList,
            group: 'work',
            role: safeRole,
        })
    }

    // 7. Attendance & Leave Management
    const hasAttendance = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('attendance') || str.includes('leave')
    })
    if (!hasAttendance) {
        result.push({
            id: `${safeRole}-attendance-and-leave`,
            title: 'Attendance & Leave Management',
            to: `${basePath}/attendance-and-leave`,
            icon: CalendarCheck,
            group: 'work',
            role: safeRole,
        })
    }

    // 8. Announcement
    const hasAnnouncement = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('announcement') || str.includes('broadcast')
    })
    if (!hasAnnouncement) {
        result.push({
            id: `${safeRole}-announcement`,
            title: 'Announcement',
            to: `${basePath}/announcement`,
            icon: Rss,
            group: 'work',
            role: safeRole,
        })
    }

    // 9. Communication
    const hasCommunication = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('communication')
    })
    if (!hasCommunication) {
        result.push({
            id: `${safeRole}-communication`,
            title: 'Communication',
            to: `${basePath}/communication/inbox`,
            icon: MessageCircle,
            group: 'work',
            role: safeRole,
        })
    }

    // 10. Calendar
    const hasCalendar = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('calendar')
    })
    if (!hasCalendar) {
        result.push({
            id: `${safeRole}-calendar`,
            title: 'Calendar',
            to: `${basePath}/academic-calendar`,
            icon: CalendarDays,
            group: 'work',
            role: safeRole,
        })
    }

    // 11. Report Issue / Escalation (formerly Escalation Management)
    const hasEscalation = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('escalation') || str.includes('report issue')
    })
    if (!hasEscalation) {
        result.push({
            id: `${safeRole}-escalation-management`,
            title: 'Report Issue / Escalation',
            to: `${basePath}/escalation-management`,
            icon: ShieldAlert,
            group: 'work',
            role: safeRole,
        })
    }

    // 12. Audit Observations (Received & Responded for Auditee Roles)
    const hasAuditObservations = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('audit-observation') || str.includes('audit observation') || str.includes('received observation') || str.includes('audit-compliance') || str.includes('findings & compliance') || str.includes('findings-compliance')
    })
    if (!hasAuditObservations && safeRole !== ROLES.PROCESS_AUDITOR && safeRole !== ROLES.QUALITY_AUDITOR && safeRole !== ROLES.JOINT_DIRECTOR_AUDIT) {
        result.push({
            id: `${safeRole}-audit-observations`,
            title: 'Audit Observations',
            to: `${basePath}/audit-observations`,
            icon: ShieldCheck,
            group: 'work',
            role: safeRole,
        })
    }

    // 13. Staff Relieving & HR NOC Clearance
    const hasRelieving = hasItem((item) => {
        const str = `${item.title || ''} ${item.to || ''}`.toLowerCase()
        return str.includes('relieving') || str.includes('hr-noc') || str.includes('hr noc') || str.includes('exit formalities')
    })
    if (!hasRelieving && safeRole !== ROLES.STUDENT && safeRole !== ROLES.PARENT) {
        result.push({
            id: `${safeRole}-relieving-request`,
            title: 'Staff Relieving & NOC',
            to: `${basePath}/relieving-request`,
            icon: FileText,
            group: 'work',
            role: safeRole,
        })
    }

    return result
}

/**
 * Assigns unique, collision-proof keys to each navigation module for a specific role.
 * Ensures consistent group assignment (work, department, configuration).
 */
export const annotateAndTagModules = (items = [], role = 'prm') => {
    const safeRole = normalizeRoleKey(role) || 'prm'

    return items.map((item, index) => {
        // Build stable collision-free ID for preferences persistence
        const existingId = String(item.id ?? '')
        let uniqueId = existingId

        // If ID is numeric or plain, scope it with role key to avoid cross-role collision
        if (!existingId || /^\d+$/.test(existingId)) {
            const slug = String(item.title || item.to || index).toLowerCase().replace(/[^a-z0-9]/g, '-')
            uniqueId = `${safeRole}-${slug}`
        }

        // Determine group: My Work, Department, Configuration
        const titleLower = String(item.title || '').toLowerCase()
        const toLower = String(item.to || '').toLowerCase()
        let group = item.group

        if (!group) {
            if (/rbac|user creation|roles|system master|setting|configuration/.test(`${titleLower} ${toLower}`)) {
                group = 'configuration'
            } else if (/task|attendance|leave|announcement|communication|calendar|escalation|audit-observation|audit observation|received observation|audit-compliance|my duty|notification|meeting/.test(`${titleLower} ${toLower}`)) {
                group = 'work'
            } else {
                group = 'department'
            }
        }

        return {
            ...item,
            id: uniqueId,
            group,
            role: safeRole,
        }
    })
}

/**
 * Primary authoritative navigation retriever.
 * Resolves permitted menu items for a role, with proper RBAC filtering,
 * consistent departmental grouping, and stable module IDs.
 */
export const getAuthorizedNavigation = (role = null, pathname = '') => {
    // 0. Support both (role, pathname) and ({ role, pathname }) call styles
    let resolvedRole = role
    let resolvedPathname = pathname
    if (role && typeof role === 'object' && !Array.isArray(role)) {
        resolvedRole = role.role || null
        resolvedPathname = role.pathname || ''
    }

    // 1. Resolve role: explicit prop -> path prefix -> default PRM/Front Office
    const normalizedRole = normalizeRoleKey(resolvedRole)
    const pathRole = resolveRoleFromPath(resolvedPathname)
    const effectiveRole = normalizedRole || pathRole || ROLES.PRM

    // 2. Fetch raw links for role
    const provider = ROLE_NAVIGATION_PROVIDERS[effectiveRole] || ROLE_NAVIGATION_PROVIDERS[ROLES.PRM]
    const rawItems = provider()

    // 3. Ensure enterprise operational and personal work modules are present for all staff roles
    const completeItems = ensureEnterpriseAndWorkModules(rawItems, effectiveRole)

    // 4. Normalize link paths & sublinks
    const normalized = normalizeNavigationItems(completeItems)

    // 5. Attach unique role-namespaced IDs and group metadata
    return annotateAndTagModules(normalized, effectiveRole)
}

/**
 * Backward-compatible helper for legacy consumers.
 */
export const getNavigationForPath = (pathname, role = null) => {
    return getAuthorizedNavigation(role, pathname)
}

/**
 * Retrieves the page label for current route using role-aware navigation.
 */
export const getNavigationLabelForPath = (pathname, role = null) => {
    const items = getAuthorizedNavigation(role, pathname)
    return getNavigationLabel(items, pathname)
}

/**
 * Central schema catalog for administrative reporting & documentation.
 */
export const MODULE_CATALOG = Object.freeze([
    // Front Office / PRM
    { id: 'prm-dashboard', name: 'Dashboard', label: 'Dashboard', route: '/front-office/dashboard', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-admission-enquiry', name: 'Admission Enquiry', label: 'Admission Enquiry', route: '/front-office/admission-enquiry', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-visitors', name: 'Visitors', label: 'Visitors', route: '/front-office/visitors', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-admission-list', name: 'Admission List', label: 'Admission List', route: '/front-office/admission-list', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-user-database', name: 'User Database', label: 'User Database', route: '#0', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-student-transfer', name: 'Student Transfer', label: 'Student Transfer', route: '/front-office/student-transfer', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-student-re-enrollment', name: 'Student Re-Enrollment', label: 'Student Re-Enrollment', route: '/front-office/student-re-enrollment', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-tc-request', name: 'TC Request', label: 'TC Request', route: '/front-office/tc-request', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-gate-pass', name: 'Gate Pass', label: 'Gate Pass', route: '#0', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-stores-procurement', name: 'Stores & Procurement', label: 'Stores & Procurement', route: '/front-office/stores-procurement', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-file-room', name: 'Physical File Room', label: 'Physical File Room', route: '/front-office/file-room', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-department-helpdesk', name: 'Department Helpdesk', label: 'Department Helpdesk', route: '/front-office/department-ticketing', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-activity-monitoring', name: 'Activity Monitoring', label: 'Activity Monitoring', route: '/front-office/activity-monitoring', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-lost-and-found', name: 'Lost & Found', label: 'Lost & Found', route: '/front-office/lost-and-found', department: 'Front Office', roles: [ROLES.PRM] },
    { id: 'prm-task-management', name: 'Task Management', label: 'Task Management', route: '/front-office/task-management', department: 'My Work', roles: [ROLES.PRM] },
    { id: 'prm-attendance-and-leave', name: 'Attendance & Leave Management', label: 'Attendance & Leave Management', route: '/front-office/attendance-and-leave', department: 'My Work', roles: [ROLES.PRM] },
    { id: 'prm-announcement', name: 'Announcement', label: 'Announcement', route: '/front-office/announcement', department: 'My Work', roles: [ROLES.PRM] },
    { id: 'prm-communication', name: 'Communication', label: 'Communication', route: '/front-office/communication/inbox', department: 'My Work', roles: [ROLES.PRM] },
    { id: 'prm-calendar', name: 'Calendar', label: 'Calendar', route: '/front-office/academic-calendar', department: 'My Work', roles: [ROLES.PRM] },
    { id: 'prm-escalation-management', name: 'Escalation Management', label: 'Escalation Management', route: '/front-office/escalation-management', department: 'My Work', roles: [ROLES.PRM] },
])
