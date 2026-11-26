/**
 * Recognition & Performance Management Data Engine
 * Serves Academic (Students & Class-wise recognitions) and Non-Academic (Employees & Department-wise recognitions).
 * Implements role-based visibility, bulk selection, and automated Star of the Year calculations.
 */

export const ACADEMIC_YEARS = ['2025-2026', '2026-2027']
export const CURRENT_ACADEMIC_YEAR = '2025-2026'

export const RECOGNITION_MONTHS = [
    'June 2025',
    'July 2025',
    'August 2025',
    'September 2025',
    'October 2025',
    'November 2025',
    'December 2025',
    'January 2026',
    'February 2026',
    'March 2026',
]

export const CURRENT_MONTH = 'September 2025'

// ==========================================
// 1. ACADEMIC CLASSES, SECTIONS & STUDENTS
// ==========================================

export const ALL_CLASSES = [
    { className: 'Grade 5', wing: 'Primary Wing', sections: ['A', 'B'] },
    { className: 'Grade 6', wing: 'Middle Wing', sections: ['A', 'B', 'C'] },
    { className: 'Grade 7', wing: 'Middle Wing', sections: ['A', 'B', 'C'] },
    { className: 'Grade 8', wing: 'Middle Wing', sections: ['A', 'B', 'C'] },
    { className: 'Grade 9', wing: 'Secondary Wing', sections: ['A', 'B', 'C'] },
    { className: 'Grade 10', wing: 'Secondary Wing', sections: ['A', 'B', 'C'] },
    { className: 'Grade 11', wing: 'Senior Secondary Wing', sections: ['A', 'B'] },
    { className: 'Grade 12', wing: 'Senior Secondary Wing', sections: ['A', 'B'] },
]

