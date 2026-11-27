import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'react-toastify'
import { Calendar, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import TimeTableModal from '../../Principal/ExaminationTimetable/Components/TimeTableModal'
import DenyTimetableModal from '../Components/DenyTimetableModal'
import {
    APPROVAL_STATUSES,
    EXAM_TIMETABLE_APPROVALS,
    SUBMITTED_BY,
    approvalStatusColor,
} from '../timetableApprovalsData'
import { mapExamApiToTimetableRecord } from '../../Principal/ExaminationTimetable/examinationTimetableData'
import { canUseApprovalsApi, decideApprovalApi, listApprovalsInboxApi } from '../../../services/approvalsApi'
import { canUseExamsApi, getExamApi, listExamsApi, mapExamFromApi } from '../../../services/examsApi'

const formatDisplayDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-GB').replace(/\//g, '-')
}

/** Submission timestamp for Director list — never fall back to examination startDate. */
const formatSubmittedDateTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    const date = d.toLocaleDateString('en-GB').replace(/\//g, '-')
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return `${date} ${time}`
}

const formatClassLabel = (className, section) => {
    const cls = String(className || '').trim()
    const sec = String(section || '').trim()
    if (!cls && !sec) return '—'
    if (!sec) return cls
    return `${cls} · ${sec}`
}

const mapExamToApprovalRow = (exam) => {
    const status = String(exam.status || '').toLowerCase()
    let approvalStatus = 'Pending'
    if (status === 'approved') approvalStatus = 'Approved'
    else if (status === 'denied' || status === 'rejected') approvalStatus = 'Denied'
    else if (status === 'submitted') approvalStatus = 'Pending'
    else if (status === 'draft') approvalStatus = 'Pending'
    return {
        id: exam.id,
        examName: exam.name || 'Exam',
        className: exam.className || '',
        section: exam.section || '',
        classSection: formatClassLabel(exam.className, exam.section),
        startDate: formatDisplayDate(exam.startDate),
        endDate: formatDisplayDate(exam.endDate),
        submittedBy: SUBMITTED_BY,
        submittedDate: formatSubmittedDateTime(exam.submittedAt),
        approvalStatus,
        approvalId: exam.approvalId || null,
        rejectionReason: '',
        timelines: Array.isArray(exam.timelines) ? exam.timelines : [],
        source: 'api',
    }
}

