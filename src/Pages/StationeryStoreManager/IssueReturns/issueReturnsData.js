export const ACTIVITY_TYPES = ['Issue', 'Return']

export const DEPARTMENTS = [
    'Mathematics',
    'Science',
    'English',
    'Administration',
    'IT Support',
    'Library',
    'Front Office',
    'Sports',
]

export const ITEM_OPTIONS = [
    { name: 'Blue Ballpoint Pen', availableStock: 450 },
    { name: 'A4 Paper Ream (500 sheets)', availableStock: 8 },
    { name: 'Spiral Notebook — 200 pages', availableStock: 0 },
    { name: 'HP 803 Black Ink Cartridge', availableStock: 24 },
    { name: 'Stapler Pins (Box of 1000)', availableStock: 5 },
    { name: 'Whiteboard Marker — Black', availableStock: 36 },
]

export const PURPOSE_OPTIONS = [
    'Classroom use',
    'Department office',
    'Exam preparation',
    'Event / function',
    'Replacement stock',
    'Other',
]

export const CONDITION_OPTIONS = ['Good', 'Damaged', 'Lost']

export const ISSUE_RETURNS = [
    {
        id: 'IR-2026-0042',
        activityType: 'Issue',
        requestedBy: 'Priya Nair',
        employeeId: 'EMP-1042',
        department: 'Mathematics',
        itemName: 'Blue Ballpoint Pen',
        quantity: 20,
        issueDate: '10-06-2026',
        returnDate: '—',
        status: 'Issued',
        purpose: 'Classroom use',
        remarks: 'For Class 10-A weekly worksheets',
        availableStock: 450,
        originalIssueRef: null,
        condition: null,
    },
    {
        id: 'IR-2026-0041',
        activityType: 'Return',
        requestedBy: 'John Milton',
        employeeId: 'EMP-1008',
        department: 'Administration',
        itemName: 'A4 Paper Ream (500 sheets)',
        quantity: 2,
        issueDate: '28-05-2026',
        returnDate: '09-06-2026',
        status: 'Returned',
        purpose: null,
        remarks: 'Unused reams from event setup',
        availableStock: null,
        originalIssueRef: 'IR-2026-0035',
        condition: 'Good',
    },
    {
        id: 'IR-2026-0040',
        activityType: 'Issue',
        requestedBy: 'Anita Verma',
        employeeId: 'EMP-0987',
        department: 'Science',
        itemName: 'Whiteboard Marker — Black',
        quantity: 6,
        issueDate: '09-06-2026',
        returnDate: '—',
        status: 'Issued',
        purpose: 'Department office',
        remarks: 'Science lab whiteboards',
        availableStock: 36,
        originalIssueRef: null,
        condition: null,
    },
    {
        id: 'IR-2026-0039',
        activityType: 'Issue',
        requestedBy: 'Ravi Kumar',
        employeeId: 'EMP-1102',
        department: 'IT Support',
        itemName: 'Stapler Pins (Box of 1000)',
        quantity: 1,
        issueDate: '08-06-2026',
        returnDate: '—',
        status: 'Issued',
        purpose: 'Department office',
        remarks: 'IT helpdesk documentation',
        availableStock: 5,
        originalIssueRef: null,
        condition: null,
    },
    {
        id: 'IR-2026-0038',
        activityType: 'Return',
        requestedBy: 'Meena Devi',
        employeeId: 'EMP-0876',
        department: 'Library',
        itemName: 'Blue Ballpoint Pen',
        quantity: 15,
        issueDate: '01-06-2026',
        returnDate: '08-06-2026',
        status: 'Returned',
        purpose: null,
        remarks: '3 pens damaged during use',
        availableStock: null,
        originalIssueRef: 'IR-2026-0030',
        condition: 'Damaged',
    },
    {
        id: 'IR-2026-0037',
        activityType: 'Issue',
        requestedBy: 'Sunita Rao',
        employeeId: 'EMP-0921',
        department: 'Front Office',
        itemName: 'HP 803 Black Ink Cartridge',
        quantity: 1,
        issueDate: '07-06-2026',
        returnDate: '—',
        status: 'Issued',
        purpose: 'Replacement stock',
        remarks: 'Front office printer cartridge replacement',
        availableStock: 24,
        originalIssueRef: null,
        condition: null,
    },
]

export const activityTypeBadgeColor = {
    Issue: 'bg-[#515DEF33] text-[#515DEF]',
    Return: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const statusBadgeColor = {
    Issued: 'bg-[#2196F333] text-[#2196F3]',
    Returned: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const getIssueReturnById = (id) =>
    ISSUE_RETURNS.find((entry) => entry.id === id)

export const getAvailableStock = (itemName) =>
    ITEM_OPTIONS.find((item) => item.name === itemName)?.availableStock ?? '—'