export const CLASS_ASSIGNMENTS = {
    'Grade 10-A': {
        classTeacherName: 'Priya Menon',
        classTeacherEmail: 'teacher@school.com',
        classTeacherId: 'EMP-TCH-014',
        room: 'Room 304, Senior Academic Block',
        wing: 'Secondary Wing',
        studentCount: 38,
        students: [
            {
                id: 'STU-2024-0142',
                rollNumber: '01',
                name: 'Aarav Sharma',
                gender: 'Male',
                gpa: 3.96,
                attendance: 98.8,
                conductScore: 98,
                somWins: 3,
                citation: 'Exceptional academic rigor in Advanced Calculus and outstanding leadership as Student Council President.',
                avatarColor: '#2563EB',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-002',
                rollNumber: '02',
                name: 'Diya Patel',
                gender: 'Female',
                gpa: 3.92,
                attendance: 97.4,
                conductScore: 95,
                somWins: 2,
                citation: 'First place in Regional Inter-School Science Fair and consistent term-average excellence in Physics.',
                avatarColor: '#DB2777',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-003',
                rollNumber: '03',
                name: 'Rohan Iyer',
                gender: 'Male',
                gpa: 3.84,
                attendance: 96.0,
                conductScore: 92,
                somWins: 1,
                citation: 'Exemplary teamwork in STEM Robotics club and strong homework submission consistency.',
                avatarColor: '#059669',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-004',
                rollNumber: '04',
                name: 'Ananya Deshmukh',
                gender: 'Female',
                gpa: 3.88,
                attendance: 99.0,
                conductScore: 97,
                somWins: 2,
                citation: 'Perfect attendance through Term 1 and outstanding performance in Literary Debate Society.',
                avatarColor: '#9333EA',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-005',
                rollNumber: '05',
                name: 'Karan Mehra',
                gender: 'Male',
                gpa: 3.75,
                attendance: 94.5,
                conductScore: 90,
                somWins: 0,
                citation: 'Active contributor in mathematics peer-tutoring circles.',
                avatarColor: '#D97706',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-006',
                rollNumber: '06',
                name: 'Sneha Reddy',
                gender: 'Female',
                gpa: 3.89,
                attendance: 98.0,
                conductScore: 94,
                somWins: 1,
                citation: 'Top scorer in Split Assessment 2 and state-level Chess finalist.',
                avatarColor: '#0891B2',
                academicYear: '2025-2026',
            },
        ],
    },
    'Grade 10-B': {
        classTeacherName: 'Mr. Ravi Kumar',
        classTeacherEmail: 'ravikumar@school.com',
        classTeacherId: 'EMP-TCH-002',
        room: 'Room 305, Senior Academic Block',
        wing: 'Secondary Wing',
        studentCount: 36,
        students: [
            {
                id: 'STU-2026-021',
                rollNumber: '01',
                name: 'Aditya Verma',
                gender: 'Male',
                gpa: 3.91,
                attendance: 98.2,
                conductScore: 96,
                somWins: 2,
                citation: 'Consistently high test percentiles in Mathematics & Chemistry.',
                avatarColor: '#0284C7',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-022',
                rollNumber: '02',
                name: 'Meera Krishnan',
                gender: 'Female',
                gpa: 3.95,
                attendance: 99.1,
                conductScore: 98,
                somWins: 3,
                citation: 'All-round excellence in co-curricular dramatics and top class GPA.',
                avatarColor: '#E11D48',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-023',
                rollNumber: '03',
                name: 'Vikram Joshi',
                gender: 'Male',
                gpa: 3.78,
                attendance: 95.0,
                conductScore: 91,
                somWins: 0,
                citation: 'Dedicated participation in environmental sustainability drives.',
                avatarColor: '#65A30D',
                academicYear: '2025-2026',
            },
        ],
    },
    'Grade 9-A': {
        classTeacherName: 'Ms. Anitha Verma',
        classTeacherEmail: 'anithaverma@school.com',
        classTeacherId: 'EMP-TCH-003',
        room: 'Room 201, Secondary Academic Block',
        wing: 'Secondary Wing',
        studentCount: 35,
        students: [
            {
                id: 'STU-2026-031',
                rollNumber: '01',
                name: 'Siddharth Rao',
                gender: 'Male',
                gpa: 3.88,
                attendance: 97.6,
                conductScore: 94,
                somWins: 2,
                citation: 'Winner of Inter-House English Elocution and top marks in English Literature.',
                avatarColor: '#0369A1',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-032',
                rollNumber: '02',
                name: 'Pooja Hegde',
                gender: 'Female',
                gpa: 3.94,
                attendance: 98.5,
                conductScore: 97,
                somWins: 3,
                citation: 'Exceptional consistency in Social Sciences and classroom peer leadership.',
                avatarColor: '#7C3AED',
                academicYear: '2025-2026',
            },
        ],
    },
    'Grade 9-B': {
        classTeacherName: 'Rajesh Kumar',
        classTeacherEmail: 'rajeshkumar@school.com',
        classTeacherId: 'EMP-TCH-004',
        room: 'Room 202, Secondary Academic Block',
        wing: 'Secondary Wing',
        studentCount: 34,
        students: [
            {
                id: 'STU-2026-041',
                rollNumber: '01',
                name: 'Arjun Nambiar',
                gender: 'Male',
                gpa: 3.86,
                attendance: 96.8,
                conductScore: 93,
                somWins: 1,
                citation: 'Best Science Model at District Exhibition.',
                avatarColor: '#D97706',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-042',
                rollNumber: '02',
                name: 'Kavya Nair',
                gender: 'Female',
                gpa: 3.90,
                attendance: 97.9,
                conductScore: 95,
                somWins: 2,
                citation: 'First in Class 9-B Mid-Term assessments and school choir lead.',
                avatarColor: '#DB2777',
                academicYear: '2025-2026',
            },
        ],
    },
    'Grade 5-A': {
        classTeacherName: 'Sunita Sen',
        classTeacherEmail: 'sunitasen@school.com',
        classTeacherId: 'EMP-TCH-005',
        room: 'Room 101, Primary Academic Block',
        wing: 'Primary Wing',
        studentCount: 30,
        students: [
            {
                id: 'STU-2026-051',
                rollNumber: '01',
                name: 'Nikhil Roy',
                gender: 'Male',
                gpa: 3.92,
                attendance: 99.0,
                conductScore: 98,
                somWins: 2,
                citation: 'Courteous classroom demeanor and perfect reading log records.',
                avatarColor: '#2563EB',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-052',
                rollNumber: '02',
                name: 'Tara Srinivasan',
                gender: 'Female',
                gpa: 3.96,
                attendance: 98.4,
                conductScore: 99,
                somWins: 3,
                citation: 'Exemplary behavior, neatness, and top grade score in Primary Math.',
                avatarColor: '#059669',
                academicYear: '2025-2026',
            },
        ],
    },
    'Grade 5-B': {
        classTeacherName: 'Deepa Menon',
        classTeacherEmail: 'deepamenon@school.com',
        classTeacherId: 'EMP-TCH-006',
        room: 'Room 102, Primary Academic Block',
        wing: 'Primary Wing',
        studentCount: 29,
        students: [
            {
                id: 'STU-2026-061',
                rollNumber: '01',
                name: 'Varun Nair',
                gender: 'Male',
                gpa: 3.89,
                attendance: 97.5,
                conductScore: 95,
                somWins: 2,
                citation: 'Great curiosity in General Science and helpful nature in team activities.',
                avatarColor: '#0891B2',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-062',
                rollNumber: '02',
                name: 'Anika Gupta',
                gender: 'Female',
                gpa: 3.95,
                attendance: 99.2,
                conductScore: 98,
                somWins: 3,
                citation: 'Class reading champion and consistently scores 100% in spelling bees.',
                avatarColor: '#9333EA',
                academicYear: '2025-2026',
            },
        ],
    },
    'Grade 11-A': {
        classTeacherName: 'Ananya Roy',
        classTeacherEmail: 'ananya.roy@school.com',
        classTeacherId: 'EMP-TCH-006',
        room: 'Room 308, Sr. Secondary Block',
        wing: 'Senior Secondary Wing',
        studentCount: 30,
        students: [
            {
                id: 'STU-2026-081',
                rollNumber: '01',
                name: 'Ananya Sen',
                gender: 'Female',
                gpa: 3.94,
                attendance: 99.0,
                conductScore: 98,
                somWins: 2,
                citation: 'Top scorer in Organic Chemistry and Model United Nations best delegate.',
                avatarColor: '#2563EB',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-082',
                rollNumber: '02',
                name: 'Devansh Joshi',
                gender: 'Male',
                gpa: 3.86,
                attendance: 97.2,
                conductScore: 94,
                somWins: 1,
                citation: 'Exemplary mathematics problem solving and peer mentoring.',
                avatarColor: '#10B981',
                academicYear: '2025-2026',
            },
        ],
    },
    'Grade 12-A': {
        classTeacherName: 'Dr. Subramanian',
        classTeacherEmail: 'subramanian@school.com',
        classTeacherId: 'EMP-TCH-007',
        room: 'Room 401, Sr. Secondary Block',
        wing: 'Senior Secondary Wing',
        studentCount: 32,
        students: [
            {
                id: 'STU-2026-071',
                rollNumber: '01',
                name: 'Harish Kalyan',
                gender: 'Male',
                gpa: 3.98,
                attendance: 99.4,
                conductScore: 99,
                somWins: 3,
                citation: 'School Topper in Joint Mock JEE & exemplary role model for younger students.',
                avatarColor: '#1E3A8A',
                academicYear: '2025-2026',
            },
            {
                id: 'STU-2026-072',
                rollNumber: '02',
                name: 'Rhea Chakraborty',
                gender: 'Female',
                gpa: 3.93,
                attendance: 98.1,
                conductScore: 96,
                somWins: 2,
                citation: 'State Level Badminton Champion & high academic consistency.',
                avatarColor: '#DB2777',
                academicYear: '2025-2026',
            },
        ],
    },
}

