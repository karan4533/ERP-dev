export const REPORT_TYPES = [
    'Task Completion Report',
    'Supply Usage Report',
    'Zone Cleaning Report',
    'Low Stock Report',
]

export const TASK_COMPLETION_REPORT = [
    { task: 'Classroom Block A — Deep Clean', assignedTo: 'Ramesh Kumar', zone: 'Block A', completed: 'Yes', date: '10-06-2026' },
    { task: 'Restroom Sanitization — Floor 2', assignedTo: 'Sunita Devi', zone: 'Admin Block', completed: 'Yes', date: '10-06-2026' },
    { task: 'Corridor Mopping — Science Wing', assignedTo: 'Vijay Singh', zone: 'Science Wing', completed: 'No', date: '10-06-2026' },
    { task: 'Playground Litter Pickup', assignedTo: 'Anita Sharma', zone: 'Playground', completed: 'Yes', date: '09-06-2026' },
    { task: 'Staff Room Cleaning', assignedTo: 'Mohit Patel', zone: 'Admin Block', completed: 'No', date: '09-06-2026' },
]

export const SUPPLY_USAGE_REPORT = [
    { item: 'Floor Cleaner — Lemon (5L)', quantityUsed: 8, zone: 'Block A', period: 'June 2026' },
    { item: 'Disinfectant Spray (500ml)', quantityUsed: 24, zone: 'All Restrooms', period: 'June 2026' },
    { item: 'Garbage Bags — Large', quantityUsed: 15, zone: 'Campus Wide', period: 'June 2026' },
    { item: 'Toilet Bowl Cleaner (1L)', quantityUsed: 12, zone: 'Block B & C', period: 'June 2026' },
    { item: 'Mop Head — Cotton', quantityUsed: 6, zone: 'Corridors', period: 'June 2026' },
]

export const ZONE_CLEANING_REPORT = [
    { zone: 'Block A — Classrooms', lastCleaned: '10-06-2026', status: 'Completed', staff: 'Ramesh Kumar' },
    { zone: 'Block B — Classrooms', lastCleaned: '10-06-2026', status: 'In Progress', staff: 'Sunita Devi' },
    { zone: 'Admin Block — Restrooms', lastCleaned: '10-06-2026', status: 'Completed', staff: 'Vijay Singh' },
    { zone: 'Science Wing — Labs', lastCleaned: '09-06-2026', status: 'Completed', staff: 'Anita Sharma' },
    { zone: 'Playground', lastCleaned: '09-06-2026', status: 'Pending', staff: 'Mohit Patel' },
]

export const LOW_STOCK_REPORT = [
    { item: 'Garbage Bags — Large (Roll of 50)', currentQty: 8, reorderLevel: 20 },
    { item: 'Disinfectant Spray (500ml)', currentQty: 4, reorderLevel: 12 },
    { item: 'Mop Head — Cotton (Standard)', currentQty: 0, reorderLevel: 10 },
    { item: 'Floor Cleaner — Lemon (5L)', currentQty: 6, reorderLevel: 15 },
]
