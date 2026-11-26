import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getIntegratedStudentsList,
    getIntegratedStudentProfile,
    getIntegratedTeachersList,
    getIntegratedTeacherProfile,
    getUserDatabasePermissions,
    CURRENT_ACADEMIC_YEAR,
} from '../UserDatabase/userDatabaseIntegrator.js'

test('User Database Module — Complete Student & Teacher Information System Redesign', async (t) => {
    // 1. STUDENT DIRECTORY LIST & FILTERING
    await t.test('1. Student Directory Table: compact structure & multi-field filtering', () => {
        const allStudents = getIntegratedStudentsList()
        assert.ok(allStudents.length >= 10, 'Should load all enrolled students into directory')

        // Verify required compact table fields
        const first = allStudents[0]
        assert.ok(first.name, 'Student must have name')
        assert.ok(first.studentId, 'Student must have unique student ID')
        assert.ok(first.admissionNumber, 'Student must have admission number')
        assert.ok(first.classSection, 'Student must have class and section')
        assert.ok(first.department, 'Student must have academic department')
        assert.ok(first.currentStatus, 'Student must have current status (Active/Graduated/Withdrawn)')
        assert.ok(first.attendancePercentage, 'Student must have attendance percentage')
        assert.ok(first.attendanceValue >= 0 && first.attendanceValue <= 100, 'Attendance value must be 0-100')

        // Test Filter by Name
        const filteredByName = getIntegratedStudentsList({ search: 'Aarav' })
        assert.ok(filteredByName.length >= 1, 'Should filter student by name')
        assert.ok(filteredByName[0].name.includes('Aarav'))

        // Test Filter by Student ID
        const filteredById = getIntegratedStudentsList({ search: first.studentId })
        assert.equal(filteredById.length, 1)
        assert.equal(filteredById[0].studentId, first.studentId)

        // Test Filter by Class
        const grade10Students = getIntegratedStudentsList({ className: '10' })
        assert.ok(grade10Students.length > 0)
        grade10Students.forEach((s) => assert.equal(s.className, '10'))

        // Test Filter by Status
        const activeStudents = getIntegratedStudentsList({ status: 'Active' })
        assert.ok(activeStudents.length > 0)
        activeStudents.forEach((s) => assert.equal(s.currentStatus, 'Active'))
    })

    // 2. STUDENT PROFILE 10 SECTIONS ARCHITECTURE
    await t.test('2. Student Profile: complete 10-section architecture & header data', () => {
        const profile = getIntegratedStudentProfile('STU-2025-1001')
        assert.ok(profile, 'Should return student profile')

        // Header metadata
        assert.equal(profile.studentId, 'STU-2025-1001')
        assert.equal(profile.name, 'Aarav Sharma')
        assert.ok(profile.admissionNumber)
        assert.equal(profile.academicYear, CURRENT_ACADEMIC_YEAR)
        assert.ok(profile.availableAcademicYears.includes(CURRENT_ACADEMIC_YEAR))
        assert.equal(profile.currentClass, 'Grade 10')
        assert.equal(profile.section, 'A')
        assert.equal(profile.classTeacher, 'Priya Menon')
        assert.equal(profile.currentStatus, 'Active')

        // Verify presence of all 10 Profile Sections
        assert.ok(profile.overviewKPIs, 'Section 1: Overview KPIs must exist')
        assert.ok(profile.personalInfo, 'Section 2: Personal Information must exist')
        assert.ok(profile.academicRecords, 'Section 3: Academic Records must exist')
        assert.ok(profile.attendance, 'Section 4: Attendance must exist')
        assert.ok(profile.feesAndPayments, 'Section 5: Fees & Payments must exist')
        assert.ok(profile.timetable, 'Section 6: Timetable must exist')
        assert.ok(profile.activitiesAndAchievements, 'Section 7: Activities & Achievements must exist')
        assert.ok(profile.leaveAndGatePass, 'Section 8: Leave & Gate Pass must exist')
        assert.ok(profile.documents, 'Section 9: Documents must exist')
        assert.ok(profile.completeHistory, 'Section 10: Complete History Timeline must exist')
    })

    // 3. STUDENT DYNAMIC OVERVIEW KPIS
    await t.test('3. Student Overview Dashboard: accurate 4 KPI cards and current status', () => {
        const profile = getIntegratedStudentProfile('STU-2025-1001')
        const kpis = profile.overviewKPIs

        // KPI 1: Attendance Percentage
        assert.equal(kpis.attendancePercentage, '95.0%')
        assert.equal(kpis.attendanceStatus, 'Optimal')

        // KPI 2: Fee Balance
        assert.equal(kpis.feeBalance, '₹0 (Cleared)')
        assert.equal(kpis.feeStatus, 'Paid')

        // KPI 3: Academic Performance
        assert.ok(kpis.academicPerformance.includes('Grade A1'))
        assert.equal(kpis.academicProgress, 'Distinction / On Track')

        // KPI 4: Pending Activities
        assert.ok(kpis.pendingActivities.includes('Active Pass') || kpis.pendingActivities.includes('Pending'))
        assert.equal(kpis.outstandingFeeBalance, '₹0.00')
    })

    // 4. STUDENT FEES & PAYMENT CALCULATION
    await t.test('4. Student Fees & Payments: derived obligations, valid allocations, receipt history', () => {
        const profile = getIntegratedStudentProfile('STU-2025-1001')
        const fees = profile.feesAndPayments

        assert.equal(fees.totalFee, '₹45,000')
        assert.equal(fees.totalPaid, '₹45,000')
        assert.equal(fees.totalPending, '₹0')
        assert.equal(fees.totalOverdue, '₹0')
        assert.equal(fees.currentPaymentStatus, 'Paid')

        // Fee Breakdown by Term
        assert.ok(Array.isArray(fees.feeBreakdown))
        assert.equal(fees.feeBreakdown.length, 3, 'Should have 3 term installments')
        const totalCalculated = fees.feeBreakdown.reduce((sum, item) => sum + item.amount, 0)
        assert.equal(totalCalculated, 45000, 'Sum of installments must match annual obligation')

        // Payment History Receipts
        assert.ok(Array.isArray(fees.paymentHistory))
        assert.ok(fees.paymentHistory.length >= 2, 'Should have valid payment receipts')
        fees.paymentHistory.forEach((rcp) => {
            assert.ok(rcp.receiptNumber, 'Receipt must have receipt number')
            assert.ok(rcp.amountPaid, 'Receipt must have amount')
            assert.ok(rcp.paymentMethod, 'Receipt must have payment method')
            assert.ok(rcp.transactionRef, 'Receipt must have transaction reference')
            assert.equal(rcp.status, 'Paid')
        })
    })

    // 5. STUDENT ATTENDANCE & ACADEMIC PERFORMANCE
    await t.test('5. Student Attendance & Academic Records: calendar synchronization & subject marks', () => {
        const profile = getIntegratedStudentProfile('STU-2025-1001')
        const att = profile.attendance

        assert.equal(att.totalWorkingDays, 120)
        assert.equal(att.presentDays, 114)
        assert.equal(att.absentDays, 3)
        assert.equal(att.leaveDays, 2)
        assert.equal(att.attendancePercentage, '95.0%')

        // Monthly calendar: 31 days of October 2026
        assert.equal(att.monthlyCalendarDays.length, 31)
        assert.equal(att.monthlyCalendarDays[0].status, 'Present') // Oct 1, 2026 (Thursday)
        assert.equal(att.monthlyCalendarDays[1].status, 'Holiday') // Oct 2, 2026 (Gandhi Jayanti)

        // Academic performance
        const academics = profile.academicRecords
        assert.ok(Array.isArray(academics.subjects))
        assert.ok(academics.subjects.length >= 5)
        const math = academics.subjects.find((s) => s.subject === 'Mathematics')
        assert.ok(math)
        assert.equal(math.obtainedMarks, 94)
        assert.equal(math.grade, 'A1')

        // Multi-year promotion history
        assert.ok(Array.isArray(academics.promotionHistory))
        assert.equal(academics.promotionHistory.length, 3)
        assert.equal(academics.promotionHistory[0].academicYear, '2024-2025')
        assert.equal(academics.promotionHistory[1].academicYear, '2025-2026')
        assert.equal(academics.promotionHistory[2].academicYear, '2026-2027')
    })

    // 6. STUDENT GATE PASS & COMPLETE HISTORY TIMELINE
    await t.test('6. Student Gate Pass & Timeline: integrated movement & chronological events', () => {
        const profile = getIntegratedStudentProfile('STU-2025-1001')
        const gpSection = profile.leaveAndGatePass

        assert.ok(Array.isArray(gpSection.gatePasses))
        assert.ok(gpSection.gatePasses.length >= 1)
        const pass = gpSection.gatePasses[0]
        assert.ok(pass.gatePassNumber || pass.id)
        assert.ok(pass.reasonCategory)
        assert.ok(pass.authorizedPersonName)

        // Complete History Timeline
        const history = profile.completeHistory
        assert.ok(Array.isArray(history))
        assert.ok(history.length >= 5)
        // Verify chronological fields
        history.forEach((event) => {
            assert.ok(event.date, 'Event must have date')
            assert.ok(event.title, 'Event must have title')
            assert.ok(event.category, 'Event must have category')
            assert.ok(event.sourceModule, 'Event must cite source module')
            assert.ok(event.performedBy, 'Event must state who performed action')
            assert.ok(event.status, 'Event must have status')
        })
    })

    // 7. TEACHER DIRECTORY LIST & FILTERING
    await t.test('7. Teacher Directory Table: compact structure & department filtering', () => {
        const allTeachers = getIntegratedTeachersList()
        assert.ok(allTeachers.length >= 15, 'Should load enterprise teachers and staff')

        const first = allTeachers[0]
        assert.ok(first.name, 'Teacher must have name')
        assert.ok(first.employeeId, 'Teacher must have employee ID')
        assert.ok(first.department, 'Teacher must have department')
        assert.ok(first.designation, 'Teacher must have designation')
        assert.ok(first.currentStatus, 'Teacher must have current status (Active/Resigned/Inactive)')
        assert.ok(first.attendancePercentage, 'Teacher must have attendance percentage')

        // Filter by Department
        const academicStaff = getIntegratedTeachersList({ department: 'Academics & Teaching' })
        assert.ok(academicStaff.length >= 5)
        academicStaff.forEach((t) => assert.equal(t.department, 'Academics & Teaching'))

        // Filter by Search Name
        const priya = getIntegratedTeachersList({ search: 'Priya' })
        assert.ok(priya.length >= 1)
        assert.ok(priya[0].name.includes('Priya'))
    })

    // 8. TEACHER PROFILE 10 SECTIONS ARCHITECTURE
    await t.test('8. Teacher Profile: complete 10-section architecture & header data', () => {
        const profile = getIntegratedTeacherProfile('EMP-TCH-014')
        assert.ok(profile, 'Should return teacher profile')

        // Header metadata
        assert.equal(profile.employeeId, 'EMP-TCH-014')
        assert.equal(profile.name, 'Priya Menon')
        assert.equal(profile.department, 'Academics & Teaching')
        assert.ok(profile.designation.includes('Math Faculty'))
        assert.equal(profile.employmentType, 'Full-Time / Permanent')
        assert.equal(profile.employmentStatus, 'Active')
        assert.equal(profile.academicYear, CURRENT_ACADEMIC_YEAR)

        // Verify presence of all 10 Teacher Profile Sections
        assert.ok(profile.overviewKPIs, 'Section 1: Overview KPIs must exist')
        assert.ok(profile.personalInfo, 'Section 2: Personal Information must exist')
        assert.ok(profile.employmentHistory, 'Section 3: Employment History must exist')
        assert.ok(profile.attendance, 'Section 4: Attendance must exist')
        assert.ok(profile.timetableAndWorkload, 'Section 5: Timetable & Workload must exist')
        assert.ok(profile.classesAndSubjects, 'Section 6: Classes & Subjects must exist')
        assert.ok(profile.leaveHistory, 'Section 7: Leave History must exist')
        assert.ok(profile.activitiesAndAchievements, 'Section 8: Activities & Achievements must exist')
        assert.ok(profile.documents, 'Section 9: Documents must exist')
        assert.ok(profile.completeHistory, 'Section 10: Complete History Timeline must exist')
    })

    // 9. TEACHER TIMETABLE & WORKLOAD DYNAMIC CALCULATIONS (MANDATORY)
    await t.test('9. Teacher Timetable & Workload: calculated weekly periods, teaching hours, free periods, class count', () => {
        const profile = getIntegratedTeacherProfile('EMP-TCH-014')
        const workload = profile.timetableAndWorkload

        // Required calculated metrics:
        assert.equal(workload.totalWeeklyPeriods, 24, 'Total weekly periods must be 24 (4 periods x 6 days)')
        assert.equal(workload.totalTeachingHours, '18.0', 'Total teaching hours must be 18.0 (24 periods x 45 min / 60)')
        assert.equal(workload.freePeriods, 18, 'Free periods must be 18 (42 total slots - 24 teaching periods)')
        assert.equal(workload.classCount, 3, 'Assigned class count must be 3')
        assert.equal(workload.subjectCount, 1, 'Subject count must be 1')

        // Weekly workload distribution across days
        assert.deepEqual(workload.workloadDistribution, {
            Monday: 4,
            Tuesday: 4,
            Wednesday: 4,
            Thursday: 4,
            Friday: 4,
            Saturday: 4,
        })

        // Weekly schedule grid
        assert.ok(Array.isArray(workload.weeklySchedule))
        assert.ok(workload.weeklySchedule.length >= 6)

        // Assigned classes & subjects
        assert.ok(Array.isArray(workload.assignedClasses))
        assert.equal(workload.assignedClasses.length, 3)
        assert.equal(workload.assignedClasses[0].className, 'Grade 10')
        assert.equal(workload.assignedClasses[0].section, 'A')
        assert.equal(workload.assignedClasses[0].subject, 'Mathematics')
        assert.equal(workload.assignedClasses[0].periodsPerWeek, 8)
    })

    // 10. TEACHER LEAVE HISTORY & BALANCES
    await t.test('10. Teacher Leave Balances & Carry-Forwards: central HR ledger integration', () => {
        const profile = getIntegratedTeacherProfile('EMP-TCH-014')
        const leave = profile.leaveHistory

        // Balances
        assert.ok(leave.balances.casual.total >= 10)
        assert.ok(leave.balances.casual.remaining > 0)
        assert.ok(leave.balances.sick.total >= 8)
        assert.ok(leave.balances.earned.carriedOver >= 4)

        // Carry-Forward Transactions
        assert.ok(Array.isArray(leave.carryForwardTransactions))
        assert.equal(leave.carryForwardTransactions.length, 1)
        assert.equal(leave.carryForwardTransactions[0].carriedOver, 4)
        assert.equal(leave.carryForwardTransactions[0].leaveType, 'Earned Leave (EL)')

        // Leave Applications
        assert.ok(Array.isArray(leave.leaveApplications))
        assert.ok(leave.leaveApplications.length >= 1)
        assert.equal(leave.leaveApplications[0].status, 'Approved')
    })

    // 11. ROLE-BASED ACCESS CONTROL (RBAC)
    await t.test('11. Role-Based Access Control: leadership visibility vs confidential financial & HR data', () => {
        // PRM (Front Office) Permissions
        const prmPerms = getUserDatabasePermissions('prm')
        assert.equal(prmPerms.canViewStudentProfile, true)
        assert.equal(prmPerms.canViewTeacherProfile, true)
        assert.equal(prmPerms.canViewAttendance, true)
        assert.equal(prmPerms.canViewTimetable, true)
        assert.equal(prmPerms.canViewAcademicResults, true)
        assert.equal(prmPerms.canViewEmploymentHistory, true)
        assert.equal(prmPerms.canViewFeeInformation, true, 'PRM can view student fee info for front office billing')
        assert.equal(prmPerms.canViewSensitiveHrInfo, false, 'PRM cannot view sensitive HR compensation')
        assert.equal(prmPerms.canEditProfile, false, 'PRM cannot modify database master records')

        // Principal Permissions
        const principalPerms = getUserDatabasePermissions('principal')
        assert.equal(principalPerms.canViewStudentProfile, true)
        assert.equal(principalPerms.canViewTeacherProfile, true)
        assert.equal(principalPerms.canViewFeeInformation, true)
        assert.equal(principalPerms.canViewSensitiveHrInfo, true)

        // Director Permissions
        const directorPerms = getUserDatabasePermissions('director')
        assert.equal(directorPerms.canViewStudentProfile, true)
        assert.equal(directorPerms.canViewTeacherProfile, true)
        assert.equal(directorPerms.canViewFeeInformation, true)
        assert.equal(directorPerms.canViewSensitiveHrInfo, true)

        // Super Admin Permissions
        const superAdminPerms = getUserDatabasePermissions('super-admin')
        assert.equal(superAdminPerms.canViewStudentProfile, true)
        assert.equal(superAdminPerms.canViewTeacherProfile, true)
        assert.equal(superAdminPerms.canViewFeeInformation, true)
        assert.equal(superAdminPerms.canViewSensitiveHrInfo, true)
        assert.equal(superAdminPerms.canEditProfile, true)

        // Unauthorized Role (e.g. basic Teacher role viewing financial data)
        const teacherPerms = getUserDatabasePermissions('teacher')
        assert.equal(teacherPerms.canViewFeeInformation, false, 'Regular teacher cannot view financial fee balances')
        assert.equal(teacherPerms.canViewSensitiveHrInfo, false, 'Regular teacher cannot view peer HR compensation')
    })
})

