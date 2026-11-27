/**
 * Node unit tests for the header page search (src/Common/CommonHeader/Components/globalSearchIndex.js).
 * Run: node --test backend/scripts/_test_global_search.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { flattenSidebarLinks, searchPages } from '../../src/Common/CommonHeader/Components/globalSearchIndex.js'
import {
    coordinatorSidebarLinks,
    stationeryStoreManagerSidebarLinks,
    teacherSidebarLinks,
} from '../../src/Common/CommonSidebar/Components/sidebarLinks.js'

describe('page search', () => {
    it('finds pages by title or menu section, title matches first', () => {
        const pages = flattenSidebarLinks(teacherSidebarLinks)
        const hits = searchPages(pages, 'mark')
        assert.equal(hits[0].title, 'Mark Entry')
        assert.ok(hits.every((page) => page.to.startsWith('/teacher/')))
        assert.deepEqual(searchPages(pages, 'student mark').map((p) => p.title), ['Mark Entry'])
    })

    it('only searches the role’s own menu', () => {
        const teacher = flattenSidebarLinks(teacherSidebarLinks)
        const coordinator = flattenSidebarLinks(coordinatorSidebarLinks)
        assert.deepEqual(searchPages(teacher, 'approval'), [])
        assert.ok(searchPages(coordinator, 'approval').some((p) => p.title === 'Mark Entry Approval'))
        assert.equal(searchPages(teacher, 'section assignment').length, 0)
        assert.ok(searchPages(flattenSidebarLinks(stationeryStoreManagerSidebarLinks), 'leave').some((p) => p.to.startsWith('/stationery-store-manager/')))
    })

    it('skips group headers, de-duplicates and handles empty queries', () => {
        const pages = flattenSidebarLinks([
            { title: 'Group', to: '#0', subLinks: [{ title: 'A Page', to: '/x/a' }] },
            { title: 'A Page', to: '/x/a' },
        ])
        assert.deepEqual(pages.map((p) => p.to), ['/x/a', '/x/a'])
        assert.equal(searchPages(pages, 'page').length, 1)
        assert.deepEqual(searchPages(pages, '   '), [])
        assert.deepEqual(searchPages(pages, 'zzz'), [])
    })
})
