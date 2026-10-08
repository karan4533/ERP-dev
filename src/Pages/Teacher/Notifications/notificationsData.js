export const NOTIFICATION_TYPES = ['General', 'Exam', 'Event', 'Holiday', 'Announcement']

export const typeBadgeColor = {
    General: 'bg-[#515DEF33] text-[#515DEF]',
    Exam: 'bg-[#9C27B033] text-[#9C27B0]',
    Event: 'bg-[#FF980033] text-[#FF9800]',
    Holiday: 'bg-[#4CAF5033] text-[#4CAF50]',
    Announcement: 'bg-[#2196F333] text-[#2196F3]',
}

const STORAGE_KEY = 'teacher-notifications'

const DEFAULT_NOTIFICATIONS = [
    {
        id: 'NTF-1001',
        notificationId: 'NTF-1001',
        type: 'General',
        title: 'Staff Meeting — Term Planning',
        message: 'All teaching staff are requested to attend the term planning meeting in the conference hall.',
        relatedDate: '12-06-2026',
        notificationDate: '05-06-2026',
        postedBy: 'Principal Office',
        isRead: false,
    },
    {
        id: 'NTF-1002',
        notificationId: 'NTF-1002',
        type: 'Exam',
        title: 'Mid Term Exam Reminder',
        message: 'Mid Term examinations begin next week. Invigilation duty charts are published on the notice board.',
        relatedDate: '15-06-2026',
        notificationDate: '08-06-2026',
        postedBy: 'Examination Cell',
        isRead: false,
    },
    {
        id: 'NTF-1003',
        notificationId: 'NTF-1003',
        type: 'Exam',
        title: 'Pre-Board Schedule Released',
        message: 'Class 10 Pre-Board timetable is now available. Teachers must complete syllabus revision before 20-06-2026.',
        relatedDate: '20-06-2026',
        notificationDate: '01-06-2026',
        postedBy: 'Examination Cell',
        isRead: true,
    },
    {
        id: 'NTF-1004',
        notificationId: 'NTF-1004',
        type: 'Event',
        title: 'Annual Day Celebration',
        message: 'Annual Day rehearsals will be held after school hours. Class teachers please coordinate student participation.',
        relatedDate: '20-12-2025',
        notificationDate: '10-06-2026',
        postedBy: 'Activities Department',
    },
    {
        id: 'NTF-1005',
        notificationId: 'NTF-1005',
        type: 'Event',
        title: 'Inter-House Sports Meet',
        message: 'Sports meet for Classes 9 and 10 on the main ground. Attendance marking will be done at the venue.',
        relatedDate: '25-06-2026',
        notificationDate: '03-06-2026',
        postedBy: 'Sports Coordinator',
    },
    {
        id: 'NTF-1006',
        notificationId: 'NTF-1006',
        type: 'Holiday',
        title: 'Pongal Holidays',
        message: 'School will remain closed for Pongal celebrations. Regular classes resume on 18-01-2026.',
        relatedDate: '14-01-2026 to 17-01-2026',
        notificationDate: '02-01-2026',
        postedBy: 'Administration',
    },
    {
        id: 'NTF-1007',
        notificationId: 'NTF-1007',
        type: 'Holiday',
        title: 'Independence Day Holiday',
        message: 'School closed on account of Independence Day. Flag hoisting ceremony at 08:00 AM for staff and selected students.',
        relatedDate: '15-08-2026',
        notificationDate: '01-08-2026',
        postedBy: 'Administration',
    },
    {
        id: 'NTF-1008',
        notificationId: 'NTF-1008',
        type: 'Announcement',
        title: 'New Library Timings',
        message: 'Library will remain open till 05:00 PM on weekdays for staff reference and student reading sessions.',
        relatedDate: '01-06-2026',
        notificationDate: '28-05-2026',
        postedBy: 'Librarian',
    },
    {
        id: 'NTF-1009',
        notificationId: 'NTF-1009',
        type: 'General',
        title: 'Parent-Teacher Meeting',
        message: 'PTM scheduled for Class 10 sections. Teachers must be available in assigned classrooms from 02:00 PM.',
        relatedDate: '18-06-2026',
        notificationDate: '06-06-2026',
        postedBy: 'Principal Office',
    },
    {
        id: 'NTF-1010',
        notificationId: 'NTF-1010',
        type: 'Announcement',
        title: 'Online Portal Maintenance',
        message: 'School ERP portal will be under maintenance on Sunday 09:00 PM to Monday 06:00 AM. Plan submissions accordingly.',
        relatedDate: '08-06-2026',
        notificationDate: '07-06-2026',
        postedBy: 'IT Department',
    },
]

export const saveNotifications = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getNotifications = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveNotifications(DEFAULT_NOTIFICATIONS)
    return DEFAULT_NOTIFICATIONS
}

export const getNotificationById = (id) =>
    getNotifications().find((item) => item.id === id || item.notificationId === id) ?? null
