/**
 * Tickets (multi-department) — canonical contract shared with backend raise_ticket().
 *
 * Raise request (POST /ops/it-support-tickets/raise):
 *   { subject*, description*, department, issueType, priority, assetId, attachmentName }
 *   The server also accepts legacy aliases (title / ticketTitle -> subject, category -> issueType) and
 *   ignores any client id (ticketId / ticketNumber / id), requester fields, status and assignment.
 *
 * Ticket (every API response):
 *   { id === ticketId ("TKT-<year>-<serial>", server-generated), subject, description, department, location,
 *     issueType, priority, status, assignedTo (display label), assignees [{ userId, email, name, role }],
 *     assigneeUserIds [userId], requesterUserId, requesterEmail, requesterName, requesterRole, raisedVia,
 *     createdDate, createdAt, remarks, assetId, attachmentName, outsideService, printerMaintenance,
 *     history [{ at, event, note, byUserId?, byEmail? }] (append-only) }
 *
 * Assignment: POST /ops/it-support-tickets/{id}/assign { assignees: [userId | email], note }
 *   (IT / admins / owning department head; assignees must be members of the ticket's department).
 * Status: POST /ops/it-support-tickets/{id}/status { status, remarks? } (IT, owning department or assignee).
 */
import { SUPPORT_TICKETS } from '../../Pages/ITSupportManager/SupportTickets/supportTicketsData'
import { hydrateCampusKey, usesCampusApiForKey } from '../../services/campusJsonStore'
import {
    assignItTicketApi,
    listAssignedItTicketsApi,
    listItTicketAssignableApi,
    listMyItTicketsApi,
    raiseItTicketApi,
    stripOpsMeta,
    upsertOpsItemApi,
} from '../../services/opsApi'
import { ensureSeed, loadJson, nextSerial, saveJson } from './storage'
import { logActivity } from './activityLog'

const TICKET_ALIASES = { title: 'subject', ticketTitle: 'subject', ticketNumber: 'ticketId', category: 'issueType' }

/** Canonical ticket shape for rows from any source (API, demo seed, older local data). */
export function normalizeTicket(row) {
    if (!row || typeof row !== 'object') return row
    const ticket = { ...row }
    Object.entries(TICKET_ALIASES).forEach(([alias, field]) => {
        if (alias in ticket) {
            if (ticket[field] === undefined || ticket[field] === '') ticket[field] = ticket[alias]
            delete ticket[alias]
        }
    })
    if (!ticket.ticketId && ticket.id) ticket.ticketId = ticket.id
    ticket.assignees = Array.isArray(ticket.assignees) ? ticket.assignees : []
    ticket.assigneeUserIds = ticket.assignees.map((entry) => String(entry?.userId || '')).filter(Boolean)
    ticket.history = Array.isArray(ticket.history) ? ticket.history : []
    return ticket
}

/** Must match campusCollectionRegistry → it-support-tickets */
export const IT_TICKETS_KEY = 'schoolerp-it-tickets-v1'
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

const seedForApi = () => (usesCampusApiForKey(IT_TICKETS_KEY) ? [] : seedTickets())

export function getTickets() {
    const rows = ensureSeed(IT_TICKETS_KEY, seedForApi())
    return Array.isArray(rows) ? rows.map(normalizeTicket) : []
}

export function hydrateTicketsFromApi() {
    if (!usesCampusApiForKey(IT_TICKETS_KEY)) return Promise.resolve(false)
    return hydrateCampusKey(IT_TICKETS_KEY, [])
}

export function getTicketById(id) {
    return getTickets().find((ticket) => ticket.ticketId === id) ?? null
}

export function saveTickets(tickets) {
    saveJson(IT_TICKETS_KEY, tickets)
    notify()
}

