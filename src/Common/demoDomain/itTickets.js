import { SUPPORT_TICKETS } from '../../Pages/ITSupportManager/SupportTickets/supportTicketsData'
import { ensureSeed, loadJson, nextSerial, saveJson } from './storage'
import { logActivity } from './activityLog'

export const IT_TICKETS_KEY = 'schoolerp-it-support-tickets-v1'
export const TICKETS_UPDATED_EVENT = 'schoolerp-it-tickets-updated'

const notify = () => {
    window.dispatchEvent(new Event(TICKETS_UPDATED_EVENT))
}

function seedTickets() {
    return SUPPORT_TICKETS.map((ticket) => ({
        ...ticket,
        remarks: ticket.remarks || '',
        assetId: ticket.assetId || '',
        attachmentName: ticket.attachmentName || '',
        history: [
            { at: ticket.createdDate, event: 'Created', note: 'Ticket raised' },
            ...(ticket.assignedTo ? [{ at: ticket.createdDate, event: 'Assigned', note: `Assigned to ${ticket.assignedTo}` }] : []),
            ...(ticket.status === 'Closed' ? [{ at: ticket.createdDate, event: 'Closed', note: 'Closed in seed data' }] : []),
        ],
    }))
}

export function getTickets() {
    return ensureSeed(IT_TICKETS_KEY, seedTickets())
}

export function getTicketById(id) {
    return getTickets().find((ticket) => ticket.ticketId === id) ?? null
}

export function saveTickets(tickets) {
    saveJson(IT_TICKETS_KEY, tickets)
    notify()
}

export function createTicket(input) {
    const tickets = getTickets()
    const ticket = {
        ticketId: nextSerial('TKT-2026-', tickets, 'ticketId'),
        requesterName: input.requesterName,
        requesterRole: input.requesterRole,
        department: input.department,
        issueType: input.issueType || 'Hardware',
        priority: input.priority || 'Medium',
        assignedTo: 'IT Queue',
        status: 'Open',
        createdDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        subject: input.subject,
        description: input.description,
        location: input.department,
        remarks: '',
        assetId: input.assetId || '',
        attachmentName: input.attachmentName || '',
        outsideService: Boolean(input.outsideService),
        printerMaintenance: Boolean(input.printerMaintenance),
        history: [{ at: new Date().toISOString(), event: 'Created', note: input.subject }],
    }
    saveTickets([ticket, ...tickets])
    logActivity({
        actor: input.requesterName,
        role: input.requesterRole,
        action: 'CREATE',
        module: 'IT Tickets',
        recordId: ticket.ticketId,
        details: ticket.subject,
    })
    return ticket
}

export function updateTicket(ticketId, patch, actor = 'IT Support Manager') {
    const tickets = getTickets()
    const current = tickets.find((ticket) => ticket.ticketId === ticketId)
    if (!current) return null
    const history = [...(current.history || [])]
    if (patch.status && patch.status !== current.status) {
        history.push({ at: new Date().toISOString(), event: patch.status === 'Closed' ? 'Closed' : 'Updated', note: `Status ${current.status} → ${patch.status}` })
    }
    if (patch.remarks && patch.remarks !== current.remarks) {
        history.push({ at: new Date().toISOString(), event: 'Remarks', note: patch.remarks })
    }
    const next = tickets.map((ticket) => (
        ticket.ticketId === ticketId ? { ...ticket, ...patch, history } : ticket
    ))
    saveTickets(next)
    logActivity({
        actor,
        action: 'STATUS_CHANGE',
        module: 'IT Tickets',
        recordId: ticketId,
        before: { status: current.status, remarks: current.remarks },
        after: { status: patch.status ?? current.status, remarks: patch.remarks ?? current.remarks },
    })
    return next.find((ticket) => ticket.ticketId === ticketId)
}

export function ticketCounts() {
    const tickets = getTickets()
    return {
        open: tickets.filter((ticket) => ticket.status === 'Open').length,
        pending: tickets.filter((ticket) => ticket.status === 'Pending' || ticket.status === 'In Progress').length,
        resolved: tickets.filter((ticket) => ticket.status === 'Resolved' || ticket.status === 'Closed').length,
        critical: tickets.filter((ticket) => ticket.priority === 'Critical' && ticket.status !== 'Closed').length,
        total: tickets.length,
    }
}

export function readTicketsSafe() {
    const stored = loadJson(IT_TICKETS_KEY, null)
    return Array.isArray(stored) ? stored : getTickets()
}
