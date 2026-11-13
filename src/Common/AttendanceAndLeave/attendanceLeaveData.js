/**
 * Centralized Enterprise Attendance & Leave Management Data Engine
 * Single Source of Truth for:
 * - Attendance Records & Department Shift Timings
 * - Late Arrival & Early Departure Calculation
 * - Academic vs Non-Academic HR Leave Policies
 * - Dynamic Leave Allocation, Accrual & Carry-Forward Calculation
 * - Hierarchical Access Scoping & Leave Approvals
 * - Bi-directional Attendance & Leave Synchronization
 */

import { ROLES } from '../../constants/roles.js'
import { recordAuditLog, dispatchNotification } from '../AuditAndNotifications/centralAuditEngine.js'

export const ATTENDANCE_STORAGE_KEY = 'schoolerp-attendance-ledger-v1'
export const LEAVE_REQUESTS_STORAGE_KEY = 'schoolerp-leave-requests'
export const HR_POLICIES_STORAGE_KEY = 'schoolerp-hr-leave-policies-v1'
export const SHIFT_CONFIG_STORAGE_KEY = 'schoolerp-shift-timings-v1'
export const LEAVE_LEDGER_STORAGE_KEY = 'schoolerp-leave-ledger-v1'

export const CURRENT_ACADEMIC_YEAR = '2025-2026'
export const ACADEMIC_YEARS = ['2025-2026', '2026-2027']

// ==========================================
// 1. DEPARTMENT SHIFTS & WORKING TIMINGS
// ==========================================

export const DEFAULT_DEPARTMENT_SHIFTS = [
    {
        department: 'Academics & Teaching',
        category: 'Academic',
        shiftName: 'Academic Morning Shift',
        startTime: '08:30 AM',
        endTime: '03:45 PM',
        gracePeriodMinutes: 10,
        lateThresholdMinutes: 30,
        halfDayHours: 4.0,
        workingDays: 'Mon - Fri',
        weeklyOff: 'Saturday, Sunday',
    },
    {
        department: 'Administration',
        category: 'Non-Academic',
        shiftName: 'General Admin Shift',
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        gracePeriodMinutes: 10,
        lateThresholdMinutes: 30,
        halfDayHours: 4.0,
        workingDays: 'Mon - Sat (2nd Sat Off)',
        weeklyOff: 'Sunday',
    },
    {
        department: 'Stores & Procurement',
        category: 'Non-Academic',
        shiftName: 'Warehouse Operations Shift',
        startTime: '09:00 AM',
        endTime: '05:30 PM',
        gracePeriodMinutes: 15,
        lateThresholdMinutes: 30,
        halfDayHours: 4.0,
        workingDays: 'Mon - Sat',
        weeklyOff: 'Sunday',
    },
    {
        department: 'Transport & Fleet Logistics',
        category: 'Non-Academic',
        shiftName: 'Fleet Dual-Route Split Shift',
        startTime: '06:30 AM',
        endTime: '05:00 PM',
        gracePeriodMinutes: 15,
        lateThresholdMinutes: 20,
        halfDayHours: 4.5,
        workingDays: 'Mon - Fri',
        weeklyOff: 'Saturday, Sunday',
    },
    {
        department: 'Human Resources (HR)',
        category: 'Non-Academic',
        shiftName: 'Corporate HR Shift',
        startTime: '09:00 AM',
        endTime: '05:30 PM',
        gracePeriodMinutes: 10,
        lateThresholdMinutes: 30,
        halfDayHours: 4.0,
        workingDays: 'Mon - Sat (Alt Sat)',
        weeklyOff: 'Sunday',
    },
    {
        department: 'Finance & Accounts',
        category: 'Non-Academic',
        shiftName: 'Finance Operations Shift',
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        gracePeriodMinutes: 10,
        lateThresholdMinutes: 30,
        halfDayHours: 4.0,
        workingDays: 'Mon - Sat',
        weeklyOff: 'Sunday',
    },
    {
        department: 'IT Support & Systems',
        category: 'Non-Academic',
        shiftName: 'IT Systems Infrastructure Shift',
        startTime: '08:45 AM',
        endTime: '05:15 PM',
        gracePeriodMinutes: 10,
        lateThresholdMinutes: 30,
        halfDayHours: 4.0,
        workingDays: 'Mon - Sat',
        weeklyOff: 'Sunday',
    },
    {
        department: 'Campus Security & Access Control',
        category: 'Non-Academic',
        shiftName: 'Security Gate Shift A',
        startTime: '07:00 AM',
        endTime: '03:30 PM',
        gracePeriodMinutes: 10,
        lateThresholdMinutes: 15,
        halfDayHours: 4.0,
        workingDays: 'Mon - Sun (Rotational)',
        weeklyOff: 'Rotational Day Off',
    },
    {
        department: 'Facilities & Campus Sanitation',
        category: 'Non-Academic',
        shiftName: 'Campus Maintenance Shift',
        startTime: '07:30 AM',
        endTime: '04:00 PM',
        gracePeriodMinutes: 15,
        lateThresholdMinutes: 30,
        halfDayHours: 4.0,
        workingDays: 'Mon - Sat',
        weeklyOff: 'Sunday',
    },
    {
        department: 'Dining & Nutrition (Café)',
        category: 'Non-Academic',
        shiftName: 'Kitchen & Dining Shift',
        startTime: '07:00 AM',
        endTime: '03:30 PM',
        gracePeriodMinutes: 10,
        lateThresholdMinutes: 20,
        halfDayHours: 4.0,
        workingDays: 'Mon - Sat',
        weeklyOff: 'Sunday',
    },
]

// ==========================================
// 2. HR LEAVE POLICIES (ACADEMIC vs NON-ACADEMIC)
// ==========================================

export const DEFAULT_HR_POLICIES = {
    academic: {
        categoryName: 'Academic HR Policy',
        applicableTo: 'Teaching Staff, Department Heads, Academic Coordinators, Class Teachers',
        effectiveDate: '01-06-2025',
        leaveYear: 'June 2025 - May 2026',
        categories: [
            {
                code: 'CL',
                name: 'Casual Leave',
                annualEntitlement: 12,
                monthlyAccrual: 1.0,
                maxConsecutiveDays: 3,
                minNoticeDays: 2,
                halfDayAllowed: true,
                docRequired: false,
                carryForwardAllowed: true,
                maxCarryForward: 5,
                encashable: false,
                description: 'For personal affairs, urgent domestic matters, and unforeseen casual obligations.',
            },
            {
                code: 'SL',
                name: 'Sick Leave',
                annualEntitlement: 10,
                monthlyAccrual: 0.83,
                maxConsecutiveDays: 7,
                minNoticeDays: 0,
                halfDayAllowed: false,
                docRequired: true,
                docRequirementThreshold: 2,
                carryForwardAllowed: true,
                maxCarryForward: 7,
                encashable: false,
                description: 'Medical indisposition requiring physician consultation. Medical certificate needed if > 2 days.',
            },
            {
                code: 'EL',
                name: 'Earned / Vacation Leave',
                annualEntitlement: 15,
                monthlyAccrual: 1.25,
                maxConsecutiveDays: 14,
                minNoticeDays: 14,
                halfDayAllowed: false,
                docRequired: false,
                carryForwardAllowed: true,
                maxCarryForward: 15,
                encashable: true,
                description: 'Planned term break or summer recess leave, approved by Principal/Director.',
            },
            {
                code: 'ML',
                name: 'Medical Leave',
                annualEntitlement: 12,
                monthlyAccrual: 1.0,
                maxConsecutiveDays: 15,
                minNoticeDays: 1,
                halfDayAllowed: false,
                docRequired: true,
                docRequirementThreshold: 1,
                carryForwardAllowed: true,
                maxCarryForward: 10,
                encashable: false,
                description: 'Extended medical conditions, hospital admission or post-operative recovery.',
            },
            {
                code: 'MatL',
                name: 'Maternity Leave',
                annualEntitlement: 180,
                monthlyAccrual: 0,
                maxConsecutiveDays: 180,
                minNoticeDays: 30,
                halfDayAllowed: false,
                docRequired: true,
                docRequirementThreshold: 1,
                carryForwardAllowed: false,
                maxCarryForward: 0,
                encashable: false,
                description: 'Statutory maternity leave for female academic employees with full pay.',
            },
            {
                code: 'LOP',
                name: 'Loss of Pay (Unpaid Leave)',
                annualEntitlement: 0,
                monthlyAccrual: 0,
                maxConsecutiveDays: 30,
                minNoticeDays: 3,
                halfDayAllowed: true,
                docRequired: false,
                carryForwardAllowed: false,
                maxCarryForward: 0,
                encashable: false,
                description: 'Unpaid leave granted on compassionate grounds when paid entitlements are exhausted.',
            },
            {
                code: 'PERM',
                name: 'Permission (Short Leave)',
                annualEntitlement: 24,
                monthlyAccrual: 2,
                maxConsecutiveDays: 0,
                maxHoursPerRequest: 2,
                minNoticeDays: 1,
                halfDayAllowed: false,
                docRequired: false,
                carryForwardAllowed: false,
                maxCarryForward: 0,
                encashable: false,
                description: 'Short absence permission up to 2 hours per session (max 2 permissions per calendar month). Does not deduct from leave days.',
            },
        ],
    },
    nonAcademic: {
        categoryName: 'Non-Academic HR Policy',
        applicableTo: 'Administration, Stores, Transport, Finance, IT, Facilities, Sanitation, Security, Dining',
        effectiveDate: '01-04-2025',
        leaveYear: 'April 2025 - March 2026',
        categories: [
            {
                code: 'CL',
                name: 'Casual Leave',
                annualEntitlement: 14,
                monthlyAccrual: 1.16,
                maxConsecutiveDays: 4,
                minNoticeDays: 2,
                halfDayAllowed: true,
                docRequired: false,
                carryForwardAllowed: true,
                maxCarryForward: 7,
                encashable: false,
                description: 'Non-academic staff casual leave for personal or domestic matters.',
            },
            {
                code: 'SL',
                name: 'Sick Leave',
                annualEntitlement: 12,
                monthlyAccrual: 1.0,
                maxConsecutiveDays: 10,
                minNoticeDays: 0,
                halfDayAllowed: false,
                docRequired: true,
                docRequirementThreshold: 2,
                carryForwardAllowed: true,
                maxCarryForward: 8,
                encashable: false,
                description: 'Medical leaves for staff. Doctor certificate mandatory for leaves exceeding 2 days.',
            },
            {
                code: 'EL',
                name: 'Privilege / Earned Leave',
                annualEntitlement: 18,
                monthlyAccrual: 1.5,
                maxConsecutiveDays: 15,
                minNoticeDays: 10,
                halfDayAllowed: false,
                docRequired: false,
                carryForwardAllowed: true,
                maxCarryForward: 20,
                encashable: true,
                description: 'Accumulated earned privilege leaves for annual vacation or planned leaves.',
            },
            {
                code: 'CompOff',
                name: 'Compensatory Off',
                annualEntitlement: 6,
                monthlyAccrual: 0.5,
                maxConsecutiveDays: 2,
                minNoticeDays: 1,
                halfDayAllowed: true,
                docRequired: false,
                carryForwardAllowed: false,
                maxCarryForward: 0,
                encashable: false,
                description: 'Earned by working on institution-mandated weekend shifts, sports meets, or audits.',
            },
            {
                code: 'ML',
                name: 'Medical Leave',
                annualEntitlement: 10,
                monthlyAccrual: 0.83,
                maxConsecutiveDays: 14,
                minNoticeDays: 1,
                halfDayAllowed: false,
                docRequired: true,
                docRequirementThreshold: 1,
                carryForwardAllowed: true,
                maxCarryForward: 6,
                encashable: false,
                description: 'Non-academic employee inpatient or outpatient medical treatments.',
            },
            {
                code: 'LOP',
                name: 'Loss of Pay (Unpaid Leave)',
                annualEntitlement: 0,
                monthlyAccrual: 0,
                maxConsecutiveDays: 30,
                minNoticeDays: 2,
                halfDayAllowed: true,
                docRequired: false,
                carryForwardAllowed: false,
                maxCarryForward: 0,
                encashable: false,
                description: 'Authorized unpaid absence once statutory leaves are exhausted.',
            },
            {
                code: 'PERM',
                name: 'Permission (Short Leave)',
                annualEntitlement: 24,
                monthlyAccrual: 2,
                maxConsecutiveDays: 0,
                maxHoursPerRequest: 2,
                minNoticeDays: 1,
                halfDayAllowed: false,
                docRequired: false,
                carryForwardAllowed: false,
                maxCarryForward: 0,
                encashable: false,
                description: 'Short absence permission up to 2 hours per session (max 2 permissions per calendar month). Does not deduct from leave days.',
            },
        ],
    },
}

// ==========================================
// 3. ENTERPRISE EMPLOYEE DIRECTORY
// ==========================================

