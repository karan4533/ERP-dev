const STORAGE_KEY = 'schoolerp_communication_v1'

export const DIRECTORY_CONTACTS = [
    {
        id: 'EMP-TCH-014',
        name: 'Priya Menon',
        employeeId: 'EMP-TCH-014',
        role: 'Teacher',
        department: 'Mathematics',
        avatarColor: '#DB2777',
    },
    {
        id: 'EMP-PRI-001',
        name: 'School Principal',
        employeeId: 'EMP-PRI-001',
        role: 'Principal',
        department: 'Administration',
        avatarColor: '#B45309',
    },
    {
        id: 'EMP-DIR-001',
        name: 'Director Academics',
        employeeId: 'EMP-DIR-001',
        role: 'Director',
        department: 'Academics',
        avatarColor: '#0C1E5B',
    },
    {
        id: 'EMP-PRM-001',
        name: 'Front Office Officer',
        employeeId: 'EMP-PRM-001',
        role: 'PRM',
        department: 'Front Office',
        avatarColor: '#0891B2',
    },
    {
        id: 'EMP-LIB-001',
        name: 'School Librarian',
        employeeId: 'EMP-LIB-001',
        role: 'Librarian',
        department: 'Library',
        avatarColor: '#7C3AED',
    },
    {
        id: 'EMP-GK-001',
        name: 'Gate Keeper',
        employeeId: 'EMP-GK-001',
        role: 'Gate Keeper',
        department: 'Security',
        avatarColor: '#059669',
    },
    {
        id: 'EMP-GKM-001',
        name: 'Gate Keeper Manager',
        employeeId: 'EMP-GKM-001',
        role: 'Gate Keeper Manager',
        department: 'Security',
        avatarColor: '#047857',
    },
    {
        id: 'EMP-ADM-001',
        name: 'System Admin',
        employeeId: 'EMP-ADM-001',
        role: 'Administrator',
        department: 'Administration',
        avatarColor: '#515DEF',
    },
    {
        id: 'STU-2024-0142',
        name: 'Aarav Sharma',
        employeeId: 'STU-2024-0142',
        role: 'Student',
        department: 'Class 10-A',
        avatarColor: '#2563EB',
    },
    {
        id: 'EMP-TCH-022',
        name: 'Rahul Verma',
        employeeId: 'EMP-TCH-022',
        role: 'Teacher',
        department: 'Science',
        avatarColor: '#EA580C',
    },
    {
        id: 'EMP-HR-003',
        name: 'Neha Kapoor',
        employeeId: 'EMP-HR-003',
        role: 'HR Executive',
        department: 'Human Resources',
        avatarColor: '#4F46E5',
    },
]

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString()

