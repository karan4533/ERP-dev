/** Dial string from a saved contact. Empty when the value is missing or too short to be a phone number. */
export const normalizeDialNumber = (raw) => {
    const trimmed = String(raw || '').trim()
    if (!trimmed) return ''
    const compact = trimmed.replace(/[^\d+]/g, '')
    if (!compact) return ''
    const digits = compact.replace(/\D/g, '')
    if (digits.length < 8) return ''
    if (compact.startsWith('+')) return `+${digits}`
    if (digits.length === 10) return `+91${digits}`
    if (digits.startsWith('91') && digits.length >= 12) return `+${digits}`
    return `+${digits}`
}

export const canCallDriver = (raw) => Boolean(normalizeDialNumber(raw))
