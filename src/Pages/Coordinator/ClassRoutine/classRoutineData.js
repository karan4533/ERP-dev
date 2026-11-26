export const COORDINATOR_INFO = {
    employeeId: 'COORD-2001',
    coordinatorName: 'Priya Nair',
    role: 'Secondary School Academic Coordinator',
    wing: 'Secondary Wing (Grades 9 to 12)',
    supervisedGrades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
}

export const WEEKLY_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const TIME_SLOTS = [
    { time: '09:00 AM -\n09:45 AM', label: '09:00 AM - 09:45 AM' },
    { time: '09:45 AM -\n10:30 AM', label: '09:45 AM - 10:30 AM' },
    { time: '10:45 AM -\n11:30 AM', label: '10:45 AM - 11:30 AM' },
    { time: '11:30 AM -\n12:15 PM', label: '11:30 AM - 12:15 PM' },
    { time: '01:15 PM -\n02:00 PM', label: '01:15 PM - 02:00 PM' },
]

export const COORDINATOR_OWN_SCHEDULE = {
    '09:00 AM - 09:45 AM': {
        Monday: { subject: 'Academic Walkthrough', location: 'Grade 9 Corridor', type: 'Observation' },
        Tuesday: { subject: 'English Literature', className: '12-A', type: 'Teaching' },
        Wednesday: { subject: 'Lesson Plan Review', location: 'Staff Room 2', type: 'Review' },
        Thursday: { subject: 'English Literature', className: '12-A', type: 'Teaching' },
        Friday: { subject: 'Academic Walkthrough', location: 'Grade 10 Corridor', type: 'Observation' },
        Saturday: { subject: 'Dept Head Sync', location: 'Conference Rm B', type: 'Meeting' },
    },
    '09:45 AM - 10:30 AM': {
        Monday: { subject: 'English Literature', className: '12-A', type: 'Teaching' },
        Tuesday: { subject: 'Classroom Audit (10-A)', location: 'Room 304', type: 'Audit' },
        Wednesday: { subject: 'English Literature', className: '12-A', type: 'Teaching' },
        Thursday: { subject: 'Parent Consultation', location: 'Counseling Room', type: 'Meeting' },
        Friday: { subject: 'Classroom Audit (9-B)', location: 'Room 202', type: 'Audit' },
        Saturday: null,
    },
    '10:45 AM - 11:30 AM': {
        Monday: { subject: 'Curriculum Alignment', location: 'Coordinator Office', type: 'Planning' },
        Tuesday: { subject: 'English Literature', className: '11-A', type: 'Teaching' },
        Wednesday: { subject: 'Exam Paper Moderation', location: 'Evaluation Hall', type: 'Review' },
        Thursday: { subject: 'English Literature', className: '11-A', type: 'Teaching' },
        Friday: { subject: 'Mentorship Session', location: 'Room 301', type: 'Mentorship' },
        Saturday: { subject: 'Syllabus Tracker Review', location: 'Coordinator Office', type: 'Planning' },
    },
    '11:30 AM - 12:15 PM': {
        Monday: { subject: 'English Literature', className: '11-A', type: 'Teaching' },
        Tuesday: null,
        Wednesday: { subject: 'Remedial Supervision', location: 'Secondary Wing', type: 'Observation' },
        Thursday: { subject: 'Principal Briefing', location: 'Principal Office', type: 'Meeting' },
        Friday: { subject: 'English Literature', className: '11-A', type: 'Teaching' },
        Saturday: null,
    },
    '01:15 PM - 02:00 PM': {
        Monday: null,
        Tuesday: { subject: 'Weekly Academic Sync', location: 'Secondary Hall', type: 'Meeting' },
        Wednesday: null,
        Thursday: { subject: 'Substitute Teacher Allocation', location: 'Coordinator Office', type: 'Admin' },
        Friday: null,
        Saturday: { subject: 'Board Exam Strategy', location: 'AV Room', type: 'Planning' },
    },
}

export const SUPERVISED_CLASSES_LIST = [
    { id: '10-A', name: 'Class 10-A', classTeacher: 'Anita Verma', room: '304', totalStudents: 42 },
    { id: '10-B', name: 'Class 10-B', classTeacher: 'Sandy Selva', room: '305', totalStudents: 40 },
    { id: '9-A', name: 'Class 9-A', classTeacher: 'Priya Sharma', room: '201', totalStudents: 38 },
    { id: '9-B', name: 'Class 9-B', classTeacher: 'Dr. Subramanian', room: '202', totalStudents: 39 },
    { id: '11-A', name: 'Class 11-A', classTeacher: 'Ananya Roy', room: '401', totalStudents: 35 },
    { id: '12-A', name: 'Class 12-A', classTeacher: 'Rakesh Nair', room: '405', totalStudents: 36 },
]

