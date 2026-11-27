import { apiRequest } from './apiClient'
import { uploadProfileImage } from './filesApi'

const enc = encodeURIComponent

/** Observations assigned to the signed-in department head (both streams unless `stream` is set). */
export const listAssignedAuditObservationsApi = (stream = '') =>
    apiRequest(`/campus-audit/assigned/observations${stream ? `?stream=${enc(stream)}` : ''}`)

/** Department head submits the corrective action (ATR) for one assigned observation. */
export const submitAuditCorrectiveActionApi = (stream, observationId, body) =>
    apiRequest(`/campus-audit/assigned/${enc(stream)}/observations/${enc(observationId)}/corrective-action`, {
        method: 'POST',
        body,
    })

/**
 * Upload one audit evidence file. `kind` is 'audit' (auditor evidence) or 'atr' (department
 * corrective-action evidence, `resourceId` = observation id). Returns { fileId, name, downloadPath, ... }.
 */
export const uploadAuditEvidenceApi = async (file, { stream, kind = 'audit', resourceId = null }) => {
    const resourceType = `${String(stream || '').toLowerCase()}-${kind === 'atr' ? 'atr' : 'audit'}-evidence`
    const asset = await uploadProfileImage(file, resourceType, resourceId)
    if (!asset?.id) throw new Error('Upload did not return a file id.')
    return {
        fileId: asset.id,
        name: asset.original_name || file.name,
        mimeType: asset.content_type || file.type || '',
        size: asset.size_bytes ?? file.size,
        downloadPath: asset.download_url || `/api/v1/files/${asset.id}/download`,
    }
}
