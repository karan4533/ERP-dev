/**
 * True when pathname is exactly `base` or a nested path under `base/`.
 * Avoids false positives like `startsWith('/pro')` matching `/process-auditor`.
 */
export const isPathUnder = (pathname = '', base = '') => {
    const path = String(pathname || '')
    const root = String(base || '')
    if (!root) return false
    return path === root || path.startsWith(`${root}/`)
}
