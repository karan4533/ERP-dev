export const DEPARTMENTS = [
    'Academic',
    'Administration',
    'Finance',
    'HR',
    'IT Support',
    'Transport',
    'Housekeeping',
    'Canteen',
]

export const JOB_STATUSES = ['Open', 'Closed', 'On Hold']

export const jobStatusBadgeColor = {
    Open: 'bg-[#4CAF5033] text-[#4CAF50]',
    Closed: 'bg-[#66708533] text-[#667085]',
    'On Hold': 'bg-[#FF980033] text-[#FF9800]',
}

export const JOB_OPENINGS = [
    {
        id: 'JOB-2026-014',
        jobTitle: 'Mathematics Teacher — Senior Secondary',
        department: 'Academic',
        positions: 2,
        status: 'Open',
        closingDate: '30-06-2026',
    },
    {
        id: 'JOB-2026-013',
        jobTitle: 'Accounts Assistant',
        department: 'Finance',
        positions: 1,
        status: 'Open',
        closingDate: '25-06-2026',
    },
    {
        id: 'JOB-2026-012',
        jobTitle: 'IT Support Engineer',
        department: 'IT Support',
        positions: 1,
        status: 'Open',
        closingDate: '20-06-2026',
    },
    {
        id: 'JOB-2026-011',
        jobTitle: 'Bus Driver',
        department: 'Transport',
        positions: 3,
        status: 'On Hold',
        closingDate: '15-07-2026',
    },
    {
        id: 'JOB-2026-010',
        jobTitle: 'HR Executive',
        department: 'HR',
        positions: 1,
        status: 'Closed',
        closingDate: '01-06-2026',
    },
]

export const INTERVIEW_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No Show']

export const interviewStatusBadgeColor = {
    Scheduled: 'bg-[#2196F333] text-[#2196F3]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Cancelled: 'bg-[#66708533] text-[#667085]',
    'No Show': 'bg-[#FF000033] text-[#FF0000]',
}

export const candidateInterviewStatusBadgeColor = {
    Applied: 'bg-[#66708533] text-[#667085]',
    Screening: 'bg-[#2196F333] text-[#2196F3]',
    Interview: 'bg-[#515DEF33] text-[#515DEF]',
    Selected: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const CANDIDATES = [
    {
        id: 'CAN-2026-041',
        name: 'Arjun Verma',
        email: 'arjun.verma@email.com',
        mobile: '+91 98765 11101',
        positionApplied: 'Mathematics Teacher — Senior Secondary',
        resume: 'Arjun_Verma_Resume.pdf',
        interviewStatus: 'Interview',
        remarks: 'Strong subject knowledge; panel interview scheduled',
    },
    {
        id: 'CAN-2026-040',
        name: 'Kavita Nair',
        email: 'kavita.nair@email.com',
        mobile: '+91 98765 11102',
        positionApplied: 'Accounts Assistant',
        resume: 'Kavita_Nair_CV.pdf',
        interviewStatus: 'Selected',
        remarks: 'Offer letter pending',
    },
    {
        id: 'CAN-2026-039',
        name: 'Mohit Agarwal',
        email: 'mohit.agarwal@email.com',
        mobile: '+91 98765 11103',
        positionApplied: 'IT Support Engineer',
        resume: 'Mohit_Agarwal_Resume.pdf',
        interviewStatus: 'Screening',
        remarks: 'Technical test completed — awaiting HR round',
    },
    {
        id: 'CAN-2026-038',
        name: 'Sneha Reddy',
        email: 'sneha.reddy@email.com',
        mobile: '+91 98765 11104',
        positionApplied: 'Mathematics Teacher — Senior Secondary',
        resume: 'Sneha_Reddy_Profile.pdf',
        interviewStatus: 'Applied',
        remarks: 'New application received',
    },
    {
        id: 'CAN-2026-037',
        name: 'Deepak Joshi',
        email: 'deepak.joshi@email.com',
        mobile: '+91 98765 11105',
        positionApplied: 'Bus Driver',
        resume: 'Deepak_Joshi_CV.pdf',
        interviewStatus: 'Rejected',
        remarks: 'Does not meet experience requirement',
    },
]

export const INTERVIEW_RECOMMENDATIONS = ['Strong Hire', 'Hire', 'Hold', 'Reject']

export const recommendationBadgeColor = {
    'Strong Hire': 'bg-[#4CAF5033] text-[#4CAF50]',
    Hire: 'bg-[#2196F333] text-[#2196F3]',
    Hold: 'bg-[#FF980033] text-[#FF9800]',
    Reject: 'bg-[#FF000033] text-[#FF0000]',
}

export const INTERVIEWS = [
    {
        id: 'INT-2026-018',
        candidateName: 'Arjun Verma',
        position: 'Mathematics Teacher — Senior Secondary',
        interviewDate: '12-06-2026',
        panel: 'Dr. Meera Kapoor, Prof. Anil Sethi',
        status: 'Scheduled',
        feedback: '—',
        recommendation: '—',
    },
    {
        id: 'INT-2026-017',
        candidateName: 'Kavita Nair',
        position: 'Accounts Assistant',
        interviewDate: '08-06-2026',
        panel: 'Mr. Vikram Singh, Ms. Priya Nair',
        status: 'Completed',
        feedback: 'Excellent communication and Tally proficiency',
        recommendation: 'Strong Hire',
    },
    {
        id: 'INT-2026-016',
        candidateName: 'Mohit Agarwal',
        position: 'IT Support Engineer',
        interviewDate: '10-06-2026',
        panel: 'Mr. Arjun Mehta, Ms. Neha Gupta',
        status: 'Scheduled',
        feedback: '—',
        recommendation: '—',
    },
    {
        id: 'INT-2026-015',
        candidateName: 'Deepak Joshi',
        position: 'Bus Driver',
        interviewDate: '05-06-2026',
        panel: 'Mr. Suresh Patel, Mr. Deepak Verma',
        status: 'Completed',
        feedback: 'Insufficient commercial driving experience',
        recommendation: 'Reject',
    },
]
