import React, { useEffect, useMemo, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import AttendanceOverviewSection from '../Components/AttendanceOverviewSection'
import {
    filterEmployeeAttendance,
    statusBadgeColor,
} from '../../../Admin/Attendance/Employees/employeeAttendanceData'
import { canUseAdminAttendanceApi, loadEmployeeAttendance, toIsoDate } from '../../../../services/adminAttendanceApi'
import { useAttendanceQuery } from '../../../Admin/Attendance/useAttendanceQuery'

const emptyFilters = { search: '', role: '', status: '' }
const noParams = {}

const parseIsoDate = (iso) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
}

const EmployeesList = () => {
    const [filters, setFilters] = useState(emptyFilters)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const didAutoPickDate = useRef(false)

    const apiMode = canUseAdminAttendanceApi()
    const query = useAttendanceQuery(apiMode, loadEmployeeAttendance, noParams)
    const apiRecords = query.data?.records
    const warnings = query.data?.warnings || []
    const dailyTrend = query.data?.dailyTrend || { labels: [], rates: [] }
    const selectedIso = selectedDate ? toIsoDate(selectedDate) : ''
    const roleOptions = query.options?.roleOptions ?? []
    const statusOptions = query.options?.statusOptions ?? []

    // Jump to the latest punch date so Super Admin sees live HR rows instead of an empty "today".
    useEffect(() => {
        if (!apiMode || didAutoPickDate.current || query.status !== 'ready') return
        const records = apiRecords ?? []
        if (!records.length) {
            didAutoPickDate.current = true
            return
        }
        const onSelected = selectedIso
            ? records.filter((record) => record.date === selectedIso)
            : records
        if (onSelected.length > 0) {
            didAutoPickDate.current = true
            return
        }
        const latest = [...new Set(records.map((record) => record.date).filter(Boolean))].sort().at(-1)
        const parsed = parseIsoDate(latest)
        if (parsed) {
            didAutoPickDate.current = true
            setSelectedDate(parsed)
        } else {
            didAutoPickDate.current = true
        }
    }, [apiMode, query.status, apiRecords, selectedIso])

    const filteredRecords = useMemo(() => {
        const onDate = (apiRecords ?? []).filter((record) => !selectedIso || record.date === selectedIso)
        return filterEmployeeAttendance(onDate, filters)
    }, [apiRecords, selectedIso, filters])

    const clearFilters = () => {
        setFilters(emptyFilters)
        setSelectedDate(null)
        didAutoPickDate.current = true
    }

    if (!apiMode) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>Employee Attendance</h2>
                <p className='text-sm text-[#667085] mt-2 max-w-lg mx-auto'>
                    Live HR attendance API is off for this session. Sign in with a campus API account to view real punches — demo rows are not shown.
                </p>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <AttendanceOverviewSection
                records={filteredRecords}
                groupKey='role'
                groupChartTitle='Role-wise Attendance Rate'
                dailyTrend={dailyTrend}
                trendTitle='Employee attendance (last 7 days)'
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
                            placeholder='Employee ID, name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='role-filter' className='text-base font-medium text-[#808080]'>Role</label>
                        <select
                            id='role-filter'
                            value={filters.role}
                            onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Roles</option>
                            {roleOptions.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={selectedDate}
                                onChange={setSelectedDate}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                placeholderText='All dates'
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status-filter'
                            value={filters.status}
                            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Status</option>
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Employee Attendance</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Live HR collection GET /hr/attendance joined to the employee directory. Clear the date to see all days.
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
                {query.status === 'loading' ? (
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
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Employee ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee Role</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Punch In Time</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Out Time</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className='px-2 py-10 text-center text-[#667085]'>
                                            No HR attendance punches for this filter. Rows appear when HR / biometric posts to the attendance collection.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.employeeId}</td>
                                            <td className='px-2 py-4'>{record.employeeName}</td>
                                            <td className='px-2 py-4'>{record.role}</td>
                                            <td className='px-2 py-4'>{record.date || '—'}</td>
                                            <td className='px-2 py-4'>{record.punchInTime}</td>
                                            <td className='px-2 py-4'>{record.punchOutTime}</td>
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

            <div className='flex justify-between items-center px-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    {query.status !== 'ready'
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
                filename='super-admin-employee-attendance'
                title='Employee Attendance'
                rows={filteredRecords.map((row) => ({
                    employee_id: row.employeeId,
                    employee_name: row.employeeName,
                    role: row.role,
                    date: row.date,
                    punch_in: row.punchInTime,
                    punch_out: row.punchOutTime,
                    status: row.status,
                }))}
                exportDescription={<>You are exporting {filteredRecords.length} record(s).</>}
            />
        </section>
    )
}

export default EmployeesList
