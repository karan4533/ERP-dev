import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { roleBasedSidebarLinks } from '../../CommonSidebar/Components/sidebarLinks.js'

const sourceRoot = new URL('../../../', import.meta.url)

const walk = (directory) => readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
})

const routeFiles = walk(join(sourceRoot.pathname.slice(1), 'routes'))
    .filter((path) => /Routes?\.(jsx?|tsx?)$/i.test(path))

const sharedRouteFiles = walk(join(sourceRoot.pathname.slice(1), 'Common'))
    .filter((path) => /Routes?\.(jsx?|tsx?)$/i.test(path))

const routePatterns = [...routeFiles, ...sharedRouteFiles].flatMap((path) => {
    const source = readFileSync(path, 'utf8')
    return [
        ...[...source.matchAll(/<Route\s+path=["']([^"']+)["']/g)].map((match) => match[1]),
        ...[...source.matchAll(/<Route\s+path=\{`([^`]+)`\}/g)].map((match) => match[1]),
        ...[...source.matchAll(/["'](\/[^"']+)["']/g)].map((match) => match[1]),
    ]
})

const portalConfigPatterns = [
    join(sourceRoot.pathname.slice(1), 'Pages', 'Student', 'StudentDeliverables', 'studentDeliverablesConfig.js'),
    join(sourceRoot.pathname.slice(1), 'Pages', 'Parent', 'parentPortalConfig.js'),
].flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/["'](\/[^"']+)["']/g)].map((match) => match[1]))

routePatterns.push(...portalConfigPatterns)

const flattenDestinations = (items = []) => items.flatMap((item) => [
    ...(item.to && item.to.startsWith('/') ? [item.to] : []),
    ...flattenDestinations(item.subLinks),
])

const matchesPattern = (destination, pattern) => {
    if (pattern === '*') return false
    if (/\$\{[^}]+\}/.test(pattern)) {
        const suffix = pattern.replace(/\$\{[^}]+\}/g, '')
        return destination.endsWith(suffix)
    }

    const expression = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/:[^/]+/g, '[^/]+')
        .replace(/\\\*/g, '.*')
    return new RegExp(`^${expression}$`).test(destination)
}

test('all 26 role navigation trees expose routed sidebar destinations', () => {
    const roles = Object.entries(roleBasedSidebarLinks)
    const distinctRoles = new Set(Object.values(roleBasedSidebarLinks))
    const destinations = roles.flatMap(([role, links]) => flattenDestinations(links).map((destination) => ({ role, destination })))
    const missing = destinations.filter(({ destination }) => !routePatterns.some((pattern) => matchesPattern(destination, pattern)))

    assert.equal(distinctRoles.size, 26)
    assert.ok(destinations.length >= 450)
    assert.deepEqual(missing, [])
})
