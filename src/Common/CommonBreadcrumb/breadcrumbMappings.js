import { getPageTitle } from '../CommonHeader/Components/TitleMappings'
import { ROLE_HOME_PATHS, ROLES } from '../../context/AuthContext'
import {
    adminSidebarLinks,
    superAdminSidebarLinks,
    studentSidebarLinks,
    parentSidebarLinks,
    teacherSidebarLinks,
    librarianSidebarLinks,
    prmSidebarLinks,
    gateKeeperSidebarLinks,
    gateKeeperManagerSidebarLinks,
    directorSidebarLinks,
    principalSidebarLinks,
    hrSidebarLinks,
} from '../CommonSidebar/Components/sidebarLinks'

const ROLE_ROUTE_CONFIG = [
    { prefix: '/super-admin', role: ROLES.SUPER_ADMIN, links: superAdminSidebarLinks },
    { prefix: '/parent', role: ROLES.PARENT, links: parentSidebarLinks },
    { prefix: '/gatekeeper-manager', role: ROLES.GATEKEEPER_MANAGER, links: gateKeeperManagerSidebarLinks },
    { prefix: '/gate-keeper', role: ROLES.GATEKEEPER, links: gateKeeperSidebarLinks },
    { prefix: '/front-office', role: ROLES.PRM, links: prmSidebarLinks },
    { prefix: '/teacher', role: ROLES.TEACHER, links: teacherSidebarLinks },
    { prefix: '/student', role: ROLES.STUDENT, links: studentSidebarLinks },
    { prefix: '/librarian', role: ROLES.LIBRARIAN, links: librarianSidebarLinks },
    { prefix: '/director', role: ROLES.DIRECTOR, links: directorSidebarLinks },
    { prefix: '/principal', role: ROLES.PRINCIPAL, links: principalSidebarLinks },
    { prefix: '/hr', role: ROLES.HR, links: hrSidebarLinks },
    { prefix: '/admin', role: ROLES.ADMIN, links: adminSidebarLinks },
]

const isPlaceholderLink = (to) => !to || to === '#0'

const formatSegmentLabel = (segment = '') =>
    segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())

const tokenizeSegment = (segment = '') =>
    segment
        .toLowerCase()
        .replace(/^(add|view|edit)-/, '')
        .replace(/-(list|details|info|form)$/, '')
        .split('-')
        .filter((token) => token && !['view', 'add', 'edit'].includes(token))

const getPathParts = (path = '') => path.split('/').filter(Boolean)

const getMeaningfulSegment = (parts) => {
    if (!parts.length) return ''
    const last = parts[parts.length - 1]
    if (/^\d+$/.test(last) || last.length > 24) {
        return parts[parts.length - 2] || last
    }
    return last
}

const scoreLeafMatch = (pathname, leafTo) => {
    if (!leafTo || isPlaceholderLink(leafTo)) return 0
    if (pathname === leafTo) return 1000
    if (pathname.startsWith(`${leafTo}/`)) return 900

    const pathParts = getPathParts(pathname)
    const leafParts = getPathParts(leafTo)
    if (!pathParts.length || !leafParts.length) return 0
    if (pathParts[0] !== leafParts[0]) return 0

    let shared = 0
    const maxShared = Math.min(pathParts.length, leafParts.length)
    for (let i = 0; i < maxShared; i += 1) {
        if (pathParts[i] !== leafParts[i]) break
        shared += 1
    }
    if (shared < 2) return 0

    const pathTokens = new Set(tokenizeSegment(getMeaningfulSegment(pathParts)))
    const leafTokens = tokenizeSegment(getMeaningfulSegment(leafParts))
    const tokenHits = leafTokens.filter(
        (token) =>
            pathTokens.has(token) ||
            [...pathTokens].some((pathToken) => pathToken.includes(token) || token.includes(pathToken))
    ).length

    return shared * 10 + tokenHits * 8
}

export const getRoleConfigForPath = (pathname) => {
    const match = ROLE_ROUTE_CONFIG.find((config) => pathname.startsWith(config.prefix))
    if (match) {
        return {
            ...match,
            homePath: ROLE_HOME_PATHS[match.role],
        }
    }

    // Admin also owns legacy `/dashboard`
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
        return {
            prefix: '/admin',
            role: ROLES.ADMIN,
            links: adminSidebarLinks,
            homePath: ROLE_HOME_PATHS[ROLES.ADMIN],
        }
    }

    return null
}

const findBestSidebarMatch = (pathname, sidebarLinks = []) => {
    let best = null

    sidebarLinks.forEach((link) => {
        if (link.subLinks?.length) {
            link.subLinks.forEach((subLink) => {
                const score = scoreLeafMatch(pathname, subLink.to)
                if (score > (best?.score ?? 0)) {
                    best = {
                        parent: link,
                        leaf: subLink,
                        score,
                        exact: pathname === subLink.to,
                    }
                }
            })
            return
        }

        if (!isPlaceholderLink(link.to)) {
            const score = scoreLeafMatch(pathname, link.to)
            if (score > (best?.score ?? 0)) {
                best = {
                    parent: null,
                    leaf: link,
                    score,
                    exact: pathname === link.to,
                }
            }
        }
    })

    return best
}

/**
 * Builds breadcrumb crumbs from the current route using sidebar + title mappings.
 * Home is handled separately by the UI (house icon).
 */
export const getBreadcrumbItems = (pathname) => {
    const normalizedPath = (pathname || '').replace(/\/+$/, '') || '/'
    const roleConfig = getRoleConfigForPath(normalizedPath)
    if (!roleConfig) return { homePath: '/', crumbs: [] }

    const currentTitle =
        getPageTitle(normalizedPath) ||
        formatSegmentLabel(getMeaningfulSegment(getPathParts(normalizedPath))) ||
        'Page'

    const best = findBestSidebarMatch(normalizedPath, roleConfig.links)
    const crumbs = []

    if (best?.parent && best.parent.title) {
        crumbs.push({
            label: best.parent.title,
            to: isPlaceholderLink(best.parent.to) ? null : best.parent.to,
        })
    }

    if (best?.leaf) {
        const isCurrentLeaf =
            best.exact ||
            normalizedPath === best.leaf.to ||
            currentTitle === best.leaf.title

        if (isCurrentLeaf && !normalizedPath.startsWith(`${best.leaf.to}/`)) {
            crumbs.push({
                label: currentTitle || best.leaf.title,
                to: null,
                isCurrent: true,
            })
        } else {
            crumbs.push({
                label: best.leaf.title,
                to: best.leaf.to,
            })
            crumbs.push({
                label: currentTitle,
                to: null,
                isCurrent: true,
            })
        }
    } else {
        crumbs.push({
            label: currentTitle,
            to: null,
            isCurrent: true,
        })
    }

    // Avoid Home > Same Page when already on the role home route
    if (normalizedPath === roleConfig.homePath && crumbs.length === 1) {
        return {
            homePath: roleConfig.homePath,
            crumbs,
        }
    }

    return {
        homePath: roleConfig.homePath,
        crumbs,
    }
}
