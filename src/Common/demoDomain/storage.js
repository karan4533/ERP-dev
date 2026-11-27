import {
    ensureCampusSeed,
    loadCampusJson,
    saveCampusJson,
    usesCampusApiForKey,
} from '../../services/campusJsonStore'

export function loadJson(key, fallback) {
    return loadCampusJson(key, fallback)
}

export function saveJson(key, value) {
    return saveCampusJson(key, value)
}

export function ensureSeed(key, seed) {
    return ensureCampusSeed(key, seed)
}

export function nextSerial(prefix, items, idField = 'id') {
    const max = (items || []).reduce((acc, item) => {
        const match = String(item?.[idField] ?? '').match(/(\d+)$/)
        return match ? Math.max(acc, Number(match[1])) : acc
    }, 0)
    return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export { usesCampusApiForKey }
