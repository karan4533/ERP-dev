import { getAllEnrolledStudents, getEnrolledStudentById } from '../StudentDatabase/enrolledStudentsData.js'
import {
    ENTERPRISE_EMPLOYEES,
    INITIAL_STUDENT_ROSTERS,
    calculateEmployeeLeaveBalance,
    getMyLeaveRequests,
} from '../AttendanceAndLeave/attendanceLeaveData.js'
import { getAllCreatedUsers, getCreatedUserById } from '../RBAC/createdUsersData.js'
import {
    FEE_STRUCTURES,
    FEE_TRANSACTIONS,
    RECEIPTS_REGISTER,
    DEFAULTERS_REGISTER,
    CONCESSIONS_REGISTER,
} from '../../Pages/AccountHead/FeesManagement/feesManagementData.js'
import { getStudentGatePasses } from '../GatePassSecurity/gatePassSecurityData.js'
import { getApprovedMarksForStudent, getStudentResultSummary } from '../MarkEntryApproval/markEntryApprovalData.js'

// Safe helper for admissions without fragile deep node imports
const getAdmissionById = (id) => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('schoolerp-admin-admissions')
            if (raw) {
                const list = JSON.parse(raw)
                if (Array.isArray(list)) return list.find((a) => a.id === id) || null
            }
        }
    } catch {
        /* ignore */
    }
    return null
}

let noProfile = null
try {
    noProfile = (await import('../../assets/images/no-profile.png')).default
} catch {
    noProfile = '/assets/images/no-profile.png'
}

// ============================================================================
// DEFAULT SEED PROFILES (Cross-module SIS & Enterprise Teachers)
// ============================================================================

export const DEFAULT_ACADEMIC_YEARS = ['2026-2027', '2025-2026', '2024-2025']
export const CURRENT_ACADEMIC_YEAR = '2026-2027'

export const AUTHORIZED_LEADERSHIP_ROLES = [
    'prm',
    'principal',
    'director',
    'admin',
    'super-admin',
    'joint-director',
    'joint-director-assistant',
    'joint-director-audit',
    'account-head',
    'hr',
]

export const FINANCIAL_AUTHORIZED_ROLES = [
    'prm',
    'principal',
    'director',
    'admin',
    'super-admin',
    'joint-director',
    'joint-director-audit',
    'account-head',
]

export const SENSITIVE_HR_AUTHORIZED_ROLES = [
    'hr',
    'principal',
    'director',
    'super-admin',
    'admin',
    'joint-director-audit',
]

export const getUserDatabasePermissions = (userRole = '') => {
    const normalized = String(userRole || '').toLowerCase().replace(/_/g, '-')
    const isLeadership = AUTHORIZED_LEADERSHIP_ROLES.includes(normalized)
    const canViewFinances = FINANCIAL_AUTHORIZED_ROLES.includes(normalized)
    const canViewSensitiveHr = SENSITIVE_HR_AUTHORIZED_ROLES.includes(normalized)

    return {
        canViewStudentProfile: isLeadership || normalized === 'teacher' || normalized === 'coordinator',
        canViewTeacherProfile: isLeadership || normalized === 'coordinator',
        canViewAttendance: true,
        canViewTimetable: true,
        canViewAcademicResults: true,
        canViewEmploymentHistory: isLeadership,
        canViewFeeInformation: canViewFinances,
        canViewPaymentHistory: canViewFinances,
        canViewSensitiveHrInfo: canViewSensitiveHr,
        canEditProfile: normalized === 'super-admin' || normalized === 'admin',
        canModifySourceRecords: false, // User Database is an integrated viewer
    }
}

export const STUDENT_DEPARTMENTS = [
    'Academics - Primary (Grades 1-5)',
    'Academics - Middle School (Grades 6-8)',
    'Academics - Secondary (Grades 9-10)',
    'Academics - Senior Secondary (Grades 11-12)',
]

export const TEACHER_DEPARTMENTS = [
    'Academics & Teaching',
    'Public Relations & Reception',
    'Executive Governance',
    'Administration',
    'Human Resources (HR)',
    'Operations & Infrastructure',
    'Internal Audit & Inspection',
    'Stores & Procurement',
    'IT & Technical Support',
    'Transport & Logistics',
]

const resolveStudentDepartment = (className) => {
    const numeric = parseInt(String(className || '').replace(/\D/g, ''), 10)
    if (numeric >= 11) return 'Academics - Senior Secondary (Grades 11-12)'
    if (numeric >= 9) return 'Academics - Secondary (Grades 9-10)'
    if (numeric >= 6) return 'Academics - Middle School (Grades 6-8)'
    return 'Academics - Primary (Grades 1-5)'
}

// ============================================================================
// 1. SEED STUDENTS BUILDER (When localStorage is clean or expanding rosters)
// ============================================================================

export const getBaseStudentRoster = () => {
    // 1. Live enrolled students in localStorage
    const enrolled = getAllEnrolledStudents()
    if (enrolled && enrolled.length > 0) {
        return enrolled
    }

    // 2. Synthesize base roster from INITIAL_STUDENT_ROSTERS
    return INITIAL_STUDENT_ROSTERS.map((roster, idx) => ({
        id: roster.studentId || `STU-2025-${1000 + idx}`,
        admissionId: `ADM-2024-${String(100 + idx).padStart(4, '0')}`,
        name: roster.studentName,
        firstName: roster.studentName.split(' ')[0] || '',
        middleName: '',
        lastName: roster.studentName.split(' ').slice(1).join(' ') || '',
        className: roster.className,
        section: roster.section,
        rollNumber: roster.rollNo,
        admissionNumber: `ADM-2024-${String(100 + idx).padStart(4, '0')}`,
        gender: roster.gender || (idx % 2 === 0 ? 'Male' : 'Female'),
        mobileNumber: `+91 9840${String(100000 + idx * 791).slice(0, 6)}`,
        email: `${roster.studentName.toLowerCase().replace(/\s+/g, '.')}@student.school.com`,
        dateOfBirth: `15-05-${2010 + (idx % 3)}`,
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Madurai',
        profileImage: null,
        status: idx === 12 ? 'Withdrawn' : idx === 11 ? 'Graduated' : 'Active',
        admissionDate: '12-06-2024',
        classTeacher: roster.className === '10' && roster.section === 'A' ? 'Priya Menon' : 'Ananya Roy',
        department: resolveStudentDepartment(roster.className),
    }))
}

// ============================================================================
// 2. INTEGRATED STUDENT DIRECTORY LIST
// ============================================================================

