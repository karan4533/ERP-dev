/**
 * Gate Pass & Campus Security Verification Data Engine
 * Single Source of Truth for:
 * - Student Gate Pass Lifecycle (Request -> Principal / Director of Academics OR-based Approval -> QR Gate Pass -> Gatekeeper Verification -> Gatekeeper Manager)
 * - Front-Office Visitor Management (Fast Check-in -> Printable Badge -> Gatekeeper Active Sync -> Check-out & History)
 * - Returnable & Non-Returnable Material & Goods Passes
 * - Unified Gatekeeper Workspace KPIs & Movement Registers
 * - Immutable Enterprise Security Audit Logs
 */

import { recordAuditLog, dispatchNotification, getAuditLogs } from '../AuditAndNotifications/centralAuditEngine.js'
import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData.js'

export const GATE_PASS_STORAGE_KEY = 'schoolerp-gate-passes-v1'
export const VISITOR_LOG_STORAGE_KEY = 'schoolerp-visitor-gate-logs-v1'
export const STUDENT_GATE_PASS_STORAGE_KEY = 'schoolerp-student-gate-passes-v1'
export const LEGACY_STUDENT_GATE_PASS_KEY = 'student-gate-pass-front-office'

export const CAMPUS_NAME = 'Queen Mira International School'

export const STUDENT_GATE_PASS_STATUSES = [
    'Draft',
    'Pending Approval',
    'Approved',
    'Ready for Exit',
    'Exit Recorded',
    'Returned',
    'Rejected',
    'Cancelled',
    'Overdue',
]

export const VISITOR_STATUSES = [
    'Registered',
    'Checked In',
    'Checked Out',
    'Cancelled',
]

export const statusBadgeColor = {
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
    'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Ready for Exit': 'bg-blue-50 text-blue-700 border-blue-200',
    'Exit Recorded': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Returned': 'bg-slate-100 text-slate-700 border-slate-300',
    'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
    'Cancelled': 'bg-gray-100 text-gray-500 border-gray-200',
    'Overdue': 'bg-red-50 text-red-700 border-red-300',
    'Overdue Return': 'bg-red-50 text-red-700 border-red-300'
}

export const ID_PROOF_TYPES = [
    'Aadhaar Card',
    'Driving License',
    'Voter ID',
    'Passport',
    'Company ID / Govt ID',
    'Other Photo ID',
]

export const DEFAULT_STUDENT_DIRECTORY = [
    {
        studentId: 'STU-2025-1001',
        studentName: 'Aarav Sharma',
        className: '10',
        section: 'A',
        classSection: 'Grade 10 A',
        gender: 'Male',
        mobileNumber: '+91 98401 22334',
        city: 'Madurai',
        parentName: 'Suresh Sharma',
        parentPhone: '+91 98401 22334',
        department: 'Academics - Secondary'
    },
    {
        studentId: 'STU-2025-1002',
        studentName: 'Riya Sen',
        className: '8',
        section: 'B',
        classSection: 'Grade 8 B',
        gender: 'Female',
        mobileNumber: '+91 94440 11223',
        city: 'Madurai',
        parentName: 'Debabrata Sen',
        parentPhone: '+91 94440 11223',
        department: 'Academics - Middle School'
    },
    {
        studentId: 'STU-2025-1003',
        studentName: 'Rohan Verma',
        className: '11',
        section: 'Science',
        classSection: 'Grade 11 Science',
        gender: 'Male',
        mobileNumber: '+91 98840 99881',
        city: 'Madurai',
        parentName: 'Manish Verma',
        parentPhone: '+91 98840 99881',
        department: 'Academics - Senior Secondary'
    },
    {
        studentId: 'STU-2025-1004',
        studentName: 'Ananya Iyer',
        className: '9',
        section: 'A',
        classSection: 'Grade 9 A',
        gender: 'Female',
        mobileNumber: '+91 97900 44332',
        city: 'Madurai',
        parentName: 'S. Ramanathan Iyer',
        parentPhone: '+91 97900 44332',
        department: 'Academics - Secondary'
    },
    {
        studentId: 'STU-2025-1005',
        studentName: 'Dhruv Patel',
        className: '12',
        section: 'Commerce',
        classSection: 'Grade 12 Commerce',
        gender: 'Male',
        mobileNumber: '+91 98410 77665',
        city: 'Madurai',
        parentName: 'Bhavesh Patel',
        parentPhone: '+91 98410 77665',
        department: 'Academics - Senior Secondary'
    },
    {
        studentId: 'STU-2025-1006',
        studentName: 'Meera Nair',
        className: '7',
        section: 'A',
        classSection: 'Grade 7 A',
        gender: 'Female',
        mobileNumber: '+91 98402 33445',
        city: 'Madurai',
        parentName: 'K. Unnikrishnan Nair',
        parentPhone: '+91 98402 33445',
        department: 'Academics - Middle School'
    }
]

let _memoryGatePasses = null
let _memoryVisitorLogs = null
let _memoryStudentGatePasses = null

// Initial Material & Asset Gate Passes
export const INITIAL_GATE_PASSES = [
    {
        id: 'GP-2026-001',
        passType: 'Material',
        materialType: 'Returnable',
        requestDate: '30-10-2026',
        requesterId: 'EMP-TCH-014',
        requesterName: 'Priya Menon',
        department: 'Academics & Teaching',
        responsiblePerson: 'Jaswant Singh (School Driver)',
        responsibleContact: '+91 98410 77231',
        destination: 'City Convention Center, Hall B, Annual Science Olympiad Expo',
        purpose: 'School project presentation and dynamic robotics demo.',
        items: [
            { itemCode: 'IT-PRJ-DL', description: 'Dell 4K Laser Classroom Projector', serialNo: 'DL-PRJ-99214', qty: 1, uom: 'Units', condition: 'Excellent' },
            { itemCode: 'IT-AV-SPK', description: 'Bose Portable PA Speaker System with Mic', serialNo: 'BOS-PA-4410', qty: 1, uom: 'Sets', condition: 'Good' }
        ],
        expectedReturnDate: '01-11-2026',
        vehicleNumber: 'TN 09 BX 4412 (School Van #04)',
        carrierName: 'Jaswant Singh',
        status: 'Security Cleared Out',
        approverChain: [
            { actor: 'Priya Menon', role: 'Teacher', action: 'Submitted', timestamp: '30-10-2026 09:00 AM', remarks: 'Inter-school competition materials.' },
            { actor: 'Dr. Ramanathan K', role: 'Principal', action: 'Approved', timestamp: '30-10-2026 10:15 AM', remarks: 'Sanctioned for institutional representation.' },
            { actor: 'Gurpreet Singh', role: 'Store Officer', action: 'Stores Verified', timestamp: '30-10-2026 11:00 AM', remarks: 'Asset tag verified in store register.' },
            { actor: 'Bhawani Singh', role: 'Security Manager', action: 'Security Cleared Out', timestamp: '30-10-2026 11:45 AM', remarks: 'Physical verification completed at Main Gate #1. Van exited.' }
        ],
        actualExitTimestamp: '30-10-2026 11:45 AM',
        actualEntryTimestamp: null,
        securityOfficerExit: 'Bhawani Singh',
        securityOfficerEntry: null,
        returnConditionNotes: ''
    },
    {
        id: 'GP-2026-002',
        passType: 'Material',
        materialType: 'Non-Returnable',
        requestDate: '31-10-2026',
        requesterId: 'EMP-ADM-001',
        requesterName: 'Suresh Raina',
        department: 'Administration',
        responsiblePerson: 'Courier Dispatch (BlueDart Express)',
        responsibleContact: '+91 94440 12890',
        destination: 'Central Board of Secondary Education (CBSE) Regional Office, Chennai',
        purpose: 'Official submission of Grade 10 & 12 Examination Enrollment physical dossiers and certificates.',
        items: [
            { itemCode: 'DOC-ENV-01', description: 'CBSE Enrollment Sealed Package', serialNo: 'SEAL-CBSE-2026-09', qty: 2, uom: 'Boxes', condition: 'Sealed' }
        ],
        expectedReturnDate: null,
        vehicleNumber: 'TN 02 CC 8891 (BlueDart Courier Van)',
        carrierName: 'Karthik Raja',
        status: 'HOD Approved',
        approverChain: [
            { actor: 'Suresh Raina', role: 'Admin Officer', action: 'Submitted', timestamp: '31-10-2026 09:30 AM', remarks: 'Urgent compliance dispatch.' },
            { actor: 'Arunachalam S', role: 'Super Admin', action: 'Approved', timestamp: '31-10-2026 10:00 AM', remarks: 'Approved for external courier dispatch.' }
        ],
        actualExitTimestamp: null,
        actualEntryTimestamp: null,
        securityOfficerExit: null,
        securityOfficerEntry: null,
        returnConditionNotes: ''
    },
    {
        id: 'GP-2026-003',
        passType: 'Material',
        materialType: 'Returnable',
        requestDate: '26-10-2026',
        requesterId: 'EMP-STR-001',
        requesterName: 'Gurpreet Singh',
        department: 'Stores & Procurement',
        responsiblePerson: 'Service Technician (Canon Service Hub)',
        responsibleContact: '+91 98840 99124',
        destination: 'Canon Authorized Repair Center, Mount Road',
        purpose: 'Replacement of defective optical drum unit and circuit board diagnostics.',
        items: [
            { itemCode: 'PRN-CAN-IR2525', description: 'Canon imageRUNNER 2525 Heavy Duty Copier', serialNo: 'CAN-IR-88412', qty: 1, uom: 'Units', condition: 'Service Required' }
        ],
        expectedReturnDate: '29-10-2026', // Past date -> Overdue!
        vehicleNumber: 'TN 07 AA 1234 (Service Pickup)',
        carrierName: 'Venkatesh Babu',
        status: 'Overdue',
        approverChain: [
            { actor: 'Gurpreet Singh', role: 'Store Officer', action: 'Submitted', timestamp: '26-10-2026 10:00 AM', remarks: 'Warranty repair.' },
            { actor: 'Arunachalam S', role: 'Super Admin', action: 'Approved', timestamp: '26-10-2026 11:30 AM', remarks: 'Sanctioned.' },
            { actor: 'Ram Singh', role: 'Gatekeeper', action: 'Security Cleared Out', timestamp: '26-10-2026 01:15 PM', remarks: 'Copier unit loaded in pickup truck.' }
        ],
        actualExitTimestamp: '26-10-2026 01:15 PM',
        actualEntryTimestamp: null,
        securityOfficerExit: 'Ram Singh',
        securityOfficerEntry: null,
        returnConditionNotes: ''
    }
]

