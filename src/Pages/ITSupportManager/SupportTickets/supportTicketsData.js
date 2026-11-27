import { ensureCampusSeed, saveCampusJson, hydrateCampusKey, usesCampusApiForKey } from '../../../services/campusJsonStore'
export const ISSUE_TYPES = ['Hardware', 'Software', 'Network']

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']

/** Non-Academics PDF §4.5 lifecycle (primary). Legacy Open/Pending/Closed kept for existing rows. */
export const STATUS_OPTIONS = [
    'Raised',
    'Assigned',
    'In Progress',
    'Resolved',
    'Confirmed by Requester',
    'Open',
    'Pending',
    'Closed',
]

export const PDF_TICKET_STATUSES = [
    'Raised',
    'Assigned',
    'In Progress',
    'Resolved',
    'Confirmed by Requester',
]

export const normalizeTicketStatus = (status) => {
    const value = String(status || '').trim()
    if (value === 'Open') return 'Raised'
    if (value === 'Pending') return 'Assigned'
    if (value === 'Closed') return 'Confirmed by Requester'
    return value || 'Raised'
}

export const isTicketOpenStatus = (status) => {
    const value = normalizeTicketStatus(status).toLowerCase()
    return !['resolved', 'confirmed by requester', 'closed', 'completed', 'verified'].includes(value)
}

export const priorityBadgeColor = {
    Low: 'bg-[#2196F333] text-[#2196F3]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    High: 'bg-[#FF572233] text-[#FF5722]',
    Critical: 'bg-[#FF000033] text-[#FF0000]',
}

export const statusBadgeColor = {
    Raised: 'bg-[#FF980033] text-[#FF9800]',
    Assigned: 'bg-[#9C27B033] text-[#9C27B0]',
    Open: 'bg-[#FF980033] text-[#FF9800]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#2196F333] text-[#2196F3]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
    'Confirmed by Requester': 'bg-[#4CAF5033] text-[#4CAF50]',
    Closed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

const DEFAULT_SUPPORT_TICKETS = [
    {
        ticketId: 'TKT-2026-1042',
        requesterName: 'Priya Nair',
        requesterRole: 'Teacher',
        department: 'Mathematics',
        issueType: 'Hardware',
        priority: 'High',
        assignedTo: 'Ravi Kumar',
        status: 'Open',
        createdDate: '10-06-2026',
        assetId: 'AST-2026-0125',
        subject: 'Projector not working — Room 204',
        description: 'The ceiling-mounted projector in Room 204 does not power on. Tried different power outlet and remote — no response.',
        location: 'Room 204, Academic Block',
    },
    {
        ticketId: 'TKT-2026-1041',
        requesterName: 'Arjun Sharma',
        requesterRole: 'Student',
        department: 'Class 10-A',
        issueType: 'Software',
        priority: 'Medium',
        assignedTo: 'Anita Desai',
        status: 'In Progress',
        createdDate: '09-06-2026',
        subject: 'Unable to access student portal',
        description: 'Student login shows "session expired" immediately after signing in. Cleared browser cache — issue persists.',
        location: 'Computer Lab 1',
    },
    {
        ticketId: 'TKT-2026-1038',
        requesterName: 'John Milton',
        requesterRole: 'Staff',
        department: 'Administration',
        issueType: 'Network',
        priority: 'Critical',
        assignedTo: 'Ravi Kumar',
        status: 'In Progress',
        createdDate: '09-06-2026',
        subject: 'Wi-Fi connectivity issue — Admin Block',
        description: 'Entire Admin Block lost Wi-Fi connectivity since 9:00 AM. Wired connections also intermittent on Floor 2.',
        location: 'Admin Block, Floor 2',
    },
    {
        ticketId: 'TKT-2026-1035',
        requesterName: 'Anita Verma',
        requesterRole: 'Teacher',
        department: 'Science',
        issueType: 'Hardware',
        priority: 'Low',
        assignedTo: 'Suresh Menon',
        status: 'Closed',
        createdDate: '07-06-2026',
        subject: 'Keyboard replacement — Lab PC #12',
        description: 'Several keys on keyboard not responding. Replacement completed and verified.',
        location: 'Science Lab',
    },
    {
        ticketId: 'TKT-2026-1032',
        requesterName: 'Meena Devi',
        requesterRole: 'Staff',
        department: 'Library',
        issueType: 'Software',
        priority: 'Medium',
        assignedTo: 'Anita Desai',
        status: 'Open',
        createdDate: '08-06-2026',
        subject: 'Library management software slow',
        description: 'Catalog search takes 30+ seconds to return results during peak hours.',
        location: 'Central Library',
    },
    {
        ticketId: 'TKT-2026-1028',
        requesterName: 'Rahul Verma',
        requesterRole: 'Student',
        department: 'Class 9-B',
        issueType: 'Network',
        priority: 'Low',
        assignedTo: 'Suresh Menon',
        status: 'Closed',
        createdDate: '05-06-2026',
        subject: 'Hostel Wi-Fi password reset',
        description: 'Student requested hostel Wi-Fi credentials reset after device change.',
        location: 'Boys Hostel Block A',
    },
    {
        ticketId: 'TKT-2026-1019',
        assetId: 'AST-2026-0142',
        requesterName: 'Priya Nair',
        requesterRole: 'Teacher',
        department: 'Mathematics',
        issueType: 'Hardware',
        priority: 'Medium',
        assignedTo: 'Ravi Kumar',
        status: 'Resolved',
        createdDate: '18-03-2026',
        updatedDate: '19-03-2026',
        subject: 'Laptop battery drains quickly',
        description: 'Staff laptop battery lasts under one hour.',
        location: 'Mathematics staff room',
    },
    {
        ticketId: 'TKT-2026-1008',
        assetId: 'AST-2026-0142',
        requesterName: 'Priya Nair',
        requesterRole: 'Teacher',
        department: 'Mathematics',
        issueType: 'Hardware',
        priority: 'Low',
        assignedTo: 'Anita Desai',
        status: 'Closed',
        createdDate: '02-06-2026',
        updatedDate: '02-06-2026',
        subject: 'Laptop keyboard sticky keys',
        description: 'Keys stick after classroom dust.',
        location: 'Mathematics staff room',
    },
]

export const getTicketsForAsset = (assetId) =>
    SUPPORT_TICKETS.filter((ticket) => ticket.assetId && ticket.assetId === assetId)

export const getTicketById = (id) =>
    SUPPORT_TICKETS.find((entry) => entry.ticketId === id)

export const SUPPORT_TICKETS_STORAGE_KEY = 'schoolerp-it-tickets-v1'
export function getSupportTickets() {
    return ensureCampusSeed('schoolerp-it-tickets-v1', DEFAULT_SUPPORT_TICKETS)
}
export function saveSupportTickets(rows) {
    return saveCampusJson('schoolerp-it-tickets-v1', rows)
}
export function hydrateSupportTicketsFromApi() {
    if (!usesCampusApiForKey('schoolerp-it-tickets-v1')) return Promise.resolve(false)
    return hydrateCampusKey('schoolerp-it-tickets-v1', DEFAULT_SUPPORT_TICKETS)
}
export const SUPPORT_TICKETS = DEFAULT_SUPPORT_TICKETS

