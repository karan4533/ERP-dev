import { ROLES } from '../../constants/roles.js'

/**
 * Enterprise User Directory
 * Comprehensive Single Source of Truth for system identities, roles, departments, and hierarchy.
 */
export const ENTERPRISE_USER_DIRECTORY = [
    // Executive & Governance
    {
        id: 'EMP-SA-001',
        employeeId: 'EMP-SA-001',
        email: 'superadmin@school.com',
        username: 'superadmin',
        name: 'Dr. Rajeshwar Sen',
        role: ROLES.SUPER_ADMIN,
        roleLabel: 'Super Administrator',
        department: 'Governance & Board',
        designation: 'Chief Systems Trustee',
        reportingTo: 'Board of Governors',
        campus: 'Central Headquarters',
        category: 'Leadership & Executive',
        avatarColor: '#7C3AED',
        status: 'Active',
    },
    {
        id: 'EMP-DIR-001',
        employeeId: 'EMP-DIR-001',
        email: 'director@school.com',
        username: 'director',
        name: 'Dr. Arthur Pendelton',
        role: ROLES.DIRECTOR,
        roleLabel: 'Managing Director',
        department: 'Executive Board',
        designation: 'Managing Director & CEO',
        reportingTo: 'Board of Governors',
        campus: 'Central Headquarters',
        category: 'Leadership & Executive',
        avatarColor: '#1E3A8A',
        status: 'Active',
    },
    {
        id: 'EMP-PRI-001',
        employeeId: 'EMP-PRI-001',
        email: 'principal@school.com',
        username: 'principal',
        name: 'Dr. Meera Kapoor',
        role: ROLES.PRINCIPAL,
        roleLabel: 'Principal',
        department: 'School Leadership',
        designation: 'Senior Principal',
        reportingTo: 'Managing Director',
        campus: 'DPS North Campus',
        category: 'Leadership & Executive',
        avatarColor: '#B45309',
        status: 'Active',
    },
    {
        id: 'EMP-JD-001',
        employeeId: 'EMP-JD-001',
        email: 'jointdirector@school.com',
        username: 'jointdirector',
        name: 'Vikramaditya Singhania',
        role: ROLES.JOINT_DIRECTOR,
        roleLabel: 'Joint Director',
        department: 'Operations & Infrastructure',
        designation: 'Joint Director of Operations',
        reportingTo: 'Managing Director',
        campus: 'DPS North Campus',
        category: 'Leadership & Executive',
        avatarColor: '#0369A1',
        status: 'Active',
    },
    {
        id: 'EMP-JDA-001',
        employeeId: 'EMP-JDA-001',
        email: 'jointdirectorassistant@school.com',
        username: 'jointdirectorassistant',
        name: 'Ananya Sharma',
        role: ROLES.JOINT_DIRECTOR_ASSISTANT,
        roleLabel: 'Joint Director Assistant',
        department: 'Operations & Infrastructure',
        designation: 'Executive Assistant to JD',
        reportingTo: 'Joint Director',
        campus: 'DPS North Campus',
        category: 'Leadership & Executive',
        avatarColor: '#0284C7',
        status: 'Active',
    },

    // Audit & Quality Assurance
    {
        id: 'EMP-JDAUD-001',
        employeeId: 'EMP-JDAUD-001',
        email: 'jointdirectoraudit@school.com',
        username: 'jointdirectoraudit',
        name: 'Harish Chandra',
        role: ROLES.JOINT_DIRECTOR_AUDIT,
        roleLabel: 'Joint Director - Audit',
        department: 'Internal Audit & Inspection',
        designation: 'Director of Audit & Assurance',
        reportingTo: 'Managing Director',
        campus: 'Central Headquarters',
        category: 'Leadership & Executive',
        avatarColor: '#475569',
        status: 'Active',
    },
    {
        id: 'EMP-PA-001',
        employeeId: 'EMP-PA-001',
        email: 'processauditor@school.com',
        username: 'processauditor',
        name: 'Neha Kulkarni',
        role: ROLES.PROCESS_AUDITOR,
        roleLabel: 'Process Auditor',
        department: 'Compliance & Standard Operating Procedures',
        designation: 'Lead Process Compliance Auditor',
        reportingTo: 'Joint Director - Audit',
        campus: 'DPS North Campus',
        category: 'Leadership & Executive',
        avatarColor: '#059669',
        status: 'Active',
    },
    {
        id: 'EMP-QA-001',
        employeeId: 'EMP-QA-001',
        email: 'qualityauditor@school.com',
        username: 'qualityauditor',
        name: 'Suresh Verma',
        role: ROLES.QUALITY_AUDITOR,
        roleLabel: 'Quality Auditor',
        department: 'Academic Quality Assurance',
        designation: 'Senior Quality Assurance Inspector',
        reportingTo: 'Joint Director - Audit',
        campus: 'DPS North Campus',
        category: 'Leadership & Executive',
        avatarColor: '#D97706',
        status: 'Active',
    },

    // Administration & Human Resources
    {
        id: 'EMP-ADM-001',
        employeeId: 'EMP-ADM-001',
        email: 'admin@school.com',
        username: 'admin',
        name: 'S. Ramanathan',
        role: ROLES.ADMIN,
        roleLabel: 'Administrator',
        department: 'Central Administration',
        designation: 'Chief Administrative Officer',
        reportingTo: 'Principal',
        campus: 'DPS North Campus',
        category: 'Administration & HR',
        avatarColor: '#2563EB',
        status: 'Active',
    },
    {
        id: 'EMP-HR-001',
        employeeId: 'EMP-HR-001',
        email: 'hr@school.com',
        username: 'hr',
        name: 'Sunita Deshmukh',
        role: ROLES.HR,
        roleLabel: 'HR Head',
        department: 'Human Resources & Talent Management',
        designation: 'Head of Human Resources',
        reportingTo: 'Managing Director',
        campus: 'Central Headquarters',
        category: 'Administration & HR',
        avatarColor: '#9333EA',
        status: 'Active',
    },
    {
        id: 'EMP-ACC-001',
        employeeId: 'EMP-ACC-001',
        email: 'accounthead@school.com',
        username: 'accounthead',
        name: 'K. Venkataraman',
        role: ROLES.ACCOUNT_HEAD,
        roleLabel: 'Account Head',
        department: 'Finance, Accounts & Billing',
        designation: 'Chief Financial Officer',
        reportingTo: 'Managing Director',
        campus: 'Central Headquarters',
        category: 'Administration & HR',
        avatarColor: '#059669',
        status: 'Active',
    },
    {
        id: 'EMP-PRM-001',
        employeeId: 'EMP-PRM-001',
        email: 'prm@school.com',
        username: 'prm',
        name: 'Kavita Reddy',
        role: ROLES.PRM,
        roleLabel: 'Front Office & PRM',
        department: 'Public Relations & Reception',
        designation: 'Public Relations Manager',
        reportingTo: 'Administrator',
        campus: 'DPS North Campus',
        category: 'Administration & HR',
        avatarColor: '#0891B2',
        status: 'Active',
    },

    // Academic Leadership & Teaching
    {
        id: 'EMP-CRD-001',
        employeeId: 'EMP-CRD-001',
        email: 'coordinator@school.com',
        username: 'coordinator',
        name: 'Priya Nair',
        role: ROLES.COORDINATOR,
        roleLabel: 'Academic Coordinator',
        department: 'Academics & Curriculum',
        designation: 'Senior Secondary Coordinator',
        reportingTo: 'Principal',
        campus: 'DPS North Campus',
        category: 'Academic Staff',
        avatarColor: '#0D9488',
        status: 'Active',
    },
    {
        id: 'EMP-TCH-014',
        employeeId: 'EMP-TCH-014',
        email: 'teacher@school.com',
        username: 'teacher',
        name: 'Priya Menon',
        role: ROLES.TEACHER,
        roleLabel: 'Teacher',
        department: 'Department of Mathematics',
        designation: 'Senior PGT Mathematics & Class Teacher 10-A',
        reportingTo: 'Academic Coordinator',
        campus: 'DPS North Campus',
        category: 'Academic Staff',
        avatarColor: '#DB2777',
        status: 'Active',
    },
    {
        id: 'EMP-LIB-001',
        employeeId: 'EMP-LIB-001',
        email: 'librarian@school.com',
        username: 'librarian',
        name: 'Sunita Krishnan',
        role: ROLES.LIBRARIAN,
        roleLabel: 'Chief Librarian',
        department: 'Learning Resource Center',
        designation: 'Head Librarian',
        reportingTo: 'Principal',
        campus: 'DPS North Campus',
        category: 'Academic Staff',
        avatarColor: '#7C3AED',
        status: 'Active',
    },

    // Operations, Facilities & Logistics
    {
        id: 'EMP-STR-001',
        employeeId: 'EMP-STR-001',
        email: 'stationerystoremanager@school.com',
        username: 'stationerystoremanager',
        name: 'Gurpreet Singh',
        role: ROLES.STATIONERY_STORE_MANAGER,
        roleLabel: 'Stationery & Stores Manager',
        department: 'Central Stores & Procurement',
        designation: 'Stores & Inventory Manager',
        reportingTo: 'Joint Director',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#EA580C',
        status: 'Active',
    },
    {
        id: 'EMP-IT-001',
        employeeId: 'EMP-IT-001',
        email: 'itsupportmanager@school.com',
        username: 'itsupportmanager',
        name: 'Rakesh Nair',
        role: ROLES.IT_SUPPORT_MANAGER,
        roleLabel: 'IT Support Manager',
        department: 'Information Technology & Systems',
        designation: 'Senior IT Infrastructure Manager',
        reportingTo: 'Joint Director',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#2563EB',
        status: 'Active',
    },
    {
        id: 'EMP-TRN-001',
        employeeId: 'EMP-TRN-001',
        email: 'transportmanager@school.com',
        username: 'transportmanager',
        name: 'Dharmesh Patel',
        role: ROLES.TRANSPORT_MANAGER,
        roleLabel: 'Transport Manager',
        department: 'Fleet & Student Logistics',
        designation: 'Head of Transport & Fleet Safety',
        reportingTo: 'Joint Director',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#059669',
        status: 'Active',
    },
    {
        id: 'EMP-DRV-001',
        employeeId: 'EMP-DRV-001',
        email: 'driver@school.com',
        username: 'driver',
        name: 'Jaswant Singh',
        role: ROLES.DRIVER,
        roleLabel: 'School Bus Driver',
        department: 'Fleet & Student Logistics',
        designation: 'Senior Route Master (Route #04)',
        reportingTo: 'Transport Manager',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#65A30D',
        status: 'Active',
    },
    {
        id: 'EMP-HK-001',
        employeeId: 'EMP-HK-001',
        email: 'housekeepingmanager@school.com',
        username: 'housekeepingmanager',
        name: 'Savitri Devi',
        role: ROLES.HOUSEKEEPING_MANAGER,
        roleLabel: 'Housekeeping Manager',
        department: 'Facilities & Campus Sanitation',
        designation: 'Housekeeping & Hygiene Supervisor',
        reportingTo: 'Joint Director',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#ca8a04',
        status: 'Active',
    },
    {
        id: 'EMP-MNT-001',
        employeeId: 'EMP-MNT-001',
        email: 'maintenancemanager@school.com',
        username: 'maintenancemanager',
        name: 'Gopalakrishnan R',
        role: ROLES.MAINTENANCE_MANAGER,
        roleLabel: 'Maintenance Manager',
        department: 'Campus Infrastructure & Maintenance',
        designation: 'Head of Maintenance & Engineering',
        reportingTo: 'Joint Director',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#0284c7',
        status: 'Active',
    },
    {
        id: 'EMP-CNT-001',
        employeeId: 'EMP-CNT-001',
        email: 'canteenmanager@school.com',
        username: 'canteenmanager',
        name: 'Mohan Lal Verma',
        role: ROLES.CANTEEN_MANAGER,
        roleLabel: 'Café & Canteen Manager',
        department: 'Food Services & Dining',
        designation: 'Campus Dining & Nutrition Lead',
        reportingTo: 'Joint Director',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#E11D48',
        status: 'Active',
    },
    {
        id: 'EMP-GKM-001',
        employeeId: 'EMP-GKM-001',
        email: 'gatekeepermanager@school.com',
        username: 'gatekeepermanager',
        name: 'Balwinder Singh',
        role: ROLES.GATEKEEPER_MANAGER,
        roleLabel: 'Gate Keeper Manager',
        department: 'Campus Security & Access Control',
        designation: 'Chief Security Marshal',
        reportingTo: 'Joint Director',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#15803D',
        status: 'Active',
    },
    {
        id: 'EMP-GK-001',
        employeeId: 'EMP-GK-001',
        email: 'gatekeeper@school.com',
        username: 'gatekeeper',
        name: 'Ram Singh',
        role: ROLES.GATEKEEPER,
        roleLabel: 'Gate Keeper',
        department: 'Campus Security & Access Control',
        designation: 'Senior Security Guard (Main Gate)',
        reportingTo: 'Gate Keeper Manager',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#166534',
        status: 'Active',
    },

    // Institutional Liaison, Records Custody & Campus Surveillance
    {
        id: 'EMP-PRO-001',
        employeeId: 'EMP-PRO-001',
        email: 'pro@school.edu',
        username: 'pro',
        name: 'Public Relations Officer',
        role: ROLES.PRO,
        roleLabel: 'Public Relations Officer',
        department: 'Public Relations & Government Liaison',
        designation: 'Public Relations Officer',
        reportingTo: 'Managing Director',
        campus: 'Central Headquarters',
        category: 'Administration & HR',
        avatarColor: '#0891B2',
        status: 'Active',
        aliases: ['pro@school.com', 'pro'],
    },
    {
        id: 'EMP-FLR-001',
        employeeId: 'EMP-FLR-001',
        email: 'fileroom@school.edu',
        username: 'fileroom',
        name: 'File Room Custodian',
        role: ROLES.FILE_ROOM,
        roleLabel: 'File Room Custodian',
        department: 'Central Records & Archival Custody',
        designation: 'File Room Custodian',
        reportingTo: 'Joint Director',
        campus: 'Central Headquarters',
        category: 'Operations & Logistics',
        avatarColor: '#475569',
        status: 'Active',
        aliases: ['fileroom@school.com', 'EMP-FIL-001', 'file-room', 'fileroom'],
    },
    {
        id: 'EMP-CCTV-001',
        employeeId: 'EMP-CCTV-001',
        email: 'cctv@school.edu',
        username: 'cctv',
        name: 'CCTV & Surveillance In-charge',
        role: ROLES.CCTV,
        roleLabel: 'CCTV & Surveillance In-charge',
        department: 'Campus Surveillance & Camera Operations',
        designation: 'CCTV & Surveillance In-charge',
        reportingTo: 'Joint Director',
        campus: 'DPS North Campus',
        category: 'Operations & Logistics',
        avatarColor: '#15803D',
        status: 'Active',
        aliases: ['cctv@school.com', 'cctv', 'cameraperson'],
    },

    // Community: Student & Parent
    {
        id: 'STU-2024-0142',
        employeeId: 'STU-2024-0142',
        email: 'student@school.com',
        username: 'student',
        name: 'Aarav Sharma',
        role: ROLES.STUDENT,
        roleLabel: 'Student',
        department: 'Class 10-A (Secondary)',
        designation: 'Student Council President',
        reportingTo: 'Class Teacher 10-A',
        campus: 'DPS North Campus',
        category: 'Students & Parents',
        avatarColor: '#2563EB',
        status: 'Active',
    },
    {
        id: 'PAR-2026-001',
        employeeId: 'PAR-2026-001',
        email: 'parent@school.com',
        username: 'parent',
        name: 'Raj Kumar',
        role: ROLES.PARENT,
        roleLabel: 'Parent / Guardian',
        department: 'Parent-Teacher Association',
        designation: 'Parent Representative (Aarav & Diya)',
        reportingTo: 'Principal',
        campus: 'DPS North Campus',
        category: 'Students & Parents',
        avatarColor: '#4F46E5',
        status: 'Active',
    },
]