// ==========================================
// 2. NON-ACADEMIC DEPARTMENTS & EMPLOYEES
// ==========================================

export const NON_ACADEMIC_DEPARTMENTS = [
    {
        id: 'dept-stores',
        name: 'Stores & Procurement',
        code: 'STR',
        manager: 'Gurpreet Singh',
        managerId: 'EMP-STR-001',
        managerRole: 'stationerystoremanager',
        description: 'Central Warehouse, inventory control, purchase requisitions & issue register.',
        employees: [
            {
                id: 'EMP-STR-001',
                name: 'Gurpreet Singh',
                designation: 'Stores & Inventory Manager',
                department: 'Stores & Procurement',
                attendance: 99.2,
                kpiScore: 98,
                somWins: 3,
                photoColor: '#EA580C',
                status: 'Active',
                citation: 'Zero audit discrepancies in Q2 stock reconciliation and 100% automated purchase orders dispatch.',
            },
            {
                id: 'EMP-STR-002',
                name: 'Harpreet Kaur',
                designation: 'Assistant Stores Officer',
                department: 'Stores & Procurement',
                attendance: 96.5,
                kpiScore: 92,
                somWins: 1,
                photoColor: '#D97706',
                status: 'Active',
                citation: 'Exemplary speed in processing classroom stationery issue slips.',
            },
            {
                id: 'EMP-STR-003',
                name: 'Balram Yadav',
                designation: 'Store Dispatcher & Material Handler',
                department: 'Stores & Procurement',
                attendance: 98.0,
                kpiScore: 90,
                somWins: 1,
                photoColor: '#059669',
                status: 'Active',
                citation: 'Meticulous bin organization and zero damage during monsoon store transfer.',
            },
        ],
    },
    {
        id: 'dept-transport',
        name: 'Transport & Fleet Logistics',
        code: 'TRN',
        manager: 'Dharmesh Patel',
        managerId: 'EMP-TRN-001',
        managerRole: 'transportmanager',
        description: 'Fleet maintenance, student bus routes, GPS tracking, and route safety.',
        employees: [
            {
                id: 'EMP-TRN-001',
                name: 'Dharmesh Patel',
                designation: 'Transport Manager',
                department: 'Transport & Fleet Logistics',
                attendance: 98.6,
                kpiScore: 96,
                somWins: 2,
                photoColor: '#059669',
                status: 'Active',
                citation: '100% on-time student pickup compliance across 24 bus routes with zero safety incidents.',
            },
            {
                id: 'EMP-DRV-001',
                name: 'Jaswant Singh',
                designation: 'Senior Route Driver (Route #04)',
                department: 'Transport & Fleet Logistics',
                attendance: 100.0,
                kpiScore: 99,
                somWins: 3,
                photoColor: '#65A30D',
                status: 'Active',
                citation: 'Perfect attendance, zero traffic violations for 18 consecutive months, and parent safety commendations.',
            },
            {
                id: 'EMP-DRV-002',
                name: 'Surinder Pal',
                designation: 'Route Driver (Route #11)',
                department: 'Transport & Fleet Logistics',
                attendance: 95.8,
                kpiScore: 89,
                somWins: 0,
                photoColor: '#0284C7',
                status: 'Active',
                citation: 'Reliable route operation and cooperative vehicle upkeep.',
            },
        ],
    },
    {
        id: 'dept-finance',
        name: 'Finance & Accounts',
        code: 'FIN',
        manager: 'K. Venkataraman',
        managerId: 'EMP-ACC-001',
        managerRole: 'accounthead',
        description: 'Fee reconciliation, immutable payment vouchers, vendor accounts, and budgeting.',
        employees: [
            {
                id: 'EMP-ACC-001',
                name: 'K. Venkataraman',
                designation: 'Chief Financial Officer',
                department: 'Finance & Accounts',
                attendance: 98.4,
                kpiScore: 97,
                somWins: 2,
                photoColor: '#059669',
                status: 'Active',
                citation: 'Closed Q1 fee collections at 94.8% efficiency and reconciled all bank instruments by the 5th of each month.',
            },
            {
                id: 'EMP-ACC-002',
                name: 'Anjali Deshmukh',
                designation: 'Senior Accounts Officer',
                department: 'Finance & Accounts',
                attendance: 99.0,
                kpiScore: 95,
                somWins: 2,
                photoColor: '#2563EB',
                status: 'Active',
                citation: 'Flawless payroll voucher dispatches and zero error in teacher tax deductions.',
            },
        ],
    },
    {
        id: 'dept-hr',
        name: 'Human Resources',
        code: 'HR',
        manager: 'Sunita Deshmukh',
        managerId: 'EMP-HR-001',
        managerRole: 'hr',
        description: 'Staff recruitment, biometric attendance, training, and employee grievance resolution.',
        employees: [
            {
                id: 'EMP-HR-001',
                name: 'Sunita Deshmukh',
                designation: 'Head of Human Resources',
                department: 'Human Resources',
                attendance: 98.5,
                kpiScore: 96,
                somWins: 2,
                photoColor: '#9333EA',
                status: 'Active',
                citation: 'Successfully onboarded 18 specialized teachers before academic session commencement with 100% verified credentials.',
            },
            {
                id: 'EMP-HR-002',
                name: 'Preeti Roy',
                designation: 'HR Executive & Training Coordinator',
                department: 'Human Resources',
                attendance: 97.2,
                kpiScore: 91,
                somWins: 1,
                photoColor: '#DB2777',
                status: 'Active',
                citation: 'Organized 6 peer faculty development workshops with 96% positive teacher feedback.',
            },
        ],
    },
    {
        id: 'dept-it',
        name: 'IT Support & Systems',
        code: 'ITS',
        manager: 'Rakesh Nair',
        managerId: 'EMP-IT-001',
        managerRole: 'itsupportmanager',
        description: 'Campus network infrastructure, computer labs, smartboards, and ERP availability.',
        employees: [
            {
                id: 'EMP-IT-001',
                name: 'Rakesh Nair',
                designation: 'IT Operations Lead',
                department: 'IT Support & Systems',
                attendance: 99.1,
                kpiScore: 98,
                somWins: 3,
                photoColor: '#2563EB',
                status: 'Active',
                citation: 'Achieved 99.98% network uptime across both campuses and resolved 142 teacher tickets with 18-minute mean time to resolution.',
            },
            {
                id: 'EMP-IT-002',
                name: 'Anand Kumar',
                designation: 'Systems Administrator & Lab Technician',
                department: 'IT Support & Systems',
                attendance: 96.8,
                kpiScore: 93,
                somWins: 1,
                photoColor: '#0891B2',
                status: 'Active',
                citation: 'Preventative maintenance on 120 senior computer lab workstations.',
            },
        ],
    },
    {
        id: 'dept-security',
        name: 'Campus Security & Access Control',
        code: 'SEC',
        manager: 'Balwinder Singh',
        managerId: 'EMP-GKM-001',
        managerRole: 'gatekeepermanager',
        description: 'Main gate access, visitor log compliance, perimeter surveillance, and pupil safety.',
        employees: [
            {
                id: 'EMP-GKM-001',
                name: 'Balwinder Singh',
                designation: 'Chief Security Marshal',
                department: 'Campus Security & Access Control',
                attendance: 99.5,
                kpiScore: 97,
                somWins: 2,
                photoColor: '#15803D',
                status: 'Active',
                citation: 'Zero security breaches and 100% visitor photo-ID verification at all school gates.',
            },
            {
                id: 'EMP-GK-001',
                name: 'Ram Singh',
                designation: 'Senior Security Guard (Gate 1)',
                department: 'Campus Security & Access Control',
                attendance: 100.0,
                kpiScore: 99,
                somWins: 3,
                photoColor: '#166534',
                status: 'Active',
                citation: 'Outstanding vigilance during morning rush hour; caught unauthorized delivery vehicle within 30 seconds.',
            },
        ],
    },
    {
        id: 'dept-housekeeping',
        name: 'Facilities & Campus Sanitation',
        code: 'HKP',
        manager: 'Savitri Devi',
        managerId: 'EMP-HK-001',
        managerRole: 'housekeepingmanager',
        description: 'Campus hygiene, classroom sanitation, waste segregation, and green campus operations.',
        employees: [
            {
                id: 'EMP-HK-001',
                name: 'Savitri Devi',
                designation: 'Housekeeping Supervisor',
                department: 'Facilities & Campus Sanitation',
                attendance: 98.9,
                kpiScore: 95,
                somWins: 2,
                photoColor: '#CA8A04',
                status: 'Active',
                citation: 'Green Campus sanitation award recipient with 100% daily checklist completion across 48 classrooms.',
            },
            {
                id: 'EMP-HK-002',
                name: 'Meena Bai',
                designation: 'Senior Sanitation Lead',
                department: 'Facilities & Campus Sanitation',
                attendance: 99.0,
                kpiScore: 94,
                somWins: 1,
                photoColor: '#D97706',
                status: 'Active',
                citation: 'Exemplary dedication during parent-teacher conference day campus deep clean.',
            },
        ],
    },
    {
        id: 'dept-dining',
        name: 'Dining & Nutrition (Café)',
        code: 'DIN',
        manager: 'Mohan Lal Verma',
        managerId: 'EMP-CNT-001',
        managerRole: 'canteenmanager',
        description: 'Food safety standards, student nutrition, hygienic dining hall management.',
        employees: [
            {
                id: 'EMP-CNT-001',
                name: 'Mohan Lal Verma',
                designation: 'Campus Dining & Nutrition Lead',
                department: 'Dining & Nutrition (Café)',
                attendance: 98.2,
                kpiScore: 96,
                somWins: 2,
                photoColor: '#E11D48',
                status: 'Active',
                citation: '100% compliance on FSSAI hygiene audit and introduced healthy millet meal alternatives loved by students.',
            },
        ],
    },
]