/** Local demo mode only (no server): the id is numbered from the local list. API mode never calls this. */
export function createTicket(input) {
    const tickets = getTickets()
    const ticketId = nextSerial(`TKT-${new Date().getFullYear()}-`, tickets, 'ticketId')
    const ticket = {
        id: ticketId,
        ticketId,
        requesterName: input.requesterName,
        requesterRole: input.requesterRole,
        requesterEmail: input.requesterEmail || '',
        department: input.department,
        issueType: input.issueType || 'Hardware',
        priority: input.priority || 'Medium',
        assignedTo: `${input.department || 'General'} Queue`,
        assignees: [],
        assigneeUserIds: [],
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

/**
 * Update one ticket. Server mode saves only this ticket (department inboxes may not bulk-save);
 * resolves to { success, ticket, message } and reports success only after the server accepts it.
 */
export async function updateTicket(ticketId, patch, actor = 'IT Support Manager') {
    const tickets = getTickets()
    const current = tickets.find((ticket) => ticket.ticketId === ticketId)
    if (!current) return { success: false, message: 'Ticket not found.' }
    const history = [...(current.history || [])]
    if (patch.status && patch.status !== current.status) {
        const closedLike = ['Closed', 'Confirmed by Requester'].includes(patch.status)
        history.push({
            at: new Date().toISOString(),
            event: closedLike ? patch.status : 'Status Change',
            note: `Status ${current.status} → ${patch.status}`,
        })
    }
    if (patch.assignedTo && patch.assignedTo !== current.assignedTo && !current.assignees?.length) {
        history.push({
            at: new Date().toISOString(),
            event: 'Assigned',
            note: `Assigned to ${patch.assignedTo}`,
        })
    }
    if (patch.remarks && patch.remarks !== current.remarks) {
        history.push({ at: new Date().toISOString(), event: 'Remarks', note: patch.remarks })
    }
    if (patch.requesterConfirmed && !current.requesterConfirmed) {
        history.push({
            at: new Date().toISOString(),
            event: 'Confirmed by Requester',
            note: patch.confirmationNote || 'Requester confirmed resolution',
        })
    }
    const updated = { ...current, ...patch, history }
    if (usesCampusApiForKey(IT_TICKETS_KEY)) {
        try {
            const body = stripOpsMeta(updated)
            // Assignment is changed only through assignTicket(); the server ignores these on a record save.
            delete body.assignees
            delete body.assigneeUserIds
            if (current.assignees?.length) body.assignedTo = current.assignedTo
            const saved = normalizeTicket(stripOpsMeta(await upsertOpsItemApi('it-support-tickets', ticketId, body)))
            await hydrateTicketsFromApi()
            notify()
            return { success: true, ticket: saved }
        } catch (error) {
            return { success: false, message: error?.message || 'The ticket could not be updated.' }
        }
    }
    const next = tickets.map((ticket) => (ticket.ticketId === ticketId ? updated : ticket))
    saveTickets(next)
    logActivity({
        actor,
        action: 'STATUS_CHANGE',
        module: 'IT Tickets',
        recordId: ticketId,
        before: { status: current.status, remarks: current.remarks, assignedTo: current.assignedTo },
        after: {
            status: patch.status ?? current.status,
            remarks: patch.remarks ?? current.remarks,
            assignedTo: patch.assignedTo ?? current.assignedTo,
        },
    })
    return { success: true, ticket: updated }
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

/**
 * Staff self-service: create a ticket (API when campus store is live, else local demo list).
 * API mode sends only the canonical request fields; the server sets id, requester, status and queue.
 */
export async function raiseTicket(input) {
    if (usesCampusApiForKey(IT_TICKETS_KEY)) {
        const row = normalizeTicket(stripOpsMeta(await raiseItTicketApi({
            subject: input.subject ?? input.title,
            description: input.description,
            issueType: input.issueType || input.category || 'Hardware',
            priority: input.priority || 'Medium',
            department: input.department || 'General',
            assetId: input.assetId || '',
            attachmentName: input.attachmentName || '',
        })))
        await hydrateTicketsFromApi()
        notify()
        return row
    }
    return createTicket(input)
}

/** Members of the ticket's department who can be assigned (API mode only; 403 if you may not assign). */
export async function listAssignableUsers(ticketId) {
    if (!usesCampusApiForKey(IT_TICKETS_KEY)) return []
    const rows = await listItTicketAssignableApi(ticketId)
    return Array.isArray(rows) ? rows : []
}

/**
 * Set a ticket's assignees (user ids or emails). Resolves to { success, ticket, message };
 * success only after the server saves it.
 */
export async function assignTicket(ticketId, assignees, note = '') {
    if (!usesCampusApiForKey(IT_TICKETS_KEY)) {
        return { success: false, message: 'Assigning to named staff needs the live server.' }
    }
    try {
        const saved = normalizeTicket(stripOpsMeta(await assignItTicketApi(ticketId, assignees, note)))
        await hydrateTicketsFromApi()
        notify()
        return { success: true, ticket: saved }
    } catch (error) {
        return { success: false, message: error?.message || 'The assignment could not be saved.' }
    }
}

/** Tickets currently assigned to the signed-in user (API mode only). */
export async function listAssignedTickets() {
    if (!usesCampusApiForKey(IT_TICKETS_KEY)) return []
    const rows = await listAssignedItTicketsApi()
    return (Array.isArray(rows) ? rows : []).map((row) => normalizeTicket(stripOpsMeta(row)))
}

/** Tickets raised by the signed-in user (API) or matching requester email/name (demo). */
export async function listMyTickets({ email, name } = {}) {
    if (usesCampusApiForKey(IT_TICKETS_KEY)) {
        const rows = await listMyItTicketsApi()
        return (Array.isArray(rows) ? rows : []).map((row) => normalizeTicket(stripOpsMeta(row)))
    }
    const needleEmail = String(email || '').trim().toLowerCase()
    const needleName = String(name || '').trim().toLowerCase()
    return getTickets().filter((ticket) => {
        const ticketEmail = String(ticket.requesterEmail || '').trim().toLowerCase()
        const ticketName = String(ticket.requesterName || '').trim().toLowerCase()
        if (needleEmail && ticketEmail === needleEmail) return true
        if (needleName && ticketName === needleName) return true
        return false
    })
}
