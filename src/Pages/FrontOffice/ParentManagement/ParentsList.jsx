import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { EllipsisIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import mo_user from '../../../assets/images/no-profile.png'
import { isApiStudentsEnabled } from '../../../services/apiClient'
import { listStaffParentsApi } from '../../../services/parentsStaffApi'
import { getParentsList, mapStaffParentApiRowToListRow } from './parentDatabaseData'

/** @typedef {'live' | 'api-off' | 'cached-api-failed' | 'empty-api-failed'} DataSource */

const ParentsList = () => {
    const [classFilter, setClassFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [search, setSearch] = useState('')
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    /** @type {[DataSource, function]} */
    const [dataSource, setDataSource] = useState(isApiStudentsEnabled() ? 'live' : 'api-off')
    const [reloadKey, setReloadKey] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [page, setPage] = useState(1)

    const loadParents = useCallback(async () => {
        setLoading(true)
        setError('')
        if (!isApiStudentsEnabled()) {
            const offline = getParentsList()
            setRows(offline)
            setDataSource('api-off')
            setLoading(false)
            return
        }
        try {
            const list = await listStaffParentsApi()
            const mapped = (Array.isArray(list) ? list : []).map((row) =>
                mapStaffParentApiRowToListRow(row, mo_user),
            )
            setRows(mapped)
            setDataSource('live')
            setError('')
        } catch (err) {
            const cached = getParentsList()
            setRows(cached)
            if (cached.length) {
                setDataSource('cached-api-failed')
                setError(
                    err?.message
                        || 'Could not load live campus parents. Showing offline/cached rows — not live API data.',
                )
            } else {
                setDataSource('empty-api-failed')
                setRows([])
                setError(err?.message || 'Could not load parents from the campus API. No offline cache available.')
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadParents()
    }, [loadParents, reloadKey])

    const classOptions = useMemo(
        () => [...new Set(rows.map((parent) => parent.className).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
        [rows],
    )

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        return rows.filter((parent) => {
            if (classFilter && parent.className !== classFilter) return false
            if (!query) return true
            const haystack = `${parent.parentId} ${parent.parentName} ${parent.email} ${parent.mobileNumber} ${parent.studentName} ${parent.admissionNumber} ${parent.className} ${parent.section} ${parent.studentId}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [rows, search, classFilter])

    useEffect(() => {
        setPage(1)
    }, [search, classFilter, pageSize, rows.length])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1)
    const safePage = Math.min(page, totalPages)
    const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
    const fromEntry = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
    const toEntry = Math.min(safePage * pageSize, filtered.length)
    const isCached = dataSource === 'cached-api-failed' || dataSource === 'api-off'

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setClassFilter('')
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <p className='text-sm text-[#667085]'>
                        One row per enrolled student with linked guardian contact (same live <code className='text-xs'>/parents</code> API as Teacher / Coordinator).
                    </p>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Parent name, student name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={classFilter}
                            onChange={(event) => setClassFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {classOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Parents List</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>

                {dataSource === 'live' ? (
                    <p className='text-xs text-[#027A48] bg-[#ECFDF3] rounded-lg px-3 py-2 mb-3'>
                        Live campus data from API.
                    </p>
                ) : null}
                {dataSource === 'api-off' ? (
                    <p className='text-xs text-[#B54708] bg-[#FFFAEB] rounded-lg px-3 py-2 mb-3'>
                        Campus students API is off. Showing offline/cached browser data — not live API data.
                    </p>
                ) : null}
                {error ? (
                    <div className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                        <span>
                            {dataSource === 'cached-api-failed' ? (
                                <>
                                    <strong>Offline / cached only.</strong> {error}
                                </>
                            ) : (
                                error
                            )}
                        </span>
                        {isApiStudentsEnabled() ? (
                            <button
                                type='button'
                                onClick={() => setReloadKey((k) => k + 1)}
                                className='shrink-0 text-sm px-3 py-1.5 rounded-md border border-[#B42318] text-[#B42318] hover:bg-[#B42318] hover:text-white transition-colors cursor-pointer'
                            >
                                Retry live API
                            </button>
                        ) : null}
                    </div>
                ) : null}

                {loading ? (
                    <p className='text-sm text-[#667085] py-6'>Loading campus parents…</p>
                ) : null}
                <div className='flex gap-x-2 items-center my-2'>
                    <select
                        className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'
                        value={pageSize}
                        onChange={(event) => setPageSize(Number(event.target.value) || 10)}
                    >
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                        <option value='40'>40</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Profile</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Parent ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Parent Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gender</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Email</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Mobile Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Linked Students</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={10} className='px-2 py-10 text-center text-[#667085]'>
                                        {rows.length
                                            ? 'No records match the filters.'
                                            : 'No parents yet. Each enrolled student appears as one row with guardian contact after Enroll.'}
                                    </td>
                                </tr>
                            )}
                            {pageRows.map((parent) => (
                                <tr key={`${parent.studentId || parent.id}-${parent.parentUserId || parent.email}`} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 object-cover flex justify-center rounded-s-lg'>
                                        <img src={parent.profileImage || mo_user} alt={parent.parentName} className='w-9 h-9 rounded-full object-cover' />
                                    </td>
                                    <td className='px-2 py-4'>{parent.parentId}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>
                                        {parent.parentName}
                                        {isCached ? (
                                            <span className='ml-2 text-[10px] uppercase tracking-wide text-[#B54708]'>Cached</span>
                                        ) : null}
                                    </td>
                                    <td className='px-2 py-4'>{parent.gender}</td>
                                    <td className='px-2 py-4'>{parent.email}</td>
                                    <td className='px-2 py-4'>{parent.mobileNumber}</td>
                                    <td className='px-2 py-4'>{parent.studentName}</td>
                                    <td className='px-2 py-4'>{parent.admissionNumber}</td>
                                    <td className='px-2 py-4'>{parent.studentCount}</td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink to={`/front-office/view-parent/${parent.studentId || parent.id}`} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                View
                                            </NavLink>
                                            <button type='button' onClick={() => setEditRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                Edit
                                            </button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    {filtered.length === 0
                        ? 'Showing 0 entries'
                        : `Showing ${fromEntry} to ${toEntry} of ${filtered.length} entries`}
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button
                        type='button'
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer'>
                        {safePage}
                    </button>
                    <button
                        type='button'
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='parents-list'
                rows={filtered}
                exportDescription={<>You are exporting {filtered.length} record(s).</>}
            />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
        </section>
    )
}

export default ParentsList
