import { applyWorkflowDecision, WORKFLOW_TYPES } from '../approvals/approvalEngine.js'
/**
 * Hierarchical Employee Activity Monitoring Data Engine
 * Aggregates operational activities across all departments to provide
 * managerial transparency and upward accountability.
 */

import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData.js'

export const ACTIVITY_STORAGE_KEY = 'schoolerp-employee-activities-v1'

let _memoryActivities = null

export const INITIAL_EMPLOYEE_ACTIVITIES = [
    {
        id: 'ACT-2026-001',
        timestamp: '31-10-2026 10:45 AM',
        date: '31-10-2026',
        employeeId: 'EMP-TCH-006',
        employeeName: 'Ananya Roy',
        roleKey: 'teacher',
        department: 'Academics & Teaching',
        reportingManagerId: 'EMP-CRD-001',
        activityType: 'Ticket Action',
        title: 'Raised IT Support Ticket for Science Lab 2 Smartboard',
        description: 'Reported optical touch sensor failure disrupting Grade 11-A practicals.',
        moduleRef: 'Department Ticketing',
        referenceId: 'TICK-2026-001',
        statusBefore: 'None',
        statusAfter: 'Submitted',
        delayFlag: false,
        evidence: 'smartboard_sensor_error.jpg'
    },
    {
        id: 'ACT-2026-002',
        timestamp: '31-10-2026 10:45 AM',
        date: '31-10-2026',
        employeeId: 'EMP-HK-001',
        employeeName: 'Savitri Devi',
        roleKey: 'housekeeping-manager',
        department: 'Facilities & Campus Sanitation',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Ticket Resolution',
        title: 'Resolved Critical Plumbing Ticket for 3rd Floor Restrooms',
        description: 'Dispatched maintenance technician, reset booster pump relay and restored water lines.',
        moduleRef: 'Department Ticketing',
        referenceId: 'TICK-2026-002',
        statusBefore: 'In Progress',
        statusAfter: 'Resolved',
        delayFlag: false,
        evidence: 'pressure_gauge_test_pass.pdf'
    },
    {
        id: 'ACT-2026-003',
        timestamp: '31-10-2026 10:15 AM',
        date: '31-10-2026',
        employeeId: 'EMP-GKM-001',
        employeeName: 'Bhawani Singh',
        roleKey: 'gatekeeper-manager',
        department: 'Campus Security & Access Control',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Gate Clearance',
        title: 'Security Clearance for Inter-School Expo Projector Returnable Pass',
        description: 'Conducted physical asset inspection on School Van #04 with Driver Jaswant Singh.',
        moduleRef: 'Gate Pass & Security',
        referenceId: 'GP-2026-001',
        statusBefore: 'Stores Verified',
        statusAfter: 'Security Cleared Out',
        delayFlag: false,
        evidence: null
    },
    {
        id: 'ACT-2026-004',
        timestamp: '31-10-2026 09:30 AM',
        date: '31-10-2026',
        employeeId: 'EMP-STR-001',
        employeeName: 'Gurpreet Singh',
        roleKey: 'stationery-store-manager',
        department: 'Stores & Procurement',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Goods Receipt',
        title: 'Posted GRN-2026-001 & Updated Inventory for HP Toner Cartridges',
        description: 'Verified 10 OEM packs against PO-2026-002. Stock levels incremented in central store.',
        moduleRef: 'Stores & Procurement',
        referenceId: 'GRN-2026-001',
        statusBefore: 'Sent to Vendor',
        statusAfter: 'Fully Received',
        delayFlag: false,
        evidence: 'delivery_challan_scan.pdf'
    },
    {
        id: 'ACT-2026-005',
        timestamp: '31-10-2026 09:10 AM',
        date: '31-10-2026',
        employeeId: 'EMP-DRV-001',
        employeeName: 'Jaswant Singh',
        roleKey: 'driver',
        department: 'Transport & Fleet Logistics',
        reportingManagerId: 'EMP-TRN-001',
        activityType: 'Transport Trip',
        title: 'Completed Morning Route #04 Student Onboarding & Drop',
        description: 'Transported 34 students safely to campus. Zero transit incidents logged.',
        moduleRef: 'Transport Management',
        referenceId: 'TRIP-RT04-M',
        statusBefore: 'In Transit',
        statusAfter: 'Completed',
        delayFlag: false,
        evidence: null
    },
    {
        id: 'ACT-2026-006',
        timestamp: '30-10-2026 04:30 PM',
        date: '30-10-2026',
        employeeId: 'EMP-LIB-001',
        employeeName: 'Meenakshi Sundaram',
        roleKey: 'librarian',
        department: 'Academics & Teaching',
        reportingManagerId: 'EMP-PRN-001',
        activityType: 'File Room Action',
        title: 'Inwarded Grade 10 Board Tabulation Dossier into Central File Archive',
        description: 'Indexed sealed mark sheets under Rack A, Shelf 02. Barcode FILE-2026-001 assigned.',
        moduleRef: 'File Room',
        referenceId: 'INW-2026-001',
        statusBefore: 'None',
        statusAfter: 'In File Room',
        delayFlag: false,
        evidence: 'sealed_envelope_index.pdf'
    },
    {
        id: 'ACT-2026-007',
        timestamp: '30-10-2026 02:00 PM',
        date: '30-10-2026',
        employeeId: 'EMP-ADM-001',
        employeeName: 'Suresh Raina',
        roleKey: 'admin',
        department: 'Administration',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Task Execution',
        title: 'Completed Quarterly Fire & Safety Extinguisher Audit Coordination',
        description: 'Accompanied TNDFRS inspector, conducted hydrant pressure checks and filed report.',
        moduleRef: 'Task Management',
        referenceId: 'TSK-ADM-001',
        statusBefore: 'In Progress',
        statusAfter: 'Completed',
        delayFlag: false,
        evidence: 'fire_safety_audit_signed.pdf'
    }
]

