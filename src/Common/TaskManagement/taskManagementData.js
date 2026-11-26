import {
    canAssignToRole,
    DEMO_USER_ID_BY_ROLE,
    getRoleLabel,
    getUsersByRole,
} from './taskManagementConfig.js'
import { recordAuditLog, dispatchNotification } from '../AuditAndNotifications/centralAuditEngine.js'
import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData.js'

export const STORAGE_KEY = 'school-erp-task-management'

let _memoryTasks = null

const formatDate = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return String(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

export const parseTaskDate = (dateStr) => {
    if (!dateStr) return null
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr
    const str = String(dateStr).trim()
    const parts = str.split(/[-/]/)
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            // YYYY-MM-DD
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        } else if (parts[2].length === 4) {
            // DD-MM-YYYY
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
        }
    }
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
}

export const isTaskOverdue = (task) => {
    if (!task || !task.dueDate) return false
    const closedStatuses = ['Completed', 'Closed', 'Cancelled', 'Draft']
    if (closedStatuses.includes(task.status)) return false
    const due = parseTaskDate(task.dueDate)
    if (!due) return false
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    return due < now
}

export const ENTERPRISE_DEPARTMENTS = [
    { id: 'ACADEMICS', name: 'Academics & Teaching', defaultRole: 'teacher' },
    { id: 'ADMIN', name: 'Administration', defaultRole: 'admin' },
    { id: 'STORES', name: 'Stores & Procurement', defaultRole: 'stationery-store-manager' },
    { id: 'FINANCE', name: 'Finance & Accounts', defaultRole: 'account-head' },
    { id: 'IT', name: 'IT Support & Systems', defaultRole: 'it-support-manager' },
    { id: 'SECURITY', name: 'Campus Security & Access Control', defaultRole: 'gatekeeper-manager' },
    { id: 'FACILITIES', name: 'Facilities & Campus Sanitation', defaultRole: 'housekeeping-manager' },
    { id: 'TRANSPORT', name: 'Transport & Fleet Logistics', defaultRole: 'transport-manager' },
    { id: 'HR', name: 'Human Resources (HR)', defaultRole: 'hr' },
    { id: 'DINING', name: 'Dining & Nutrition (Café)', defaultRole: 'canteen-manager' },
    { id: 'GOVERNANCE', name: 'Executive Governance', defaultRole: 'director' }
]

