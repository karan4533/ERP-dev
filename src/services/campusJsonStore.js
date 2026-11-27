import {
    canUseOpsApi,
    listOpsCollectionApi,
    OPS_ITEM_UPSERT_COLLECTIONS,
    replaceOpsCollectionApi,
    stripOpsMeta,
    upsertOpsItemApi,
} from './opsApi'
import {
    canUseCampusAuditApi,
    listCampusAuditCollectionApi,
    replaceCampusAuditCollectionApi,
    stripCampusAuditMeta,
} from './campusAuditApi'
import { resolveCampusCollection } from './campusCollectionRegistry'
import { coerceCampusRows } from '../Common/auditDomain/executeAuditDraftStore'
import { canReplaceCollection, createLoadTracker, LOAD_STATUS, REPLACE_BLOCKED_MESSAGE } from './campusLoadGuard'

/** In-memory campus SoT keyed by storageKey when API mode is on. */
const memoryByKey = new Map()
const hydratePromises = new Map()
const loadTracker = createLoadTracker()

const isUpsertCollection = (meta) => meta?.kind === 'ops' && OPS_ITEM_UPSERT_COLLECTIONS.has(meta.collection)

/** True when a whole-list replace would overwrite a server collection that was never loaded. */
const replaceBlocked = (storageKey, meta) =>
    Boolean(meta && canUse(meta.kind) && !isUpsertCollection(meta) && !canReplaceCollection(loadTracker.get(storageKey)))

const recordIdForUpsert = (row) =>
    String(
        row?.id ||
            row?.itemId ||
            row?.requestId ||
            row?.dutyId ||
            row?.ticketId ||
            row?.header?.auditId ||
            row?.header?.auditNumber ||
            '',
    ).trim()