// Storage Accessors
export const getAllEmployeeActivities = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryActivities && Array.isArray(_memoryActivities) && _memoryActivities.length > 0) {
        return _memoryActivities
    }
    _memoryActivities = [...INITIAL_EMPLOYEE_ACTIVITIES]
    saveEmployeeActivities(_memoryActivities)
    return _memoryActivities
}

export const saveEmployeeActivities = (activities) => {
    _memoryActivities = activities
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities))
        }
    } catch {
        /* ignore */
    }
}

export const logEmployeeActivity = ({
    employeeId,
    employeeName,
    roleKey,
    department,
    reportingManagerId = '',
    activityType,
    title,
    description = '',
    moduleRef,
    referenceId = '',
    statusBefore = '-',
    statusAfter = '-',
    evidence = null,
    delayFlag = false
}) => {
    const activities = getAllEmployeeActivities()
    const nextSeq = activities.length + 1
    const newId = `ACT-2026-${String(nextSeq).padStart(3, '0')}`

    const now = new Date()
    const nowStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const newActivity = {
        id: newId,
        timestamp: nowStr,
        date: now.toLocaleDateString('en-GB'),
        employeeId,
        employeeName,
        roleKey,
        department,
        reportingManagerId,
        activityType,
        title,
        description,
        moduleRef,
        referenceId,
        statusBefore,
        statusAfter,
        delayFlag,
        evidence
    }

    const updated = [newActivity, ...activities]
    saveEmployeeActivities(updated)
    return newActivity
}

/**
 * Returns hierarchically scoped activity metrics and drill-down data
 */