export const ENTERPRISE_TEAMS = [
    {
        id: 'TEAM-ACAD-SR',
        name: 'Senior Secondary Faculty Team',
        department: 'Academics & Teaching',
        members: [
            { id: 'EMP-TCH-006', name: 'Ananya Roy', role: 'teacher', designation: 'Chemistry Faculty' },
            { id: 'EMP-TCH-001', name: 'Sandy Selva', role: 'teacher', designation: 'Senior Mathematics Faculty' },
            { id: 'EMP-TCH-002', name: 'Priya Sharma', role: 'teacher', designation: 'Physics Faculty' }
        ]
    },
    {
        id: 'TEAM-ACAD-JR',
        name: 'Primary & Middle Wing Faculty',
        department: 'Academics & Teaching',
        members: [
            { id: 'EMP-TCH-003', name: 'Arjun Menon', role: 'teacher', designation: 'English Faculty' },
            { id: 'EMP-TCH-004', name: 'Pooja Hegde', role: 'teacher', designation: 'Social Studies Faculty' },
            { id: 'EMP-TCH-005', name: 'Vikram Seth', role: 'teacher', designation: 'Biology Faculty' }
        ]
    },
    {
        id: 'TEAM-ADMIN-OPS',
        name: 'Administrative & Front Office Team',
        department: 'Administration',
        members: [
            { id: 'EMP-ADM-001', name: 'Suresh Raina', role: 'admin', designation: 'Administrative Officer' },
            { id: 'EMP-PRM-001', name: 'Kavita Reddy', role: 'prm', designation: 'Front Office Lead / PRM' },
            { id: 'EMP-PRM-002', name: 'Lakshmi R.', role: 'prm', designation: 'Reception Desk Coordinator' }
        ]
    },
    {
        id: 'TEAM-STORES-LOG',
        name: 'Stores, Procurement & Logistics Team',
        department: 'Stores & Procurement',
        members: [
            { id: 'EMP-STR-001', name: 'Gurpreet Singh', role: 'stationery-store-manager', designation: 'Store Officer' },
            { id: 'EMP-STR-002', name: 'Rajesh G.', role: 'stationery-store-manager', designation: 'Inventory Executive' }
        ]
    },
    {
        id: 'TEAM-SAFETY-SEC',
        name: 'Campus Safety & Gate Security Team',
        department: 'Campus Security & Access Control',
        members: [
            { id: 'EMP-GKM-001', name: 'Vignesh S.', role: 'gatekeeper-manager', designation: 'Chief Security Officer' },
            { id: 'EMP-GK-001', name: 'Suresh P.', role: 'gate-keeper', designation: 'Main Gate Marshal' },
            { id: 'EMP-GK-002', name: 'Manoj T.', role: 'gate-keeper', designation: 'North Gate Security Guard' }
        ]
    },
    {
        id: 'TEAM-MAINT-HOUSE',
        name: 'Facilities & Campus Maintenance Team',
        department: 'Facilities & Campus Sanitation',
        members: [
            { id: 'EMP-HKM-001', name: 'Manjula Devi', role: 'housekeeping-manager', designation: 'Facilities Supervisor' },
            { id: 'EMP-HKM-002', name: 'Raju K.', role: 'housekeeping-manager', designation: 'Senior Sanitation Inspector' }
        ]
    },
    {
        id: 'TEAM-IT-INFRA',
        name: 'IT Infrastructure & Digital Systems Team',
        department: 'IT Support & Systems',
        members: [
            { id: 'EMP-IT-001', name: 'Karthik Raja', role: 'it-support-manager', designation: 'IT Systems Admin' },
            { id: 'EMP-IT-002', name: 'Deepak V.', role: 'it-support-manager', designation: 'Network Support Specialist' }
        ]
    },
    {
        id: 'TEAM-FINANCE-ACCTS',
        name: 'Accounts, Fees & Billing Desk',
        department: 'Finance & Accounts',
        members: [
            { id: 'EMP-ACT-001', name: 'Ramesh Sundaram', role: 'account-head', designation: 'Head of Accounts & Audit' },
            { id: 'EMP-ACT-002', name: 'Sneha Jain', role: 'account-head', designation: 'Fee Collection Accountant' }
        ]
    }
]

export const getAllDepartments = () => ENTERPRISE_DEPARTMENTS

export const getEmployeesByDepartment = (deptName) => {
    if (!deptName) return ENTERPRISE_EMPLOYEES
    const target = deptName.toLowerCase().trim()
    return ENTERPRISE_EMPLOYEES.filter((emp) => {
        const d = (emp.department || '').toLowerCase()
        return d.includes(target) || target.includes(d)
    })
}

export const getAllTeams = () => ENTERPRISE_TEAMS