// Initial Visitor Records (Synchronized with Front-Office & Gatekeeper)
export const INITIAL_VISITOR_LOGS = [
    {
        id: 'VIS-2026-0038',
        visitorName: 'Ramesh Kumar',
        phone: '+91 98410 12345',
        visitorOrganization: 'Individual Visitor',
        personToMeet: 'Dr. Kavita Sharma',
        department: 'Academics & Teaching',
        purpose: 'Academic counseling and term progress review',
        idProofType: 'Aadhaar Card',
        idProofNumber: 'XXXX-XXXX-4512',
        numberOfVisitors: 1,
        entryDate: '05-11-2026',
        entryTime: '09:30 AM',
        exitTime: null,
        badgeNumber: 'VIS-B-1038',
        badgeBarcode: 'BAR-VIS-1038',
        gateNumber: 'Gate #1 (Main Gate)',
        recordedBy: 'Kavita Reddy (PRM / Front Office)',
        status: 'Checked In',
        campusName: CAMPUS_NAME
    },
    {
        id: 'VIS-2026-0039',
        visitorName: 'Priya Menon',
        phone: '+91 98402 67890',
        visitorOrganization: 'Individual Visitor',
        personToMeet: 'Admin Office',
        department: 'Administration',
        purpose: 'Fee receipt clearance and document verification',
        idProofType: 'Driving License',
        idProofNumber: 'DL-TN-09-2020-55112',
        numberOfVisitors: 1,
        entryDate: '05-11-2026',
        entryTime: '08:45 AM',
        exitDate: '05-11-2026',
        exitTime: '09:20 AM',
        visitDuration: '35 minutes',
        badgeNumber: 'VIS-B-1039',
        badgeBarcode: 'BAR-VIS-1039',
        gateNumber: 'Gate #1 (Main Gate)',
        recordedBy: 'Kavita Reddy (PRM / Front Office)',
        status: 'Checked Out',
        campusName: CAMPUS_NAME
    },
    {
        id: 'VIS-2026-0041',
        visitorName: 'Rajesh Kumar',
        phone: '+91 98401 98765',
        visitorOrganization: 'Pearson India Education',
        personToMeet: 'Priya Menon',
        department: 'Academics & Teaching',
        purpose: 'Annual Curriculum textbook review and digital lab software licensing',
        idProofType: 'Driving License',
        idProofNumber: 'DL-TN-09-2021-88412',
        numberOfVisitors: 1,
        entryDate: '05-11-2026',
        entryTime: '10:15 AM',
        exitTime: null,
        badgeNumber: 'VIS-B-1041',
        badgeBarcode: 'BAR-VIS-1041',
        gateNumber: 'Gate #1 (Main Gate)',
        recordedBy: 'Kavita Reddy (PRM / Front Office)',
        status: 'Checked In',
        campusName: CAMPUS_NAME
    },
    {
        id: 'VIS-2026-0040',
        visitorName: 'Sunita Deshpande',
        phone: '+91 98840 55441',
        visitorOrganization: 'Prospective Parent',
        personToMeet: 'Dr. Ramanathan K',
        department: 'Academics & Teaching',
        purpose: 'Grade 9 New Admission Campus Tour & Assessment Discussion',
        idProofType: 'Aadhaar Card',
        idProofNumber: 'XXXX-XXXX-8821',
        numberOfVisitors: 2,
        entryDate: '05-11-2026',
        entryTime: '09:30 AM',
        exitTime: '11:00 AM',
        badgeNumber: 'VIS-B-1040',
        badgeBarcode: 'BAR-VIS-1040',
        gateNumber: 'Gate #1 (Main Gate)',
        recordedBy: 'Kavita Reddy (PRM / Front Office)',
        status: 'Checked Out',
        campusName: CAMPUS_NAME
    },
    {
        id: 'VIS-2026-0042',
        visitorName: 'Vikram Mehra',
        phone: '+91 94440 12399',
        visitorOrganization: 'Dell Tech Support India',
        personToMeet: 'Ramesh Kumar',
        department: 'IT Support',
        purpose: 'Server Room UPS routine bi-monthly battery bank maintenance',
        idProofType: 'Company ID / Govt ID',
        idProofNumber: 'DELL-ENG-4412',
        numberOfVisitors: 1,
        entryDate: '05-11-2026',
        entryTime: '11:00 AM',
        exitTime: null,
        badgeNumber: 'VIS-B-1042',
        badgeBarcode: 'BAR-VIS-1042',
        gateNumber: 'Gate #2 (Service Gate)',
        recordedBy: 'Kavita Reddy (PRM / Front Office)',
        status: 'Checked In',
        campusName: CAMPUS_NAME
    }
]