export const ENTERPRISE_EMPLOYEES = [
    // Executives
    {
        id: 'EMP-DIR-001',
        name: 'Dr. Kavita Sharma',
        email: 'director@school.com',
        roleKey: 'director',
        roleLabel: 'Managing Director',
        department: 'Executive Governance',
        category: 'Non-Academic',
        designation: 'Managing Director & CEO',
        shiftDepartment: 'Administration',
        avatarColor: '#1E40AF',
        reportingTo: null,
    },
    {
        id: 'EMP-PRN-001',
        name: 'Dr. Ramanathan K',
        email: 'principal@school.com',
        roleKey: 'principal',
        roleLabel: 'Principal',
        department: 'Academics & Teaching',
        category: 'Academic',
        designation: 'Head of School & Principal',
        shiftDepartment: 'Academics & Teaching',
        avatarColor: '#2563EB',
        reportingTo: 'EMP-DIR-001',
    },
    {
        id: 'EMP-SUP-001',
        name: 'Arunachalam S',
        email: 'superadmin@school.com',
        roleKey: 'super-admin',
        roleLabel: 'Super Admin',
        department: 'Administration',
        category: 'Non-Academic',
        designation: 'Chief Administrative Officer',
        shiftDepartment: 'Administration',
        avatarColor: '#4F46E5',
        reportingTo: 'EMP-DIR-001',
    },
    {
        id: 'EMP-ADM-001',
        name: 'Suresh Raina',
        email: 'admin@school.com',
        roleKey: 'admin',
        roleLabel: 'Admin',
        department: 'Administration',
        category: 'Non-Academic',
        designation: 'Administrative Officer',
        shiftDepartment: 'Administration',
        avatarColor: '#6366F1',
        reportingTo: 'EMP-SUP-001',
    },
    {
        id: 'EMP-HR-001',
        name: 'Sunita Deshmukh',
        email: 'hr@school.com',
        roleKey: 'hr',
        roleLabel: 'HR Manager',
        department: 'Human Resources (HR)',
        category: 'Non-Academic',
        designation: 'Head of Human Resources',
        shiftDepartment: 'Human Resources (HR)',
        avatarColor: '#9333EA',
        reportingTo: 'EMP-DIR-001',
    },
    {
        id: 'EMP-PRM-001',
        name: 'Kavita Reddy',
        email: 'prm@school.com',
        roleKey: 'prm',
        roleLabel: 'Front Office & PRM',
        department: 'Public Relations & Reception',
        category: 'Non-Academic',
        designation: 'Public Relations Manager',
        shiftDepartment: 'Administration',
        avatarColor: '#0891B2',
        reportingTo: 'EMP-ADM-001',
    },
    {
        id: 'EMP-JD-001',
        name: 'Vikramaditya Singhania',
        email: 'jointdirector@school.com',
        roleKey: 'joint-director',
        roleLabel: 'Joint Director',
        department: 'Operations & Infrastructure',
        category: 'Non-Academic',
        designation: 'Joint Director of Operations',
        shiftDepartment: 'Administration',
        avatarColor: '#0369A1',
        reportingTo: 'EMP-DIR-001',
    },
    {
        id: 'EMP-JDA-001',
        name: 'Ananya Sharma',
        email: 'jointdirectorassistant@school.com',
        roleKey: 'joint-director-assistant',
        roleLabel: 'Joint Director Assistant',
        department: 'Operations & Infrastructure',
        category: 'Non-Academic',
        designation: 'Executive Assistant to JD',
        shiftDepartment: 'Administration',
        avatarColor: '#0284C7',
        reportingTo: 'EMP-JD-001',
    },
    {
        id: 'EMP-JDAUD-001',
        name: 'Harish Chandra',
        email: 'jointdirectoraudit@school.com',
        roleKey: 'joint-director-audit',
        roleLabel: 'Joint Director - Audit',
        department: 'Internal Audit & Inspection',
        category: 'Non-Academic',
        designation: 'Director of Audit & Assurance',
        shiftDepartment: 'Administration',
        avatarColor: '#D97706',
        reportingTo: 'EMP-DIR-001',
    },

    // Academic Staff
    {
        id: 'EMP-CRD-001',
        name: 'Kavita Menon',
        email: 'coordinator@school.com',
        roleKey: 'coordinator',
        roleLabel: 'Academic Coordinator',
        department: 'Academics & Teaching',
        category: 'Academic',
        designation: 'Senior Secondary Coordinator',
        shiftDepartment: 'Academics & Teaching',
        avatarColor: '#3B82F6',
        reportingTo: 'EMP-PRN-001',
    },
    {
        id: 'EMP-TCH-014',
        name: 'Priya Menon',
        email: 'teacher@school.com',
        roleKey: 'teacher',
        roleLabel: 'Class Teacher',
        department: 'Academics & Teaching',
        category: 'Academic',
        designation: 'Class Teacher (Grade 10-A) & Senior Math Faculty',
        shiftDepartment: 'Academics & Teaching',
        avatarColor: '#0284C7',
        reportingTo: 'EMP-CRD-001',
    },
    {
        id: 'EMP-TCH-006',
        name: 'Ananya Roy',
        email: 'ananya.roy@school.com',
        roleKey: 'teacher',
        roleLabel: 'Class Teacher',
        department: 'Academics & Teaching',
        category: 'Academic',
        designation: 'Chemistry Faculty (Grade 11-A)',
        shiftDepartment: 'Academics & Teaching',
        avatarColor: '#0EA5E9',
        reportingTo: 'EMP-CRD-001',
    },
    {
        id: 'EMP-TCH-007',
        name: 'Dr. Subramanian',
        email: 'subramanian@school.com',
        roleKey: 'teacher',
        roleLabel: 'Faculty',
        department: 'Academics & Teaching',
        category: 'Academic',
        designation: 'Physics Lead Faculty (Grade 12)',
        shiftDepartment: 'Academics & Teaching',
        avatarColor: '#06B6D4',
        reportingTo: 'EMP-CRD-001',
    },
    {
        id: 'EMP-LIB-001',
        name: 'Meenakshi Sundaram',
        email: 'librarian@school.com',
        roleKey: 'librarian',
        roleLabel: 'Librarian',
        department: 'Academics & Teaching',
        category: 'Academic',
        designation: 'Chief Librarian & Resource Head',
        shiftDepartment: 'Academics & Teaching',
        avatarColor: '#14B8A6',
        reportingTo: 'EMP-PRN-001',
    },

    // Non-Academic Department Heads & Staff
    {
        id: 'EMP-STR-001',
        name: 'Gurpreet Singh',
        email: 'stationery-store-manager@school.com',
        roleKey: 'stationery-store-manager',
        roleLabel: 'Stores Manager',
        department: 'Stores & Procurement',
        category: 'Non-Academic',
        designation: 'Stores & Inventory Manager',
        shiftDepartment: 'Stores & Procurement',
        avatarColor: '#EA580C',
        reportingTo: 'EMP-SUP-001',
    },
    {
        id: 'EMP-STR-002',
        name: 'Harpreet Kaur',
        email: 'harpreet@school.com',
        roleKey: 'stationery-store-manager',
        roleLabel: 'Assistant Store Officer',
        department: 'Stores & Procurement',
        category: 'Non-Academic',
        designation: 'Assistant Stores Officer',
        shiftDepartment: 'Stores & Procurement',
        avatarColor: '#D97706',
        reportingTo: 'EMP-STR-001',
    },
    {
        id: 'EMP-TRN-001',
        name: 'Dharmesh Patel',
        email: 'transport-manager@school.com',
        roleKey: 'transport-manager',
        roleLabel: 'Transport Manager',
        department: 'Transport & Fleet Logistics',
        category: 'Non-Academic',
        designation: 'Fleet & Logistics Head',
        shiftDepartment: 'Transport & Fleet Logistics',
        avatarColor: '#059669',
        reportingTo: 'EMP-SUP-001',
    },
    {
        id: 'EMP-DRV-001',
        name: 'Jaswant Singh',
        email: 'driver@school.com',
        roleKey: 'driver',
        roleLabel: 'Senior Route Driver',
        department: 'Transport & Fleet Logistics',
        category: 'Non-Academic',
        designation: 'Senior Route Driver (Route #04)',
        shiftDepartment: 'Transport & Fleet Logistics',
        avatarColor: '#10B981',
        reportingTo: 'EMP-TRN-001',
    },
    {
        id: 'EMP-ACC-001',
        name: 'K. Venkataraman',
        email: 'account-head@school.com',
        roleKey: 'account-head',
        roleLabel: 'Finance Head',
        department: 'Finance & Accounts',
        category: 'Non-Academic',
        designation: 'Chief Financial Officer',
        shiftDepartment: 'Finance & Accounts',
        avatarColor: '#2563EB',
        reportingTo: 'EMP-DIR-001',
    },
    {
        id: 'EMP-IT-001',
        name: 'Rakesh Nair',
        email: 'it-support-manager@school.com',
        roleKey: 'it-support-manager',
        roleLabel: 'IT Support Manager',
        department: 'IT Support & Systems',
        category: 'Non-Academic',
        designation: 'IT Systems Infrastructure Lead',
        shiftDepartment: 'IT Support & Systems',
        avatarColor: '#0284C7',
        reportingTo: 'EMP-SUP-001',
    },
    {
        id: 'EMP-GKM-001',
        name: 'Bhawani Singh',
        email: 'gatekeeper-manager@school.com',
        roleKey: 'gatekeeper-manager',
        roleLabel: 'Security Manager',
        department: 'Campus Security & Access Control',
        category: 'Non-Academic',
        designation: 'Chief Security Officer',
        shiftDepartment: 'Campus Security & Access Control',
        avatarColor: '#7C3AED',
        reportingTo: 'EMP-SUP-001',
    },
    {
        id: 'EMP-GK-001',
        name: 'Ram Singh',
        email: 'gate-keeper@school.com',
        roleKey: 'gate-keeper',
        roleLabel: 'Gatekeeper',
        department: 'Campus Security & Access Control',
        category: 'Non-Academic',
        designation: 'Senior Security Guard (Gate 1)',
        shiftDepartment: 'Campus Security & Access Control',
        avatarColor: '#8B5CF6',
        reportingTo: 'EMP-GKM-001',
    },
    {
        id: 'EMP-HK-001',
        name: 'Savitri Devi',
        email: 'housekeeping-manager@school.com',
        roleKey: 'housekeeping-manager',
        roleLabel: 'Housekeeping Manager',
        department: 'Facilities & Campus Sanitation',
        category: 'Non-Academic',
        designation: 'Campus Hygiene & Facilities Lead',
        shiftDepartment: 'Facilities & Campus Sanitation',
        avatarColor: '#D97706',
        reportingTo: 'EMP-SUP-001',
    },
    {
        id: 'EMP-MNT-001',
        name: 'Gopalakrishnan R',
        email: 'maintenancemanager@school.com',
        roleKey: 'maintenance-manager',
        roleLabel: 'Maintenance Manager',
        department: 'Campus Infrastructure & Maintenance',
        category: 'Non-Academic',
        designation: 'Head of Maintenance & Engineering',
        shiftDepartment: 'Campus Infrastructure & Maintenance',
        avatarColor: '#0284c7',
        reportingTo: 'EMP-SUP-001',
    },
    {
        id: 'EMP-CNT-001',
        name: 'Mohan Lal Verma',
        email: 'canteen-manager@school.com',
        roleKey: 'canteen-manager',
        roleLabel: 'Canteen Manager',
        department: 'Dining & Nutrition (Café)',
        category: 'Non-Academic',
        designation: 'Campus Dining & Nutrition Lead',
        shiftDepartment: 'Dining & Nutrition (Café)',
        avatarColor: '#E11D48',
        reportingTo: 'EMP-SUP-001',
    },
    {
        id: 'EMP-FO-001',
        name: 'Anita Desai',
        email: 'front-office@school.com',
        roleKey: 'front-office',
        roleLabel: 'Front Office Executive',
        department: 'Administration',
        category: 'Non-Academic',
        designation: 'Senior Front Office & Visitor Desk Lead',
        shiftDepartment: 'Administration',
        avatarColor: '#EC4899',
        reportingTo: 'EMP-ADM-001',
    },
    {
        id: 'EMP-PA-001',
        name: 'Anita Deshmukh',
        email: 'process-auditor@school.com',
        roleKey: 'process-auditor',
        roleLabel: 'Process Auditor',
        department: 'Internal Audit & Compliance',
        category: 'Non-Academic',
        designation: 'Senior Process Auditor & SOP Compliance Lead',
        shiftDepartment: 'Administration',
        avatarColor: '#4F46E5',
        reportingTo: 'EMP-JDA-001',
    },
    {
        id: 'EMP-QA-001',
        name: 'Rajesh Kumar',
        email: 'quality-auditor@school.com',
        roleKey: 'quality-auditor',
        roleLabel: 'Quality Auditor',
        department: 'Internal Audit & Compliance',
        category: 'Non-Academic',
        designation: 'Academic Quality & Accreditation Auditor',
        shiftDepartment: 'Administration',
        avatarColor: '#6366F1',
        reportingTo: 'EMP-JDA-001',
    },
    {
        id: 'EMP-JDA-001',
        name: 'Dr. Meenakshi Sundaram',
        email: 'joint-director-audit@school.com',
        roleKey: 'joint-director-audit',
        roleLabel: 'Joint Director (Audit)',
        department: 'Internal Audit & Compliance',
        category: 'Non-Academic',
        designation: 'Joint Director of Audit & Regulatory Oversight',
        shiftDepartment: 'Administration',
        avatarColor: '#4338CA',
        reportingTo: 'EMP-DIR-001',
    },
    {
        id: 'EMP-JD-001',
        name: 'K. Balasubramanian',
        email: 'joint-director@school.com',
        roleKey: 'joint-director',
        roleLabel: 'Joint Director',
        department: 'Executive Governance',
        category: 'Non-Academic',
        designation: 'Joint Director of Operations',
        shiftDepartment: 'Administration',
        avatarColor: '#1E3A8A',
        reportingTo: 'EMP-DIR-001',
    },
    {
        id: 'EMP-JDAS-001',
        name: 'S. Raman',
        email: 'joint-director-assistant@school.com',
        roleKey: 'joint-director-assistant',
        roleLabel: 'Joint Director Assistant',
        department: 'Executive Governance',
        category: 'Non-Academic',
        designation: 'Executive Assistant to Joint Director',
        shiftDepartment: 'Administration',
        avatarColor: '#1D4ED8',
        reportingTo: 'EMP-JD-001',
    },
]

// ==========================================
// 4. LATE ARRIVAL & ATTENDANCE TIME CALCULATOR
// ==========================================

