import test from 'node:test'
import assert from 'node:assert/strict'
import {
    addTask,
    updateTaskStatus,
    updateTaskDetails,
    acknowledgeTask,
    startTask,
    cancelTask,
    rejectTask,
    closeTask,
    submitTaskForVerification,
    verifyTaskCompletion,
    addTaskComment,
    getMyTasks,
    getTasksAssignedByMe,
    getTaskKpis,
    getAllTasks,
    isTaskOverdue,
    ENTERPRISE_DEPARTMENTS,
    ENTERPRISE_TEAMS
} from '../TaskManagement/taskManagementData.js'

test('Task Management Redesign & Complete Lifecycle Test Suite', async (t) => {
    await t.test('1. KPI Calculations: Total, Received, Created, Overdue', () => {
        const kpis = getTaskKpis('teacher', 'EMP-TCH-006')
        assert.ok(typeof kpis.totalTasks === 'number')
        assert.ok(typeof kpis.receivedTasks === 'number')
        assert.ok(typeof kpis.createdTasks === 'number')
        assert.ok(typeof kpis.overdueTasks === 'number')
        assert.ok(kpis.totalTasks >= kpis.receivedTasks)
    })

    await t.test('2. Assignment Scopes: Individual, Entire Team with exclusion, Department', () => {
        // A. Individual scope
        const indTask = addTask({
            title: 'Prepare Physics Term 1 Rubrics',
            instructions: 'Prepare HOTS marking scheme for Grade 12.',
            department: 'Academics & Teaching',
            dueDate: '15-11-2026',
            priority: 'High',
            scope: 'Individual',
            assigneeRole: 'teacher',
            assigneeUserIds: ['EMP-TCH-002'],
            assigneeNames: ['Priya Sharma'],
            assignedByRole: 'principal',
            assignedBy: 'Dr. Ramanathan K (Principal)',
            assignedById: 'PRIN-001'
        })
        assert.ok(indTask.id)
        assert.equal(indTask.scope, 'Individual')
        assert.equal(indTask.status, 'Assigned')
        assert.deepEqual(indTask.assigneeNames, ['Priya Sharma'])

        // B. Entire Team scope with exclusions
        const teamTask = addTask({
            title: 'Campus Access Badge Re-Issuance',
            instructions: 'Audit RFID gate passes across all active security stations.',
            department: 'Campus Security & Access Control',
            dueDate: '10-11-2026',
            priority: 'Medium',
            scope: 'Entire Team',
            teamId: 'TEAM-SAFETY-SEC',
            teamName: 'Campus Safety & Gate Security Team',
            excludedMemberIds: ['EMP-GK-002'],
            assignedByRole: 'admin',
            assignedBy: 'Suresh Raina (Admin Officer)',
            assignedById: 'ADM-001'
        })
        assert.ok(teamTask.id)
        assert.equal(teamTask.scope, 'Entire Team')
        assert.equal(teamTask.teamId, 'TEAM-SAFETY-SEC')
        assert.ok(teamTask.excludedMemberIds.includes('EMP-GK-002'))

        // C. Department scope
        const deptTask = addTask({
            title: 'Annual Procurement Vendor Audit',
            instructions: 'Review all pending quotation files for Q3.',
            department: 'Stores & Procurement',
            dueDate: '20-11-2026',
            priority: 'Critical',
            scope: 'Department',
            assignedByRole: 'director',
            assignedBy: 'Dr. Kavita Sharma (Director)',
            assignedById: 'DIR-001'
        })
        assert.ok(deptTask.id)
        assert.equal(deptTask.scope, 'Department')
        assert.equal(deptTask.department, 'Stores & Procurement')
    })

    await t.test('3. Complete Task Lifecycle: Draft -> Assigned -> Acknowledged -> In Progress -> Submitted -> Completed', () => {
        // Draft
        const draftTask = addTask({
            title: 'Library Archive Digital Cataloging',
            instructions: 'Catalog rare collection manuscripts.',
            department: 'Administration',
            dueDate: '12-11-2026',
            priority: 'Low',
            scope: 'Individual',
            status: 'Draft',
            assigneeRole: 'librarian',
            assignedByRole: 'admin',
            assignedBy: 'Suresh Raina (Admin Officer)'
        })
        assert.equal(draftTask.status, 'Draft')

        // Assign
        const assigned = updateTaskStatus(draftTask.id, 'Assigned', 'Task officially issued.', 'Suresh Raina')
        assert.equal(assigned.status, 'Assigned')

        // Acknowledge
        const ack = acknowledgeTask(draftTask.id, 'Meera Iyer (Librarian)', 'Task received and confirmed.')
        assert.equal(ack.status, 'Acknowledged')
        assert.equal(ack.statusHistory[0].action, 'STATUS_CHANGED')

        // Start working
        const inProgress = startTask(draftTask.id, 'Meera Iyer (Librarian)', 'Begun digitization.')
        assert.equal(inProgress.status, 'In Progress')
        assert.ok(inProgress.progressPercentage >= 25)

        // Submit deliverables
        const submitted = submitTaskForVerification({
            taskId: draftTask.id,
            evidenceText: 'All 150 rare manuscripts indexed in Koha software with barcoding.',
            evidenceFile: 'digitization_manifest.pdf',
            submitterName: 'Meera Iyer (Librarian)'
        })
        assert.equal(submitted.status, 'Submitted for Verification')
        assert.equal(submitted.progressPercentage, 100)
        assert.ok(submitted.completionEvidence)

        // Approve and complete
        const completed = closeTask({
            taskId: draftTask.id,
            actorName: 'Suresh Raina (Admin Officer)',
            closureRemarks: 'Verified catalog records. Excellent accuracy.'
        })
        assert.equal(completed.status, 'Completed')
        assert.ok(completed.closedAt)
        assert.equal(completed.closedBy, 'Suresh Raina (Admin Officer)')
    })

    await t.test('4. Task Discussion Thread: Adding and persisting comments', () => {
        const task = addTask({
            title: 'Bus Route 14 GPS Sensor Check',
            instructions: 'Inspect vehicle telematics tracker on Bus #14.',
            department: 'Transport & Fleet Logistics',
            dueDate: '08-11-2026',
            priority: 'High',
            scope: 'Individual',
            assigneeRole: 'transport-manager',
            assignedByRole: 'admin',
            assignedBy: 'Suresh Raina'
        })

        const c1 = addTaskComment(task.id, {
            text: 'Sensor power harness replaced this morning.',
            authorName: 'Ramesh Transport',
            authorRole: 'transport-manager'
        })
        assert.ok(c1)
        assert.equal(c1.comments.length, 1)
        assert.equal(c1.comments[0].text, 'Sensor power harness replaced this morning.')

        const c2 = addTaskComment(task.id, {
            text: 'Please test live tracking ping on mobile app.',
            authorName: 'Suresh Raina',
            authorRole: 'admin'
        })
        assert.equal(c2.comments.length, 2)
    })

    await t.test('5. Task Updates & Audit Trail', () => {
        const task = addTask({
            title: 'Lab Fume Hood Calibration',
            instructions: 'Calibrate exhaust air velocity.',
            department: 'Academics & Teaching',
            dueDate: '05-11-2026',
            priority: 'Medium',
            assignedByRole: 'principal',
            assignedBy: 'Dr. Ramanathan K'
        })

        const updated = updateTaskDetails(
            task.id,
            {
                priority: 'Critical',
                dueDate: '10-11-2026'
            },
            'Dr. Ramanathan K'
        )

        assert.equal(updated.priority, 'Critical')
        assert.equal(updated.dueDate, '10-11-2026')
        assert.ok(updated.statusHistory.some((h) => h.action === 'UPDATED'))
    })
})

