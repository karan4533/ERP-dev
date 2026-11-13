import test from 'node:test'
import assert from 'node:assert/strict'

const tokenModule = await import('../tokens.js').catch(() => null)

const requireTokens = () => {
    assert.ok(tokenModule, 'the shared UI token module should be importable')
    return tokenModule
}

const channel = (value) => {
    const normalized = value / 255
    return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4
}

const luminance = (hex) => {
    const value = hex.replace('#', '')
    const [red, green, blue] = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16))
    return (0.2126 * channel(red)) + (0.7152 * channel(green)) + (0.0722 * channel(blue))
}

const contrastRatio = (first, second) => {
    const lighter = Math.max(luminance(first), luminance(second))
    const darker = Math.min(luminance(first), luminance(second))
    return (lighter + 0.05) / (darker + 0.05)
}

test('domain statuses resolve to stable semantic tones', () => {
    const { getStatusTone } = requireTokens()

    assert.equal(getStatusTone('Approved').key, 'success')
    assert.equal(getStatusTone('paid').key, 'success')
    assert.equal(getStatusTone('Pending Approval').key, 'warning')
    assert.equal(getStatusTone('OVERDUE').key, 'danger')
    assert.equal(getStatusTone('In Progress').key, 'info')
    assert.equal(getStatusTone('Draft').key, 'neutral')
})

test('unknown and empty statuses use the neutral tone', () => {
    const { getStatusTone } = requireTokens()

    assert.equal(getStatusTone('Waiting for vendor').key, 'neutral')
    assert.equal(getStatusTone('').key, 'neutral')
    assert.equal(getStatusTone(null).key, 'neutral')
})

test('semantic tone names resolve directly for shared UI components', () => {
    const { getStatusTone } = requireTokens()

    assert.equal(getStatusTone('info').key, 'info')
    assert.equal(getStatusTone('success').key, 'success')
    assert.equal(getStatusTone('warning').key, 'warning')
    assert.equal(getStatusTone('danger').key, 'danger')
    assert.equal(getStatusTone('neutral').key, 'neutral')
})

test('semantic status palettes meet AA contrast for normal text', () => {
    const { STATUS_TONES } = requireTokens()

    for (const [name, tone] of Object.entries(STATUS_TONES)) {
        assert.match(tone.foreground, /^#[0-9A-F]{6}$/i, `${name} foreground must be a six-digit hex color`)
        assert.match(tone.background, /^#[0-9A-F]{6}$/i, `${name} background must be a six-digit hex color`)
        assert.ok(
            contrastRatio(tone.foreground, tone.background) >= 4.5,
            `${name} foreground must meet WCAG AA contrast on its background`,
        )
    }
})