const INITIAL_ENTERPRISE_TASKS = [
    {
        id: 'TSK-ADM-001',
        taskId: 'TSK-ADM-001',
        title: 'Quarterly Fire Safety Equipment & Hydrant Inspection',
        description: 'Coordinate with TNDFRS inspector for campus hydrant pressure certification and replace expired CO2 cylinders.',
        instructions: 'Coordinate with TNDFRS inspector for campus hydrant pressure certification and replace expired CO2 cylinders. Ensure all 42 campus fire extinguishers have stamped inspection tags.',
        assigneeRole: 'admin',
        assigneeUserIds: ['ADM-001', 'EMP-ADM-001'],
        assigneeNames: ['Suresh Raina (Admin Officer)'],
        scope: 'Individual',
        assignedToType: 'STAFF',
        assignedByRole: 'super-admin',
        assignedBy: 'Arunachalam S (Super Admin)',
        assignedById: 'SA-001',
        assignedDepartment: 'Administration',
        department: 'Administration',
        priority: 'High',
        assignedDate: '28-10-2026',
        dueDate: '31-10-2026',
        status: 'Completed',
        progressPercentage: 100,
        checklists: [
            { id: 1, text: 'Inspect all 42 campus fire extinguishers', completed: true },
            { id: 2, text: 'Test hydrant booster pump pressure', completed: true },
            { id: 3, text: 'Obtain TNDFRS inspection sign-off certificate', completed: true }
        ],
        completionEvidence: {
            text: 'Fire safety audit completed successfully. Certificate renewed for 2026-27.',
            fileUrl: 'fire_safety_audit_signed.pdf',
            submittedAt: '30-10-2026 02:00 PM'
        },
        statusHistory: [
            { id: 'H1', timestamp: '30-10-2026 04:30 PM', action: 'STATUS_CHANGED', actor: 'Arunachalam S (Super Admin)', previousStatus: 'Submitted', newStatus: 'Completed', previousValue: 'Submitted', newValue: 'Completed', progressPercentage: 100, remarks: 'Thorough inspection completed on time.' },
            { id: 'H2', timestamp: '30-10-2026 02:00 PM', action: 'SUBMITTED', actor: 'Suresh Raina (Admin Officer)', previousStatus: 'In Progress', newStatus: 'Submitted', previousValue: 'In Progress', newValue: 'Submitted', progressPercentage: 100, remarks: 'Fire safety audit completed successfully. Certificate renewed for 2026-27.' },
            { id: 'H3', timestamp: '28-10-2026 09:00 AM', action: 'CREATED', actor: 'Arunachalam S (Super Admin)', previousStatus: 'Draft', newStatus: 'Assigned', previousValue: 'Draft', newValue: 'Assigned', progressPercentage: 0, remarks: 'Task directive issued to Admin team.' }
        ],
        comments: [
            { id: 'C1', authorName: 'Suresh Raina', authorRole: 'admin', text: 'TNDFRS inspector scheduled for tomorrow morning 10 AM.', timestamp: '29-10-2026 11:30 AM' },
            { id: 'C2', authorName: 'Arunachalam S', authorRole: 'super-admin', text: 'Keep the pump room logs ready for review.', timestamp: '29-10-2026 01:15 PM' }
        ],
        managerFeedback: {
            reviewedBy: 'Arunachalam S',
            reviewedAt: '30-10-2026 04:30 PM',
            remarks: 'Thorough inspection completed on time.',
            rating: 5
        }
    },
    {
        id: 'TSK-PRN-002',
        taskId: 'TSK-PRN-002',
        title: 'Grade 10 Model Examination Blueprint & Question Moderation',
        description: 'Review chemistry and physics question papers against CBSE 2026 sample paper blueprints.',
        instructions: 'Review chemistry and physics question papers against CBSE 2026 sample paper blueprints. Verify question distributions, HOTS marking scheme, and sectional time allotments.',
        assigneeRole: 'teacher',
        assigneeUserIds: ['TCH-001', 'EMP-TCH-006'],
        assigneeNames: ['Ananya Roy (Chemistry Faculty)'],
        scope: 'Individual',
        assignedToType: 'STAFF',
        assignedByRole: 'principal',
        assignedBy: 'Dr. Ramanathan K (Principal)',
        assignedById: 'PRIN-001',
        assignedDepartment: 'Academics & Teaching',
        department: 'Academics & Teaching',
        priority: 'Critical',
        assignedDate: '30-10-2026',
        dueDate: '08-11-2026',
        status: 'In Progress',
        progressPercentage: 65,
        checklists: [
            { id: 1, text: 'Review section-wise mark distribution (80 Marks)', completed: true },
            { id: 2, text: 'Verify HOTS and case-based question alignment', completed: true },
            { id: 3, text: 'Prepare answer scheme and rubrics', completed: false }
        ],
        statusHistory: [
            { id: 'H201', timestamp: '31-10-2026 10:00 AM', action: 'STATUS_CHANGED', actor: 'Ananya Roy', previousStatus: 'Acknowledged', newStatus: 'In Progress', previousValue: 'Acknowledged', newValue: 'In Progress', progressPercentage: 65, remarks: 'Started paper blueprint moderation.' },
            { id: 'H202', timestamp: '30-10-2026 04:00 PM', action: 'ACKNOWLEDGED', actor: 'Ananya Roy', previousStatus: 'Assigned', newStatus: 'Acknowledged', previousValue: 'Assigned', newValue: 'Acknowledged', progressPercentage: 0, remarks: 'Task received and acknowledged.' },
            { id: 'H203', timestamp: '30-10-2026 09:30 AM', action: 'CREATED', actor: 'Dr. Ramanathan K (Principal)', previousStatus: 'Draft', newStatus: 'Assigned', previousValue: 'Draft', newValue: 'Assigned', progressPercentage: 0, remarks: 'Model exam blueprint task assigned.' }
        ],
        comments: [
            { id: 'C201', authorName: 'Ananya Roy', authorRole: 'teacher', text: 'Section A & B question keys have been drafted. Reviewing Section C case studies.', timestamp: '31-10-2026 02:45 PM' }
        ],
        completionEvidence: null,
        managerFeedback: null
    },
    {
        id: 'TSK-DIR-003',
        taskId: 'TSK-DIR-003',
        title: 'Central Science Lab Chemical & Consumables Safety Audit',
        description: 'Verify storage protocol for concentrated acids and update flammable chemical stock register.',
        instructions: 'Verify storage protocol for concentrated acids and update flammable chemical stock register. Ensure chemical cabinets are double-locked and emergency eyewash is operational.',
        assigneeRole: 'stationery-store-manager',
        assigneeUserIds: ['STR-001', 'EMP-STR-001'],
        assigneeNames: ['Gurpreet Singh (Store Officer)'],
        scope: 'Entire Team',
        teamId: 'TEAM-STORES-LOG',
        teamName: 'Stores, Procurement & Logistics Team',
        assignedToType: 'TEAM',
        assignedByRole: 'director',
        assignedBy: 'Dr. Kavita Sharma (Director)',
        assignedById: 'DIR-001',
        assignedDepartment: 'Stores & Procurement',
        department: 'Stores & Procurement',
        priority: 'High',
        assignedDate: '29-10-2026',
        dueDate: '01-11-2026',
        status: 'Submitted',
        progressPercentage: 100,
        checklists: [
            { id: 1, text: 'Audit hazardous chemical locker locks and ventilation', completed: true },
            { id: 2, text: 'Reconcile physical stock against store register', completed: true },
            { id: 3, text: 'Restock emergency eye-wash station', completed: true }
        ],
        statusHistory: [
            { id: 'H301', timestamp: '31-10-2026 11:30 AM', action: 'SUBMITTED', actor: 'Gurpreet Singh', previousStatus: 'In Progress', newStatus: 'Submitted', previousValue: 'In Progress', newValue: 'Submitted', progressPercentage: 100, remarks: 'Safety checklist completed. Attached signoff report.' },
            { id: 'H302', timestamp: '29-10-2026 10:15 AM', action: 'CREATED', actor: 'Dr. Kavita Sharma (Director)', previousStatus: 'Draft', newStatus: 'Assigned', previousValue: 'Draft', newValue: 'Assigned', progressPercentage: 0, remarks: 'Store safety inspection assigned.' }
        ],
        comments: [],
        completionEvidence: {
            text: 'All acid storage cabinets secured with dual-key locks. Eye-wash station tested.',
            fileUrl: 'chemical_safety_checklist.pdf',
            submittedAt: '31-10-2026 11:30 AM'
        },
        managerFeedback: null
    },
    {
        id: 'TSK-PRM-004',
        taskId: 'TSK-PRM-004',
        title: 'New Admission Inquiry Follow-Up & Parent Document Kit Dispatch',
        description: 'Contact shortlisted Grade 1 & 4 applicant parents and dispatch prospectus packages.',
        instructions: 'Follow up with 18 prospective admission leads from open house weekend. Prepare and dispatch digital prospectus kits and schedule campus walkthroughs.',
        assigneeRole: 'prm',
        assigneeUserIds: ['FO-001', 'EMP-PRM-001'],
        assigneeNames: ['Kavita Reddy (Front Office Lead)'],
        scope: 'Department',
        assignedToType: 'DEPARTMENT',
        assignedByRole: 'principal',
        assignedBy: 'Dr. Ramanathan K (Principal)',
        assignedById: 'PRIN-001',
        assignedDepartment: 'Administration',
        department: 'Administration',
        priority: 'Medium',
        assignedDate: '01-11-2026',
        dueDate: '09-11-2026',
        status: 'Assigned',
        progressPercentage: 20,
        checklists: [
            { id: 1, text: 'Filter leads with complete documentation', completed: true },
            { id: 2, text: 'Schedule appointment slots for parent visits', completed: false }
        ],
        statusHistory: [
            { id: 'H401', timestamp: '01-11-2026 09:00 AM', action: 'CREATED', actor: 'Dr. Ramanathan K (Principal)', previousStatus: 'Draft', newStatus: 'Assigned', previousValue: 'Draft', newValue: 'Assigned', progressPercentage: 0, remarks: 'Admission inquiry follow-up task issued.' }
        ],
        comments: [],
        completionEvidence: null,
        managerFeedback: null
    }
]

