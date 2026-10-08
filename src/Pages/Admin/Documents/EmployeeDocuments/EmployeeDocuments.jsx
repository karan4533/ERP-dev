import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, Plus, Download } from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import DeleteRequestModal from '../../../../Common/CommonComponents/DeleteRequestModal'
import {
    documentStatusColor,
    getDocumentCellValue,
    getDocumentTypes,
    getEmployeeDocumentRecords,
    recordStatusBadgeColor,
    RECORD_STATUS_OPTIONS,
} from './employeeDocumentsData'

const EmployeeDocuments = () => {
    const location = useLocation()
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [records, setRecords] = useState(() => getEmployeeDocumentRecords())
    const [documentTypes, setDocumentTypes] = useState(() => getDocumentTypes())
    const [exportModal, setExportModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    const refreshData = () => {
        setRecords(getEmployeeDocumentRecords())
        setDocumentTypes(getDocumentTypes())
    }

    useEffect(() => {
        refreshData()
    }, [location.key])

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase()
        return records.filter((record) => {
            if (statusFilter && record.status !== statusFilter) return false
            if (!query) return true
            const haystack = `${record.employeeId} ${record.employeeName}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [records, search, statusFilter])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setStatusFilter('')
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
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
                            placeholder='Employee ID or name'
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
                    <div>
                        <h2 className='text-xl font-medium text-black'>Employee Document List</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Document columns are added automatically when you save new document labels.
                        </p>
                    </div>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to='/admin/documents/add-employee-documents'
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
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
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
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>
                                    Employee ID
                                </th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>
                                    Employee Name
                                </th>
                                {documentTypes.map((type) => (
                                    <th
                                        key={type.id}
                                        className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
                                    >
                                        {type.label}
                                    </th>
                                ))}
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>
                                    Submitted Date
                                </th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={documentTypes.length + 5}
                                        className='px-2 py-10 text-center text-[#667085]'
                                    >
                                        No employee documents found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr
                                        key={record.id}
                                        className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'
                                    >
                                        <td className='px-2 py-4 rounded-s-lg font-medium text-[#1E1E1E]'>
                                            {record.employeeId}
                                        </td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{record.employeeName}</td>
                                        {documentTypes.map((type) => {
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
                                                <button
                                                    type='button'
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </button>
                                                <NavLink
                                                    to={`/admin/documents/edit-employee-documents/${record.id}`}
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

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button
                        type='button'
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        type='button'
                        className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'
                    >
                        1
                    </button>
                    <button
                        type='button'
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default EmployeeDocuments
