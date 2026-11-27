import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import ListPagination from '../../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../../Common/useListPagination'
import {
    CLASS_OPTIONS,
    filterStudentAttendance,
    SECTION_OPTIONS,
    statusBadgeColor,
    STUDENT_ATTENDANCE,
} from './studentAttendanceData'
import { canUseAdminAttendanceApi, loadStudentAttendance, toIsoDate } from '../../../../services/adminAttendanceApi'
import { runAttendanceSyncApi } from '../../../../services/attendanceApi'
import { useAttendanceQuery } from '../useAttendanceQuery'

const emptyFilters = { search: '', className: '', section: '' }

const StudentsList = () => {
    const [filters, setFilters] = useState(emptyFilters)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)

    // API mode: marks for the chosen date come from the attendance API (class / section filter on the
    // server). Local mode: the browser-only demo rows below, filtered exactly as before.
    const apiMode = canUseAdminAttendanceApi()
    const query = useAttendanceQuery(apiMode, loadStudentAttendance, {
        date: toIsoDate(selectedDate || new Date()),
        className: filters.className,
        section: filters.section,
    })
    const classOptions = apiMode ? (query.options?.classOptions ?? []) : CLASS_OPTIONS
    const sectionOptions = apiMode ? (query.options?.sectionOptions ?? []) : SECTION_OPTIONS
    const apiRecords = query.data?.records

    const filteredRecords = useMemo(
        () =>
            apiMode
                ? filterStudentAttendance(apiRecords ?? [], { search: filters.search })
                : filterStudentAttendance(STUDENT_ATTENDANCE, filters),
        [apiMode, apiRecords, filters],
    )
    const pagination = useListPagination(filteredRecords, {
        resetKey: [filters.search, filters.className, filters.section, selectedDate?.getTime()].join('|'),
    })
    const counts = useMemo(() => {
        const tally = {}
        filteredRecords.forEach((record) => {
            tally[record.status] = (tally[record.status] || 0) + 1
        })
        return tally
    }, [filteredRecords])

    const clearFilters = () => {
        setFilters(emptyFilters)
        setSelectedDate(new Date())
    }

    const [sync, setSync] = useState({ busy: false, error: '', message: '' })
    const runSync = async () => {
        if (sync.busy) return
        const date = toIsoDate(selectedDate || new Date())
        setSync({ busy: true, error: '', message: '' })
        try {
            const result = await runAttendanceSyncApi({ date })
            const s = result?.students || {}
            setSync({
                busy: false,
                error: '',
                message: `Biometric sync for ${date}: ${s.created || 0} new, ${s.updated || 0} updated, `
                    + `${s.manualKept || 0} manual marks kept, ${result?.skippedCount || 0} punches not matched.`,
            })
            query.reload()
        } catch (err) {
            setSync({ busy: false, error: err?.message || 'Could not run the biometric sync.', message: '' })
        }
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
                    {apiMode && (
                        <div className='flex flex-col items-end gap-y-1'>
                            <button
                                type='button'
                                onClick={runSync}
                                disabled={sync.busy}
                                className='bg-white text-[#515DEF] text-sm px-4 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                            >
                                {sync.busy ? 'Syncing…' : 'Run biometric sync for this date'}
                            </button>
                            {sync.message && <p role='status' className='text-xs text-[#027A48]'>{sync.message}</p>}
                            {sync.error && <p role='alert' className='text-xs text-[#B42318]'>{sync.error}</p>}
                        </div>
                    )}
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
                                onChange={setSelectedDate}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Student Attendance List</h2>
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
                {apiMode && (
                    <div className='mb-3 space-y-1'>
                        {(query.data?.warnings ?? []).map((warning) => (
                            <p key={warning} role='status' className='text-xs text-[#B54708]'>{warning}</p>
                        ))}
                        <p className='text-xs text-[#667085]'>
                            Marks saved by teachers, or filled from biometric punches by the sync (In / Out shows
                            &quot;Biometric&quot;), for the chosen date. A teacher&apos;s mark always wins over the sync.
                            The table shows when attendance was marked and its In / Out note.
                            {filters.className && !filters.section
                                ? ' Students nobody has marked yet are listed as "Not marked".'
                                : ' Choose a class without a section to also see students who are not marked yet.'}
                        </p>
                        <p className='text-xs font-medium text-[#0C1E5B]'>
                            {Object.keys(counts).length === 0
                                ? 'No students listed.'
                                : Object.entries(counts).map(([status, count]) => `${status}: ${count}`).join(' · ')}
                        </p>
                    </div>
                )}
                {apiMode && filteredRecords.length === 0 ? (
                    <div className='py-16 text-center'>
                        <h3 className='text-lg font-semibold text-[#0C1E5B]'>No attendance marked for this date</h3>
                        <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>
                            Nothing has been marked for {toIsoDate(selectedDate || new Date())}
                            {filters.className ? ` in ${filters.className}` : ''}. Try another date or class.
                        </p>
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
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{apiMode ? 'Marked At' : 'On Time'}</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{apiMode ? 'In / Out' : 'Out Time'}</th>
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
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.admissionNo}</td>
                                    <td className='px-2 py-4'>{record.studentName}</td>
                                    <td className='px-2 py-4'>{record.className}</td>
                                    <td className='px-2 py-4'>{record.section}</td>
                                    <td className='px-2 py-4'>{apiMode ? record.markedAt : record.onTime}</td>
                                    <td className='px-2 py-4'>{apiMode ? record.inOut : record.outTime}</td>
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
                filename='student-attendance'
                rows={filteredRecords.map((r) => ({
                    admissionNumber: r.admissionNumber || r.studentId,
                    studentName: r.studentName || r.name,
                    className: r.className,
                    section: r.section,
                    status: r.status || r.attendanceStatus,
                }))}
                exportDescription={<>You are exporting {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'}.</>}
            />
        </section>
    )
}

export default StudentsList