const readTasks = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        // ignore invalid storage
    }
    if (_memoryTasks && Array.isArray(_memoryTasks) && _memoryTasks.length > 0) {
        return _memoryTasks
    }
    _memoryTasks = [...INITIAL_ENTERPRISE_TASKS]
    writeTasks(_memoryTasks)
    return _memoryTasks
}

const writeTasks = (tasks) => {
    _memoryTasks = tasks
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
        }
    } catch {
        /* ignore */
    }
}

export const getAllTasks = () => readTasks()

export const getTasksAssignedByRole = (assignerRole) =>
    readTasks().filter((task) => task.assignedByRole === assignerRole)

export const isTaskAssignedToUser = (task, roleKey, userId) => {
    if (!task) return false

    // Direct role match
    if (roleKey && task.assigneeRole === roleKey) return true

    // Direct user ID match
    if (userId && Array.isArray(task.assigneeUserIds) && task.assigneeUserIds.includes(userId)) return true
    if (userId && task.targetEmployeeId === userId) return true

    // If scope is Department
    if (task.scope === 'Department' || task.assignedToType === 'DEPARTMENT') {
        const emp = ENTERPRISE_EMPLOYEES.find(e => e.id === userId || e.roleKey === roleKey)
        const targetDept = (task.department || task.assignedDepartment || '').toLowerCase().trim()
        if (emp && emp.department && targetDept) {
            const empDept = emp.department.toLowerCase()
            if (empDept.includes(targetDept) || targetDept.includes(empDept)) {
                return true
            }
        }
    }

    // If scope is Entire Team
    if (task.scope === 'Entire Team' || task.assignedToType === 'TEAM') {
        const team = ENTERPRISE_TEAMS.find(t => t.id === task.teamId || t.name === task.teamName)
        if (team && Array.isArray(team.members)) {
            const isMember = team.members.some(m => m.id === userId || m.role === roleKey)
            const isExcluded = Array.isArray(task.excludedMemberIds) && task.excludedMemberIds.includes(userId)
            if (isMember && !isExcluded) return true
        }
    }

    return false
}