/**
 * Resolves a user account by email, employee ID, or username across all enterprise directories.
 */
export const findUserByIdentifier = (rawIdentifier) => {
    if (!rawIdentifier || typeof rawIdentifier !== 'string') return null
    const query = rawIdentifier.trim().toLowerCase()

    // 1. Check Primary Enterprise User Directory (matches email, employeeId, id, username, or aliases)
    const seedUser = ENTERPRISE_USER_DIRECTORY.find((user) =>
        user.email.toLowerCase() === query ||
        user.id.toLowerCase() === query ||
        user.employeeId.toLowerCase() === query ||
        user.username.toLowerCase() === query ||
        (Array.isArray(user.aliases) && user.aliases.some((a) => a.toLowerCase() === query))
    )
    if (seedUser) return seedUser

    // 2. Check dynamically created Admin Users (browser session)
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            const raw = window.sessionStorage.getItem('schoolerp-super-admin-admin-users')
            if (raw) {
                const admins = JSON.parse(raw)
                const foundAdmin = admins.find((a) =>
                    a.email?.toLowerCase() === query ||
                    a.id?.toLowerCase() === query ||
                    a.employeeId?.toLowerCase() === query ||
                    a.username?.toLowerCase() === query
                )
                if (foundAdmin) {
                    return {
                        id: foundAdmin.id,
                        employeeId: foundAdmin.employeeId || foundAdmin.id,
                        email: foundAdmin.email,
                        username: foundAdmin.username || foundAdmin.email.split('@')[0],
                        name: foundAdmin.name,
                        role: ROLES.ADMIN,
                        roleLabel: 'Administrator',
                        department: foundAdmin.department || 'Administration',
                        designation: 'Administrator',
                        reportingTo: 'Principal',
                        campus: 'DPS North Campus',
                        category: 'Administration & HR',
                        avatarColor: '#2563EB',
                        status: foundAdmin.status || 'Active',
                    }
                }
            }
        }
    } catch {
        /* ignore */
    }

    // 3. Check dynamically created Staff / Teachers (browser session)
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            const raw = window.sessionStorage.getItem('schoolerp-created-users')
            if (raw) {
                const created = JSON.parse(raw)
                const foundUser = created.find((u) =>
                    u.email?.toLowerCase() === query ||
                    u.id?.toLowerCase() === query ||
                    u.username?.toLowerCase() === query
                )
                if (foundUser) {
                    return {
                        id: foundUser.id,
                        employeeId: foundUser.id,
                        email: foundUser.email,
                        username: foundUser.username || foundUser.email.split('@')[0],
                        name: foundUser.name,
                        role: foundUser.role,
                        roleLabel: foundUser.role,
                        department: foundUser.department || 'Academics',
                        designation: foundUser.designation || 'Staff',
                        reportingTo: 'Principal',
                        campus: 'DPS North Campus',
                        category: 'Academic Staff',
                        avatarColor: '#059669',
                        status: foundUser.status || 'Active',
                    }
                }
            }
        }
    } catch {
        /* ignore */
    }

    // 4. Check Parent Accounts Store (browser storage)
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem('schoolerp-parent-accounts')
            if (raw) {
                const parents = JSON.parse(raw)
                const foundParent = parents.find((p) =>
                    p.email?.toLowerCase() === query ||
                    p.id?.toLowerCase() === query
                )
                if (foundParent) {
                    return {
                        id: foundParent.id,
                        employeeId: foundParent.id,
                        email: foundParent.email,
                        username: foundParent.email.split('@')[0],
                        name: foundParent.name,
                        role: ROLES.PARENT,
                        roleLabel: 'Parent / Guardian',
                        department: 'Parent Community',
                        designation: 'Parent Account',
                        reportingTo: 'Principal',
                        campus: 'DPS North Campus',
                        category: 'Students & Parents',
                        avatarColor: '#4F46E5',
                        status: foundParent.status || 'Active',
                    }
                }
            }
        }
    } catch {
        /* ignore */
    }

    return null
}

