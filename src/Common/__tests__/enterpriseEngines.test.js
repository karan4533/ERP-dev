import test from 'node:test'
import assert from 'node:assert/strict'

import {
    getInventoryCatalog,
    submitMaterialRequisition,
    updateRequisitionApproval,
    issueMaterialFromStore,
    createPurchaseOrder,
    updatePurchaseOrderApproval,
    markPODispatched,
    processGoodsReceiptNote,
    getPurchaseOrders,
    getMaterialRequisitions,
    getStockIssues
} from '../StoresProcurement/storesProcurementData.js'

import {
    getGatePasses,
    submitGatePass,
    updateGatePassApproval,
    recordSecurityGateExit,
    recordSecurityGateReturn,
    logVisitorEntry,
    logVisitorExit,
    getVisitorLogs
} from '../GatePassSecurity/gatePassSecurityData.js'

import {
    getPhysicalFiles,
    logFileInward,
    issuePhysicalFile,
    returnPhysicalFile,
    getFileInwardRecords,
    getFileOutwardRecords
} from '../FileRoom/fileRoomData.js'

import {
    getDepartmentTickets,
    raiseDepartmentTicket,
    assignTicketToStaff,
    updateTicketProgress,
    confirmTicketClosure
} from '../DepartmentTicketing/departmentTicketingData.js'

import {
    getAllEmployeeActivities,
    logEmployeeActivity,
    getHierarchicalActivityMonitoring
} from '../EmployeeActivityMonitoring/employeeActivityMonitoringData.js'

import {
    getAllTasks,
    addTask,
    updateTaskStatus,
    submitTaskForVerification,
    verifyTaskCompletion
} from '../TaskManagement/taskManagementData.js'

import {
    getLostItems,
    getFoundItems,
    reportLostItem,
    reportFoundItem,
    submitItemClaim,
    verifyAndHandoverItem,
    findPotentialMatches
} from '../LostAndFound/lostAndFoundData.js'

test('1. Stores & Procurement: Material Requisition, PO Generation, and GRN Inventory Increment', () => {
    const initialCatalog = getInventoryCatalog()
    const a4Prod = initialCatalog.find(p => p.itemCode === 'STN-PPR-A4')
    assert.ok(a4Prod, 'A4 Paper product should exist')
    const initialA4Stock = a4Prod.currentStock

    // Step A: Submit Requisition
    const req = submitMaterialRequisition({
        requesterId: 'EMP-TCH-006',
        requesterName: 'Ananya Roy',
        department: 'Academics & Teaching',
        reportingManager: 'Kavita Menon',
        priority: 'High',
        requiredDate: '02-11-2026',
        purpose: 'Grade 11-A Chemistry Term Examination Papers',
        items: [
            { itemCode: 'STN-PPR-A4', itemName: 'JK Copier A4 Paper Ream', requestedQty: 5 }
        ]
    })
    assert.ok(req.id)
    assert.equal(req.status, 'Submitted')
    assert.equal(req.items.length, 1)

    // Step B: HOD Approval
    const approvedReq = updateRequisitionApproval(req.id, 'Approved', 'Kavita Menon', 'Coordinator', 'Exam papers sanctioned.')
    assert.equal(approvedReq.status, 'HOD Approved')

    // Step C: Stock Issue (decrements inventory)
    const issueRes = issueMaterialFromStore({
        requisitionId: req.id,
        issuedByName: 'Gurpreet Singh',
        isReturnable: false,
        remarks: 'Collected by Ananya Roy'
    })
    assert.ok(issueRes.issueRecord.id)
    assert.equal(issueRes.req.status, 'Stock Issued')

    const catalogAfterIssue = getInventoryCatalog()
    const a4AfterIssue = catalogAfterIssue.find(p => p.itemCode === 'STN-PPR-A4')
    assert.equal(a4AfterIssue.currentStock, initialA4Stock - 5)

    // Step D: Create Purchase Order with Multi-vendor items and automatic tax math
    const po = createPurchaseOrder({
        requisitionRefId: req.id,
        department: 'Academics & Teaching',
        vendorId: 'VEN-001',
        items: [
            {
                itemCode: 'STN-PPR-A4',
                description: 'JK Copier A4 Paper Ream',
                qty: 20,
                unitPrice: 285.00,
                discountPercent: 5,
                taxPercent: 12
            }
        ]
    })
    assert.ok(po.id)
    assert.equal(po.status, 'Pending Approval')
    // 20 * 285 * 0.95 = 5415 base; tax = 5415 * 0.12 = 649.80; grand total = 6064.80
    assert.equal(po.grandTotal, 6064.80)

    // Step E: Executive PO Approval and Dispatch
    const approvedPO = updatePurchaseOrderApproval(po.id, 'Approved', 'Dr. Kavita Sharma (Director)')
    assert.equal(approvedPO.status, 'Approved')

    const dispatchedPO = markPODispatched(po.id)
    assert.equal(dispatchedPO.status, 'Sent to Vendor')

    // Step F: Goods Receipt Note (GRN) posting updates inventory stock automatically
    const grnRes = processGoodsReceiptNote({
        poNumber: po.id,
        deliveryChallanNo: 'DC-APEX-88912',
        invoiceNo: 'INV-APEX-4412',
        receivedByName: 'Gurpreet Singh',
        receivedItems: [
            {
                itemCode: 'STN-PPR-A4',
                description: 'JK Copier A4 Paper Ream',
                orderedQty: 20,
                receivedQty: 20,
                acceptedQty: 20,
                damagedQty: 0
            }
        ],
        remarks: 'All 20 reams received in sealed condition.'
    })
    assert.ok(grnRes.grn.id)
    assert.equal(grnRes.po.status, 'Fully Received')

    const finalCatalog = getInventoryCatalog()
    const a4Final = finalCatalog.find(p => p.itemCode === 'STN-PPR-A4')
    assert.equal(a4Final.currentStock, (initialA4Stock - 5) + 20)
})