const dayStart = (value) => {
    if (!value) return null
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const ExamApprovals = () => {
    const api = canUseExamsApi()
    const approvalsApi = canUseApprovalsApi()
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [viewRecord, setViewRecord] = useState(null)
    const [viewLoadingId, setViewLoadingId] = useState(null)
    const [denyModal, setDenyModal] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('Pending')
    const [approvals, setApprovals] = useState(() => (api ? [] : [...EXAM_TIMETABLE_APPROVALS]))
    const [loading, setLoading] = useState(api)
    const [loadError, setLoadError] = useState('')

    const refresh = async () => {
        if (!api) {
            setApprovals([...EXAM_TIMETABLE_APPROVALS])
            setLoadError('')
            setLoading(false)
            return
        }
        setLoading(true)
        setLoadError('')
        try {
            const [examRows, inboxRows] = await Promise.all([
                listExamsApi({}),
                approvalsApi ? listApprovalsInboxApi().catch(() => []) : Promise.resolve([]),
            ])

            const byId = new Map()
            ;(Array.isArray(examRows) ? examRows : [])
                .map(mapExamFromApi)
                .filter((exam) => exam.approvalId || String(exam.status).toLowerCase() !== 'draft')
                .map(mapExamToApprovalRow)
                .forEach((row) => byId.set(String(row.id), row))

            // Ensure every pending exam_timetable in Director inbox appears, even if list/exams lagged.
            const pendingInbox = (Array.isArray(inboxRows) ? inboxRows : []).filter(
                (row) => String(row.entityType || '').toLowerCase() === 'exam_timetable'
                    && String(row.status || '').toLowerCase() === 'pending',
            )
            await Promise.all(
                pendingInbox.map(async (row) => {
                    const examId = String(row.entityId || '')
                    if (!examId || byId.has(examId)) {
                        if (byId.has(examId)) {
                            byId.set(examId, {
                                ...byId.get(examId),
                                approvalId: row.id || byId.get(examId).approvalId,
                                approvalStatus: 'Pending',
                            })
                        }
                        return
                    }
                    try {
                        const exam = mapExamFromApi(await getExamApi(examId))
                        byId.set(examId, {
                            ...mapExamToApprovalRow(exam),
                            approvalId: row.id || exam.approvalId,
                            approvalStatus: 'Pending',
                        })
                    } catch {
                        byId.set(examId, {
                            id: examId,
                            examName: row.title || 'Exam timetable',
                            className: '',
                            section: '',
                            classSection: '—',
                            startDate: '—',
                            endDate: '—',
                            submittedBy: SUBMITTED_BY,
                            submittedDate: formatSubmittedDateTime(row.createdAt),
                            approvalStatus: 'Pending',
                            approvalId: row.id,
                            rejectionReason: '',
                            timelines: [],
                            source: 'api',
                        })
                    }
                }),
            )

            const merged = [...byId.values()].sort((a, b) => {
                if (a.approvalStatus === 'Pending' && b.approvalStatus !== 'Pending') return -1
                if (b.approvalStatus === 'Pending' && a.approvalStatus !== 'Pending') return 1
                return String(b.submittedDate).localeCompare(String(a.submittedDate))
            })
            setApprovals(merged)
        } catch (error) {
            setApprovals([])
            const message = error?.message || 'Could not load exam timetable approvals.'
            setLoadError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, approvalsApi])

    const filteredApprovals = useMemo(() => {
        const query = search.trim().toLowerCase()
        const fromTs = dayStart(fromDate)
        const toTs = dayStart(toDate)
        return approvals.filter((item) => {
            const matchesStatus = !statusFilter || item.approvalStatus === statusFilter
            const matchesSearch = !query
                || String(item.id).toLowerCase().includes(query)
                || item.examName.toLowerCase().includes(query)
                || item.classSection.toLowerCase().includes(query)
            if (!matchesStatus || !matchesSearch) return false
            if (fromTs == null && toTs == null) return true
            const submittedTs = dayStart(
                item.submittedDate && item.submittedDate !== '—'
                    ? item.submittedDate.split(' ')[0].split('-').reverse().join('-')
                    : null,
            )
            if (submittedTs == null) return true
            if (fromTs != null && submittedTs < fromTs) return false
            if (toTs != null && submittedTs > toTs) return false
            return true
        })
    }, [approvals, search, statusFilter, fromDate, toDate])

    const openTimetable = async (entry) => {
        if (!entry) return
        // Prefer campus detail so timelines always match what Principal saved.
        if (api) {
            setViewLoadingId(entry.id)
            try {
                const exam = await getExamApi(entry.id)
                setViewRecord(mapExamApiToTimetableRecord(exam))
            } catch (error) {
                if (Array.isArray(entry.timelines) && entry.timelines.length) {
                    setViewRecord({
                        id: entry.id,
                        examName: entry.examName,
                        className: entry.className,
                        section: entry.section,
                        timelines: entry.timelines,
                    })
                } else {
                    toast.error(error?.message || 'Could not load exam timetable.')
                }
            } finally {
                setViewLoadingId(null)
            }
            return
        }
        setViewRecord({
            id: entry.id,
            examName: entry.examName,
            className: entry.className || entry.classSection,
            section: entry.section || '',
            timelines: entry.timelines || entry.modalTimelines || [],
            ...entry,
        })
    }

    const handleApprove = async (id) => {
        const entry = approvals.find((item) => item.id === id)
        if (api && entry?.approvalId) {
            try {
                await decideApprovalApi(entry.approvalId, { decision: 'approve' })
                setApprovals((prev) =>
                    prev.map((item) =>
                        item.id === id ? { ...item, approvalStatus: 'Approved', rejectionReason: '' } : item,
                    ),
                )
                toast.success('Exam timetable approved.')
            } catch (error) {
                toast.error(error?.message || 'Approve failed.')
            }
            return
        }
        setApprovals((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, approvalStatus: 'Approved', rejectionReason: '' }
                    : item,
            ),
        )
    }

    const openDenyModal = (entry) => {
        setSelectedEntry(entry)
        setDenyModal(true)
    }

    const handleDenyConfirm = async (reason) => {
        if (!selectedEntry) return
        if (api && selectedEntry.approvalId) {
            try {
                await decideApprovalApi(selectedEntry.approvalId, { decision: 'deny', comment: reason })
                setApprovals((prev) =>
                    prev.map((item) =>
                        item.id === selectedEntry.id
                            ? { ...item, approvalStatus: 'Denied', rejectionReason: reason }
                            : item,
                    ),
                )
                toast.success('Exam timetable denied.')
            } catch (error) {
                toast.error(error?.message || 'Deny failed.')
            }
            setDenyModal(false)
            setSelectedEntry(null)
            return
        }
        setApprovals((prev) =>
            prev.map((item) =>
                item.id === selectedEntry.id
                    ? { ...item, approvalStatus: 'Denied', rejectionReason: reason }
                    : item,
            ),
        )
        setDenyModal(false)
        setSelectedEntry(null)
    }

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('')
        setFromDate(null)
        setToDate(null)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <div className='flex flex-wrap gap-2'>
                        <button
                            type='button'
                            onClick={clearFilters}
                            className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                        >
                            Clear Filters
                        </button>
                        {api ? (
                            <button
                                type='button'
                                onClick={() => void refresh()}
                                className='bg-white text-[#515DEF] uppercase text-sm px-4 py-1.5 border border-[#515DEF] rounded-lg hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'
                            >
                                Refresh
                            </button>
                        ) : null}
                    </div>
                    <p className='text-sm text-[#667085]'>
                        Examination timetables submitted by the Principal for Director approval.
                        {api ? ' Live exam schedules. Drafts are hidden until Principal chooses Published/Submit.' : ''}
                    </p>
                </div>
                {loadError ? (
                    <p className='mt-3 text-sm text-[#980E0F] bg-[#980E0F10] border border-[#980E0F33] rounded-lg px-3 py-2'>
                        {loadError}
                    </p>
                ) : null}
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Exam ID, name, class...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Approval Status</label>
                        <select
                            id='status'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                        >
                            <option value=''>All</option>
                            {APPROVAL_STATUSES.map((status) => (
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
                    <h2 className='text-xl font-medium text-black'>Exam Timetable Approvals</h2>
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
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Exam ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Exam Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Approval Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>View Timetable</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>
                                        Loading exam approvals…
                                    </td>
                                </tr>
                            ) : filteredApprovals.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>
                                        {approvals.length === 0
                                            ? 'No submitted exam timetables yet. Principal must save with status Published (not Draft), then refresh this page.'
                                            : 'No rows match the current filters. Clear Filters or set Approval Status to All.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredApprovals.map((entry) => (
                                    <tr key={entry.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 rounded-s-lg font-medium text-[#1E1E1E]'>{entry.id}</td>
                                        <td className='px-2 py-4'>{entry.examName}</td>
                                        <td className='px-2 py-4'>{entry.classSection}</td>
                                        <td className='px-2 py-4'>{entry.startDate}</td>
                                        <td className='px-2 py-4'>{entry.endDate}</td>
                                        <td className='px-2 py-4'>{entry.submittedBy}</td>
                                        <td className='px-2 py-4'>{entry.submittedDate}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`inline-block text-sm font-medium border rounded-md px-2 py-1 whitespace-nowrap ${approvalStatusColor[entry.approvalStatus]}`}>
                                                {entry.approvalStatus}
                                            </span>
                                            {entry.approvalStatus === 'Denied' && entry.rejectionReason && (
                                                <p className='text-xs text-[#980E0F] mt-1 max-w-[200px]' title={entry.rejectionReason}>
                                                    {entry.rejectionReason}
                                                </p>
                                            )}
                                        </td>
                                        <td className='px-2 py-4'>
                                            <button
                                                type='button'
                                                disabled={viewLoadingId === entry.id}
                                                onClick={() => openTimetable(entry)}
                                                className='bg-[#515DEF] text-white text-sm px-2 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2 disabled:opacity-60'
                                            >
                                                <Eye size={16} />
                                                {viewLoadingId === entry.id ? 'Loading…' : 'View Timetable'}
                                            </button>
                                        </td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            {entry.approvalStatus === 'Pending' ? (
                                                <div className='flex flex-wrap gap-2'>
                                                    <button
                                                        type='button'
                                                        onClick={() => handleApprove(entry.id)}
                                                        className='bg-[#4CAF50] text-white text-xs px-3 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer'
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() => openDenyModal(entry)}
                                                        className='bg-[#980E0F] text-white text-xs px-3 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer'
                                                    >
                                                        Deny
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className='text-xs text-[#808080]'>—</span>
                                            )}
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
                    Showing {filteredApprovals.length} of {approvals.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer'>
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
                filename='exam-timetable-approvals'
                rows={filteredApprovals.map((row) => ({
                    examId: row.id,
                    examName: row.examName,
                    classSection: row.classSection,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    approvalStatus: row.approvalStatus,
                }))}
                exportDescription={<>You are exporting {filteredApprovals.length} record(s).</>}
            />
            <TimeTableModal
                open={Boolean(viewRecord)}
                onClose={() => setViewRecord(null)}
                record={viewRecord}
            />
            <DenyTimetableModal
                open={denyModal}
                onClose={() => {
                    setDenyModal(false)
                    setSelectedEntry(null)
                }}
                onConfirm={handleDenyConfirm}
                title='Deny Exam Timetable'
                itemLabel={selectedEntry ? `${selectedEntry.examName} (${selectedEntry.id})` : ''}
            />
        </section>
    )
}

export default ExamApprovals
