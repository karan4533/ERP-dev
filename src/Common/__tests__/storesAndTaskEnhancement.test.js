import test from 'node:test'
import assert from 'node:assert/strict'
import {
    submitMaterialRequisition,
    getMaterialRequisitions,
    updateRequisitionApproval,
    markRequisitionReadyForCollection,
    markRequisitionCollected
} from '../StoresProcurement/storesProcurementData.js'
import {
    getAnnouncementsForRole,
    addAnnouncement,
    CATEGORY_OPTIONS,
    canCreateAnnouncements
} from '../Announcement/announcementData.js'
import {
    addTask,
    updateTaskStatus,
    closeTask,
    getMyTasks,
    getAllTasks
} from '../TaskManagement/taskManagementData.js'

test('1. Stores Requisition: Unlisted new product request & Ready to Collect announcement dispatch', () => {
    // A. Submit requisition with custom unlisted item
    const req = submitMaterialRequisition({
        requesterId: 'TCH-001',
        requesterName: 'Priya Menon',
        department: 'Academics & Teaching',
        reportingManager: 'Dr. Ramanathan K',
        priority: 'High',
        purpose: 'Science Lab Digital Sensor',
        items: [
            {
                isCustomItem: true,
                itemName: 'Digital Temperature Sensor Vernier Probe',
                category: 'Science Laboratory',
                requestedQty: 4,
                uom: 'Pieces',
                specification: 'USB-C interface with digital calibration'
            }
        ]
    })

    assert.ok(req.id)
    assert.equal(req.items.length, 1)
    assert.equal(req.items[0].isCustomItem, true)
    assert.equal(req.items[0].itemName, 'Digital Temperature Sensor Vernier Probe')
    assert.equal(req.status, 'Submitted')

    // B. Department Head Approval
    const approved = updateRequisitionApproval(req.id, 'Approved', 'Dr. Ramanathan K', 'Principal', 'Sanctioned for laboratory upgrade')
    assert.equal(approved.status, 'HOD Approved')

    // C. Store Officer marks Ready to Collect (triggers collection announcement dispatch)
    const ready = markRequisitionReadyForCollection({
        requisitionId: req.id,
        storeOfficerName: 'Gurpreet Singh',
        pickupLocation: 'Main Stores Desk #1, Ground Floor'
    })

    assert.equal(ready.status, 'Ready to Collect')
    assert.equal(ready.pickupLocation, 'Main Stores Desk #1, Ground Floor')

    // D. Verify announcement was automatically generated and accessible to requester role
    const announcements = getAnnouncementsForRole('teacher')
    const collectionNotice = announcements.find(a => a.title.includes(req.id))
    assert.ok(collectionNotice, 'Collection announcement must be published for teacher role')
    assert.equal(collectionNotice.category, 'Stores & Material Collection')
    assert.ok(collectionNotice.message.includes('ready for pickup at: Main Stores Desk #1, Ground Floor'))

    // E. Collection / Handover confirmation
    const collected = markRequisitionCollected({
        requisitionId: req.id,
        collectedByName: 'Priya Menon'
    })
    assert.equal(collected.status, 'Collected / Closed')
})

test('2. Announcement System: Multi-role creation & category and audience filtering', () => {
    assert.equal(canCreateAnnouncements('teacher'), true)
    assert.equal(canCreateAnnouncements('coordinator'), true)
    assert.equal(canCreateAnnouncements('stationery-store-manager'), true)

    const notice = addAnnouncement({
        title: 'Department Safety Protocol Briefing',
        category: 'Staff Notice',
        message: 'All faculty must attend the safety briefing in the conference hall.',
        audience: ['teacher', 'coordinator', 'admin'],
        priority: 'Important',
        sentBy: 'Safety Officer'
    }, 'teacher')

    assert.ok(notice.id)
    const teacherNotices = getAnnouncementsForRole('teacher')
    assert.ok(teacherNotices.some(n => n.id === notice.id))
})

test('3. Task Management: Department vs Staff assignment, status history & closing', () => {
    // A. Assign task to Department
    const deptTask = addTask({
        title: 'Central Campus Electrical Equipment Power Audit',
        description: 'Verify phase balancing and surge protectors across all lab mains.',
        assignedToType: 'DEPARTMENT',
        assignedDepartment: 'Housekeeping & Campus Maintenance',
        assigneeRole: 'housekeeping-manager',
        assignedByRole: 'principal',
        assignedBy: 'Dr. Ramanathan K (Principal)'
    })

    assert.ok(deptTask.id)
    assert.equal(deptTask.assignedDepartment, 'Housekeeping & Campus Maintenance')
    assert.ok(deptTask.statusHistory.length >= 1)

    // B. Assign task to Individual Staff
    const staffTask = addTask({
        title: 'CBSE Model Paper Chemistry Rubric Preparation',
        description: 'Moderate marking keys for 10-A and 10-B chemistry exams.',
        assignedToType: 'STAFF',
        assignedDepartment: 'Academics & Teaching',
        targetEmployeeName: 'Ananya Roy',
        targetEmployeeId: 'EMP-TCH-006',
        assigneeRole: 'teacher',
        assignedByRole: 'coordinator',
        assignedBy: 'Priya Sundaram (Coordinator)'
    })

    assert.ok(staffTask.id)
    assert.equal(staffTask.assigneeNames[0], 'Ananya Roy')

    // C. Receiver updates status with progress percentage and history note
    const updated = updateTaskStatus(
        staffTask.id,
        'In Progress',
        'Section A answers reviewed and rubric drafted.',
        'Ananya Roy (Teacher)',
        50
    )

    assert.equal(updated.status, 'In Progress')
    assert.equal(updated.progressPercentage, 50)
    assert.ok(updated.statusHistory.length >= 2)
    assert.equal(updated.statusHistory[0].newStatus, 'In Progress')
    assert.equal(updated.statusHistory[0].remarks, 'Section A answers reviewed and rubric drafted.')

    // D. Receiver completes and closes task
    const closed = closeTask({
        taskId: staffTask.id,
        actorName: 'Ananya Roy (Teacher)',
        closureRemarks: 'All 80 questions verified against CBSE blueprint and submitted.'
    })

    assert.equal(closed.status, 'Completed')
    assert.equal(closed.progressPercentage, 100)
    assert.equal(closed.statusHistory[0].newStatus, 'Completed')
})
