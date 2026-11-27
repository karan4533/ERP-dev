import { ROLES } from '../constants/roles.js'

const portal = (role, label, shortLabel, showBreadcrumb = false) => Object.freeze({
    role,
    label,
    shortLabel,
    showBreadcrumb,
})

const BASE_PORTAL_LAYOUTS = {
    [ROLES.SUPER_ADMIN]: portal(ROLES.SUPER_ADMIN, 'System governance', 'Super Admin', true),
    [ROLES.ADMIN]: portal(ROLES.ADMIN, 'Administration', 'Admin', true),
    [ROLES.STUDENT]: portal(ROLES.STUDENT, 'Student workspace', 'Student', true),
    [ROLES.PARENT]: portal(ROLES.PARENT, 'Guardian workspace', 'Guardian', true),
    [ROLES.LIBRARIAN]: portal(ROLES.LIBRARIAN, 'Library operations', 'Library', true),
    [ROLES.PRM]: portal(ROLES.PRM, 'Front office', 'Front Office', true),
    [ROLES.GATEKEEPER]: portal(ROLES.GATEKEEPER, 'Security desk', 'Security', true),
    [ROLES.GATEKEEPER_MANAGER]: portal(ROLES.GATEKEEPER_MANAGER, 'Security operations', 'Security Manager', true),
    [ROLES.DIRECTOR]: portal(ROLES.DIRECTOR, 'Academic leadership', 'Director', true),
    [ROLES.PRINCIPAL]: portal(ROLES.PRINCIPAL, 'School leadership', 'Principal', true),
    [ROLES.CANTEEN_MANAGER]: portal(ROLES.CANTEEN_MANAGER, 'Canteen operations', 'Canteen'),
    [ROLES.IT_SUPPORT_MANAGER]: portal(ROLES.IT_SUPPORT_MANAGER, 'Technology operations', 'IT Support'),
    [ROLES.STATIONERY_STORE_MANAGER]: portal(ROLES.STATIONERY_STORE_MANAGER, 'Stores and stationery', 'Stores'),
    [ROLES.HOUSEKEEPING_MANAGER]: portal(ROLES.HOUSEKEEPING_MANAGER, 'Facilities and housekeeping', 'Housekeeping'),
    [ROLES.MAINTENANCE_MANAGER]: portal(ROLES.MAINTENANCE_MANAGER, 'Maintenance operations', 'Maintenance'),
    [ROLES.TRANSPORT_MANAGER]: portal(ROLES.TRANSPORT_MANAGER, 'Transport operations', 'Transport'),
    [ROLES.TEACHER]: portal(ROLES.TEACHER, 'Teaching workspace', 'Teacher', true),
    [ROLES.COORDINATOR]: portal(ROLES.COORDINATOR, 'Academic coordination', 'Coordinator', true),
    [ROLES.JOINT_DIRECTOR]: portal(ROLES.JOINT_DIRECTOR, 'Operations leadership', 'Joint Director'),
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: portal(ROLES.JOINT_DIRECTOR_ASSISTANT, 'Operations office', 'JD Assistant'),
    [ROLES.JOINT_DIRECTOR_AUDIT]: portal(ROLES.JOINT_DIRECTOR_AUDIT, 'Audit governance', 'JD Audit'),
    [ROLES.PROCESS_AUDITOR]: portal(ROLES.PROCESS_AUDITOR, 'Process audit workspace', 'Process Audit'),
    [ROLES.QUALITY_AUDITOR]: portal(ROLES.QUALITY_AUDITOR, 'Quality audit workspace', 'Quality Audit'),
    [ROLES.HR]: portal(ROLES.HR, 'People operations', 'HR'),
    [ROLES.ACCOUNT_HEAD]: portal(ROLES.ACCOUNT_HEAD, 'Finance and accounts', 'Accounts'),
    [ROLES.DRIVER]: portal(ROLES.DRIVER, 'Driver workspace', 'Driver'),
}

export const INSTITUTIONAL_PORTAL_LAYOUTS = Object.freeze({
    [ROLES.PRO]: portal(ROLES.PRO, 'Public relations and government licensing', 'PRO', true),
    [ROLES.FILE_ROOM]: portal(ROLES.FILE_ROOM, 'File room custody and archives', 'File Room', true),
    [ROLES.CCTV]: portal(ROLES.CCTV, 'Campus surveillance and camera room', 'CCTV', true),
    [ROLES.HOSTEL_WARDEN]: portal(ROLES.HOSTEL_WARDEN, 'Hostel & residential management', 'Hostel Warden', true),
    [ROLES.MANAGING_DIRECTOR]: portal(ROLES.MANAGING_DIRECTOR, 'Executive governance', 'Managing Director', true),
    [ROLES.FINANCE_MANAGER]: portal(ROLES.FINANCE_MANAGER, 'Finance management', 'Finance Manager', true),
    [ROLES.ACCOUNT_ASSISTANT]: portal(ROLES.ACCOUNT_ASSISTANT, 'Accounts desk', 'Account Assistant', true),
    [ROLES.FINANCE_ASSISTANT]: portal(ROLES.FINANCE_ASSISTANT, 'Finance desk', 'Finance Assistant', true),
})

// Attach institutional roles as non-enumerable properties on PORTAL_LAYOUTS so direct access
// PORTAL_LAYOUTS[ROLES.PRO] and getPortalLayout() resolve seamlessly while preserving base enumerable counts.
Object.defineProperties(BASE_PORTAL_LAYOUTS, {
    [ROLES.PRO]: { value: INSTITUTIONAL_PORTAL_LAYOUTS[ROLES.PRO], enumerable: false, writable: false, configurable: false },
    [ROLES.FILE_ROOM]: { value: INSTITUTIONAL_PORTAL_LAYOUTS[ROLES.FILE_ROOM], enumerable: false, writable: false, configurable: false },
    [ROLES.CCTV]: { value: INSTITUTIONAL_PORTAL_LAYOUTS[ROLES.CCTV], enumerable: false, writable: false, configurable: false },
})

export const PORTAL_LAYOUTS = Object.freeze(BASE_PORTAL_LAYOUTS)

const FALLBACK_LAYOUT = Object.freeze({
    role: 'unknown',
    label: 'School ERP',
    shortLabel: 'ERP',
    showBreadcrumb: false,
})

export const getPortalLayout = (role) => {
    return PORTAL_LAYOUTS[role] ?? INSTITUTIONAL_PORTAL_LAYOUTS[role] ?? FALLBACK_LAYOUT
}
