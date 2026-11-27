import React, { useEffect, useMemo, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import AttendanceOverviewSection from '../Components/AttendanceOverviewSection'
import {
    filterStudentAttendance,
    statusBadgeColor,
} from '../../../Admin/Attendance/Students/studentAttendanceData'
import {
    canUseAdminAttendanceApi,
    findLatestStudentAttendanceDate,
    loadStudentAttendance,
    loadStudentAttendanceDailyTrend,
    toIsoDate,
} from '../../../../services/adminAttendanceApi'
import { useAttendanceQuery } from '../../../Admin/Attendance/useAttendanceQuery'

const emptyFilters = { search: '', className: '', section: '' }

const parseIsoDate = (iso) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
}

const StudentsList = () => {
    const [filters, setFilters] = useState(emptyFilters)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [dailyTrend, setDailyTrend] = useState({ labels: [], rates: [] })
    const [bootstrapping, setBootstrapping] = useState(true)
    const didAutoPickDate = useRef(false)

    const apiMode = canUseAdminAttendanceApi()
    const selectedIso = selectedDate ? toIsoDate(selectedDate) : toIsoDate(new Date())

    // On first open, jump to the latest day that has marks so the table is not empty on "today".
    useEffect(() => {
        if (!apiMode || didAutoPickDate.current) {
            setBootstrapping(false)
            return undefined
        }
        let cancelled = false
        ;(async () => {
            try {
                const latest = await findLatestStudentAttendanceDate({ lookback: 21 })
                if (cancelled) return
                const parsed = parseIsoDate(latest)
                if (parsed) setSelectedDate(parsed)
            } finally {
                if (!cancelled) {
                    didAutoPickDate.current = true
                    setBootstrapping(false)
                }
            }
        })()
        return () => { cancelled = true }
    }, [apiMode])

    useEffect(() => {
        if (!apiMode) return undefined
        let cancelled = false
        loadStudentAttendanceDailyTrend({ days: 7 })
            .then((trend) => {
                if (!cancelled) setDailyTrend(trend)
            })
            .catch(() => {
                if (!cancelled) setDailyTrend({ labels: [], rates: [] })
            })
        return () => { cancelled = true }
    }, [apiMode, selectedIso])

    const query = useAttendanceQuery(apiMode && !bootstrapping, loadStudentAttendance, {
        date: selectedIso,
        className: filters.className,
        section: filters.section,
    })
    const classOptions = query.options?.classOptions ?? []
    const sectionOptions = query.options?.sectionOptions ?? []
    const apiRecords = query.data?.records
    const warnings = query.data?.warnings || []

    const filteredRecords = useMemo(
        () => filterStudentAttendance(apiRecords ?? [], { search: filters.search }),
        [apiRecords, filters.search],
    )

    const clearFilters = () => {
        setFilters(emptyFilters)
        // Keep the auto-picked (or user-chosen) date — only reset search / class / section.
    }

    if (!apiMode) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>Student Attendance</h2>
                <p className='text-sm text-[#667085] mt-2 max-w-lg mx-auto'>
                    Live attendance API is off for this session. Sign in with a campus API account to view real marks — demo rows are not shown.
                </p>
            </section>
        )
    }

    const loading = bootstrapping || query.status === 'loading'

    return (
        <section className='space-y-6'>
            <AttendanceOverviewSection
                records={filteredRecords}
                groupKey='className'
                groupChartTitle='Class-wise Attendance Rate'
                dailyTrend={dailyTrend}
                trendTitle='Student attendance (last 7 days)'
            />

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4 mb-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={filters.search}
                            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                            placeholder='Admission no, student name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={filters.className}
                            onChange={(event) => setFilters((current) => ({ ...current, className: event.target.value }))}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Classes</option>
                            {classOptions.map((className) => (
                                <option key={className} value={className}>{className}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={filters.section}
                            onChange={(event) => setFilters((current) => ({ ...current, section: event.target.value }))}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Sections</option>
                            {sectionOptions.map((section) => (
                                <option key={section} value={section}>{section}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => {
                                    didAutoPickDate.current = true
                                    setSelectedDate(date || new Date())
                                }}
                                dateFormat='dd/MM/yyyy'
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Student Attendance</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Live marks from GET /attendance for {selectedIso}. Pick a class to include unmarked roster students.
                        </p>
                        {warnings.length ? (
                            <p className='text-xs text-[#B54708] mt-1'>{warnings.join(' ')}</p>
                        ) : null}
                    </div>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                {loading ? (
                    <div role='status' className='py-16 text-center text-sm text-[#667085]'>Loading attendance…</div>
                ) : query.status === 'error' ? (
                    <div role='alert' className='py-16 text-center'>
                        <h3 className='text-lg font-semibold text-[#B42318]'>Could not load attendance</h3>
                        <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>{query.error}</p>
                        <button type='button' onClick={query.reload} className='mt-4 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer'>
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Admission No</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Marked At</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>In / Out</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className='px-2 py-10 text-center text-[#667085]'>
                                            No attendance marks for this date/filter. Teachers mark class attendance first, or pick another date.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.admissionNo}</td>
                                            <td className='px-2 py-4'>{record.studentName}</td>
                                            <td className='px-2 py-4'>{record.className}</td>
                                            <td className='px-2 py-4'>{record.section}</td>
                                            <td className='px-2 py-4'>{record.markedAt}</td>
                                            <td className='px-2 py-4'>{record.inOut}</td>
                                            <td className='px-2 py-4 rounded-e-lg'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status] || 'bg-[#66708533] text-[#667085]'}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    {loading || query.status === 'error'
                        ? ''
                        : `Showing 1 to ${filteredRecords.length} of ${filteredRecords.length} entries`}
                </p>
                <div className='flex gap-x-2'>
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
                filename='super-admin-student-attendance'
                title='Student Attendance'
                rows={filteredRecords.map((row) => ({
                    admission_no: row.admissionNo,
                    student_name: row.studentName,
                    class: row.className,
                    section: row.section,
                    status: row.status,
                    date: selectedIso,
                }))}
                exportDescription={<>You are exporting {filteredRecords.length} record(s).</>}
            />
        </section>
    )
}

export default StudentsList
