import test from 'node:test'
import assert from 'node:assert/strict'

const shellStateModule = await import('../shellState.js').catch(() => null)
const registryModule = await import('../layoutRegistry.js').catch(() => null)

const requireShellState = () => {
    assert.ok(shellStateModule, 'the application shell state module should be importable')
    return shellStateModule
}

const requireRegistry = () => {
    assert.ok(registryModule, 'the portal layout registry should be importable')
    return registryModule
}

test('mobile view starts closed and desktop view starts expanded', () => {
    const { getInitialSidebarState } = requireShellState()

    assert.deepEqual(getInitialSidebarState(375), { isMobile: true, sidebarHidden: true })
    assert.deepEqual(getInitialSidebarState(1024), { isMobile: false, sidebarHidden: false })
    assert.deepEqual(getInitialSidebarState(1440), { isMobile: false, sidebarHidden: false })
})

test('mobile backdrop is shown only while the mobile navigation is open', () => {
    const { shouldShowMobileBackdrop } = requireShellState()

    assert.equal(shouldShowMobileBackdrop(375, false), true)
    assert.equal(shouldShowMobileBackdrop(375, true), false)
    assert.equal(shouldShowMobileBackdrop(1280, false), false)
})

test('Escape closes only an open mobile navigation', () => {
    const { shouldCloseSidebarOnEscape } = requireShellState()

    assert.equal(shouldCloseSidebarOnEscape('Escape', 375, false), true)
    assert.equal(shouldCloseSidebarOnEscape('Enter', 375, false), false)
    assert.equal(shouldCloseSidebarOnEscape('Escape', 375, true), false)
    assert.equal(shouldCloseSidebarOnEscape('Escape', 1280, false), false)
})

test('layout registry defines all current authenticated roles', () => {
    const { PORTAL_LAYOUTS } = requireRegistry()
    const records = Object.values(PORTAL_LAYOUTS)

    assert.equal(records.length, 26)
    assert.equal(new Set(records.map((record) => record.role)).size, 26)
    assert.equal(records.every((record) => record.label && record.shortLabel), true)
})

test('layout registry preserves role-specific breadcrumb behavior', () => {
    const { getPortalLayout } = requireRegistry()

    assert.deepEqual(getPortalLayout('admin'), {
        role: 'admin',
        label: 'Administration',
        shortLabel: 'Admin',
        showBreadcrumb: true,
    })
    assert.equal(getPortalLayout('accounthead').showBreadcrumb, false)
    assert.equal(getPortalLayout('unknown').role, 'unknown')
    assert.equal(getPortalLayout('unknown').label, 'School ERP')
})