// ==========================================
// 3. SEED FINALIZED MONTHLY RECOGNITIONS
// ==========================================

const SEED_ACADEMIC_SOM = [
    // June 2025
    { id: 'ASOM-2025-001', month: 'June 2025', academicYear: '2025-2026', classSection: 'Grade 10-A', className: 'Grade 10', section: 'A', studentId: 'STU-2024-0142', studentName: 'Aarav Sharma', gpa: 3.94, score: 98, ratingStars: 3, citation: 'Highest score in Diagnostic Assessment and elected Student Council President.', status: 'Published', nominatedBy: 'Priya Menon (Class Teacher)', finalizedAt: '2025-06-30' },
    { id: 'ASOM-2025-002', month: 'June 2025', academicYear: '2025-2026', classSection: 'Grade 10-B', className: 'Grade 10', section: 'B', studentId: 'STU-2026-022', studentName: 'Meera Krishnan', gpa: 3.92, score: 96, ratingStars: 3, citation: 'Outstanding dramatics lead and academic score.', status: 'Published', nominatedBy: 'Mr. Ravi Kumar (Class Teacher)', finalizedAt: '2025-06-30' },
    { id: 'ASOM-2025-003', month: 'June 2025', academicYear: '2025-2026', classSection: 'Grade 9-A', className: 'Grade 9', section: 'A', studentId: 'STU-2026-032', studentName: 'Pooja Hegde', gpa: 3.90, score: 95, ratingStars: 3, citation: 'Exceptional social science presentation.', status: 'Published', nominatedBy: 'Ms. Anitha Verma (Class Teacher)', finalizedAt: '2025-06-30' },
    { id: 'ASOM-2025-004', month: 'June 2025', academicYear: '2025-2026', classSection: 'Grade 5-A', className: 'Grade 5', section: 'A', studentId: 'STU-2026-052', studentName: 'Tara Srinivasan', gpa: 3.95, score: 97, ratingStars: 3, citation: 'Reading bee champion with exemplary neatness.', status: 'Published', nominatedBy: 'Sunita Sen (Class Teacher)', finalizedAt: '2025-06-30' },
    { id: 'ASOM-2025-005', month: 'June 2025', academicYear: '2025-2026', classSection: 'Grade 12-A', className: 'Grade 12', section: 'A', studentId: 'STU-2026-071', studentName: 'Harish Kalyan', gpa: 3.98, score: 99, ratingStars: 3, citation: 'Joint Mock JEE rank 1 & school physics mentor.', status: 'Published', nominatedBy: 'Dr. Subramanian (Class Teacher)', finalizedAt: '2025-06-30' },

    // July 2025
    { id: 'ASOM-2025-011', month: 'July 2025', academicYear: '2025-2026', classSection: 'Grade 10-A', className: 'Grade 10', section: 'A', studentId: 'STU-2026-002', studentName: 'Diya Patel', gpa: 3.92, score: 96, ratingStars: 3, citation: 'First in Regional Science Fair & top physics score.', status: 'Published', nominatedBy: 'Priya Menon (Class Teacher)', finalizedAt: '2025-07-31' },
    { id: 'ASOM-2025-012', month: 'July 2025', academicYear: '2025-2026', classSection: 'Grade 10-B', className: 'Grade 10', section: 'B', studentId: 'STU-2026-021', studentName: 'Aditya Verma', gpa: 3.89, score: 94, ratingStars: 3, citation: 'Top score in Calculus split test.', status: 'Published', nominatedBy: 'Mr. Ravi Kumar (Class Teacher)', finalizedAt: '2025-07-31' },
    { id: 'ASOM-2025-013', month: 'July 2025', academicYear: '2025-2026', classSection: 'Grade 9-A', className: 'Grade 9', section: 'A', studentId: 'STU-2026-031', studentName: 'Siddharth Rao', gpa: 3.88, score: 94, ratingStars: 3, citation: 'English elocution winner.', status: 'Published', nominatedBy: 'Ms. Anitha Verma (Class Teacher)', finalizedAt: '2025-07-31' },
    { id: 'ASOM-2025-014', month: 'July 2025', academicYear: '2025-2026', classSection: 'Grade 5-B', className: 'Grade 5', section: 'B', studentId: 'STU-2026-062', studentName: 'Anika Gupta', gpa: 3.94, score: 97, ratingStars: 3, citation: 'Spelling Bee winner and perfect conduct.', status: 'Published', nominatedBy: 'Deepa Menon (Class Teacher)', finalizedAt: '2025-07-31' },

    // August 2025
    { id: 'ASOM-2025-021', month: 'August 2025', academicYear: '2025-2026', classSection: 'Grade 10-A', className: 'Grade 10', section: 'A', studentId: 'STU-2024-0142', studentName: 'Aarav Sharma', gpa: 3.96, score: 99, ratingStars: 3, citation: 'Independence Day speech lead and 100% score in Mathematics Unit 2.', status: 'Published', nominatedBy: 'Priya Menon (Class Teacher)', finalizedAt: '2025-08-31' },
    { id: 'ASOM-2025-022', month: 'August 2025', academicYear: '2025-2026', classSection: 'Grade 10-B', className: 'Grade 10', section: 'B', studentId: 'STU-2026-022', studentName: 'Meera Krishnan', gpa: 3.95, score: 98, ratingStars: 3, citation: 'All-round performance in inter-school competitions.', status: 'Published', nominatedBy: 'Mr. Ravi Kumar (Class Teacher)', finalizedAt: '2025-08-31' },
    { id: 'ASOM-2025-023', month: 'August 2025', academicYear: '2025-2026', classSection: 'Grade 9-B', className: 'Grade 9', section: 'B', studentId: 'STU-2026-042', studentName: 'Kavya Nair', gpa: 3.90, score: 95, ratingStars: 3, citation: 'Choir lead and highest marks in Biology.', status: 'Published', nominatedBy: 'Rajesh Kumar (Class Teacher)', finalizedAt: '2025-08-31' },
    { id: 'ASOM-2025-024', month: 'August 2025', academicYear: '2025-2026', classSection: 'Grade 12-A', className: 'Grade 12', section: 'A', studentId: 'STU-2026-071', studentName: 'Harish Kalyan', gpa: 3.99, score: 100, ratingStars: 3, citation: 'National Olympiad state topper.', status: 'Published', nominatedBy: 'Dr. Subramanian (Class Teacher)', finalizedAt: '2025-08-31' },

    // September 2025 (Current)
    { id: 'ASOM-2025-031', month: 'September 2025', academicYear: '2025-2026', classSection: 'Grade 10-A', className: 'Grade 10', section: 'A', studentId: 'STU-2024-0142', studentName: 'Aarav Sharma', gpa: 3.97, score: 98, ratingStars: 3, citation: 'Organized Teachers Day school assembly & highest aggregate in Term 1 mock exams.', status: 'Published', nominatedBy: 'Priya Menon (Class Teacher)', finalizedAt: '2025-09-30' },
    { id: 'ASOM-2025-032', month: 'September 2025', academicYear: '2025-2026', classSection: 'Grade 10-B', className: 'Grade 10', section: 'B', studentId: 'STU-2026-022', studentName: 'Meera Krishnan', gpa: 3.95, score: 97, ratingStars: 3, citation: 'Consistent high marks in Computer Science and debate finalist.', status: 'Published', nominatedBy: 'Mr. Ravi Kumar (Class Teacher)', finalizedAt: '2025-09-30' },
    { id: 'ASOM-2025-033', month: 'September 2025', academicYear: '2025-2026', classSection: 'Grade 9-A', className: 'Grade 9', section: 'A', studentId: 'STU-2026-032', studentName: 'Pooja Hegde', gpa: 3.94, score: 96, ratingStars: 3, citation: '100% attendance and leadership in peer study circle.', status: 'Published', nominatedBy: 'Ms. Anitha Verma (Class Teacher)', finalizedAt: '2025-09-30' },
    { id: 'ASOM-2025-034', month: 'September 2025', academicYear: '2025-2026', classSection: 'Grade 5-A', className: 'Grade 5', section: 'A', studentId: 'STU-2026-052', studentName: 'Tara Srinivasan', gpa: 3.96, score: 98, ratingStars: 3, citation: 'Consistent perfection in reading and arithmetic logs.', status: 'Published', nominatedBy: 'Sunita Sen (Class Teacher)', finalizedAt: '2025-09-30' },
]