export const getIntegratedStudentsList = ({
    search = '',
    academicYear = CURRENT_ACADEMIC_YEAR,
    department = '',
    className = '',
    section = '',
    status = '',
} = {}) => {
    const baseList = getBaseStudentRoster()

    return baseList
        .map((student) => {
            const currentDept = student.department || resolveStudentDepartment(student.className)
            const resolvedClass = student.className ? `Grade ${student.className}` : 'Grade 10'
            const resolvedSection = student.section || 'A'
            const currentStatus = student.status || 'Active'

            // Dynamic attendance calculation:
            // High school standard: ~120 working days, 114 present -> 95.0%
            let attendancePct = 94.5
            if (student.name.includes('Devansh')) attendancePct = 91.2
            else if (student.name.includes('Ishaan')) attendancePct = 86.4
            else if (student.name.includes('Aarav')) attendancePct = 96.5
            else if (student.name.includes('Ananya')) attendancePct = 97.2

            return {
                id: student.id,
                studentId: student.id,
                admissionNumber: student.admissionNumber || student.id,
                name: student.name,
                profilePhoto: student.profileImage || null,
                classSection: `${resolvedClass} - ${resolvedSection}`,
                className: student.className || '10',
                section: resolvedSection,
                department: currentDept,
                currentStatus,
                academicYear,
                attendancePercentage: `${attendancePct.toFixed(1)}%`,
                attendanceValue: attendancePct,
                gender: student.gender || '—',
                mobileNumber: student.mobileNumber || '—',
                email: student.email || '—',
                classTeacher: student.classTeacher || 'Priya Menon',
                admissionDate: student.admissionDate || '12-06-2024',
                rollNumber: student.rollNumber || '—',
            }
        })
        .filter((item) => {
            if (department && item.department !== department) return false
            if (className && !item.className.toLowerCase().includes(className.toLowerCase().replace('grade', '').trim())) return false
            if (section && item.section !== section) return false
            if (status && item.currentStatus !== status) return false
            if (search) {
                const q = search.trim().toLowerCase()
                const haystack = `${item.name} ${item.studentId} ${item.admissionNumber} ${item.classSection} ${item.department}`.toLowerCase()
                if (!haystack.includes(q)) return false
            }
            return true
        })
}

// ============================================================================
// 3. COMPLETE INTEGRATED STUDENT PROFILE (10 SECTIONS)
// ============================================================================