export const isTaskCreatedByUser = (task, roleKey, userId) => {
    if (!task) return false
    if (roleKey && task.assignedByRole === roleKey) return true
    if (userId && task.assignedById === userId) return true
    return false
}

export const getMyTasks = (roleKey, userId) =>
    readTasks().filter((task) => isTaskAssignedToUser(task, roleKey, userId))

export const getTasksAssignedByMe = (roleKey, userId) =>
    readTasks().filter((task) => isTaskCreatedByUser(task, roleKey, userId))

export const getTaskById = (taskId) =>
    readTasks().find((task) => task.id === taskId || task.taskId === taskId)

export const getTaskKpis = (roleKey, userId) => {
    const all = readTasks()
    const received = all.filter((t) => isTaskAssignedToUser(t, roleKey, userId))
    const created = all.filter((t) => isTaskCreatedByUser(t, roleKey, userId))

    const isLeadership = ['super-admin', 'admin', 'director', 'principal', 'joint-director'].includes(roleKey)
    const userTaskSet = isLeadership
        ? all
        : all.filter((t) => isTaskAssignedToUser(t, roleKey, userId) || isTaskCreatedByUser(t, roleKey, userId))

    const overdue = userTaskSet.filter((t) => isTaskOverdue(t))

    return {
        totalTasks: userTaskSet.length,
        receivedTasks: received.length,
        createdTasks: created.length,
        overdueTasks: overdue.length
    }
}