// Initial Student Gate Passes (Real-world synchronized passes)
export const INITIAL_STUDENT_GATE_PASSES = [
    {
        id: 'GP-STU-2026-0042',
        gatePassId: 'GP-STU-2026-0042',
        studentId: 'STU-2025-1001',
        studentName: 'Aarav Sharma',
        classSection: 'Grade 10 A',
        department: 'Academics - Secondary',
        gender: 'Male',
        mobileNumber: '+91 98401 22334',
        city: 'Madurai',
        reason: 'Orthopedic hospital appointment at Apollo Specialty Hospital',
        date: '05-11-2026',
        expectedDepartureTime: '11:30 AM',
        expectedReturnTime: '03:00 PM',
        accompanyingPerson: 'Suresh Sharma (Father, Contact: +91 98401 22334)',
        parentGuardianInfo: 'Suresh Sharma (Father) - Verified via phone call at 09:45 AM',
        remarks: 'Doctor appointment slip submitted to PRM.',
        status: 'Approved', // Ready for Exit
        displayStatus: 'Approved / Ready for Exit',
        requesterName: 'Kavita Reddy',
        requesterRole: 'prm',
        requestedAt: '05-11-2026 10:00 AM',
        approvedBy: {
            name: 'Dr. Ramanathan K',
            role: 'principal',
            roleLabel: 'Principal',
            timestamp: '05-11-2026 10:15 AM',
            remarks: 'Sanctioned on medical grounds.'
        },
        actualDepartureTime: null,
        actualReturnTime: null,
        exitGatekeeper: null,
        returnGatekeeper: null,
        qrCodeValue: 'GP-STU-2026-0042|STU-2025-1001|Aarav Sharma|10A|APPR:Dr. Ramanathan K',
        createdAt: '2026-11-05T04:30:00.000Z'
    },
    {
        id: 'GP-STU-2026-0038',
        gatePassId: 'GP-STU-2026-0038',
        studentId: 'STU-2025-1002',
        studentName: 'Riya Sen',
        classSection: 'Grade 8 B',
        department: 'Academics - Middle School',
        gender: 'Female',
        mobileNumber: '+91 94440 11223',
        city: 'Madurai',
        reason: 'Inter-school South Zone debate tournament at TVS Academy',
        date: '05-11-2026',
        expectedDepartureTime: '09:00 AM',
        expectedReturnTime: '02:00 PM',
        accompanyingPerson: 'Priya Menon (Faculty In-Charge)',
        parentGuardianInfo: 'Debabrata Sen (Parent consent form signed)',
        remarks: 'School representing delegation.',
        status: 'Exit Recorded',
        displayStatus: 'Exit Recorded',
        requesterName: 'Kavita Reddy',
        requesterRole: 'prm',
        requestedAt: '05-11-2026 08:30 AM',
        approvedBy: {
            name: 'Dr. Kavita Sharma',
            role: 'director',
            roleLabel: 'Director of Academics',
            timestamp: '05-11-2026 08:45 AM',
            remarks: 'Authorized for school representation.'
        },
        actualDepartureTime: '05-11-2026 09:05 AM',
        actualReturnTime: null,
        exitGatekeeper: 'Ram Singh',
        returnGatekeeper: null,
        qrCodeValue: 'GP-STU-2026-0038|STU-2025-1002|Riya Sen|8B|APPR:Dr. Kavita Sharma',
        createdAt: '2026-11-05T03:00:00.000Z'
    },
    {
        id: 'REQ-STU-2026-0089',
        gatePassId: 'REQ-STU-2026-0089',
        studentId: 'STU-2025-1003',
        studentName: 'Rohan Verma',
        classSection: 'Grade 11 Science',
        department: 'Academics - Senior Secondary',
        gender: 'Male',
        mobileNumber: '+91 98840 99881',
        city: 'Madurai',
        reason: 'Regional Passport Seva Kendra biometric appointment',
        date: '05-11-2026',
        expectedDepartureTime: '01:30 PM',
        expectedReturnTime: '04:30 PM',
        accompanyingPerson: 'Manish Verma (Father)',
        parentGuardianInfo: 'Manish Verma (+91 98840 99881)',
        remarks: 'Passport slot booked for 02:15 PM.',
        status: 'Pending Approval',
        displayStatus: 'Pending Approval',
        requesterName: 'Kavita Reddy',
        requesterRole: 'prm',
        requestedAt: '05-11-2026 10:45 AM',
        approvedBy: null,
        actualDepartureTime: null,
        actualReturnTime: null,
        exitGatekeeper: null,
        returnGatekeeper: null,
        qrCodeValue: null,
        createdAt: '2026-11-05T05:15:00.000Z'
    },
    {
        id: 'GP-STU-2026-0021',
        gatePassId: 'GP-STU-2026-0021',
        studentId: 'STU-2025-1004',
        studentName: 'Ananya Iyer',
        classSection: 'Grade 9 A',
        department: 'Academics - Secondary',
        gender: 'Female',
        mobileNumber: '+91 97900 44332',
        city: 'Madurai',
        reason: 'Family emergency and personal travel',
        date: '04-11-2026',
        expectedDepartureTime: '11:00 AM',
        expectedReturnTime: '04:00 PM',
        accompanyingPerson: 'S. Ramanathan Iyer (Father)',
        parentGuardianInfo: 'S. Ramanathan Iyer (+91 97900 44332)',
        remarks: 'Parent collected student in person.',
        status: 'Returned',
        displayStatus: 'Returned',
        requesterName: 'Kavita Reddy',
        requesterRole: 'prm',
        requestedAt: '04-11-2026 10:15 AM',
        approvedBy: {
            name: 'Dr. Ramanathan K',
            role: 'principal',
            roleLabel: 'Principal',
            timestamp: '04-11-2026 10:30 AM',
            remarks: 'Approved.'
        },
        actualDepartureTime: '04-11-2026 11:00 AM',
        actualReturnTime: '04-11-2026 03:45 PM',
        exitGatekeeper: 'Ram Singh',
        returnGatekeeper: 'Bhawani Singh',
        qrCodeValue: 'GP-STU-2026-0021|STU-2025-1004|Ananya Iyer|9A|APPR:Dr. Ramanathan K',
        createdAt: '2026-11-04T04:45:00.000Z'
    }
]

/**
 * Dispatch cross-component state synchronization event
 */
const notifyMovementSync = (detail = {}) => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        try {
            window.dispatchEvent(new CustomEvent('schoolerp-gatepass-security-sync', { detail }))
            window.dispatchEvent(new CustomEvent('schoolerp-visitor-updated', { detail }))
            window.dispatchEvent(new CustomEvent('schoolerp-gate-pass-updated', { detail }))
        } catch {
            /* ignore environment without CustomEvent */
        }
    }
}

// ============================================================================
// STUDENT INFORMATION SYSTEM (SIS) LOOKUP HELPERS
// ============================================================================

export const getAvailableStudents = () => {
    // Check if enrolled students exist in localStorage
    if (typeof localStorage !== 'undefined') {
        try {
            const raw = localStorage.getItem('schoolerp-enrolled-students')
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const mapped = parsed.map((s) => ({
                        studentId: s.id || s.studentId || `STU-${s.admissionNumber}`,
                        studentName: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Enrolled Student',
                        className: s.className || s.class || '10',
                        section: s.section || s.classSection || 'A',
                        classSection: `${s.className || 'Grade 10'} ${s.section || 'A'}`.trim(),
                        gender: s.gender || 'Not Specified',
                        mobileNumber: s.mobileNumber || s.contact?.mobileNumber || '+91 98400 00000',
                        city: s.city || s.address?.city || 'Madurai',
                        parentName: s.parent?.fatherName || s.parent?.motherName || 'Parent / Guardian',
                        parentPhone: s.parent?.contact?.mobileNumber || s.mobileNumber || '+91 98400 00000',
                        department: s.department || 'Academics'
                    }))
                    // Merge with defaults so there are always students available
                    const existingIds = new Set(mapped.map((m) => m.studentId))
                    const extras = DEFAULT_STUDENT_DIRECTORY.filter((d) => !existingIds.has(d.studentId))
                    return [...mapped, ...extras]
                }
            }
        } catch {
            /* ignore */
        }
    }
    return DEFAULT_STUDENT_DIRECTORY
}