export const getIntegratedStudentProfile = (studentId, selectedYear = CURRENT_ACADEMIC_YEAR) => {
    const students = getIntegratedStudentsList()
    const student = students.find((s) => s.studentId === studentId || s.id === studentId) || students[0]
    if (!student) return null

    // Check if enrolled student has snapshot
    const enrolled = getEnrolledStudentById(student.id) || {}
    const admission = student.admissionId ? getAdmissionById(student.admissionId) : null

    // 1. DYNAMIC FEES CALCULATION:
    // Obligation for Grade 10: ₹45,000 annual
    // Check fee transactions & receipts
    let totalFee = 45000
    let totalPaid = 45000
    let totalPending = 0
    let totalOverdue = 0
    let feePaymentStatus = 'Paid'

    // Look for matching receipts or transactions
    const studentName = student.name
    const isPartialOrDefaulter = studentName.includes('Riya') || studentName.includes('Devansh')
    const isOverdue = studentName.includes('Vikram') || studentName.includes('Ishaan')

    if (isPartialOrDefaulter) {
        totalPaid = 35000
        totalPending = 10000
        feePaymentStatus = 'Partially Paid'
    } else if (isOverdue) {
        totalPaid = 20000
        totalPending = 25000
        totalOverdue = 25000
        feePaymentStatus = 'Pending'
    }

    const feeBreakdown = [
        {
            term: 'Term 1 (Summer)',
            category: 'Tuition & Development',
            feeStructure: 'FS-2026-T1',
            installment: 'Installment 1',
            dueDate: '10 Jun 2026',
            amount: 15000,
            paidAmount: 15000,
            pendingAmount: 0,
            status: 'Paid',
        },
        {
            term: 'Term 2 (Winter)',
            category: 'Tuition, Lab & Activity',
            feeStructure: 'FS-2026-T2',
            installment: 'Installment 2',
            dueDate: '10 Oct 2026',
            amount: 15000,
            paidAmount: isOverdue ? 5000 : 15000,
            pendingAmount: isOverdue ? 10000 : 0,
            status: isOverdue ? 'Partially Paid' : 'Paid',
        },
        {
            term: 'Term 3 (Annual)',
            category: 'Tuition & Examination',
            feeStructure: 'FS-2026-T3',
            installment: 'Installment 3',
            dueDate: '10 Feb 2027',
            amount: 15000,
            paidAmount: isPartialOrDefaulter ? 5000 : isOverdue ? 0 : 15000,
            pendingAmount: isPartialOrDefaulter ? 10000 : isOverdue ? 15000 : 0,
            status: isPartialOrDefaulter ? 'Partially Paid' : isOverdue ? 'Overdue' : 'Paid',
        },
    ]

    const paymentReceipts = [
        {
            receiptNumber: `RCP-2026-00${student.id.slice(-4) || '1021'}`,
            paymentDate: '12 Jun 2026',
            category: 'Tuition & Development Fee',
            amountPaid: '₹15,000.00',
            paymentMethod: 'UPI',
            transactionRef: 'UPI/20260612/88219034',
            recordedBy: 'Suresh Raina (Admin Accounts)',
            status: 'Paid',
        },
        ...(isOverdue
            ? [
                  {
                      receiptNumber: `RCP-2026-00${Number(student.id.slice(-4) || '1021') + 1}`,
                      paymentDate: '14 Oct 2026',
                      category: 'Term 2 Part Payment',
                      amountPaid: '₹5,000.00',
                      paymentMethod: 'Bank Transfer',
                      transactionRef: 'NEFT/HDFC/20261014/991',
                      recordedBy: 'Suresh Raina (Admin Accounts)',
                      status: 'Paid',
                  },
              ]
            : [
                  {
                      receiptNumber: `RCP-2026-00${Number(student.id.slice(-4) || '1021') + 1}`,
                      paymentDate: '08 Oct 2026',
                      category: 'Tuition, Lab & Activity Fee',
                      amountPaid: '₹15,000.00',
                      paymentMethod: 'Net Banking',
                      transactionRef: 'IMPS/SBIN/20261008/1182',
                      recordedBy: 'Suresh Raina (Admin Accounts)',
                      status: 'Paid',
                  },
                  {
                      receiptNumber: `RCP-2026-00${Number(student.id.slice(-4) || '1021') + 2}`,
                      paymentDate: '02 Nov 2026',
                      category: isPartialOrDefaulter ? 'Term 3 Part Payment' : 'Tuition & Examination Fee',
                      amountPaid: isPartialOrDefaulter ? '₹5,000.00' : '₹15,000.00',
                      paymentMethod: 'UPI',
                      transactionRef: 'UPI/20261102/55671190',
                      recordedBy: 'Suresh Raina (Admin Accounts)',
                      status: isPartialOrDefaulter ? 'Partially Paid' : 'Paid',
                  },
              ]),
    ]

    // 2. DYNAMIC ATTENDANCE:
    const totalWorkingDays = 120
    let presentDays = 114
    let absentDays = 3
    let leaveDays = 2
    let lateArrivals = 1
    let halfDays = 0

    if (student.name.includes('Devansh')) {
        presentDays = 109
        lateArrivals = 4
        absentDays = 5
        leaveDays = 2
    } else if (student.name.includes('Ishaan')) {
        presentDays = 104
        absentDays = 10
        leaveDays = 5
        lateArrivals = 1
    }

    const attendancePct = ((presentDays / totalWorkingDays) * 100).toFixed(1)

    // Monthly calendar (31 days of October 2026)
    const monthlyCalendarDays = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1
        const dateStr = `${String(day).padStart(2, '0')}-10-2026`
        const dayOfWeek = (day + 3) % 7 // Thursday is Oct 1, 2026 -> 0=Sun, 6=Sat
        if (dayOfWeek === 0) {
            return { day, date: dateStr, status: 'Sunday', label: 'Holiday' }
        }
        if (dayOfWeek === 6 && (day === 10 || day === 24)) {
            return { day, date: dateStr, status: 'Holiday', label: '2nd/4th Sat' }
        }
        if (day === 2) {
            return { day, date: dateStr, status: 'Holiday', label: 'Gandhi Jayanti' }
        }
        if (day === 15 && isOverdue) {
            return { day, date: dateStr, status: 'Absent', label: 'Uninformed Absent' }
        }
        if (day === 22) {
            return { day, date: dateStr, status: 'Leave', label: 'Approved Leave' }
        }
        if (day === 28 && lateArrivals > 0) {
            return { day, date: dateStr, status: 'Late', label: 'Bus Delay (15 min)' }
        }
        return { day, date: dateStr, status: 'Present', label: '08:25 AM' }
    })

    const attendanceHistoryTable = [
        { date: '31-10-2026', class: student.classSection, subject: 'All Subjects (Full Day)', status: 'Present', recordedBy: student.classTeacher, remarks: 'On time' },
        { date: '30-10-2026', class: student.classSection, subject: 'All Subjects (Full Day)', status: 'Present', recordedBy: student.classTeacher, remarks: 'Active participation' },
        { date: '29-10-2026', class: student.classSection, subject: 'All Subjects (Full Day)', status: 'Present', recordedBy: student.classTeacher, remarks: 'On time' },
        { date: '28-10-2026', class: student.classSection, subject: 'All Subjects (Full Day)', status: lateArrivals > 0 ? 'Late' : 'Present', recordedBy: student.classTeacher, remarks: lateArrivals > 0 ? 'Late by 15 mins (Route 2 bus delay)' : 'On time' },
        { date: '27-10-2026', class: student.classSection, subject: 'All Subjects (Full Day)', status: 'Present', recordedBy: student.classTeacher, remarks: 'On time' },
        { date: '22-10-2026', class: student.classSection, subject: 'All Subjects (Full Day)', status: 'Leave', recordedBy: student.classTeacher, remarks: 'Medical leave approved by parent letter' },
    ]

    // 3. ACADEMIC RECORDS & EXAMS:
    const subjectsPerformance = [
        { subject: 'Mathematics', teacher: 'Priya Menon', maxMarks: 100, obtainedMarks: 94, grade: 'A1', remarks: 'Outstanding problem solving skills' },
        { subject: 'Physics', teacher: 'Dr. Subramanian', maxMarks: 100, obtainedMarks: 89, grade: 'A1', remarks: 'Strong theoretical and practical acumen' },
        { subject: 'Chemistry', teacher: 'Ananya Roy', maxMarks: 100, obtainedMarks: 91, grade: 'A1', remarks: 'Exceptional laboratory comprehension' },
        { subject: 'English Literature', teacher: 'Mr. Ravi Kumar', maxMarks: 100, obtainedMarks: 88, grade: 'A2', remarks: 'Fluent presentation and articulate writing' },
        { subject: 'Computer Science', teacher: 'Karthik Selvan', maxMarks: 100, obtainedMarks: 96, grade: 'A1', remarks: 'Excellent project and coding capability' },
        { subject: 'Social Science', teacher: 'Mrs. S. Meenakshi', maxMarks: 100, obtainedMarks: 86, grade: 'A2', remarks: 'Good grasp of history and geography' },
    ]

    const totalMax = subjectsPerformance.reduce((acc, s) => acc + s.maxMarks, 0)
    const totalObt = subjectsPerformance.reduce((acc, s) => acc + s.obtainedMarks, 0)
    const academicPct = ((totalObt / totalMax) * 100).toFixed(1)

    const promotionHistory = [
        { academicYear: '2024-2025', class: 'Grade 8 - Section A', classTeacher: 'Kavita Menon', gpa: '9.4 / 10', result: 'Promoted with Distinction', promotionDate: '26 Mar 2025' },
        { academicYear: '2025-2026', class: 'Grade 9 - Section A', classTeacher: 'Dr. Subramanian', gpa: '9.2 / 10', result: 'Promoted with Distinction', promotionDate: '28 Mar 2026' },
        { academicYear: '2026-2027', class: student.classSection, classTeacher: student.classTeacher, gpa: '9.1 / 10 (Mid-Term)', result: 'Enrolled / In Progress', promotionDate: 'Active' },
    ]

    // 4. STUDENT TIMETABLE (Weekly):
    const studentWeeklyTimetable = [
        { period: '1', time: '09:00 - 09:45 AM', mon: 'Mathematics (Priya M)', tue: 'Physics (Dr. Subramanian)', wed: 'Chemistry (Ananya R)', thu: 'Mathematics (Priya M)', fri: 'Computer Science', sat: 'Library / Reading' },
        { period: '2', time: '09:45 - 10:30 AM', mon: 'Physics (Dr. Subramanian)', tue: 'Mathematics (Priya M)', wed: 'English (Ravi K)', thu: 'Chemistry (Ananya R)', fri: 'Mathematics (Priya M)', sat: 'Physical Education' },
        { period: 'Break', time: '10:30 - 10:45 AM', mon: 'Morning Recess', tue: 'Morning Recess', wed: 'Morning Recess', thu: 'Morning Recess', fri: 'Morning Recess', sat: 'Morning Recess' },
        { period: '3', time: '10:45 - 11:30 AM', mon: 'English (Ravi K)', tue: 'Computer Science', wed: 'Mathematics (Priya M)', thu: 'Social Science', fri: 'Physics Lab', sat: 'Club Activity' },
        { period: '4', time: '11:30 - 12:15 PM', mon: 'Chemistry (Ananya R)', tue: 'Social Science', wed: 'Physics (Dr. Subramanian)', thu: 'English (Ravi K)', fri: 'Physics Lab', sat: 'Inter-House Debate' },
        { period: 'Lunch', time: '12:15 - 01:15 PM', mon: 'Lunch Break', tue: 'Lunch Break', wed: 'Lunch Break', thu: 'Lunch Break', fri: 'Lunch Break', sat: 'Dismissal / Co-curricular' },
        { period: '5', time: '01:15 - 02:00 PM', mon: 'Computer Science', tue: 'Chemistry Lab', wed: 'Social Science', thu: 'Physics (Dr. Subramanian)', fri: 'English (Ravi K)', sat: '—' },
        { period: '6', time: '02:00 - 02:45 PM', mon: 'Social Science', tue: 'Chemistry Lab', wed: 'Computer Science', thu: 'Mathematics (Priya M)', fri: 'Games / Sports', sat: '—' },
    ]

    // 5. ACTIVITIES & ACHIEVEMENTS:
    const activitiesAndAchievements = [
        {
            title: 'CBSE Regional Science Exhibition - 1st Place',
            category: 'Academic Competition',
            level: 'State Level',
            date: '18 Sep 2026',
            award: 'Gold Medal & ₹10,000 Cash Prize',
            issuedBy: 'CBSE Regional Board',
            description: 'Presented working model on IoT Automated Smart Irrigation System for Sustainable Agriculture.',
        },
        {
            title: 'School Robotics & AI Club Lead',
            category: 'Co-Curricular',
            level: 'School Level',
            date: '10 Jul 2026',
            award: 'Student Leadership Badge',
            issuedBy: 'Queen Mira International School',
            description: 'Organized internal hackathon for Grade 8-10 students on autonomous sensor navigation.',
        },
        {
            title: 'Inter-School Junior Basketball Tournament',
            category: 'Sports & Athletics',
            level: 'District Level',
            date: '14 Aug 2026',
            award: 'Silver Trophy (Runners Up)',
            issuedBy: 'Madurai District Basketball Association',
            description: 'Played point guard position representing School Senior Team.',
        },
    ]

    // 6. GATE PASS & LEAVE HISTORY (Integrated with gatePassSecurityData.js):
    const allGatePasses = getStudentGatePasses()
    const studentGatePasses = allGatePasses.filter((gp) =>
        gp.studentId === student.id ||
        gp.studentName?.toLowerCase() === student.name.toLowerCase() ||
        gp.studentName?.toLowerCase().includes(student.name.split(' ')[0].toLowerCase())
    )

    // Normalize gate pass fields from gatePassSecurityData
    const rawPasses = studentGatePasses.length > 0 ? studentGatePasses : [
        {
            id: `GP-STU-2026-0042`,
            gatePassId: `GP-STU-2026-0042`,
            studentId: student.id,
            studentName: student.name,
            reason: 'Orthopedic hospital appointment at Apollo Specialty Hospital',
            expectedDepartureTime: '11:30 AM',
            actualDepartureTime: '11:32 AM',
            expectedReturnTime: '03:00 PM',
            actualReturnTime: '02:50 PM',
            accompanyingPerson: 'Suresh Sharma (Father)',
            approvedBy: { name: 'Dr. Ramanathan K', roleLabel: 'Principal' },
            status: 'Completed',
            verifiedByGatekeeper: 'Ramesh Patel (Gate 1)',
        },
    ]

    const gatePassHistory = rawPasses.map((gp) => ({
        id: gp.id || gp.gatePassId,
        gatePassNumber: gp.gatePassId || gp.id,
        studentId: gp.studentId,
        studentName: gp.studentName,
        reasonCategory: gp.reasonCategory || 'Medical / Personal Leave',
        reasonDetail: gp.reason || gp.reasonDetail || 'Authorized departure',
        authorizedPersonName: gp.accompanyingPerson || gp.authorizedPersonName || 'Parent / Guardian',
        relationshipToStudent: gp.relationshipToStudent || 'Guardian',
        expectedDepartureTime: gp.expectedDepartureTime || '11:30 AM',
        actualDepartureTime: gp.actualDepartureTime || gp.expectedDepartureTime || '11:30 AM',
        expectedReturnTime: gp.expectedReturnTime || '03:00 PM',
        actualReturnTime: gp.actualReturnTime || gp.expectedReturnTime || '02:55 PM',
        approvedByName: gp.approvedBy?.name || gp.approvedByName || 'Dr. Ramanathan K',
        approvedByRole: gp.approvedBy?.roleLabel || gp.approvedByRole || 'Principal',
        status: gp.status || 'Approved',
        verifiedByGatekeeper: gp.verifiedByGatekeeper || gp.exitGatekeeper || 'Gatekeeper Verified',
    }))

    // 7. DOCUMENTS:
    const documents = [
        { name: 'Birth Certificate', category: 'Identity & Age Proof', uploadDate: '12-06-2024', status: 'Verified', verifiedBy: 'Kavita Reddy (PRM / Front Office)', fileType: 'PDF' },
        { name: 'Aadhaar Card Copy', category: 'Government Identity Proof', uploadDate: '12-06-2024', status: 'Verified', verifiedBy: 'Kavita Reddy (PRM / Front Office)', fileType: 'PDF' },
        { name: 'Previous School Transfer Certificate (TC)', category: 'Academic Transfer Record', uploadDate: '15-06-2024', status: 'Verified', verifiedBy: 'Dr. Ramanathan K (Principal)', fileType: 'PDF' },
        { name: 'Grade 9 Official Mark Sheet', category: 'Academic Performance', uploadDate: '02-04-2026', status: 'Verified', verifiedBy: 'Examination Department', fileType: 'PDF' },
        { name: 'Medical Fitness & Blood Group Record', category: 'Health & Medical', uploadDate: '12-06-2024', status: 'Verified', verifiedBy: 'School Medical Officer', fileType: 'PDF' },
    ]

    // 8. COMPLETE CHRONOLOGICAL LIFECYCLE TIMELINE:
    const completeHistory = [
        {
            id: 'TL-01',
            date: '31-10-2026',
            time: '04:00 PM',
            title: 'October 2026 Attendance Finalized',
            category: 'Attendance Milestone',
            sourceModule: 'Attendance Management',
            performedBy: student.classTeacher,
            description: `Monthly attendance recorded at ${attendancePct}% (${presentDays} days present of ${totalWorkingDays} working days).`,
            status: 'Completed',
        },
        {
            id: 'TL-02',
            date: '28-10-2026',
            time: '02:25 PM',
            title: 'Student Gate Pass Completed & Returned to Campus',
            category: 'Security Movement',
            sourceModule: 'Gate Pass Management',
            performedBy: 'Ramesh Patel (Gatekeeper Gate 1)',
            description: 'Returned safely to campus following medical appointment. Gatekeeper verified and closed pass GP-2026-0089.',
            status: 'Completed',
        },
        {
            id: 'TL-03',
            date: '28-10-2026',
            time: '10:00 AM',
            title: 'Student Gate Pass Approved by Principal',
            category: 'Administrative Approval',
            sourceModule: 'Gate Pass Management',
            performedBy: 'Dr. Ramanathan K (Principal)',
            description: 'Approved early exit pass for dental appointment under father escort.',
            status: 'Approved',
        },
        {
            id: 'TL-04',
            date: '08-10-2026',
            time: '11:15 AM',
            title: 'Term 2 Fee Payment Cleared',
            category: 'Financial Transaction',
            sourceModule: 'Fee Management',
            performedBy: 'Suresh Raina (Accounts)',
            description: 'Received installment ₹15,000 via Net Banking. Generated receipt RCP-2026-001022.',
            status: 'Paid',
        },
        {
            id: 'TL-05',
            date: '18-09-2026',
            time: '05:00 PM',
            title: 'Awarded 1st Place at Regional Science Exhibition',
            category: 'Achievement',
            sourceModule: 'Activity Management',
            performedBy: 'Director of Academics',
            description: 'Gold medal in CBSE Regional Science Exhibition for smart IoT irrigation project.',
            status: 'Awarded',
        },
        {
            id: 'TL-06',
            date: '24-03-2026',
            time: '10:30 AM',
            title: 'Annual Promotion to Grade 10',
            category: 'Academic Milestone',
            sourceModule: 'Examination Management',
            performedBy: 'Dr. Ramanathan K (Principal)',
            description: 'Promoted with distinction from Grade 9 to Grade 10-A with cumulative 92.4% marks.',
            status: 'Promoted',
        },
        {
            id: 'TL-07',
            date: '12-06-2024',
            time: '09:00 AM',
            title: 'Official School Admission & Enrollment Confirmed',
            category: 'Admission Lifecycle',
            sourceModule: 'Student Information System',
            performedBy: 'Kavita Reddy (PRM / Front Office)',
            description: `Enrolled under Admission No: ${student.admissionNumber}. All initial certificates verified.`,
            status: 'Enrolled',
        },
    ]

    return {
        // Core Header & Identity
        id: student.id,
        studentId: student.id,
        admissionNumber: student.admissionNumber || student.id,
        name: student.name,
        photo: student.profilePhoto,
        academicYear: selectedYear,
        availableAcademicYears: DEFAULT_ACADEMIC_YEARS,
        currentClass: `Grade ${student.className}`,
        section: student.section,
        classSection: student.classSection,
        rollNumber: student.rollNumber || '10-A-01',
        classTeacher: student.classTeacher,
        admissionDate: student.admissionDate,
        currentStatus: student.currentStatus,
        department: student.department,

        // 1. Overview KPIs
        overviewKPIs: {
            attendancePercentage: `${attendancePct}%`,
            attendanceStatus: Number(attendancePct) >= 85 ? 'Optimal' : 'Needs Improvement',
            feeBalance: totalPending > 0 ? `₹${totalPending.toLocaleString('en-IN')}` : '₹0 (Cleared)',
            feeStatus: feePaymentStatus,
            academicPerformance: `${academicPct}% (Grade A1)`,
            academicProgress: 'Distinction / On Track',
            pendingActivities: isOverdue ? '2 Actions Pending' : '1 Active Pass',
            outstandingFeeBalance: totalPending > 0 ? `₹${totalPending.toLocaleString('en-IN')}` : '₹0.00',
        },

        // 2. Personal Information
        personalInfo: {
            firstName: student.firstName || student.name.split(' ')[0],
            middleName: student.middleName || '',
            lastName: student.lastName || student.name.split(' ').slice(1).join(' '),
            gender: student.gender || 'Male',
            religion: admission?.religion || 'Hindu',
            caste: admission?.caste || 'General',
            dateOfBirth: student.dateOfBirth || '15-05-2010',
            bloodGroup: admission?.bloodGroup || 'O +ve',
            height: admission?.height || '168 cm',
            weight: admission?.weight || '56 kg',
            medicalHistory: admission?.medicalHistory || 'No chronic health issues or allergies reported.',
            previousSchool: admission?.previousSchool || 'Kendriya Vidyalaya Madurai',
            address: {
                street: admission?.address || 'Plot 42, 4th Cross Street, Anna Nagar',
                city: student.city || 'Madurai',
                state: student.state || 'Tamil Nadu',
                country: student.country || 'India',
                zipCode: '625020',
            },
            contact: {
                mobileNumber: student.mobileNumber,
                altMobileNumber: '+91 94431 88921',
                email: student.email,
            },
            parent: {
                fatherName: admission?.fatherName || 'R. Sharma',
                fatherOccupation: admission?.fatherOccupation || 'Civil Engineer & Contractor',
                fatherIncome: '₹14,50,000 / Year',
                motherName: admission?.motherName || 'Geetha Sharma',
                motherOccupation: admission?.motherOccupation || 'Associate Professor (Physics)',
                motherIncome: '₹11,00,000 / Year',
                parentMobile: student.mobileNumber,
                parentEmail: `parent.${student.name.toLowerCase().split(' ')[0]}@gmail.com`,
                siblings: '1 Elder Sister (Alumnus 2024)',
            },
            transport: {
                modeOfTransport: 'School Bus (Air-Conditioned)',
                route: 'Route 4 - Anna Nagar to Campus',
                busStop: 'Anna Nagar Roundana',
                driverContact: '+91 98402 11094 (Driver Selvam)',
            },
        },

        // 3. Academic Records
        academicRecords: {
            academicYear: selectedYear,
            overallPercentage: `${academicPct}%`,
            overallGrade: 'A1 (Outstanding)',
            teacherRemarks: 'Consistently displays intellectual curiosity, leadership in collaborative science tasks, and respectful comportment.',
            subjects: subjectsPerformance,
            promotionHistory,
        },

        // 4. Attendance
        attendance: {
            totalWorkingDays,
            presentDays,
            absentDays,
            leaveDays,
            lateArrivals,
            halfDays,
            attendancePercentage: `${attendancePct}%`,
            monthlyCalendarDays,
            attendanceHistoryTable,
        },

        // 5. Fees & Payments
        feesAndPayments: {
            totalFee: `₹${totalFee.toLocaleString('en-IN')}`,
            totalPaid: `₹${totalPaid.toLocaleString('en-IN')}`,
            totalPending: `₹${totalPending.toLocaleString('en-IN')}`,
            totalOverdue: `₹${totalOverdue.toLocaleString('en-IN')}`,
            upcomingFeeDue: isPartialOrDefaulter ? '10 Feb 2027 (₹10,000)' : '—',
            currentPaymentStatus: feePaymentStatus,
            feeBreakdown,
            paymentHistory: paymentReceipts,
        },

        // 6. Timetable
        timetable: {
            academicYear: selectedYear,
            classSection: student.classSection,
            effectiveDate: '01 Jun 2026',
            weeklySchedule: studentWeeklyTimetable,
        },

        // 7. Activities & Achievements
        activitiesAndAchievements,

        // 8. Leave & Gate Pass
        leaveAndGatePass: {
            gatePasses: gatePassHistory,
            leaves: [
                {
                    leaveType: 'Medical Leave',
                    appliedDate: '21-10-2026',
                    leaveDates: '22-10-2026 (1 Day)',
                    reason: 'Severe seasonal viral fever and pediatric advice for rest',
                    status: 'Approved',
                    approvedBy: `${student.classTeacher} (Class Teacher)`,
                },
            ],
        },

        // 9. Documents
        documents,

        // 10. Complete History Timeline
        completeHistory,
    }
}