/**
 * Categorized directory grouping for the Quick Demo Credential Helper
 */
export const AUTHENTICATION_CATEGORIES = [
    {
        name: 'All Roles (26)',
        description: 'All 26 institutional roles available across the School ERP',
        roles: Object.values(ROLES),
    },
    {
        name: 'Executive & Governance',
        description: 'Super Administrator, Managing Director, Principal, Joint Director & Assistant',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.DIRECTOR,
            ROLES.PRINCIPAL,
            ROLES.JOINT_DIRECTOR,
            ROLES.JOINT_DIRECTOR_ASSISTANT,
        ],
    },
    {
        name: 'Audit & Quality Assurance',
        description: 'Joint Director Audit, Process Auditor & Quality Auditor',
        roles: [
            ROLES.JOINT_DIRECTOR_AUDIT,
            ROLES.PROCESS_AUDITOR,
            ROLES.QUALITY_AUDITOR,
        ],
    },
    {
        name: 'Academic Staff',
        description: 'Academic Coordinators, Teaching Faculty & Library Services',
        roles: [
            ROLES.COORDINATOR,
            ROLES.TEACHER,
            ROLES.LIBRARIAN,
        ],
    },
    {
        name: 'Administration & HR',
        description: 'Central Administration, Human Resources, Finance, Front Office & PRO Liaison',
        roles: [
            ROLES.ADMIN,
            ROLES.HR,
            ROLES.ACCOUNT_HEAD,
            ROLES.PRM,
            ROLES.PRO,
        ],
    },
    {
        name: 'Operations & Facilities',
        description: 'Stores, IT Support, Transport, Fleet Drivers, Security, File Room & CCTV Operations',
        roles: [
            ROLES.STATIONERY_STORE_MANAGER,
            ROLES.IT_SUPPORT_MANAGER,
            ROLES.TRANSPORT_MANAGER,
            ROLES.DRIVER,
            ROLES.GATEKEEPER_MANAGER,
            ROLES.GATEKEEPER,
            ROLES.HOUSEKEEPING_MANAGER,
            ROLES.MAINTENANCE_MANAGER,
            ROLES.CANTEEN_MANAGER,
            ROLES.FILE_ROOM,
            ROLES.CCTV,
        ],
    },
    {
        name: 'Community & Students',
        description: 'Student Council Portal & Parent Community',
        roles: [
            ROLES.STUDENT,
            ROLES.PARENT,
        ],
    },
]