const SEED_NON_ACADEMIC_SOM = [
    // June 2025
    { id: 'NASOM-2025-001', month: 'June 2025', academicYear: '2025-2026', department: 'Stores & Procurement', employeeId: 'EMP-STR-001', employeeName: 'Gurpreet Singh', designation: 'Stores & Inventory Manager', kpiScore: 98, ratingStars: 3, citation: 'Zero audit variance during annual curriculum material receipt.', status: 'Published', nominatedBy: 'Joint Director of Operations', finalizedAt: '2025-06-30' },
    { id: 'NASOM-2025-002', month: 'June 2025', academicYear: '2025-2026', department: 'Transport & Fleet Logistics', employeeId: 'EMP-DRV-001', employeeName: 'Jaswant Singh', designation: 'Senior Route Driver', kpiScore: 99, ratingStars: 3, citation: '100% on-time bus run during heavy monsoon first week of school.', status: 'Published', nominatedBy: 'Transport Manager', finalizedAt: '2025-06-30' },
    { id: 'NASOM-2025-003', month: 'June 2025', academicYear: '2025-2026', department: 'IT Support & Systems', employeeId: 'EMP-IT-001', employeeName: 'Rakesh Nair', designation: 'IT Operations Lead', kpiScore: 97, ratingStars: 3, citation: 'Zero network interruption during 1,420 student admissions sync.', status: 'Published', nominatedBy: 'Joint Director', finalizedAt: '2025-06-30' },
    { id: 'NASOM-2025-004', month: 'June 2025', academicYear: '2025-2026', department: 'Finance & Accounts', employeeId: 'EMP-ACC-001', employeeName: 'K. Venkataraman', designation: 'Chief Financial Officer', kpiScore: 97, ratingStars: 3, citation: 'Timely term-fee setup with 95% automated payment gateway reconciliation.', status: 'Published', nominatedBy: 'Managing Director', finalizedAt: '2025-06-30' },

    // July 2025
    { id: 'NASOM-2025-011', month: 'July 2025', academicYear: '2025-2026', department: 'Campus Security & Access Control', employeeId: 'EMP-GK-001', employeeName: 'Ram Singh', designation: 'Senior Security Guard', kpiScore: 99, ratingStars: 3, citation: 'Outstanding vigilance during morning rush hour.', status: 'Published', nominatedBy: 'Gate Keeper Manager', finalizedAt: '2025-07-31' },
    { id: 'NASOM-2025-012', month: 'July 2025', academicYear: '2025-2026', department: 'Stores & Procurement', employeeId: 'EMP-STR-001', employeeName: 'Gurpreet Singh', designation: 'Stores & Inventory Manager', kpiScore: 97, ratingStars: 3, citation: 'Fast turnaround on laboratory chemical requests.', status: 'Published', nominatedBy: 'Joint Director', finalizedAt: '2025-07-31' },
    { id: 'NASOM-2025-013', month: 'July 2025', academicYear: '2025-2026', department: 'Facilities & Campus Sanitation', employeeId: 'EMP-HK-001', employeeName: 'Savitri Devi', designation: 'Housekeeping Supervisor', kpiScore: 96, ratingStars: 3, citation: 'Excellent hygiene score on state health inspection.', status: 'Published', nominatedBy: 'Joint Director', finalizedAt: '2025-07-31' },

    // August 2025
    { id: 'NASOM-2025-021', month: 'August 2025', academicYear: '2025-2026', department: 'Transport & Fleet Logistics', employeeId: 'EMP-DRV-001', employeeName: 'Jaswant Singh', designation: 'Senior Route Driver', kpiScore: 100, ratingStars: 3, citation: '18th month milestone with zero safety warnings and praise from 42 parents.', status: 'Published', nominatedBy: 'Transport Manager', finalizedAt: '2025-08-31' },
    { id: 'NASOM-2025-022', month: 'August 2025', academicYear: '2025-2026', department: 'Human Resources', employeeId: 'EMP-HR-001', employeeName: 'Sunita Deshmukh', designation: 'Head of Human Resources', kpiScore: 96, ratingStars: 3, citation: 'Completed mid-year performance appraisals for 180 staff with zero escalation.', status: 'Published', nominatedBy: 'Managing Director', finalizedAt: '2025-08-31' },
    { id: 'NASOM-2025-023', month: 'August 2025', academicYear: '2025-2026', department: 'IT Support & Systems', employeeId: 'EMP-IT-001', employeeName: 'Rakesh Nair', designation: 'IT Operations Lead', kpiScore: 98, ratingStars: 3, citation: 'Configured smart classroom touchscreens in record time.', status: 'Published', nominatedBy: 'Joint Director', finalizedAt: '2025-08-31' },

    // September 2025 (Current)
    { id: 'NASOM-2025-031', month: 'September 2025', academicYear: '2025-2026', department: 'Stores & Procurement', employeeId: 'EMP-STR-001', employeeName: 'Gurpreet Singh', designation: 'Stores & Inventory Manager', kpiScore: 99, ratingStars: 3, citation: 'Implemented automated low-stock reorder triggers preventing exam paper shortage.', status: 'Published', nominatedBy: 'Joint Director', finalizedAt: '2025-09-30' },
    { id: 'NASOM-2025-032', month: 'September 2025', academicYear: '2025-2026', department: 'Dining & Nutrition (Café)', employeeId: 'EMP-CNT-001', employeeName: 'Mohan Lal Verma', designation: 'Campus Dining & Nutrition Lead', kpiScore: 97, ratingStars: 3, citation: 'FSSAI 5-star hygiene rating achieved for main cafeteria.', status: 'Published', nominatedBy: 'Joint Director', finalizedAt: '2025-09-30' },
    { id: 'NASOM-2025-033', month: 'September 2025', academicYear: '2025-2026', department: 'Finance & Accounts', employeeId: 'EMP-ACC-001', employeeName: 'K. Venkataraman', designation: 'Chief Financial Officer', kpiScore: 98, ratingStars: 3, citation: 'Realized 94.8% term collection efficiency ahead of schedule.', status: 'Published', nominatedBy: 'Managing Director', finalizedAt: '2025-09-30' },
    { id: 'NASOM-2025-034', month: 'September 2025', academicYear: '2025-2026', department: 'Transport & Fleet Logistics', employeeId: 'EMP-DRV-001', employeeName: 'Jaswant Singh', designation: 'Senior Route Driver', kpiScore: 99, ratingStars: 3, citation: 'Exemplary conduct during school sports day bus transit.', status: 'Published', nominatedBy: 'Transport Manager', finalizedAt: '2025-09-30' },
]

