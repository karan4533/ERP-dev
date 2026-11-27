/** Matches the server allowlist for task / ticket attachments (backend/app/services/attachments.py). */
export const ATTACHMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx']
export const ATTACHMENT_ACCEPT = [
    ...ATTACHMENT_EXTENSIONS,
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',')
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

export const formatFileSize = (bytes) => {
    const size = Number(bytes) || 0
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/** '' when the file may be sent, otherwise a message for the user. The server re-checks type and size. */
export const validateUploadFile = (file, { extensions = ATTACHMENT_EXTENSIONS, maxBytes = ATTACHMENT_MAX_BYTES } = {}) => {
    if (!file) return 'Choose a file.'
    const name = String(file.name || '')
    const dot = name.lastIndexOf('.')
    const extension = dot >= 0 ? name.slice(dot).toLowerCase() : ''
    if (!extensions.includes(extension)) {
        return `${name || 'This file'}: only ${extensions.map((item) => item.slice(1).toUpperCase()).join(', ')} files are accepted.`
    }
    if (!file.size) return `${name} is empty.`
    if (file.size > maxBytes) return `${name} is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`
    return ''
}