export const addTask = (payload) => {
    const tasks = readTasks()
    const prefix = payload.assignedByRole?.slice(0, 3).toUpperCase() ?? 'TSK'
    const nextNum = tasks.length + 1
    const id = `${prefix}-TASK-${String(nextNum).padStart(3, '0')}`

    // Scope resolution
    const scope = payload.scope || (payload.assignedToType === 'DEPARTMENT' ? 'Department' : (payload.assignedToType === 'TEAM' ? 'Entire Team' : 'Individual'))
    
    // Assignees resolution
    let assigneeRole = payload.assigneeRole || 'teacher'
    let validAssigneeIds = []
    let assigneeNames = []

    if (scope === 'Individual') {
        const users = getUsersByRole(payload.assigneeRole)
        validAssigneeIds = payload.assigneeUserIds && payload.assigneeUserIds.length > 0
            ? payload.assigneeUserIds
            : (payload.targetEmployeeId ? [payload.targetEmployeeId] : (users.length > 0 ? [users[0].id] : ['USER-GEN']))

        const allSelected = users.length > 0 && users.every((u) => validAssigneeIds.includes(u.id))
        const explicitNames = payload.assigneeNames || (payload.targetEmployeeName ? [payload.targetEmployeeName] : null)
        assigneeNames = explicitNames || (allSelected
            ? ['All']
            : users.filter((u) => validAssigneeIds.includes(u.id)).map((u) => u.name))
    } else if (scope === 'Entire Team') {
        const team = ENTERPRISE_TEAMS.find(t => t.id === payload.teamId || t.name === payload.teamName)
        if (team) {
            const excluded = payload.excludedMemberIds || []
            const activeMembers = team.members.filter(m => !excluded.includes(m.id))
            assigneeNames = [`Team: ${team.name} (${activeMembers.length} members)`]
            validAssigneeIds = activeMembers.map(m => m.id)
            if (activeMembers.length > 0) {
                assigneeRole = activeMembers[0].role
            }
        } else {
            assigneeNames = [payload.teamName || 'Assigned Team']
        }
    } else if (scope === 'Department') {
        const deptName = payload.department || payload.assignedDepartment || 'General Operations'
        const deptStaff = getEmployeesByDepartment(deptName)
        assigneeNames = [`Department: ${deptName} (${deptStaff.length} staff)`]
        validAssigneeIds = deptStaff.map(e => e.id)
        if (deptStaff.length > 0) {
            assigneeRole = deptStaff[0].roleKey || 'admin'
        }
    }

    const dept = payload.department || payload.assignedDepartment || 'Academics & Teaching'
    const instructions = payload.instructions || payload.description || ''
    const status = payload.status ?? 'Assigned'
    const progress = Number(payload.progressPercentage || (status === 'Completed' ? 100 : 0))
    const nowTimestamp = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const task = {
        id,
        taskId: id,
        title: payload.title,
        description: instructions,
        instructions,
        scope,
        assigneeRole,
        assigneeUserIds: validAssigneeIds,
        assigneeNames: assigneeNames.length ? assigneeNames : [assigneeRole],
        teamId: payload.teamId || null,
        teamName: payload.teamName || null,
        excludedMemberIds: payload.excludedMemberIds || [],
        targetEmployeeName: payload.targetEmployeeName || null,
        targetEmployeeId: payload.targetEmployeeId || null,
        assignedByRole: payload.assignedByRole,
        assignedBy: payload.assignedBy || getRoleLabel(payload.assignedByRole),
        assignedById: payload.assignedById || null,
        assignedDepartment: dept,
        department: dept,
        priority: payload.priority || 'Medium',
        assignedDate: payload.assignedDate ? formatDate(payload.assignedDate) : formatDate(new Date()),
        dueDate: payload.dueDate ? formatDate(payload.dueDate) : formatDate(new Date(Date.now() + 3 * 86400000)),
        status,
        progressPercentage: progress,
        checklists: payload.checklists || [],
        comments: payload.comments || [],
        completionEvidence: payload.completionEvidence || null,
        managerFeedback: payload.managerFeedback || null,
        assignedToType: payload.assignedToType || (scope === 'Department' ? 'DEPARTMENT' : (scope === 'Entire Team' ? 'TEAM' : 'STAFF')),
        statusHistory: [
            {
                id: `HIST-${Date.now()}`,
                timestamp: nowTimestamp,
                action: 'CREATED',
                actor: payload.assignedBy || getRoleLabel(payload.assignedByRole),
                previousStatus: 'Draft',
                newStatus: status,
                previousValue: 'Draft',
                newValue: status,
                progressPercentage: progress,
                remarks: payload.remarks || `Task created with ${scope} scope and assigned to ${assigneeNames.join(', ')}`
            }
        ]
    }

    tasks.unshift(task)
    writeTasks(tasks)

    recordAuditLog({
        actorName: task.assignedBy,
        actorRole: task.assignedByRole,
        module: 'Task Management',
        action: 'ASSIGN_TASK',
        entityId: id,
        previousState: 'None',
        newState: task.status,
        remarks: `Task '${task.title}' assigned to ${task.assigneeNames.join(', ')}`
    })

    dispatchNotification({
        recipientRole: task.assigneeRole,
        title: `New Task Assigned: ${task.title}`,
        message: `You have been assigned ${id} by ${task.assignedBy}. Due on ${task.dueDate}.`,
        link: '/task-management',
        priority: task.priority === 'Critical' || task.priority === 'Urgent' ? 'Critical' : 'Normal',
        type: 'TASK'
    })

    return task
}

