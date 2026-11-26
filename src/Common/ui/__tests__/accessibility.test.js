import test from 'node:test'
import assert from 'node:assert/strict'

const accessibilityModule = await import('../accessibility.js').catch(() => null)

const requireAccessibility = () => {
    assert.ok(accessibilityModule, 'the shared accessibility helper module should be importable')
    return accessibilityModule
}

test('skip-link props point to a normalized in-page target', () => {
    const { getSkipLinkProps } = requireAccessibility()

    assert.deepEqual(getSkipLinkProps('workspace-content'), {
        href: '#workspace-content',
        targetId: 'workspace-content',
    })
    assert.deepEqual(getSkipLinkProps('#main-content'), {
        href: '#main-content',
        targetId: 'main-content',
    })
})

test('skip-link props fall back when the target is empty or unsafe', () => {
    const { getSkipLinkProps } = requireAccessibility()

    assert.deepEqual(getSkipLinkProps(''), {
        href: '#main-content',
        targetId: 'main-content',
    })
    assert.deepEqual(getSkipLinkProps('content section'), {
        href: '#main-content',
        targetId: 'main-content',
    })
})

test('visually hidden styles remain available to assistive technology', () => {
    const { VISUALLY_HIDDEN_STYLE } = requireAccessibility()

    assert.equal(VISUALLY_HIDDEN_STYLE.position, 'absolute')
    assert.equal(VISUALLY_HIDDEN_STYLE.width, '1px')
    assert.equal(VISUALLY_HIDDEN_STYLE.height, '1px')
    assert.equal(VISUALLY_HIDDEN_STYLE.overflow, 'hidden')
    assert.equal(VISUALLY_HIDDEN_STYLE.clip, 'rect(0 0 0 0)')
    assert.equal(VISUALLY_HIDDEN_STYLE.whiteSpace, 'nowrap')
})