export const getHierarchicalActivityMonitoring = ({
    userRole,
    viewerRole,
    userDept = '',
    userId = '',
    viewerEmployeeId,
    targetDept = 'ALL',
    departmentFilter,
    targetEmployeeId = 'ALL',
    employeeFilter,
    activityTypeFilter = 'ALL',
    statusFilter = 'ALL',
    reviewStatusFilter = 'ALL'
}) => {
    const effectiveRole = userRole || viewerRole || 'director'
    const effectiveUserId = userId || viewerEmployeeId || ''
    const effectiveDept = targetDept !== 'ALL' ? targetDept : (departmentFilter || 'ALL')
    const effectiveEmpId = targetEmployeeId !== 'ALL' ? targetEmployeeId : (employeeFilter || 'ALL')
    const all = getAllEmployeeActivities()
    const normalizedRole = (userRole || '').trim().toLowerCase()

    // 1. Hierarchical Scoping
    let scoped = all
    if (['director', 'super-admin'].includes(normalizedRole)) {
        // Full Organization Visibility
        scoped = all
    } else if (normalizedRole === 'principal') {
        // School-wide Academic & Student-Facing Operations
        scoped = all.filter((a) => a.department.includes('Academic') || a.department === 'Administration')
    } else if (['coordinator', 'academic_head'].includes(normalizedRole)) {
        // Academic Department Subordinates
        scoped = all.filter((a) => a.department.includes('Academic'))
    } else {
        // Department Heads / Managers: Scope to department
        const deptHeadMap = {
            'stationery-store-manager': 'Stores & Procurement',
            'transport-manager': 'Transport & Fleet Logistics',
            'it-support-manager': 'IT Support & Systems',
            'gatekeeper-manager': 'Campus Security & Access Control',
            'housekeeping-manager': 'Facilities & Campus Sanitation',
            'canteen-manager': 'Dining & Nutrition (Café)',
            'account-head': 'Finance & Accounts',
            'hr': 'Human Resources (HR)',
            'admin': 'Administration'
        }
        const assignedDept = deptHeadMap[normalizedRole] || userDept
        if (assignedDept) {
            scoped = all.filter((a) => a.department === assignedDept || a.employeeId === userId)
        } else {
            // Individual Staff: Strictly Own Activities
            scoped = all.filter((a) => a.employeeId === userId)
        }
    }

    // 2. Apply Dynamic UI Filters
    let filtered = scoped
    if (targetDept !== 'ALL') {
        filtered = filtered.filter((a) => a.department === targetDept)
    }
    if (targetEmployeeId !== 'ALL') {
        filtered = filtered.filter((a) => a.employeeId === targetEmployeeId)
    }
    if (activityTypeFilter !== 'ALL') {
        filtered = filtered.filter((a) => a.activityType === activityTypeFilter)
    }

    // 3. Compute Summary KPIs
    const todayStr = new Date().toLocaleDateString('en-GB')
    const totalActivities = filtered.length
    const todayActivities = filtered.filter((a) => a.date === todayStr).length
    const completedActivities = filtered.filter((a) => ['Completed', 'Resolved', 'Fully Received', 'Security Cleared Out'].includes(a.statusAfter)).length
    const inProgressActivities = filtered.filter((a) => ['In Progress', 'Assigned', 'Submitted'].includes(a.statusAfter)).length
    const delayedActivities = filtered.filter((a) => a.delayFlag).length

    // 4. Department Breakdown
    const deptCounts = {}
    scoped.forEach((a) => {
        deptCounts[a.department] = (deptCounts[a.department] || 0) + 1
    })

    // 5. Subordinate Performers Summary
    const employeeMap = {}
    scoped.forEach((a) => {
        if (!employeeMap[a.employeeId]) {
            employeeMap[a.employeeId] = {
                employeeId: a.employeeId,
                employeeName: a.employeeName,
                department: a.department,
                total: 0,
                completed: 0,
                inProgress: 0,
                lastActivity: a.timestamp
            }
        }
        employeeMap[a.employeeId].total += 1
        if (['Completed', 'Resolved', 'Fully Received', 'Security Cleared Out'].includes(a.statusAfter)) {
            employeeMap[a.employeeId].completed += 1
        } else {
            employeeMap[a.employeeId].inProgress += 1
        }
    })

    const normalizedStream = filtered.map((a) => ({
        ...a,
        id: a.id,
        timestamp: a.timestamp,
        date: a.date,
        employeeId: a.employeeId,
        employeeName: a.employeeName,
        role: a.roleKey || a.role || 'Staff',
        roleKey: a.roleKey || a.role || 'staff',
        department: a.department,
        category: a.moduleRef || a.activityType || 'General Task',
        activityType: a.activityType,
        activityTitle: a.title || a.activityTitle,
        title: a.title || a.activityTitle,
        details: a.description || a.details || '',
        description: a.description || a.details || '',
        status: a.statusAfter || a.status || 'Completed',
        statusBefore: a.statusBefore || 'None',
        statusAfter: a.statusAfter || 'Completed',
        reviewStatus: a.reviewStatus || 'Pending Approval',
        reviewedBy: a.reviewedBy || null,
        reviewedByRole: a.reviewedByRole || null,
        reviewedAt: a.reviewedAt || null,
        reviewRemarks: a.reviewRemarks || '',
        approvalHistory: a.approvalHistory || [],
        delayFlag: Boolean(a.delayFlag),
        evidence: a.evidence || null
    }))

    const pendingReviewCount = normalizedStream.filter((a) => a.reviewStatus === 'Pending Approval').length
    const approvedReviewCount = normalizedStream.filter((a) => a.reviewStatus === 'Approved').length
    const needsRevisionCount = normalizedStream.filter((a) => a.reviewStatus === 'Needs Revision').length

    return {
        summary: {
            totalActivities,
            todayActivities,
            completedActivities,
            inProgressActivities,
            delayedActivities,
            pendingReviewCount,
            approvedReviewCount,
            needsRevisionCount
        },
        departmentBreakdown: Object.entries(deptCounts).map(([department, count]) => ({ department, count })),
        subordinatePerformers: Object.values(employeeMap),
        activities: normalizedStream,
        activityStream: normalizedStream
    }
}



export const reviewEmployeeActivity = ({
    activityId,
    decision, // 'Approved' | 'Needs Revision'
    reviewerName,
    reviewerRole,
    remarks
}) => {
    const list = getAllEmployeeActivities()
    const index = list.findIndex((a) => a.id === activityId)
    if (index === -1) throw new Error(`Activity record not found: ${activityId}`)

    const current = list[index]
    const updated = applyWorkflowDecision({
        workflowType: WORKFLOW_TYPES.EMPLOYEE_DAILY_ACTIVITY,
        entity: {
            ...current,
            status: current.reviewStatus || 'Submitted'
        },
        decision: decision === 'Approved' ? 'Approved' : 'Needs Revision',
        actor: reviewerName,
        actorRole: reviewerRole,
        remarks
    })

    updated.reviewStatus = updated.status
    updated.reviewedBy = reviewerName
    updated.reviewedByRole = reviewerRole
    updated.reviewedAt = new Date().toISOString()
    updated.reviewRemarks = remarks || ''

    list[index] = updated
    saveEmployeeActivities(list)
    return updated
}
