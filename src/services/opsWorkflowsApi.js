import { apiRequest } from './apiClient'

const enc = encodeURIComponent

/** Lost & Found register: { items, permissions } for the signed-in role. */
export const listLostFoundApi = () => apiRequest('/ops/lost-found')

/** Record a found item; the server assigns LF-<year>-<serial> and the recorder identity. */
export const createLostFoundApi = (body) => apiRequest('/ops/lost-found', { method: 'POST', body })

export const claimLostFoundApi = (itemId, body) =>
    apiRequest(`/ops/lost-found/${enc(itemId)}/claim`, { method: 'POST', body })

export const handoverLostFoundApi = (itemId, body) =>
    apiRequest(`/ops/lost-found/${enc(itemId)}/handover`, { method: 'POST', body })

export const requestLostFoundDisposalApi = (itemId, body) =>
    apiRequest(`/ops/lost-found/${enc(itemId)}/disposal-request`, { method: 'POST', body })

export const decideLostFoundDisposalApi = (itemId, body) =>
    apiRequest(`/ops/lost-found/${enc(itemId)}/disposal-decision`, { method: 'POST', body })

/** Transport Manager (first) / Principal (final) decision; the server also updates the driver's request. */
export const decideTransportApprovalApi = (requestId, body) =>
    apiRequest(`/ops/transport-approval-requests/${enc(requestId)}/decide`, { method: 'POST', body })

/** Joint Director inbox of Housekeeping / IT / Canteen requests: { items, canDecide }. */
export const listDepartmentRequestsApi = () => apiRequest('/ops/department-requests')

export const decideDepartmentRequestApi = (collection, requestId, body) =>
    apiRequest(`/ops/department-requests/${enc(collection)}/${enc(requestId)}/decide`, { method: 'POST', body })
