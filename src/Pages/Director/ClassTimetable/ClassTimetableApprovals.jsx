import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'react-toastify'
import { Calendar, ChevronRight, Download, Eye } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import ClassTimeTableModal from '../../Principal/ClassTimetable/Components/ClassTimeTableModal'
import DenyTimetableModal from '../Components/DenyTimetableModal'
import { APPROVAL_STATUSES } from '../timetableApprovalsData'
import {
    CLASS_TIMETABLES_UPDATED_EVENT,
    approvalStatusColor,
    decideClassTimetableApproval,
    getClassSectionLabel,
    getClassTimetables,
    hydrateClassTimetablesFromApi,
} from '../../Principal/ClassTimetable/classTimetableData'

// Submitted dates are saved as DD-MM-YYYY; API rows may carry ISO dates.
const parseSubmittedDate = (value) => {
    const text = String(value || '').trim()
    const dmy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    return null
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const mapRecordToApprovalRow = (record) => ({
    id: record.id,
    classSection: getClassSectionLabel(record),
    academicYear: record.academicYear || '—',
    submittedBy: [record.ownerTeacherName, record.createdByRole].filter(Boolean).join(' · ') || '—',
    submittedDate: record.submittedDate || '—',
    approvalStatus: record.approvalStatus || 'Pending',
    rejectionReason: record.rejectionReason || '',
    record,
})

const ClassTimetableApprovals = () => {
    const navigate = useNavigate()
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [denyModal, setDenyModal] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [approvals, setApprovals] = useState([])
    const [loading, setLoading] = useState(true)

    const refresh = () => {
        setApprovals(getClassTimetables().map(mapRecordToApprovalRow))
    }

    useEffect(() => {
        setLoading(true)
        hydrateClassTimetablesFromApi()
            .finally(() => {
                refresh()
                setLoading(false)
            })
        window.addEventListener(CLASS_TIMETABLES_UPDATED_EVENT, refresh)
        return () => window.removeEventListener(CLASS_TIMETABLES_UPDATED_EVENT, refresh)
    }, [])

    const filteredApprovals = useMemo(() => {
        const query = search.trim().toLowerCase()
        const from = fromDate ? startOfDay(fromDate) : null
        const to = toDate ? startOfDay(toDate) : null
        return approvals.filter((item) => {
            const matchesStatus = !statusFilter || item.approvalStatus === statusFilter
            const matchesSearch = !query
                || item.id.toLowerCase().includes(query)
                || item.classSection.toLowerCase().includes(query)
                || String(item.submittedBy).toLowerCase().includes(query)
            if (!matchesStatus || !matchesSearch) return false
            if (!from && !to) return true
            const submitted = parseSubmittedDate(item.submittedDate)
            if (!submitted) return false
            return (!from || submitted >= from) && (!to || submitted <= to)
        })
    }, [approvals, search, statusFilter, fromDate, toDate])

    const handleApprove = async (id) => {
        const result = await decideClassTimetableApproval(id, 'Approved', 'Director')
        if (!result.success) {
            toast.error((result.errors && result.errors[0]) || 'Could not approve this timetable.')
            refresh()
            return
        }
        refresh()
        toast.success('Class timetable approved.')
    }

    const openDenyModal = (entry) => {
        setSelectedEntry(entry)
        setDenyModal(true)
    }

    const handleDenyConfirm = async (reason) => {
        if (!selectedEntry) return
        const result = await decideClassTimetableApproval(selectedEntry.id, 'Denied', 'Director', reason)
        if (!result.success) {
            toast.error((result.errors && result.errors[0]) || 'Could not deny this timetable.')
        } else {
            toast.success('Class timetable denied.')
            refresh()
        }
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
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4 mb-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <p className='text-sm text-[#667085]'>
                        Principal or Director can approve, deny, or edit class timetables. Edits return the timetable to Pending.
                    </p>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Timetable ID, class...'
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
                        <label className='text-base font-medium text-[#808080]'>Submitted from</label>
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
                        <label className='text-base font-medium text-[#808080]'>Submitted to</label>
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
                    <h2 className='text-xl font-medium text-black'>Class Timetable Approvals</h2>
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
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Timetable ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Academic Year</th>
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
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        Loading class timetables…
                                    </td>
                                </tr>
                            ) : filteredApprovals.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        No class timetable approvals found.
                                    </td>
                                </tr>
                            ) : (
                                filteredApprovals.map((entry) => (
                                    <tr key={entry.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg font-medium text-[#1E1E1E]'>{entry.id}</td>
                                        <td className='px-2 py-4'>{entry.classSection}</td>
                                        <td className='px-2 py-4'>{entry.academicYear}</td>
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
                                                onClick={() => setSelectedRecord(entry.record)}
                                                className='bg-[#515DEF] text-white text-sm px-2 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                                            >
                                                <Eye size={16} />
                                                View Timetable
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
                                                    <button
                                                        type='button'
                                                        onClick={() => navigate(`/director/edit-class-timetable/${entry.id}`)}
                                                        className='bg-[#515DEF] text-white text-xs px-3 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer'
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type='button'
                                                    onClick={() => navigate(`/director/edit-class-timetable/${entry.id}`)}
                                                    className='bg-[#515DEF] text-white text-xs px-3 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer'
                                                >
                                                    Edit
                                                </button>
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
                <div className='flex justify-center gap-x-2'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='class-timetable-approvals'
                rows={filteredApprovals.map((r) => ({
                    id: r.id,
                    classSection: r.classSection,
                    academicYear: r.academicYear,
                    approvalStatus: r.approvalStatus,
                }))}
            />
            <ClassTimeTableModal
                open={Boolean(selectedRecord)}
                onClose={() => setSelectedRecord(null)}
                record={selectedRecord}
            />
            <DenyTimetableModal
                open={denyModal}
                onClose={() => {
                    setDenyModal(false)
                    setSelectedEntry(null)
                }}
                onConfirm={handleDenyConfirm}
                title='Deny Class Timetable'
                itemLabel={selectedEntry ? `${selectedEntry.classSection} (${selectedEntry.id})` : ''}
            />
        </section>
    )
}

export default ClassTimetableApprovals
