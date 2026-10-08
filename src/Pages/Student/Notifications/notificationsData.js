export const NOTIFICATION_TYPES = ['Exam', 'Event', 'Holiday', 'Payment']

export const typeBadgeColor = {
    Exam: 'bg-[#9C27B033] text-[#9C27B0]',
    Event: 'bg-[#FF980033] text-[#FF9800]',
    Holiday: 'bg-[#4CAF5033] text-[#4CAF50]',
    Payment: 'bg-[#FF572233] text-[#FF5722]',
}

export const STUDENT_NOTIFICATIONS = [
    {
        id: 'STU-NTF-001',
        type: 'Exam',
        title: 'Mid Term Exam Reminder',
        message: 'Mid Term examination for Mathematics is scheduled on 10-09-2025. Please arrive 15 minutes before exam time at Room 101.',
        relatedDate: '10-09-2025',
        notificationDate: '08-09-2025',
        postedBy: 'Examination Cell',
        isRead: false,
        meta: 'Mathematics · 09:00 AM · Room 101',
    },
    {
        id: 'STU-NTF-002',
        type: 'Exam',
        title: 'Pre-Board Schedule Released',
        message: 'Class 10 Pre-Board timetable is now available. Students must report to the assigned exam hall as per the schedule.',
        relatedDate: '20-06-2026',
        notificationDate: '01-06-2026',
        postedBy: 'Examination Cell',
        isRead: true,
        meta: 'Pre-Board · All Subjects',
    },
    {
        id: 'STU-NTF-003',
        type: 'Event',
        title: 'Annual Day Celebration',
        message: 'Annual Day rehearsals will be held after school hours. Students should report by 04:00 PM in costume at the School Auditorium.',
        relatedDate: '20-12-2025',
        notificationDate: '10-06-2026',
        postedBy: 'Activities Department',
        isRead: false,
        meta: 'Cultural · School Auditorium',
    },
    {
        id: 'STU-NTF-004',
        type: 'Event',
        title: 'Inter-House Sports Meet',
        message: 'Sports meet for Classes 9 and 10 on the main ground. Attendance marking will be done at the venue.',
        relatedDate: '25-06-2026',
        notificationDate: '03-06-2026',
        postedBy: 'Sports Coordinator',
        isRead: true,
        meta: 'Sports · Main Ground',
    },
    {
        id: 'STU-NTF-005',
        type: 'Holiday',
        title: 'Pongal Holidays',
        message: 'School will remain closed for Pongal celebrations. Regular classes resume on 18-01-2026.',
        relatedDate: '14-01-2026 to 17-01-2026',
        notificationDate: '02-01-2026',
        postedBy: 'Administration',
        isRead: true,
        meta: 'School Closed',
    },
    {
        id: 'STU-NTF-006',
        type: 'Holiday',
        title: 'Independence Day Holiday',
        message: 'School closed on account of Independence Day. Flag hoisting ceremony at 08:00 AM for selected students.',
        relatedDate: '15-08-2026',
        notificationDate: '01-08-2026',
        postedBy: 'Administration',
        isRead: true,
        meta: 'Public Holiday',
    },
    {
        id: 'STU-NTF-007',
        type: 'Payment',
        title: 'Term 2 Fee Due Reminder',
        message: 'Term 2 academic fee payment is due by 25-03-2026. Please pay through the portal or at the accounts office.',
        relatedDate: '25-03-2026',
        notificationDate: '07-03-2026',
        postedBy: 'Accounts Office',
        isRead: false,
        meta: 'Academic Fee · Pending',
    },
    {
        id: 'STU-NTF-008',
        type: 'Payment',
        title: 'Transport Fee Receipt Generated',
        message: 'Your transport fee payment for Term 2 has been received. Receipt is available under Transport Payment.',
        relatedDate: '05-03-2026',
        notificationDate: '05-03-2026',
        postedBy: 'Accounts Office',
        isRead: true,
        meta: 'Transport Fee · Paid',
    },
]

export const filterNotifications = (items, filters) =>
    items.filter((item) => {
        const search = filters.search.trim().toLowerCase()
        const matchesSearch =
            !search ||
            item.title.toLowerCase().includes(search) ||
            item.message.toLowerCase().includes(search) ||
            item.postedBy.toLowerCase().includes(search) ||
            (item.meta && item.meta.toLowerCase().includes(search))

        const matchesType = !filters.type || item.type === filters.type

        return matchesSearch && matchesType
    })
