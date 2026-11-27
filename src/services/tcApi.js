import { apiRequest, getAccessToken, isApiTcEnabled } from './apiClient'

export const canUseTcApi = () => isApiTcEnabled() && Boolean(getAccessToken())

const enc = encodeURIComponent

export const listTcRequestsApi = () => apiRequest('/tc-requests')

export const getTcRequestApi = (ref) => apiRequest(`/tc-requests/${enc(ref)}`)

export const createTcRequestApi = (body) => apiRequest('/tc-requests', { method: 'POST', body })

export const forwardTcRequestApi = (ref, remarks) =>
    apiRequest(`/tc-requests/${enc(ref)}/forward`, { method: 'POST', body: { remarks: remarks || '' } })

export const rejectTcRequestAtPrmApi = (ref, remarks) =>
    apiRequest(`/tc-requests/${enc(ref)}/reject-prm`, { method: 'POST', body: { remarks: remarks || '' } })

export const decideTcRequestApi = (ref, decision, remarks) =>
    apiRequest(`/tc-requests/${enc(ref)}/decide`, { method: 'POST', body: { decision, remarks: remarks || '' } })

export const decideTcNocApi = (ref, decision, remarks) =>
    apiRequest(`/tc-requests/${enc(ref)}/noc`, { method: 'POST', body: { decision, remarks: remarks || '' } })

export const overrideTcNocApi = (ref, roleCode, reason) =>
    apiRequest(`/tc-requests/${enc(ref)}/noc/${enc(roleCode)}/override`, {
        method: 'POST',
        body: { reason: reason || '' },
    })
