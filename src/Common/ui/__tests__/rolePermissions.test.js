import test from 'node:test'
import assert from 'node:assert/strict'

const values = new Map()
globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
}

const permissions = await import('../../RBAC/rolePermissionsData.js')

const links = [
    { id: 1, title: 'Dashboard' },
    { id: 4, title: 'Lesson Plans' },
    { id: 5, title: 'Tasks' },
    { id: 99, title: 'Unmapped utility' },
]

test('an unconfigured role retains its existing navigation for migration safety', () => {
    localStorage.clear()
    assert.deepEqual(permissions.getFilteredTeacherSidebarLinks(links), links)
})

test('an explicitly deny-all role hides every mapped optional module', () => {
    localStorage.clear()
    permissions.setPermissionsForRole('teacher', permissions.buildDefaultRolePermissions(false))

    assert.deepEqual(
        permissions.getFilteredTeacherSidebarLinks(links).map((link) => link.id),
        [1, 99],
    )
})

test('an explicitly configured role shows only granted mapped modules', () => {
    localStorage.clear()
    permissions.setPermissionsForRole('teacher', {
        ...permissions.buildDefaultRolePermissions(false),
        lessonPlans: true,
    })

    assert.deepEqual(
        permissions.getFilteredTeacherSidebarLinks(links).map((link) => link.id),
        [1, 4, 99],
    )
})