const buildSeedConversations = (currentUserId) => {
    const others = DIRECTORY_CONTACTS.filter((c) => c.id !== currentUserId)
    const [a, b, c, d, e] = others

    return [
        {
            id: 'conv-1',
            participant: a,
            lastMessage: 'Please share the updated timetable for next week.',
            lastMessageAt: hoursAgo(0.4),
            unreadCount: 2,
            archived: false,
            deleted: false,
            messages: [
                {
                    id: 'm1-1',
                    senderId: a.id,
                    type: 'text',
                    content: 'Good morning! Could you help with the class schedule?',
                    createdAt: daysAgo(1),
                    status: 'read',
                },
                {
                    id: 'm1-2',
                    senderId: currentUserId,
                    type: 'text',
                    content: 'Sure, I will check and get back to you shortly.',
                    createdAt: daysAgo(1),
                    status: 'read',
                },
                {
                    id: 'm1-3',
                    senderId: a.id,
                    type: 'text',
                    content: 'Please share the updated timetable for next week.',
                    createdAt: hoursAgo(0.4),
                    status: 'delivered',
                },
                {
                    id: 'm1-4',
                    senderId: a.id,
                    type: 'file',
                    content: 'Draft timetable attached for review.',
                    createdAt: hoursAgo(0.35),
                    status: 'delivered',
                    attachment: {
                        name: 'Class_Timetable_Draft.pdf',
                        type: 'application/pdf',
                        size: '245 KB',
                        url: '#',
                    },
                },
            ],
        },
        {
            id: 'conv-2',
            participant: b,
            lastMessage: 'Meeting confirmed for 3:00 PM today.',
            lastMessageAt: hoursAgo(2),
            unreadCount: 0,
            archived: false,
            deleted: false,
            messages: [
                {
                    id: 'm2-1',
                    senderId: currentUserId,
                    type: 'text',
                    content: 'Are we still on for the coordination meeting?',
                    createdAt: hoursAgo(5),
                    status: 'read',
                },
                {
                    id: 'm2-2',
                    senderId: b.id,
                    type: 'text',
                    content: 'Meeting confirmed for 3:00 PM today.',
                    createdAt: hoursAgo(2),
                    status: 'read',
                },
            ],
        },
        {
            id: 'conv-3',
            participant: c,
            lastMessage: '📷 Campus event photos',
            lastMessageAt: hoursAgo(6),
            unreadCount: 1,
            archived: false,
            deleted: false,
            messages: [
                {
                    id: 'm3-1',
                    senderId: c.id,
                    type: 'text',
                    content: 'Sharing a few photos from the annual day rehearsal.',
                    createdAt: hoursAgo(7),
                    status: 'read',
                },
                {
                    id: 'm3-2',
                    senderId: c.id,
                    type: 'image',
                    content: 'Campus event photos',
                    createdAt: hoursAgo(6),
                    status: 'delivered',
                    attachment: {
                        name: 'annual_day_rehearsal.jpg',
                        type: 'image/jpeg',
                        size: '1.2 MB',
                        url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
                    },
                },
            ],
        },
        {
            id: 'conv-4',
            participant: d,
            lastMessage: 'Thanks for the quick update 👍',
            lastMessageAt: daysAgo(2),
            unreadCount: 0,
            archived: false,
            deleted: false,
            messages: [
                {
                    id: 'm4-1',
                    senderId: currentUserId,
                    type: 'text',
                    content: 'Leave request has been forwarded to the principal.',
                    createdAt: daysAgo(2),
                    status: 'read',
                },
                {
                    id: 'm4-2',
                    senderId: d.id,
                    type: 'text',
                    content: 'Thanks for the quick update 👍',
                    createdAt: daysAgo(2),
                    status: 'read',
                },
            ],
        },
        {
            id: 'conv-5',
            participant: e,
            lastMessage: 'Budget sheet for Q2 attached.',
            lastMessageAt: daysAgo(4),
            unreadCount: 0,
            archived: false,
            deleted: false,
            messages: [
                {
                    id: 'm5-1',
                    senderId: e.id,
                    type: 'file',
                    content: 'Budget sheet for Q2 attached.',
                    createdAt: daysAgo(4),
                    status: 'read',
                    attachment: {
                        name: 'Q2_Budget_Overview.xlsx',
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        size: '512 KB',
                        url: '#',
                    },
                },
            ],
        },
    ].filter((conv) => conv.participant)
}

const readStore = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch {
        return {}
    }
}

const writeStore = (store) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export const getConversationsForRole = (roleKey, currentUserId) => {
    const store = readStore()
    if (!store[roleKey]) {
        store[roleKey] = buildSeedConversations(currentUserId)
        writeStore(store)
    }
    return store[roleKey]
}

export const saveConversationsForRole = (roleKey, conversations) => {
    const store = readStore()
    store[roleKey] = conversations
    writeStore(store)
}

export const getInitials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')

export const ACCEPTED_FILE_TYPES =
    'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,audio/*,video/*'

export const getAttachmentKind = (fileType = '', fileName = '') => {
    const type = fileType.toLowerCase()
    const name = fileName.toLowerCase()
    if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) return 'image'
    if (type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/.test(name)) return 'audio'
    if (type.startsWith('video/') || /\.(mp4|webm|mov)$/.test(name)) return 'video'
    if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf'
    if (type.includes('word') || /\.(doc|docx)$/.test(name)) return 'word'
    if (type.includes('sheet') || type.includes('excel') || /\.(xls|xlsx)$/.test(name)) return 'excel'
    if (type.includes('presentation') || type.includes('powerpoint') || /\.(ppt|pptx)$/.test(name)) {
        return 'powerpoint'
    }
    return 'file'
}

export const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
