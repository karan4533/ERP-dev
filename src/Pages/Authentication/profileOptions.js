import admin_profile from '../../assets/images/admin-icon.png'
import student_profile from '../../assets/images/student-icon.png'
import teacher_profile from '../../assets/images/teacher-icon.png'
import driver_profile from '../../assets/images/van-driver-icon.png'
import librarian_profile from '../../assets/images/librarian-icon.png'
import prm_profile from '../../assets/images/prm-icon.jpg'
import { ROLES } from '../../context/AuthContext'

/** Single source of truth for login profile metadata (labels, images). */
export const PROFILE_OPTIONS = [
    { role: ROLES.SUPER_ADMIN, label: 'Super Admin', image: admin_profile, alt: 'super_admin_profile' },
    { role: ROLES.ADMIN, label: 'Admin', image: admin_profile, alt: 'admin_profile' },
    { role: ROLES.STUDENT, label: 'Student', image: student_profile, alt: 'student_profile' },
    { role: ROLES.PARENT, label: 'Parent', image: student_profile, alt: 'parent_profile' },
    { role: ROLES.TEACHER, label: 'Teacher', image: teacher_profile, alt: 'teacher_profile' },
    { role: ROLES.COORDINATOR, label: 'Coordinator', image: teacher_profile, alt: 'coordinator_profile' },
    { role: ROLES.DRIVER, label: 'Driver', image: driver_profile, alt: 'driver_profile' },
    { role: ROLES.LIBRARIAN, label: 'Librarian', image: librarian_profile, alt: 'librarian_profile' },
    { role: ROLES.PRM, label: 'PRM', image: prm_profile, alt: 'prm_profile', imageClassName: 'rounded-full' },
    { role: ROLES.GATEKEEPER, label: 'Gate Keeper', image: driver_profile, alt: 'gatekeeper_profile' },
    {
        role: ROLES.GATEKEEPER_MANAGER,
        label: 'Gate Keeper Manager',
        image: driver_profile,
        alt: 'gatekeeper_manager_profile',
    },
    { role: ROLES.DIRECTOR, label: 'Director', image: admin_profile, alt: 'director_profile' },
    { role: ROLES.PRINCIPAL, label: 'Principal', image: admin_profile, alt: 'principal_profile' },
    { role: ROLES.CANTEEN_MANAGER, label: 'Café Manager', image: librarian_profile, alt: 'canteen_manager_profile' },
    { role: ROLES.IT_SUPPORT_MANAGER, label: 'IT Support Team Manager', image: admin_profile, alt: 'it_support_manager_profile' },
    { role: ROLES.STATIONERY_STORE_MANAGER, label: 'Stores Manager', image: librarian_profile, alt: 'stationery_store_manager_profile' },
    { role: ROLES.HOUSEKEEPING_MANAGER, label: 'Housekeeping Manager', image: admin_profile, alt: 'housekeeping_manager_profile' },
    { role: ROLES.TRANSPORT_MANAGER, label: 'Transport Manager', image: driver_profile, alt: 'transport_manager_profile' },
    { role: ROLES.JOINT_DIRECTOR, label: 'Joint Director', image: admin_profile, alt: 'joint_director_profile' },
    { role: ROLES.JOINT_DIRECTOR_ASSISTANT, label: 'Joint Director Assistant', image: admin_profile, alt: 'joint_director_assistant_profile' },
    { role: ROLES.JOINT_DIRECTOR_AUDIT, label: 'Joint Director - Audit', image: admin_profile, alt: 'joint_director_audit_profile' },
    { role: ROLES.PROCESS_AUDITOR, label: 'Process Auditor', image: admin_profile, alt: 'process_auditor_profile' },
    { role: ROLES.QUALITY_AUDITOR, label: 'Quality Auditor', image: admin_profile, alt: 'quality_auditor_profile' },
    { role: ROLES.HR, label: 'HR', image: admin_profile, alt: 'hr_profile' },
    { role: ROLES.ACCOUNT_HEAD, label: 'Account Head', image: admin_profile, alt: 'account_head_profile' },
]

export const PROFILE_BY_ROLE = Object.fromEntries(
    PROFILE_OPTIONS.map((profile) => [profile.role, profile])
)

export const getProfileLabel = (role) => PROFILE_BY_ROLE[role]?.label ?? 'User'