export const SUPERVISED_TEACHERS_LIST = [
    { id: 'TEA-1001', name: 'Anita Verma', subject: 'Mathematics', classAllotted: '10-A' },
    { id: 'TEA-1002', name: 'Dr. Subramanian', subject: 'Physics', classAllotted: '9-B' },
    { id: 'TEA-1003', name: 'Ananya Roy', subject: 'Chemistry', classAllotted: '11-A' },
    { id: 'TEA-1004', name: 'Sandy Selva', subject: 'English', classAllotted: '10-B' },
    { id: 'TEA-1005', name: 'Priya Sharma', subject: 'Social Studies', classAllotted: '9-A' },
]

export const SUPERVISED_SCHEDULES_BY_CLASS = {
    '10-A': {
        '09:00 AM - 09:45 AM': {
            Monday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '304' },
            Tuesday: { subject: 'English', teacher: 'Sandy Selva', room: '304' },
            Wednesday: { subject: 'Physics', teacher: 'Dr. Subramanian', room: 'Lab 2' },
            Thursday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '304' },
            Friday: { subject: 'Chemistry', teacher: 'Ananya Roy', room: 'Lab 1' },
            Saturday: { subject: 'Social Studies', teacher: 'Priya Sharma', room: '304' },
        },
        '09:45 AM - 10:30 AM': {
            Monday: { subject: 'Physics', teacher: 'Dr. Subramanian', room: 'Lab 2' },
            Tuesday: { subject: 'Chemistry', teacher: 'Ananya Roy', room: 'Lab 1' },
            Wednesday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '304' },
            Thursday: { subject: 'English', teacher: 'Sandy Selva', room: '304' },
            Friday: { subject: 'Biology', teacher: 'Dr. Anita Sen', room: 'Bio Lab' },
            Saturday: { subject: 'Physical Education', teacher: 'Coach Murugan', room: 'Playground' },
        },
        '10:45 AM - 11:30 AM': {
            Monday: { subject: 'Social Studies', teacher: 'Priya Sharma', room: '304' },
            Tuesday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '304' },
            Wednesday: { subject: 'Computer Science', teacher: 'Rakesh Nair', room: 'IT Lab 1' },
            Thursday: { subject: 'Chemistry', teacher: 'Ananya Roy', room: 'Lab 1' },
            Friday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '304' },
            Saturday: { subject: 'English', teacher: 'Sandy Selva', room: '304' },
        },
        '11:30 AM - 12:15 PM': {
            Monday: { subject: 'English', teacher: 'Sandy Selva', room: '304' },
            Tuesday: { subject: 'Social Studies', teacher: 'Priya Sharma', room: '304' },
            Wednesday: { subject: 'Hindi / Regional', teacher: 'Meena Kumari', room: '304' },
            Thursday: { subject: 'Computer Science', teacher: 'Rakesh Nair', room: 'IT Lab 1' },
            Friday: { subject: 'Physics', teacher: 'Dr. Subramanian', room: 'Lab 2' },
            Saturday: { subject: 'Library & Reading', teacher: 'Meenakshi Sundaram', room: 'Central Library' },
        },
        '01:15 PM - 02:00 PM': {
            Monday: { subject: 'Chemistry', teacher: 'Ananya Roy', room: 'Lab 1' },
            Tuesday: { subject: 'Physics', teacher: 'Dr. Subramanian', room: 'Lab 2' },
            Wednesday: { subject: 'Social Studies', teacher: 'Priya Sharma', room: '304' },
            Thursday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '304' },
            Friday: { subject: 'Co-Curricular / Clubs', teacher: 'Club In-Charge', room: 'Activity Hall' },
            Saturday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '304' },
        },
    },
    '9-A': {
        '09:00 AM - 09:45 AM': {
            Monday: { subject: 'English', teacher: 'Sandy Selva', room: '201' },
            Tuesday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '201' },
            Wednesday: { subject: 'Social Studies', teacher: 'Priya Sharma', room: '201' },
            Thursday: { subject: 'Physics', teacher: 'Dr. Subramanian', room: 'Lab 2' },
            Friday: { subject: 'Hindi / Regional', teacher: 'Meena Kumari', room: '201' },
            Saturday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '201' },
        },
        '09:45 AM - 10:30 AM': {
            Monday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '201' },
            Tuesday: { subject: 'Social Studies', teacher: 'Priya Sharma', room: '201' },
            Wednesday: { subject: 'English', teacher: 'Sandy Selva', room: '201' },
            Thursday: { subject: 'Chemistry', teacher: 'Ananya Roy', room: 'Lab 1' },
            Friday: { subject: 'Physics', teacher: 'Dr. Subramanian', room: 'Lab 2' },
            Saturday: { subject: 'Physical Education', teacher: 'Coach Murugan', room: 'Playground' },
        },
        '10:45 AM - 11:30 AM': {
            Monday: { subject: 'Physics', teacher: 'Dr. Subramanian', room: 'Lab 2' },
            Tuesday: { subject: 'English', teacher: 'Sandy Selva', room: '201' },
            Wednesday: { subject: 'Chemistry', teacher: 'Ananya Roy', room: 'Lab 1' },
            Thursday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '201' },
            Friday: { subject: 'Social Studies', teacher: 'Priya Sharma', room: '201' },
            Saturday: { subject: 'Biology', teacher: 'Dr. Anita Sen', room: 'Bio Lab' },
        },
        '11:30 AM - 12:15 PM': {
            Monday: { subject: 'Social Studies', teacher: 'Priya Sharma', room: '201' },
            Tuesday: { subject: 'Physics', teacher: 'Dr. Subramanian', room: 'Lab 2' },
            Wednesday: { subject: 'Computer Science', teacher: 'Rakesh Nair', room: 'IT Lab 1' },
            Thursday: { subject: 'English', teacher: 'Sandy Selva', room: '201' },
            Friday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '201' },
            Saturday: { subject: 'Library & Reading', teacher: 'Meenakshi Sundaram', room: 'Library' },
        },
        '01:15 PM - 02:00 PM': {
            Monday: { subject: 'Co-Curricular / Clubs', teacher: 'Staff', room: 'Activity Hall' },
            Tuesday: { subject: 'Chemistry', teacher: 'Ananya Roy', room: 'Lab 1' },
            Wednesday: { subject: 'Mathematics', teacher: 'Anita Verma', room: '201' },
            Thursday: { subject: 'Social Studies', teacher: 'Priya Sharma', room: '201' },
            Friday: { subject: 'English', teacher: 'Sandy Selva', room: '201' },
            Saturday: { subject: 'Remedial / Revision', teacher: 'Subject Faculty', room: '201' },
        },
    }
}

