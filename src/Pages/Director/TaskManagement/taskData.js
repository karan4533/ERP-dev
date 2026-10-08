export const TASK_PRIORITIES = ['High', 'Medium', 'Low']

export const TASK_STATUSES = ['Completed', 'In Progress', 'Incomplete']

export const LOWER_HIERARCHY_ROLES = [
    { key: 'principal', label: 'Principal' },
    { key: 'admin', label: 'Admin' },
    { key: 'teacher', label: 'Teacher' },
    { key: 'librarian', label: 'Librarian' },
    { key: 'prm', label: 'Front Office (PRM)' },
    { key: 'gateKeeperManager', label: 'Gatekeeper Manager' },
    { key: 'gateKeeper', label: 'Gatekeeper' },
    { key: 'hr', label: 'HR' },
    { key: 'processAuditor', label: 'Process Auditor' },
    { key: 'qualityAuditor', label: 'Quality Auditor' },
    { key: 'transportManager', label: 'Transport Manager' },
    { key: 'itSupportManager', label: 'IT Support Manager' },
]

export const USERS_BY_ROLE = {
    principal: [
        { id: 'PRIN-001', name: 'Dr. Meera Nair' },
        { id: 'PRIN-002', name: 'Mr. Sanjay Verma' },
    ],
    admin: [
        { id: 'ADM-001', name: 'Sandy Selva' },
        { id: 'ADM-002', name: 'Anita Desai' },
    ],
    teacher: [
        { id: 'TCH-001', name: 'Priya Sharma' },
        { id: 'TCH-002', name: 'Arjun Menon' },
        { id: 'TCH-003', name: 'Kavin Mohan' },
    ],
    librarian: [
        { id: 'LIB-001', name: 'Meera Iyer' },
    ],
    prm: [
        { id: 'FO-001', name: 'Ravi Kumar' },
        { id: 'FO-002', name: 'Lakshmi R.' },
    ],
    gateKeeperManager: [
        { id: 'GKM-001', name: 'Vignesh S.' },
    ],
    gateKeeper: [
        { id: 'GK-001', name: 'Suresh P.' },
        { id: 'GK-002', name: 'Manoj T.' },
    ],
    hr: [
        { id: 'HR-001', name: 'Divya Venkat' },
    ],
    processAuditor: [
        { id: 'PA-001', name: 'Nisha Rao' },
    ],
    qualityAuditor: [
        { id: 'QA-001', name: 'Arun Raj' },
    ],
    transportManager: [
        { id: 'TM-001', name: 'Karthik B.' },
    ],
    itSupportManager: [
        { id: 'IT-001', name: 'Shah R.' },
    ],
}

export const getUsersByRole = (roleKey) => USERS_BY_ROLE[roleKey] ?? []

export const getRoleLabel = (roleKey) =>
    LOWER_HIERARCHY_ROLES.find((role) => role.key === roleKey)?.label ?? roleKey

export const statusBadgeColor = {
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    Incomplete: 'bg-[#FF000033] text-[#FF0000]',
}

export const ASSIGNED_TASKS = [
    {
        id: 'DIR-TASK-001',
        taskId: 'DIR-TASK-001',
        title: 'Submit Monthly Attendance Report',
        description: 'Prepare and submit the attendance report for all Grade 9 students.',
        role: 'teacher',
        assignedTo: ['Priya Sharma', 'Arjun Menon'],
        priority: 'High',
        assignedDate: '01-08-2025',
        dueDate: '05-08-2025',
        status: 'Completed',
    },
    {
        id: 'DIR-TASK-002',
        taskId: 'DIR-TASK-002',
        title: 'Review Examination Schedule',
        description: 'Principal to review and approve the Term 2 examination schedule.',
        role: 'principal',
        assignedTo: ['Dr. Meera Nair'],
        priority: 'High',
        assignedDate: '10-03-2026',
        dueDate: '18-03-2026',
        status: 'In Progress',
    },
    {
        id: 'DIR-TASK-003',
        taskId: 'DIR-TASK-003',
        title: 'Update Library Inventory',
        description: 'Complete the quarterly library inventory audit and submit report.',
        role: 'librarian',
        assignedTo: ['Meera Iyer'],
        priority: 'Medium',
        assignedDate: '08-03-2026',
        dueDate: '20-03-2026',
        status: 'Incomplete',
    },
    {
        id: 'DIR-TASK-004',
        taskId: 'DIR-TASK-004',
        title: 'Front Office Admission Follow-up',
        description: 'Follow up on pending admission enquiries from last week.',
        role: 'prm',
        assignedTo: ['All'],
        priority: 'Medium',
        assignedDate: '12-03-2026',
        dueDate: '15-03-2026',
        status: 'In Progress',
    },
]

export const formatAssignedTo = (assignedTo) => {
    if (!assignedTo?.length) return '—'
    if (assignedTo.length === 1 && assignedTo[0] === 'All') return 'All Users'
    if (assignedTo.length > 2) return `${assignedTo.slice(0, 2).join(', ')} +${assignedTo.length - 2} more`
    return assignedTo.join(', ')
}
