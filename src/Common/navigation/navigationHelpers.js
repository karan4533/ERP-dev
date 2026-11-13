const normalizeQuery = (query) => String(query ?? '').trim().toLowerCase()

export const findNavigationSource = (pathname, sources = []) => {
    const path = String(pathname ?? '')
    return [...sources]
        .sort((first, second) => second.prefix.length - first.prefix.length)
        .find((source) => path === source.prefix || path.startsWith(`${source.prefix}/`)) ?? null
}

export const normalizeNavigationItems = (items = []) => items.map((item) => ({
    ...item,
    to: item.subLinks?.length ? null : item.to,
    subLinks: item.subLinks?.map((subLink) => ({ ...subLink })),
}))

export const filterNavigationItems = (items = [], query = '') => {
    const normalizedQuery = normalizeQuery(query)
    if (!normalizedQuery) return items

    return items.flatMap((item) => {
        const parentMatches = String(item.title ?? '').toLowerCase().includes(normalizedQuery)
        if (parentMatches) return [item]
        if (!item.subLinks?.length) return []

        const matchingSubLinks = item.subLinks.filter((subLink) => (
            String(subLink.title ?? '').toLowerCase().includes(normalizedQuery)
        ))

        return matchingSubLinks.length ? [{ ...item, subLinks: matchingSubLinks }] : []
    })
}

export const isNavigationDestinationActive = (destination, pathname) => {
    if (!destination || destination === '#0' || destination === '#') return false
    const target = String(destination).replace(/\/$/, '')
    const path = String(pathname ?? '').replace(/\/$/, '')
    return path === target || path.startsWith(`${target}/`)
}

export const getNavigationLabel = (items = [], pathname = '') => {
    const destinations = items.flatMap((item) => [
        ...(item.to ? [{ title: item.title, to: item.to }] : []),
        ...(item.subLinks ?? []).map((subLink) => ({ title: subLink.title, to: subLink.to })),
    ])

    return destinations
        .filter((destination) => isNavigationDestinationActive(destination.to, pathname))
        .sort((first, second) => second.to.length - first.to.length)[0]?.title ?? null
}

const NAVIGATION_GROUPS = Object.freeze([
    { key: 'overview', label: 'Overview' },
    { key: 'work', label: 'My work' },
    { key: 'department', label: 'Department' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'reports', label: 'Reports' },
    { key: 'configuration', label: 'Configuration' },
])

const navigationGroupKey = (item) => {
    if (item?.group) {
        if (item.group === 'work' || item.group === 'my_work') return 'work'
        if (item.group === 'department') return 'department'
        if (item.group === 'configuration' || item.group === 'config') return 'configuration'
        if (item.group === 'overview') return 'overview'
        if (item.group === 'approvals') return 'approvals'
        if (item.group === 'reports') return 'reports'
        return item.group
    }

    const label = String(item.title ?? '').toLowerCase()
    const path = String(item.to ?? '').toLowerCase()
    const value = `${label} ${path}`

    if (/dashboard|overview|home\b/.test(value)) return 'overview'
    if (/approval|re-entry/.test(value)) return 'approvals'
    if (/report|analytic|activity log|module health/.test(value)) return 'reports'
    if (/setting|configuration|rbac|user creation|master/.test(value)) return 'configuration'
    if (/my |leave|attendance|task|notification|communication|calendar|escalation|meeting/.test(value)) return 'work'
    return 'department'
}

export const groupNavigationItems = (items = []) => {
    const grouped = new Map(NAVIGATION_GROUPS.map((group) => [group.key, []]))
    items.forEach((item) => grouped.get(navigationGroupKey(item)).push(item))

    return NAVIGATION_GROUPS
        .map((group) => ({ ...group, items: grouped.get(group.key) }))
        .filter((group) => group.items.length > 0)
}
