import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'react-toastify'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { useAuth } from '../../../context/AuthContext'
import {
    ATTENDANCE_STATUSES,
    MY_ATTENDANCE_LIST,
    statusBadgeColor,
} from './myAttendanceData'
import { canUseMyAttendanceApi, loadMyAttendanceBundle } from '../../../services/myAttendanceApi'

const parseLooseDate = (value) => {
    if (!value) return null
    const direct = new Date(value)
    if (!Number.isNaN(direct.getTime())) return direct
    const parts = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (!parts) return null
    const parsed = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]))
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const emptyMessageForLink = (linkStatus) => {
    if (linkStatus === 'unlinked') {
        return 'Your login is not linked to an HR employee record (user_id / matching email). Attendance stays empty until HR links this account — no other staff punches are shown.'
    }
    if (linkStatus === 'linked_empty') {
        return 'Your staff profile is linked, but there are no attendance punches for your employee id yet.'
    }
    return 'No attendance rows for this filter.'
}

const MyAttendance = () => {
    const { email: sessionEmail } = useAuth()
    const api = canUseMyAttendanceApi()
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [rows, setRows] = useState(() => (api ? [] : MY_ATTENDANCE_LIST))
    const [loading, setLoading] = useState(api)
    const [error, setError] = useState('')
    const [mode, setMode] = useState(api ? 'api' : 'demo')
    const [linkStatus, setLinkStatus] = useState('unknown')
    const [linkedEmployeeId, setLinkedEmployeeId] = useState(null)

    const refresh = async () => {
        if (!api) {
            setRows(MY_ATTENDANCE_LIST)
            setMode('demo')
            setLinkStatus('unknown')
            setLinkedEmployeeId(null)
            setLoading(false)
            setError('')
            return
        }
        setLoading(true)
        setError('')
        try {
            const bundle = await loadMyAttendanceBundle(sessionEmail)
            setRows(bundle.records)
            setLinkStatus(bundle.linkStatus)
            setLinkedEmployeeId(bundle.linkedEmployeeId)
            setMode('api')
        } catch (err) {
            const message = err?.message || 'Could not load your attendance.'
            setError(message)
            setRows([])
            setLinkStatus('unknown')
            setLinkedEmployeeId(null)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, sessionEmail])

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('')
        setFromDate(null)
        setToDate(null)
    }

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        const fromTime = fromDate
            ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime()
            : null
        const toTime = toDate
            ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999).getTime()
            : null

        return rows.filter((record) => {
            if (statusFilter && record.attendanceStatus !== statusFilter) return false
            if (query) {
                const haystack = `${record.employeeId} ${record.name}`.toLowerCase()
                if (!haystack.includes(query)) return false
            }
            if (fromTime != null || toTime != null) {
                const day = parseLooseDate(record.date)
                if (!day) return false
                const t = day.getTime()
                if (fromTime != null && t < fromTime) return false
                if (toTime != null && t > toTime) return false
            }
            return true
        })
    }, [rows, search, statusFilter, fromDate, toDate])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <p className='text-sm text-[#667085]'>
                        {mode === 'api'
                            ? `Your own HR attendance only (GET /hr/attendance/mine).${linkedEmployeeId ? ` Linked employee: ${linkedEmployeeId}.` : ' No HrEmployee link for this login.'}`
                            : 'Local demo rows (API sign-in unavailable).'}
                    </p>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Employee ID, name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Attendance Status</label>
                        <select
                            id='status-filter'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {ATTENDANCE_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
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
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
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
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>My Attendance List</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Employee ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>In Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Out Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Attendance Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className='px-2 py-8 text-center text-[#667085]'>Loading your attendance…</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className='px-2 py-8 text-center'>
                                        <p className='text-[#B42318] font-medium'>Could not load attendance</p>
                                        <p className='text-sm text-[#667085] mt-1'>{error}</p>
                                        <button
                                            type='button'
                                            onClick={refresh}
                                            className='mt-3 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'
                                        >
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='px-2 py-8 text-center text-[#667085]'>
                                        {mode === 'api' ? emptyMessageForLink(linkStatus) : 'No attendance rows for this filter.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.employeeId}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.name}</td>
                                        <td className='px-2 py-4'>{record.date}</td>
                                        <td className='px-2 py-4'>{record.inTime}</td>
                                        <td className='px-2 py-4'>{record.outTime}</td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.attendanceStatus] || 'bg-[#66708533] text-[#667085]'}`}>
                                                {record.attendanceStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    {loading || error ? '' : `Showing ${filtered.length} of ${rows.length} entries`}
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='director-my-attendance'
                title='My Attendance'
                rows={filtered.map((row) => ({
                    employee_id: row.employeeId,
                    name: row.name,
                    date: row.date,
                    in_time: row.inTime,
                    out_time: row.outTime,
                    status: row.attendanceStatus,
                }))}
                exportDescription={<>You are exporting {filtered.length} record(s).</>}
            />
        </section>
    )
}

export default MyAttendance
