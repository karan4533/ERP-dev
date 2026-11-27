/**
 * Per-collection server load state for campus JSON stores.
 * Kept free of browser / Vite APIs so it can be unit-tested with `node --test`.
 */

export const LOAD_STATUS = Object.freeze({
    IDLE: 'idle',
    LOADING: 'loading',
    LOADED: 'loaded',
    FAILED: 'failed',
})

export const REPLACE_BLOCKED_MESSAGE =
    'Records have not loaded from the server yet, so this save was blocked to protect existing data. Refresh the page and try again.'

export const createLoadTracker = () => {
    const status = new Map()
    const errors = new Map()
    return {
        get: (key) => status.get(key) || LOAD_STATUS.IDLE,
        error: (key) => errors.get(key) || '',
        markLoading(key) {
            // A refresh of an already-loaded collection keeps its trusted in-memory copy.
            if (status.get(key) !== LOAD_STATUS.LOADED) status.set(key, LOAD_STATUS.LOADING)
            errors.delete(key)
        },
        markLoaded(key) {
            status.set(key, LOAD_STATUS.LOADED)
            errors.delete(key)
        },
        markFailed(key, message) {
            if (status.get(key) !== LOAD_STATUS.LOADED) status.set(key, LOAD_STATUS.FAILED)
            errors.set(key, String(message || 'Could not load records from the server.'))
        },
        clear() {
            status.clear()
            errors.clear()
        },
    }
}

/** A whole-collection replace is only safe once the server copy has actually been loaded. */
export const canReplaceCollection = (status) => status === LOAD_STATUS.LOADED