test('2. Gate Pass & Security: Returnable Material Workflow & Entry/Exit Logs', () => {
    // Step A: Submit Returnable Gate Pass
    const pass = submitGatePass({
        passType: 'Material',
        materialType: 'Returnable',
        requesterId: 'EMP-TCH-014',
        requesterName: 'Priya Menon',
        department: 'Academics & Teaching',
        responsiblePerson: 'Jaswant Singh',
        destination: 'District Science Fair Exhibition',
        purpose: 'Demonstration of smart robotics kit',
        expectedReturnDate: '03-11-2026',
        vehicleNumber: 'TN 09 BX 4412',
        items: [
            { itemCode: 'IT-PRJ-DL', description: 'Dell 4K Laser Classroom Projector', serialNo: 'DL-99214', qty: 1 }
        ]
    })
    assert.ok(pass.id)
    assert.equal(pass.status, 'Submitted')
    assert.equal(pass.materialType, 'Returnable')

    // Step B: HOD Approval
    const approvedPass = updateGatePassApproval(pass.id, 'Approved', 'Dr. Ramanathan K', 'Principal', 'Permitted.')
    assert.equal(approvedPass.status, 'HOD Approved')

    // Step C: Security Terminal Physical Exit Verification
    const exitPass = recordSecurityGateExit({
        passId: pass.id,
        officerName: 'Bhawani Singh',
        vehicleRegistrationNo: 'TN 09 BX 4412',
        inspectionRemarks: 'Asset tag verified. Van exited campus.'
    })
    assert.equal(exitPass.status, 'Security Cleared Out')
    assert.ok(exitPass.actualExitTimestamp)

    // Step D: Security Terminal Physical Return Verification
    const returnedPass = recordSecurityGateReturn({
        passId: pass.id,
        officerName: 'Bhawani Singh',
        conditionOnReturn: 'Projector returned in pristine condition with power cables.',
        allReturned: true
    })
    assert.equal(returnedPass.status, 'Returned & Verified')
    assert.ok(returnedPass.actualEntryTimestamp)

    // Step E: Visitor Movement Logs
    const visitor = logVisitorEntry({
        visitorName: 'Mr. Arvind Gupta',
        phone: '+91 98840 12345',
        idProofType: 'Aadhaar Card',
        idProofNo: 'XXXX-XXXX-8891',
        purpose: 'Vendor commercial briefing',
        personToMeet: 'Gurpreet Singh',
        department: 'Stores & Procurement'
    })
    assert.ok(visitor.id)
    assert.equal(visitor.status, 'On Campus')

    const checkedOutVisitor = logVisitorExit(visitor.id, 'Ram Singh')
    assert.equal(checkedOutVisitor.status, 'Checked Out')
    assert.ok(checkedOutVisitor.exitTime)
})

