/**
 * Node unit tests for src/Common/listPagination.js (no React).
 * Run: node --test backend/scripts/_test_list_pagination.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    describePageRange,
    emptyListMessage,
    pageWindow,
    paginateRows,
} from '../../src/Common/listPagination.js'

const rows = Array.from({ length: 23 }, (_, i) => ({ id: i + 1 }))

describe('paginateRows', () => {
    it('returns the first page with range metadata', () => {
        const got = paginateRows(rows, 1, 10)
        assert.deepEqual(got.rows.map((r) => r.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        assert.equal(got.total, 23)
        assert.equal(got.totalPages, 3)
        assert.equal(got.from, 1)
        assert.equal(got.to, 10)
        assert.equal(got.hasPrev, false)
        assert.equal(got.hasNext, true)
    })

    it('returns a partial last page', () => {
        const got = paginateRows(rows, 3, 10)
        assert.deepEqual(got.rows.map((r) => r.id), [21, 22, 23])
        assert.equal(got.from, 21)
        assert.equal(got.to, 23)
        assert.equal(got.hasNext, false)
        assert.equal(got.hasPrev, true)
    })

    it('clamps a page beyond the end to the last page', () => {
        const got = paginateRows(rows, 9, 10)
        assert.equal(got.page, 3)
        assert.equal(got.rows.length, 3)
    })

    it('clamps zero / negative / garbage page numbers to 1', () => {
        assert.equal(paginateRows(rows, 0, 10).page, 1)
        assert.equal(paginateRows(rows, -4, 10).page, 1)
        assert.equal(paginateRows(rows, 'x', 10).page, 1)
    })

    it('falls back to page size 10 for invalid sizes', () => {
        assert.equal(paginateRows(rows, 1, 0).pageSize, 10)
        assert.equal(paginateRows(rows, 1, 'abc').rows.length, 10)
    })

    it('handles empty and non-array input', () => {
        for (const input of [[], null, undefined, 'nope']) {
            const got = paginateRows(input, 2, 10)
            assert.deepEqual(got.rows, [])
            assert.equal(got.total, 0)
            assert.equal(got.totalPages, 1)
            assert.equal(got.page, 1)
            assert.equal(got.from, 0)
            assert.equal(got.to, 0)
            assert.equal(got.hasPrev, false)
            assert.equal(got.hasNext, false)
        }
    })

    it('does not mutate the source rows', () => {
        const copy = rows.slice()
        paginateRows(rows, 2, 5)
        assert.deepEqual(rows, copy)
    })
})

describe('pageWindow', () => {
    it('centres the current page', () => {
        assert.deepEqual(pageWindow(5, 10), [3, 4, 5, 6, 7])
    })

    it('pins to the start and end', () => {
        assert.deepEqual(pageWindow(1, 10), [1, 2, 3, 4, 5])
        assert.deepEqual(pageWindow(10, 10), [6, 7, 8, 9, 10])
    })

    it('shrinks when there are fewer pages than the window', () => {
        assert.deepEqual(pageWindow(2, 3), [1, 2, 3])
        assert.deepEqual(pageWindow(1, 1), [1])
    })
})

describe('describePageRange', () => {
    it('describes a populated page', () => {
        assert.equal(describePageRange(paginateRows(rows, 2, 10)), 'Showing 11 to 20 of 23 entries')
    })

    it('describes an empty list', () => {
        assert.equal(describePageRange(paginateRows([], 1, 10)), 'Showing 0 entries')
        assert.equal(describePageRange(), 'Showing 0 entries')
    })
})

describe('emptyListMessage', () => {
    it('distinguishes no data from filtered-out data', () => {
        assert.equal(emptyListMessage(0), 'No records yet.')
        assert.equal(emptyListMessage(5), 'No records match the filters.')
    })
})