export const SUBJECT_COLORS = {
    Mathematics: 'bg-blue-50 text-blue-700 border border-blue-100',
    Physics: 'bg-purple-50 text-purple-700 border border-purple-100',
    Chemistry: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    Biology: 'bg-teal-50 text-teal-700 border border-teal-100',
    English: 'bg-rose-50 text-rose-700 border border-rose-100',
    'English Literature': 'bg-rose-50 text-rose-700 border border-rose-100',
    'Social Studies': 'bg-amber-50 text-amber-700 border border-amber-100',
    'Computer Science': 'bg-cyan-50 text-cyan-700 border border-cyan-100',
    'Hindi / Regional': 'bg-orange-50 text-orange-700 border border-orange-100',
    'Physical Education': 'bg-lime-50 text-lime-700 border border-lime-100',
    'Library & Reading': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    'Co-Curricular / Clubs': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100',
    'Academic Walkthrough': 'bg-sky-50 text-sky-700 border border-sky-100',
    'Lesson Plan Review': 'bg-violet-50 text-violet-700 border border-violet-100',
    'Classroom Audit (10-A)': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    'Classroom Audit (9-B)': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    'Parent Consultation': 'bg-pink-50 text-pink-700 border border-pink-100',
    'Curriculum Alignment': 'bg-teal-50 text-teal-700 border border-teal-100',
    'Exam Paper Moderation': 'bg-red-50 text-red-700 border border-red-100',
    'Mentorship Session': 'bg-amber-50 text-amber-700 border border-amber-100',
    'Syllabus Tracker Review': 'bg-purple-50 text-purple-700 border border-purple-100',
    'Remedial Supervision': 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    'Principal Briefing': 'bg-rose-50 text-rose-700 border border-rose-100',
    'Weekly Academic Sync': 'bg-cyan-50 text-cyan-700 border border-cyan-100',
    'Substitute Teacher Allocation': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    'Board Exam Strategy': 'bg-blue-50 text-blue-700 border border-blue-100',
    'Dept Head Sync': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
}
