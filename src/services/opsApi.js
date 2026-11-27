import { apiRequest, getAccessToken, isApiAuthEnabled } from './apiClient'

export const isApiOpsEnabled = () => {
    const explicit = import.meta.env.VITE_USE_API_OPS
    if (explicit !== undefined && explicit !== '') return String(explicit) === 'true'
    return isApiAuthEnabled()
}

export const canUseOpsApi = () => isApiOpsEnabled() && Boolean(getAccessToken())

const enc = encodeURIComponent

/** Collections that reject whole-list PUT — save via upsertOpsItemApi instead. */
export const OPS_ITEM_UPSERT_COLLECTIONS = new Set([
    'som-matrix',
    'som-config',
    'security-cameras',
    'gate-visitors',
    'gate-registers',
    'gate-handover',
    'gate-vendors',
    'gate-incidents',
    'gate-duty-assignments',
    'stationery-requests',
])

export const listOpsCollectionApi = (collection) => apiRequest(`/ops/${enc(collection)}`)

/** Save one record of an item-saved collection (e.g. som-matrix) without replacing the rest. */
export const upsertOpsItemApi = (collection, itemId, body) =>
    apiRequest(`/ops/${enc(collection)}/items/${enc(itemId)}`, { method: 'PUT', body })

/** Any signed-in user raises one IT ticket; the server numbers it and records the requester. */
export const raiseItTicketApi = (body) =>
    apiRequest('/ops/it-support-tickets/raise', { method: 'POST', body })

/** IT tickets raised by the signed-in user. */
export const listMyItTicketsApi = () => apiRequest('/ops/it-support-tickets/mine')

/** Tickets currently assigned to the signed-in user. */
export const listAssignedItTicketsApi = () => apiRequest('/ops/it-support-tickets/assigned')

/** Department members a ticket can be assigned to (IT / admins / department head only). */
export const listItTicketAssignableApi = (ticketId) =>
    apiRequest(`/ops/it-support-tickets/${enc(ticketId)}/assignable`)

/** Replace a ticket's assignees (user ids or emails of department members); [] returns it to the queue. */
export const assignItTicketApi = (ticketId, assignees, note = '') =>
    apiRequest(`/ops/it-support-tickets/${enc(ticketId)}/assign`, { method: 'POST', body: { assignees, note } })

/** Change a ticket's status (and optionally remarks): IT, the owning department, or an assignee. */
export const updateItTicketStatusApi = (ticketId, body) =>
    apiRequest(`/ops/it-support-tickets/${enc(ticketId)}/status`, { method: 'POST', body })

export const replaceOpsCollectionApi = (collection, items) =>
    apiRequest(`/ops/${enc(collection)}`, { method: 'PUT', body: items })

/** Atomic stationery issue/return with inventory update. */
export const stationeryIssueReturnApi = (body) =>
    apiRequest('/ops/stationery/issue-return', { method: 'POST', body })

/** Library loans: the server checks availability and the borrower limit and updates book, member and loan together. */
export const issueLibraryBookApi = (body) => apiRequest('/library/issues', { method: 'POST', body })
export const returnLibraryBookApi = (issueId) => apiRequest(`/library/issues/${enc(issueId)}/return`, { method: 'POST' })

/** Raise a store product request; the server assigns the request number (idempotent via clientRequestId). */
export const createStationeryRequestApi = (body) =>
    apiRequest('/ops/stationery/requests', { method: 'POST', body })

export const stationeryDecideRequestApi = (requestId, body) =>
    apiRequest(`/ops/stationery/requests/${enc(requestId)}/decide`, { method: 'POST', body })

export const stationeryDecideProcurementApi = (procurementId, body) =>
    apiRequest(`/ops/stationery/procurement/${enc(procurementId)}/decide`, { method: 'POST', body })

export const stationeryReceiveGoodsApi = (procurementId, body) =>
    apiRequest(`/ops/stationery/procurement/${enc(procurementId)}/receive-goods`, { method: 'POST', body })

export const stripOpsMeta = (row) => {
    if (!row || typeof row !== 'object') return row
    const next = { ...row }
    delete next._collection
    delete next._updatedAt
    delete next._createdAt
    return next
}
