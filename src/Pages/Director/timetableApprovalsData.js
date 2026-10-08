export const SUBMITTED_BY = 'Principal'

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Denied']

export const approvalStatusColor = {
    Approved: 'text-[#4CAF50] border-[#4CAF5033] bg-[#4CAF5014]',
    Pending: 'text-[#FF9800] border-[#FF980033] bg-[#FF980014]',
    Denied: 'text-[#980E0F] border-[#980E0F33] bg-[#980E0F14]',
}

export const EXAM_TIMETABLE_APPROVALS = [
    {
        id: 'EXM001',
        examName: 'Mid Term Examination',
        classSection: 'Grade 9 - A',
        startDate: '15-09-2025',
        endDate: '20-09-2025',
        submittedBy: SUBMITTED_BY,
        submittedDate: '01-09-2025',
        approvalStatus: 'Pending',
        rejectionReason: '',
        modalTitle: 'Mid Term Examination — Grade 9 - A',
    },
    {
        id: 'EXM002',
        examName: 'Annual Examination',
        classSection: 'Grade 10 - B',
        startDate: '01-03-2026',
        endDate: '15-03-2026',
        submittedBy: SUBMITTED_BY,
        submittedDate: '10-02-2026',
        approvalStatus: 'Approved',
        rejectionReason: '',
        modalTitle: 'Annual Examination — Grade 10 - B',
    },
    {
        id: 'EXM003',
        examName: 'Unit Test II',
        classSection: 'Grade 8 - A',
        startDate: '05-11-2025',
        endDate: '08-11-2025',
        submittedBy: SUBMITTED_BY,
        submittedDate: '25-10-2025',
        approvalStatus: 'Denied',
        rejectionReason: 'Subject slots overlap on Day 2. Please revise the Mathematics and Science schedule.',
        modalTitle: 'Unit Test II — Grade 8 - A',
    },
]

export const CLASS_TIMETABLE_APPROVALS = [
    {
        id: 'CTT001',
        classSection: 'Grade 9 - A',
        academicYear: '2025-2026',
        submittedBy: SUBMITTED_BY,
        submittedDate: '15-05-2025',
        approvalStatus: 'Pending',
        rejectionReason: '',
        modalTitle: 'Grade 9 - A Timetable',
    },
    {
        id: 'CTT002',
        classSection: 'Grade 10 - B',
        academicYear: '2025-2026',
        submittedBy: SUBMITTED_BY,
        submittedDate: '20-05-2025',
        approvalStatus: 'Approved',
        rejectionReason: '',
        modalTitle: 'Grade 10 - B Timetable',
    },
    {
        id: 'CTT003',
        classSection: 'Grade 8 - C',
        academicYear: '2025-2026',
        submittedBy: SUBMITTED_BY,
        submittedDate: '22-05-2025',
        approvalStatus: 'Denied',
        rejectionReason: 'Period allocation exceeds the daily limit on Wednesday. Rebalance lab and theory sessions.',
        modalTitle: 'Grade 8 - C Timetable',
    },
]
