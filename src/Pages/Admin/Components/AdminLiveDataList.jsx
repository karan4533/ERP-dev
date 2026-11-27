import React, { useEffect, useMemo, useState } from 'react'
import ListPagination from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import { filterListRows } from '../../../Common/listFiltering'

/**
 * Shared Admin list shell that always renders rows from a live loader (no hardcoded tbody).
 */
export default function AdminLiveDataList({
    title,
    description,
    columns,
    loadRows,
    searchKeys = [],
    addPath,
}) {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    useEffect(() => {
        let active = true
        setLoading(true)
        Promise.resolve()
            .then(() => loadRows())
            .then((data) => {
                if (!active) return
                setRows(Array.isArray(data) ? data : [])
                setError('')
            })
            .catch((err) => {
                if (!active) return
                setRows([])
                setError(err?.message || 'Live data could not be loaded.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => { active = false }
    }, [loadRows])

    const filtered = useMemo(
        () => filterListRows(rows, { search, searchKeys }),
        [rows, search, searchKeys],
    )
    const pagination = useListPagination(filtered, { resetKey: search })

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>{title}</h2>
                        {description ? <p className='text-sm text-[#667085] mt-1'>{description}</p> : null}
                    </div>
                    {addPath ? (
                        <a href={addPath} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md'>Add</a>
                    ) : null}
                </div>
                <div className='mt-4'>
                    <label className='text-sm font-medium text-[#808080]' htmlFor={`search-${title}`}>Search</label>
                    <input
                        id={`search-${title}`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='mt-1 text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-md'
                        placeholder='Search live records…'
                    />
                </div>
                {loading ? <p className='text-sm text-[#667085] mt-3'>Loading…</p> : null}
                {error ? <p className='text-sm text-[#B42318] mt-3'>{error}</p> : null}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                {columns.map((col, index) => (
                                    <th
                                        key={col.key}
                                        className={`px-2 py-3.5 text-[#0C1E5B] font-medium uppercase ${index === 0 ? 'rounded-s-lg' : ''} ${index === columns.length - 1 ? 'rounded-e-lg' : ''}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className='px-2 py-8 text-center text-[#667085]'>
                                        {loading ? 'Loading…' : emptyListMessage(rows.length)}
                                    </td>
                                </tr>
                            ) : pagination.rows.map((row, index) => (
                                <tr key={row.id || row.key || index} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    {columns.map((col) => (
                                        <td key={col.key} className='px-2 py-4 text-[#667085]'>
                                            {col.render ? col.render(row) : (row[col.key] ?? '—')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <ListPagination pagination={pagination} showPageSize className='px-0' />
            </div>
        </section>
    )
}
