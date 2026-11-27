import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, EllipsisIcon, Plus, Download } from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import ListPagination, { PageSizeSelect } from '../../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../../Common/useListPagination'
import { emptyListMessage } from '../../../../Common/listPagination'
import { filterListRows } from '../../../../Common/listFiltering'
import DeleteRequestModal from '../../../../Common/CommonComponents/DeleteRequestModal'
import {
    documentStatusColor,
    getDocumentCellValue,
    recordStatusBadgeColor,
    RECORD_STATUS_OPTIONS,
    STUDENT_DOCUMENT_TYPES,
} from './studentDocumentsData'
import useDocumentRecords from '../useDocumentRecords'
import { ADMIN_STUDENT_DOCUMENT_PATHS } from '../documentRoutePaths'

const StudentDocuments = ({ paths = ADMIN_STUDENT_DOCUMENT_PATHS } = {}) => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const { records, status: loadStatus, error: loadError } = useDocumentRecords('students')
    const [exportModal, setExportModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase()
        return records.filter((record) => {
            if (statusFilter && record.status !== statusFilter) return false
            if (!query) return true
            const haystack = `${record.admissionNumber} ${record.studentName} ${record.className}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [records, search, statusFilter])
    const dateFilteredRecords = useMemo(
        () => filterListRows(filteredRecords, { fromDate, toDate, dateKeys: ['submittedDate'] }),
        [filteredRecords, fromDate, toDate],
    )
    const pagination = useListPagination(dateFilteredRecords, {
        resetKey: [search, statusFilter, fromDate?.getTime(), toDate?.getTime()].join('|'),
    })

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setStatusFilter('')
                            setFromDate(null)
                            setToDate(null)
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>
                            Search
                        </label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Admission no. or name'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>
                            Status
                        </label>
                        <select
                            id='status'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {RECORD_STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
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
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
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
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Student Document List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to={paths.add}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add New Documents
                        </NavLink>
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
                <PageSizeSelect pagination={pagination} className='my-2' />
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>
                                    Admission Number
                                </th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                {STUDENT_DOCUMENT_TYPES.map((type) => (
                                    <th key={type.id} className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>
                                        {type.label}
                                    </th>
                                ))}
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dateFilteredRecords.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={STUDENT_DOCUMENT_TYPES.length + 6}
                                        className='px-2 py-10 text-center text-[#667085]'
                                    >
                                        {loadStatus === 'loading'
                                            ? 'Loading student documents…'
                                            : loadStatus === 'error'
                                              ? loadError
                                              : emptyListMessage(records.length)}
                                    </td>
                                </tr>
                            ) : (
                                pagination.rows.map((record) => (
                                    <tr
                                        key={record.id}
                                        className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'
                                    >
                                        <td className='px-2 py-4 rounded-s-lg font-medium text-[#1E1E1E]'>
                                            {record.admissionNumber}
                                        </td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{record.studentName}</td>
                                        <td className='px-2 py-4'>{record.className}</td>
                                        {STUDENT_DOCUMENT_TYPES.map((type) => {
                                            const cell = getDocumentCellValue(record, type.id)
                                            return (
                                                <td key={type.id} className='px-2 py-4'>
                                                    {cell.hasFile ? (
                                                        <span className={documentStatusColor[cell.status]}>
                                                            {cell.display}
                                                        </span>
                                                    ) : (
                                                        <span className='text-[#808080]'>{cell.display}</span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                        <td className='px-2 py-4 whitespace-nowrap'>{record.submittedDate}</td>
                                        <td className='px-2 py-4'>
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                                    recordStatusBadgeColor[record.status]
                                                }`}
                                            >
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown
                                                buttonContent={<EllipsisIcon size={16} className='text-black' />}
                                            >
                                                <NavLink
                                                    to={paths.view(record.id)}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
                                                <NavLink
                                                    to={paths.edit(record.id)}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Edit
                                                </NavLink>
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

            <ListPagination pagination={pagination} />

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='student-documents'
                rows={dateFilteredRecords}
                exportDescription={<>You are exporting {dateFilteredRecords.length} record(s).</>}
            />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default StudentDocuments
