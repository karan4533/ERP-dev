import { Crown, GraduationCap, IndianRupee, Settings, ShieldCheck, ClipboardCheck } from 'lucide-react'
import { ROLES } from '../../context/AuthContext'

/**
 * Presentation-layer grouping for login role selection.
 * Role identifiers match AuthContext ROLES — auth logic is unchanged.
 */
export const SUPER_ADMIN_PROFILE = {
    id: 'super-admin',
    title: 'Super Admin',
    description: 'System Governance & Final Approvals',
    icon: Crown,
    roles: [ROLES.SUPER_ADMIN],
}

export const ADMIN_PROFILE = {
    id: 'admin',
    title: 'Admin',
    description: 'System Administration',
    icon: ShieldCheck,
    roles: [ROLES.ADMIN],
}

export const ROLE_MODULES = [
    {
        id: 'academics',
        title: 'Academics',
        description: 'Academic & School Management',
        icon: GraduationCap,
        roles: [
            ROLES.DIRECTOR,
            ROLES.PRINCIPAL,
            ROLES.PRM,
            ROLES.TEACHER,
            ROLES.COORDINATOR,
            ROLES.LIBRARIAN,
            ROLES.STUDENT,
            ROLES.PARENT,
            ROLES.GATEKEEPER_MANAGER,
            ROLES.GATEKEEPER,
        ],
    },
    {
        id: 'operations',
        title: 'Operations',
        description: 'School Operations & Support',
        icon: Settings,
        roles: [
            ROLES.JOINT_DIRECTOR,
            ROLES.JOINT_DIRECTOR_ASSISTANT,
            ROLES.CANTEEN_MANAGER,
            ROLES.IT_SUPPORT_MANAGER,
            ROLES.STATIONERY_STORE_MANAGER,
            ROLES.HOUSEKEEPING_MANAGER,
            ROLES.TRANSPORT_MANAGER,
            ROLES.DRIVER,
        ],
    },
    {
        id: 'audit',
        title: 'Audit',
        description: 'Audit & Compliance',
        icon: ClipboardCheck,
        roles: [
            ROLES.JOINT_DIRECTOR_AUDIT,
            ROLES.PROCESS_AUDITOR,
            ROLES.QUALITY_AUDITOR,
            ROLES.HR,
        ],
    },
    {
        id: 'finance',
        title: 'Finance',
        description: 'Finance & Accounts',
        icon: IndianRupee,
        roles: [ROLES.ACCOUNT_HEAD],
    },
]

export const getModuleById = (moduleId) =>
    ROLE_MODULES.find((module) => module.id === moduleId) ?? null