// ==========================================
// 4. STORAGE ACCESS & MUTATIONS
// ==========================================

const ACADEMIC_STORAGE_KEY = 'schoolerp-academic-som-v2'
const NON_ACADEMIC_STORAGE_KEY = 'schoolerp-nonacademic-som-v2'
const SOY_STATUS_KEY = 'schoolerp-soy-approval-status-v2'

export const getAcademicSomRecords = () => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem(ACADEMIC_STORAGE_KEY)
            if (raw) return JSON.parse(raw)
            window.localStorage.setItem(ACADEMIC_STORAGE_KEY, JSON.stringify(SEED_ACADEMIC_SOM))
        }
    } catch {
        /* ignore */
    }
    return SEED_ACADEMIC_SOM
}

export const saveAcademicSomRecord = (record) => {
    const list = getAcademicSomRecords()
    const updated = [record, ...list.filter((r) => r.id !== record.id)]
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ACADEMIC_STORAGE_KEY, JSON.stringify(updated))
    }
    return updated
}

export const getNonAcademicSomRecords = () => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem(NON_ACADEMIC_STORAGE_KEY)
            if (raw) return JSON.parse(raw)
            window.localStorage.setItem(NON_ACADEMIC_STORAGE_KEY, JSON.stringify(SEED_NON_ACADEMIC_SOM))
        }
    } catch {
        /* ignore */
    }
    return SEED_NON_ACADEMIC_SOM
}

