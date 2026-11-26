export const FINANCE_STORAGE_KEY = 'school_erp_finance_state_v1'
export const FINANCE_STORAGE_VERSION = 1

export const DEFAULT_FINANCE_SEQUENCE = {
    pay: 123,
    rec: 102,
    txn: 200,
    voucher: 900,
    link: 123,
}

const canUseLocalStorage = () => (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
)

export const cloneJson = (value) => JSON.parse(JSON.stringify(value))

export const initialPersistedList = (saved, key, fallback) => (
    cloneJson(Array.isArray(saved?.[key]) ? saved[key] : fallback)
)

export const pickPersistedSequence = (saved) => {
    const seq = saved?.sequence
    if (!seq || typeof seq !== 'object') return { ...DEFAULT_FINANCE_SEQUENCE }
    return {
        pay: Number(seq.pay) || DEFAULT_FINANCE_SEQUENCE.pay,
        rec: Number(seq.rec) || DEFAULT_FINANCE_SEQUENCE.rec,
        txn: Number(seq.txn) || DEFAULT_FINANCE_SEQUENCE.txn,
        voucher: Number(seq.voucher) || DEFAULT_FINANCE_SEQUENCE.voucher,
        link: Number(seq.link) || DEFAULT_FINANCE_SEQUENCE.link,
    }
}

export function loadFinanceState() {
    if (!canUseLocalStorage()) return null

    try {
        const raw = window.localStorage.getItem(FINANCE_STORAGE_KEY)
        if (!raw) return null

        const parsed = JSON.parse(raw)
        if (
            !parsed
            || parsed.version !== FINANCE_STORAGE_VERSION
            || !parsed.data
            || typeof parsed.data !== 'object'
        ) {
            return null
        }

        return parsed
    } catch (error) {
        console.error('Failed to load Finance state from localStorage', error)
        return null
    }
}

export function saveFinanceState(state) {
    if (!canUseLocalStorage()) return null

    try {
        const payload = {
            version: FINANCE_STORAGE_VERSION,
            savedAt: new Date().toISOString(),
            data: state,
        }
        window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(payload))
        return payload
    } catch (error) {
        console.error('Unable to persist Finance state', error)
        return null
    }
}

export function clearFinanceState() {
    if (!canUseLocalStorage()) return

    try {
        window.localStorage.removeItem(FINANCE_STORAGE_KEY)
    } catch (error) {
        console.error('Unable to clear Finance state', error)
    }
}

export function hasFinanceSavedState() {
    return loadFinanceState() !== null
}
