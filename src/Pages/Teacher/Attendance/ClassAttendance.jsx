import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, Save } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { BiometricAttendancePage } from '../../../Common/demoDomain/DemoScreens'
import { listAttendanceApi, listMyAttendanceClassesApi, upsertAttendanceApi } from '../../../services/attendanceApi'
import { isApiAttendanceEnabled } from '../../../services/apiClient'
import {
    ATTENDANCE_LIST,
    ATTENDANCE_SESSIONS,
    ATTENDANCE_STATUSES,
    CLASSES,
    SECTIONS,
    statusBadgeColor,
} from './attendanceData'

const toIsoDate = (value) => {
    if (!value) return ''
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const ClassAttendance = ({ canOverrideBiometric = false }) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') === 'biometric' ? 'biometric' : 'manual'
    const api = isApiAttendanceEnabled()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [classFilter, setClassFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sessionFilter, setSessionFilter] = useState('FN')
    const [search, setSearch] = useState('')
    const [rows, setRows] = useState(() => (api ? [] : ATTENDANCE_LIST))
    // Status per student as last loaded from the server: only rows changed from it are saved, so
    // untouched biometric (auto) marks stay auto instead of becoming manual on every save.
    const [savedStatus, setSavedStatus] = useState({})
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [saveMessage, setSaveMessage] = useState('')
    const [dirty, setDirty] = useState(false)
    const [classOptions, setClassOptions] = useState(null)
    const [substituteDuties, setSubstituteDuties] = useState([])
    const [optionsError, setOptionsError] = useState('')
    const optionsDate = toIsoDate(selectedDate)

    useEffect(() => {
        if (!api) return undefined
        let cancelled = false
        listMyAttendanceClassesApi(optionsDate || undefined)
            .then((data) => {
                if (!cancelled) {
                    setClassOptions(data.classes)
                    setSubstituteDuties(data.substituteDuties)
                    setOptionsError('')
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setClassOptions([])
                    setSubstituteDuties([])
                    setOptionsError(err.message || 'Could not load your classes')
                }
            })
        return () => {
            cancelled = true
        }
    }, [api, optionsDate])

    const classNames = useMemo(
        () => (api ? (classOptions || []).map((item) => item.className) : CLASSES),
        [api, classOptions],
    )
    const sectionNames = useMemo(() => {
        if (!api) return SECTIONS
        const list = classOptions || []
        const chosen = classFilter ? list.filter((item) => item.className === classFilter) : list
        return [...new Set(chosen.flatMap((item) => item.sections || []))].sort()
    }, [api, classOptions, classFilter])

    const canEdit = api && Boolean(classFilter)

    const applyLoaded = (data) => {
        const list = Array.isArray(data) ? data : []
        setRows(list)
        setSavedStatus(Object.fromEntries(list.map((row) => [String(row.studentId), row.attendanceStatus || ''])))
        setDirty(false)
    }

    const reload = () => {
        if (!api) {
            setRows(ATTENDANCE_LIST)
            setLoading(false)
            setError('')
            return Promise.resolve()
        }
        setLoading(true)
        setError('')
        const date = toIsoDate(selectedDate)
        return listAttendanceApi({
            date,
            className: classFilter || undefined,
            section: sectionFilter || undefined,
            session: sessionFilter || 'FN',
            roster: Boolean(classFilter),
        })
            .then(applyLoaded)
            .catch((err) => {
                setError(err.message || 'Failed to load attendance')
                setRows([])
            })
            .finally(() => {
                setLoading(false)
            })
    }

    useEffect(() => {
        let cancelled = false
        setSaveMessage('')
        if (!api) {
            setRows(ATTENDANCE_LIST)
            return undefined
        }
        setLoading(true)
        setError('')
        const date = toIsoDate(selectedDate)
        listAttendanceApi({
            date,
            className: classFilter || undefined,
            section: sectionFilter || undefined,
            session: sessionFilter || 'FN',
            roster: Boolean(classFilter),
        })
            .then((data) => {
                if (cancelled) return
                const list = Array.isArray(data) ? data : []
                setRows(list)
                setSavedStatus(Object.fromEntries(list.map((row) => [String(row.studentId), row.attendanceStatus || ''])))
                setDirty(false)
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message || 'Failed to load attendance')
                    setRows([])
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [api, selectedDate, classFilter, sectionFilter, sessionFilter])

    const displayRows = useMemo(() => {
        const query = search.trim().toLowerCase()
        return rows.filter((record) => {
            if (statusFilter && record.attendanceStatus !== statusFilter) return false
            if (!query) return true
            const haystack = `${record.admissionNumber || ''} ${record.studentId || ''} ${record.studentName || ''}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [rows, search, statusFilter])

    const updateRowStatus = (studentId, attendanceStatus) => {
        setRows((current) =>
            current.map((row) =>
                String(row.studentId) === String(studentId) ? { ...row, attendanceStatus } : row,
            ),
        )
        setDirty(true)
        setSaveMessage('')
    }

    const markAll = (attendanceStatus) => {
        setRows((current) => current.map((row) => ({ ...row, attendanceStatus })))
        setDirty(true)
        setSaveMessage('')
    }

    const handleSave = async () => {
        if (!canEdit || saving) return
        const marks = rows
            .filter((row) => row.studentId && row.attendanceStatus)
            .filter((row) => row.attendanceStatus !== savedStatus[String(row.studentId)])
            .map((row) => ({
                studentId: row.studentId,
                status: row.attendanceStatus,
                inOutStatus: row.inOutStatus && row.inOutStatus !== '—' ? row.inOutStatus : undefined,
            }))
        if (marks.length === 0) {
            setSaveMessage('No changes to save. Set Present/Absent for at least one student first.')
            return
        }
        setSaving(true)
        setError('')
        setSaveMessage('')
        try {
            await upsertAttendanceApi({
                date: toIsoDate(selectedDate),
                className: classFilter,
                section: sectionFilter || undefined,
                session: sessionFilter || 'FN',
                marks: marks.map((mark) => ({ ...mark, session: sessionFilter || 'FN' })),
            })
            const half = sessionFilter === 'AN' ? 'afternoon' : 'morning'
            setSaveMessage(`Saved ${half} attendance for ${marks.length} student(s).`)
            await reload()
        } catch (err) {
            setError(err.message || 'Failed to save attendance')
        } finally {
            setSaving(false)
        }
    }

    const clearFilters = () => {
        setClassFilter('')
        setSectionFilter('')
        setStatusFilter('')
        setSessionFilter('FN')
        setSearch('')
        setSelectedDate(new Date())
        setSaveMessage('')
    }

    const sessionMeta = ATTENDANCE_SESSIONS.find((item) => item.id === sessionFilter) || ATTENDANCE_SESSIONS[0]

    const setTab = (tab) => {
        const next = new URLSearchParams(searchParams)
        if (tab === 'manual') next.delete('tab')
        else next.set('tab', tab)
        setSearchParams(next, { replace: true })
    }

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-2 inline-flex gap-1'>
                <button
                    type='button'
                    onClick={() => setTab('manual')}
                    className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${activeTab === 'manual' ? 'bg-[#515DEF] text-white' : 'text-[#667085] hover:bg-[#F5F6FB]'}`}
                >
                    Manual Attendance
                </button>
                <button
                    type='button'
                    onClick={() => setTab('biometric')}
                    className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${activeTab === 'biometric' ? 'bg-[#515DEF] text-white' : 'text-[#667085] hover:bg-[#F5F6FB]'}`}
                >
                    Biometric (ESSL)
                </button>
            </div>

            {activeTab === 'biometric' ? (
                <BiometricAttendancePage canOverride={canOverrideBiometric} />
            ) : (
            <>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    {api && (
                        <div className='text-sm text-[#667085]'>
                            <p>
                                Mark attendance twice a day — <strong>Morning (FN)</strong> and <strong>Afternoon (AN)</strong>.
                                Missing one half counts as <strong>Half Day</strong> leave.
                            </p>
                            <p>
                                Marks tagged <strong>biometric</strong> came from the attendance device sync. A mark you save
                                replaces it for that half, and later syncs keep your mark.
                            </p>
                            {substituteDuties.map((duty) => (
                                <p key={duty.id} className='text-[#515DEF]'>
                                    Substitute duty: {duty.className}-{duty.section}, {duty.period} ({duty.startTime}–{duty.endTime}) — available only during this period.
                                </p>
                            ))}
                        </div>
                    )}
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='session-filter' className='text-base font-medium text-[#808080]'>Session</label>
                        <select
                            id='session-filter'
                            value={sessionFilter}
                            onChange={(e) => setSessionFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            {ATTENDANCE_SESSIONS.map((item) => (
                                <option key={item.id} value={item.id}>{item.label}</option>
                            ))}
                        </select>
                        <p className='text-xs text-[#808080]'>{sessionMeta.hint}</p>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Student ID, name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={classFilter}
                            onChange={(e) => {
                                setClassFilter(e.target.value)
                                setSectionFilter('')
                            }}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {classNames.map((item) => (
                                <option key={item} value={item}>{api ? item : `Class ${item}`}</option>
                            ))}
                        </select>
                        {api && classOptions && classOptions.length === 0 && (
                            <p className='text-xs text-[#B42318]'>
                                {optionsError || 'No classes are assigned to you for Manual Attendance. Ask Principal to complete Teacher Allocation (or a live Substitute Duty) for the current academic year.'}
                            </p>
                        )}
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
                            {sectionNames.map((item) => (
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
                    <div>
                        <h2 className='text-xl font-medium text-black'>
                            Attendance List — {sessionMeta.label}
                        </h2>
                        {saveMessage && <p className='text-sm text-[#027A48] mt-1'>{saveMessage}</p>}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        {canEdit && (
                            <>
                                <button
                                    type='button'
                                    onClick={() => markAll('Present')}
                                    className='bg-white text-[#4CAF50] text-sm px-3 py-2 rounded-md border border-[#4CAF50] hover:opacity-90 cursor-pointer'
                                >
                                    Mark all Present
                                </button>
                                <button
                                    type='button'
                                    onClick={() => markAll('Absent')}
                                    className='bg-white text-[#B42318] text-sm px-3 py-2 rounded-md border border-[#B42318] hover:opacity-90 cursor-pointer'
                                >
                                    Mark all Absent
                                </button>
                                <button
                                    type='button'
                                    disabled={saving || !dirty}
                                    onClick={handleSave}
                                    className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2 disabled:opacity-60'
                                >
                                    <Save size={16} />
                                    {saving ? 'Saving…' : 'Save attendance'}
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
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Student ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Session mark</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Day status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>FN</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>AN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={8} className='px-2 py-10 text-center text-[#667085]'>Loading attendance…</td>
                                </tr>
                            )}
                            {!loading && error && (
                                <tr>
                                    <td colSpan={8} className='px-2 py-10 text-center text-red-500'>{error}</td>
                                </tr>
                            )}
                            {!loading && !error && displayRows.length === 0 && (
                                <tr>
                                    <td colSpan={8} className='px-2 py-10 text-center text-[#667085]'>
                                        {api && !classFilter
                                            ? 'Select a class to load the roster and mark attendance.'
                                            : 'No attendance marks for this date.'}
                                    </td>
                                </tr>
                            )}
                            {!loading && !error && displayRows.map((record) => (
                                <tr key={`${record.studentId}-${record.session || sessionFilter}`} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.admissionNumber || record.studentId}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.studentName}</td>
                                    <td className='px-2 py-4'>{record.className}</td>
                                    <td className='px-2 py-4'>{record.section || '—'}</td>
                                    <td className='px-2 py-4'>
                                        {canEdit ? (
                                            <select
                                                value={record.attendanceStatus || ''}
                                                onChange={(e) => updateRowStatus(record.studentId, e.target.value)}
                                                className='text-sm border border-[#D9D9D9] rounded-md px-2 py-1.5 bg-white'
                                            >
                                                <option value=''>Unset</option>
                                                {ATTENDANCE_STATUSES.map((status) => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        ) : record.attendanceStatus ? (
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.attendanceStatus] || ''}`}>
                                                {record.attendanceStatus}
                                            </span>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className='px-2 py-4'>
                                        {record.dayStatus ? (
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.dayStatus] || ''}`}>
                                                {record.dayStatus}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className='px-2 py-4 text-xs'>
                                        {record.fn?.status || '—'}
                                        {record.fn?.source === 'auto' ? ' · biometric' : ''}
                                        {record.fn?.checkInTime ? ` · in ${record.fn.checkInTime}` : ''}
                                        {record.fn?.checkOutTime ? ` · out ${record.fn.checkOutTime}` : ''}
                                    </td>
                                    <td className='px-2 py-4 text-xs rounded-e-lg'>
                                        {record.an?.status || '—'}
                                        {record.an?.source === 'auto' ? ' · biometric' : ''}
                                        {record.an?.checkInTime ? ` · in ${record.an.checkInTime}` : ''}
                                        {record.an?.checkOutTime ? ` · out ${record.an.checkOutTime}` : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    {displayRows.length === 0
                        ? 'Showing 0 entries'
                        : `Showing 1 to ${displayRows.length} of ${displayRows.length} entries`}
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
                filename='class-attendance'
                rows={displayRows.map((r) => ({
                    studentId: r.admissionNumber || r.studentId,
                    studentName: r.studentName,
                    className: r.className,
                    section: r.section || '',
                    session: r.session || sessionFilter,
                    attendanceStatus: r.attendanceStatus || '',
                    dayStatus: r.dayStatus || '',
                    fn: r.fn?.status || '',
                    an: r.an?.status || '',
                }))}
                exportDescription={<>You are exporting {displayRows.length} record{displayRows.length === 1 ? '' : 's'}.</>}
            />
            </>
            )}
        </section>
    )
}

export default ClassAttendance
