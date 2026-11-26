export const ASSIGNEE_OPTIONS = [
    'Joint Director Assistant',
    'Canteen Manager',
    'Store Manager',
    'Tech Team Manager',
    'Transport Manager',
    'House Keeping Manager',
]

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

export const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'In Complete']

export const TASKS = [
    {
        taskId: 'JD-T-001',
        title: 'Quarterly department review — Canteen',
        description: 'Submit Q2 operations report including sales summary, inventory audit, and pending requests.',
        assignedTo: 'Canteen Manager',
        priority: 'High',
        assignedDate: '10-06-2026',
        dueDate: '15-06-2026',
        status: 'In Progress',
    },
    {
        taskId: 'JD-T-002',
        title: 'Stationery stock audit before exam week',
        description: 'Verify inventory counts and submit low-stock replenishment plan for exam stationery requirements.',
        assignedTo: 'Store Manager',
        priority: 'High',
        assignedDate: '09-06-2026',
        dueDate: '12-06-2026',
        status: 'Pending',
    },
    {
        taskId: 'JD-T-003',
        title: 'Network readiness check — Block C labs',
        description: 'Ensure all lab devices are updated and network switches are stable before internal assessments.',
        assignedTo: 'Tech Team Manager',
        priority: 'Urgent',
        assignedDate: '10-06-2026',
        dueDate: '11-06-2026',
        status: 'In Progress',
    },
    {
        taskId: 'JD-T-004',
        title: 'Deep cleaning schedule — exam week',
        description: 'Prepare and share zone-wise deep cleaning roster for all classroom blocks during exam week.',
        assignedTo: 'House Keeping Manager',
        priority: 'High',
        assignedDate: '08-06-2026',
        dueDate: '10-06-2026',
        status: 'Completed',
    },
    {
        taskId: 'JD-T-005',
        title: 'Bus fleet maintenance compliance',
        description: 'Complete brake and tyre inspection for all route buses and submit maintenance compliance report.',
        assignedTo: 'Transport Manager',
        priority: 'Medium',
        assignedDate: '07-06-2026',
        dueDate: '14-06-2026',
        status: 'In Complete',
    },
    {
        taskId: 'JD-T-006',
        title: 'Compile cross-department escalation summary',
        description: 'Consolidate open escalations from all departments for Joint Director weekly review meeting.',
        assignedTo: 'Joint Director Assistant',
        priority: 'Medium',
        assignedDate: '10-06-2026',
        dueDate: '12-06-2026',
        status: 'In Progress',
    },
]

export const statusBadgeColor = {
    Pending: 'bg-[#66708533] text-[#667085]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    'In Complete': 'bg-[#FF000033] text-[#FF0000]',
}
