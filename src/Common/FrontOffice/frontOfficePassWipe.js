const WIPE_FLAG = 'schoolerp-front-office-pass-wipe-v1'

const PASS_STORAGE_KEYS = [
    'material-gate-pass-front-office',
    'material-gate-pass-mgp-counter',
    'goods-received-pass-front-office',
    'goods-received-pass-gr-counter',
]

/** One-time clear of Material Gate Pass & Goods Received Pass localStorage for 0001 numbering. */
export const runFrontOfficePassWipeIfNeeded = () => {
    try {
        if (typeof localStorage === 'undefined') return
        if (localStorage.getItem(WIPE_FLAG) === '1') return

        PASS_STORAGE_KEYS.forEach((key) => {
            localStorage.removeItem(key)
        })
        localStorage.setItem(WIPE_FLAG, '1')
    } catch {
        /* ignore */
    }
}