export const getStudentByDirectoryId = (studentId) => {
    const list = getAvailableStudents()
    return list.find((s) => s.studentId === studentId || s.id === studentId) || null
}

// ============================================================================
// EMPLOYEE / STAFF DIRECTORY (For "Person to Meet" and auto-populating Department)
// ============================================================================

export const getAuthorizedStaffDirectory = () => {
    return ENTERPRISE_EMPLOYEES.map((emp) => ({
        id: emp.id,
        name: emp.name,
        role: emp.roleKey,
        roleLabel: emp.roleLabel,
        department: emp.department,
        designation: emp.designation,
        email: emp.email,
        label: `${emp.name} — ${emp.department} (${emp.designation})`
    }))
}

// ============================================================================
// DURATION CALCULATION ENGINE
// ============================================================================

export const parseDateTimeToMs = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null
    try {
        let d, m, y
        const cleanDate = String(dateStr).trim()
        if (cleanDate.includes('-')) {
            const parts = cleanDate.split('-').map(Number)
            if (parts[0] > 1000) {
                [y, m, d] = parts
            } else {
                [d, m, y] = parts
            }
        } else if (cleanDate.includes('/')) {
            const parts = cleanDate.split('/').map(Number)
            if (parts[0] > 1000) {
                [y, m, d] = parts
            } else {
                [d, m, y] = parts
            }
        } else {
            return null
        }

        const match = String(timeStr).match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i)
        if (!match || !d || !m || !y) return null
        let hour = parseInt(match[1], 10)
        const min = parseInt(match[2], 10)
        const meridiem = match[3] ? match[3].toUpperCase() : null

        if (meridiem === 'PM' && hour < 12) hour += 12
        if (meridiem === 'AM' && hour === 12) hour = 0

        return new Date(y, m - 1, d, hour, min).getTime()
    } catch {
        return null
    }
}

export const formatCompactDuration = (durationStr) => {
    if (!durationStr || durationStr === '—' || durationStr === '-') return '—'
    return durationStr
        .replace(/(\d+)\s*days?/gi, '$1d')
        .replace(/(\d+)\s*hours?/gi, '$1h')
        .replace(/(\d+)\s*minutes?/gi, '$1m')
        .replace(/(\d+)\s*mins?/gi, '$1m')
        .trim()
}

export const calculateVisitDuration = (entryDate, entryTime, exitDate, exitTime, fallbackCreatedAt = null) => {
    let startMs = parseDateTimeToMs(entryDate, entryTime)
    if (!startMs && fallbackCreatedAt) {
        startMs = new Date(fallbackCreatedAt).getTime()
    }
    if (!startMs || isNaN(startMs)) return '—'

    let endMs = null
    if (exitTime) {
        endMs = parseDateTimeToMs(exitDate || entryDate, exitTime)
    }
    if (!endMs || isNaN(endMs)) {
        endMs = Date.now()
    }

    const diffMinutes = Math.max(1, Math.round((endMs - startMs) / (1000 * 60)))
    const days = Math.floor(diffMinutes / (60 * 24))
    const hours = Math.floor((diffMinutes % (60 * 24)) / 60)
    const mins = diffMinutes % 60

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hour${hours > 1 ? 's' : ''}` : ''}`
    }
    if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins > 1 ? 's' : ''}` : ''}`
    }
    return `${mins} minute${mins !== 1 ? 's' : ''}`
}

// ============================================================================
// VISITOR MANAGEMENT ENGINE
// ============================================================================

export const getVisitorLogs = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(VISITOR_LOG_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed)) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryVisitorLogs !== null && Array.isArray(_memoryVisitorLogs)) {
        return _memoryVisitorLogs
    }
    _memoryVisitorLogs = [...INITIAL_VISITOR_LOGS]
    saveVisitorLogs(_memoryVisitorLogs)
    return _memoryVisitorLogs
}

export const saveVisitorLogs = (logs) => {
    _memoryVisitorLogs = logs
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(VISITOR_LOG_STORAGE_KEY, JSON.stringify(logs))
        }
    } catch {
        /* ignore */
    }
    notifyMovementSync({ type: 'VISITORS_SAVED' })
}

export const registerVisitorCheckIn = ({
    visitorName,
    phone,
    visitorOrganization = '',
    personToMeet,
    department,
    purpose,
    idProofType = 'Aadhaar Card',
    idProofNumber = '',
    numberOfVisitors = 1,
    gateNumber = 'Gate #1 (Main Gate)',
    recordedBy = 'Kavita Reddy (PRM / Front Office)',
    status = 'Checked In',
    campusName = CAMPUS_NAME,
    remarks = ''
}) => {
    const trimmedName = String(visitorName || '').trim()
    const trimmedPhone = String(phone || '').trim()
    const trimmedPerson = String(personToMeet || '').trim()
    const trimmedDept = String(department || '').trim()
    const trimmedPurpose = String(purpose || '').trim()

    if (!trimmedName) throw new Error('Visitor Full Name is required.')
    if (!trimmedPhone) throw new Error('Phone Number is required.')
    if (!trimmedPerson) throw new Error('Person to Meet is required.')
    if (!trimmedDept) throw new Error('Department is required.')
    if (!trimmedPurpose) throw new Error('Purpose of Visit is required.')

    const currentLogs = getVisitorLogs()

    // Disallow duplicate active visitor session with identical name & phone if currently inside
    const existingActive = currentLogs.find(
        (v) => (v.status === 'Checked In' || v.status === 'On Campus') &&
               v.phone.replace(/\D/g, '') === trimmedPhone.replace(/\D/g, '') &&
               v.visitorName.toLowerCase() === trimmedName.toLowerCase()
    )
    if (existingActive) {
        throw new Error(`Visitor ${trimmedName} is already checked in under active badge ${existingActive.badgeNumber}. Please check out the existing session before re-entry.`)
    }

    const nextSeq = currentLogs.length + 43
    const newVisitorId = `VIS-2026-${String(nextSeq).padStart(4, '0')}`
    const newBadgeNo = `VIS-B-${nextSeq}`
    const newBarcode = `BAR-VIS-${nextSeq}`

    const now = new Date()
    const entryDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    const entryTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

    const qrPayload = JSON.stringify({
        id: newVisitorId,
        badge: newBadgeNo,
        name: trimmedName,
        meet: trimmedPerson,
        dept: trimmedDept,
        entryTime: `${entryDate} ${entryTime}`
    })

    const newRecord = {
        id: newVisitorId,
        visitorName: trimmedName,
        phone: trimmedPhone,
        visitorOrganization: String(visitorOrganization || '').trim() || 'Individual Visitor',
        personToMeet: trimmedPerson,
        department: trimmedDept,
        purpose: trimmedPurpose,
        idProofType,
        idProofNumber: String(idProofNumber || '').trim() || 'Verified by Front Office',
        numberOfVisitors: Number(numberOfVisitors) || 1,
        entryDate,
        entryTime,
        exitTime: null,
        badgeNumber: newBadgeNo,
        badgeBarcode: newBarcode,
        badgeQrPayload: qrPayload,
        gateNumber,
        recordedBy,
        remarks: String(remarks || '').trim(),
        status: status || 'Checked In',
        campusName,
        createdAt: now.toISOString()
    }

    const updated = [newRecord, ...currentLogs]
    saveVisitorLogs(updated)

    recordAuditLog({
        actorName: recordedBy,
        actorRole: 'front-office',
        module: 'Visitor Management',
        action: 'VISITOR_CHECK_IN',
        entityId: newVisitorId,
        previousState: 'None',
        newState: 'Checked In',
        remarks: `Visitor ${trimmedName} checked in to meet ${trimmedPerson} (${trimmedDept}). Badge: ${newBadgeNo}`
    })

    dispatchNotification({
        recipientRole: 'gatekeeper',
        title: 'Visitor Checked In',
        message: `${trimmedName} issued badge ${newBadgeNo} to meet ${trimmedPerson} (${trimmedDept}).`,
        link: '/gate-keeper/visitors',
        priority: 'Normal',
        type: 'VISITOR'
    })

    return newRecord
}

