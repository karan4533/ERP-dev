import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import {
    ALLOCATION_STATUSES,
    allocationStatusColor,
    emptyAllocationFilters,
    filterStudentAllocations,
    getAllocationDisplayClass,
    getAllocationDisplayRollNo,
    getAllocationDisplaySection,
    getAllocationProfileImage,
    getPendingApprovalCount,
    getStudentAllocationContext,
    getStudentAllocations,
} from './studentAllocationData'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import DeleteRequestModal from '../CommonComponents/DeleteRequestModal'

const filterInputClass =
    'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

const StudentAllocationList = ({
    mode,
    listPath: listPathProp,
    defaultStatusFilter = '',
}) => {
    const location = useLocation()
    const context = getStudentAllocationContext(location.pathname)
    const routePrefix = context.routePrefix
    const isApprover = mode ? mode === 'approver' : context.isApprover
    const listPath = listPathProp ?? context.listPath

    const [records, setRecords] = useState(() => getStudentAllocations())
    const [filters, setFilters] = useState({
        ...emptyAllocationFilters,
        status: defaultStatusFilter,
    })
    const [exportModal, setExportModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    const pendingApprovalCount = useMemo(() => getPendingApprovalCount(records), [records])

    const listRecords = useMemo(
        () =>
            isApprover
                ? records.filter((record) => record.allocationStatus !== 'Pending Allocation')
                : records,
        [records, isApprover],
    )

    const filteredRecords = useMemo(
        () => filterStudentAllocations(listRecords, filters),
        [listRecords, filters],
    )

    useEffect(() => {
        setRecords(getStudentAllocations())
    }, [location.key])

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }))
    }

    const clearFilters = () => {
        setFilters(emptyAllocationFilters)
    }

    const exportDescription = (
        <>
            You are exporting {String(filteredRecords.length).padStart(2, '0')} records
            {filters.status ? (
                <>
                    {' '}
                    <span className='text-[#515DEF]'>( Filtered: Status: {filters.status} )</span>
                </>
            ) : null}
        </>
    )

    const canAllocate = (record) =>
        !isApprover &&
        (record.allocationStatus === 'Pending Allocation' || record.allocationStatus === 'Rejected')

    const canReview = (record) =>
        isApprover && record.allocationStatus === 'Pending Approval'

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    {routePrefix === '/principal'
                        ? 'Pending students are allocated by the Principal. Choose a class and section to complete allocation.'
                        : isApprover
                          ? 'Review section allocations submitted by Teachers and Coordinators.'
                          : 'Assign enrolled students to a class section and submit for Principal approval.'}
                </p>
                {isApprover && pendingApprovalCount > 0 ? (
                    <button
                        type='button'
                        onClick={() => updateFilter('status', filters.status === 'Pending Approval' ? '' : 'Pending Approval')}
                        className={`mb-4 text-left w-full sm:w-auto rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                            filters.status === 'Pending Approval'
                                ? 'border-[#515DEF] bg-[#515DEF08] ring-2 ring-[#515DEF]'
                                : 'border-[#E4E7EC] hover:border-[#515DEF]'
                        }`}
                    >
                        <p className='text-sm font-medium text-[#808080]'>Pending approvals</p>
                        <p className='text-2xl font-bold text-[#0C1E5B] mt-1'>{pendingApprovalCount}</p>
                        <p className='text-xs text-[#515DEF] mt-1'>
                            {filters.status === 'Pending Approval' ? 'Filter active — click to clear' : 'Click to filter pending'}
                        </p>
                    </button>
                ) : null}
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className={`${filterInputClass} md:max-w-xs sm:max-w-full`}>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder='Student, roll no, admission no...'
                            className={filterInputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {ALLOCATION_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={filters.fromDate}
                                onChange={(date) => updateFilter('fromDate', date)}
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
                                selected={filters.toDate}
                                onChange={(date) => updateFilter('toDate', date)}
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
                    <h2 className='text-xl font-medium text-black'>
                        {isApprover ? 'Student Allocation Approval' : 'Student Allocation'}
                    </h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Profile</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Roll No</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission Number</th>
                                {isApprover ? (
                                    <>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted By</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted At</th>
                                    </>
                                ) : null}
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={isApprover ? 11 : 9} className='px-2 py-8 text-center text-[#667085]'>
                                        {records.length === 0 && !isApprover
                                            ? 'No enrolled students found. Enroll students from the Admission List first.'
                                            : isApprover && filters.status === 'Pending Approval'
                                              ? 'All caught up — no pending allocation approvals.'
                                              : 'No student records match the selected filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg'>
                                            <img
                                                src={getAllocationProfileImage(record)}
                                                alt=''
                                                className='w-9 h-9 object-cover mx-auto rounded-full'
                                            />
                                        </td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.studentName}</td>
                                        <td className='px-2 py-4'>{getAllocationDisplayRollNo(record)}</td>
                                        <td className='px-2 py-4'>{getAllocationDisplayClass(record)}</td>
                                        <td className='px-2 py-4'>{getAllocationDisplaySection(record)}</td>
                                        <td className='px-2 py-4'>{record.admissionNumber}</td>
                                        {isApprover ? (
                                            <>
                                                <td className='px-2 py-4 whitespace-nowrap'>
                                                    {record.submittedBy ? (
                                                        <>
                                                            <span className='block text-[#1E1E1E]'>{record.submittedBy}</span>
                                                            <span className='text-xs text-[#808080]'>{record.submittedByRole}</span>
                                                        </>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className='px-2 py-4 whitespace-nowrap'>{record.submittedAt || '—'}</td>
                                            </>
                                        ) : null}
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${allocationStatusColor[record.allocationStatus]}`}>
                                                {record.allocationStatus}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                {canAllocate(record) ? (
                                                    <NavLink
                                                        to={`${listPath}/allocate/${record.id}`}
                                                        className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        Allocate
                                                    </NavLink>
                                                ) : null}
                                                {canReview(record) ? (
                                                    <NavLink
                                                        to={`${listPath}/review/${record.id}`}
                                                        className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        Review
                                                    </NavLink>
                                                ) : null}
                                                {(isApprover && !canReview(record)) || (!isApprover && !canAllocate(record)) ? (
                                                    <NavLink
                                                        to={`${listPath}/${isApprover ? 'review' : 'allocate'}/${record.id}`}
                                                        className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        View
                                                    </NavLink>
                                                ) : null}
                                                <button
                                                    type='button'
                                                    onClick={() => setDeleteRequestModal(true)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Delete
                                                </button>
                                            </Dropdown>
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
                    Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} exportDescription={exportDescription} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default StudentAllocationList
