export const TASKS = [
    {
        taskId: 'HK-T-001',
        title: 'Classroom Block A — Deep Clean',
        description: 'Full deep cleaning of all classrooms in Block A including desks, floors, and windows.',
        assignedTo: 'Ramesh Kumar',
        assignedBy: 'Shalini',
        priority: 'High',
        assignedDate: '10-06-2026',
        dueDate: '10-06-2026',
        status: 'In Progress',
    },
    {
        taskId: 'HK-T-002',
        title: 'Restroom Sanitization — Floor 2',
        description: 'Complete sanitization of all restrooms on the second floor of the admin block.',
        assignedTo: 'Sunita Devi',
        priority: 'High',
        assignedDate: '10-06-2026',
        dueDate: '10-06-2026',
        status: 'Completed',
    },
    {
        taskId: 'HK-T-003',
        title: 'Corridor Mopping — Science Wing',
        description: 'Mop and disinfect all corridors in the Science Wing before lab sessions.',
        assignedTo: 'Vijay Singh',
        priority: 'Medium',
        assignedDate: '09-06-2026',
        dueDate: '10-06-2026',
        status: 'In Complete',
    },
    {
        taskId: 'HK-T-004',
        title: 'Playground Litter Pickup',
        description: 'Collect litter and empty bins across the playground and sports areas.',
        assignedTo: 'Anita Sharma',
        priority: 'Medium',
        assignedDate: '09-06-2026',
        dueDate: '09-06-2026',
        status: 'Completed',
    },
]

export const statusBadgeColor = {
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    'In Complete': 'bg-[#FF000033] text-[#FF0000]',
}