export const recordVisitorCheckOut = (visitorId, officerName = 'Ram Singh (Gatekeeper)', remarks = '') => {
    const logs = getVisitorLogs()
    const targetIndex = logs.findIndex((v) => v.id === visitorId || v.badgeNumber === visitorId)
    if (targetIndex < 0) throw new Error('Visitor record not found.')

    const target = logs[targetIndex]
    if (target.status === 'Checked Out') {
        return target // Already checked out (idempotent guard)
    }

    if (!target.entryTime && !target.createdAt) {
        throw new Error('Cannot check out visitor before check-in.')
    }

    const now = new Date()
    const exitDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    const exitTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const calculatedDuration = calculateVisitDuration(target.entryDate, target.entryTime, exitDate, exitTime, target.createdAt)

    logs[targetIndex] = {
        ...target,
        exitDate,
        exitTime,
        exitTimestamp: now.toISOString(),
        visitDuration: calculatedDuration,
        status: 'Checked Out',
        officerCheckOut: officerName,
        checkOutRemarks: remarks || 'Badge returned, security verified exit.'
    }

    saveVisitorLogs(logs)

    recordAuditLog({
        actorName: officerName,
        actorRole: 'gatekeeper',
        module: 'Visitor Management',
        action: 'VISITOR_CHECK_OUT',
        entityId: target.id,
        previousState: 'Checked In',
        newState: 'Checked Out',
        remarks: `Visitor ${target.visitorName} checked out at ${exitTime}. Duration: ${calculatedDuration}. Badge ${target.badgeNumber} surrendered.`
    })

    return logs[targetIndex]
}

export const getActiveVisitors = () => {
    return getVisitorLogs().filter((v) => v.status === 'Checked In' || v.status === 'On Campus')
}

export const getVisitorHistory = () => {
    return getVisitorLogs()
}

export const getVisitorById = (id) => {
    return getVisitorLogs().find((v) => v.id === id || v.badgeNumber === id) || null
}

// ============================================================================
// STUDENT GATE PASS MANAGEMENT ENGINE
// ============================================================================