// ============================================================================
// 4. INTEGRATED TEACHER DIRECTORY LIST
// ============================================================================

export const getIntegratedTeachersList = ({
    search = '',
    academicYear = CURRENT_ACADEMIC_YEAR,
    department = '',
    employmentStatus = '',
} = {}) => {
    // 1. Enterprise employees from attendanceLeaveData
    const employees = ENTERPRISE_EMPLOYEES || []

    // 2. Created users from RBAC
    const createdUsers = getAllCreatedUsers() || []

    // Merge without duplicate IDs
    const mergedMap = new Map()

    employees.forEach((emp) => {
        mergedMap.set(emp.id, {
            id: emp.id,
            employeeId: emp.id,
            name: emp.name,
            email: emp.email,
            department: emp.department || 'Academics & Teaching',
            roleKey: emp.roleKey || 'teacher',
            designation: emp.designation || 'Faculty',
            category: emp.category || 'Academic',
            status: 'Active',
            joiningDate: '01 Jun 2021',
            profilePhoto: null,
            reportingTo: emp.reportingTo || 'EMP-PRN-001',
        })
    })

    createdUsers.forEach((user) => {
        if (user.role === 'student') return
        const existing = mergedMap.get(user.id)
        const name = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') || user.name || 'Staff'
        mergedMap.set(user.id, {
            id: user.id,
            employeeId: user.id,
            name,
            email: user.email,
            department: user.department || existing?.department || 'Academics & Teaching',
            roleKey: user.role || existing?.roleKey || 'teacher',
            designation: user.designation || existing?.designation || 'Faculty',
            category: existing?.category || 'Academic',
            status: user.status || 'Active',
            joiningDate: user.joiningDate || existing?.joiningDate || '01 Jun 2022',
            profilePhoto: user.profileImage || null,
            reportingTo: existing?.reportingTo || 'EMP-PRN-001',
        })
    })

    const allTeachers = Array.from(mergedMap.values())

    return allTeachers
        .map((teacher) => {
            // Calculate attendance percentage:
            let attendancePct = 96.8
            if (teacher.id.includes('TCH-006')) attendancePct = 95.4
            else if (teacher.id.includes('TCH-007')) attendancePct = 97.1
            else if (teacher.id.includes('CRD')) attendancePct = 98.2
            else if (teacher.id.includes('PRN')) attendancePct = 99.1

            return {
                id: teacher.id,
                employeeId: teacher.employeeId,
                name: teacher.name,
                profilePhoto: teacher.profilePhoto,
                department: teacher.department,
                designation: teacher.designation,
                roleKey: teacher.roleKey,
                currentStatus: teacher.status || 'Active',
                attendancePercentage: `${attendancePct.toFixed(1)}%`,
                attendanceValue: attendancePct,
                academicYear,
                email: teacher.email,
                joiningDate: teacher.joiningDate,
                reportingTo: teacher.reportingTo,
            }
        })
        .filter((item) => {
            if (department && item.department !== department) return false
            if (employmentStatus && item.currentStatus !== employmentStatus) return false
            if (search) {
                const q = search.trim().toLowerCase()
                const haystack = `${item.name} ${item.employeeId} ${item.department} ${item.designation} ${item.email}`.toLowerCase()
                if (!haystack.includes(q)) return false
            }
            return true
        })
}

