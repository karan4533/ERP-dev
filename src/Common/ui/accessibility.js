const DEFAULT_SKIP_TARGET = 'main-content'
const SAFE_TARGET_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/

export const getSkipLinkProps = (targetId = DEFAULT_SKIP_TARGET) => {
    const normalized = String(targetId ?? '').trim().replace(/^#/, '')
    const safeTarget = SAFE_TARGET_PATTERN.test(normalized) ? normalized : DEFAULT_SKIP_TARGET

    return {
        href: `#${safeTarget}`,
        targetId: safeTarget,
    }
}

export const VISUALLY_HIDDEN_STYLE = Object.freeze({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
})