export const getStudentGatePasses = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STUDENT_GATE_PASS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return evaluateStudentGatePassOverdue(parsed)
                }
            }
            // Check legacy front-office storage if unified is not yet set
            const legacyRaw = localStorage.getItem(LEGACY_STUDENT_GATE_PASS_KEY)
            if (legacyRaw) {
                const parsedLegacy = JSON.parse(legacyRaw)
                if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
                    const migrated = parsedLegacy.map((leg) => ({
                        id: leg.id || `GP-STU-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
                        gatePassId: leg.id,
                        studentId: leg.studentId,
                        studentName: leg.studentName,
                        classSection: leg.classSection,
                        department: leg.department || 'Academics',
                        gender: leg.gender || '',
                        mobileNumber: leg.mobileNumber || '',
                        city: leg.city || '',
                        reason: leg.reason,
                        date: leg.date,
                        expectedDepartureTime: leg.outTime || '11:00 AM',
                        expectedReturnTime: leg.returnTime || '04:00 PM',
                        accompanyingPerson: leg.accompanyingPerson || 'Parent / Guardian',
                        parentGuardianInfo: leg.parentGuardianInfo || leg.mobileNumber,
                        remarks: leg.remarks || '',
                        status: leg.status === 'Approved' ? 'Approved' : leg.status === 'Rejected' ? 'Rejected' : 'Pending Approval',
                        displayStatus: leg.status,
                        requesterName: 'Kavita Reddy',
                        requesterRole: 'prm',
                        approvedBy: leg.status === 'Approved' ? { name: 'Dr. Ramanathan K', role: 'principal', timestamp: leg.date } : null,
                        actualDepartureTime: null,
                        actualReturnTime: null,
                        exitGatekeeper: null,
                        returnGatekeeper: null,
                        createdAt: leg.createdAt || new Date().toISOString()
                    }))
                    saveStudentGatePasses(migrated)
                    return evaluateStudentGatePassOverdue(migrated)
                }
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryStudentGatePasses !== null && Array.isArray(_memoryStudentGatePasses)) {
        return evaluateStudentGatePassOverdue(_memoryStudentGatePasses)
    }
    _memoryStudentGatePasses = [...INITIAL_STUDENT_GATE_PASSES]
    saveStudentGatePasses(_memoryStudentGatePasses)
    return evaluateStudentGatePassOverdue(_memoryStudentGatePasses)
}

const evaluateStudentGatePassOverdue = (passes) => {
    const now = new Date()
    return passes.map((pass) => {
        if (pass.status === 'Exit Recorded' && pass.expectedReturnTime) {
            // Check if expected return time on the same date has passed
            const returnParts = pass.expectedReturnTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
            if (returnParts) {
                let hours = parseInt(returnParts[1], 10)
                const minutes = parseInt(returnParts[2], 10)
                const meridian = (returnParts[3] || '').toUpperCase()
                if (meridian === 'PM' && hours < 12) hours += 12
                if (meridian === 'AM' && hours === 12) hours = 0

                const expectedReturnDateTime = new Date()
                expectedReturnDateTime.setHours(hours, minutes, 0, 0)

                // If currently after expected return time, flag as Overdue
                if (now.getTime() > expectedReturnDateTime.getTime()) {
                    return {
                        ...pass,
                        isOverdue: true,
                        displayStatus: 'Overdue Return'
                    }
                }
            }
        }
        return pass
    })
}

export const saveStudentGatePasses = (passes) => {
    _memoryStudentGatePasses = passes
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STUDENT_GATE_PASS_STORAGE_KEY, JSON.stringify(passes))
            // Also keep legacy store in sync for any unmodified subviews
            localStorage.setItem(LEGACY_STUDENT_GATE_PASS_KEY, JSON.stringify(passes))
        }
    } catch {
        /* ignore */
    }
    notifyMovementSync({ type: 'GATE_PASSES_SAVED' })
}

/**
 * Step 1: PRM creates and submits a student gate pass request
 */
export const createStudentGatePassRequest = ({
    studentId,
    studentName,
    classSection,
    department = 'Academics - Secondary',
    reason,
    date,
    expectedDepartureTime,
    expectedReturnTime,
    accompanyingPerson = '',
    parentGuardianInfo = '',
    remarks = '',
    requesterName = 'Kavita Reddy (PRM / Front Office)',
    requesterRole = 'prm'
}) => {
    const trimmedStudentId = String(studentId || '').trim()
    const trimmedReason = String(reason || '').trim()
    const trimmedDepTime = String(expectedDepartureTime || '').trim()
    const trimmedRetTime = String(expectedReturnTime || '').trim()

    if (!trimmedStudentId) throw new Error('Student Selection is required.')
    if (!trimmedReason) throw new Error('Reason for Leaving is required.')
    if (!trimmedDepTime) throw new Error('Expected Departure Time is required.')
    if (!trimmedRetTime) throw new Error('Expected Return Time is required.')

    // Auto-populate from SIS if fields are blank
    let resolvedName = studentName
    let resolvedClass = classSection
    let resolvedPhone = ''
    let resolvedParent = parentGuardianInfo

    const studentRecord = getStudentByDirectoryId(trimmedStudentId)
    if (studentRecord) {
        resolvedName = resolvedName || studentRecord.studentName
        resolvedClass = resolvedClass || studentRecord.classSection
        resolvedPhone = studentRecord.mobileNumber || ''
        resolvedParent = resolvedParent || `${studentRecord.parentName} (${studentRecord.parentPhone})`
    }

    const currentPasses = getStudentGatePasses()
    const nextSeq = currentPasses.length + 90
    const provisionalId = `REQ-STU-2026-${String(nextSeq).padStart(4, '0')}`

    const now = new Date()
    const requestDate = date || now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')

    const newRequest = {
        id: provisionalId,
        gatePassId: provisionalId,
        studentId: trimmedStudentId,
        studentName: resolvedName || 'Student',
        classSection: resolvedClass || '—',
        department,
        mobileNumber: resolvedPhone,
        reason: trimmedReason,
        date: requestDate,
        expectedDepartureTime: trimmedDepTime,
        expectedReturnTime: trimmedRetTime,
        accompanyingPerson: String(accompanyingPerson || '').trim() || 'Parent / Guardian',
        parentGuardianInfo: resolvedParent,
        remarks: String(remarks || '').trim(),
        status: 'Pending Approval',
        displayStatus: 'Pending Approval',
        requesterName,
        requesterRole,
        requestedAt: `${requestDate} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
        approvedBy: null,
        actualDepartureTime: null,
        actualReturnTime: null,
        exitGatekeeper: null,
        returnGatekeeper: null,
        qrCodeValue: null,
        createdAt: now.toISOString()
    }

    const updated = [newRequest, ...currentPasses]
    saveStudentGatePasses(updated)

    recordAuditLog({
        actorName: requesterName,
        actorRole: requesterRole,
        module: 'Gate Pass Management',
        action: 'CREATE_STUDENT_GATE_PASS_REQUEST',
        entityId: provisionalId,
        previousState: 'None',
        newState: 'Pending Approval',
        remarks: `PRM submitted gate pass request for ${resolvedName} (${resolvedClass}). Reason: ${trimmedReason}`
    })

    // Dispatched to both Principal and Director of Academics
    dispatchNotification({
        recipientRole: 'principal',
        title: 'New Student Gate Pass Awaiting Approval',
        message: `${provisionalId}: ${resolvedName} (${resolvedClass}) requested exit for ${trimmedReason}.`,
        link: '/principal/gate-pass',
        priority: 'High',
        type: 'GATE_PASS'
    })
    dispatchNotification({
        recipientRole: 'director',
        title: 'New Student Gate Pass Awaiting Approval',
        message: `${provisionalId}: ${resolvedName} (${resolvedClass}) requested exit for ${trimmedReason}.`,
        link: '/director/gate-pass',
        priority: 'High',
        type: 'GATE_PASS'
    })

    return newRequest
}

/**
 * Step 2 & 3: OR-Based Approval by Principal OR Director of Academics
 * Once either approves:
 * - Request is immediately considered approved.
 * - Removes request from the pending queue of both approvers.
 * - Idempotent: If both click simultaneously, only the first operation generates the pass.
 * - Generates unique Gate Pass ID (GP-STU-2026-XXXX) & QR code.
 * - Sets status to 'Approved' / 'Ready for Exit'.
 * - Synchronizes with Gatekeeper workspace and Gatekeeper Manager.
 */
export const approveStudentGatePass = (
    passId,
    approverRole,
    approverName,
    remarks = 'Approved for campus exit.'
) => {
    const authorizedRoles = ['principal', 'director', 'joint-director', 'super-admin', 'admin']
    const normalizedRole = String(approverRole || '').toLowerCase()

    if (!authorizedRoles.includes(normalizedRole)) {
        throw new Error(`Unauthorized: User with role '${approverRole}' cannot approve student gate passes. Only Principal or Director of Academics can approve.`)
    }

    const passes = getStudentGatePasses()
    const targetIndex = passes.findIndex((p) => p.id === passId || p.gatePassId === passId)
    if (targetIndex < 0) {
        throw new Error('Student gate pass request not found.')
    }

    const currentPass = passes[targetIndex]

    // Idempotency Guard: If already approved by either Principal or Director
    if (currentPass.status === 'Approved' || currentPass.status === 'Ready for Exit' || currentPass.status === 'Exit Recorded' || currentPass.status === 'Returned') {
        return {
            success: false,
            code: 'ALREADY_APPROVED',
            message: `Gate pass ${passId} has already been approved by ${currentPass.approvedBy?.name || 'authorized approver'}. Only one approval is recorded.`,
            pass: currentPass
        }
    }

    if (currentPass.status !== 'Pending Approval') {
        throw new Error(`Cannot approve gate pass in '${currentPass.status}' state.`)
    }

    const now = new Date()
    const timestampStr = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`

    // Generate unique permanent Gate Pass ID: GP-STU-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const permanentGatePassId = `GP-STU-2026-${randomSuffix}`

    const approverRecord = {
        name: approverName || (normalizedRole === 'principal' ? 'Dr. Ramanathan K' : 'Dr. Kavita Sharma'),
        role: normalizedRole,
        roleLabel: normalizedRole === 'principal' ? 'Principal' : 'Director of Academics',
        timestamp: timestampStr,
        remarks: remarks || 'Sanctioned by executive authority.'
    }

    const qrPayload = `GP:${permanentGatePassId}|STU:${currentPass.studentId}|NAME:${currentPass.studentName}|CLASS:${currentPass.classSection}|APPR_BY:${approverRecord.name}|TIME:${timestampStr}`

    const updatedPass = {
        ...currentPass,
        id: permanentGatePassId,
        gatePassId: permanentGatePassId,
        originalRequestId: currentPass.id,
        status: 'Approved',
        displayStatus: 'Approved / Ready for Exit',
        approvedBy: approverRecord,
        qrCodeValue: qrPayload,
        approvedAt: timestampStr,
        updatedAt: now.toISOString()
    }

    passes[targetIndex] = updatedPass
    saveStudentGatePasses(passes)

    recordAuditLog({
        actorName: approverRecord.name,
        actorRole: normalizedRole,
        module: 'Gate Pass Management',
        action: 'APPROVE_STUDENT_GATE_PASS',
        entityId: permanentGatePassId,
        previousState: 'Pending Approval',
        newState: 'Approved',
        remarks: `Approved by ${approverRecord.name} (${approverRecord.roleLabel}). Unique gate pass ${permanentGatePassId} generated.`
    })

    // Automatically make visible in Gatekeeper workspace and notify Gatekeeper
    dispatchNotification({
        recipientRole: 'gatekeeper',
        title: 'New Approved Student Gate Pass Ready',
        message: `${permanentGatePassId}: ${updatedPass.studentName} (${updatedPass.classSection}) cleared for departure by ${approverRecord.name}.`,
        link: '/gate-keeper/gate-pass-list',
        priority: 'High',
        type: 'GATE_PASS'
    })
    dispatchNotification({
        recipientRole: 'gatekeeper-manager',
        title: 'Student Gate Pass Sanctioned',
        message: `${permanentGatePassId} generated for ${updatedPass.studentName} by ${approverRecord.name}.`,
        link: '/gatekeeper-manager/dashboard',
        priority: 'Normal',
        type: 'GATE_PASS'
    })

    return {
        success: true,
        pass: updatedPass
    }
}

/**
 * Rejection by either authorized approver
 */
export const rejectStudentGatePass = (
    passId,
    approverRole,
    approverName,
    rejectionReason = 'Request declined as per institutional safety policy.'
) => {
    const authorizedRoles = ['principal', 'director', 'joint-director', 'super-admin', 'admin']
    const normalizedRole = String(approverRole || '').toLowerCase()

    if (!authorizedRoles.includes(normalizedRole)) {
        throw new Error(`Unauthorized: User with role '${approverRole}' cannot reject student gate passes.`)
    }

    const passes = getStudentGatePasses()
    const targetIndex = passes.findIndex((p) => p.id === passId || p.gatePassId === passId)
    if (targetIndex < 0) throw new Error('Student gate pass request not found.')

    const currentPass = passes[targetIndex]
    if (currentPass.status !== 'Pending Approval') {
        throw new Error(`Cannot reject gate pass in '${currentPass.status}' state.`)
    }

    const now = new Date()
    const timestampStr = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`

    const rejectedRecord = {
        name: approverName || (normalizedRole === 'principal' ? 'Dr. Ramanathan K' : 'Dr. Kavita Sharma'),
        role: normalizedRole,
        roleLabel: normalizedRole === 'principal' ? 'Principal' : 'Director of Academics',
        timestamp: timestampStr,
        reason: rejectionReason
    }

    passes[targetIndex] = {
        ...currentPass,
        status: 'Rejected',
        displayStatus: 'Rejected',
        rejectedBy: rejectedRecord,
        updatedAt: now.toISOString()
    }

    saveStudentGatePasses(passes)

    recordAuditLog({
        actorName: rejectedRecord.name,
        actorRole: normalizedRole,
        module: 'Gate Pass Management',
        action: 'REJECT_STUDENT_GATE_PASS',
        entityId: passId,
        previousState: 'Pending Approval',
        newState: 'Rejected',
        remarks: `Rejected by ${rejectedRecord.name}. Reason: ${rejectionReason}`
    })

    return {
        success: true,
        pass: passes[targetIndex]
    }
}

/**
 * Step 4: Gatekeeper Verification & Record Actual Student Departure
 * Gatekeeper CANNOT approve pending passes! Must be in 'Approved' or 'Ready for Exit' status.
 */
export const recordStudentExit = (
    passId,
    gatekeeperName = 'Ram Singh (Gatekeeper)',
    actualDepartureTime = '',
    remarks = 'Student identity and accompanying guardian physically verified.'
) => {
    const passes = getStudentGatePasses()
    const targetIndex = passes.findIndex((p) => p.id === passId || p.gatePassId === passId)
    if (targetIndex < 0) throw new Error('Gate pass not found.')

    const target = passes[targetIndex]

    if (target.status === 'Pending Approval') {
        throw new Error('Security Breach Prevention: Gatekeeper cannot approve pending passes. Prior approval from Principal or Director of Academics is mandatory.')
    }

    if (target.status !== 'Approved' && target.status !== 'Ready for Exit') {
        throw new Error(`Cannot record exit for gate pass in '${target.status}' state. Expected 'Approved' state.`)
    }

    const now = new Date()
    const timeStr = actualDepartureTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')

    passes[targetIndex] = {
        ...target,
        status: 'Exit Recorded',
        displayStatus: 'Exit Recorded',
        actualDepartureTime: `${dateStr} ${timeStr}`,
        exitGatekeeper: gatekeeperName,
        exitRemarks: remarks,
        updatedAt: now.toISOString()
    }

    saveStudentGatePasses(passes)

    recordAuditLog({
        actorName: gatekeeperName,
        actorRole: 'gatekeeper',
        module: 'Gate Pass Management',
        action: 'RECORD_STUDENT_EXIT',
        entityId: target.id,
        previousState: 'Approved',
        newState: 'Exit Recorded',
        remarks: `Student ${target.studentName} exited campus with ${target.accompanyingPerson}. Gatekeeper: ${gatekeeperName}`
    })

    return passes[targetIndex]
}

/**
 * Step 4: Gatekeeper Records Student Return to Campus
 */
export const recordStudentReturn = (
    passId,
    gatekeeperName = 'Ram Singh (Gatekeeper)',
    actualReturnTime = '',
    remarks = 'Student safely returned to campus. Handed over to classroom supervisor.'
) => {
    const passes = getStudentGatePasses()
    const targetIndex = passes.findIndex((p) => p.id === passId || p.gatePassId === passId)
    if (targetIndex < 0) throw new Error('Gate pass not found.')

    const target = passes[targetIndex]

    if (target.status !== 'Exit Recorded' && target.displayStatus !== 'Overdue Return') {
        throw new Error(`Cannot record return for pass in '${target.status}' state. Pass must be in 'Exit Recorded' state.`)
    }

    const now = new Date()
    const timeStr = actualReturnTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')

    passes[targetIndex] = {
        ...target,
        status: 'Returned',
        displayStatus: 'Returned',
        isOverdue: false,
        actualReturnTime: `${dateStr} ${timeStr}`,
        returnGatekeeper: gatekeeperName,
        returnRemarks: remarks,
        updatedAt: now.toISOString()
    }

    saveStudentGatePasses(passes)

    recordAuditLog({
        actorName: gatekeeperName,
        actorRole: 'gatekeeper',
        module: 'Gate Pass Management',
        action: 'RECORD_STUDENT_RETURN',
        entityId: target.id,
        previousState: 'Exit Recorded',
        newState: 'Returned',
        remarks: `Student ${target.studentName} safely re-entered campus at ${timeStr}. Gatekeeper: ${gatekeeperName}`
    })

    return passes[targetIndex]
}

export const cancelStudentGatePass = (passId, actorName = 'User', remarks = 'Cancelled before departure.') => {
    const passes = getStudentGatePasses()
    const targetIndex = passes.findIndex((p) => p.id === passId || p.gatePassId === passId)
    if (targetIndex < 0) throw new Error('Gate pass not found.')

    const target = passes[targetIndex]
    if (target.status === 'Exit Recorded' || target.status === 'Returned') {
        throw new Error('Cannot cancel a gate pass after campus departure has been recorded.')
    }

    passes[targetIndex] = {
        ...target,
        status: 'Cancelled',
        displayStatus: 'Cancelled',
        cancelledBy: {
            name: actorName,
            timestamp: new Date().toISOString(),
            remarks
        }
    }

    saveStudentGatePasses(passes)

    recordAuditLog({
        actorName,
        actorRole: 'front-office',
        module: 'Gate Pass Management',
        action: 'CANCEL_STUDENT_GATE_PASS',
        entityId: target.id,
        previousState: target.status,
        newState: 'Cancelled',
        remarks
    })

    return passes[targetIndex]
}

export const getStudentGatePassById = (id) => {
    return getStudentGatePasses().find((p) => p.id === id || p.gatePassId === id) || null
}

export const filterStudentGatePasses = (records, { search = '', status = '' } = {}) => {
    const query = String(search || '').trim().toLowerCase()

    return records.filter((r) => {
        if (status) {
            if (status === 'Overdue') {
                if (!r.isOverdue && r.status !== 'Overdue') return false
            } else if (status === 'Pending') {
                if (r.status !== 'Pending Approval') return false
            } else if (r.status !== status && r.displayStatus !== status) {
                return false
            }
        }
        if (!query) return true

        return [
            r.id,
            r.gatePassId,
            r.studentId,
            r.studentName,
            r.classSection,
            r.department,
            r.reason,
            r.status,
            r.displayStatus,
            r.accompanyingPerson,
            r.approvedBy?.name,
            r.requesterName
        ].some((v) => String(v || '').toLowerCase().includes(query))
    })
}

// ============================================================================
// UNIFIED GATEKEEPER KPI ENGINE
// ============================================================================

export const getUnifiedGatekeeperKPIs = () => {
    const visitors = getVisitorLogs()
    const studentPasses = getStudentGatePasses()
    const materialPasses = getGatePasses()

    // 1. Visitors Currently Inside
    const visitorsCurrentlyInside = visitors.filter(
        (v) => v.status === 'Checked In' || v.status === 'On Campus'
    ).length

    // 2. Student Gate Passes Awaiting Exit
    const studentPassesAwaitingExit = studentPasses.filter(
        (p) => p.status === 'Approved' || p.status === 'Ready for Exit'
    ).length

    // 3. Students Currently Outside
    const studentsCurrentlyOutside = studentPasses.filter(
        (p) => p.status === 'Exit Recorded'
    ).length

    // 4. Overdue Returns (Students past expected return time + Overdue material items)
    const overdueStudentReturns = studentPasses.filter(
        (p) => p.isOverdue || p.displayStatus === 'Overdue Return'
    ).length

    const overdueMaterials = materialPasses.filter(
        (m) => m.status === 'Overdue'
    ).length

    const overdueReturns = overdueStudentReturns + overdueMaterials

    return {
        visitorsCurrentlyInside,
        studentPassesAwaitingExit,
        studentsCurrentlyOutside,
        overdueReturns,
        overdueStudentReturns,
        overdueMaterials,
        totalActiveMovements: visitorsCurrentlyInside + studentsCurrentlyOutside
    }
}

// ============================================================================
// MATERIAL & OTHER GATE PASSES
// ============================================================================

export const getGatePasses = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(GATE_PASS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return evaluateOverdueStatuses(parsed)
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryGatePasses && Array.isArray(_memoryGatePasses) && _memoryGatePasses.length > 0) {
        return evaluateOverdueStatuses(_memoryGatePasses)
    }
    _memoryGatePasses = [...INITIAL_GATE_PASSES]
    saveGatePasses(_memoryGatePasses)
    return evaluateOverdueStatuses(_memoryGatePasses)
}

const evaluateOverdueStatuses = (passes) => {
    const today = new Date()
    return passes.map((p) => {
        if (p.materialType === 'Returnable' && p.status === 'Security Cleared Out' && p.expectedReturnDate) {
            const parts = p.expectedReturnDate.split('-')
            if (parts.length === 3) {
                const expDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                if (today > expDate) {
                    return { ...p, status: 'Overdue' }
                }
            }
        }
        return p
    })
}

export const saveGatePasses = (passes) => {
    _memoryGatePasses = passes
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(GATE_PASS_STORAGE_KEY, JSON.stringify(passes))
        }
    } catch {
        /* ignore */
    }
    notifyMovementSync({ type: 'MATERIAL_PASSES_SAVED' })
}

