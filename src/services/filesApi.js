import { apiRequest, getAccessToken, getApiBaseUrl } from './apiClient'

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

/**
 * If form has a new data-URL image, upload it and return file id.
 * If image cleared, return null. If already a stored file id, keep it.
 */
export const resolveProfileImageFileId = async (form, resourceType = 'profile') => {
    const dataUrl = form?.profileImage
    if (dataUrl && String(dataUrl).startsWith('data:')) {
        const asset = await uploadProfileImage(dataUrl, resourceType)
        return asset.id
    }
    if (!dataUrl) return null
    if (form?.profileImageFileId) return form.profileImageFileId
    return form?.profileImageFileId ?? null
}
