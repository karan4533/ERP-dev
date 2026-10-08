import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    APPROVAL_STATUSES,
    approvalStatusColor,
    encodeContextKey,
    filterMarkSessions,
    formatClassLabel,
    getAllMarkSessions,
    getPendingApprovalCount,
    getSessionDisplayLabel,
} from '../../../Common/MarkEntryApproval/markEntryApprovalData'

const filterInputClass =
    'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

const MarkEntryApproval = () => {
    const location = useLocation()
    const [sessions, setSessions] = useState(() => getAllMarkSessions())
    const [search, setSearch] = useState('')
    const [approvalStatus, setApprovalStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)

    useEffect(() => {
        setSessions(getAllMarkSessions())
    }, [location.key])

    const pendingCount = useMemo(() => getPendingApprovalCount(), [sessions])

    const filteredSessions = useMemo(
        () => filterMarkSessions(sessions, { search, approvalStatus }),
        [sessions, search, approvalStatus],
    )

    const clearFilters = () => {
        setSearch('')
        setApprovalStatus('')
    }

    return (
        <section className='space-y-6'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>Mark Entry Approval</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Review marks submitted by Teachers and Coordinators before publishing to the student portal.
                </p>
            </div>

            {pendingCount > 0 ? (
                <button
                    type='button'
                    onClick={() => setApprovalStatus(approvalStatus === 'Pending' ? '' : 'Pending')}
                    className={`text-left w-full sm:w-auto rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                        approvalStatus === 'Pending'
                            ? 'border-[#515DEF] bg-[#515DEF08] ring-2 ring-[#515DEF]'
                            : 'border-[#E4E7EC] hover:border-[#515DEF] bg-white'
                    }`}
                >
                    <p className='text-sm font-medium text-[#808080]'>Pending approvals</p>
                    <p className='text-2xl font-bold text-[#0C1E5B] mt-1'>{pendingCount}</p>
                    <p className='text-xs text-[#515DEF] mt-1'>
                        {approvalStatus === 'Pending' ? 'Filter active — click to clear' : 'Click to filter pending submissions'}
                    </p>
                </button>
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Exam, class, subject, submitter...'
                            className={filterInputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='approval-status' className='text-base font-medium text-[#808080]'>Approval Status</label>
                        <select
                            id='approval-status'
                            value={approvalStatus}
                            onChange={(e) => setApprovalStatus(e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {APPROVAL_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Submitted Mark Entries</h2>
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
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Exam</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Term</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Students</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        No submitted mark entries match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session) => (
                                    <tr key={session.contextKey} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg font-medium text-[#1E1E1E]'>{session.exam}</td>
                                        <td className='px-2 py-4'>{formatClassLabel(session.className)} — {session.section}</td>
                                        <td className='px-2 py-4'>{session.subject}</td>
                                        <td className='px-2 py-4'>{session.term}</td>
                                        <td className='px-2 py-4'>{session.submittedByRole ?? '—'}</td>
                                        <td className='px-2 py-4'>{session.students?.length ?? 0}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${approvalStatusColor[session.approvalStatus] ?? 'bg-[#66708533] text-[#667085]'}`}>
                                                {session.approvalStatus ?? '—'}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/director/mark-entry-approval/review/${encodeContextKey(session.contextKey)}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    {session.approvalStatus === 'Pending' ? 'Review' : 'View'}
                                                </NavLink>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {filteredSessions.length} submission{filteredSessions.length !== 1 ? 's' : ''}
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default MarkEntryApproval
