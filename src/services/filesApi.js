import {
    ApiError,
    SESSION_EXPIRED_EVENT,
    SESSION_NOTICE_KEY,
    apiRequest,
    clearAccessToken,
    getAccessToken,
    getApiBaseUrl,
} from './apiClient'

/** Build an <img src> URL that works with JWT (query token). */
export const fileDownloadUrl = (downloadPath) => {
    if (!downloadPath) return ''
    if (String(downloadPath).startsWith('data:')) return downloadPath
    const origin = getApiBaseUrl().replace(/\/api\/v1\/?$/, '')
    const absolute = String(downloadPath).startsWith('http')
        ? String(downloadPath)
        : `${origin}${downloadPath.startsWith('/') ? '' : '/'}${downloadPath}`
    const token = getAccessToken()
    if (!token) return absolute
    const join = absolute.includes('?') ? '&' : '?'
    return `${absolute}${join}token=${encodeURIComponent(token)}`
}

const dataUrlToFile = async (dataUrl, filename = 'profile.png') => {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const ext = (blob.type || '').split('/')[1] || 'png'
    const safeName = filename.includes('.') ? filename : `profile.${ext}`
    return new File([blob], safeName, { type: blob.type || 'image/png' })
}

/** Upload a browser File or data-URL string; returns FileAssetPublic. */
export const uploadProfileImage = async (fileOrDataUrl, resourceType = 'profile', resourceId = null) => {
    let file = fileOrDataUrl
    if (typeof fileOrDataUrl === 'string') {
        if (!fileOrDataUrl.startsWith('data:')) {
            throw new Error('Invalid image payload')
        }
        file = await dataUrlToFile(fileOrDataUrl)
    }
    const body = new FormData()
    body.append('file', file)
    body.append('resource_type', resourceType)
    if (resourceId != null) body.append('resource_id', String(resourceId))

    return apiRequest('/files', {
        method: 'POST',
        body,
        formData: true,
    })
}

const xhrErrorMessage = (xhr) => {
    try {
        const data = JSON.parse(xhr.responseText || '{}')
        if (typeof data?.detail === 'string') return data.detail
        if (data?.detail?.message) return data.detail.message
        if (Array.isArray(data?.detail)) return data.detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
        return data?.message || `Upload failed (${xhr.status})`
    } catch {
        return `Upload failed (${xhr.status})`
    }
}

/**
 * POST /files with upload progress (fetch cannot report it). Resolves to FileAssetPublic only after the
 * server has stored the file; rejects with ApiError (server refusal) or Error (network failure).
 */
export const uploadFileWithProgress = (file, { resourceType, resourceId = null, onProgress } = {}) =>
    new Promise((resolve, reject) => {
        const body = new FormData()
        body.append('file', file)
        body.append('resource_type', resourceType)
        if (resourceId != null) body.append('resource_id', String(resourceId))
        const token = getAccessToken()
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${getApiBaseUrl()}/files`)
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100))
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText))
                } catch {
                    reject(new Error('The server response could not be read.'))
                }
                return
            }
            if (xhr.status === 401 && token) {
                clearAccessToken()
                sessionStorage.setItem(SESSION_NOTICE_KEY, 'Your session has expired. Please sign in again.')
                window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
            }
            reject(new ApiError(xhrErrorMessage(xhr), xhr.status))
        }
        xhr.onerror = () => reject(new Error('Could not reach the server. Please try again.'))
        xhr.send(body)
    })

/** Files attached to one task ('task-attachment') or ticket ('it-ticket-attachment'). */
export const listAttachedFilesApi = (resourceType, resourceId) =>
    apiRequest(
        `/files/attached?resource_type=${encodeURIComponent(resourceType)}&resource_id=${encodeURIComponent(resourceId)}`,
    )

/** File Management (Admin): every campus file, with whether it may be deleted. */
export const listFilesApi = (params = {}) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.kind) qs.set('kind', params.kind)
    const suffix = qs.toString() ? `?${qs}` : ''
    return apiRequest(`/files${suffix}`)
}

export const uploadLibraryFileApi = (file) => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest('/files/library', { method: 'POST', body, formData: true })
}

export const deleteFileApi = (fileId) => apiRequest(`/files/${fileId}`, { method: 'DELETE' })

/**
 * If form has a new data-URL image, upload it and return file id.
 * If image cleared, return null. If already a stored file id, keep it.
 */
export const resolveProfileImageFileId = async (form, resourceType = 'profile') => {
    // Prefer an id already confirmed by POST /files (FO ProfileUpload API mode).
    if (form?.profileImageFileId) return form.profileImageFileId
    const dataUrl = form?.profileImage
    if (dataUrl && String(dataUrl).startsWith('data:')) {
        const asset = await uploadProfileImage(dataUrl, resourceType)
        return asset.id
    }
    if (!dataUrl) return null
    return form?.profileImageFileId ?? null
}