export const parseTimeStringToMinutes = (timeStr) => {
    if (!timeStr || timeStr === '-') return null
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (!match) return null
    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const meridian = match[3] ? match[3].toUpperCase() : null

    if (meridian === 'PM' && hours < 12) hours += 12
    if (meridian === 'AM' && hours === 12) hours = 0

    return hours * 60 + minutes
}

export const formatMinutesToDuration = (minutes) => {
    if (minutes <= 0) return '0m'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
}

/**
 * Calculates late duration and early departure based on department shift.
 */
export const evaluateAttendanceTimings = (arg1, arg2, arg3) => {
    let checkInStr = ''
    let checkOutStr = ''
    let shift = null

    if (typeof arg1 === 'string' && (arg1.includes(':') || arg1 === '-')) {
        checkInStr = arg1
        checkOutStr = arg2
        shift = arg3 || DEFAULT_DEPARTMENT_SHIFTS[0]
    } else {
        const dept = (arg1 || '').toLowerCase()
        checkInStr = arg2
        checkOutStr = arg3
        const shifts = getDepartmentShifts()
        shift =
            shifts.find(
                (s) =>
                    s.department.toLowerCase().includes(dept) ||
                    dept.includes(s.department.toLowerCase())
            ) || DEFAULT_DEPARTMENT_SHIFTS[0]
    }

    if (!checkInStr || checkInStr === '-') {
        return {
            workingHours: '0h 0m',
            lateDurationMinutes: 0,
            lateMinutes: 0,
            lateFormatted: '0m',
            lateStatus: 'Absent',
            isLate: false,
            earlyDepartureMinutes: 0,
            earlyMinutes: 0,
            earlyFormatted: '0m',
            isEarlyDeparture: false,
            status: 'Absent',
        }
    }

    const checkInMins = parseTimeStringToMinutes(checkInStr)
    const shiftStartMins = parseTimeStringToMinutes(shift.startTime)
    const shiftEndMins = parseTimeStringToMinutes(shift.endTime)
    const graceMinutes = shift.gracePeriodMinutes || 10

    let lateDurationMinutes = 0
    let lateStatus = 'On Time'

    if (checkInMins !== null && shiftStartMins !== null) {
        const diff = checkInMins - shiftStartMins
        if (diff > graceMinutes) {
            lateDurationMinutes = diff
            lateStatus = 'Late Arrival'
        }
    }

    let earlyDepartureMinutes = 0
    if (checkOutStr && checkOutStr !== '-') {
        const checkOutMins = parseTimeStringToMinutes(checkOutStr)
        if (checkOutMins !== null && shiftEndMins !== null) {
            const earlyDiff = shiftEndMins - checkOutMins
            if (earlyDiff > 10) {
                earlyDepartureMinutes = earlyDiff
            }
        }
    }

    let workingHours = '8h 0m'
    if (checkInStr && checkOutStr && checkInStr !== '-' && checkOutStr !== '-') {
        const inM = parseTimeStringToMinutes(checkInStr)
        const outM = parseTimeStringToMinutes(checkOutStr)
        if (inM !== null && outM !== null && outM > inM) {
            const span = outM - inM
            workingHours = formatMinutesToDuration(span)
        }
    }

    const isLate = lateDurationMinutes > 0
    const isEarlyDeparture = earlyDepartureMinutes > 0
    const status = isLate ? 'Late Arrival' : isEarlyDeparture ? 'Early Departure' : 'Present'

    return {
        workingHours,
        lateDurationMinutes,
        lateMinutes: lateDurationMinutes,
        lateFormatted: formatMinutesToDuration(lateDurationMinutes),
        lateStatus,
        isLate,
        earlyDepartureMinutes,
        earlyMinutes: earlyDepartureMinutes,
        earlyFormatted: formatMinutesToDuration(earlyDepartureMinutes),
        isEarlyDeparture,
        status,
    }
}

// ==========================================
// 5. ATTENDANCE SEED LEDGER (REALISTIC RECORDS)
// ==========================================

export const generateInitialAttendanceRecords = () => {
    const today = '31-10-2026'
    const yesterday = '30-10-2026'

    const shiftMap = {}
    DEFAULT_DEPARTMENT_SHIFTS.forEach((s) => {
        shiftMap[s.department] = s
    })

    return [
        // Today - Managing Director
        {
            id: 'ATT-2026-001',
            employeeId: 'EMP-DIR-001',
            employeeName: 'Dr. Kavita Sharma',
            department: 'Administration',
            category: 'Non-Academic',
            designation: 'Managing Director & CEO',
            date: today,
            checkInTime: '08:52 AM',
            checkOutTime: '06:15 PM',
            workingHours: '9h 23m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'General Admin Shift',
            status: 'Present',
            remarks: 'On time. Executive briefing completed.',
        },
        // Today - Principal
        {
            id: 'ATT-2026-002',
            employeeId: 'EMP-PRN-001',
            employeeName: 'Dr. Ramanathan K',
            department: 'Academics & Teaching',
            category: 'Academic',
            designation: 'Head of School & Principal',
            date: today,
            checkInTime: '08:22 AM',
            checkOutTime: '04:15 PM',
            workingHours: '7h 53m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Academic Morning Shift',
            status: 'Present',
            remarks: 'On time. Morning assembly address.',
        },
        // Today - Coordinator
        {
            id: 'ATT-2026-003',
            employeeId: 'EMP-CRD-001',
            employeeName: 'Kavita Menon',
            department: 'Academics & Teaching',
            category: 'Academic',
            designation: 'Senior Secondary Coordinator',
            date: today,
            checkInTime: '08:26 AM',
            checkOutTime: '04:00 PM',
            workingHours: '7h 34m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Academic Morning Shift',
            status: 'Present',
            remarks: 'On time. Curriculum audit oversight.',
        },
        // Today - Class Teacher (Priya Menon)
        {
            id: 'ATT-2026-004',
            employeeId: 'EMP-TCH-014',
            employeeName: 'Priya Menon',
            department: 'Academics & Teaching',
            category: 'Academic',
            designation: 'Class Teacher (Grade 10-A) & Senior Math Faculty',
            date: today,
            checkInTime: '08:28 AM',
            checkOutTime: '03:50 PM',
            workingHours: '7h 22m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Academic Morning Shift',
            status: 'Present',
            remarks: 'On time. Grade 10-A attendance marked.',
        },
        // Today - Teacher Ananya Roy (Late arrival by 22m)
        {
            id: 'ATT-2026-005',
            employeeId: 'EMP-TCH-006',
            employeeName: 'Ananya Roy',
            department: 'Academics & Teaching',
            category: 'Academic',
            designation: 'Chemistry Faculty (Grade 11-A)',
            date: today,
            checkInTime: '08:52 AM',
            checkOutTime: '04:10 PM',
            workingHours: '7h 18m',
            lateDurationMinutes: 22,
            lateFormatted: '22m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Academic Morning Shift',
            status: 'Late Arrival',
            remarks: 'Arrived 22 mins past grace threshold due to metro maintenance.',
        },
        // Today - Dr. Subramanian (On Leave - Medical Leave)
        {
            id: 'ATT-2026-006',
            employeeId: 'EMP-TCH-007',
            employeeName: 'Dr. Subramanian',
            department: 'Academics & Teaching',
            category: 'Academic',
            designation: 'Physics Lead Faculty (Grade 12)',
            date: today,
            checkInTime: '-',
            checkOutTime: '-',
            workingHours: '0h 0m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Academic Morning Shift',
            status: 'On Leave',
            remarks: 'Approved Medical Leave (Ref: LR-2026-002). Substitute assigned.',
        },
        // Today - Librarian
        {
            id: 'ATT-2026-007',
            employeeId: 'EMP-LIB-001',
            employeeName: 'Meenakshi Sundaram',
            department: 'Academics & Teaching',
            category: 'Academic',
            designation: 'Chief Librarian & Resource Head',
            date: today,
            checkInTime: '08:25 AM',
            checkOutTime: '04:00 PM',
            workingHours: '7h 35m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Academic Morning Shift',
            status: 'Present',
            remarks: 'On time.',
        },
        // Today - Stores Manager
        {
            id: 'ATT-2026-008',
            employeeId: 'EMP-STR-001',
            employeeName: 'Gurpreet Singh',
            department: 'Stores & Procurement',
            category: 'Non-Academic',
            designation: 'Stores & Inventory Manager',
            date: today,
            checkInTime: '08:55 AM',
            checkOutTime: '05:40 PM',
            workingHours: '8h 45m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Warehouse Operations Shift',
            status: 'Present',
            remarks: 'On time. Morning stock dispatch.',
        },
        // Today - Assistant Store Officer (Early departure)
        {
            id: 'ATT-2026-009',
            employeeId: 'EMP-STR-002',
            employeeName: 'Harpreet Kaur',
            department: 'Stores & Procurement',
            category: 'Non-Academic',
            designation: 'Assistant Stores Officer',
            date: today,
            checkInTime: '09:05 AM',
            checkOutTime: '04:15 PM',
            workingHours: '7h 10m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 75,
            earlyFormatted: '1h 15m',
            shiftName: 'Warehouse Operations Shift',
            status: 'Early Departure',
            remarks: 'Early departure approved by HOD for supplier warehouse visit.',
        },
        // Today - Transport Manager
        {
            id: 'ATT-2026-010',
            employeeId: 'EMP-TRN-001',
            employeeName: 'Dharmesh Patel',
            department: 'Transport & Fleet Logistics',
            category: 'Non-Academic',
            designation: 'Fleet & Logistics Head',
            date: today,
            checkInTime: '06:22 AM',
            checkOutTime: '05:10 PM',
            workingHours: '10h 48m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Fleet Dual-Route Split Shift',
            status: 'Present',
            remarks: 'Morning route roll call completed at 06:30 AM.',
        },
        // Today - Route Driver (Jaswant Singh)
        {
            id: 'ATT-2026-011',
            employeeId: 'EMP-DRV-001',
            employeeName: 'Jaswant Singh',
            department: 'Transport & Fleet Logistics',
            category: 'Non-Academic',
            designation: 'Senior Route Driver (Route #04)',
            date: today,
            checkInTime: '06:20 AM',
            checkOutTime: '04:45 PM',
            workingHours: '10h 25m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Fleet Dual-Route Split Shift',
            status: 'Present',
            remarks: 'Route 04 on-time GPS logs verified.',
        },
        // Today - Finance CFO
        {
            id: 'ATT-2026-012',
            employeeId: 'EMP-ACC-001',
            employeeName: 'K. Venkataraman',
            department: 'Finance & Accounts',
            category: 'Non-Academic',
            designation: 'Chief Financial Officer',
            date: today,
            checkInTime: '08:58 AM',
            checkOutTime: '05:30 PM',
            workingHours: '8h 32m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Finance Operations Shift',
            status: 'Present',
            remarks: 'Quarterly ledger audit.',
        },
        // Today - HR Manager
        {
            id: 'ATT-2026-013',
            employeeId: 'EMP-HR-001',
            employeeName: 'Sunita Deshmukh',
            department: 'Human Resources (HR)',
            category: 'Non-Academic',
            designation: 'Head of Human Resources',
            date: today,
            checkInTime: '08:55 AM',
            checkOutTime: '05:40 PM',
            workingHours: '8h 45m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Corporate HR Shift',
            status: 'Present',
            remarks: 'On time.',
        },
        // Today - IT Manager
        {
            id: 'ATT-2026-014',
            employeeId: 'EMP-IT-001',
            employeeName: 'Rakesh Nair',
            department: 'IT Support & Systems',
            category: 'Non-Academic',
            designation: 'IT Systems Infrastructure Lead',
            date: today,
            checkInTime: '08:40 AM',
            checkOutTime: '05:25 PM',
            workingHours: '8h 45m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'IT Systems Infrastructure Shift',
            status: 'Present',
            remarks: 'Network uptime verified 99.98%.',
        },
        // Today - Gatekeeper Security Lead
        {
            id: 'ATT-2026-015',
            employeeId: 'EMP-GKM-001',
            employeeName: 'Bhawani Singh',
            department: 'Campus Security & Access Control',
            category: 'Non-Academic',
            designation: 'Chief Security Officer',
            date: today,
            checkInTime: '06:50 AM',
            checkOutTime: '03:45 PM',
            workingHours: '8h 55m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Security Gate Shift A',
            status: 'Present',
            remarks: 'Perimeter check clear.',
        },
        // Today - Gatekeeper Guard Ram Singh
        {
            id: 'ATT-2026-016',
            employeeId: 'EMP-GK-001',
            employeeName: 'Ram Singh',
            department: 'Campus Security & Access Control',
            category: 'Non-Academic',
            designation: 'Senior Security Guard (Gate 1)',
            date: today,
            checkInTime: '06:55 AM',
            checkOutTime: '03:30 PM',
            workingHours: '8h 35m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Security Gate Shift A',
            status: 'Present',
            remarks: 'Visitor log active.',
        },
        // Today - Housekeeping Lead
        {
            id: 'ATT-2026-017',
            employeeId: 'EMP-HK-001',
            employeeName: 'Savitri Devi',
            department: 'Facilities & Campus Sanitation',
            category: 'Non-Academic',
            designation: 'Campus Hygiene & Facilities Lead',
            date: today,
            checkInTime: '07:20 AM',
            checkOutTime: '04:10 PM',
            workingHours: '8h 50m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Campus Maintenance Shift',
            status: 'Present',
            remarks: 'Morning wing sanitization verified.',
        },
        // Today - Dining Lead
        {
            id: 'ATT-2026-018',
            employeeId: 'EMP-CNT-001',
            employeeName: 'Mohan Lal Verma',
            department: 'Dining & Nutrition (Café)',
            category: 'Non-Academic',
            designation: 'Campus Dining & Nutrition Lead',
            date: today,
            checkInTime: '06:55 AM',
            checkOutTime: '03:40 PM',
            workingHours: '8h 45m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Kitchen & Dining Shift',
            status: 'Present',
            remarks: 'FSSAI standards verified.',
        },
        // Today - Front Office
        {
            id: 'ATT-2026-019',
            employeeId: 'EMP-FO-001',
            employeeName: 'Anita Desai',
            department: 'Administration',
            category: 'Non-Academic',
            designation: 'Senior Front Office & Visitor Desk Lead',
            date: today,
            checkInTime: '08:50 AM',
            checkOutTime: '05:00 PM',
            workingHours: '8h 10m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'General Admin Shift',
            status: 'Present',
            remarks: 'Visitor desk opened on schedule.',
        },
        // Today - PRM & Admissions In-Charge (Kavita Reddy)
        {
            id: 'ATT-2026-019B',
            employeeId: 'EMP-PRM-001',
            employeeName: 'Kavita Reddy',
            department: 'Public Relations & Reception',
            category: 'Non-Academic',
            designation: 'Public Relations Manager',
            date: today,
            checkInTime: '08:45 AM',
            checkOutTime: '05:15 PM',
            workingHours: '8h 30m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'General Admin Shift',
            status: 'Present',
            remarks: 'On time. Morning enquiry desk operational.',
        },
        // Today - Unjustified Absent Employee (Sample)
        {
            id: 'ATT-2026-020',
            employeeId: 'EMP-ADM-002',
            employeeName: 'Kunal Kapoor',
            department: 'Administration',
            category: 'Non-Academic',
            designation: 'Records Clerk',
            date: today,
            checkInTime: '-',
            checkOutTime: '-',
            workingHours: '0h 0m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'General Admin Shift',
            status: 'Absent',
            remarks: 'Unscheduled absence without prior notice.',
        },
        // Today - Joint Director Admin
        {
            id: 'ATT-2026-021',
            employeeId: 'EMP-JD-001',
            employeeName: 'Vikramaditya Singhania',
            department: 'Operations & Infrastructure',
            category: 'Non-Academic',
            designation: 'Joint Director of Operations',
            date: today,
            checkInTime: '08:40 AM',
            checkOutTime: '05:30 PM',
            workingHours: '8h 50m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'General Admin Shift',
            status: 'Present',
            remarks: 'On time. Campus operations review.',
        },
        // Today - Joint Director Admin Assistant
        {
            id: 'ATT-2026-022',
            employeeId: 'EMP-JDA-001',
            employeeName: 'Ananya Sharma',
            department: 'Operations & Infrastructure',
            category: 'Non-Academic',
            designation: 'Executive Assistant to JD',
            date: today,
            checkInTime: '08:50 AM',
            checkOutTime: '05:15 PM',
            workingHours: '8h 25m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'General Admin Shift',
            status: 'Present',
            remarks: 'On time. Operational filing.',
        },
        // Today - Joint Director Audit
        {
            id: 'ATT-2026-023',
            employeeId: 'EMP-JDAUD-001',
            employeeName: 'Harish Chandra',
            department: 'Internal Audit & Inspection',
            category: 'Non-Academic',
            designation: 'Director of Audit & Assurance',
            date: today,
            checkInTime: '08:45 AM',
            checkOutTime: '05:20 PM',
            workingHours: '8h 35m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'General Admin Shift',
            status: 'Present',
            remarks: 'On time. Statutory compliance audit.',
        },
    ]
}

