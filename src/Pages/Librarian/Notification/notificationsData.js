export const NOTIFICATION_TYPES = ['Reminder', 'Due Date', 'Return', 'General']

export const typeBadgeColor = {
    Reminder: 'bg-[#515DEF33] text-[#515DEF]',
    'Due Date': 'bg-[#FF980033] text-[#FF9800]',
    Return: 'bg-[#4CAF5033] text-[#4CAF50]',
    General: 'bg-[#2196F333] text-[#2196F3]',
}

export const LIBRARIAN_NOTIFICATIONS = [
    {
        id: 'LIB-NTF-001',
        type: 'Reminder',
        title: 'Classical Dance — Annual Day Rehearsal',
        message: 'Traditional dance performance rehearsal for Annual Day. All participating students must report in costume.',
        relatedDate: '15-08-2025',
        notificationDate: '10-08-2025',
        postedBy: 'Ms. Priya',
        isRead: false,
        meta: 'Annual Day · School Auditorium · 09:00 AM – 12:00 PM',
    },
    {
        id: 'LIB-NTF-002',
        type: 'Due Date',
        title: 'Book Return Reminder — Science Reference',
        message: 'The borrowed science reference books are due for return by 20-08-2025. Late returns may incur a fine.',
        relatedDate: '20-08-2025',
        notificationDate: '12-08-2025',
        postedBy: 'Library Desk',
        isRead: true,
        meta: 'Due Date · Class 10 Section A',
    },
    {
        id: 'LIB-NTF-003',
        type: 'Return',
        title: 'Overdue Books Follow-up',
        message: 'Three students have overdue library books from the previous term. Class teachers are requested to follow up.',
        relatedDate: '18-08-2025',
        notificationDate: '08-08-2025',
        postedBy: 'Library Desk',
        isRead: false,
        meta: 'Overdue · 3 Students',
    },
    {
        id: 'LIB-NTF-004',
        type: 'General',
        title: 'New Arrivals — Fiction Section',
        message: 'New fiction titles have been added to the junior library section. Teachers may recommend titles to students.',
        relatedDate: '01-08-2025',
        notificationDate: '01-08-2025',
        postedBy: 'Librarian',
        isRead: true,
        meta: 'Library Update · Fiction',
    },
]
