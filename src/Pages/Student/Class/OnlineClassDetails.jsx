import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import PlacementAwaitingNotice, { isStudentPlaced } from './Components/PlacementAwaitingNotice'
import { matchesStudentClass } from './studentClassMatch'
import {
    getOnlineClasses,
    hydrateOnlineClassesFromApi,
    ONLINE_CLASS_STATUSES,
    statusBadgeColor,
} from '../../Teacher/OnlineClass/onlineClassData'
import { canUseAcademicsApi } from '../../../services/academicsApi'

const parseLooseDate = (value) => {
    if (!value) return null
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
    const parts = String(value).split(/[-/]/)
    if (parts.length === 3) {
        const [a, b, c] = parts.map(Number)
        // dd-mm-yyyy or yyyy-mm-dd
        if (String(parts[0]).length === 4) return new Date(a, b - 1, c)
        return new Date(c, b - 1, a)
    }
    return null
}

const OnlineClassDetails = () => {
    const { activeStudent } = useActiveStudent()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)

    const placed = isStudentPlaced(activeStudent)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError('')
        ;(async () => {
            if (canUseAcademicsApi()) {
                const ok = await hydrateOnlineClassesFromApi()
                if (!ok && !cancelled) setError('Could not load online classes from the campus API.')
            }
            if (!cancelled) {
                setRows(getOnlineClasses())
                setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [activeStudent?.id])

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        return rows.filter((row) => {
            if (!matchesStudentClass(row, activeStudent)) return false
            if (status && String(row.status || '') !== status) return false
            if (query) {
                const hay = `${row.subject} ${row.topic} ${row.teacherName} ${row.meetingPlatform}`.toLowerCase()
                if (!hay.includes(query)) return false
            }
            const when = parseLooseDate(row.date)
            if (fromDate && when) {
                const start = new Date(fromDate)
                start.setHours(0, 0, 0, 0)
                if (when < start) return false
            }
            if (toDate && when) {
                const end = new Date(toDate)
                end.setHours(23, 59, 59, 999)
                if (when > end) return false
            }
            return true
        })
    }, [rows, activeStudent, search, status, fromDate, toDate])

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <p className='text-sm text-[#667085]'>
                        {activeStudent?.className
                            ? `Showing online classes for ${activeStudent.className}${activeStudent.section ? `-${activeStudent.section}` : ''}`
                            : 'Select a student class to filter online classes'}
                    </p>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Subject, topic, teacher…'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {ONLINE_CLASS_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <h2 className='text-xl font-medium text-black mb-4'>Online Class List</h2>
                {!placed && (
                    <PlacementAwaitingNotice
                        studentName={activeStudent?.name}
                        featureLabel='online classes'
                    />
                )}
                {placed && error && <p className='text-sm text-[#B54708] mb-3'>{error}</p>}
                {placed && loading && <p className='text-sm text-[#667085] py-8 text-center'>Loading…</p>}
                {placed && !loading && (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                                <tr>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Class</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Teacher</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Link</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className='px-2 py-10 text-center text-[#667085]'>
                                            No online classes published for your class yet.
                                        </td>
                                    </tr>
                                )}
                                {filtered.map((row) => (
                                    <tr key={row.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4'>
                                            {row.className}{row.section ? `-${row.section}` : ''}
                                        </td>
                                        <td className='px-2 py-4'>{row.subject || '—'}</td>
                                        <td className='px-2 py-4'>{row.teacherName || row.createdBy || '—'}</td>
                                        <td className='px-2 py-4'>{row.date || '—'}</td>
                                        <td className='px-2 py-4'>{row.startTime || '—'}</td>
                                        <td className='px-2 py-4'>{row.endTime || '—'}</td>
                                        <td className='px-2 py-4'>
                                            {row.meetingLink ? (
                                                <a
                                                    href={row.meetingLink}
                                                    target='_blank'
                                                    rel='noreferrer'
                                                    className='text-[#515DEF] hover:underline break-all'
                                                >
                                                    Join
                                                </a>
                                            ) : '—'}
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                                {row.status || '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {placed && !loading && (
                    <p className='text-sm font-medium text-[#515DEF] mt-4'>
                        Showing {filtered.length} of {filtered.length} entries
                    </p>
                )}
            </div>
        </section>
    )
}

export default OnlineClassDetails
