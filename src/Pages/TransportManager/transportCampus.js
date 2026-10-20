import {
    getCampusMemory,
    ensureCampusSeed,
    hydrateCampusKey,
    usesCampusApiForKey,
    persistCampusJson,
} from '../../services/campusJsonStore'

/**
 * Transport collections: in API mode never inject demo seed into memory or the DB.
 * Offline/localStorage still uses ensureCampusSeed for first-run UX.
 */
export function getTransportRows(storageKey, offlineSeed = []) {
    if (usesCampusApiForKey(storageKey)) {
        return getCampusMemory(storageKey) ?? []
    }
    return ensureCampusSeed(storageKey, offlineSeed)
}

export function hydrateTransportRows(storageKey) {
    if (!usesCampusApiForKey(storageKey)) return Promise.resolve(false)
    return hydrateCampusKey(storageKey, [])
}

export function saveTransportRows(storageKey, rows) {
    return persistCampusJson(storageKey, rows)
}

export function nextPrefixedId(rows, prefix, start = 1001) {
    const nums = (rows || [])
        .map((row) => Number(String(row.id ?? '').replace(/\D/g, '')))
        .filter((n) => Number.isFinite(n))
    const max = nums.length ? Math.max(...nums) : start - 1
    return `${prefix}${max + 1}`
}

export function formatTransportDate(date) {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${day}-${month}-${date.getFullYear()}`
}

export function parseTransportDate(value) {
    if (!value) return null
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
    const raw = String(value).trim()
    const sep = raw.includes('/') ? '/' : '-'
    const parts = raw.split(sep).map(Number)
    if (parts.length !== 3) return null
    const [day, month, year] = parts
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}