test('3. Physical File Room: Physical Coordinates, Inward, Outward & Confidentiality Guard', () => {
    // Step A: Inward physical file dossier
    const inwardRes = logFileInward({
        fileRefNo: 'EXAM/CBSE/XII/2025-26/TAB-01',
        fileName: 'Grade 12 CBSE Practical Examination Consolidated Registers',
        category: 'Examination Tabulation',
        department: 'Academics & Teaching',
        receivedFrom: 'Dr. Subramanian',
        receivedByCustodian: 'Meenakshi Sundaram',
        documentCount: 86,
        building: 'Administrative Block',
        rackNo: 'Rack A',
        shelfNo: 'Shelf 03',
        boxNo: 'Box 12',
        confidentiality: 'Department Restricted'
    })
    assert.ok(inwardRes.newFile.id)
    assert.ok(inwardRes.newInward.id)
    assert.equal(inwardRes.newFile.currentLocationStatus, 'In File Room')
    assert.equal(inwardRes.newFile.storageLocation.rackNo, 'Rack A')

    // Step B: Outward Issue of standard file
    const issueRes = issuePhysicalFile({
        fileId: inwardRes.newFile.id,
        requestedById: 'EMP-TCH-007',
        requestedByName: 'Dr. Subramanian',
        department: 'Academics & Teaching',
        approvedBy: 'Kavita Menon (Coordinator)',
        purpose: 'External examiner mark tabulation audit',
        expectedReturnDate: '04-11-2026'
    })
    assert.ok(issueRes.newOutward.id)
    assert.equal(issueRes.targetFile.currentLocationStatus, 'Checked Out / Issued')
    assert.equal(issueRes.targetFile.heldByUserName, 'Dr. Subramanian')

    // Step C: File Return
    const returnRes = returnPhysicalFile({
        issueId: issueRes.newOutward.id,
        custodianName: 'Meenakshi Sundaram',
        returnCondition: 'Good'
    })
    assert.equal(returnRes.targetFile.currentLocationStatus, 'In File Room')
    assert.equal(returnRes.targetOutward.status, 'Returned')

    // Step D: Confidentiality Guard Test (Strictly Confidential requires MD/Director)
    assert.throws(() => {
        issuePhysicalFile({
            fileId: 'FILE-2026-003', // Institutional Land Deeds (Strictly Confidential)
            requestedById: 'EMP-TCH-006',
            requestedByName: 'Ananya Roy',
            department: 'Academics & Teaching',
            approvedBy: 'Coordinator', // Not MD!
            purpose: 'Curious inspection'
        })
    }, /Strictly Confidential files require explicit Managing Director/i)
})

