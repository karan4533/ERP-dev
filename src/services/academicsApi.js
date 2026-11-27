import { apiRequest, getAccessToken, isApiAuthEnabled } from './apiClient'

export const isApiAcademicsEnabled = () => {
    const explicit = import.meta.env.VITE_USE_API_ACADEMICS
    if (explicit !== undefined && explicit !== '') return String(explicit) === 'true'
    return isApiAuthEnabled()
}

export const canUseAcademicsApi = () => isApiAcademicsEnabled() && Boolean(getAccessToken())

const enc = encodeURIComponent

export const listAcademicsCollectionApi = (collection) =>
    apiRequest(`/academics/${enc(collection)}`)

export const replaceAcademicsCollectionApi = (collection, items) =>
    apiRequest(`/academics/${enc(collection)}`, { method: 'PUT', body: items })

/** PATCH one record (currently extra-classes only). Returns the saved server row. */
export const updateAcademicsRecordApi = (collection, id, patch) =>
    apiRequest(`/academics/${enc(collection)}/${enc(id)}`, { method: 'PATCH', body: patch })

/** DELETE one record (class-timetables / extra-classes); server enforces role + scope and audits. */
export const deleteAcademicsRecordApi = (collection, id) =>
    apiRequest(`/academics/${enc(collection)}/${enc(id)}`, { method: 'DELETE' })

/** Drop server bookkeeping keys before persisting in memory / re-PUT. */
export const stripAcademicsMeta = (row) => {
    if (!row || typeof row !== 'object') return row
    const next = { ...row }
    delete next._collection
    delete next._updatedAt
    delete next._createdAt
    return next
}
