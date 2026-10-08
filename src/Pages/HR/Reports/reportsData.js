export const REPORT_TYPES = [
    'Employee Report',
    'Recruitment Report',
    'Leave Report',
    'Attendance Report',
    'Training Report',
    'Performance Report',
]

export const EMPLOYEE_REPORT = [
    { employeeId: 'EMP-2026-001', name: 'Priya Sharma', department: 'Academic', designation: 'Senior Teacher — Mathematics', status: 'Active', joiningDate: '12-08-2019' },
    { employeeId: 'EMP-2026-002', name: 'Rahul Mehta', department: 'Finance', designation: 'Accounts Executive', status: 'Active', joiningDate: '05-03-2021' },
    { employeeId: 'EMP-2026-003', name: 'Anita Desai', department: 'HR', designation: 'HR Executive', status: 'Active', joiningDate: '18-01-2022' },
    { employeeId: 'EMP-2026-004', name: 'Vikram Singh', department: 'Transport', designation: 'Fleet Supervisor', status: 'Active', joiningDate: '22-09-2020' },
    { employeeId: 'EMP-2026-005', name: 'Sneha Patel', department: 'Academic', designation: 'Science Teacher', status: 'Probation', joiningDate: '01-04-2026' },
]

export const RECRUITMENT_REPORT = [
    { jobTitle: 'Mathematics Teacher — Senior Secondary', department: 'Academic', positions: 2, status: 'Open', candidates: 18, hired: 0 },
    { jobTitle: 'Accounts Assistant', department: 'Finance', positions: 1, status: 'Open', candidates: 12, hired: 0 },
    { jobTitle: 'IT Support Engineer', department: 'IT Support', positions: 1, status: 'Closed', candidates: 24, hired: 1 },
    { jobTitle: 'Housekeeping Supervisor', department: 'Housekeeping', positions: 1, status: 'On Hold', candidates: 8, hired: 0 },
]

export const LEAVE_REPORT = [
    { employee: 'Anita Desai', leaveType: 'Casual Leave', fromDate: '04-07-2026', toDate: '05-07-2026', days: 2, status: 'Approved' },
    { employee: 'Priya Sharma', leaveType: 'Sick Leave', fromDate: '10-07-2026', toDate: '11-07-2026', days: 2, status: 'Pending' },
    { employee: 'Vikram Singh', leaveType: 'Compensatory Off', fromDate: '28-06-2026', toDate: '28-06-2026', days: 1, status: 'Approved' },
    { employee: 'Rahul Mehta', leaveType: 'Unpaid Leave', fromDate: '01-07-2026', toDate: '02-07-2026', days: 2, status: 'Rejected' },
]

export const ATTENDANCE_REPORT = [
    { employee: 'Priya Sharma', month: 'June 2026', present: 22, absent: 0, late: 1, onLeave: 0, attendanceRate: '95.7%' },
    { employee: 'Rahul Mehta', month: 'June 2026', present: 21, absent: 1, late: 2, onLeave: 0, attendanceRate: '91.3%' },
    { employee: 'Anita Desai', month: 'June 2026', present: 20, absent: 0, late: 0, onLeave: 2, attendanceRate: '90.9%' },
    { employee: 'Arjun Nair', month: 'June 2026', present: 18, absent: 3, late: 1, onLeave: 0, attendanceRate: '78.3%' },
]

export const TRAINING_REPORT = [
    { trainingName: 'Child Safety & POCSO Awareness', department: 'All Departments', date: '25-06-2026', attendance: '42 / 45', avgFeedback: '4.6 / 5' },
    { trainingName: 'Classroom Management Techniques', department: 'Academic', date: '18-06-2026', attendance: '28 / 30', avgFeedback: '4.3 / 5' },
    { trainingName: 'GST Compliance & TDS Filing', department: 'Finance', date: '12-06-2026', attendance: '6 / 6', avgFeedback: '4.8 / 5' },
]

export const PERFORMANCE_REPORT = [
    { employee: 'Priya Sharma', reviewPeriod: 'H1 2026', reviewer: 'Dr. Meera Kapoor', rating: 4.8, status: 'Completed' },
    { employee: 'Rahul Mehta', reviewPeriod: 'H1 2026', reviewer: 'Rajesh Verma', rating: 4.2, status: 'Completed' },
    { employee: 'Anita Desai', reviewPeriod: 'H1 2026', reviewer: 'Rajesh Verma', rating: 4.5, status: 'Completed' },
    { employee: 'Arjun Nair', reviewPeriod: 'H1 2026', reviewer: 'IT Support Manager', rating: 3.2, status: 'In Progress' },
]
