import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const tableModule = await import('../dataTableState.js').catch(() => null)

test('table state serializes to stable URL parameters and omits empty values', () => {
    assert.ok(tableModule, 'the data-table state module should be importable')
    const { serializeTableState } = tableModule
    const query = serializeTableState({
        query: '  Priya  ',
        page: 2,
        pageSize: 25,
        sortBy: 'name',
        sortDirection: 'desc',
        filters: { status: 'Active', className: '', academicYear: '2026-27' },
    })

    assert.equal(query, 'q=Priya&page=2&pageSize=25&sort=name&direction=desc&filter.academicYear=2026-27&filter.status=Active')
})

test('table state parses defensively with bounded numeric defaults', () => {
    const { parseTableState } = tableModule

    assert.deepEqual(parseTableState('?q=fees&page=-4&pageSize=999&sort=amount&direction=nope&filter.status=Due'), {
        query: 'fees',
        page: 1,
        pageSize: 100,
        sortBy: 'amount',
        sortDirection: 'asc',
        filters: { status: 'Due' },
    })
})

test('pagination returns a bounded page and complete metadata', () => {
    const { paginateRows } = tableModule
    const rows = Array.from({ length: 23 }, (_, index) => ({ id: index + 1 }))

    assert.deepEqual(paginateRows(rows, { page: 4, pageSize: 10 }), {
        rows: [{ id: 21 }, { id: 22 }, { id: 23 }],
        page: 3,
        pageSize: 10,
        pageCount: 3,
        total: 23,
        from: 21,
        to: 23,
    })
})

test('column visibility keeps required columns and toggles optional columns', () => {
    const { toggleVisibleColumn } = tableModule
    const columns = [
        { key: 'name', required: true },
        { key: 'status' },
        { key: 'owner' },
    ]

    assert.deepEqual(toggleVisibleColumn(['name', 'status'], 'owner', columns), ['name', 'status', 'owner'])
    assert.deepEqual(toggleVisibleColumn(['name', 'status'], 'status', columns), ['name'])
    assert.deepEqual(toggleVisibleColumn(['name', 'status'], 'name', columns), ['name', 'status'])
})

test('selection toggles a row or the complete visible page without duplicates', () => {
    const { toggleRowSelection, togglePageSelection } = tableModule

    assert.deepEqual(toggleRowSelection(['a'], 'b'), ['a', 'b'])
    assert.deepEqual(toggleRowSelection(['a', 'b'], 'a'), ['b'])
    assert.deepEqual(togglePageSelection(['outside'], ['a', 'b']), ['outside', 'a', 'b'])
    assert.deepEqual(togglePageSelection(['outside', 'a', 'b'], ['a', 'b']), ['outside'])
})

test('the shared register pilot uses controlled data components and URL state', async () => {
    const source = await readFile(new URL('../../demoDomain/RegisterPage.jsx', import.meta.url), 'utf8')

    assert.match(source, /<DataToolbar/)
    assert.match(source, /<DataTable/)
    assert.match(source, /<Pagination/)
    assert.match(source, /serializeTableState/)
    assert.doesNotMatch(source, /filtered\.slice\(0/)
    assert.doesNotMatch(source, /<table/)
})
