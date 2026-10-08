export const NOTIFICATION_TYPES = ['General', 'Exam', 'Event', 'Holiday', 'Announcement', 'Payment']

export const typeBadgeColor = {
    General: 'bg-[#515DEF33] text-[#515DEF]',
    Exam: 'bg-[#9C27B033] text-[#9C27B0]',
    Event: 'bg-[#FF980033] text-[#FF9800]',
    Holiday: 'bg-[#4CAF5033] text-[#4CAF50]',
    Announcement: 'bg-[#2196F333] text-[#2196F3]',
    Payment: 'bg-[#FF572233] text-[#FF5722]',
}

export const NOTIFICATIONS = [
    {
        id: 'ADM-NTF-001',
        type: 'Exam',
        title: 'Board Exam Schedule Published',
        message: 'The final board examination timetable for Classes 10 and 12 has been published. All departments must verify subject allocations.',
        relatedDate: '20-03-2026',
        notificationDate: '10-03-2026',
        postedBy: 'Examination Cell',
        isRead: false,
    },
    {
        id: 'ADM-NTF-002',
        type: 'Event',
        title: 'Annual Day Rehearsal Schedule',
        message: 'Annual Day rehearsals are scheduled from 18–22 March. Admin team to coordinate venue bookings and security.',
        relatedDate: '18-03-2026',
        notificationDate: '09-03-2026',
        postedBy: 'Principal Office',
        isRead: true,
    },
    {
        id: 'ADM-NTF-003',
        type: 'General',
        title: 'Staff Attendance Policy Update',
        message: 'Updated staff attendance policy effective 01 April 2026. HR circular attached in the documents section.',
        relatedDate: '01-04-2026',
        notificationDate: '08-03-2026',
        postedBy: 'HR Department',
        isRead: false,
    },
    {
        id: 'ADM-NTF-004',
        type: 'Payment',
        title: 'Term Fee Collection Reminder',
        message: 'Term 2 fee collection deadline is 25 March 2026. Front office to follow up on pending accounts.',
        relatedDate: '25-03-2026',
        notificationDate: '07-03-2026',
        postedBy: 'Accounts Office',
        isRead: true,
    },
    {
        id: 'ADM-NTF-005',
        type: 'Holiday',
        title: 'Holi Holiday Notification',
        message: 'School will remain closed on 14 March 2026 for Holi. Emergency contact roster to be shared with security.',
        relatedDate: '14-03-2026',
        notificationDate: '05-03-2026',
        postedBy: 'Administration',
        isRead: true,
    },
    {
        id: 'ADM-NTF-006',
        type: 'Announcement',
        title: 'New Library Management System',
        message: 'The library is migrating to the new LMS module on 20 March. IT support will be available for onboarding.',
        relatedDate: '20-03-2026',
        notificationDate: '04-03-2026',
        postedBy: 'IT Support',
        isRead: false,
    },
]

export const filterNotifications = (items, filters) =>
    items.filter((item) => {
        const search = filters.search.trim().toLowerCase()
        const matchesSearch =
            !search ||
            item.title.toLowerCase().includes(search) ||
            item.message.toLowerCase().includes(search) ||
            item.postedBy.toLowerCase().includes(search)

        const matchesType = !filters.type || item.type === filters.type

        return matchesSearch && matchesType
    })