export const saveNonAcademicSomRecord = (record) => {
    const list = getNonAcademicSomRecords()
    const updated = [record, ...list.filter((r) => r.id !== record.id)]
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(NON_ACADEMIC_STORAGE_KEY, JSON.stringify(updated))
    }
    return updated
}

// ==========================================
// 5. STAR OF THE YEAR AUTOMATIC CALCULATIONS
// ==========================================

/**
 * Calculates Academic Star of the Year based on finalized Star of the Month records.
 * Formula:
 * - Minimum 2 monthly recognitions for eligibility.
 * - Cumulative Score = (Monthly Wins * 20 pts) + (Avg Monthly Score * 0.5) + (Attendance * 0.3)
 */
export const calculateAcademicStarOfYear = (academicYear = CURRENT_ACADEMIC_YEAR) => {
    const records = getAcademicSomRecords().filter(
        (r) => r.academicYear === academicYear && r.status === 'Published'
    )

    const studentMap = {}

    records.forEach((record) => {
        if (!studentMap[record.studentId]) {
            studentMap[record.studentId] = {
                studentId: record.studentId,
                studentName: record.studentName,
                classSection: record.classSection,
                className: record.className,
                section: record.section,
                monthlyWins: [],
                totalScorePoints: 0,
                gpaList: [],
            }
        }
        studentMap[record.studentId].monthlyWins.push(record.month)
        studentMap[record.studentId].totalScorePoints += Number(record.score || 95)
        studentMap[record.studentId].gpaList.push(Number(record.gpa || 3.8))
    })

    const aggregated = Object.values(studentMap).map((item) => {
        const somCount = item.monthlyWins.length
        const avgScore = Number((item.totalScorePoints / somCount).toFixed(1))
        const avgGpa = Number((item.gpaList.reduce((a, b) => a + b, 0) / somCount).toFixed(2))

        // Look up registered student attendance from catalog
        const classInfo = CLASS_ASSIGNMENTS[item.classSection]
        const matchedStudent = classInfo?.students?.find((s) => s.id === item.studentId)
        const attendance = matchedStudent?.attendance || 97.5

        // Transparent cumulative evaluation score (Max: 100)
        // Wins weight: 20 pts per win (capped at 40), avgScore weight: 40%, attendance: 20%
        const cumulativeScore = Math.min(
            100,
            Math.round(
                Math.min(somCount * 15, 35) +
                (avgScore * 0.45) +
                (attendance * 0.20)
            )
        )

        const isEligible = somCount >= 2 && cumulativeScore >= 85

        return {
            ...item,
            somCount,
            avgScore,
            avgGpa,
            attendance,
            cumulativeScore,
            isEligible,
            eligibilityReason: isEligible
                ? 'Met minimum threshold: ≥ 2 SOM awards and cumulative score ≥ 85%'
                : 'Pending eligibility: requires ≥ 2 SOM awards',
        }
    })

    // Sort descending by cumulative score
    aggregated.sort((a, b) => b.cumulativeScore - a.cumulativeScore || b.somCount - a.somCount)

    // Assign formal ranks
    return aggregated.map((cand, idx) => ({
        ...cand,
        rank: idx + 1,
        titleAward: idx === 0 ? 'Star of the Year Winner' : idx === 1 ? 'First Runner-Up' : idx === 2 ? 'Second Runner-Up' : 'Honorary Finalist',
    }))
}

