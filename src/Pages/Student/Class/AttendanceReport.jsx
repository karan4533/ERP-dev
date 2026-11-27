import React, { useEffect, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { studentAttendanceCalendarApi } from '../../../services/attendanceApi'
import PlacementAwaitingNotice, { isStudentPlaced } from './Components/PlacementAwaitingNotice'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const statusLabel = {
    P: 'Present',
    A: 'Absent',
    H: 'Holiday',
}

const AttendanceReport = () => {
    const { activeStudent } = useActiveStudent()
    const [selectMonth, setSelectMonth] = useState(new Date())
    const [statusFilter, setStatusFilter] = useState('')
    const [calendar, setCalendar] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [entriesPerPage, setEntriesPerPage] = useState(10)

    const placed = isStudentPlaced(activeStudent)

    useEffect(() => {
        if (!placed || !activeStudent?.id || !selectMonth) {
            setCalendar({})
            return undefined
        }
        if (!isApiAuthEnabled() || !getAccessToken()) {
            setCalendar({})
            setError('Sign in to load attendance.')
            return undefined
        }
        let cancelled = false
        setLoading(true)
        setError('')
        const year = selectMonth.getFullYear()
        const month = selectMonth.getMonth() + 1
        studentAttendanceCalendarApi(activeStudent.id, year, month)
            .then((data) => {
                if (!cancelled) setCalendar(data && typeof data === 'object' ? data : {})
            })
            .catch((err) => {
                if (!cancelled) {
                    setCalendar({})
                    setError(err.message || 'Could not load attendance report.')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [placed, activeStudent?.id, selectMonth])

    const rows = useMemo(() => {
        return Object.entries(calendar)
            .map(([dateKey, code]) => {
                const d = new Date(`${dateKey}T12:00:00`)
                return {
                    dateKey,
                    dateLabel: Number.isNaN(d.getTime())
                        ? dateKey
                        : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    day: Number.isNaN(d.getTime()) ? '—' : DAY_NAMES[d.getDay()],
                    status: statusLabel[code] || code || '—',
                    code,
                }
            })
            .filter((row) => !statusFilter || row.code === statusFilter)
            .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    }, [calendar, statusFilter])

    const pageRows = rows.slice(0, entriesPerPage)

    if (!placed) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-xl font-medium text-black mb-2'>Attendance Report</h2>
                    <PlacementAwaitingNotice
                        studentName={activeStudent?.name}
                        featureLabel='attendance reports'
                    />
                </div>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mt-2'>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Select Month</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={selectMonth}
                                onChange={(date) => setSelectMonth(date || new Date())}
                                showMonthYearPicker
                                dateFormat='MMMM yyyy'
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        >
                            <option value=''>All</option>
                            <option value='P'>Present</option>
                            <option value='A'>Absent</option>
                            <option value='H'>Holiday</option>
                        </select>
                    </div>

                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-3 rounded-lg'
                    >
                        Download Report
                    </button>

                    <button
                        type='button'
                        onClick={() => { setStatusFilter(''); setSelectMonth(new Date()) }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-3 rounded-lg'
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <h2 className='text-xl font-medium text-black mb-4'>Attendance Report List</h2>
                {error && <p className='text-sm text-[#B54708] mb-3'>{error}</p>}
                <div className='flex gap-x-2 items-center my-2'>
                    <select
                        value={entriesPerPage}
                        onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                        className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'
                    >
                        {[10, 20, 30, 40, 50].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5]'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Day</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={4} className='px-2 py-10 text-center text-[#667085]'>Loading…</td>
                                </tr>
                            )}
                            {!loading && pageRows.length === 0 && (
                                <tr>
                                    <td colSpan={4} className='px-2 py-10 text-center text-[#667085]'>
                                        No attendance marked for this month yet.
                                    </td>
                                </tr>
                            )}
                            {!loading && pageRows.map((row) => (
                                <tr key={row.dateKey} className='border-b text-[#667085] border-[#f2f4f7]'>
                                    <td className='px-2 py-4'>{row.dateLabel}</td>
                                    <td className='px-2 py-4'>{row.status}</td>
                                    <td className='px-2 py-4'>{row.day}</td>
                                    <td className='px-2 py-4'>
                                        {row.code === 'H' ? 'Holiday / non-working day' : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className='text-sm font-medium text-[#515DEF] mt-4'>
                    Showing {pageRows.length === 0 ? 0 : 1} to {pageRows.length} of {rows.length} entries
                </p>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='attendance-report'
                rows={rows}
                exportDescription={<>You are exporting {rows.length} record(s).</>}
            />
        </section>
    )
}

export default AttendanceReport