test('4. Department-Wise Ticketing: Dynamic Routing, SLA & Requester Closure', () => {
    // Step A: Academics employee raises ticket for IT department
    const ticket = raiseDepartmentTicket({
        ticketTitle: 'Chemistry Smartboard Stylus Calibration Fault',
        targetDepartment: 'IT Support & Systems',
        issueCategory: 'Classroom Interactive Smartboard / Projector',
        priority: 'High',
        requestedById: 'EMP-TCH-006',
        requestedByName: 'Ananya Roy',
        requestingDepartment: 'Academics & Teaching',
        location: 'Science Lab 2',
        description: 'Stylus offset by 3 inches on screen.'
    })
    assert.ok(ticket.id)
    assert.equal(ticket.targetDepartment, 'IT Support & Systems')
    assert.equal(ticket.slaHours, 12)
    assert.equal(ticket.status, 'Submitted')

    // Step B: IT Manager assigns to staff
    const assignedTicket = assignTicketToStaff({
        ticketId: ticket.id,
        assignedToId: 'EMP-IT-001',
        assignedToName: 'Rakesh Nair',
        managerName: 'Rakesh Nair (IT Head)',
        instructions: 'Replace optical digitizer board.'
    })
    assert.equal(assignedTicket.status, 'Assigned')
    assert.equal(assignedTicket.assignedToName, 'Rakesh Nair')

    // Step C: Staff marks In Progress and Resolves
    updateTicketProgress({
        ticketId: ticket.id,
        newStatus: 'In Progress',
        actorName: 'Rakesh Nair',
        workNotes: 'Replaced firmware and recalibrated sensor.'
    })

    const resolvedTicket = updateTicketProgress({
        ticketId: ticket.id,
        newStatus: 'Resolved',
        actorName: 'Rakesh Nair',
        workNotes: 'Optical board replaced. Recalibration verified with faculty.',
        resolutionSummary: 'Hardware digitizer replaced with genuine OEM unit.'
    })
    assert.equal(resolvedTicket.status, 'Resolved')
    assert.ok(resolvedTicket.actualResolutionDateTime)

    // Step D: Requester confirms closure with 5-star rating
    const closedTicket = confirmTicketClosure({
        ticketId: ticket.id,
        action: 'Confirmed & Closed',
        requesterName: 'Ananya Roy',
        feedbackRating: 5,
        feedbackComments: 'Smartboard touch is now perfectly aligned. Thank you IT!'
    })
    assert.equal(closedTicket.status, 'Confirmed & Closed')
    assert.equal(closedTicket.requesterFeedback.rating, 5)
})

test('5. Hierarchical Activity Monitoring: Manager Transparency & Scoping', () => {
    // Step A: Log an activity
    const activity = logEmployeeActivity({
        employeeId: 'EMP-TCH-006',
        employeeName: 'Ananya Roy',
        roleKey: 'teacher',
        department: 'Academics & Teaching',
        reportingManagerId: 'EMP-CRD-001',
        activityType: 'Task Execution',
        title: 'Uploaded Grade 11-A Chemistry Term Examination Marks',
        description: 'Completed entry for 30 students.',
        moduleRef: 'Examination & Assessments',
        referenceId: 'EXAM-2026-CH11',
        statusBefore: 'Pending Entry',
        statusAfter: 'Completed'
    })
    assert.ok(activity.id)

    // Step B: Director view has organization-wide activities
    const directorMonitoring = getHierarchicalActivityMonitoring({
        userRole: 'director',
        userDept: 'Executive Governance',
        userId: 'EMP-DIR-001'
    })
    assert.ok(directorMonitoring.summary.totalActivities > 0)
    assert.ok(directorMonitoring.departmentBreakdown.length > 0)

    // Step C: Academic Coordinator view scopes strictly to Academic activities
    const coordMonitoring = getHierarchicalActivityMonitoring({
        userRole: 'coordinator',
        userDept: 'Academics & Teaching',
        userId: 'EMP-CRD-001'
    })
    assert.ok(coordMonitoring.activityStream.every(a => a.department.includes('Academic')))
})