export const updateTaskStatus = (taskId, status, remark = '', actorName = 'Assignee', progressPercentage = null) => {
    const tasks = readTasks()
    const index = tasks.findIndex((task) => task.id === taskId || task.taskId === taskId)
    if (index === -1) return null

    const oldStatus = tasks[index].status
    const nowTimestamp = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const computedProgress = progressPercentage !== null 
        ? Number(progressPercentage) 
        : (status === 'Completed' || status === 'Submitted' || status === 'Submitted for Verification' ? 100 : (tasks[index].progressPercentage || 0))

    const historyItem = {
        id: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: nowTimestamp,
        action: 'STATUS_CHANGED',
        actor: actorName,
        previousStatus: oldStatus,
        newStatus: status,
        previousValue: oldStatus,
        newValue: status,
        progressPercentage: computedProgress,
        remarks: remark || `Task status updated from ${oldStatus} to ${status}`
    }

    const currentHistory = Array.isArray(tasks[index].statusHistory) ? tasks[index].statusHistory : []

    tasks[index] = {
        ...tasks[index],
        status,
        remark: remark || tasks[index].remark || '',
        progressPercentage: computedProgress,
        statusHistory: [historyItem, ...currentHistory],
        lastUpdated: nowTimestamp,
        lastUpdatedBy: actorName
    }

    if (status === 'Completed') {
        tasks[index].closedAt = nowTimestamp
        tasks[index].closedBy = actorName
    }

    writeTasks(tasks)

    recordAuditLog({
        actorName,
        module: 'Task Management',
        action: 'UPDATE_TASK_STATUS',
        entityId: taskId,
        previousState: oldStatus,
        newState: status,
        remarks: remark || `Task status updated to ${status}`
    })

    return tasks[index]
}

export const updateTaskDetails = (taskId, updates = {}, actorName = 'Admin') => {
    const tasks = readTasks()
    const index = tasks.findIndex((task) => task.id === taskId || task.taskId === taskId)
    if (index === -1) return null

    const oldTask = tasks[index]
    const nowTimestamp = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const changes = []
    if (updates.title && updates.title !== oldTask.title) changes.push(`Title changed`)
    if (updates.dueDate && updates.dueDate !== oldTask.dueDate) changes.push(`Due date changed from ${oldTask.dueDate} to ${updates.dueDate}`)
    if (updates.priority && updates.priority !== oldTask.priority) changes.push(`Priority changed from ${oldTask.priority} to ${updates.priority}`)
    if (updates.instructions && updates.instructions !== oldTask.instructions) changes.push(`Instructions updated`)

    const historyItem = {
        id: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: nowTimestamp,
        action: 'UPDATED',
        actor: actorName,
        previousStatus: oldTask.status,
        newStatus: oldTask.status,
        previousValue: 'Existing details',
        newValue: 'Updated details',
        progressPercentage: oldTask.progressPercentage || 0,
        remarks: changes.length > 0 ? changes.join('; ') : 'Task details updated'
    }

    tasks[index] = {
        ...oldTask,
        ...updates,
        description: updates.instructions || updates.description || oldTask.description,
        instructions: updates.instructions || updates.description || oldTask.instructions,
        statusHistory: [historyItem, ...(Array.isArray(oldTask.statusHistory) ? oldTask.statusHistory : [])],
        lastUpdated: nowTimestamp,
        lastUpdatedBy: actorName
    }

    writeTasks(tasks)
    return tasks[index]
}

