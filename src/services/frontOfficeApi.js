import { apiRequest, getAccessToken, isApiAuthEnabled } from './apiClient'

export const isApiFrontOfficeEnabled = () => {
    const explicit = import.meta.env.VITE_USE_API_FRONT_OFFICE
    if (explicit !== undefined && explicit !== '') return String(explicit) === 'true'
    return isApiAuthEnabled()
}

export const canUseFrontOfficeApi = () => isApiFrontOfficeEnabled() && Boolean(getAccessToken())

const enc = encodeURIComponent

export const listFrontOfficeRecordsApi = (collection) =>
    apiRequest(`/front-office/${enc(collection)}`)

export const getFrontOfficeRecordApi = (collection, id) =>
    apiRequest(`/front-office/${enc(collection)}/${enc(id)}`)

export const createFrontOfficeRecordApi = (collection, body) =>
    apiRequest(`/front-office/${enc(collection)}`, { method: 'POST', body })

export const updateFrontOfficeRecordApi = (collection, id, body) =>
    apiRequest(`/front-office/${enc(collection)}/${enc(id)}`, { method: 'PUT', body })

export const deleteFrontOfficeRecordApi = (collection, id) =>
    apiRequest(`/front-office/${enc(collection)}/${enc(id)}`, { method: 'DELETE' })

/** Parent / Principal approval decision — only approval fields change on the server. */
export const decideFrontOfficeRecordApi = (collection, id, { decision, remark = '' }) =>
    apiRequest(`/front-office/${enc(collection)}/${enc(id)}/decision`, {
        method: 'POST',
        body: { decision, remark },
    })

/** Hostel outing passes for the signed-in parent's linked children. */
export const listParentHostelGatePassesApi = () => apiRequest('/front-office/parent/hostel-gate-passes')
