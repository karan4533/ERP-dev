import test from 'node:test'
import assert from 'node:assert/strict'

const navigationModule = await import('../navigationHelpers.js').catch(() => null)

const requireNavigation = () => {
    assert.ok(navigationModule, 'the navigation helper module should be importable')
    return navigationModule
}

const ITEMS = [
    { id: 1, title: 'Dashboard', to: '/teacher/dashboard' },
    {
        id: 2,
        title: 'Student evaluation',
        to: '#0',
        subLinks: [
            { title: 'Exam results', to: '/teacher/student-evaluation/results' },
            { title: 'Mark entry', to: '/teacher/student-evaluation/mark-entry' },
        ],
    },
]

test('navigation source matching prefers the most specific path prefix', () => {
    const { findNavigationSource } = requireNavigation()
    const sources = [
        { prefix: '/joint-director', id: 'operations' },
        { prefix: '/joint-director-audit', id: 'audit' },
    ]

    assert.equal(findNavigationSource('/joint-director-audit/dashboard', sources).id, 'audit')
    assert.equal(findNavigationSource('/joint-director/dashboard', sources).id, 'operations')
    assert.equal(findNavigationSource('/unknown', sources), null)
})

test('normalization removes pseudo-link destinations from disclosure groups', () => {
    const { normalizeNavigationItems } = requireNavigation()
    const normalized = normalizeNavigationItems(ITEMS)

    assert.equal(normalized[0].to, '/teacher/dashboard')
    assert.equal(normalized[1].to, null)
    assert.equal(normalized[1].subLinks.length, 2)
})

test('navigation search returns matching children without unrelated siblings', () => {
    const { filterNavigationItems } = requireNavigation()

    assert.deepEqual(filterNavigationItems(ITEMS, 'mark'), [
        {
            id: 2,
            title: 'Student evaluation',
            to: '#0',
            subLinks: [{ title: 'Mark entry', to: '/teacher/student-evaluation/mark-entry' }],
        },
    ])
    assert.equal(filterNavigationItems(ITEMS, 'student evaluation')[0].subLinks.length, 2)
    assert.equal(filterNavigationItems(ITEMS, '   ').length, 2)
})

test('active matching supports nested detail routes without prefix collisions', () => {
    const { isNavigationDestinationActive } = requireNavigation()

    assert.equal(isNavigationDestinationActive('/teacher/dashboard', '/teacher/dashboard'), true)
    assert.equal(isNavigationDestinationActive('/teacher/student', '/teacher/student/42'), true)
    assert.equal(isNavigationDestinationActive('/teacher/student', '/teacher/students'), false)
    assert.equal(isNavigationDestinationActive(null, '/teacher/dashboard'), false)
})

test('page labels come from the most specific matching navigation destination', () => {
    const { getNavigationLabel } = requireNavigation()

    assert.equal(getNavigationLabel(ITEMS, '/teacher/dashboard'), 'Dashboard')
    assert.equal(getNavigationLabel(ITEMS, '/teacher/student-evaluation/mark-entry/42'), 'Mark entry')
    assert.equal(getNavigationLabel(ITEMS, '/not-in-navigation'), null)
})

test('navigation items are grouped by the work they support', () => {
    const { groupNavigationItems } = requireNavigation()
    const groups = groupNavigationItems([
        { id: 1, title: 'Dashboard', to: '/dashboard' },
        { id: 2, title: 'Leave Request', to: '/leave' },
        { id: 3, title: 'Student Database', to: '/students' },
        { id: 4, title: 'Request Approvals', to: '/approvals' },
        { id: 5, title: 'Reports & Analytics', to: '/reports' },
        { id: 6, title: 'Settings', to: '/settings' },
    ])

    assert.deepEqual(groups.map((group) => [group.label, group.items.length]), [
        ['Overview', 1],
        ['My work', 1],
        ['Department', 1],
        ['Approvals', 1],
        ['Reports', 1],
        ['Configuration', 1],
    ])
})