test('6. Two-Way Task Management: Universal Assignment, Evidence & Verification', () => {
    // Step A: Assign task across departments
    const task = addTask({
        title: 'Conduct Fire Hydrant Pressure Test with Gatekeeper Staff',
        description: 'Inspect all campus riser valves and ensure booster pump pressure reaches 7 bar.',
        assigneeRole: 'gatekeeper-manager',
        assigneeUserIds: ['EMP-GKM-001'],
        assigneeNames: ['Bhawani Singh'],
        assignedByRole: 'principal',
        assignedBy: 'Dr. Ramanathan K (Principal)',
        assignedDepartment: 'Campus Security & Access Control',
        priority: 'High',
        checklists: [
            { id: 1, text: 'Check main gate hydrant', completed: false },
            { id: 2, text: 'Check sports complex riser', completed: false }
        ]
    })
    assert.ok(task.id)
    assert.equal(task.status, 'Assigned')

    // Step B: Assignee updates status to In Progress
    updateTaskStatus(task.id, 'In Progress', 'Began testing main gate valve.')

    // Step C: Assignee submits task for verification with evidence
    const submittedTask = submitTaskForVerification({
        taskId: task.id,
        evidenceText: 'All 8 hydrants tested at 7.2 bar pressure. Pressure gauge video recorded.',
        evidenceFile: 'hydrant_test_report.pdf',
        submitterName: 'Bhawani Singh'
    })
    assert.equal(submittedTask.status, 'Submitted for Verification')
    assert.equal(submittedTask.progressPercentage, 100)
    assert.ok(submittedTask.completionEvidence.fileUrl)

    // Step D: Manager reviews and approves task completion
    const verifiedTask = verifyTaskCompletion({
        taskId: task.id,
        decision: 'Completed',
        remarks: 'Excellent work. Pressure certificates verified.',
        rating: 5,
        reviewerName: 'Dr. Ramanathan K (Principal)'
    })
    assert.equal(verifiedTask.status, 'Completed')
    assert.equal(verifiedTask.managerFeedback.rating, 5)
})

test('7. Lost and Found: Reporting, Intelligent Matchmaking & Custodial Handover', () => {
    // Step A: Report Found Item
    const found = reportFoundItem({
        itemName: 'Parker Frontier Matte Black Fountain Pen with Gold Clip',
        category: 'Valuables & Wallets',
        description: 'Found in Senior Faculty lounge sofa cushion.',
        foundLocation: 'Senior Faculty Lounge, 2nd Floor',
        foundById: 'EMP-HK-001',
        foundByName: 'Savitri Devi',
        department: 'Facilities & Campus Sanitation',
        storageLocation: 'Front Office / PRM Reception Safe (Admin Wing)',
        responsibleCustodianId: 'EMP-FO-001',
        responsibleCustodianName: 'Anita Desai'
    })
    assert.ok(found.id)
    assert.equal(found.status, 'In Custody')

    // Step B: Report Lost Item with matching keywords
    const lost = reportLostItem({
        itemName: 'Parker Frontier Black Fountain Pen',
        category: 'Valuables & Wallets',
        description: 'Gold clip fountain pen gifted on Teacher Day.',
        lastSeenLocation: 'Senior Faculty Lounge',
        reportedById: 'EMP-TCH-007',
        reportedByName: 'Dr. Subramanian',
        department: 'Academics & Teaching',
        contactNumber: '+91 94440 22119'
    })
    assert.ok(lost.id)
    // Intelligent matchmaking should have flagged potential match
    assert.equal(lost.status, 'Potential Match Found')
    assert.equal(lost.matchedFoundItemId, found.id)

    // Step C: Claimant submits claim
    const claimRes = submitItemClaim({
        foundItemId: found.id,
        claimantId: 'EMP-TCH-007',
        claimantName: 'Dr. Subramanian',
        claimantDept: 'Academics & Teaching',
        proofDescription: 'Parker gold nib has custom fine tip engraved with year 2024.'
    })
    assert.equal(claimRes.target.status, 'Claim Under Review')
    assert.equal(claimRes.target.claims.length, 1)

    // Step D: Custodian verifies ownership and logs handover
    const handedOver = verifyAndHandoverItem({
        foundItemId: found.id,
        claimantId: 'EMP-TCH-007',
        claimantName: 'Dr. Subramanian',
        proofType: 'Staff ID & Custom Engraving Match',
        custodianName: 'Anita Desai',
        signatureNotes: 'Dr. Subramanian inspected the pen and confirmed ownership.'
    })
    assert.equal(handedOver.status, 'Handed Over')
    assert.ok(handedOver.handoverDetails.handoverDate)

    // Linked lost report is now marked Claimed & Verified
    const lostReports = getLostItems()
    const linkedLost = lostReports.find(l => l.id === lost.id)
    assert.equal(linkedLost.status, 'Claimed & Verified')
})