export const addTaskComment = (taskId, { text, authorName = 'Staff', authorRole = 'staff' }) => {
    if (!text || !text.trim()) return null
    const tasks = readTasks()
    const index = tasks.findIndex((task) => task.id === taskId || task.taskId === taskId)
    if (index === -1) return null

    const newComment = {
        id: `COMM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: text.trim(),
        authorName,
        authorRole,
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const currentComments = Array.isArray(tasks[index].comments) ? tasks[index].comments : []
    tasks[index].comments = [...currentComments, newComment]
    writeTasks(tasks)

    return tasks[index]
}

export const closeTask = ({ taskId, actorName = 'Assignee', closureRemarks = 'Task deliverables completed and closed.' }) => {
    return updateTaskStatus(taskId, 'Completed', closureRemarks, actorName, 100)
}

export const acknowledgeTask = (taskId, actorName = 'Assignee', remarks = 'Task acknowledged.') => {
    return updateTaskStatus(taskId, 'Acknowledged', remarks, actorName)
}

export const startTask = (taskId, actorName = 'Assignee', remarks = 'Task execution started.') => {
    return updateTaskStatus(taskId, 'In Progress', remarks, actorName, 25)
}

export const cancelTask = (taskId, reason = 'Task cancelled by authority.', actorName = 'Manager') => {
    return updateTaskStatus(taskId, 'Cancelled', reason, actorName)
}

export const rejectTask = (taskId, reason = 'Submission rejected. Rework required.', actorName = 'Manager') => {
    return updateTaskStatus(taskId, 'Rejected', reason, actorName, 50)
}

export const submitTaskForVerification = ({
    taskId,
    evidenceText,
    evidenceFile = null,
    submitterName = 'Assignee'
}) => {
    const tasks = readTasks()
    const index = tasks.findIndex((task) => task.id === taskId || task.taskId === taskId)
    if (index === -1) throw new Error('Task not found.')

    const oldStatus = tasks[index].status
    tasks[index].status = 'Submitted for Verification'
    tasks[index].progressPercentage = 100
    tasks[index].completionEvidence = {
        text: evidenceText,
        fileUrl: evidenceFile,
        submittedAt: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const nowTimestamp = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const historyItem = {
        id: `HIST-${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'SUBMITTED',
        actor: submitterName,
        previousStatus: oldStatus,
        newStatus: 'Submitted for Verification',
        previousValue: oldStatus,
        newValue: 'Submitted for Verification',
        progressPercentage: 100,
        remarks: evidenceText || 'Task submitted with completion evidence'
    }

    tasks[index].statusHistory = [historyItem, ...(Array.isArray(tasks[index].statusHistory) ? tasks[index].statusHistory : [])]

    writeTasks(tasks)

    recordAuditLog({
        actorName: submitterName,
        module: 'Task Management',
        action: 'SUBMIT_TASK_VERIFICATION',
        entityId: taskId,
        previousState: oldStatus,
        newState: 'Submitted for Verification',
        remarks: evidenceText
    })

    dispatchNotification({
        recipientRole: tasks[index].assignedByRole,
        title: `Task ${taskId} Submitted for Verification`,
        message: `'${tasks[index].title}' submitted by ${submitterName} with evidence. Review required.`,
        link: '/task-management',
        type: 'TASK'
    })

    return tasks[index]
}

export const verifyTaskCompletion = ({
    taskId,
    decision, // 'Completed' | 'Rework Required'
    remarks = '',
    rating = 5,
    reviewerName = 'Manager'
}) => {
    const tasks = readTasks()
    const index = tasks.findIndex((task) => task.id === taskId || task.taskId === taskId)
    if (index === -1) throw new Error('Task not found.')

    const oldStatus = tasks[index].status
    tasks[index].status = decision
    if (decision === 'Rework Required') {
        tasks[index].progressPercentage = 75
    }
    tasks[index].managerFeedback = {
        reviewedBy: reviewerName,
        reviewedAt: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        remarks,
        rating: Number(rating)
    }

    const nowTimestamp = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const historyItem = {
        id: `HIST-${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'VERIFIED',
        actor: reviewerName,
        previousStatus: oldStatus,
        newStatus: decision,
        previousValue: oldStatus,
        newValue: decision,
        progressPercentage: tasks[index].progressPercentage,
        remarks: remarks || `Task reviewed: ${decision}`
    }

    tasks[index].statusHistory = [historyItem, ...(Array.isArray(tasks[index].statusHistory) ? tasks[index].statusHistory : [])]

    writeTasks(tasks)

    recordAuditLog({
        actorName: reviewerName,
        module: 'Task Management',
        action: `TASK_${decision.toUpperCase().replace(/\s+/g, '_')}`,
        entityId: taskId,
        previousState: oldStatus,
        newState: decision,
        remarks
    })

    dispatchNotification({
        recipientRole: tasks[index].assigneeRole,
        title: `Task ${taskId} Review: ${decision}`,
        message: `${reviewerName} marked '${tasks[index].title}' as ${decision}. Notes: ${remarks}`,
        link: '/task-management',
        type: 'TASK'
    })

    return tasks[index]
}

export const deleteTask = (taskId) => {
    const tasks = readTasks().filter((task) => task.id !== taskId && task.taskId !== taskId)
    writeTasks(tasks)
}

export const getDemoUserId = (roleKey) => DEMO_USER_ID_BY_ROLE[roleKey] ?? null

export const getAssignedByLabel = (roleKey) => getRoleLabel(roleKey)
