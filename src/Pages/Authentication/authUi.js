export const normalizeOtp = (value = '') => String(value).replace(/\D/g, '').slice(0, 6)

export const isOtpComplete = (value = '') => /^\d{6}$/.test(String(value))

export const getSafeReturnPath = ({ requestedPath, role, homePath }) => {
    if (!requestedPath || typeof requestedPath !== 'string' || !requestedPath.startsWith('/') || requestedPath.startsWith('//')) {
        return homePath
    }
    const homePrefix = `/${String(homePath || '').split('/').filter(Boolean)[0] || role || ''}`
    const pathname = requestedPath.split(/[?#]/, 1)[0]
    if (pathname === homePrefix || pathname.startsWith(`${homePrefix}/`)) return requestedPath
    return homePath
}
