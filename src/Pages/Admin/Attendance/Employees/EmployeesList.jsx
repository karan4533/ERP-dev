import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import ListPagination from '../../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../../Common/useListPagination'
import {
    EMPLOYEE_ATTENDANCE,
    filterEmployeeAttendance,
    ROLE_OPTIONS,
    STATUS_OPTIONS,
    statusBadgeColor,
} from './employeeAttendanceData'
import { canUseAdminAttendanceApi, loadEmployeeAttendance, toIsoDate } from '../../../../services/adminAttendanceApi'
import { useAttendanceQuery } from '../useAttendanceQuery'

const emptyFilters = { search: '', role: '', status: '' }
const noParams = {}

const EmployeesList = () => {
    const [filters, setFilters] = useState(emptyFilters)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)

    // API mode: HR attendance records (all dates) come from the server and are narrowed to the chosen
    // date here, because the server has no date filter. Local mode keeps the browser-only demo rows.
    const apiMode = canUseAdminAttendanceApi()
    const query = useAttendanceQuery(apiMode, loadEmployeeAttendance, noParams)
    const apiRecords = query.data?.records
    const selectedIso = selectedDate ? toIsoDate(selectedDate) : ''
    const roleOptions = apiMode ? (query.options?.roleOptions ?? []) : ROLE_OPTIONS
    const statusOptions = apiMode ? (query.options?.statusOptions ?? []) : STATUS_OPTIONS

    const filteredRecords = useMemo(() => {
        if (!apiMode) return filterEmployeeAttendance(EMPLOYEE_ATTENDANCE, filters)
        const onDate = (apiRecords ?? []).filter((record) => !selectedIso || record.date === selectedIso)
        return filterEmployeeAttendance(onDate, filters)
    }, [apiMode, apiRecords, selectedIso, filters])
    const totalOnServer = apiRecords?.length ?? 0
    const pagination = useListPagination(filteredRecords, {
        resetKey: [filters.search, filters.role, filters.status, selectedIso].join('|'),
    })

    const clearFilters = () => {
        setFilters(emptyFilters)
        setSelectedDate(new Date())
    }

    return (
        <section>
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

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Employee Attendance List</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                {apiMode && query.status === 'loading' ? (
                    <div role='status' className='py-16 text-center text-sm text-[#667085]'>Loading attendance…</div>
                ) : apiMode && query.status === 'error' ? (
                    <div role='alert' className='py-16 text-center'>
                        <h3 className='text-lg font-semibold text-[#B42318]'>Could not load attendance</h3>
                        <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>{query.error}</p>
                        <button
                            type='button'
                            onClick={query.reload}
                            className='mt-4 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer'
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                <>
                {apiMode && (query.data?.warnings ?? []).map((warning) => (
                    <p key={warning} role='status' className='text-xs text-[#B54708] mb-2'>{warning}</p>
                ))}
                {apiMode && filteredRecords.length === 0 ? (
                    <div className='py-16 text-center'>
                        <h3 className='text-lg font-semibold text-[#0C1E5B]'>No attendance records found</h3>
                        <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>
                            {totalOnServer === 0
                                ? 'No employee attendance has been recorded yet.'
                                : selectedIso
                                    ? `Nothing recorded for ${selectedIso}. The server holds ${totalOnServer} record${totalOnServer === 1 ? '' : 's'} on other dates; clear the date to see them.`
                                    : 'No records match the selected filters.'}
                        </p>
                        {selectedIso && totalOnServer > 0 && (
                            <button
                                type='button'
                                onClick={() => setSelectedDate(null)}
                                className='mt-4 border border-[#515DEF] text-[#515DEF] text-sm px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white cursor-pointer'
                            >
                                Show all dates
                            </button>
                        )}
                    </div>
                ) : (
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Employee ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee Role</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Punch In Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Out Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='px-2 py-8 text-center text-[#667085]'>No records match the filters.</td>
                                </tr>
                            ) : null}
                            {pagination.rows.map((record) => (
                                <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.employeeId}</td>
                                    <td className='px-2 py-4'>{record.employeeName}</td>
                                    <td className='px-2 py-4'>{record.role}</td>
                                    <td className='px-2 py-4'>{record.punchInTime}</td>
                                    <td className='px-2 py-4'>{record.punchOutTime}</td>
                                    <td className='px-2 py-4 rounded-e-lg'>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
                </>
                )}
            </div>

            {apiMode && query.status !== 'ready' ? null : <ListPagination pagination={pagination} showPageSize />}

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='employee-attendance'
                rows={filteredRecords.map((r) => ({
                    employeeId: r.employeeId || r.id,
                    employeeName: r.employeeName || r.name,
                    department: r.department,
                    status: r.status || r.attendanceStatus,
                }))}
                exportDescription={<>You are exporting {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'}.</>}
            />
        </section>
    )
}

export default EmployeesList
