export function loadJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return fallback
        const parsed = JSON.parse(raw)
        return parsed ?? fallback
    } catch (error) {
        console.error(`Failed to read ${key}`, error)
        return fallback
    }
}

export function saveJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
    } catch (error) {
        console.error(`Failed to write ${key}`, error)
        return false
    }
}

export function ensureSeed(key, seed) {
    const existing = loadJson(key, null)
    if (existing == null) {
        saveJson(key, seed)
        return structuredClone(seed)
    }
    return existing
}

export function nextSerial(prefix, items, idField = 'id') {
    const max = (items || []).reduce((acc, item) => {
        const match = String(item?.[idField] ?? '').match(/(\d+)$/)
        return match ? Math.max(acc, Number(match[1])) : acc
    }, 0)
    return `${prefix}${String(max + 1).padStart(4, '0')}`
}