// ==========================================
// 6. SEED LEAVE REQUESTS
// ==========================================

export const INITIAL_LEAVE_REQUESTS = [
    {
        id: 'LR-2026-001',
        leaveRequestId: 'LR-2026-001',
        employeeId: 'EMP-TCH-014',
        requestedBy: 'Priya Menon',
        submitterRole: 'teacher',
        category: 'Academic',
        department: 'Academics & Teaching',
        designation: 'Class Teacher (Grade 10-A)',
        leaveCategory: 'Casual Leave',
        leaveType: 'Casual Leave',
        fromDate: '2026-11-04',
        toDate: '2026-11-05',
        isHalfDay: false,
        halfDaySession: null,
        totalDays: 2,
        reason: 'Attending family wedding ceremony out of station.',
        documentUrl: '',
        contactDuringLeave: '+91 98450 12345 (Trichy)',
        appliedDate: '29-10-2026',
        requestedTo: 'Kavita Menon (Coordinator)',
        approverRole: 'coordinator',
        status: 'Pending',
        approverRemarks: '',
        approvalHistory: [
            {
                action: 'Applied',
                actor: 'Priya Menon',
                timestamp: '29-10-2026 10:15 AM',
                remarks: 'Request initiated with 6 days advance notice.',
            },
        ],
    },
    {
        id: 'LR-2026-002',
        leaveRequestId: 'LR-2026-002',
        employeeId: 'EMP-TCH-007',
        requestedBy: 'Dr. Subramanian',
        submitterRole: 'teacher',
        category: 'Academic',
        department: 'Academics & Teaching',
        designation: 'Physics Lead Faculty',
        leaveCategory: 'Medical Leave',
        leaveType: 'Medical Leave',
        fromDate: '2026-10-31',
        toDate: '2026-11-02',
        isHalfDay: false,
        halfDaySession: null,
        totalDays: 3,
        reason: 'Acute bronchitis and physician-advised bed rest.',
        documentUrl: 'medical_cert_dr_subramanian.pdf',
        contactDuringLeave: '+91 94441 55678',
        appliedDate: '30-10-2026',
        requestedTo: 'Dr. Ramanathan K (Principal)',
        approverRole: 'principal',
        status: 'Approved',
        approverRemarks: 'Approved. Medical certificate verified. Substitute physics faculty arranged.',
        approvalHistory: [
            {
                action: 'Applied',
                actor: 'Dr. Subramanian',
                timestamp: '30-10-2026 07:45 AM',
                remarks: 'Medical certificate attached.',
            },
            {
                action: 'Approved',
                actor: 'Dr. Ramanathan K (Principal)',
                timestamp: '30-10-2026 08:30 AM',
                remarks: 'Approved. Substitute allocated.',
            },
        ],
    },
    {
        id: 'LR-2026-003',
        leaveRequestId: 'LR-2026-003',
        employeeId: 'EMP-STR-001',
        requestedBy: 'Gurpreet Singh',
        submitterRole: 'stationery-store-manager',
        category: 'Non-Academic',
        department: 'Stores & Procurement',
        designation: 'Stores & Inventory Manager',
        leaveCategory: 'Earned / Privilege Leave',
        leaveType: 'Earned / Privilege Leave',
        fromDate: '2026-11-10',
        toDate: '2026-11-14',
        isHalfDay: false,
        halfDaySession: null,
        totalDays: 5,
        reason: 'Annual family pilgrimage.',
        documentUrl: '',
        contactDuringLeave: '+91 98110 33445 (Amritsar)',
        appliedDate: '26-10-2026',
        requestedTo: 'Arunachalam S (Super Admin)',
        approverRole: 'super-admin',
        status: 'Approved',
        approverRemarks: 'Approved. Assistant Store Officer Harpreet Kaur placed as acting custodian.',
        approvalHistory: [
            {
                action: 'Applied',
                actor: 'Gurpreet Singh',
                timestamp: '26-10-2026 09:30 AM',
                remarks: 'Submitted 15 days in advance.',
            },
            {
                action: 'Approved',
                actor: 'Arunachalam S',
                timestamp: '27-10-2026 11:00 AM',
                remarks: 'Handover protocol signed.',
            },
        ],
    },
    {
        id: 'LR-2026-004',
        leaveRequestId: 'LR-2026-004',
        employeeId: 'EMP-DRV-001',
        requestedBy: 'Jaswant Singh',
        submitterRole: 'driver',
        category: 'Non-Academic',
        department: 'Transport & Fleet Logistics',
        designation: 'Senior Route Driver',
        leaveCategory: 'Casual Leave',
        leaveType: 'Casual Leave',
        fromDate: '2026-11-06',
        toDate: '2026-11-06',
        isHalfDay: true,
        halfDaySession: 'Afternoon',
        totalDays: 0.5,
        reason: 'RTO vehicle fitness inspection for family vehicle.',
        documentUrl: '',
        contactDuringLeave: '+91 97890 11223',
        appliedDate: '30-10-2026',
        requestedTo: 'Dharmesh Patel (Transport Manager)',
        approverRole: 'transport-manager',
        status: 'Pending',
        approverRemarks: '',
        approvalHistory: [
            {
                action: 'Applied',
                actor: 'Jaswant Singh',
                timestamp: '30-10-2026 02:15 PM',
                remarks: 'Spare driver assigned to evening run.',
            },
        ],
    },
    {
        id: 'LR-2026-005',
        leaveRequestId: 'LR-2026-005',
        employeeId: 'EMP-HK-001',
        requestedBy: 'Savitri Devi',
        submitterRole: 'housekeeping-manager',
        category: 'Non-Academic',
        department: 'Facilities & Campus Sanitation',
        designation: 'Campus Hygiene & Facilities Lead',
        leaveCategory: 'Casual Leave',
        leaveType: 'Casual Leave',
        fromDate: '2026-10-20',
        toDate: '2026-10-20',
        isHalfDay: false,
        halfDaySession: null,
        totalDays: 1,
        reason: 'Domestic emergency.',
        documentUrl: '',
        contactDuringLeave: '+91 94440 22119',
        appliedDate: '19-10-2026',
        requestedTo: 'Arunachalam S (Super Admin)',
        approverRole: 'super-admin',
        status: 'Approved',
        approverRemarks: 'Sanctioned.',
        approvalHistory: [
            {
                action: 'Applied',
                actor: 'Savitri Devi',
                timestamp: '19-10-2026 08:00 AM',
                remarks: '',
            },
            {
                action: 'Approved',
                actor: 'Arunachalam S',
                timestamp: '19-10-2026 09:15 AM',
                remarks: 'Sanctioned.',
            },
        ],
    },
    // PRM Leave & Permission sample requests
    {
        id: 'LR-2026-008',
        leaveRequestId: 'LR-2026-008',
        employeeId: 'EMP-PRM-001',
        employeeName: 'Kavita Reddy',
        requestedBy: 'Kavita Reddy',
        submitterRole: 'prm',
        category: 'Non-Academic',
        department: 'Public Relations & Reception',
        designation: 'Public Relations Manager',
        leaveCategory: 'Casual Leave',
        leaveType: 'Casual Leave',
        leaveTypeCode: 'CL',
        fromDate: '12-10-2026',
        toDate: '13-10-2026',
        totalDays: 2,
        isHalfDay: false,
        reason: 'Family wedding event attendance in Bangalore.',
        appliedOn: '08-10-2026',
        appliedDate: '08-10-2026',
        requestedTo: 'Human Resources Department (Sunita Deshmukh)',
        approverRole: 'hr',
        status: 'Approved',
        approverRemarks: 'Sanctioned under Non-Academic CL entitlement.',
        approvalHistory: [
            {
                action: 'Applied',
                actor: 'Kavita Reddy',
                timestamp: '08-10-2026 09:30 AM',
                remarks: 'Family wedding attendance',
            },
            {
                action: 'Approved',
                actor: 'Sunita Deshmukh (HR Manager)',
                timestamp: '08-10-2026 11:15 AM',
                remarks: 'Sanctioned under Non-Academic CL entitlement.',
            },
        ],
    },
    {
        id: 'LR-2026-009',
        leaveRequestId: 'LR-2026-009',
        employeeId: 'EMP-PRM-001',
        employeeName: 'Kavita Reddy',
        requestedBy: 'Kavita Reddy',
        submitterRole: 'prm',
        category: 'Non-Academic',
        department: 'Public Relations & Reception',
        designation: 'Public Relations Manager',
        leaveCategory: 'Permission',
        leaveType: 'Permission (Short Leave)',
        leaveTypeCode: 'PERM',
        fromDate: '22-10-2026',
        toDate: '22-10-2026',
        totalDays: 0,
        permissionHours: 2,
        permissionSession: 'Morning Session (08:30 AM - 10:30 AM)',
        isHalfDay: false,
        reason: 'Bank branch visit for school admission fee reconciliation docs.',
        appliedOn: '21-10-2026',
        appliedDate: '21-10-2026',
        requestedTo: 'Human Resources Department (Sunita Deshmukh)',
        approverRole: 'hr',
        status: 'Approved',
        approverRemarks: 'Permission sanctioned for 2 hours (Morning Session).',
        approvalHistory: [
            {
                action: 'Applied',
                actor: 'Kavita Reddy',
                timestamp: '21-10-2026 10:00 AM',
                remarks: 'Bank visit for official accounts work.',
            },
            {
                action: 'Approved',
                actor: 'Sunita Deshmukh (HR Manager)',
                timestamp: '21-10-2026 10:45 AM',
                remarks: 'Permission sanctioned for 2 hours (Morning Session).',
            },
        ],
    },
]

// ==========================================
// 7. STORAGE ACCESSORS & SYNCHRONIZATION
// ==========================================

let _memoryAttendance = null
let _memoryLeaveRequests = null
let _memoryHrPolicies = null
let _memoryDepartmentShifts = null

export const getAttendanceRecords = () => {
    const ensureRecordMetadata = (list) =>
        list.map((r) => ({
            ...r,
            source: r.source || 'BIOMETRIC_DEVICE',
            deviceId: r.deviceId || 'DEV-ESSL-01',
            overrideHistory: Array.isArray(r.overrideHistory) ? r.overrideHistory : [],
        }))

    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return ensureRecordMetadata(parsed)
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryAttendance && Array.isArray(_memoryAttendance) && _memoryAttendance.length > 0) {
        return ensureRecordMetadata(_memoryAttendance)
    }
    const initial = ensureRecordMetadata(generateInitialAttendanceRecords())
    saveAttendanceRecords(initial)
    return initial
}

export const saveAttendanceRecords = (records) => {
    _memoryAttendance = records
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records))
        }
    } catch {
        /* ignore */
    }
}

