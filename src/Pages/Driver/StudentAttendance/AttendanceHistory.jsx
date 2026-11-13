import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, Moon, Sun } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    ATTENDANCE_HISTORY,
    MARKED_STATUSES,
    filterAttendanceHistory,
    markedStatusBadgeColor,
} from './attendanceHistoryData'
import { ATTENDANCE_PERIODS, ATTENDANCE_PHASES, SCHOOL_NAME } from './studentAttendanceData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const AttendanceHistory = () => {
    const [period, setPeriod] = useState('Morning')
    const [phase, setPhase] = useState('pickup')
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [timeframe, setTimeframe] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)

    const phaseOptions = ATTENDANCE_PHASES[period]
    const activePhase = phaseOptions.find((item) => item.key === phase)

    const filteredRecords = useMemo(() => filterAttendanceHistory({
        records: ATTENDANCE_HISTORY,
        search,
        period,
        phase: phase.charAt(0).toUpperCase() + phase.slice(1),
        status,
        fromDate,
        toDate,
    }), [search, period, phase, status, fromDate, toDate])

    const handlePeriodChange = (nextPeriod) => {
        setPeriod(nextPeriod)
        setPhase(ATTENDANCE_PHASES[nextPeriod][0].key)
    }

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setTimeframe('')
        setFromDate(null)
        setToDate(null)
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center md:flex-row flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select
                        value={timeframe}
                        onChange={(event) => setTimeframe(event.target.value)}
                        className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs'
                    >
                        <option value=''>From Beginning</option>
                        <option value='week'>This Week</option>
                        <option value='month'>This Month</option>
                    </select>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='history-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='history-search'
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Student ID, name, bus stop...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status-filter'
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {MARKED_STATUSES.map((item) => (
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
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                dateFormat='dd-MM-yyyy'
                                placeholderText='Select date'
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
                                dateFormat='dd-MM-yyyy'
                                placeholderText='Select date'
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4'>
                    <h2 className='text-xl font-semibold text-black'>Attendance History</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer uppercase'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>

                <div className='rounded-xl border border-[#EDEEF5] bg-[#FAFBFF] p-4 mb-4 space-y-4'>
                    <div className='flex flex-wrap gap-2'>
                        {ATTENDANCE_PERIODS.map((item) => (
                            <button
                                key={item}
                                type='button'
                                onClick={() => handlePeriodChange(item)}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                                    period === item
                                        ? 'bg-[#515DEF] text-white shadow-sm'
                                        : 'bg-white text-[#515DEF] border border-[#515DEF33] hover:bg-[#515DEF0D]'
                                }`}
                            >
                                {item === 'Morning' ? <Sun size={16} /> : <Moon size={16} />}
                                {item}
                                {' '}
                                Attendance
                            </button>
                        ))}
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        {phaseOptions.map((item) => (
                            <button
                                key={item.key}
                                type='button'
                                onClick={() => setPhase(item.key)}
                                className={`text-left rounded-xl px-4 py-3 border transition-all cursor-pointer ${
                                    phase === item.key
                                        ? 'bg-[#515DEF] text-white border-[#515DEF] shadow-sm'
                                        : 'bg-white text-[#1E1E1E] border-[#D9D9D9] hover:border-[#515DEF66]'
                                }`}
                            >
                                <p className='font-semibold text-sm'>{item.label} Attendance</p>
                                <p className={`text-xs mt-0.5 ${phase === item.key ? 'text-white/85' : 'text-[#667085]'}`}>
                                    {item.subtitle}
                                </p>
                            </button>
                        ))}
                    </div>

                    <p className='text-sm text-[#667085]'>
                        Showing marked records for
                        {' '}
                        <span className='font-medium text-[#1E1E1E]'>{period}</span>
                        {' '}
                        ·
                        {' '}
                        <span className='font-medium text-[#1E1E1E]'>{activePhase?.label}</span>
                        {period === 'Morning' && phase === 'pickup' && ' at each student\'s bus stop'}
                        {period === 'Morning' && phase === 'drop' && ` at ${SCHOOL_NAME}`}
                        {period === 'Evening' && phase === 'pickup' && ` at ${SCHOOL_NAME}`}
                        {period === 'Evening' && phase === 'drop' && ' at each student\'s bus stop'}
                        .
                    </p>
                </div>

                <div className='flex gap-x-2 items-center mb-4'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md text-sm'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm text-[#515DEF]'>Entries Per Page</span>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left min-w-[1100px]'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Date</th>
                                <th className={thClass}>Student ID</th>
                                <th className={thClass}>Student Name</th>
                                <th className={thClass}>Class & Section</th>
                                <th className={thClass}>Bus Stop</th>
                                <th className={thClass}>Location</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Marked At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        No marked attendance records found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>
                                            {record.attendanceDate}
                                        </td>
                                        <td className={tdClass}>{record.studentId}</td>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{record.studentName}</td>
                                        <td className={tdClass}>{record.classSection}</td>
                                        <td className={tdClass}>{record.busStop}</td>
                                        <td className={`${tdClass} max-w-[220px] truncate`} title={record.location}>
                                            {record.location}
                                        </td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${markedStatusBadgeColor[record.status]}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} rounded-e-lg`}>{record.markedAt}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
                    <p className='text-sm font-medium text-[#515DEF]'>
                        Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
                    </p>
                    <div className='flex items-center gap-2'>
                        <button type='button' className='size-8 flex items-center justify-center rounded-full border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                            <ChevronLeft size={16} />
                        </button>
                        <button type='button' className='size-8 flex items-center justify-center rounded-full bg-[#515DEF] text-white text-sm font-medium cursor-pointer'>
                            1
                        </button>
                        <button type='button' className='size-8 flex items-center justify-center rounded-full border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default AttendanceHistory
