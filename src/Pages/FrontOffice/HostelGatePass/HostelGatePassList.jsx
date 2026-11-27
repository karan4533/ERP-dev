import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download, EllipsisIcon, Plus } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import ListPagination, { PageSizeSelect } from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import { filterListRows } from '../../../Common/listFiltering'
import {
    FINAL_STATUSES,
    approvalStatusColor,
    deleteHostelGatePass,
    filterHostelGatePasses,
    finalStatusBadgeColor,
    formatOutTimeForDisplay,
    getHostelGatePasses,
    getHostelPrincipalApproval,
    hydrateHostelGatePassesFromApi,
} from './hostelGatePassData'
import { frontOfficeApiOn } from '../frontOfficeStore'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../context/AuthContext'

const HostelGatePassList = () => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const location = useLocation()
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [records, setRecords] = useState(() => (frontOfficeApiOn() ? [] : getHostelGatePasses()))

    useEffect(() => {
        if (!frontOfficeApiOn()) {
            setRecords(getHostelGatePasses())
            return undefined
        }
        let active = true
        hydrateHostelGatePassesFromApi()
            .then((rows) => {
                if (active) setRecords(rows)
            })
            .catch(() => {
                if (active) setRecords([])
            })
        return () => {
            active = false
        }
    }, [location.key])

    const refresh = () => setRecords(getHostelGatePasses())

    const filteredRecords = useMemo(
        () => filterListRows(filterHostelGatePasses(records, { search, status }), {
            fromDate,
            toDate,
            dateKeys: ['outDate', 'returnDate'],
        }),
        [records, search, status, fromDate, toDate],
    )

    const pagination = useListPagination(filteredRecords, {
        resetKey: [search, status, fromDate?.getTime(), toDate?.getTime()].join('|'),
    })
    const visibleRecords = pagination.rows

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
    }

    const handleDelete = async (id) => {
        if (!showDelete) return
        try {
            await deleteHostelGatePass(id)
            refresh()
            toast.success('Hostel gate pass deleted.')
        } catch (error) {
            toast.error(error?.message || 'Could not delete hostel gate pass.')
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Student, gate pass ID, hostel...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {FINAL_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={setFromDate}
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
                                onChange={setToDate}
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
                    <h2 className='text-xl font-medium text-black'>Hostel Gate Pass List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to='/front-office/add-hostel-gate-pass'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add Hostel Gate Pass
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
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Profile</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gate Pass ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Hostel</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Leave Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Out Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Return Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Parent Approval</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Principal Approval</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className='px-2 py-8 text-center text-[#667085]'>
                                        {emptyListMessage(records.length)}
                                    </td>
                                </tr>
                            ) : (
                                visibleRecords.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 object-cover flex justify-center rounded-s-lg'>
                                            <img src={record.profile || mo_user} alt='' className='w-9 h-9 rounded-full object-cover' />
                                        </td>
                                        <td className='px-2 py-4'>{record.gatePassId}</td>
                                        <td className='px-2 py-4'>{record.studentId}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.studentName}</td>
                                        <td className='px-2 py-4'>{record.classSection}</td>
                                        <td className='px-2 py-4'>{record.hostel}</td>
                                        <td className='px-2 py-4'>{record.leaveType}</td>
                                        <td className='px-2 py-4'>
                                            {record.outDate} {formatOutTimeForDisplay(record.outTime)}
                                        </td>
                                        <td className='px-2 py-4'>
                                            {record.returnDate} {formatOutTimeForDisplay(record.returnTime)}
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className={`font-medium whitespace-nowrap ${approvalStatusColor[record.parentApproval] ?? ''}`}>
                                                {record.parentApproval}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className={`font-medium whitespace-nowrap ${approvalStatusColor[getHostelPrincipalApproval(record)] ?? ''}`}>
                                                {getHostelPrincipalApproval(record)}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${finalStatusBadgeColor[record.status] ?? finalStatusBadgeColor.Pending}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/front-office/hostel-gate-pass/view/${record.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
                                                <NavLink
                                                    to={`/front-office/hostel-gate-pass/edit/${record.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Edit
                                                </NavLink>
                                                {showDelete ? (
                                                    <button
                                                        type='button'
                                                        onClick={() => handleDelete(record.id)}
                                                        className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        Delete
                                                    </button>
                                                ) : null}
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
                filename='hostel-gate-passes'
                rows={filteredRecords.map((r) => ({
                    id: r.id || r.publicId,
                    studentName: r.studentName,
                    classSection: r.classSection,
                    hostel: r.hostel,
                    outDate: r.outDate,
                    status: r.status,
                }))}
                exportDescription={<>You are exporting {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'}.</>}
            />
        </section>
    )
}

export default HostelGatePassList