export const getLeaveRequests = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LEAVE_REQUESTS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryLeaveRequests && Array.isArray(_memoryLeaveRequests) && _memoryLeaveRequests.length > 0) {
        return _memoryLeaveRequests
    }
    saveLeaveRequests(INITIAL_LEAVE_REQUESTS)
    return INITIAL_LEAVE_REQUESTS
}

export const saveLeaveRequests = (requests) => {
    _memoryLeaveRequests = requests
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LEAVE_REQUESTS_STORAGE_KEY, JSON.stringify(requests))
        }
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(LEAVE_REQUESTS_STORAGE_KEY, JSON.stringify(requests))
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('schoolerp-leave-requests-updated'))
        }
    } catch {
        /* ignore */
    }
}

export const getHrPolicies = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(HR_POLICIES_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (parsed && parsed.academic && parsed.nonAcademic) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryHrPolicies && _memoryHrPolicies.academic && _memoryHrPolicies.nonAcademic) {
        return _memoryHrPolicies
    }
    saveHrPolicies(DEFAULT_HR_POLICIES)
    return DEFAULT_HR_POLICIES
}

export const saveHrPolicies = (policies) => {
    _memoryHrPolicies = policies
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(HR_POLICIES_STORAGE_KEY, JSON.stringify(policies))
        }
    } catch {
        /* ignore */
    }
}

export const getDepartmentShifts = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(SHIFT_CONFIG_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryDepartmentShifts && Array.isArray(_memoryDepartmentShifts) && _memoryDepartmentShifts.length > 0) {
        return _memoryDepartmentShifts
    }
    saveDepartmentShifts(DEFAULT_DEPARTMENT_SHIFTS)
    return DEFAULT_DEPARTMENT_SHIFTS
}

export const saveDepartmentShifts = (shifts) => {
    _memoryDepartmentShifts = shifts
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(SHIFT_CONFIG_STORAGE_KEY, JSON.stringify(shifts))
        }
    } catch {
        /* ignore */
    }
}

// ==========================================
// 8. AUTOMATIC LEAVE BALANCE & CARRY-FORWARD ENGINE
// ==========================================

/**
 * Calculates dynamic leave balance for an employee based on assigned HR policy,
 * approved utilized leaves, pending requests, opening balance, and carry-forward limits.
 */
export const calculateEmployeeLeaveBalance = (employeeId, academicYear = CURRENT_ACADEMIC_YEAR) => {
    const employee = ENTERPRISE_EMPLOYEES.find((e) => e.id === employeeId)
    const category = employee?.category === 'Academic' ? 'academic' : 'nonAcademic'
    const policies = getHrPolicies()[category]
    const allRequests = getLeaveRequests()

    // Filter requests for this employee in this academic year
    const empRequests = allRequests.filter(
        (r) => r.employeeId === employeeId && r.status !== 'Rejected'
    )

    // Opening balances (illustrative simulation based on carry-forward rules from previous year)
    const openingBalances = {
        CL: 3,
        SL: 4,
        EL: 5,
        ML: 2,
        CompOff: 1,
        MatL: 0,
        LOP: 0,
        PERM: 0,
    }

    const balanceBreakdown = policies.categories.map((cat) => {
        const opening = openingBalances[cat.code] || 0
        const annual = cat.annualEntitlement

        // Current month factor (October is month 5 of academic year June-May)
        const currentMonthIndex = 5
        const accrued = Number((cat.monthlyAccrual * currentMonthIndex).toFixed(1))

        let approvedDays = 0
        let pendingDays = 0

        if (cat.code === 'PERM') {
            approvedDays = empRequests.filter((r) => {
                const lt = String(r?.leaveType || r?.leaveCategory || r?.leaveTypeCode || '').toLowerCase()
                return (lt.includes('permission') || r.leaveTypeCode === 'PERM') && r.status === 'Approved'
            }).length

            pendingDays = empRequests.filter((r) => {
                const lt = String(r?.leaveType || r?.leaveCategory || r?.leaveTypeCode || '').toLowerCase()
                return (lt.includes('permission') || r.leaveTypeCode === 'PERM') && r.status === 'Pending'
            }).length
        } else {
            // Approved used days
            approvedDays = empRequests
                .filter((r) => {
                    const lt = String(r?.leaveType || r?.leaveTypeCode || '').toLowerCase()
                    return lt.includes(cat.name.toLowerCase()) && r.status === 'Approved'
                })
                .reduce((sum, r) => sum + Number(r.totalDays || 0), 0)

            // Pending days
            pendingDays = empRequests
                .filter((r) => {
                    const lt = String(r?.leaveType || r?.leaveTypeCode || '').toLowerCase()
                    return lt.includes(cat.name.toLowerCase()) && r.status === 'Pending'
                })
                .reduce((sum, r) => sum + Number(r.totalDays || 0), 0)
        }

        const totalAvailable = Math.max(0, opening + annual - approvedDays)
        const netAvailableAfterPending = Math.max(0, totalAvailable - pendingDays)

        // Eligible carry-forward if year-end occurred
        const eligibleCarryForward = cat.carryForwardAllowed
            ? Math.min(totalAvailable, cat.maxCarryForward)
            : 0

        return {
            code: cat.code,
            name: cat.name,
            openingBalance: opening,
            annualAllocation: annual,
            accrued,
            used: approvedDays,
            pending: pendingDays,
            availableBalance: totalAvailable,
            netAvailableAfterPending,
            carryForwardAllowed: cat.carryForwardAllowed,
            maxCarryForward: cat.maxCarryForward,
            eligibleCarryForward,
            utilizationPercentage: annual > 0 ? Math.min(100, Math.round((approvedDays / (opening + annual)) * 100)) : 0,
        }
    })

    const totalOpening = balanceBreakdown.reduce((sum, b) => sum + b.openingBalance, 0)
    const totalAllocated = balanceBreakdown.reduce((sum, b) => sum + b.annualAllocation, 0)
    const totalUsed = balanceBreakdown.reduce((sum, b) => sum + b.used, 0)
    const totalPending = balanceBreakdown.reduce((sum, b) => sum + b.pending, 0)
    const totalAvailable = balanceBreakdown.reduce((sum, b) => sum + b.availableBalance, 0)
    const totalCarryForward = balanceBreakdown.reduce((sum, b) => sum + b.eligibleCarryForward, 0)

    return {
        employeeId,
        employeeName: employee?.name || 'Employee',
        category: employee?.category || 'Academic',
        department: employee?.department || 'General',
        leaveYear: policies.leaveYear,
        summary: {
            openingBalance: totalOpening,
            annualAllocation: totalAllocated,
            used: totalUsed,
            pending: totalPending,
            availableBalance: totalAvailable,
            eligibleCarryForward: totalCarryForward,
        },
        categories: balanceBreakdown,
    }
}

// ==========================================
// 9. LEAVE APPROVAL & ATTENDANCE SYNCHRONIZER
// ==========================================

/**
 * Approves, rejects, or cancels a leave request with database transaction semantics.
 * Synchronizes attendance ledger so approved leaves reflect as 'On Leave'.
 */
export const canRoleDecideLeave = (role) => {
    const r = (role || '').toLowerCase().trim()
    return r === 'hr' || r === 'super-admin' || r.includes('human-resources')
}

export const updateLeaveRequestDecision = (requestId, decision, arg3, arg4, authorizedRole) => {
    let approverName = 'Approver'
    let remarks = ''

    if (typeof arg3 === 'string' && typeof arg4 === 'string') {
        if (arg4.startsWith('Dr.') || arg4 === 'Principal' || arg3.length > arg4.length + 15) {
            remarks = arg3.trim()
            approverName = arg4.trim()
        } else {
            approverName = arg3.trim()
            remarks = arg4.trim()
        }
    } else if (typeof arg3 === 'string') {
        remarks = arg3.trim()
    }

    // Role guard: Only HR and Super Admin can make accept/reject decisions
    const roleKey = (authorizedRole || '').toLowerCase().trim()
    if (decision === 'Approved' || decision === 'Rejected') {
        if (roleKey && roleKey !== 'hr' && roleKey !== 'super-admin' && !roleKey.includes('human-resources')) {
            throw new Error('Unauthorized: Only Human Resources (HR) is authorized to accept or reject leave applications. Department heads and leadership have view-only access.')
        }
    }

    if (decision === 'Rejected' && (!remarks || !remarks.trim())) {
        throw new Error('Rejection rationale is mandatory when rejecting a leave application.')
    }

    const requests = getLeaveRequests()
    const target = requests.find((r) => r.id === requestId)
    if (!target) return { success: false, message: 'Request not found.' }

    const oldStatus = target.status
    target.status = decision
    target.approverRemarks = remarks || target.approverRemarks
    target.reviewedBy = approverName
    target.reviewRemarks = remarks

    const nowStr = new Date().toLocaleString('en-GB')
    target.approvalHistory = [
        ...(target.approvalHistory || []),
        {
            action: decision,
            actor: approverName || 'Approver',
            timestamp: nowStr,
            remarks: remarks || '',
        },
    ]

    saveLeaveRequests(requests)

    const attendanceRecords = getAttendanceRecords()

    if (decision === 'Approved') {
        const isPerm = target.leaveTypeCode === 'PERM' || (target.leaveCategory || '').toLowerCase().includes('permission')
        const updatedAttendance = attendanceRecords.map((att) => {
            if (att.employeeId === target.employeeId) {
                if (isPerm) {
                    return {
                        ...att,
                        status: att.status === 'Absent' ? 'Present' : att.status,
                        remarks: `Approved Permission: ${target.permissionHours || 2}h (${target.permissionSession || 'Morning'}). ${remarks || ''}`.trim(),
                        leaveRequestId: target.id,
                    }
                }
                return {
                    ...att,
                    status: 'On Leave',
                    remarks: `Approved: ${target.leaveCategory} (Ref: ${target.id}). ${remarks || ''}`.trim(),
                    leaveRequestId: target.id,
                }
            }
            return att
        })
        saveAttendanceRecords(updatedAttendance)
    } else if ((oldStatus === 'Approved' || target.status === 'Cancelled') && (decision === 'Cancelled' || decision === 'Rejected')) {
        const updatedAttendance = attendanceRecords.map((att) => {
            if (att.employeeId === target.employeeId && (att.status === 'On Leave' || att.leaveRequestId === target.id)) {
                return {
                    ...att,
                    status: 'Present',
                    remarks: 'Leave cancelled/reversed. Restored to regular shift.',
                    leaveRequestId: null,
                }
            }
            return att
        })
        saveAttendanceRecords(updatedAttendance)
    }

    return {
        success: true,
        request: target,
        ledger: getAttendanceRecords(),
        message: `Leave request ${requestId} marked as ${decision}.`
    }
}

// ==========================================
// 10. ROLE-BASED ACCESS & PERMISSION RESOLVERS
// ==========================================

/**
 * Returns authorized attendance records based on authenticated user role and email.
 */
export const FULL_ACCESS_MANAGEMENT_ROLES = [
    'director',
    'principal',
    'super-admin',
    'admin',
    'hr',
    'management',
    'prm',
    'joint-director',
    'joint-director-assistant',
    'joint-director-audit'
]

export const getAuthorizedAttendanceRecords = (userRole, departmentOrEmail, employeeId) => {
    const allRecords = getAttendanceRecords()
    const normalizedRole = (userRole || '').trim().toLowerCase()
    const normalizedArg2 = (departmentOrEmail || '').trim().toLowerCase()

    if (FULL_ACCESS_MANAGEMENT_ROLES.includes(normalizedRole)) {
        return allRecords
    }

    if (normalizedRole === 'coordinator' || normalizedRole === 'academic_head') {
        return allRecords.filter((r) => r.category === 'Academic' || r.department.includes('Academic') || r.employeeId === employeeId)
    }

    const departmentHeadMap = {
        'stationery-store-manager': 'Stores & Procurement',
        'transport-manager': 'Transport & Fleet Logistics',
        'account-head': 'Finance & Accounts',
        'it-support-manager': 'IT Support & Systems',
        'gatekeeper-manager': 'Campus Security & Access Control',
        'housekeeping-manager': 'Facilities & Campus Sanitation',
        'maintenance-manager': 'Campus Infrastructure & Maintenance',
        'maintenancemanager': 'Campus Infrastructure & Maintenance',
        'canteen-manager': 'Dining & Nutrition (Café)',
    }

    const assignedDept = departmentHeadMap[normalizedRole]
    if (assignedDept) {
        return allRecords.filter((r) => r.department === assignedDept)
    }

    const targetEmpId = employeeId || ENTERPRISE_EMPLOYEES.find(
        (e) => e.id === employeeId || e.email.toLowerCase() === normalizedArg2 || (e.roleKey === normalizedRole && (!employeeId || e.id === employeeId))
    )?.id

    if (targetEmpId) {
        return allRecords.filter((r) => r.employeeId === targetEmpId)
    }

    return allRecords.slice(0, 1)
}

/**
 * Returns authorized subordinate leave requests for review/approval.
 */
