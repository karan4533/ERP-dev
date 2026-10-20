import { canUseOpsApi, listOpsCollectionApi, replaceOpsCollectionApi, stripOpsMeta } from './opsApi'
import {
    canUseCampusAuditApi,
    listCampusAuditCollectionApi,
    replaceCampusAuditCollectionApi,
    stripCampusAuditMeta,
} from './campusAuditApi'
import { resolveCampusCollection } from './campusCollectionRegistry'

/** In-memory campus SoT keyed by storageKey when API mode is on. */
const memoryByKey = new Map()
const hydratePromises = new Map()

const clean = (kind, rows) => {
    const strip = kind === 'audit' ? stripCampusAuditMeta : stripOpsMeta
    return Array.isArray(rows) ? rows.map(strip) : []
}

const canUse = (kind) => (kind === 'audit' ? canUseCampusAuditApi() : canUseOpsApi())

const listApi = (kind, collection) =>
    kind === 'audit' ? listCampusAuditCollectionApi(collection) : listOpsCollectionApi(collection)

const replaceApi = (kind, collection, items) =>
    kind === 'audit'
        ? replaceCampusAuditCollectionApi(collection, items)
        : replaceOpsCollectionApi(collection, items)

export const usesCampusApiForKey = (storageKey) => {
    const meta = resolveCampusCollection(storageKey)
    return Boolean(meta && canUse(meta.kind))
}

export const getCampusMemory = (storageKey) => {
    if (!memoryByKey.has(storageKey)) return null
    return structuredClone(memoryByKey.get(storageKey))
}

export const setCampusMemory = (storageKey, rows, { push = true } = {}) => {
    const list = Array.isArray(rows) ? rows : []
    memoryByKey.set(storageKey, list)
    if (!push) return
    const meta = resolveCampusCollection(storageKey)
    if (!meta || !canUse(meta.kind)) return
    replaceApi(meta.kind, meta.collection, clean(meta.kind, list)).catch(() => {})
}

export const clearCampusJsonMemory = () => {
    memoryByKey.clear()
    hydratePromises.clear()
}

export const hydrateCampusKey = async (storageKey, seed = []) => {
    const meta = resolveCampusCollection(storageKey)
    if (!meta || !canUse(meta.kind)) return false
    if (hydratePromises.has(storageKey)) return hydratePromises.get(storageKey)

    const work = (async () => {
        try {
            const rows = await listApi(meta.kind, meta.collection)
            const cleaned = clean(meta.kind, rows)
            if (cleaned.length === 0 && Array.isArray(seed) && seed.length > 0) {
                memoryByKey.set(storageKey, structuredClone(seed))
                await replaceApi(meta.kind, meta.collection, clean(meta.kind, seed))
            } else {
                memoryByKey.set(storageKey, cleaned)
            }
            try {
                localStorage.removeItem(storageKey)
            } catch {
                /* ignore */
            }
            return true
        } catch {
            memoryByKey.set(storageKey, Array.isArray(seed) ? structuredClone(seed) : [])
            return false
        } finally {
            hydratePromises.delete(storageKey)
        }
    })()

    hydratePromises.set(storageKey, work)
    return work
}

/**
 * Drop-in helpers for modules that used localStorage.getItem/setItem(STORAGE_KEY).
 */
export const loadCampusJson = (storageKey, fallback) => {
    if (usesCampusApiForKey(storageKey)) {
        const mem = getCampusMemory(storageKey)
        if (mem != null) return mem
        return Array.isArray(fallback) ? structuredClone(fallback) : fallback
    }
    try {
        const raw = localStorage.getItem(storageKey)
        if (!raw) return fallback
        return JSON.parse(raw) ?? fallback
    } catch {
        return fallback
    }
}

export const saveCampusJson = (storageKey, value) => {
    if (usesCampusApiForKey(storageKey)) {
        setCampusMemory(storageKey, value, { push: true })
        try {
            localStorage.removeItem(storageKey)
        } catch {
            /* ignore */
        }
        return true
    }
    try {
        localStorage.setItem(storageKey, JSON.stringify(value))
        return true
    } catch {
        return false
    }
}

/** Awaitable save — waits for ops/audit replace when API mode is on. */
export const persistCampusJson = async (storageKey, value) => {
    const list = Array.isArray(value) ? value : []
    if (usesCampusApiForKey(storageKey)) {
        memoryByKey.set(storageKey, list)
        try {
            localStorage.removeItem(storageKey)
        } catch {
            /* ignore */
        }
        const meta = resolveCampusCollection(storageKey)
        if (!meta || !canUse(meta.kind)) return { success: true, api: false }
        try {
            await replaceApi(meta.kind, meta.collection, clean(meta.kind, list))
            return { success: true, api: true }
        } catch (err) {
            return { success: false, api: true, message: err?.message || 'API save failed' }
        }
    }
    const ok = saveCampusJson(storageKey, list)
    return { success: Boolean(ok), api: false }
}

export const ensureCampusSeed = (storageKey, seed) => {
    if (usesCampusApiForKey(storageKey)) {
        const mem = getCampusMemory(storageKey)
        if (mem != null) return mem
        const initial = structuredClone(seed)
        memoryByKey.set(storageKey, initial)
        hydrateCampusKey(storageKey, seed)
        return structuredClone(initial)
    }
    try {
        const raw = localStorage.getItem(storageKey)
        if (raw == null) {
            localStorage.setItem(storageKey, JSON.stringify(seed))
            return structuredClone(seed)
        }
        return JSON.parse(raw)
    } catch {
        return structuredClone(seed)
    }
}
