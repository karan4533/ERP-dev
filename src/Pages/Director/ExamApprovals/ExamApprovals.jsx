import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import TimeTableModal from './Components/TimeTableModal'
import DenyTimetableModal from '../Components/DenyTimetableModal'
import {
    APPROVAL_STATUSES,
    EXAM_TIMETABLE_APPROVALS,
    approvalStatusColor,
} from '../timetableApprovalsData'

const ExamApprovals = () => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [timeTableModal, setTimeTableModal] = useState(false)
    const [denyModal, setDenyModal] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [approvals, setApprovals] = useState(() => [...EXAM_TIMETABLE_APPROVALS])

    const filteredApprovals = useMemo(() => {
        const query = search.trim().toLowerCase()
        return approvals.filter((item) => {
            const matchesStatus = !statusFilter || item.approvalStatus === statusFilter
            const matchesSearch = !query
                || item.id.toLowerCase().includes(query)
                || item.examName.toLowerCase().includes(query)
                || item.classSection.toLowerCase().includes(query)
            return matchesStatus && matchesSearch
        })
    }, [approvals, search, statusFilter])

    const handleApprove = (id) => {
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

    const handleDenyConfirm = (reason) => {
        if (!selectedEntry) return
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
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <p className='text-sm text-[#667085]'>
                        Examination timetables submitted by the Principal for Director approval.
                    </p>
                </div>
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
                            {filteredApprovals.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>
                                        No exam timetable approvals found.
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
                                                onClick={() => setTimeTableModal(true)}
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <TimeTableModal timeTableModal={timeTableModal} setTimeTableModal={setTimeTableModal} />
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