export const getAuthorizedReceivedLeaveRequests = (userRole, userEmail) => {
    const allRequests = getLeaveRequests()
    const normalizedRole = (userRole || '').trim().toLowerCase()

    // 1. Management & Full-Access Roles: All subordinate requests
    if (FULL_ACCESS_MANAGEMENT_ROLES.includes(normalizedRole)) {
        return allRequests
    }

    // 2. Principal: All academic leave requests + school staff
    if (normalizedRole === 'principal') {
        return allRequests.filter(
            (r) => r.category === 'Academic' || r.approverRole === 'principal'
        )
    }

    // 3. Coordinator: Teacher leave requests
    if (normalizedRole === 'coordinator') {
        return allRequests.filter(
            (r) => r.submitterRole === 'teacher' || r.approverRole === 'coordinator'
        )
    }

    // 4. Department Heads: Subordinates in their department
    const deptHeadMap = {
        'transport-manager': 'Transport & Fleet Logistics',
        'stationery-store-manager': 'Stores & Procurement',
        'gatekeeper-manager': 'Campus Security & Access Control',
        'it-support-manager': 'IT Support & Systems',
        'housekeeping-manager': 'Facilities & Campus Sanitation',
        'maintenance-manager': 'Campus Infrastructure & Maintenance',
        'maintenancemanager': 'Campus Infrastructure & Maintenance',
        'canteen-manager': 'Dining & Nutrition (Café)',
        'account-head': 'Finance & Accounts',
    }

    const dept = deptHeadMap[normalizedRole]
    if (dept) {
        return allRequests.filter(
            (r) => r.department === dept && r.submitterRole !== normalizedRole
        )
    }

    // 5. Individual employee: No received requests (only submit own)
    return []
}

/**
 * Returns employee's own submitted leave requests.
 */
export const getMyLeaveRequests = (userRoleOrId, userEmail) => {
    const allRequests = getLeaveRequests()
    const input = (userRoleOrId || '').trim()

    // If direct employee ID passed (e.g. 'EMP-TCH-006')
    if (input.startsWith('EMP-')) {
        return allRequests.filter((r) => r.employeeId === input)
    }

    const normalizedEmail = (userEmail || '').trim().toLowerCase()
    const currentEmp = ENTERPRISE_EMPLOYEES.find(
        (e) => e.email.toLowerCase() === normalizedEmail || e.roleKey === input.toLowerCase()
    )

    if (currentEmp) {
        return allRequests.filter((r) => r.employeeId === currentEmp.id)
    }

    return allRequests.filter((r) => r.submitterRole === input)
}

// ==========================================
// 11. CONVENIENCE ALIASES & EXPORTED UTILITIES
// ==========================================

export const DEPARTMENT_SHIFTS = DEFAULT_DEPARTMENT_SHIFTS
export const SEED_ATTENDANCE_LEDGER = generateInitialAttendanceRecords()
export const SEED_LEAVE_REQUESTS = INITIAL_LEAVE_REQUESTS

export const calculateOverviewKPIs = (records, leaves, totalCount) => {
    const recordList = records || []
    const leaveList = leaves || []
    const totalEmployees = totalCount || recordList.length
    const presentToday = recordList.filter((r) => r.status === 'Present').length
    const absentToday = recordList.filter((r) => r.status === 'Absent').length
    const onLeaveToday = recordList.filter((r) => r.status === 'On Leave').length
    const lateArrivals = recordList.filter((r) => r.status === 'Late Arrival' || r.lateDurationMinutes > 0).length
    const earlyDepartures = recordList.filter((r) => r.status === 'Early Departure' || r.earlyDepartureMinutes > 0).length
    const pendingLeaveRequests = leaveList.filter((r) => r.status === 'Pending').length
    const approvedLeaveRequests = leaveList.filter((r) => r.status === 'Approved').length
    const presentPercentage = totalEmployees > 0 ? Number(((presentToday / totalEmployees) * 100).toFixed(1)) : 0
    const latePercentage = totalEmployees > 0 ? Number(((lateArrivals / totalEmployees) * 100).toFixed(1)) : 0

    return {
        totalEmployees,
        presentToday,
        presentPercentage,
        absentToday,
        onLeaveToday,
        lateArrivals,
        latePercentage,
        earlyDepartures,
        pendingLeaveRequests,
        approvedLeaveRequests,
    }
}

export const getPolicyForCategory = (category) => {
    const policies = getHrPolicies() || DEFAULT_HR_POLICIES
    const isNonAcad = (category || '').toLowerCase().includes('non')
    return isNonAcad
        ? (policies.nonAcademic || DEFAULT_HR_POLICIES.nonAcademic)
        : (policies.academic || DEFAULT_HR_POLICIES.academic)
}

export const submitLeaveRequest = (data) => {
    const category = String(data.leaveType || data.leaveCategory || 'Casual Leave').trim()
    const isPermission = category.toLowerCase().includes('permission')

    if (isPermission) {
        const hours = Number(data.permissionHours || data.totalHours || (data.totalDays ? data.totalDays * 8 : 1))
        if (hours > 2) {
            throw new Error('Permission request cannot exceed a maximum of 2 hours as per institutional HR policy. For extended absence, please apply for Half Day Casual Leave.')
        }
    }

    const requests = getLeaveRequests()
    const newId = `LR-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`
    const newReq = {
        id: newId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        department: data.department,
        designation: data.designation,
        leaveCategory: category,
        leaveTypeCode: data.leaveTypeCode || (isPermission ? 'PERM' : 'CL'),
        fromDate: data.startDate || data.fromDate,
        toDate: data.endDate || data.toDate,
        totalDays: isPermission ? 0 : (data.totalDays || (data.isHalfDay ? 0.5 : 1)),
        permissionHours: isPermission ? Math.min(2, Number(data.permissionHours || data.totalHours || 1)) : null,
        isHalfDay: Boolean(data.isHalfDay),
        reason: data.reason || '',
        appliedOn: new Date().toLocaleDateString('en-GB'),
        status: 'Pending',
        documentName: data.documentName || null,
        approverRemarks: '',
        approvalHistory: [
            {
                action: 'Submitted',
                actor: data.employeeName,
                timestamp: new Date().toLocaleString('en-GB'),
                remarks: 'Initial application submitted',
            },
        ],
    }
    const updated = [newReq, ...requests]
    saveLeaveRequests(updated)
    return newReq
}

export const cancelLeaveRequest = (requestId, remarks) => {
    const res = updateLeaveRequestDecision(requestId, 'Cancelled', 'Employee', remarks)
    const requests = getLeaveRequests()
    const target = requests.find((r) => r.id === requestId)
    const ledger = getAttendanceRecords()
    return {
        success: res.success,
        request: target,
        ledger,
    }
}



// ==========================================
// 12. ATTENDANCE REGULARIZATION & OVERRIDE LEDGER
// ==========================================

export const CORRECTION_REQUESTS_STORAGE_KEY = 'schoolerp-attendance-corrections-v1'
export const STUDENT_ATTENDANCE_STORAGE_KEY = 'schoolerp-student-attendance-v1'

export const INITIAL_CORRECTION_REQUESTS = [
    {
        id: 'CORR-2026-001',
        employeeId: 'EMP-TCH-003',
        employeeName: 'Rajesh Kulkarni',
        department: 'Academics & Teaching',
        designation: 'Senior Faculty - Mathematics',
        attendanceDate: '31-10-2026',
        requestType: 'MISSING_PUNCH', // 'MISSING_PUNCH' | 'MACHINE_ERROR' | 'ON_DUTY' | 'INCORRECT_SHIFT'
        requestedInTime: '08:30 AM',
        requestedOutTime: '03:45 PM',
        shiftName: 'Academic Morning Shift',
        reason: 'Biometric thumb scanner failed at Staff Room DEV-ESSL-02 upon arrival; reported to HOD.',
        status: 'Pending', // 'Pending' | 'Approved' | 'Rejected'
        appliedOn: '31-10-2026 09:15 AM',
        approverRole: null,
        approverName: null,
        approvedAt: null,
        approverRemarks: null,
        originalSnapshot: {
            status: 'Late Arrival',
            checkInTime: '08:48 AM',
            checkOutTime: '03:45 PM',
            source: 'BIOMETRIC_DEVICE',
        },
    },
    {
        id: 'CORR-2026-002',
        employeeId: 'EMP-STR-001',
        employeeName: 'Murugan P',
        department: 'Stores & Procurement',
        designation: 'Stores and Stationery Manager',
        attendanceDate: '30-10-2026',
        requestType: 'ON_DUTY',
        requestedInTime: '09:00 AM',
        requestedOutTime: '05:30 PM',
        shiftName: 'Warehouse Operations Shift',
        reason: 'Vendor warehouse visit for stationery bulk purchase verification and dispatch inspection.',
        status: 'Approved',
        appliedOn: '30-10-2026 04:00 PM',
        approverRole: 'principal',
        approverName: 'Dr. Ramanathan K (Principal)',
        approvedAt: '30-10-2026 05:15 PM',
        approverRemarks: 'Approved against verified Material Request note #MR-2026-042.',
        originalSnapshot: {
            status: 'Absent',
            checkInTime: '--:--',
            checkOutTime: '--:--',
            source: 'BIOMETRIC_DEVICE',
        },
    },
    {
        id: 'CORR-2026-003',
        employeeId: 'EMP-DRV-001',
        employeeName: 'Ramesh Yadav',
        department: 'Transport & Fleet Logistics',
        designation: 'Senior Route Driver - Route 4',
        attendanceDate: '29-10-2026',
        requestType: 'MACHINE_ERROR',
        requestedInTime: '06:30 AM',
        requestedOutTime: '05:00 PM',
        shiftName: 'Fleet Dual-Route Split Shift',
        reason: 'Transport depot device DEV-ESSL-04 rebooted during morning bus departure.',
        status: 'Approved',
        appliedOn: '29-10-2026 07:30 AM',
        approverRole: 'transport_manager',
        approverName: 'Suresh Patil (Transport Manager)',
        approvedAt: '29-10-2026 08:00 AM',
        approverRemarks: 'Confirmed route dispatch log #RT-04 departure at 06:32 AM.',
        originalSnapshot: {
            status: 'Missing Out-Punch',
            checkInTime: '06:30 AM',
            checkOutTime: '--:--',
            source: 'BIOMETRIC_DEVICE',
        },
    },
]

let _memoryCorrectionRequests = null

export const getCorrectionRequests = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(CORRECTION_REQUESTS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryCorrectionRequests && Array.isArray(_memoryCorrectionRequests)) {
        return _memoryCorrectionRequests
    }
    _memoryCorrectionRequests = [...INITIAL_CORRECTION_REQUESTS]
    saveCorrectionRequests(_memoryCorrectionRequests)
    return _memoryCorrectionRequests
}

export const saveCorrectionRequests = (requests) => {
    _memoryCorrectionRequests = requests
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(CORRECTION_REQUESTS_STORAGE_KEY, JSON.stringify(requests))
        }
    } catch {
        /* ignore */
    }
}

export const submitAttendanceRegularization = (data) => {
    const requests = getCorrectionRequests()
    const newId = `CORR-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`
    const newReq = {
        id: newId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        department: data.department || 'Academics & Teaching',
        designation: data.designation || 'Staff Member',
        attendanceDate: data.attendanceDate || data.date,
        requestType: data.requestType || 'MISSING_PUNCH',
        requestedInTime: data.requestedInTime || '08:30 AM',
        requestedOutTime: data.requestedOutTime || '03:45 PM',
        shiftName: data.shiftName || 'Standard Shift',
        reason: data.reason || 'Attendance regularization submitted.',
        status: 'Pending',
        appliedOn: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        approverRole: null,
        approverName: null,
        approvedAt: null,
        approverRemarks: null,
        originalSnapshot: data.originalSnapshot || {
            status: 'Missing Out-Punch',
            checkInTime: data.requestedInTime || '08:30 AM',
            checkOutTime: '--:--',
            source: 'BIOMETRIC_DEVICE',
        },
    }
    const updated = [newReq, ...requests]
    saveCorrectionRequests(updated)
    return newReq
}

export const approveAttendanceRegularization = (correctionId, approverRole, approverName, remarks) => {
    const requests = getCorrectionRequests()
    const target = requests.find((r) => r.id === correctionId)
    if (!target) throw new Error(`Correction request ${correctionId} not found.`)

    target.status = 'Approved'
    target.approverRole = approverRole || 'supervisor'
    target.approverName = approverName || 'Approver'
    target.approvedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    target.approverRemarks = remarks || 'Approved by supervisor.'
    saveCorrectionRequests(requests)

    // Synchronize into attendance ledger
    const ledger = getAttendanceRecords()
    const recordIndex = ledger.findIndex(
        (r) => r.employeeId === target.employeeId && r.date === target.attendanceDate
    )

    if (recordIndex >= 0) {
        const current = ledger[recordIndex]
        const historyEntry = {
            originalStatus: current.status,
            originalCheckIn: current.checkInTime,
            originalCheckOut: current.checkOutTime,
            reason: target.reason,
            authorizedBy: target.approverName,
            timestamp: target.approvedAt,
            changeSource: 'REGULARIZED',
        }

        ledger[recordIndex] = {
            ...current,
            checkInTime: target.requestedInTime,
            checkOutTime: target.requestedOutTime,
            status: 'Present',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            source: 'REGULARIZED',
            overrideHistory: [historyEntry, ...(current.overrideHistory || [])],
        }
    } else {
        const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === target.employeeId)
        const historyEntry = {
            originalStatus: 'Missing Punch',
            originalCheckIn: '--:--',
            originalCheckOut: '--:--',
            reason: target.reason,
            authorizedBy: target.approverName,
            timestamp: target.approvedAt,
            changeSource: 'REGULARIZED',
        }
        ledger.unshift({
            id: `ATT-REG-${Date.now()}`,
            employeeId: target.employeeId,
            employeeName: target.employeeName || emp?.name || 'Employee',
            department: target.department || emp?.department || 'General',
            category: emp?.category || 'Academic',
            designation: target.designation || emp?.designation || 'Staff',
            date: target.attendanceDate,
            checkInTime: target.requestedInTime,
            checkOutTime: target.requestedOutTime,
            workingHours: '7h 15m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: target.shiftName || 'Standard Shift',
            status: 'Present',
            source: 'REGULARIZED',
            overrideHistory: [historyEntry],
        })
    }
    saveAttendanceRecords(ledger)

    return { success: true, request: target }
}

