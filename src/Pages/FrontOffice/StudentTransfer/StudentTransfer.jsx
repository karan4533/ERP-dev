import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download, EllipsisIcon, Plus } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import ListPagination from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import { filterListRows } from '../../../Common/listFiltering'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import {
    getStudentTransfers,
    hydrateStudentTransfersFromApi,
    mdStatusColor,
    statusBadgeColor,
} from './studentTransferData'
import { frontOfficeApiOn } from '../frontOfficeStore'

const StudentTransfer = () => {
    const location = useLocation()
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [rows, setRows] = useState([])
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        if (!frontOfficeApiOn()) {
            setRows([])
            setLoadError('Sign in with API mode to load student transfers from the server.')
            return undefined
        }
        let active = true
        hydrateStudentTransfersFromApi()
            .then((list) => {
                if (active) {
                    setRows(list)
                    setLoadError('')
                }
            })
            .catch((error) => {
                if (active) setLoadError(error?.message || 'Could not load transfers.')
            })
        return () => {
            active = false
        }
    }, [location.key])

    const statusOptions = useMemo(
        () => [...new Set(rows.map((row) => row.status || 'In Progress'))].sort(),
        [rows],
    )
    const filteredRows = useMemo(
        () => filterListRows(rows, {
            search,
            searchKeys: ['studentName', 'transferType', 'transferTo', 'className', 'reason', 'requestedOn', 'mdApprovalStatus', 'status'],
            fromDate,
            toDate,
            dateKeys: ['requestedOn', 'date'],
        }).filter((row) => !status || (row.status || 'In Progress') === status),
        [rows, search, status, fromDate, toDate],
    )
    const pagination = useListPagination(filteredRows, {
        resetKey: [search, status, fromDate?.getTime(), toDate?.getTime()].join('|'),
    })

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
    }

    return (
        <section>
            {loadError ? <p className='text-sm text-[#B42318] mb-3'>{loadError}</p> : null}
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input id='search' type='text' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Student, school, class, reason...' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select id='status' value={status} onChange={(e) => setStatus(e.target.value)} className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {statusOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={setToDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Student Transfer List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink to='/front-office/student-transfer/add' className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Plus size={16} />
                            Add New Transfer
                        </NavLink>
                        <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Transfer Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Transfer To</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Reason</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Requested On</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>MD Approval Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>
                                        {rows.length
                                            ? emptyListMessage(rows.length)
                                            : 'No transfer records yet. Use Add New Transfer to create one on the server.'}
                                    </td>
                                </tr>
                            ) : (
                                pagination.rows.map((row) => (
                                    <tr key={row.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 rounded-s-lg'>{row.studentName || '—'}</td>
                                        <td className='px-2 py-4'>{row.transferType || '—'}</td>
                                        <td className='px-2 py-4'>{row.transferTo || '—'}</td>
                                        <td className='px-2 py-4'>{row.className || '—'}</td>
                                        <td className='px-2 py-4'>{row.reason || '—'}</td>
                                        <td className='px-2 py-4'>{row.requestedOn || '—'}</td>
                                        <td className='px-2 py-4'>
                                            <span className={mdStatusColor[row.mdApprovalStatus] || mdStatusColor.Pending}>
                                                {row.mdApprovalStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[row.status] || statusBadgeColor['In Progress']}`}>
                                                {row.status || 'In Progress'}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button type='button' className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>View</button>
                                                <button type='button' onClick={() => setEditRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Edit</button>
                                                <button type='button' onClick={() => setDeleteRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Delete</button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ListPagination pagination={pagination} showPageSize />

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='student-transfers'
                rows={filteredRows.map((r) => ({
                    id: r.id || r.publicId,
                    studentName: r.studentName,
                    fromClass: r.fromClass || r.classSection,
                    toSchool: r.toSchool || r.transferTo,
                    status: r.status,
                    date: r.date || r.requestedOn,
                }))}
                exportDescription={<>You are exporting {filteredRows.length} record{filteredRows.length === 1 ? '' : 's'}.</>}
            />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default StudentTransfer