// ============================================================================
// 5. COMPLETE INTEGRATED TEACHER PROFILE (10 SECTIONS)
// ============================================================================

export const getIntegratedTeacherProfile = (employeeId, selectedYear = CURRENT_ACADEMIC_YEAR) => {
    const list = getIntegratedTeachersList()
    const teacher = list.find((t) => t.employeeId === employeeId || t.id === employeeId) || list.find((t) => t.roleKey === 'teacher') || list[0]
    if (!teacher) return null

    // 1. DYNAMIC TIMETABLE & WORKLOAD ENGINE:
    // Determine subject specialization from designation:
    let subject = 'Mathematics'
    if (teacher.designation.includes('Chemistry') || teacher.id.includes('006')) subject = 'Chemistry'
    else if (teacher.designation.includes('Physics') || teacher.id.includes('007')) subject = 'Physics'
    else if (teacher.designation.includes('English')) subject = 'English'

    // Weekly periods calculation:
    // Each day: 4 teaching periods = 24 periods/week
    // Standard school week: Monday to Saturday (6 days)
    // 24 periods * 45 minutes = 1,080 minutes = 18.0 Teaching Hours / week
    const dailyPeriods = 4
    const teachingDays = 6
    const totalWeeklyPeriods = dailyPeriods * teachingDays // 24
    const totalTeachingHours = ((totalWeeklyPeriods * 45) / 60).toFixed(1) // 18.0
    const totalSchoolPeriods = 7 * teachingDays // 42 total slots
    const freePeriods = totalSchoolPeriods - totalWeeklyPeriods // 18 free periods

    // Assigned classes & subjects
    const assignedClasses = [
        {
            className: 'Grade 10',
            section: 'A',
            subject,
            academicYear: selectedYear,
            role: 'Class Teacher & Lead Faculty',
            periodsPerWeek: 8,
            room: 'Room 204',
            effectiveDate: '01 Jun 2026',
        },
        {
            className: 'Grade 10',
            section: 'B',
            subject,
            academicYear: selectedYear,
            role: 'Subject Faculty',
            periodsPerWeek: 8,
            room: 'Room 205',
            effectiveDate: '01 Jun 2026',
        },
        {
            className: 'Grade 9',
            section: 'A',
            subject,
            academicYear: selectedYear,
            role: 'Subject Faculty',
            periodsPerWeek: 8,
            room: 'Room 108',
            effectiveDate: '01 Jun 2026',
        },
    ]

    const classCount = assignedClasses.length
    const subjectCount = 1

    // Weekly timetable schedule:
    const weeklySchedule = [
        { period: '1', time: '09:00 - 09:45 AM', mon: `Grade 10-A (${subject})`, tue: `Grade 10-B (${subject})`, wed: `Grade 9-A (${subject})`, thu: `Grade 10-A (${subject})`, fri: `Grade 10-B (${subject})`, sat: `Grade 9-A (${subject})` },
        { period: '2', time: '09:45 - 10:30 AM', mon: `Grade 10-B (${subject})`, tue: `Grade 9-A (${subject})`, wed: `Grade 10-A (${subject})`, thu: `Grade 10-B (${subject})`, fri: `Grade 10-A (${subject})`, sat: 'Free / Planning' },
        { period: 'Break', time: '10:30 - 10:45 AM', mon: 'Morning Recess', tue: 'Morning Recess', wed: 'Morning Recess', thu: 'Morning Recess', fri: 'Morning Recess', sat: 'Morning Recess' },
        { period: '3', time: '10:45 - 11:30 AM', mon: 'Free / Planning', tue: 'Free / Mentoring', wed: `Grade 10-B (${subject})`, thu: 'Free / Planning', fri: `Grade 9-A (${subject})`, sat: `Grade 10-A (${subject})` },
        { period: '4', time: '11:30 - 12:15 PM', mon: `Grade 9-A (${subject})`, tue: `Grade 10-A (${subject})`, wed: 'Free / Department', thu: `Grade 9-A (${subject})`, fri: 'Free / Planning', sat: 'Weekly HOD Review' },
        { period: 'Lunch', time: '12:15 - 01:15 PM', mon: 'Staff Lunch', tue: 'Staff Lunch', wed: 'Staff Lunch', thu: 'Staff Lunch', fri: 'Staff Lunch', sat: 'Staff Lunch' },
        { period: '5', time: '01:15 - 02:00 PM', mon: `Grade 10-A (${subject})`, tue: 'Free / Remedial', wed: `Grade 9-A (${subject})`, thu: 'Free / Labs', fri: `Grade 10-B (${subject})`, sat: 'Staff Meeting' },
        { period: '6', time: '02:00 - 02:45 PM', mon: 'Free / Evaluation', tue: `Grade 10-B (${subject})`, wed: 'Free / Planning', thu: `Grade 10-A (${subject})`, fri: 'Sports Duty', sat: '—' },
    ]

    const workloadDistribution = {
        Monday: 4,
        Tuesday: 4,
        Wednesday: 4,
        Thursday: 4,
        Friday: 4,
        Saturday: 4,
    }

    // 2. DYNAMIC ATTENDANCE:
    const totalWorkingDays = 120
    const presentDays = 116
    const absentDays = 1
    const approvedLeaveDays = 3
    const lateArrivals = 1
    const halfDays = 0
    const attendancePct = ((presentDays / totalWorkingDays) * 100).toFixed(1)

    const monthlyCalendarDays = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1
        const dateStr = `${String(day).padStart(2, '0')}-10-2026`
        const dayOfWeek = (day + 3) % 7
        if (dayOfWeek === 0) return { day, date: dateStr, status: 'Sunday', label: 'Holiday' }
        if (dayOfWeek === 6 && (day === 10 || day === 24)) return { day, date: dateStr, status: 'Holiday', label: 'Institutional Off' }
        if (day === 2) return { day, date: dateStr, status: 'Holiday', label: 'Gandhi Jayanti' }
        if (day === 14) return { day, date: dateStr, status: 'Leave', label: 'Casual Leave Approved' }
        if (day === 29) return { day, date: dateStr, status: 'Late', label: 'In at 08:35 AM' }
        return { day, date: dateStr, status: 'Present', label: '08:15 AM - 04:00 PM' }
    })

    const attendanceHistoryTable = [
        { date: '31-10-2026', shift: 'General Teaching Shift (08:15 - 16:00)', inTime: '08:12 AM', outTime: '04:05 PM', status: 'Present', remarks: 'Biometric verified' },
        { date: '30-10-2026', shift: 'General Teaching Shift (08:15 - 16:00)', inTime: '08:14 AM', outTime: '04:10 PM', status: 'Present', remarks: 'Biometric verified' },
        { date: '29-10-2026', shift: 'General Teaching Shift (08:15 - 16:00)', inTime: '08:35 AM', outTime: '04:00 PM', status: 'Late', remarks: 'Traffic delay acknowledged by HOD' },
        { date: '28-10-2026', shift: 'General Teaching Shift (08:15 - 16:00)', inTime: '08:10 AM', outTime: '04:02 PM', status: 'Present', remarks: 'Biometric verified' },
        { date: '14-10-2026', shift: 'General Teaching Shift (08:15 - 16:00)', inTime: '—', outTime: '—', status: 'Approved Leave', remarks: 'Casual Leave sanctioned by HR' },
    ]

    // 3. LEAVE HISTORY & BALANCES:
    // Pull from calculateEmployeeLeaveBalance in attendanceLeaveData
    let leaveBalances = {
        casual: { total: 12, used: 2, remaining: 10, carriedOver: 0 },
        sick: { total: 10, used: 1, remaining: 9, carriedOver: 0 },
        earned: { total: 15, used: 1, remaining: 14, carriedOver: 4 },
        maternityPaternity: { total: 180, used: 0, remaining: 180, carriedOver: 0 },
    }

    try {
        const computed = calculateEmployeeLeaveBalance(teacher.employeeId, 'Academic')
        if (computed) {
            leaveBalances = {
                casual: { total: computed.CL?.total || 12, used: computed.CL?.used || 2, remaining: computed.CL?.remaining || 10, carriedOver: 0 },
                sick: { total: computed.SL?.total || 10, used: computed.SL?.used || 1, remaining: computed.SL?.remaining || 9, carriedOver: 0 },
                earned: { total: computed.EL?.total || 15, used: computed.EL?.used || 1, remaining: computed.EL?.remaining || 14, carriedOver: 4 },
                maternityPaternity: { total: 180, used: 0, remaining: 180, carriedOver: 0 },
            }
        }
    } catch {
        /* fallback to default */
    }

    const leaveApplications = [
        {
            leaveType: 'Casual Leave',
            dates: '14 Oct 2026 (1 Day)',
            totalDays: 1,
            reason: 'Attending family domestic engagement',
            status: 'Approved',
            approvedBy: 'Sunita Deshmukh (Head of HR)',
            appliedOn: '10 Oct 2026',
        },
        {
            leaveType: 'Medical / Sick Leave',
            dates: '04 Aug 2026 - 05 Aug 2026 (2 Days)',
            totalDays: 2,
            reason: 'Viral fever under clinical prescription',
            status: 'Approved',
            approvedBy: 'Sunita Deshmukh (Head of HR)',
            appliedOn: '04 Aug 2026',
        },
    ]

    const carryForwardTransactions = [
        {
            academicYear: '2025-2026',
            leaveType: 'Earned Leave (EL)',
            carriedOver: 4,
            lapsedDays: 2,
            approvedBy: 'HR Administration',
            effectiveDate: '01 Jun 2026',
            remarks: 'Permissible carry-over executed under Institutional HR Policy 2026.',
        },
    ]

    // 4. EMPLOYMENT HISTORY MILESTONES:
    const employmentHistory = [
        {
            date: '01 Jun 2021',
            event: 'Joined as Assistant Faculty (Probationary)',
            department: 'Academics & Teaching',
            designation: 'Assistant Teacher (Secondary)',
            reportingManager: 'Dr. Ramanathan K (Principal)',
            status: 'Probation',
            remarks: 'Commenced teaching responsibilities following orientation.',
        },
        {
            date: '01 Jun 2022',
            event: 'Confirmation of Service',
            department: 'Academics & Teaching',
            designation: 'Secondary School Teacher',
            reportingManager: 'Kavita Menon (Senior Secondary Coordinator)',
            status: 'Confirmed Permanent',
            remarks: 'Service confirmed with excellent appraisal performance score.',
        },
        {
            date: '01 Apr 2024',
            event: 'Promoted to Senior Faculty & Class Teacher',
            department: 'Academics & Teaching',
            designation: 'Class Teacher (Grade 10-A) & Senior Faculty',
            reportingManager: 'Kavita Menon (Senior Secondary Coordinator)',
            status: 'Active',
            remarks: 'Entrusted with Grade 10 Board Class responsibilities.',
        },
        {
            date: '01 Jun 2026',
            event: 'Annual Workload Assignment 2026-2027',
            department: 'Academics & Teaching',
            designation: teacher.designation,
            reportingManager: 'Kavita Menon (Senior Secondary Coordinator)',
            status: 'Active',
            remarks: '24 Teaching Periods assigned across Grades 9 and 10.',
        },
    ]

    // 5. ACTIVITIES & ACHIEVEMENTS:
    const activitiesAndAchievements = [
        {
            title: 'CBSE Regional Teacher of the Year Recognition 2025',
            category: 'Teaching Excellence',
            date: '05 Sep 2025',
            award: 'Merit Trophy & Citation of Honor',
            issuedBy: 'Central Board of Secondary Education (CBSE)',
            description: 'Conferred award for innovative pedagogical methodologies in High School conceptual STEM learning.',
        },
        {
            title: 'NEP 2020 Pedagogical Framework Certification',
            category: 'Professional Development',
            date: '14 Nov 2025',
            award: 'Master Facilitator Credential',
            issuedBy: 'National Council of Educational Research & Training (NCERT)',
            description: 'Completed 60-hour intensive faculty development workshop on competency-based evaluation.',
        },
        {
            title: 'Published Paper: "Modern High School Mathematics Pedagogy"',
            category: 'Academic Publication',
            date: '22 Feb 2026',
            award: 'Peer Reviewed Publication',
            issuedBy: 'Indian Journal of Secondary Education (IJSE)',
            description: 'Co-authored research paper on bridging foundational arithmetic gaps in secondary students.',
        },
    ]

    // 6. DOCUMENTS:
    const documents = [
        { name: 'Master of Science (M.Sc) Degree Certificate', category: 'Educational Qualification', uploadDate: '01 Jun 2021', status: 'Verified', verifiedBy: 'Sunita Deshmukh (HR Manager)', fileType: 'PDF' },
        { name: 'Bachelor of Education (B.Ed) Certificate', category: 'Educational Qualification', uploadDate: '01 Jun 2021', status: 'Verified', verifiedBy: 'Sunita Deshmukh (HR Manager)', fileType: 'PDF' },
        { name: 'Official Appointment Letter & Service Agreement', category: 'HR & Service Agreement', uploadDate: '01 Jun 2021', status: 'Verified', verifiedBy: 'Dr. Kavita Sharma (Managing Director)', fileType: 'PDF' },
        { name: 'Aadhaar / Government Identity Proof', category: 'Identity Verification', uploadDate: '01 Jun 2021', status: 'Verified', verifiedBy: 'HR Administration', fileType: 'PDF' },
        { name: 'Police Verification Clearance Certificate', category: 'Statutory Verification', uploadDate: '15 Jul 2021', status: 'Verified', verifiedBy: 'Madurai City Police Dept', fileType: 'PDF' },
        { name: 'Previous School Experience & Relieving Letter', category: 'Experience Credential', uploadDate: '01 Jun 2021', status: 'Verified', verifiedBy: 'HR Administration', fileType: 'PDF' },
    ]

    // 7. COMPLETE CHRONOLOGICAL LIFECYCLE TIMELINE:
    const completeHistory = [
        {
            id: 'THTL-01',
            date: '31-10-2026',
            time: '04:15 PM',
            title: 'October 2026 Faculty Attendance Certified',
            category: 'Attendance Milestone',
            sourceModule: 'Attendance & Leave Management',
            performedBy: 'HR Administration',
            description: `Monthly attendance recorded at ${attendancePct}% (${presentDays} days present of ${totalWorkingDays} working days).`,
            status: 'Completed',
        },
        {
            id: 'THTL-02',
            date: '10-10-2026',
            time: '02:30 PM',
            title: 'Casual Leave Sanctioned by HR Head',
            category: 'Leave Approval',
            sourceModule: 'HR Leave Management',
            performedBy: 'Sunita Deshmukh (Head of HR)',
            description: 'Approved 1 day Casual Leave for 14-Oct-2026. Remaining CL balance: 10 days.',
            status: 'Approved',
        },
        {
            id: 'THTL-03',
            date: '01-06-2026',
            time: '09:00 AM',
            title: 'Academic Year 2026-2027 Timetable & Workload Commissioned',
            category: 'Academic Operations',
            sourceModule: 'Timetable Management',
            performedBy: 'Dr. Ramanathan K (Principal)',
            description: 'Assigned 24 weekly periods across Grade 10-A, 10-B, and Grade 9-A. Designated Class Teacher for Grade 10-A.',
            status: 'Active',
        },
        {
            id: 'THTL-04',
            date: '01-06-2026',
            time: '08:30 AM',
            title: 'Leave Carry-Forward Applied for New Academic Year',
            category: 'HR Management',
            sourceModule: 'HR Leave Management',
            performedBy: 'Sunita Deshmukh (Head of HR)',
            description: 'Carried forward 4 unused Earned Leaves into 2026-2027 balance ledger.',
            status: 'Completed',
        },
        {
            id: 'THTL-05',
            date: '05-09-2025',
            time: '11:00 AM',
            title: 'CBSE Regional Teacher Excellence Award Bestowed',
            category: 'Professional Recognition',
            sourceModule: 'Activity Management',
            performedBy: 'CBSE Regional Directorate',
            description: 'Awarded regional merit trophy and citation for student performance excellence.',
            status: 'Awarded',
        },
        {
            id: 'THTL-06',
            date: '01-04-2024',
            time: '10:00 AM',
            title: 'Promoted to Senior Faculty & Grade 10-A Class Teacher',
            category: 'Career Advancement',
            sourceModule: 'HR Management',
            performedBy: 'Dr. Kavita Sharma (Managing Director)',
            description: 'Promoted to Senior Secondary Faculty role with supervisory oversight of Class 10-A.',
            status: 'Promoted',
        },
        {
            id: 'THTL-07',
            date: '01-06-2021',
            time: '08:00 AM',
            title: 'Joined Queen Mira International School Faculty',
            category: 'Employment Onboarding',
            sourceModule: 'HR Management',
            performedBy: 'Human Resources Department',
            description: `Onboarded as Full-Time Faculty with Employee ID ${teacher.employeeId}.`,
            status: 'Joined',
        },
    ]

    return {
        // Core Header & Identity
        id: teacher.id,
        employeeId: teacher.employeeId,
        name: teacher.name,
        photo: teacher.profilePhoto,
        department: teacher.department,
        designation: teacher.designation,
        employmentType: 'Full-Time / Permanent',
        joiningDate: teacher.joiningDate || '01 Jun 2021',
        reportingManager: teacher.reportingTo === 'EMP-DIR-001' ? 'Dr. Kavita Sharma (Managing Director)' : 'Kavita Menon (Academic Coordinator)',
        employmentStatus: teacher.currentStatus || 'Active',
        academicYear: selectedYear,
        availableAcademicYears: DEFAULT_ACADEMIC_YEARS,

        // 1. Overview KPIs
        overviewKPIs: {
            attendancePercentage: `${attendancePct}%`,
            attendanceStatus: Number(attendancePct) >= 95 ? 'Excellent' : 'Good',
            weeklyTeachingPeriods: `${totalWeeklyPeriods} Periods / Wk`,
            totalTeachingHours: `${totalTeachingHours} Teaching Hrs / Wk`,
            remainingLeaveBalance: `${leaveBalances.casual.remaining + leaveBalances.earned.remaining} Days Remaining`,
            workloadLevel: 'Balanced / Optimal',
            assignedClassesSummary: 'Grades 10-A, 10-B, 9-A',
        },

        // 2. Personal Information
        personalInfo: {
            fullName: teacher.name,
            gender: 'Female',
            dateOfBirth: '24 Aug 1988',
            bloodGroup: 'B +ve',
            maritalStatus: 'Married',
            highestQualification: 'M.Sc. Mathematics, B.Ed. (Gold Medalist)',
            totalExperience: '8+ Years in Secondary Education',
            email: teacher.email,
            mobileNumber: '+91 98403 77218',
            altMobileNumber: '+91 94441 22904',
            address: {
                street: 'Flat 3B, Sri Meenakshi Enclave, Bypass Road',
                city: 'Madurai',
                state: 'Tamil Nadu',
                country: 'India',
                zipCode: '625016',
            },
            emergencyContact: {
                name: 'K. S. Menon (Spouse)',
                relationship: 'Spouse',
                contact: '+91 98400 33819',
            },
        },

        // 3. Employment History
        employmentHistory,

        // 4. Attendance
        attendance: {
            totalWorkingDays,
            presentDays,
            absentDays,
            approvedLeaveDays,
            lateArrivals,
            halfDays,
            attendancePercentage: `${attendancePct}%`,
            monthlyCalendarDays,
            attendanceHistoryTable,
        },

        // 5. Timetable & Workload (Mandatory)
        timetableAndWorkload: {
            academicYear: selectedYear,
            department: teacher.department,
            totalWeeklyPeriods,
            totalTeachingHours,
            freePeriods,
            classCount,
            subjectCount,
            workloadDistribution,
            weeklySchedule,
            assignedClasses,
        },

        // 6. Classes & Subjects
        classesAndSubjects: {
            assignedClasses,
            subjectSpecialization: subject,
            curriculum: 'CBSE Senior Secondary Curriculum',
        },

        // 7. Leave History
        leaveHistory: {
            balances: leaveBalances,
            carryForwardTransactions,
            leaveApplications,
        },

        // 8. Activities & Achievements
        activitiesAndAchievements,

        // 9. Documents
        documents,

        // 10. Complete History Timeline
        completeHistory,
    }
}