export const rejectAttendanceRegularization = (correctionId, approverRole, approverName, remarks) => {
    if (!remarks || !remarks.trim()) {
        throw new Error('Rejection remarks are mandatory.')
    }
    const requests = getCorrectionRequests()
    const target = requests.find((r) => r.id === correctionId)
    if (!target) throw new Error(`Correction request ${correctionId} not found.`)

    target.status = 'Rejected'
    target.approverRole = approverRole || 'supervisor'
    target.approverName = approverName || 'Approver'
    target.approvedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    target.approverRemarks = remarks.trim()
    saveCorrectionRequests(requests)

    return { success: true, request: target }
}

export const directAdminAttendanceOverride = (
    param1,
    dateArg,
    newCheckInTimeArg,
    newCheckOutTimeArg,
    newStatusArg,
    reasonArg,
    authorizedByNameArg
) => {
    let recordId, employeeId, date, newCheckInTime, newCheckOutTime, newStatus, reason, authorizedByRole, authorizedByName
    if (typeof param1 === 'object' && param1 !== null) {
        ({
            recordId,
            employeeId,
            date,
            newCheckInTime,
            newCheckOutTime,
            newStatus,
            reason,
            authorizedByRole,
            authorizedByName,
        } = param1)
    } else {
        employeeId = param1
        date = dateArg
        newCheckInTime = newCheckInTimeArg
        newCheckOutTime = newCheckOutTimeArg
        newStatus = newStatusArg
        reason = reasonArg
        authorizedByName = authorizedByNameArg
    }

    if (!reason || !reason.trim()) {
        throw new Error('Audit justification reason is mandatory for manual override.')
    }
    const ledger = getAttendanceRecords()
    const index = ledger.findIndex((r) => r.id === recordId || (r.employeeId === employeeId && r.date === date))

    const auditEntry = {
        originalStatus: index >= 0 ? ledger[index].status : 'Absent',
        originalCheckIn: index >= 0 ? ledger[index].checkInTime : '--:--',
        originalCheckOut: index >= 0 ? ledger[index].checkOutTime : '--:--',
        reason: reason.trim(),
        authorizedBy: authorizedByName || authorizedByRole || 'Administrator',
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        changeSource: 'MANUAL_OVERRIDE',
    }

    if (index >= 0) {
        ledger[index] = {
            ...ledger[index],
            checkInTime: newCheckInTime || ledger[index].checkInTime,
            checkOutTime: newCheckOutTime || ledger[index].checkOutTime,
            status: newStatus || ledger[index].status,
            remarks: `Admin Override: ${reason.trim()}`,
            source: 'MANUAL_OVERRIDE',
            overrideHistory: [auditEntry, ...(ledger[index].overrideHistory || [])],
        }
    } else {
        // Create new overridden record
        const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === employeeId)
        ledger.unshift({
            id: recordId || `ATT-MAN-${Date.now()}`,
            employeeId,
            employeeName: emp?.name || 'Employee',
            department: emp?.department || 'General',
            category: emp?.category || 'Academic',
            designation: emp?.designation || 'Staff',
            date,
            checkInTime: newCheckInTime || '08:30 AM',
            checkOutTime: newCheckOutTime || '03:45 PM',
            workingHours: '7h 15m',
            lateDurationMinutes: 0,
            lateFormatted: '0m',
            earlyDepartureMinutes: 0,
            earlyFormatted: '0m',
            shiftName: 'Standard Shift',
            status: newStatus || 'Present',
            remarks: `Admin Override: ${reason.trim()}`,
            source: 'MANUAL_OVERRIDE',
            overrideHistory: [auditEntry],
        })
    }
    const updatedRecord = index >= 0 ? ledger[index] : ledger[0]
    saveAttendanceRecords(ledger)
    return { success: true, ...updatedRecord, record: updatedRecord, ledger }
}

export const getAuthorizedCorrectionRequests = (userRole, userEmail) => {
    const all = getCorrectionRequests()
    const normalizedRole = (userRole || '').toLowerCase()

    // Org-wide leadership and HR see all
    if (
        normalizedRole.includes('admin') ||
        normalizedRole.includes('super') ||
        normalizedRole.includes('director') ||
        normalizedRole.includes('principal') ||
        normalizedRole.includes('hr')
    ) {
        return all
    }

    // Managers/HODs see department
    const managerEmp = ENTERPRISE_EMPLOYEES.find((e) => e.email === userEmail || e.roleKey === normalizedRole)
    if (managerEmp && (normalizedRole.includes('manager') || normalizedRole.includes('coordinator') || normalizedRole.includes('head'))) {
        return all.filter((r) => r.department === managerEmp.department)
    }

    // Individual employee
    return all.filter((r) => r.employeeId === managerEmp?.id || (userEmail && r.employeeName === managerEmp?.name))
}

// ==========================================
// 13. STUDENT CLASS ATTENDANCE ENGINE
// ==========================================

export const INITIAL_STUDENT_ROSTERS = [
    // Class 10 - Section A
    { id: 'STU-10A-001', studentId: 'STU-2025-1001', rollNo: '10-A-01', studentName: 'Aarav Sharma', gender: 'Male', className: '10', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10A-002', studentId: 'STU-2025-1002', rollNo: '10-A-02', studentName: 'Ananya Deshmukh', gender: 'Female', className: '10', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10A-003', studentId: 'STU-2025-1003', rollNo: '10-A-03', studentName: 'Devansh Reddy', gender: 'Male', className: '10', section: 'A', status: 'Late', remarks: 'Late arrival - school bus delay (Route 2)', markedTimestamp: '31-10-2026 08:45 AM' },
    { id: 'STU-10A-004', studentId: 'STU-2025-1004', rollNo: '10-A-04', studentName: 'Diya Patel', gender: 'Female', className: '10', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10A-005', studentId: 'STU-2025-1005', rollNo: '10-A-05', studentName: 'Ishaan Verma', gender: 'Male', className: '10', section: 'A', status: 'Absent', remarks: 'Medical leave informed by guardian', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10A-006', studentId: 'STU-2025-1006', rollNo: '10-A-06', studentName: 'Kavya Nair', gender: 'Female', className: '10', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10A-007', studentId: 'STU-2025-1007', rollNo: '10-A-07', studentName: 'Manish Kumar', gender: 'Male', className: '10', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10A-008', studentId: 'STU-2025-1008', rollNo: '10-A-08', studentName: 'Nisha Sundaram', gender: 'Female', className: '10', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10A-009', studentId: 'STU-2025-1009', rollNo: '10-A-09', studentName: 'Rohan Mehra', gender: 'Male', className: '10', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10A-010', studentId: 'STU-2025-1010', rollNo: '10-A-10', studentName: 'Sanya Mukherjee', gender: 'Female', className: '10', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },

    // Class 10 - Section B
    { id: 'STU-10B-001', studentId: 'STU-2025-1021', rollNo: '10-B-01', studentName: 'Aditya Joshi', gender: 'Male', className: '10', section: 'B', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10B-002', studentId: 'STU-2025-1022', rollNo: '10-B-02', studentName: 'Bhavna Kulkarni', gender: 'Female', className: '10', section: 'B', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10B-003', studentId: 'STU-2025-1023', rollNo: '10-B-03', studentName: 'Chirag Bhatia', gender: 'Male', className: '10', section: 'B', status: 'Absent', remarks: 'Uninformed absent', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-10B-004', studentId: 'STU-2025-1024', rollNo: '10-B-04', studentName: 'Divya Iyer', gender: 'Female', className: '10', section: 'B', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },

    // Class 9 - Section A
    { id: 'STU-9A-001', studentId: 'STU-2025-0901', rollNo: '09-A-01', studentName: 'Farhan Zaidi', gender: 'Male', className: '9', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-9A-002', studentId: 'STU-2025-0902', rollNo: '09-A-02', studentName: 'Gauri Pillai', gender: 'Female', className: '9', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-9A-003', studentId: 'STU-2025-0903', rollNo: '09-A-03', studentName: 'Harsh Vardhan', gender: 'Male', className: '9', section: 'A', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },

    // Class 9 - Section B
    { id: 'STU-9B-001', studentId: 'STU-2025-0921', rollNo: '09-B-01', studentName: 'Ira Saxena', gender: 'Female', className: '9', section: 'B', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
    { id: 'STU-9B-002', studentId: 'STU-2025-0922', rollNo: '09-B-02', studentName: 'Jatin Chawla', gender: 'Male', className: '9', section: 'B', status: 'Present', remarks: '', markedTimestamp: '31-10-2026 08:30 AM' },
]

let _memoryStudentRoster = null

export const getStudentAttendanceRecords = (className, section) => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STUDENT_ATTENDANCE_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return filterStudentRoster(parsed, className, section)
                }
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryStudentRoster && Array.isArray(_memoryStudentRoster)) {
        return filterStudentRoster(_memoryStudentRoster, className, section)
    }
    _memoryStudentRoster = [...INITIAL_STUDENT_ROSTERS]
    saveStudentAttendanceRecords(_memoryStudentRoster)
    return filterStudentRoster(_memoryStudentRoster, className, section)
}

const filterStudentRoster = (list, className, section) => {
    let result = list
    if (className && className !== 'all') {
        result = result.filter((s) => String(s.className) === String(className))
    }
    if (section && section !== 'all') {
        result = result.filter((s) => s.section.toUpperCase() === section.toUpperCase())
    }
    return result
}

export const getAllStudentAttendanceRecords = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STUDENT_ATTENDANCE_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    return _memoryStudentRoster || INITIAL_STUDENT_ROSTERS
}

export const saveStudentAttendanceRecords = (records) => {
    _memoryStudentRoster = records
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STUDENT_ATTENDANCE_STORAGE_KEY, JSON.stringify(records))
        }
    } catch {
        /* ignore */
    }
}

export const updateStudentAttendanceStatus = (studentId, status, remarks) => {
    const all = getAllStudentAttendanceRecords()
    const updated = all.map((s) => {
        if (s.id === studentId || s.studentId === studentId) {
            return {
                ...s,
                status,
                remarks: remarks !== undefined ? remarks : s.remarks,
                markedTimestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
        }
        return s
    })
    saveStudentAttendanceRecords(updated)
    return updated
}

export const markAllStudentAttendance = (className, section, status = 'Present', markedBy = '') => {
    const all = getAllStudentAttendanceRecords()
    const updated = all.map((s) => {
        const matchClass = !className || className === 'all' || String(s.className) === String(className)
        const matchSection = !section || section === 'all' || (s.section && s.section.toUpperCase() === section.toUpperCase())
        if (matchClass && matchSection) {
            return {
                ...s,
                status,
                markedBy: markedBy || s.markedBy,
                markedTimestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
        }
        return s
    })
    saveStudentAttendanceRecords(updated)
    return updated
}

// ==========================================
// 14. CENTRALIZED LEAVE LEDGER & CARRY-FORWARD ENGINE
// ==========================================

export const INITIAL_LEAVE_LEDGER_TRANSACTIONS = [
    {
        id: 'TX-INIT-001',
        employeeId: 'EMP-TCH-006',
        employeeName: 'Ananya Roy',
        department: 'Academics & Teaching',
        leaveTypeCode: 'CL',
        leaveTypeName: 'Casual Leave',
        leaveYear: '2025-2026',
        transactionType: 'Annual Entitlement',
        creditedDays: 12,
        debitedDays: 0,
        carryForwardDays: 0,
        expiredDays: 0,
        previousBalance: 0,
        newBalance: 12,
        referenceId: 'POL-ACAD-2025',
        performedBy: 'HR Administrator',
        timestamp: '01/06/2025, 09:00:00',
        remarks: 'Annual statutory entitlement allocation for 2025-2026'
    },
    {
        id: 'TX-INIT-002',
        employeeId: 'EMP-TCH-006',
        employeeName: 'Ananya Roy',
        department: 'Academics & Teaching',
        leaveTypeCode: 'EL',
        leaveTypeName: 'Earned / Vacation Leave',
        leaveYear: '2025-2026',
        transactionType: 'Carry-Forward Credit',
        creditedDays: 5,
        debitedDays: 0,
        carryForwardDays: 5,
        expiredDays: 2,
        previousBalance: 0,
        newBalance: 5,
        referenceId: 'CF-2024-2025',
        performedBy: 'HR Administrator',
        timestamp: '01/06/2025, 09:05:00',
        remarks: 'Carry-forward from 2024-2025: 5 days credited (max limit 15), 2 days expired.'
    },
    {
        id: 'TX-INIT-003',
        employeeId: 'EMP-ADM-001',
        employeeName: 'Suresh Raina',
        department: 'Administration',
        leaveTypeCode: 'CL',
        leaveTypeName: 'Casual Leave',
        leaveYear: '2025-2026',
        transactionType: 'Annual Entitlement',
        creditedDays: 14,
        debitedDays: 0,
        carryForwardDays: 0,
        expiredDays: 0,
        previousBalance: 0,
        newBalance: 14,
        referenceId: 'POL-NONACAD-2025',
        performedBy: 'HR Administrator',
        timestamp: '01/04/2025, 09:00:00',
        remarks: 'Annual statutory entitlement allocation for 2025-2026'
    }
]

let _memoryLeaveLedger = null

export const getLeaveLedger = (employeeId = null, leaveYear = null) => {
    let transactions = []
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LEAVE_LEDGER_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    transactions = parsed
                }
            }
        }
    } catch {
        /* ignore */
    }

    if (transactions.length === 0) {
        if (_memoryLeaveLedger && Array.isArray(_memoryLeaveLedger) && _memoryLeaveLedger.length > 0) {
            transactions = _memoryLeaveLedger
        } else {
            transactions = [...INITIAL_LEAVE_LEDGER_TRANSACTIONS]
            saveLeaveLedger(transactions)
        }
    }

    if (employeeId) {
        transactions = transactions.filter((t) => t.employeeId === employeeId)
    }
    if (leaveYear) {
        transactions = transactions.filter((t) => t.leaveYear === leaveYear)
    }

    return transactions
}