/**
 * Calculates Non-Academic Star of the Year based on department SOM records.
 */
export const calculateNonAcademicStarOfYear = (academicYear = CURRENT_ACADEMIC_YEAR) => {
    const records = getNonAcademicSomRecords().filter(
        (r) => r.academicYear === academicYear && r.status === 'Published'
    )

    const empMap = {}

    records.forEach((record) => {
        if (!empMap[record.employeeId]) {
            empMap[record.employeeId] = {
                employeeId: record.employeeId,
                employeeName: record.employeeName,
                department: record.department,
                designation: record.designation,
                monthlyWins: [],
                totalKpiPoints: 0,
            }
        }
        empMap[record.employeeId].monthlyWins.push(record.month)
        empMap[record.employeeId].totalKpiPoints += Number(record.kpiScore || 95)
    })

    const aggregated = Object.values(empMap).map((item) => {
        const somCount = item.monthlyWins.length
        const avgKpi = Number((item.totalKpiPoints / somCount).toFixed(1))

        // Find employee attendance
        let attendance = 98.0
        for (const dept of NON_ACADEMIC_DEPARTMENTS) {
            const emp = dept.employees.find((e) => e.id === item.employeeId)
            if (emp) {
                attendance = emp.attendance
                break
            }
        }

        const cumulativeScore = Math.min(
            100,
            Math.round(
                Math.min(somCount * 15, 35) +
                (avgKpi * 0.45) +
                (attendance * 0.20)
            )
        )

        const isEligible = somCount >= 2 && cumulativeScore >= 85

        return {
            ...item,
            somCount,
            avgKpi,
            attendance,
            cumulativeScore,
            isEligible,
            eligibilityReason: isEligible
                ? 'Eligible: ≥ 2 Department recognitions and cumulative performance score ≥ 85%'
                : 'Pending: requires ≥ 2 monthly recognitions',
        }
    })

    aggregated.sort((a, b) => b.cumulativeScore - a.cumulativeScore || b.somCount - a.somCount)

    return aggregated.map((cand, idx) => ({
        ...cand,
        rank: idx + 1,
        titleAward: idx === 0 ? 'Non-Academic Star of the Year' : idx === 1 ? 'Excellence in Service Runner-Up' : 'Merit Finalist',
    }))
}

// ==========================================
// 6. ROLE-BASED ACCESS & PERMISSION RESOLVERS
// ==========================================

/**
 * Returns authorized classes based on logged-in user role and email.
 * - Class Teacher (Priya Menon): ONLY her assigned class ('Grade 10-A').
 * - Academic Coordinator: Secondary & Sr. Secondary wings (Grades 8-12).
 * - Principal / Director / Super Admin: All authorized classes school-wide (Grades 1-12).
 */
export const getAuthorizedClassesForUser = (userRole, userEmail) => {
    const allClassSectionKeys = Object.keys(CLASS_ASSIGNMENTS)

    if (userRole === 'teacher') {
        const normalized = (userEmail || '').trim().toLowerCase()
        const assigned = allClassSectionKeys.filter((key) => {
            const assignment = CLASS_ASSIGNMENTS[key]
            return assignment.classTeacherEmail.toLowerCase() === normalized
        })
        // If teacher is mapped, return only assigned class; fallback to Grade 10-A for demo teacher
        return assigned.length > 0 ? assigned : ['Grade 10-A']
    }

    if (userRole === 'coordinator') {
        // Coordinator manages Secondary and Senior Secondary (Grades 9 to 12)
        return allClassSectionKeys.filter((key) =>
            key.startsWith('Grade 9') || key.startsWith('Grade 10') || key.startsWith('Grade 11') || key.startsWith('Grade 12')
        )
    }

    // Principal, Director, Super Admin, Admin
    return allClassSectionKeys
}

/**
 * Returns authorized departments based on user role.
 * - Department Head: ONLY their department.
 * - Director / Principal / Super Admin / HR: All non-academic departments.
 */
export const getAuthorizedDepartmentsForUser = (userRole) => {
    const normalizedRole = (userRole || '').replace(/[-_\s]/g, '').toLowerCase()
    const roleToDeptMap = {
        stationerystoremanager: 'dept-stores',
        transportmanager: 'dept-transport',
        accounthead: 'dept-finance',
        hr: 'dept-hr',
        itsupportmanager: 'dept-it',
        gatekeepermanager: 'dept-security',
        housekeepingmanager: 'dept-housekeeping',
        canteenmanager: 'dept-dining',
    }

    const assignedDeptId = roleToDeptMap[normalizedRole]
    if (assignedDeptId) {
        return NON_ACADEMIC_DEPARTMENTS.filter((d) => d.id === assignedDeptId)
    }

    // Managing Director, Principal, Super Admin, Admin have organization-wide visibility
    return NON_ACADEMIC_DEPARTMENTS
}
