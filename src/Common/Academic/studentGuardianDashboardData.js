const buildDashboard = (routePrefix) => ({
    priorities: [
        { key: 'today', label: 'Today', value: '5 periods', context: 'Next class shown in the timetable', status: 'info', to: `${routePrefix}/class/timetable-list` },
        { key: 'due-work', label: 'Due work', value: '2 items', context: 'Review home learning and materials', status: 'Pending', to: `${routePrefix}/student-deliverables/home-fun` },
        { key: 'attendance', label: 'Attendance', value: 'Review', context: 'Daily records and term report', status: 'info', to: `${routePrefix}/class/attendance-report` },
        { key: 'results', label: 'Results', value: 'Published only', context: 'Director-approved assessment results', status: 'Approved', to: `${routePrefix}/student-evaluation/exam-result` },
        { key: 'payments', label: 'Payments', value: 'Review', context: 'Fee schedule and payment status', status: 'info', to: `${routePrefix}/payment/fees-payment` },
    ],
    today: [
        { time: '08:45', title: 'Morning assembly', description: 'Main auditorium', status: 'Scheduled', to: `${routePrefix}/class/timetable-list` },
        { time: '10:30', title: 'Mathematics', description: 'Classroom · current timetable', status: 'Next', to: `${routePrefix}/class/timetable-list` },
        { time: '16:00', title: 'Home learning due', description: 'Review the current assignment', status: 'Pending', to: `${routePrefix}/student-deliverables/home-fun` },
    ],
})

export const getStudentGuardianDashboardData = (routePrefix) => (
    routePrefix === '/student' || routePrefix === '/parent'
        ? buildDashboard(routePrefix)
        : null
)