export const saveLeaveLedger = (transactions) => {
    _memoryLeaveLedger = transactions
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LEAVE_LEDGER_STORAGE_KEY, JSON.stringify(transactions))
        }
    } catch {
        /* ignore */
    }
}

export const addLedgerTransaction = (tx) => {
    const all = getLeaveLedger()
    const newTx = {
        id: tx.id || `TX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: tx.timestamp || new Date().toLocaleString('en-GB'),
        ...tx
    }
    all.unshift(newTx)
    saveLeaveLedger(all)
    return newTx
}

/**
 * Calculates working days between two dates, excluding Sundays, 2nd & 4th Saturdays, and holidays.
 */
export const calculateWorkingDays = (startDateStr, endDateStr, isHalfDay = false) => {
    if (!startDateStr || !endDateStr) return 0
    if (isHalfDay) return 0.5

    const parseDate = (dStr) => {
        if (!dStr) return null
        const parts = String(dStr).trim().split(/[-/]/)
        if (parts.length === 3) {
            if (parts[0].length === 4) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
            if (parts[2].length === 4) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
        }
        return new Date(dStr)
    }

    const start = parseDate(startDateStr)
    const end = parseDate(endDateStr)
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0

    let workingDays = 0
    const current = new Date(start)

    while (current <= end) {
        const dayOfWeek = current.getDay() // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0) {
            current.setDate(current.getDate() + 1)
            continue
        }

        if (dayOfWeek === 6) {
            const dateNum = current.getDate()
            const isSecondSat = dateNum >= 8 && dateNum <= 14
            const isFourthSat = dateNum >= 22 && dateNum <= 28
            if (isSecondSat || isFourthSat) {
                current.setDate(current.getDate() + 1)
                continue
            }
        }

        const dayMonth = `${String(current.getDate()).padStart(2, '0')}-${String(current.getMonth() + 1).padStart(2, '0')}`
        const institutionalHolidays = ['02-10', '15-08', '26-01', '25-12', '01-01', '01-05']
        if (institutionalHolidays.includes(dayMonth)) {
            current.setDate(current.getDate() + 1)
            continue
        }

        workingDays += 1
        current.setDate(current.getDate() + 1)
    }

    return workingDays === 0 ? 1 : workingDays
}

/**
 * Previews carry-forward calculations at end of leave year.
 */
export const previewCarryForward = ({ staffCategory = 'Academic', sourceYear = '2025-2026', targetYear = '2026-2027' }) => {
    const employees = ENTERPRISE_EMPLOYEES.filter((e) => e.category === staffCategory)
    const existingTransactions = getLeaveLedger()
    const results = []

    employees.forEach((emp) => {
        const balance = calculateEmployeeLeaveBalance(emp.id, sourceYear)
        balance.categories.forEach((cat) => {
            const alreadyProcessed = existingTransactions.some(
                (t) =>
                    t.employeeId === emp.id &&
                    t.leaveTypeCode === cat.code &&
                    (t.sourceYear === sourceYear || t.referenceId?.includes(sourceYear) || (t.leaveYear === targetYear && t.transactionType === 'Carry-Forward Credit'))
            )

            const remaining = cat.availableBalance
            const allowed = Boolean(cat.carryForwardAllowed)
            const maxCap = cat.maxCarryForward || 0
            const eligibleCarryForward = allowed ? Math.min(remaining, maxCap) : 0
            const expiringDays = allowed ? Math.max(0, remaining - eligibleCarryForward) : remaining

            results.push({
                employeeId: emp.id,
                employeeName: emp.name,
                department: emp.department,
                staffCategory,
                leaveTypeCode: cat.code,
                leaveTypeName: cat.name,
                remainingBalance: remaining,
                carryForwardAllowed: allowed,
                maxLimit: maxCap,
                eligibleCarryForward,
                expiringDays,
                sourceYear,
                targetYear,
                alreadyProcessed
            })
        })
    })

    return results
}

/**
 * Idempotently executes carry-forward calculations at end of leave year.
 */
export const executeCarryForward = ({ staffCategory = 'Academic', sourceYear = '2025-2026', targetYear = '2026-2027', performedBy = 'HR Administrator' }) => {
    const preview = previewCarryForward({ staffCategory, sourceYear, targetYear })
    const ledger = getLeaveLedger()
    const nowTimestamp = new Date().toLocaleString('en-GB')
    let processedCount = 0
    let skippedCount = 0

    preview.forEach((item) => {
        if (item.alreadyProcessed) {
            skippedCount++
            return
        }

        if (item.eligibleCarryForward > 0) {
            const txCredit = {
                id: `TX-CF-${item.employeeId}-${item.leaveTypeCode}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                employeeId: item.employeeId,
                employeeName: item.employeeName,
                department: item.department,
                leaveTypeCode: item.leaveTypeCode,
                leaveTypeName: item.leaveTypeName,
                leaveYear: targetYear,
                sourceYear,
                targetYear,
                transactionType: 'Carry-Forward Credit',
                creditedDays: item.eligibleCarryForward,
                debitedDays: 0,
                carryForwardDays: item.eligibleCarryForward,
                expiredDays: item.expiringDays,
                referenceId: `CF-${sourceYear}-${targetYear}`,
                performedBy,
                timestamp: nowTimestamp,
                remarks: `Carry-forward from ${sourceYear}: credited ${item.eligibleCarryForward} days (max cap ${item.maxLimit}), expired ${item.expiringDays} days.`
            }
            ledger.unshift(txCredit)
            processedCount++
        } else if (item.expiringDays > 0) {
            const txExp = {
                id: `TX-EXP-${item.employeeId}-${item.leaveTypeCode}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                employeeId: item.employeeId,
                employeeName: item.employeeName,
                department: item.department,
                leaveTypeCode: item.leaveTypeCode,
                leaveTypeName: item.leaveTypeName,
                leaveYear: sourceYear,
                sourceYear,
                targetYear,
                transactionType: 'Leave Expiry',
                creditedDays: 0,
                debitedDays: item.expiringDays,
                carryForwardDays: 0,
                expiredDays: item.expiringDays,
                referenceId: `EXP-${sourceYear}`,
                performedBy,
                timestamp: nowTimestamp,
                remarks: `Year-end expiry: ${item.expiringDays} days lapsed as per ${staffCategory} leave policy.`
            }
            ledger.unshift(txExp)
            processedCount++
        } else {
            const txClose = {
                id: `TX-CLO-${item.employeeId}-${item.leaveTypeCode}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                employeeId: item.employeeId,
                employeeName: item.employeeName,
                department: item.department,
                leaveTypeCode: item.leaveTypeCode,
                leaveTypeName: item.leaveTypeName,
                leaveYear: sourceYear,
                sourceYear,
                targetYear,
                transactionType: 'Year-End Closure',
                creditedDays: 0,
                debitedDays: 0,
                carryForwardDays: 0,
                expiredDays: 0,
                referenceId: `CLO-${sourceYear}`,
                performedBy,
                timestamp: nowTimestamp,
                remarks: `Year-end closure: 0 days to carry forward or expire.`
            }
            ledger.unshift(txClose)
            processedCount++
        }
    })

    saveLeaveLedger(ledger)

    recordAuditLog({
        actorName: performedBy,
        module: 'Attendance & Leave',
        action: 'EXECUTE_CARRY_FORWARD',
        entityId: `CF-${staffCategory}-${sourceYear}-${targetYear}`,
        previousState: `${sourceYear} Balances`,
        newState: `${targetYear} Carry-Forward Applied`,
        remarks: `Executed carry-forward for ${staffCategory} staff. Processed: ${processedCount}, Skipped: ${skippedCount}.`
    })

    return {
        success: true,
        processedCount,
        skippedCount,
        totalItems: preview.length,
        message: `Carry-forward completed for ${staffCategory} staff. ${processedCount} records processed, ${skippedCount} skipped (already processed).`
    }
}

/**
 * HR Adjustment for employee leave balances.
 */
export const adjustEmployeeLeaveBalance = ({ employeeId, leaveTypeCode, adjustmentType = 'CREDIT', days = 1, remarks = '', performedBy = 'HR Administrator' }) => {
    const employee = ENTERPRISE_EMPLOYEES.find((e) => e.id === employeeId)
    if (!employee) throw new Error('Employee not found.')
    const numDays = Number(days)
    if (isNaN(numDays) || numDays <= 0) throw new Error('Valid number of days required.')
    if (!remarks || !remarks.trim()) throw new Error('Adjustment remarks / audit reason are mandatory.')

    const ledger = getLeaveLedger()
    const nowTimestamp = new Date().toLocaleString('en-GB')
    const tx = {
        id: `TX-ADJ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        employeeId,
        employeeName: employee.name,
        department: employee.department,
        leaveTypeCode,
        leaveTypeName: leaveTypeCode,
        leaveYear: CURRENT_ACADEMIC_YEAR,
        transactionType: 'HR Adjustment',
        creditedDays: adjustmentType === 'CREDIT' ? numDays : 0,
        debitedDays: adjustmentType === 'DEBIT' ? numDays : 0,
        carryForwardDays: 0,
        expiredDays: 0,
        referenceId: `HR-ADJ-${Date.now()}`,
        performedBy,
        timestamp: nowTimestamp,
        remarks: `${adjustmentType === 'CREDIT' ? 'Credit' : 'Debit'} adjustment: ${numDays} days. Reason: ${remarks.trim()}`
    }

    ledger.unshift(tx)
    saveLeaveLedger(ledger)

    recordAuditLog({
        actorName: performedBy,
        module: 'Attendance & Leave',
        action: 'LEAVE_BALANCE_ADJUSTMENT',
        entityId: employeeId,
        previousState: 'Balance',
        newState: `${adjustmentType} ${numDays} days`,
        remarks: remarks.trim()
    })

    return tx
}

/**
 * Updates a policy category in HR policies with full audit logging.
 */
export const updateHrPolicyCategory = (staffCategory, updatedCategoryData, performedBy = 'HR Administrator') => {
    const policies = getHrPolicies()
    const key = staffCategory.toLowerCase() === 'academic' ? 'academic' : 'nonAcademic'
    const policyGroup = policies[key] || DEFAULT_HR_POLICIES[key]

    const catIndex = policyGroup.categories.findIndex((c) => c.code === updatedCategoryData.code)
    let oldVal = 'None'
    if (catIndex >= 0) {
        oldVal = JSON.stringify(policyGroup.categories[catIndex])
        policyGroup.categories[catIndex] = {
            ...policyGroup.categories[catIndex],
            ...updatedCategoryData
        }
    } else {
        policyGroup.categories.push(updatedCategoryData)
    }

    policies[key] = policyGroup
    saveHrPolicies(policies)

    recordAuditLog({
        actorName: performedBy,
        module: 'Attendance & Leave',
        action: 'UPDATE_HR_LEAVE_POLICY',
        entityId: `${staffCategory}-${updatedCategoryData.code}`,
        previousState: oldVal,
        newState: JSON.stringify(updatedCategoryData),
        remarks: `Updated leave policy for ${staffCategory} - ${updatedCategoryData.name || updatedCategoryData.code}`
    })

    return policyGroup
}

/**
 * Check if the active role can administer HR policies.
 */
export const canUserManagePolicies = (role) => {
    const r = (role || '').trim().toLowerCase()
    return ['hr', 'super-admin', 'admin'].includes(r)
}

/**
 * Returns dynamic KPI metrics matching Section 2 specification.
 */
export const getRoleAwareKPIs = (userRole, employeeId, userEmail) => {
    const normalizedRole = (userRole || '').trim().toLowerCase()
    const isLeadership = FULL_ACCESS_MANAGEMENT_ROLES.includes(normalizedRole)

    const isDeptHead = [
        'coordinator',
        'stationery-store-manager',
        'transport-manager',
        'account-head',
        'it-support-manager',
        'gatekeeper-manager',
        'housekeeping-manager',
        'maintenance-manager',
        'maintenancemanager',
        'canteen-manager'
    ].includes(normalizedRole)

    if (isLeadership || isDeptHead) {
        const authorizedAttendance = getAuthorizedAttendanceRecords(userRole, userEmail, employeeId)
        const authorizedRequests = getAuthorizedReceivedLeaveRequests(userRole, userEmail)
        const staffCount = isLeadership ? ENTERPRISE_EMPLOYEES.length : authorizedAttendance.length

        const presentToday = authorizedAttendance.filter((r) => r.status === 'Present' || r.status === 'Late Arrival').length
        const onLeaveToday = authorizedAttendance.filter((r) => r.status === 'On Leave').length
        const pendingApprovals = authorizedRequests.filter((r) => r.status === 'Pending').length

        return {
            isManagement: true,
            totalStaff: staffCount,
            presentToday,
            onLeaveToday,
            pendingLeaveApprovals: pendingApprovals
        }
    } else {
        const empId =
            employeeId ||
            ENTERPRISE_EMPLOYEES.find(
                (e) => e.email.toLowerCase() === (userEmail || '').toLowerCase() || e.roleKey === normalizedRole
            )?.id ||
            'EMP-TCH-006'
        const attendance = getAttendanceRecords().filter((r) => r.employeeId === empId)
        const presentDays = attendance.filter((r) => r.status === 'Present' || r.status === 'Late Arrival').length

        const balance = calculateEmployeeLeaveBalance(empId)
        const myRequests = getMyLeaveRequests(empId)
        const pendingLeaveRequests = myRequests.filter((r) => r.status === 'Pending').length
        const approvedLeaveDays = myRequests
            .filter((r) => r.status === 'Approved')
            .reduce((sum, r) => sum + Number(r.totalDays || 0), 0)

        return {
            isManagement: false,
            presentDays,
            leaveBalance: balance.summary.availableBalance,
            pendingLeaveRequests,
            approvedLeaveDays
        }
    }
}

