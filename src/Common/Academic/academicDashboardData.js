const ACADEMIC_BRIEFINGS = {
    teacher: {
        title: 'Teaching day briefing',
        description: 'Classes, submissions and student follow-ups ordered around the next action in today’s teaching work.',
        roleContext: 'Teacher workspace',
        metrics: [
            { label: 'Classes today', value: '5', context: 'Next: Class VII-B · Mathematics · 10:30', icon: 'people' },
            { label: 'Attendance pending', value: '2', context: 'Class registers still awaiting submission', icon: 'waiting' },
            { label: 'Lesson plans in draft', value: '3', context: '1 due for review by tomorrow', icon: 'documents' },
            { label: 'Mark entries due', value: '2', context: 'CA and RCT score sheets', icon: 'risk' },
        ],
        queues: [
            { title: 'Complete today’s attendance', description: 'Submit attendance for the assigned class periods.', owner: 'Teacher', sla: 'Before 16:00', status: 'Pending', to: '/teacher/attendance/class-attendance' },
            { title: 'Finish lesson-plan drafts', description: 'Complete objectives, activities and evidence before submitting.', owner: 'Teacher', sla: 'Tomorrow', status: 'Draft', to: '/teacher/lesson-plan/my-lesson-plan' },
            { title: 'Enter assessment marks', description: 'Validate absent students and maximum marks before submission.', owner: 'Teacher', sla: '2 days', status: 'In progress', to: '/teacher/student-evaluation/mark-entry' },
        ],
        quickActions: [
            { label: 'Open class timetable', to: '/teacher/class/class-routine' },
            { label: 'Create a lesson plan', to: '/teacher/lesson-plan-approval/add' },
            { label: 'Share home learning', to: '/teacher/student-deliverables/home-fun' },
            { label: 'Review my tasks', to: '/teacher/task-management/my-tasks' },
        ],
    },
    coordinator: {
        title: 'Academic coordination briefing',
        description: 'Teaching delivery, review queues and class exceptions that need coordinator attention.',
        roleContext: 'Coordinator workspace',
        metrics: [
            { label: 'Plans awaiting review', value: '7', context: '3 have been waiting over 24 hours', icon: 'approvals' },
            { label: 'Attendance exceptions', value: '4', context: 'Assigned classes with incomplete registers', icon: 'risk' },
            { label: 'Mark sheets in progress', value: '6', context: 'Across CA and RCT assessments', icon: 'documents' },
            { label: 'Open academic tasks', value: '9', context: '2 due before end of day', icon: 'waiting' },
        ],
        queues: [
            { title: 'Review submitted lesson plans', description: 'Check outcomes, activities, evidence and curriculum alignment.', owner: 'Coordinator', sla: '24 hours', status: 'Pending', to: '/coordinator/lesson-plan-approval' },
            { title: 'Resolve attendance exceptions', description: 'Follow up on incomplete or conflicting class attendance.', owner: 'Coordinator', sla: 'Today', status: 'In review', to: '/coordinator/attendance/class-attendance' },
            { title: 'Complete coordinator mark entry', description: 'Validate score limits and absent-student status before submission.', owner: 'Coordinator', sla: '2 days', status: 'In progress', to: '/coordinator/student-evaluation/mark-entry' },
        ],
        quickActions: [
            { label: 'Open class timetable', to: '/coordinator/class/class-routine' },
            { label: 'Review lesson plans', to: '/coordinator/lesson-plan-approval' },
            { label: 'View performance analytics', to: '/coordinator/student-evaluation/analytics' },
            { label: 'Review assigned tasks', to: '/coordinator/task-management/my-tasks' },
        ],
    },
    principal: {
        title: 'School academic operations briefing',
        description: 'Academic delivery, allocations and timetable decisions that need Principal attention today.',
        roleContext: 'Principal workspace',
        metrics: [
            { label: 'Allocation reviews', value: '6', context: 'Student and teacher assignments awaiting action', icon: 'approvals' },
            { label: 'Timetable exceptions', value: '3', context: 'Conflicts require resolution before publication', icon: 'risk' },
            { label: 'Academic tasks due', value: '8', context: '2 are due before end of day', icon: 'waiting' },
            { label: 'Active teaching staff', value: '74', context: 'Current academic-year employee registry', icon: 'people' },
        ],
        queues: [
            { title: 'Review student allocations', description: 'Verify class, section and capacity before confirming placement.', owner: 'Principal', sla: 'Today', status: 'Pending', to: '/principal/student-allocation-approval' },
            { title: 'Resolve teacher allocations', description: 'Review subject coverage and timetable load before assignment.', owner: 'Principal', sla: '24 hours', status: 'In review', to: '/principal/academic/teacher-allocation' },
            { title: 'Publish examination timetable', description: 'Validate rooms, clashes and dates before Director submission.', owner: 'Principal', sla: 'This week', status: 'Draft', to: '/principal/examination-timetable' },
        ],
        quickActions: [
            { label: 'Open student database', to: '/principal/user-management/student-database' },
            { label: 'Review employee database', to: '/principal/user-management/employee-database' },
            { label: 'Assign an academic task', to: '/principal/task-management/assign-tasks' },
            { label: 'Open communication inbox', to: '/principal/communication/inbox' },
        ],
    },
    director: {
        title: 'Academic governance briefing',
        description: 'Publication decisions, approval queues and academic risks requiring Director review.',
        roleContext: 'Director workspace',
        metrics: [
            { label: 'Mark entries pending', value: '1', context: 'Approval controls student and guardian visibility', icon: 'approvals' },
            { label: 'Lesson plans pending', value: '1', context: 'Reviewer rationale required on rejection', icon: 'documents' },
            { label: 'Timetable approvals', value: '2', context: 'Exam schedules awaiting decision', icon: 'waiting' },
            { label: 'Open escalations', value: '4', context: '1 academic escalation is overdue', icon: 'risk' },
        ],
        queues: [
            { title: 'Review submitted marks', description: 'Validate assessment results before portal publication.', owner: 'Director', sla: '24 hours', status: 'Pending', to: '/director/mark-entry-approval' },
            { title: 'Review lesson plans', description: 'Check teaching outcomes, evidence and curriculum alignment.', owner: 'Director', sla: '24 hours', status: 'Pending', to: '/director/lesson-plan-approval' },
            { title: 'Decide examination timetables', description: 'Review dates, rooms and clashes submitted by the Principal.', owner: 'Director', sla: '2 days', status: 'In review', to: '/director/examination-approvals' },
        ],
        quickActions: [
            { label: 'Open request approvals', to: '/director/request-approvals' },
            { label: 'Assign a task', to: '/director/task-management/assign-tasks' },
            { label: 'Review escalations', to: '/director/escalation-management' },
            { label: 'Publish an announcement', to: '/director/broadcast' },
        ],
    },
    librarian: {
        title: 'Library service briefing',
        description: 'Circulation, overdue follow-up and collection work ordered around today’s service priorities.',
        roleContext: 'Librarian workspace',
        metrics: [
            { label: 'Books issued today', value: '18', context: 'Students and staff combined', icon: 'documents' },
            { label: 'Returns due today', value: '11', context: '4 remain outstanding', icon: 'waiting' },
            { label: 'Overdue items', value: '9', context: '3 are overdue by more than 7 days', icon: 'risk' },
            { label: 'Active members', value: '842', context: 'Current academic-year registry', icon: 'people' },
        ],
        queues: [
            { title: 'Follow up overdue returns', description: 'Review borrowers and send the approved reminder workflow.', owner: 'Librarian', sla: 'Today', status: 'Overdue', to: '/librarian/notifications' },
            { title: 'Complete issue and return records', description: 'Verify borrower, accession number and due date.', owner: 'Librarian', sla: 'Same day', status: 'In progress', to: '/librarian/issued-books/issued-book-list' },
            { title: 'Resolve collection tasks', description: 'Complete cataloguing and stock-verification assignments.', owner: 'Librarian', sla: 'This week', status: 'Pending', to: '/librarian/task-management/my-tasks' },
        ],
        quickActions: [
            { label: 'Issue a book', to: '/librarian/issued-books/add-issued-book' },
            { label: 'Add a catalogue item', to: '/librarian/book-management/add-book' },
            { label: 'Review members', to: '/librarian/members/member-list' },
            { label: 'Open communication inbox', to: '/librarian/communication/inbox' },
        ],
    },
}

export const getAcademicBriefing = (role) => ACADEMIC_BRIEFINGS[role] ?? null

