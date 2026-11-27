import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
    canUseClassDetailsApi,
    listSubjects,
} from '../../../services/classDetailsApi'

const Subjects = () => {
    const apiMode = canUseClassDetailsApi()
    const [status, setStatus] = useState(apiMode ? 'loading' : 'idle')
    const [rows, setRows] = useState([])
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    const reload = useCallback(() => setReloadKey((key) => key + 1), [])

    useEffect(() => {
        if (!apiMode) {
            setStatus('offline')
            setRows([])
            return undefined
        }
        let cancelled = false
        setStatus('loading')
        listSubjects()
            .then((list) => {
                if (cancelled) return
                setRows(list)
                setError('')
                setStatus('ready')
            })
            .catch((loadError) => {
                if (cancelled) return
                setStatus('error')
                setError(loadError?.message || 'Could not load subjects.')
            })
        return () => { cancelled = true }
    }, [apiMode, reloadKey])

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return rows
        return rows.filter((row) => (
            row.name.toLowerCase().includes(query)
            || row.code.toLowerCase().includes(query)
        ))
    }, [rows, search])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            reload()
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <NavLink
                        to='/admin/class/add-subjects'
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer inline-flex items-center gap-2 justify-center'
                    >
                        <Plus size={16} />
                        Add Subject
                    </NavLink>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Subject name or code'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                </div>

                {!apiMode && (
                    <p className='mt-6 text-sm text-[#980E0F]'>
                        Sign in with API auth enabled to manage campus subjects (`/masters/subjects`).
                    </p>
                )}
                {status === 'loading' && <p className='mt-6 text-sm text-[#667085]'>Loading subjects…</p>}
                {status === 'error' && (
                    <div className='mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                        {error}
                        <button type='button' className='ml-3 underline' onClick={reload}>Retry</button>
                    </div>
                )}

                {apiMode && status === 'ready' && (
                    <div className='mt-8'>
                        <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                            <h2 className='text-xl font-medium text-black'>Subjects List</h2>
                            <button
                                type='button'
                                onClick={() => {
                                    reload()
                                    toast.info('Subjects refreshed.')
                                }}
                                className='text-sm text-[#515DEF] underline'
                            >
                                Refresh
                            </button>
                        </div>
                        <div className='relative overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                    <tr>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Code</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Subject Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className='px-2 py-8 text-center text-[#667085]'>
                                                No subjects yet. Add one to use it in timetables and exams.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((row) => (
                                            <tr key={row.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                                <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{row.code}</td>
                                                <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-e-lg'>{row.name}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className='flex justify-between items-center px-2 mt-4'>
                            <p className='text-sm font-medium text-[#515DEF]'>
                                Showing {filtered.length} of {rows.length} entries
                            </p>
                            <div className='flex justify-center gap-x-2'>
                                <span className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full'>
                                    <ChevronLeft size={16} />
                                </span>
                                <span className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full'>
                                    1
                                </span>
                                <span className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full'>
                                    <ChevronRight size={16} />
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default Subjects
