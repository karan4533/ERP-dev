import test from 'node:test'
import assert from 'node:assert/strict'
import {
    buildDefaultPreferences,
    getNavigationPreferences,
    togglePinModule,
    moveOrReorderModule,
    createCustomGroup,
    renameCustomGroup,
    deleteCustomGroup,
    resetNavigationPreferences,
} from '../navigation/navigationCustomizationData.js'

// Mock base links simulating role navigation items
const mockLinks = [
    { id: 0, title: 'Dashboard', to: '/front-office/dashboard' },
    { id: 1, title: 'Admission Enquiry', to: '/front-office/admission-enquiry' },
    { id: 2, title: 'Admission List', to: '/front-office/admission-list' },
    { id: 3, title: 'Gate Pass', to: '/front-office/gate-pass-list' },
    { id: 4, title: 'My Tasks', to: '/front-office/task-management/my-tasks' },
]

test('Navigation Customization Engine', async (t) => {
    // Mock localStorage in Node environment
    const storage = new Map()
    global.window = {
        localStorage: {
            getItem: (k) => storage.get(k) || null,
            setItem: (k, v) => storage.set(k, String(v)),
            removeItem: (k) => storage.delete(k),
        },
        dispatchEvent: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
    }

    await t.test('1. Generates valid default preferences from links', () => {
        const prefs = buildDefaultPreferences(mockLinks)
        assert.ok(Array.isArray(prefs.groups), 'Groups must be an array')
        assert.equal(prefs.pinnedIds.length, 0, 'Initially zero pinned items')

        // Verify all 5 items exist across groups
        const allIds = prefs.groups.flatMap((g) => g.moduleIds)
        assert.equal(allIds.length, 5)
        assert.ok(allIds.includes('0'))
        assert.ok(allIds.includes('1'))
    })

    await t.test('2. Toggles pinning a module and persists across sessions', () => {
        const role = 'prm'
        const email = 'prm@school.com'

        // Pin module 1
        const pinned = togglePinModule(role, email, '1', mockLinks)
        assert.equal(pinned, true, 'Should return pinned = true')

        let prefs = getNavigationPreferences(role, email, mockLinks)
        assert.deepEqual(prefs.pinnedIds, ['1'], 'Module 1 should be in pinned list')

        // Pin module 0
        togglePinModule(role, email, '0', mockLinks)
        prefs = getNavigationPreferences(role, email, mockLinks)
        assert.deepEqual(prefs.pinnedIds, ['1', '0'])

        // Unpin module 1
        const unpinned = togglePinModule(role, email, '1', mockLinks)
        assert.equal(unpinned, false, 'Should return pinned = false')
        prefs = getNavigationPreferences(role, email, mockLinks)
        assert.deepEqual(prefs.pinnedIds, ['0'])
    })

    await t.test('3. Creates a custom group and moves a module into it', () => {
        const role = 'prm'
        const email = 'prm@school.com'

        const newGroup = createCustomGroup(role, email, 'Admissions Hub', mockLinks)
        assert.ok(newGroup.id)
        assert.equal(newGroup.label, 'Admissions Hub')

        let prefs = getNavigationPreferences(role, email, mockLinks)
        const createdGroup = prefs.groups.find((g) => g.id === newGroup.id)
        assert.ok(createdGroup, 'Group must exist in preferences')

        // Find which group currently has module '1' (Admission Enquiry)
        const sourceGroup = prefs.groups.find((g) => g.moduleIds.includes('1'))
        assert.ok(sourceGroup)

        // Move module '1' to 'Admissions Hub'
        moveOrReorderModule(
            role,
            email,
            {
                sourceGroupId: sourceGroup.id,
                targetGroupId: newGroup.id,
                moduleId: '1',
                targetIndex: 0,
            },
            mockLinks
        )

        prefs = getNavigationPreferences(role, email, mockLinks)
        const updatedTarget = prefs.groups.find((g) => g.id === newGroup.id)
        const updatedSource = prefs.groups.find((g) => g.id === sourceGroup.id)

        assert.ok(updatedTarget.moduleIds.includes('1'), 'Module 1 must be in target group')
        assert.equal(updatedSource.moduleIds.includes('1'), false, 'Module 1 must be removed from source group')
    })

    await t.test('4. Reorders modules within a group', () => {
        const role = 'prm'
        const email = 'prm@school.com'

        // Create group with multiple items
        const group = createCustomGroup(role, email, 'Quick Access', mockLinks)
        moveOrReorderModule(role, email, { sourceGroupId: 'overview', targetGroupId: group.id, moduleId: '2', targetIndex: 0 }, mockLinks)
        moveOrReorderModule(role, email, { sourceGroupId: 'overview', targetGroupId: group.id, moduleId: '3', targetIndex: 1 }, mockLinks)

        let prefs = getNavigationPreferences(role, email, mockLinks)
        let qaGroup = prefs.groups.find((g) => g.id === group.id)
        assert.deepEqual(qaGroup.moduleIds, ['2', '3'])

        // Reorder: Move '3' to index 0
        moveOrReorderModule(role, email, { sourceGroupId: group.id, targetGroupId: group.id, moduleId: '3', targetIndex: 0 }, mockLinks)
        prefs = getNavigationPreferences(role, email, mockLinks)
        qaGroup = prefs.groups.find((g) => g.id === group.id)
        assert.deepEqual(qaGroup.moduleIds, ['3', '2'], 'Order must be swapped to [3, 2]')
    })

    await t.test('5. Renames and deletes a custom group', () => {
        const role = 'prm'
        const email = 'prm@school.com'

        const group = createCustomGroup(role, email, 'Temp Group', mockLinks)
        assert.equal(group.label, 'Temp Group')

        renameCustomGroup(role, email, group.id, 'Renamed Group', mockLinks)
        let prefs = getNavigationPreferences(role, email, mockLinks)
        let found = prefs.groups.find((g) => g.id === group.id)
        assert.equal(found.label, 'Renamed Group')

        deleteCustomGroup(role, email, group.id, mockLinks)
        prefs = getNavigationPreferences(role, email, mockLinks)
        found = prefs.groups.find((g) => g.id === group.id)
        assert.equal(found, undefined, 'Group should be deleted')
    })

    await t.test('6. Resets navigation preferences to factory defaults', () => {
        const role = 'prm'
        const email = 'prm@school.com'

        resetNavigationPreferences(role, email, mockLinks)
        const prefs = getNavigationPreferences(role, email, mockLinks)
        assert.equal(prefs.pinnedIds.length, 0)
        assert.ok(!prefs.groups.some((g) => g.isCustom), 'Custom groups should be removed on reset')
    })
})