const clean = (kind, rows) => {
    const strip = kind === 'audit' ? stripCampusAuditMeta : stripOpsMeta
    return coerceCampusRows(rows).map(strip)
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

/**
 * Load state for a campus collection: idle | loading | loaded | failed.
 * Local (non-API) keys always report loaded.
 */
export const getCampusLoadState = (storageKey) => {
    if (!usesCampusApiForKey(storageKey)) return { status: LOAD_STATUS.LOADED, error: '', api: false }
    return { status: loadTracker.get(storageKey), error: loadTracker.error(storageKey), api: true }
}

export const setCampusMemory = (storageKey, rows, { push = true } = {}) => {
    // Preserve object-based drafts by wrapping into a one-item array (campus APIs are array-only).
    // Do not silently wipe valid objects to [].
    const list = coerceCampusRows(rows)
    if (!push) {
        // Rows supplied by a caller that just read/saved them via the API are the server copy.
        memoryByKey.set(storageKey, list)
        loadTracker.markLoaded(storageKey)
        return Promise.resolve(true)
    }
    const meta = resolveCampusCollection(storageKey)
    if (replaceBlocked(storageKey, meta)) {
        console.warn(`[campusJsonStore] ${storageKey}: ${REPLACE_BLOCKED_MESSAGE}`)
        return Promise.resolve(false)
    }
    const previous = memoryByKey.get(storageKey)
    memoryByKey.set(storageKey, list)
    if (!meta || !canUse(meta.kind)) return Promise.resolve(true)
    const rollback = () => {
        if (previous === undefined) memoryByKey.delete(storageKey)
        else memoryByKey.set(storageKey, previous)
        return false
    }
    if (isUpsertCollection(meta)) {
        return Promise.all(
            clean(meta.kind, list).map((row) => {
                const id = recordIdForUpsert(row)
                if (!id) return Promise.resolve()
                return upsertOpsItemApi(meta.collection, id, row)
            }),
        )
            .then(() => true)
            .catch(rollback)
    }
    return replaceApi(meta.kind, meta.collection, clean(meta.kind, list)).then(() => true).catch(rollback)
}

export const clearCampusJsonMemory = () => {
    memoryByKey.clear()
    hydratePromises.clear()
    loadTracker.clear()
}

export const hydrateCampusKey = async (storageKey, seed = []) => {
    void seed
    const meta = resolveCampusCollection(storageKey)
    if (!meta || !canUse(meta.kind)) return false
    if (hydratePromises.has(storageKey)) return hydratePromises.get(storageKey)

    loadTracker.markLoading(storageKey)
    const work = (async () => {
        try {
            const rows = await listApi(meta.kind, meta.collection)
            memoryByKey.set(storageKey, clean(meta.kind, rows))
            loadTracker.markLoaded(storageKey)
            try {
                localStorage.removeItem(storageKey)
            } catch {
                /* ignore */
            }
            return true
        } catch (err) {
            loadTracker.markFailed(storageKey, err?.message)
            if (!memoryByKey.has(storageKey)) memoryByKey.set(storageKey, [])
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
        return Array.isArray(fallback) ? [] : fallback
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
        const pending = setCampusMemory(storageKey, value, { push: true })
        try {
            localStorage.removeItem(storageKey)
        } catch {
            /* ignore */
        }
        return pending
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
    const list = coerceCampusRows(value)
    if (usesCampusApiForKey(storageKey)) {
        const meta = resolveCampusCollection(storageKey)
        if (replaceBlocked(storageKey, meta)) {
            return { success: false, api: true, blocked: true, message: REPLACE_BLOCKED_MESSAGE }
        }
        const previous = memoryByKey.get(storageKey)
        memoryByKey.set(storageKey, list)
        try {
            localStorage.removeItem(storageKey)
        } catch {
            /* ignore */
        }
        if (!meta || !canUse(meta.kind)) return { success: true, api: false }
        try {
            if (isUpsertCollection(meta)) {
                // Concurrent-safe path: upsert each row; does not delete omitted rows.
                for (const row of clean(meta.kind, list)) {
                    const id = recordIdForUpsert(row)
                    if (!id) throw new Error('Each record needs an id for item upsert.')
                    await upsertOpsItemApi(meta.collection, id, row)
                }
                return { success: true, api: true, mode: 'upsert' }
            }
            await replaceApi(meta.kind, meta.collection, clean(meta.kind, list))
            return { success: true, api: true }
        } catch (err) {
            if (previous === undefined) memoryByKey.delete(storageKey)
            else memoryByKey.set(storageKey, previous)
            return { success: false, api: true, message: err?.message || 'API save failed' }
        }
    }
    const ok = saveCampusJson(storageKey, list)
    return { success: Boolean(ok), api: false }
}

/** Save one record without replacing the rest of the collection (ops item-upsert collections). */
export const persistCampusJsonItem = async (storageKey, record) => {
    const row = record && typeof record === 'object' ? record : null
    if (!row) return { success: false, message: 'Record is required.' }
    const id = recordIdForUpsert(row)
    if (!id) return { success: false, message: 'Record id is required.' }

    if (usesCampusApiForKey(storageKey)) {
        const meta = resolveCampusCollection(storageKey)
        if (!meta || !canUse(meta.kind)) {
            return { success: false, message: 'API is not available for this collection.' }
        }
        // Ops item-upsert path (concurrent-safe). Audit and other collections merge + replace.
        if (meta.kind === 'ops' && OPS_ITEM_UPSERT_COLLECTIONS.has(meta.collection)) {
            try {
                const saved = stripOpsMeta(await upsertOpsItemApi(meta.collection, id, stripOpsMeta(row)))
                const current = getCampusMemory(storageKey) || []
                const next = [saved, ...current.filter((item) => recordIdForUpsert(item) !== id)]
                memoryByKey.set(storageKey, next)
                try {
                    localStorage.removeItem(storageKey)
                } catch {
                    /* ignore */
                }
                return { success: true, api: true, record: saved }
            } catch (err) {
                return { success: false, api: true, message: err?.message || 'API save failed', record: row }
            }
        }
        const current = getCampusMemory(storageKey) || []
        const next = [row, ...current.filter((item) => recordIdForUpsert(item) !== id)]
        return persistCampusJson(storageKey, next)
    }

    const current = loadCampusJson(storageKey, [])
    const list = Array.isArray(current) ? current : []
    const next = [row, ...list.filter((item) => recordIdForUpsert(item) !== id)]
    const ok = saveCampusJson(storageKey, next)
    return { success: Boolean(ok), api: false, record: row }
}

export const ensureCampusSeed = (storageKey, seed) => {
    if (usesCampusApiForKey(storageKey)) {
        const mem = getCampusMemory(storageKey)
        if (mem != null) return mem
        memoryByKey.set(storageKey, [])
        hydrateCampusKey(storageKey)
        return []
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