export const submitGatePass = ({
    passType = 'Material',
    materialType = 'Returnable',
    requesterId,
    requesterName,
    department,
    responsiblePerson,
    responsibleContact = '',
    destination,
    purpose,
    items = [],
    expectedReturnDate = null,
    vehicleNumber = '',
    carrierName = ''
}) => {
    if (!items.length) {
        throw new Error('At least one item must be listed on the gate pass.')
    }
    if (materialType === 'Returnable' && !expectedReturnDate) {
        throw new Error('Expected return date is mandatory for Returnable gate passes.')
    }

    const passes = getGatePasses()
    const nextSeq = passes.length + 1
    const newId = `GP-2026-${String(nextSeq).padStart(3, '0')}`

    const newPass = {
        id: newId,
        passType,
        materialType,
        requestDate: new Date().toLocaleDateString('en-GB'),
        requesterId,
        requesterName,
        department,
        responsiblePerson,
        responsibleContact,
        destination,
        purpose,
        items,
        expectedReturnDate: materialType === 'Returnable' ? expectedReturnDate : null,
        vehicleNumber,
        carrierName: carrierName || responsiblePerson,
        status: 'Submitted',
        approverChain: [
            {
                actor: requesterName,
                role: 'Requester',
                action: 'Submitted',
                timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                remarks: purpose
            }
        ],
        actualExitTimestamp: null,
        actualEntryTimestamp: null,
        securityOfficerExit: null,
        securityOfficerEntry: null,
        returnConditionNotes: ''
    }

    const updated = [newPass, ...passes]
    saveGatePasses(updated)

    recordAuditLog({
        actorId: requesterId,
        actorName: requesterName,
        module: 'Gate Pass & Security',
        action: 'SUBMIT_GATE_PASS',
        entityId: newId,
        previousState: 'None',
        newState: 'Submitted',
        remarks: `${materialType} gate pass for ${items.length} items raised by ${requesterName}`
    })

    return newPass
}

