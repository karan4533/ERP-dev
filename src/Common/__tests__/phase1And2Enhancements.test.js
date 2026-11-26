import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
    WORKFLOW_TYPES,
    canUserActOnTier,
    getCurrentTierInfo,
    applyWorkflowDecision
} from '../approvals/approvalEngine.js'

import {
    getActivities,
    addActivity,
    advanceActivityWorkflow,
    enrollStudentInActivity,
    updateStudentActivityAttendance
} from '../Activities/activitiesData.js'

import {
    getAllEmployeeActivities,
    logEmployeeActivity,
    reviewEmployeeActivity,
    getHierarchicalActivityMonitoring
} from '../EmployeeActivityMonitoring/employeeActivityMonitoringData.js'

import {
    getLessonPlans,
    advanceLessonPlanTier,
    updateLessonPlanStatus
} from '../LessonPlanApproval/lessonPlanApprovalData.js'

import {
    saveMarkEntrySession,
    advanceMarkEntryTier,
    getMarkSessionByKey
} from '../MarkEntryApproval/markEntryApprovalData.js'

test('1. Enterprise Approval Engine: Tier validation and permission guards', () => {
    // A. Extracurricular Activity
    const tier1 = getCurrentTierInfo(WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY, 'Submitted')
    assert.equal(tier1.tierNumber, 1)
    assert.equal(tier1.name, 'Front Office / PRM Verification')
    assert.equal(canUserActOnTier(WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY, 'Submitted', 'prm'), true)
    assert.equal(canUserActOnTier(WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY, 'Submitted', 'teacher'), false)

    const tier2 = getCurrentTierInfo(WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY, 'PRM Verified')
    assert.equal(tier2.tierNumber, 2)
    assert.equal(canUserActOnTier(WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY, 'PRM Verified', 'principal'), true)

    const tier3 = getCurrentTierInfo(WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY, 'Principal Approved')
    assert.equal(tier3.tierNumber, 3)
    assert.equal(canUserActOnTier(WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY, 'Principal Approved', 'director'), true)

    // B. Employee Daily Activity (DSR)
    const dsrTier = getCurrentTierInfo(WORKFLOW_TYPES.EMPLOYEE_DAILY_ACTIVITY, 'Submitted')
    assert.equal(dsrTier.tierNumber, 1)
    assert.equal(canUserActOnTier(WORKFLOW_TYPES.EMPLOYEE_DAILY_ACTIVITY, 'Submitted', 'transportmanager'), true)
    assert.equal(canUserActOnTier(WORKFLOW_TYPES.EMPLOYEE_DAILY_ACTIVITY, 'Submitted', 'driver'), false)
})

test('2. Extracurricular Activities: Multi-tier progression, enrolment and attendance', () => {
    const activities = getActivities()
    assert.ok(activities.length > 0)
    const testActivity = activities[0]

    // Enroll participant
    const withParticipant = enrollStudentInActivity(testActivity.id, {
        studentId: 'STU-TST-001',
        studentName: 'Rohan Mehra',
        className: 'Grade 9-B'
    })
    assert.ok(withParticipant.participants.some((p) => p.studentId === 'STU-TST-001'))

    // Mark attendance
    const withAttendance = updateStudentActivityAttendance(testActivity.id, 'STU-TST-001', true, 'Winner', 'Gold Trophy')
    const rohan = withAttendance.participants.find((p) => p.studentId === 'STU-TST-001')
    assert.equal(rohan.attended, true)
    assert.equal(rohan.award, 'Gold Trophy')

    // Advance workflow
    const initialEntity = {
        eventName: 'Inter-School Taekwondo Championship',
        type: 'sports',
        approvalStatus: 'Submitted',
        mdApprovalStatus: 'Pending',
        approvalHistory: []
    }
    const added = addActivity(initialEntity)

    // Tier 1: PRM verifies
    const verified = advanceActivityWorkflow({
        activityId: added.id,
        decision: 'Approved',
        actor: 'Front Office PRM',
        actorRole: 'prm',
        remarks: 'Logistics and venue verified.'
    })
    assert.ok(['PRM Verified', 'Approved'].includes(verified.approvalStatus))
})

test('3. Employee Activity Monitoring: DSR review & HOD sign-off workflow', () => {
    // Log an activity
    const logged = logEmployeeActivity({
        employeeId: 'EMP-TRN-005',
        employeeName: 'Murugan K',
        roleKey: 'driver',
        department: 'Transport & Fleet Logistics',
        activityType: 'Trip Action',
        title: 'Completed Evening Student Drop Route #07',
        description: 'Dropped 28 students safely. Vehicle odometer logged.',
        moduleRef: 'Transport Management',
        referenceId: 'TRIP-RT07-E'
    })
    assert.ok(logged.id)

    // Review & Sign-Off by HOD
    const reviewed = reviewEmployeeActivity({
        activityId: logged.id,
        decision: 'Approved',
        reviewerName: 'Karthik (Transport Manager)',
        reviewerRole: 'transportmanager',
        remarks: 'Route completed without delay. Log verified.'
    })
    assert.equal(reviewed.reviewStatus, 'Approved')
    assert.equal(reviewed.reviewedBy, 'Karthik (Transport Manager)')
    assert.ok(reviewed.approvalHistory.length > 0)

    // Check hierarchical monitoring query
    const monitoring = getHierarchicalActivityMonitoring({
        userRole: 'transportmanager',
        userDept: 'Transport & Fleet Logistics'
    })
    assert.ok(monitoring.activities.length > 0)
    assert.ok(typeof monitoring.summary.pendingReviewCount === 'number')
})

test('4. Academic Approvals: 3-tier Lesson Plan and Mark Entry with Principal tier', () => {
    // Lesson Plan: Draft -> Coordinator Reviewed -> Principal Approved -> Approved
    const plan = {
        id: 'LP-TEST-001',
        subject: 'Mathematics',
        submitterName: 'Mr. Anil Kumar',
        submitterRole: 'Teacher',
        className: 'Grade 10',
        section: 'A',
        title: 'Quadratic Equations & Roots',
        approvalStatus: 'Pending',
        approvalHistory: []
    }

    const tier1 = advanceLessonPlanTier({
        id: 'LP-001', // existing or new
        decision: 'Approved',
        actor: 'Ms. Priya Nair (Coordinator)',
        actorRole: 'coordinator',
        remarks: 'Lesson structure aligned with syllabus.'
    })
    assert.ok(tier1)

    // Mark Entry: Teacher -> Coordinator -> Principal -> DA
    const sessionKey = '2026 - 2027|Term 1|Mid Term|10|A|Mathematics'
    saveMarkEntrySession({
        contextKey: sessionKey,
        className: '10',
        section: 'A',
        subject: 'Mathematics',
        exam: 'Mid Term',
        academicYear: '2026 - 2027',
        term: 'Term 1',
        status: 'submitted',
        approvalStatus: 'Pending',
        entries: {},
        approvalHistory: []
    })

    const reviewedMarks = advanceMarkEntryTier({
        contextKey: sessionKey,
        decision: 'Approved',
        actor: 'Gayathri (Coordinator)',
        actorRole: 'coordinator',
        remarks: 'Mark tabulation checked.'
    })
    assert.equal(reviewedMarks.approvalStatus, 'Coordinator Reviewed')

    const principalApprovedMarks = advanceMarkEntryTier({
        contextKey: sessionKey,
        decision: 'Approved',
        actor: 'Dr. Ramanathan (Principal)',
        actorRole: 'principal',
        remarks: 'Principal sanction granted.'
    })
    assert.equal(principalApprovedMarks.approvalStatus, 'Principal Approved')
})
