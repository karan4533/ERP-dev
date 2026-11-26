import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, Radio, ShieldCheck, X, CheckCircle2, Save, Edit3 } from 'lucide-react'
import { toast } from 'react-toastify'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    ATTENDANCE_LIST,
    ATTENDANCE_STATUSES,
    CLASSES,
    SECTIONS,
    statusBadgeColor,
    inOutStatusBadgeColor,
} from './attendanceData'

const CLASS_ATTENDANCE_STORAGE_KEY = 'schoolerp-class-attendance-records'

const ClassAttendance = () => {
    const [records, setRecords] = useState(() => {
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(CLASS_ATTENDANCE_STORAGE_KEY)
                if (stored) {
                    const parsed = JSON.parse(stored)
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed
                }
            }
        } catch {
            /* ignore */
        }
        return ATTENDANCE_LIST
    })
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [entriesPerPage, setEntriesPerPage] = useState(10)
    const [isManualMode, setIsManualMode] = useState(false)

    // Save class attendance to localStorage
    const handleSaveClassAttendance = () => {
        try {
            localStorage.setItem(CLASS_ATTENDANCE_STORAGE_KEY, JSON.stringify(records))
            window.dispatchEvent(new Event('schoolerp-student-attendance-sync'))
            toast.success('Class attendance records saved successfully!')
        } catch (err) {
            toast.error('Failed to save attendance records.')
        }
    }

    // Mark all filtered students as present
    const handleMarkAllPresent = () => {
        setRecords((prev) =>
            prev.map((r) => {
                const matchesClass = !classFilter || r.className === classFilter
                const matchesSection = !sectionFilter || r.section === sectionFilter
                if (matchesClass && matchesSection) {
                    return {
                        ...r,
                        attendanceStatus: 'Present',
                        inOutStatus: 'On Time',
                        time: r.time && r.time !== '—' ? r.time : '08:00 AM',
                        isOverridden: true,
                        overrideNote: 'Marked Present via Manual Roster',
                        overriddenBy: 'Class Mentor',
                        overriddenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }
                }
                return r
            })
        )
        toast.info('All students marked as Present.')
    }

    // Quick status toggle for individual student in manual mode
    const handleQuickStatusChange = (recordId, newStatus) => {
        setRecords((prev) =>
            prev.map((r) =>
                r.id === recordId
                    ? {
                          ...r,
                          attendanceStatus: newStatus,
                          inOutStatus: newStatus === 'Present' ? 'On Time' : newStatus === 'Late Present' ? 'Late' : '—',
                          time: newStatus === 'Absent' ? '—' : r.time && r.time !== '—' ? r.time : '08:00 AM',
                          isOverridden: true,
                          overrideNote: `Status updated to ${newStatus}`,
                          overriddenBy: 'Class Mentor',
                          overriddenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      }
                    : r
            )
        )
    }

    // Class Mentor Attendance Override Modal State
    const [overrideDialog, setOverrideDialog] = useState({
        open: false,
        record: null,
        newStatus: 'Present',
        reason: '',
    })

    const handleOpenOverride = (record) => {
        setOverrideDialog({
            open: true,
            record,
            newStatus: record.attendanceStatus === 'Present' ? 'Late Present' : 'Present',
            reason: '',
        })
    }

    const handleSaveOverride = (e) => {
        e.preventDefault()
        if (!overrideDialog.reason.trim()) {
            toast.error('A mentor justification note is required to override biometric attendance.')
            return
        }

        setRecords((prev) =>
            prev.map((r) =>
                r.id === overrideDialog.record.id
                    ? {
                          ...r,
                          attendanceStatus: overrideDialog.newStatus,
                          inOutStatus: overrideDialog.newStatus === 'Present' ? 'In Time' : 'Late',
                          isOverridden: true,
                          overrideNote: overrideDialog.reason.trim(),
                          overriddenBy: 'Class Mentor (Mr. Anil Kumar)',
                          overriddenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      }
                    : r
            )
        )

        toast.success(`Biometric attendance overridden for ${overrideDialog.record.studentName}`)
        setOverrideDialog({ open: false, record: null, newStatus: 'Present', reason: '' })
    }

    const filteredRecords = records.filter((r) => {
        const matchesSearch =
            !searchTerm ||
            r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.studentId.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesClass = !classFilter || r.className === classFilter
        const matchesSection = !sectionFilter || r.section === sectionFilter
        const matchesStatus = !statusFilter || r.attendanceStatus === statusFilter
        return matchesSearch && matchesClass && matchesSection && matchesStatus
    })

    return (
        <section>
            {/* ESSL Biometric Server Live Sync Card */}
            <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 p-4 mb-5 shadow-xs'>
                <div className='flex items-center gap-3'>
                    <span className='relative flex h-3.5 w-3.5'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                        <span className='relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600'></span>
                    </span>
                    <div>
                        <div className='flex items-center gap-2'>
                            <p className='text-sm font-bold text-emerald-950'>
                                ESSL Biometric Ingestion Server: Active &amp; Synchronized
                            </p>
                            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800'>
                                <ShieldCheck size={13} />
                                eTimeTrackLive v14
                            </span>
                        </div>
                        <p className='text-xs text-emerald-700 mt-0.5'>
                            Device: ESSL SilkBio-101TC · Main Gate &amp; Academic Block · Auto-Sync: 08:35 AM · 1,248 Attendance Punches Logged
                        </p>
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setIsManualMode(!isManualMode)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            isManualMode
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white/90 text-emerald-900 border-emerald-300 hover:bg-white'
                        }`}
                    >
                        <Edit3 size={14} />
                        {isManualMode ? 'Mode: Manual Roster Marking' : 'Switch to Manual Marking'}
                    </button>
                    <span className='text-xs font-medium text-emerald-800 bg-white/80 border border-emerald-200 rounded-lg px-3 py-1.5'>
                        Class Mentor Biometric Override Authorized
                    </span>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearchTerm('')
                            setClassFilter('')
                            setSectionFilter('')
                            setStatusFilter('')
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder='Student ID, name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {CLASSES.map((item) => (
                                <option key={item} value={item}>Class {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SECTIONS.map((item) => (
                                <option key={item} value={item}>Section {item}</option>
                            ))}
                        </select>
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
                        <label className='text-base font-medium text-[#808080]'>Date</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
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
                    <div className='flex items-center gap-3'>
                        <h2 className='text-xl font-medium text-black'>Attendance List</h2>
                        {isManualMode && (
                            <span className='inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200'>
                                Manual Mode Active
                            </span>
                        )}
                    </div>
                    <div className='flex items-center gap-2'>
                        {isManualMode && (
                            <>
                                <button
                                    type='button'
                                    onClick={handleMarkAllPresent}
                                    className='flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs'
                                >
                                    <CheckCircle2 size={14} />
                                    Mark All Present
                                </button>
                                <button
                                    type='button'
                                    onClick={handleSaveClassAttendance}
                                    className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs'
                                >
                                    <Save size={14} />
                                    Save Class Attendance
                                </button>
                            </>
                        )}
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select
                        value={entriesPerPage}
                        onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                        className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'
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
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Student ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Attendance Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>In &amp; out Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Class Mentor Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.slice(0, entriesPerPage).map((record) => (
                                <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.studentId}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>
                                        {record.studentName}
                                        {record.isOverridden && (
                                            <span className='block text-[11px] font-semibold text-[#515DEF]' title={`Overridden at ${record.overriddenAt}: ${record.overrideNote}`}>
                                                ★ Mentor Override: {record.overrideNote}
                                            </span>
                                        )}
                                    </td>
                                    <td className='px-2 py-4'>{record.className}</td>
                                    <td className='px-2 py-4'>{record.section}</td>
                                    <td className='px-2 py-4'>{record.time}</td>
                                    <td className='px-2 py-4'>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.attendanceStatus]}`}>
                                            {record.attendanceStatus}
                                        </span>
                                    </td>
                                    <td className='px-2 py-4'>
                                        {record.inOutStatus === '—' ? (
                                            '—'
                                        ) : (
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${inOutStatusBadgeColor[record.inOutStatus]}`}>
                                                {record.inOutStatus}
                                            </span>
                                        )}
                                    </td>
                                    <td className='px-2 py-4 rounded-e-lg'>
                                        {isManualMode ? (
                                            <div className='flex items-center gap-1'>
                                                <button
                                                    type='button'
                                                    title='Mark Present'
                                                    onClick={() => handleQuickStatusChange(record.id, 'Present')}
                                                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                                                        record.attendanceStatus === 'Present'
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                    }`}
                                                >
                                                    P
                                                </button>
                                                <button
                                                    type='button'
                                                    title='Mark Late Present'
                                                    onClick={() => handleQuickStatusChange(record.id, 'Late Present')}
                                                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                                                        record.attendanceStatus === 'Late Present'
                                                            ? 'bg-amber-600 text-white'
                                                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                    }`}
                                                >
                                                    L
                                                </button>
                                                <button
                                                    type='button'
                                                    title='Mark Absent'
                                                    onClick={() => handleQuickStatusChange(record.id, 'Absent')}
                                                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                                                        record.attendanceStatus === 'Absent'
                                                            ? 'bg-rose-600 text-white'
                                                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    A
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type='button'
                                                onClick={() => handleOpenOverride(record)}
                                                className='inline-flex items-center rounded border border-[#515DEF] px-2.5 py-1 text-xs font-semibold text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                            >
                                                Override
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Class Mentor Attendance Override Modal */}
            {overrideDialog.open && (
                <div
                    className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'
                    role='dialog'
                    aria-modal='true'
                >
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
                        <div className='flex items-center justify-between border-b border-[var(--erp-line)] pb-3'>
                            <div>
                                <h3 className='text-lg font-bold text-[var(--erp-ink)]'>
                                    Class Mentor Attendance Override
                                </h3>
                                <p className='text-xs text-[var(--erp-muted)]'>
                                    {overrideDialog.record?.studentName} ({overrideDialog.record?.studentId})
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setOverrideDialog({ open: false, record: null, newStatus: 'Present', reason: '' })}
                                className='p-1 text-[var(--erp-muted)] hover:bg-[var(--erp-canvas)] rounded-lg'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveOverride} className='mt-4 space-y-4'>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>
                                    Current Biometric Status
                                </label>
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[overrideDialog.record?.attendanceStatus]}`}>
                                    {overrideDialog.record?.attendanceStatus}
                                </span>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>
                                    Override To Status *
                                </label>
                                <select
                                    value={overrideDialog.newStatus}
                                    onChange={(e) => setOverrideDialog((prev) => ({ ...prev, newStatus: e.target.value }))}
                                    className='w-full rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 py-2 text-sm text-[var(--erp-ink)] focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                                >
                                    <option value='Present'>Present</option>
                                    <option value='Late Present'>Late Present</option>
                                    <option value='Half Day'>Half Day</option>
                                    <option value='Absent'>Absent</option>
                                    <option value='Medical Leave'>Medical Leave / On Duty</option>
                                </select>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>
                                    Mentor Justification Note *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={overrideDialog.reason}
                                    onChange={(e) => setOverrideDialog((prev) => ({ ...prev, reason: e.target.value }))}
                                    placeholder='State reason for override (e.g., Biometric sensor failure, Inter-school competition on-duty)...'
                                    className='w-full rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 py-2 text-sm text-[var(--erp-ink)] focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 border-t border-[var(--erp-line)] pt-4'>
                                <button
                                    type='button'
                                    onClick={() => setOverrideDialog({ open: false, record: null, newStatus: 'Present', reason: '' })}
                                    className='rounded-lg border border-[var(--erp-line-strong)] px-4 py-2 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-lg bg-[#515DEF] px-5 py-2 text-sm font-semibold text-white hover:bg-[#434dbd]'
                                >
                                    Submit Override
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {exportModal && (
                <ExportModal
                    isOpen={exportModal}
                    onClose={() => setExportModal(false)}
                    data={filteredRecords}
                    filename='Attendance_List'
                />
            )}
        </section>
    )
}

export default ClassAttendance