export const updateGatePassApproval = (passId, decision, approverName, approverRole, remarks = '') => {
    const passes = getGatePasses()
    const target = passes.find((p) => p.id === passId)
    if (!target) throw new Error('Gate Pass not found.')

    const oldStatus = target.status
    target.status = decision === 'Approved' ? 'HOD Approved' : 'Rejected'
    target.approverChain.push({
        actor: approverName,
        role: approverRole,
        action: decision,
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        remarks: remarks || (decision === 'Approved' ? 'Sanctioned for campus transit.' : 'Rejected.')
    })

    saveGatePasses(passes)

    recordAuditLog({
        actorName: approverName,
        actorRole: approverRole,
        module: 'Gate Pass & Security',
        action: decision === 'Approved' ? 'APPROVE_GATE_PASS' : 'REJECT_GATE_PASS',
        entityId: passId,
        previousState: oldStatus,
        newState: target.status,
        remarks
    })

    return target
}

export const recordSecurityGateExit = ({
    passId,
    officerName = 'Bhawani Singh',
    vehicleRegistrationNo = '',
    inspectionRemarks = 'Physical items matched with gate pass items list.'
}) => {
    const passes = getGatePasses()
    const target = passes.find((p) => p.id === passId)
    if (!target) throw new Error('Gate Pass not found.')

    if (target.status !== 'HOD Approved' && target.status !== 'Stores Verified') {
        throw new Error(`Security cannot clear pass in '${target.status}' state. Prior approval required.`)
    }

    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    target.actualExitTimestamp = nowStr
    target.securityOfficerExit = officerName
    if (vehicleRegistrationNo) target.vehicleNumber = vehicleRegistrationNo

    target.status = 'Security Cleared Out'
    target.approverChain.push({
        actor: officerName,
        role: 'Security Officer',
        action: 'Security Cleared Out',
        timestamp: nowStr,
        remarks: inspectionRemarks
    })

    saveGatePasses(passes)

    recordAuditLog({
        actorName: officerName,
        actorRole: 'gatekeeper-manager',
        module: 'Gate Pass & Security',
        action: 'RECORD_GATE_EXIT',
        entityId: passId,
        previousState: 'Approved',
        newState: 'Security Cleared Out',
        remarks: `Physical exit logged at Main Gate. Vehicle: ${target.vehicleNumber}`
    })

    return target
}

export const recordSecurityGateReturn = ({
    passId,
    officerName = 'Bhawani Singh',
    conditionOnReturn = 'All items returned in good working condition.',
    allReturned = true
}) => {
    const passes = getGatePasses()
    const target = passes.find((p) => p.id === passId)
    if (!target) throw new Error('Gate Pass not found.')

    if (target.materialType !== 'Returnable') {
        throw new Error('Only Returnable gate passes require entry return verification.')
    }

    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    target.actualEntryTimestamp = nowStr
    target.securityOfficerEntry = officerName
    target.returnConditionNotes = conditionOnReturn
    target.status = allReturned ? 'Returned & Verified' : 'Partially Returned'

    target.approverChain.push({
        actor: officerName,
        role: 'Security Officer',
        action: target.status,
        timestamp: nowStr,
        remarks: conditionOnReturn
    })

    saveGatePasses(passes)

    recordAuditLog({
        actorName: officerName,
        actorRole: 'gatekeeper-manager',
        module: 'Gate Pass & Security',
        action: 'RECORD_GATE_RETURN',
        entityId: passId,
        previousState: 'Security Cleared Out',
        newState: target.status,
        remarks: `Returnable material returned to campus. Inspected by ${officerName}`
    })

    return target
}

export const logVisitorEntry = (payload) => registerVisitorCheckIn({ ...payload, status: 'On Campus' })
export const logVisitorExit = (id, officerName) => recordVisitorCheckOut(id, officerName)

export const getSecurityMovementAuditLogs = () => {
    const all = getAuditLogs()
    return all.filter((l) =>
        l.module === 'Gate Pass Management' ||
        l.module === 'Visitor Management' ||
        l.module === 'Gate Pass & Security'
    )
}
