export const SUPPORTED_ATTACHMENT_TYPES = Object.freeze([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
])

export const MAX_ATTACHMENT_SIZE_MB = 5

export const validateAttachment = (file) => {
    if (!file || !SUPPORTED_ATTACHMENT_TYPES.includes(file.type)) {
        return { valid: false, error: 'Choose a PDF, JPG or PNG file.' }
    }
    if (file.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
        return { valid: false, error: `Choose a file no larger than ${MAX_ATTACHMENT_SIZE_MB} MB.` }
    }
    return { valid: true, error: '' }
}

